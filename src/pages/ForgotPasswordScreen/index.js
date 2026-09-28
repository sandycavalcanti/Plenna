import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Alert, Image, KeyboardAvoidingView } from 'react-native';
import { styles } from './styles';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';

// Tela de recuperação de senha — fluxo em 3 passos:
// 1) informar e-mail e receber um código de 6 dígitos
// 2) verificar o código recebido
// 3) definir a nova senha
export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [segundosParaReenvio, setSegundosParaReenvio] = useState(0);

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

  function getApiMessage(error, fallback) {
    return error.response?.data?.message || fallback;
  }

  function handleLogin() {
    navigation.navigate('Login');
  }

  async function enviarCodigo() {
    const emailNormalizado = email.current.trim().toLowerCase();

    if (!emailNormalizado) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }

    email.current = emailNormalizado;

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.current });
      setStep(2);
      setSegundosParaReenvio(60);
      Alert.alert('Código enviado', 'Se o e-mail estiver cadastrado, você receberá um código válido por 15 minutos.');
    } catch (error) {
      logApiErrors(error, 'Erro ao solicitar código de redefinição');
      Alert.alert('Erro', getApiMessage(error, 'Não foi possível enviar o código. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  }

  async function verificarCodigo() {
    if (!/^\d{6}$/.test(codigo.current)) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos enviado por e-mail.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/verify-reset-code', {
        email: email.current,
        codigo: codigo.current,
      });
      setStep(3);
    } catch (error) {
      logApiErrors(error, 'Erro ao verificar código');
      Alert.alert('Código inválido', getApiMessage(error, 'Confira o código enviado por e-mail e tente novamente.'));
    } finally {
      setLoading(false);
    }
  }

  async function alterarSenha() {
    const senhaValida = novaSenha.current.length >= 6 && (/[0-9]/.test(novaSenha.current) || /[^A-Za-z0-9\s]/.test(novaSenha.current));

    if (!senhaValida) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres e 1 número ou caractere especial.');
      return;
    }

    if (novaSenha.current !== confirmarSenha.current) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

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
      Alert.alert('Erro', getApiMessage(error, 'Não foi possível redefinir a senha. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'}>
        <View style={styles.container}>
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text style={styles.titulo}>Recuperar senha!</Text>
          <View style={styles.overlay}>
            {/* PASSO 1 - EMAIL */}
            {step === 1 && (
              <>
                <Text style={styles.texto}>Digite seu e-mail</Text>
                <CustomTextInput placeholder="Email" textValue={email} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
                <CustomButton title={loading ? 'Enviando...' : 'Enviar código'} onPress={enviarCodigo} disabled={loading} />
              </>
            )}

            {/* PASSO 2 - CÓDIGO */}
            {step === 2 && (
              <>
                <Text style={styles.texto}>Digite o código enviado</Text>
                <CustomTextInput placeholder="Código" textValue={codigo} keyboardType="number-pad" maxLength={6} />
                <CustomButton title={loading ? 'Verificando...' : 'Verificar'} onPress={verificarCodigo} disabled={loading} />
                <CustomButton
                  title={segundosParaReenvio > 0 ? `Reenviar código em ${segundosParaReenvio}s` : 'Reenviar código'}
                  onPress={enviarCodigo}
                  disabled={loading || segundosParaReenvio > 0}
                />
                <CustomButton title="Alterar e-mail" onPress={() => setStep(1)} disabled={loading} />
              </>
            )}

            {/* PASSO 3 - NOVA SENHA */}
            {step === 3 && (
              <>
                <Text style={styles.texto}>Crie uma nova senha</Text>
                <CustomTextInput placeholder="Nova senha" secureTextEntry textValue={novaSenha} />
                <CustomTextInput placeholder="Confirmar senha" secureTextEntry textValue={confirmarSenha} />
                <CustomButton title={loading ? 'Alterando...' : 'Alterar senha'} onPress={alterarSenha} disabled={loading} />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
