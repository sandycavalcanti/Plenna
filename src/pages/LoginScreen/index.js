import React, { useRef, useState } from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import AppFeedback from '../../components/Common/AppFeedback';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { logApiErrors } from '../../utils/error';
import { getLoginErrorMessage } from '../../utils/authMessages';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { invalidateProtectedSession } from '../../services/security/protectedSession';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
    const emailNormalizado = email.current.trim().toLowerCase();

    setFeedback(null);
    if (!emailNormalizado || !senha.current) {
      setFeedback({ type: 'warning', message: 'Preencha o e-mail e a senha.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setFeedback({ type: 'warning', message: 'Informe um e-mail válido e tente novamente.' });
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: emailNormalizado,
        senha: senha.current,
      });
      const dados = response.data;
      const token = dados.token;
      await tokenStorage.setToken(token);
      // Um novo login começa sempre sem herdar o desbloqueio local de outra
      // conta, mesmo que o SecureStore mantenha PINs de usuários anteriores.
      invalidateProtectedSession();
      handleLogin();
    } catch (error) {
      logApiErrors(error, 'Erro ao realizar login');
      setFeedback({ type: 'error', message: getLoginErrorMessage(error) });
    } finally {
      setLoading(false);
    }
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
          {feedback ? <AppFeedback message={feedback.message} type={feedback.type} onDismiss={() => setFeedback(null)} testID="login-feedback" /> : null}
          <CustomTextInput placeholder="Email" textValue={email} autoCapitalize="none" onChangeText={() => setFeedback(null)} />
          <View style={{ width: '100%' }}>
            <CustomTextInput placeholder="Senha" secureTextEntry={!mostrarSenha} textValue={senha} autoCapitalize="none" onChangeText={() => setFeedback(null)} />
            <TouchableOpacity style={{ position: 'absolute', right: 10, top: 8 }} onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={24} color={COLORS.loginLinks} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.texto, { color: COLORS.loginEsqueciSenha, alignSelf: 'flex-end', marginBottom: 30, paddingRight: 10, marginTop: -10 }]} onPress={handleForgotPassword}>
            Esqueci minha senha
          </Text>
          <CustomButton title="Entrar" onPress={Login} disabled={loading} loading={loading} />

          <Text style={[styles.texto, styles.signupLink, { color: COLORS.loginLinks }]} onPress={handleSignUp}>
            Criar conta
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
