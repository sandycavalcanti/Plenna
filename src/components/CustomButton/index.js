import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles';

export default function CustomButton({ title, onPress, style, disabled }) {
    return (
        <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled, style]} onPress={onPress} disabled={disabled}>
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
}