import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from '../CustomTextInput/styles';
import { formatMoney, moneyToDraft, parseMoneyDraft } from './money';

export default function MoneyInput({
  value, onConfirm, registerEditor, onFinishEditing, required = false, emptyValue = 0,
  inputStyle, focusStyle, errorStyle, editable = true, accessibilityLabel, ...rest
}) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const draftRef = useRef(null);
  const dirty = useRef(false);
  const inputRef = useRef(null);
  const latest = useRef({ value, onConfirm, required, emptyValue });
  useLayoutEffect(() => {
    if (value !== latest.current.value && draftRef.current !== null && !dirty.current) {
      const text = moneyToDraft(value);
      draftRef.current = text;
      setDraft(text);
    }
    latest.current = { value, onConfirm, required, emptyValue };
  });

  const commit = useCallback(() => {
    if (draftRef.current === null || !dirty.current) return { ok: true, changed: false };
    const options = latest.current;
    const result = parseMoneyDraft(draftRef.current, options);
    const message = result.error || options.onConfirm(result.value);
    if (typeof message === 'string' && message) {
      setError(message);
      return { ok: false, changed: false };
    }
    // Limpar antes do blur evita confirmar duas vezes o mesmo texto.
    draftRef.current = null;
    dirty.current = false;
    setDraft(null);
    setError('');
    inputRef.current?.blur();
    return { ok: true, changed: true };
  }, []);

  useLayoutEffect(() => registerEditor?.(commit), [registerEditor, commit]);

  function focus() {
    setFocused(true);
    if (draftRef.current !== null) return;
    const text = moneyToDraft(latest.current.value);
    draftRef.current = text;
    dirty.current = false;
    setDraft(text);
  }

  function change(text) {
    // Não inserir máscara, deslocar seleção ou publicar valores parciais.
    draftRef.current = text;
    dirty.current = true;
    setDraft(text);
    setError('');
  }

  function finish() {
    setFocused(false);
    if (!dirty.current) {
      draftRef.current = null;
      setDraft(null);
      return;
    }
    if (onFinishEditing) onFinishEditing();
    else commit();
  }

  return (
    <View>
      <TextInput
        {...rest}
        ref={inputRef}
        accessibilityLabel={accessibilityLabel}
        value={draft === null ? formatMoney(value) : draft}
        onFocus={focus}
        onChangeText={change}
        onBlur={finish}
        onSubmitEditing={finish}
        selectTextOnFocus
        keyboardType="decimal-pad"
        returnKeyType="done"
        autoCorrect={false}
        spellCheck={false}
        autoCapitalize="none"
        accessibilityHint="Digite o valor em reais, com até duas casas decimais"
        editable={editable}
        style={[inputStyle || styles.input, focused && focusStyle]}
      />
      {error ? <Text accessibilityRole="alert" style={errorStyle || styles.errorText}>{error}</Text> : null}
    </View>
  );
}
