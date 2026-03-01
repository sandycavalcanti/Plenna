import React from 'react';
import { styles } from './styles';
import { Text, Image, TextInput, Button, KeyboardAvoidingView } from 'react-native';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {

  // Função chamada ao clicar no botão
  function handleLogin() {
    // replace impede voltar para a tela de login
    navigation.replace('App');
  }

  return (
    // Ajusta a tela quando o teclado aparece
    <KeyboardAvoidingView style={styles.container} behavior="padding">

      {/* Logo do app */}
      <Image source={require('../../../assets/logoPlennaIcon.png')} style={styles.logo} />
      <Text style={{ fontSize: 24, marginBottom: 20 }}> Bem-vindo </Text>

      {/* Campos de entrada */}
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />

      {/* Botão de login */}
      <Button title="Login" onPress={handleLogin} />

    </KeyboardAvoidingView>
  );
}