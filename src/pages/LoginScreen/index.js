import React, { useRef, useState } from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants/colors';
import { devMode } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { invalidateProtectedSession } from '../../services/security/protectedSession';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
     if (!email.current || !senha.current) {
    Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
    return;
  }

    apiClient
      .post('/auth/login', {
        email: email.current,
        senha: senha.current,
      })
      .then(async (response) => {
        const dados = response.data;
        const token = dados.token;
        await tokenStorage.setToken(token);
        // Um novo login começa sempre sem herdar o desbloqueio local de outra
        // conta, mesmo que o SecureStore mantenha PINs de usuários anteriores.
        invalidateProtectedSession();
        handleLogin();
      })
      // Usa o helper existente para registrar erros sem referenciar um
      // identificador inexistente no escopo da tela de login.
      .catch((error) => logApiErrors(error, 'Erro ao realizar login'));
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
        // O login de desenvolvimento também pode trocar a conta ativa. Por
        // isso invalidamos a sessão local de compras sem registrar o JWT ou
        // qualquer outro segredo no console.
        invalidateProtectedSession();
        handleLogin();
      })
      // O login de desenvolvimento segue o mesmo tratamento de erro do
      // fluxo normal, mantendo o diagnóstico centralizado no utilitário atual.
      .catch((error) => logApiErrors(error, 'Erro ao realizar login'));
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
      <Text style={styles.titulo}> Bem-vindo! </Text>
      <View style={styles.overlay}>
        <CustomTextInput placeholder="Email" textValue={email} autoCapitalize="none" />
        <View style={{ width: '100%' }}>
          <CustomTextInput placeholder="Senha" secureTextEntry={!mostrarSenha} textValue={senha} autoCapitalize="none" />
          <TouchableOpacity style={{ position: 'absolute', right: 10, top: 8 }} onPress={() => setMostrarSenha(!mostrarSenha)}>
            <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={24} color={COLORS.loginLinks} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.texto, { color: COLORS.loginEsqueciSenha, alignSelf: 'flex-end', marginBottom: 30, paddingRight: 10, marginTop: -10 }]} onPress={handleForgotPassword}>
          Esqueci minha senha
        </Text>
        <CustomButton title="Entrar" onPress={Login} />

        <Text style={[styles.texto, { color: COLORS.loginLinks }]} onPress={handleSignUp}>
          Criar conta
        </Text>
        {devMode && (
          <>
            <Text
              style={[styles.texto, { color: COLORS.loginLinks }]}
              onPress={() => {
                email.current = 'sandy@email.com';
                senha.current = 'senha123';
                Login();
              }}>
              Ir direto
            </Text>
            <Text
              style={[styles.texto, { color: COLORS.loginLinks }]}
              onPress={() => {
                email.current = 'semnada@email.com';
                senha.current = 'senha123';
                Login();
              }}>
              Conta sem nada
            </Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
