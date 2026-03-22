import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomTextInput from '../../components/CustomTextInput';
import { styles } from './styles';

export default function ChatScreen() {

  const [messages, setMessages] = useState([
    { id: '1', text: 'Olá!', sender: 'user' },
    { id: '2', text: 'Oi, como posso ajudar?', sender: 'ai' },
  ]);

  return (
    <KeyboardAvoidingView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* MENSAGENS */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender === 'user'
                ? styles.userMessage
                : styles.aiMessage
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />

      {/* INPUT */}
      <View style={styles.inputArea}>

        <TouchableOpacity>
          <MaterialIcons name="attach-file" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity>
          <MaterialIcons name="photo-camera" size={24} color="#fff" />
        </TouchableOpacity>

        <CustomTextInput
          placeholder="Digite uma mensagem..."
          style={styles.chatInput}
        />

        <TouchableOpacity>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>

      </View>

    </KeyboardAvoidingView>
  );
}