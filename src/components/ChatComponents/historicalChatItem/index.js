import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
        <Text style={styles.chatIconText}>P</Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.message} numberOfLines={1}>{lastMessage}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}
