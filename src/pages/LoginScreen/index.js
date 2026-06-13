import React, { useRef } from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { handleApiError } from '../../utils/error';
import { COLORS } from '../../constants/colors';
import { devMode } from '../../constants/config';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {
  // Função chamada ao clicar no botão
  function handleLogin() {
    // replace impede voltar para a tela de login
    navigation.replace('App');
  }
  function handleForgotPassword() {
    navigation.navigate('ForgotPassword');
  }
  function handleSignUp() {
    navigation.navigate('SignUp');
  }

  const email = useRef('');
  const senha = useRef('');

  async function Login() {
    apiClient
      .post('/auth/login', {
        email: email.current,
        senha: senha.current,
      })
      .then(async (response) => {
        const dados = response.data;
        const token = dados.token;
        await tokenStorage.setToken(token);
        handleLogin();
      })
      .catch((error) => handleApiError(error, 'Erro ao fazer login'));
  }

  async function irDireto() {
    apiClient
      .post('/auth/login', {
        email: 'sandy@email.com',
        senha: 'senha123',
      })
      .then(async (response) => {
        const dados = response.data;
        const token = dados.token;
        await tokenStorage.setToken(token);
        handleLogin();
      })
      .catch((error) => handleApiError(error, 'Erro ao fazer login'));
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
      <Text style={styles.titulo}> Bem-vindo! </Text>
      <View style={styles.overlay}>
        <CustomTextInput placeholder="Email" textValue={email} autoCapitalize="none" />
        <CustomTextInput placeholder="Senha" secureTextEntry textValue={senha} autoCapitalize="none" />
        <Text style={[styles.texto, { color: COLORS.loginEsqueciSenha, alignSelf: 'flex-end', marginBottom: 30, paddingRight: 10, marginTop: -10 }]} onPress={handleForgotPassword}>
          Esqueci minha senha
        </Text>
        <CustomButton title="Entrar" onPress={Login} />

        <Text style={[styles.texto, { color: COLORS.loginLinks }]} onPress={handleSignUp}>
          Criar conta
        </Text>
        {devMode && (
          <Text style={[styles.texto, { color: COLORS.loginLinks }]} onPress={irDireto}>
            Ir direto
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
