import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { styles } from './styles';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

export default function ChatItem({ title, lastMessage, onPress }) {
  return (
    <View style={styles.container}>
      {/* Área clicável do chat */}
      <TouchableOpacity style={styles.chatArea} onPress={onPress}>
        <View style={styles.chatInfo}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botão dos 3 pontinhos */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          console.log('Abrir menu');
        }}>
        <MaterialIcons name="more-vert" size={25} color={COLORS.histChatItemBotao3Pontos} />
      </TouchableOpacity>
    </View>
  );
}
