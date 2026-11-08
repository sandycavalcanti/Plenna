import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { formatarValorMetaEmEdicao, formatarValorMetaParaEntrada, normalizarValorMeta } from '../../../utils/metaMoney';
import { COLORS } from '../../../constants';
import CustomButton from '../../CustomButton';
import styles from './styles';

function initialForm(meta) {
  return {
    titulo: meta?.meta_titulo ?? '',
    descricao: meta?.meta_descricao ?? '',
    valor: formatarValorMetaParaEntrada(meta?.meta_valor),
  };
}

export default function MetaFormSheet({
  visible,
  mode = 'create',
  meta = null,
  onClose,
  onSubmit,
  onDelete,
  saving = false,
  deleting = false,
  error = null,
}) {
  const [form, setForm] = useState(() => initialForm(meta));
  const [validationError, setValidationError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setForm(initialForm(meta));
    setValidationError(null);
    setFocusedField(null);
  }, [meta?.meta_id, meta?.meta_titulo, meta?.meta_descricao, meta?.meta_valor, mode, visible]);

  async function submit() {
    if (saving || deleting) return;
    const titulo = String(form.titulo ?? '').trim();
    if (!titulo) {
      setValidationError('Informe um título para a meta.');
      return;
    }
    const normalized = normalizarValorMeta(form.valor);
    if (!normalized.value) {
      setValidationError(normalized.error || 'Informe um valor objetivo válido.');
      return;
    }

    setValidationError(null);
    try {
      await onSubmit?.({
        titulo,
        descricao: String(form.descricao ?? '').trim(),
        valor: normalized.value,
      });
    } catch {
      // O consumidor mantém o erro da API no próprio estado e decide se fecha o sheet.
    }
  }

  const disabled = saving || deleting;
  const formError = validationError || error;

  return (
    <Modal transparent visible={Boolean(visible)} animationType="slide" onRequestClose={() => { if (!disabled) onClose?.(); }}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.overlay} onPress={() => { if (!disabled) onClose?.(); }}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>{mode === 'edit' ? 'Ajuste seu objetivo' : 'Crie um objetivo para acompanhar'}</Text>
                </View>
                <CustomButton
                  accessibilityLabel="Fechar formulário da meta"
                  variant="ghost"
                  icon="close"
                  iconOnly
                  onPress={onClose}
                  disabled={disabled}
                  style={styles.closeButton}
                />
              </View>
              <Text style={styles.subtitle}>Preencha os dados e acompanhe seu avanço no cofrinho.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  accessibilityLabel="Título da meta"
                  value={form.titulo}
                  onChangeText={(titulo) => { setForm((current) => ({ ...current, titulo })); setValidationError(null); }}
                  onFocus={() => setFocusedField('titulo')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ex.: Viagem dos sonhos"
                  placeholderTextColor={COLORS.dadoUm}
                  style={[styles.input, focusedField === 'titulo' && styles.inputFocused]}
                  editable={!disabled}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  accessibilityLabel="Descrição da meta"
                  value={form.descricao}
                  onChangeText={(descricao) => setForm((current) => ({ ...current, descricao }))}
                  onFocus={() => setFocusedField('descricao')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="O que você quer realizar?"
                  placeholderTextColor={COLORS.dadoUm}
                  style={[styles.descriptionInput, focusedField === 'descricao' && styles.inputFocused]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!disabled}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Valor objetivo</Text>
                <TextInput
                  accessibilityLabel="Valor objetivo da meta"
                  value={form.valor}
                  onChangeText={(valor) => { setForm((current) => ({ ...current, valor })); setValidationError(null); }}
                  onFocus={() => setFocusedField('valor')}
                  onBlur={() => { setFocusedField(null); setForm((current) => ({ ...current, valor: formatarValorMetaEmEdicao(current.valor) })); }}
                  placeholder="Ex.: 500,00"
                  placeholderTextColor={COLORS.dadoUm}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.moneyInput, focusedField === 'valor' && styles.inputFocused]}
                  editable={!disabled}
                />
              </View>

              {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}

              <View style={styles.actions}>
                <CustomButton title="Cancelar" variant="secondary" onPress={onClose} disabled={disabled} style={styles.actionButton} />
                <CustomButton title={mode === 'edit' ? 'Salvar alterações' : 'Criar meta'} variant="primary" onPress={submit} loading={saving} disabled={disabled} style={styles.actionButton} />
              </View>

              {mode === 'edit' && onDelete ? (
                <CustomButton title="Excluir esta meta" variant="danger" icon="trash-can-outline" onPress={onDelete} loading={deleting} disabled={disabled} fullWidth style={styles.deleteButton} />
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
