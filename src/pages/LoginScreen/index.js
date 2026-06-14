import React, { useRef, useState } from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View, ToastAndroid } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants/colors';
import { devMode } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

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
      .catch((error) => {
        logApiErrors(error, 'Erro ao fazer login');
        falhaLogin(error);
      });
  }

  function falhaLogin(error) {
    const mensagemErro = error.response?.data?.message || 'Houve um erro ao tentar fazer login';
    ToastAndroid.show(mensagemErro, ToastAndroid.LONG);
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
              Conta com nada
            </Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
