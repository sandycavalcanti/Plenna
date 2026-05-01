import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';

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
    <View style={styles.wrapper}>
      <View style={styles.inputContainer}>
        <TextInput placeholder={placeholder} style={[styles.input, style]} value={value} onChangeText={handleChangeText} {...rest} />
        {isValid ? <Text style={styles.validIcon}>✓</Text> : null}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}
