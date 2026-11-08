import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';
import { formatarValorMoedaParaTela, formatarValorRealParaTela, normalizarValorMoedaParaEntrada } from './currency';
import { formatarValorMetaParaEntrada } from '../../utils/metaMoney';

export default function CustomTextInput({
  placeholder,
  style,
  textValue,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholderTextColor,
  errorMessage,
  isValid,
  styleValidIcon,
  mask,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const displayValue = mask === 'currency'
    ? formatarValorMoedaParaTela(value)
    : mask === 'currencyReal'
      ? formatarValorRealParaTela(value)
      : mask === 'metaCurrency'
        ? formatarValorMetaParaEntrada(value)
        : value;
  function handleChangeText(text) {
    const nextText = mask === 'currency'
      ? normalizarValorMoedaParaEntrada(text)
      : mask === 'currencyReal'
        ? String(text).replace(/\D/g, '')
        : mask === 'metaCurrency'
          ? String(text).replace(/[^0-9.,]/g, '')
          : text;
    if (onChangeText) {
      onChangeText(nextText);
    }

    if (textValue) {
      textValue.current = nextText;
    }
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          {...rest}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || COLORS.dadoUm}
          style={[
            styles.input,
            focused && styles.inputFocused,
            errorMessage && styles.inputError,
            { color: COLORS.cadTextInputTexto },
          ]}
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {isValid ? <Text style={[styles.validIcon, styleValidIcon]}>✓</Text> : null}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}
