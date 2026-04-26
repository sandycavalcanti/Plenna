import React from 'react';
import { TextInput } from 'react-native';
import { styles } from './styles';

export default function CustomTextInput({ placeholder, style, textValue }) {

  function onChangeText(text) {
    textValue.current = text;
  }

  return (
    <TextInput
      placeholder={placeholder}
      style={[styles.input, style]}
      onChangeText={onChangeText}
    />
  );
}