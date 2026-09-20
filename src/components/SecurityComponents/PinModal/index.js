import React, { useEffect, useRef, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

const PIN_LENGTH = 6;

export default function PinModal({ visible, mode = 'unlock', onSubmit, onCancel, errorMessage = '', busy = false }) {
  const [value, setValue] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [step, setStep] = useState('primary');
  const inputRef = useRef(null);
  const focusTimerRef = useRef(null);
  const isSetup = mode === 'setup' || mode === 'change';

  useEffect(() => {
    if (visible) {
      setValue('');
      setConfirmation('');
      setStep('primary');
      // O foco atrasado aguarda a animação do Modal. Guardar o timer e limpá-lo
      // no cleanup evita tentar focar um input depois de fechar/desmontar o
      // modal, especialmente ao cancelar o setup ou o desbloqueio.
      focusTimerRef.current = setTimeout(() => {
        inputRef.current?.focus();
        focusTimerRef.current = null;
      }, 120);
    }

    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [visible, mode]);

  function updateValue(text) {
    const digits = text.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setValue(digits);

    if (digits.length === PIN_LENGTH && !isSetup) {
      onSubmit(digits);
      setValue('');
    }

    // Setup/change usam duas etapas: o primeiro PIN fica somente em memória
    // para comparação, e o hook só persiste o verificador após a confirmação.
    if (digits.length === PIN_LENGTH && isSetup && step === 'primary') {
      setStep('confirmation');
      setConfirmation(digits);
      setValue('');
    }

    if (digits.length === PIN_LENGTH && isSetup && step === 'confirmation') {
      onSubmit(confirmation, digits);
      setValue('');
      setStep('primary');
      setConfirmation('');
    }
  }

  // Os círculos mostram apenas a quantidade de dígitos; o conteúdo permanece
  // oculto pelo TextInput com secureTextEntry.
  const displayedLength = value.length;
  const title = mode === 'setup' ? 'Crie seu PIN de compras' : mode === 'change' ? 'Altere seu PIN' : 'Digite seu PIN';
  const subtitle = mode === 'setup'
    ? step === 'primary' ? 'Escolha 6 dígitos para proteger suas compras.' : 'Confirme os 6 dígitos escolhidos.'
    : mode === 'change'
      ? step === 'primary' ? 'Escolha um novo PIN de 6 dígitos.' : 'Confirme seu novo PIN.'
      : 'Use o PIN do Plenna para continuar.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.indicators} accessibilityLabel={`${displayedLength} de ${PIN_LENGTH} dígitos preenchidos`}>
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <Text key={index} style={styles.indicator}>{index < displayedLength ? '●' : '○'}</Text>
            ))}
          </View>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={updateValue}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            secureTextEntry
            autoFocus
            editable={!busy}
            style={styles.input}
            accessibilityLabel="Entrada numérica do PIN"
          />

          <Text style={styles.error}>{errorMessage}</Text>

          <TouchableOpacity style={styles.cancel} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
