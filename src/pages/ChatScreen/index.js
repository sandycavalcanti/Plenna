import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([
    { id: '1', text: 'Olá!', sender: 'user' },
    { id: '2', text: 'Oi, como posso ajudar?', sender: 'ai' },
  ]);
  const [draftMessage, setDraftMessage] = useState('');

  function enviarMensagem() {
    const texto = draftMessage.trim();

    if (!texto) {
      return;
    }

    setMessages((currentMessages) => [...currentMessages, { id: String(Date.now()), text: texto, sender: 'user' }]);
    setDraftMessage('');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardWrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <MaterialIcons name="smart-toy" size={18} color={COLORS.chatIconeRobo} />
            </View>

            <View>
              <Text style={styles.headerTitle}>Plenna Assistente</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="more-vert" size={30} color={COLORS.chatBotao3Pontos} />
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
        <View style={[styles.composerShell, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.inputArea}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="attach-file" size={24} color={COLORS.chatBotoesAdicionaisEnviar} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="photo-camera" size={28} color={COLORS.chatBotoesAdicionaisEnviar} />
            </TouchableOpacity>

            <View style={styles.chatInputWrap}>
              <TextInput
                placeholder="Digite uma mensagem..."
                placeholderTextColor={COLORS.chatTextInputTexto}
                style={styles.chatInput}
                value={draftMessage}
                onChangeText={setDraftMessage}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={enviarMensagem}
              />
            </View>

            <TouchableOpacity style={styles.sendButton} onPress={enviarMensagem} activeOpacity={0.85}>
              <MaterialIcons name="send" size={28} color={COLORS.chatBotaoEnviar} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}