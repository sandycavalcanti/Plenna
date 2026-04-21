import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../components/CustomTextInput';
import { styles } from './styles';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([
    { id: '1', text: 'Olá!', sender: 'user' },
    { id: '2', text: 'Oi, como posso ajudar?', sender: 'ai' },
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <MaterialIcons name="smart-toy" size={18} color="#4652A4" />
            </View>

            <View>
              <Text style={styles.headerTitle}>Plenna Assistente</Text>

              <Text style={styles.headerSubtitle}>online agora</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="more-vert" size={20} color="#6D74A8" />
          </TouchableOpacity>
        </View>

        {/* MENSAGENS */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.sender === 'user' ? styles.messageRowUser : styles.messageRowAi]}>
              <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.aiMessage]}>
                <Text style={[styles.messageText, item.sender === 'user' && styles.userMessageText]}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* INPUT */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="attach-file" size={20} color="#5F68A0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="photo-camera" size={20} color="#5F68A0" />
          </TouchableOpacity>

          <CustomTextInput placeholder="Digite uma mensagem..." style={styles.chatInput} />

          <TouchableOpacity style={styles.sendButton}>
            <MaterialIcons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
