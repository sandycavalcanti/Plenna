import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from './styles';

export default function CustomButton({ title, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
}