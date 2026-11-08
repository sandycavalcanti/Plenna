import React, { useRef, useState } from 'react';
import { styles } from './styles';
import { Alert, Text, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { logApiErrors } from '../../utils/error';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { invalidateProtectedSession } from '../../services/security/protectedSession';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Função chamada ao clicar no botão
  function handleLogin(onboardingCompleto = true) {
    // replace impede voltar para a tela de login
    navigation.replace(onboardingCompleto ? 'App' : 'SignUp', {
      completarOnboarding: !onboardingCompleto,
    });
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
        email: email.current.trim().toLowerCase(),
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
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

          <Text style={[styles.texto, styles.signupLink, { color: COLORS.loginLinks }]} onPress={handleSignUp}>
            Criar conta
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
