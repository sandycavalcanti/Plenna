import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';

export default function CustomTextInput({ placeholder, style, textValue, value, onChangeText, errorMessage, isValid, ...rest }) {
  function handleChangeText(text) {
    if (onChangeText) {
      onChangeText(text);
    }

    if (textValue) {
      textValue.current = text;
    }
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={rest.placeholderTextColor || 'rgba(0,0,0,0.4)'}
          style={[styles.input, { color: COLORS.cadTextInputTexto || '#000' }]}
          value={value}
          onChangeText={handleChangeText}
          {...rest}
        />
        {isValid ? <Text style={styles.validIcon}>✓</Text> : null}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}
