import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';
import { formatarValorMoedaParaTela, formatarValorRealParaTela, normalizarValorMoedaParaEntrada } from './currency';

export default function CustomTextInput({ placeholder, style, textValue, value, onChangeText, errorMessage, isValid, mask, ...rest }) {
  const displayValue = mask === 'currency' ? formatarValorMoedaParaTela(value) : mask === 'currencyReal' ? formatarValorRealParaTela(value) : value;
  function handleChangeText(text) {
    const nextText = mask === 'currency' ? normalizarValorMoedaParaEntrada(text) : mask === 'currencyReal' ? String(text).replace(/\D/g, '') : text;
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
          placeholder={placeholder}
          placeholderTextColor={rest.placeholderTextColor || 'rgba(0,0,0,0.4)'}
          style={[styles.input, { color: COLORS.cadTextInputTexto || '#000' }]}
          value={displayValue}
          onChangeText={handleChangeText}
          {...rest}
        />
        {isValid ? <Text style={styles.validIcon}>✓</Text> : null}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}
