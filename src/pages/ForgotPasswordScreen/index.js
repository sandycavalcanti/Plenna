import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { styles } from './styles';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import AppFeedback from '../../components/Common/AppFeedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import { getRecoveryErrorMessage } from '../../utils/authMessages';

// Tela de recuperação de senha — fluxo em 3 passos:
// 1) informar e-mail e receber um código de 6 dígitos
// 2) verificar o código recebido
// 3) definir a nova senha
export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [segundosParaReenvio, setSegundosParaReenvio] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const email = useRef('');
  const codigo = useRef('');
  const novaSenha = useRef('');
  const confirmarSenha = useRef('');

  useEffect(() => {
    if (segundosParaReenvio <= 0) return undefined;

    const timer = setTimeout(() => {
      setSegundosParaReenvio((segundos) => segundos - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [segundosParaReenvio]);

  function handleLogin() {
    navigation.navigate('Login');
  }

  async function enviarCodigo() {
    const emailNormalizado = email.current.trim().toLowerCase();

    if (!emailNormalizado) {
      setFeedback({ type: 'warning', message: 'Digite seu e-mail.' });
      return;
    }

    email.current = emailNormalizado;
    setFeedback(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.current });
      setStep(2);
      setSegundosParaReenvio(60);
      Alert.alert('Código enviado', 'Se o e-mail estiver cadastrado, você receberá um código válido por 15 minutos.');
    } catch (error) {
      logApiErrors(error, 'Erro ao solicitar código de redefinição');
      setFeedback({ type: 'error', message: getRecoveryErrorMessage(error, 'request') });
    } finally {
      setLoading(false);
    }
  }

  async function verificarCodigo() {
    if (!/^\d{6}$/.test(codigo.current)) {
      setFeedback({ type: 'warning', message: 'Digite o código de 6 dígitos enviado por e-mail.' });
      return;
    }

    setFeedback(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/verify-reset-code', {
        email: email.current,
        codigo: codigo.current,
      });
      setStep(3);
    } catch (error) {
      logApiErrors(error, 'Erro ao verificar código');
      setFeedback({ type: 'error', message: getRecoveryErrorMessage(error, 'verify') });
    } finally {
      setLoading(false);
    }
  }

  async function alterarSenha() {
    const senhaValida = novaSenha.current.length >= 6 && (/[0-9]/.test(novaSenha.current) || /[^A-Za-z0-9\s]/.test(novaSenha.current));

    if (!senhaValida) {
      setFeedback({ type: 'warning', message: 'A nova senha deve ter pelo menos 6 caracteres e 1 número ou caractere especial.' });
      return;
    }

    if (novaSenha.current !== confirmarSenha.current) {
      setFeedback({ type: 'warning', message: 'As senhas não coincidem.' });
      return;
    }

    setFeedback(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.current,
        codigo: codigo.current,
        novaSenha: novaSenha.current,
      });
      Alert.alert('Pronto!', 'Sua senha foi redefinida. Faça login com a nova senha.');
      handleLogin();
    } catch (error) {
      logApiErrors(error, 'Erro ao redefinir senha');
      setFeedback({ type: 'error', message: getRecoveryErrorMessage(error, 'reset') });
    } finally {
      setLoading(false);
    }
  }

  function alterarEmail() {
    setFeedback(null);
    setStep(1);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
          <Text style={styles.titulo}>Recuperar senha!</Text>
          <View style={styles.overlay}>
            {feedback ? <AppFeedback message={feedback.message} type={feedback.type} onDismiss={() => setFeedback(null)} testID="recovery-feedback" /> : null}
            {/* PASSO 1 - EMAIL */}
            {step === 1 && (
              <>
                <Text style={styles.texto}>Digite seu e-mail</Text>
                <CustomTextInput placeholder="Email" textValue={email} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} onChangeText={() => setFeedback(null)} />
                <CustomButton title="Enviar código" onPress={enviarCodigo} disabled={loading} loading={loading} />
              </>
            )}

            {/* PASSO 2 - CÓDIGO */}
            {step === 2 && (
              <>
                <Text style={styles.texto}>Digite o código enviado</Text>
                <CustomTextInput placeholder="Código" textValue={codigo} keyboardType="number-pad" maxLength={6} onChangeText={() => setFeedback(null)} />
                <CustomButton title="Verificar" onPress={verificarCodigo} disabled={loading} loading={loading} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={segundosParaReenvio > 0 ? `Reenviar em ${segundosParaReenvio} segundos` : 'Reenviar código'}
                  accessibilityState={{ disabled: loading || segundosParaReenvio > 0 }}
                  onPress={enviarCodigo}
                  disabled={loading || segundosParaReenvio > 0}
                  style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}
                >
                  <Text style={[styles.resendText, (loading || segundosParaReenvio > 0) && styles.resendTextDisabled]}>
                    {segundosParaReenvio > 0 ? `Reenviar em ${segundosParaReenvio}s` : 'Reenviar código'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Alterar e-mail"
                  accessibilityState={{ disabled: loading }}
                  onPress={alterarEmail}
                  disabled={loading}
                  style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}
                >
                  <Text style={styles.changeEmailText}>Alterar e-mail</Text>
                </Pressable>
              </>
            )}

            {/* PASSO 3 - NOVA SENHA */}
            {step === 3 && (
              <>
                <Text style={styles.texto}>Crie uma nova senha</Text>
                <CustomTextInput placeholder="Nova senha" secureTextEntry textValue={novaSenha} onChangeText={() => setFeedback(null)} />
                <CustomTextInput placeholder="Confirmar senha" secureTextEntry textValue={confirmarSenha} onChangeText={() => setFeedback(null)} />
                <CustomButton title="Alterar senha" onPress={alterarSenha} disabled={loading} loading={loading} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
