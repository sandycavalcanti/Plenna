import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { styles } from './styles';

export default function ChatItem({ title, lastMessage, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversa ${title}`}
      style={styles.container}
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
      <MaterialIcons name="chevron-right" size={24} color={COLORS.histChatBotao3Pontos} style={styles.chevron} />
    </TouchableOpacity>
  );
}
