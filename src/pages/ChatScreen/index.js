import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { COLORS } from '../../constants/colors';
import { useHeaderHeight } from '@react-navigation/elements';

export default function ChatScreen() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

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

  useEffect(() => {
    // Listener do teclado
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardWrapper} behavior={keyboardVisible ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}>
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
        <View style={styles.composerShell}>
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
