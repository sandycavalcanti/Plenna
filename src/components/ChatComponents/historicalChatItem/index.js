import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
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
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Excluir conversa ${title}`}
        style={styles.deleteButton}
        onPress={onDelete}
        disabled={deleting}
        activeOpacity={0.7}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={COLORS.loginEsqueciSenha} />
        ) : (
          <MaterialIcons name="delete-outline" size={23} color={COLORS.loginEsqueciSenha} />
        )}
      </TouchableOpacity>
    </View>
  );
}
