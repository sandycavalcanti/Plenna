import React from 'react';
import { TextInput } from 'react-native';
import { styles } from './styles';

export default function CustomTextInput({ placeholder, style }) {
  return (
    <TextInput
      placeholder={placeholder}
      style={[styles.input, style]}
    />
  );
}