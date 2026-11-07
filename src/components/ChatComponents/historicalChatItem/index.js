import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import CustomButton from '../../CustomButton';
import { styles } from './styles';

export default function ChatItem({ title, lastMessage, onPress, onDelete, deleting = false }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Abrir conversa ${title}`}
        style={styles.contentButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.chatIcon}>
          <MaterialIcons name="chat-bubble-outline" size={21} color={COLORS.chatIconeRobo} />
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={1}>{lastMessage}</Text>
        </View>
      </TouchableOpacity>
      <CustomButton
        accessibilityLabel={`Excluir conversa ${title}`}
        variant="danger"
        icon="delete-outline"
        iconOnly
        loading={deleting}
        disabled={deleting}
        onPress={onDelete}
        style={styles.deleteButton}
      />
    </View>
  );
}
