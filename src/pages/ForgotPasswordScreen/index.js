import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Alert, Image, KeyboardAvoidingView } from 'react-native';
import { styles } from './styles';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';

// Tela de recuperação de senha — fluxo em 3 passos:
// 1) informar e-mail e receber um código de 6 dígitos
// 2) verificar o código recebido
// 3) definir a nova senha
export default function ForgotPasswordScreen({
  navigation,
  route
}) {
  const busy = useRef(false);
  const token = useRef('');
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
      setSegundosParaReenvio(segundos => segundos - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [segundosParaReenvio]);
  useEffect(() => {
    if (!route?.params) return;
    // O link apenas preenche o fluxo; a API valida o segredo antes de trocar a senha.
    const {
      email: linkEmail,
      token: linkToken
    } = route.params;
    if (typeof linkEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkEmail) || typeof linkToken !== 'string' || !/^[a-f0-9]{64}$/.test(linkToken)) {
      token.current = '';
      setStep(1);
      Alert.alert('Link inválido', 'Solicite uma nova recuperação de senha.');
      return;
    }
    email.current = linkEmail.trim().toLowerCase();
    token.current = linkToken;
    novaSenha.current = '';
    confirmarSenha.current = '';
    setStep(3);
  }, [route?.params]);
  function getApiMessage(error, fallback) {
    return error.response?.data?.message || fallback;
  }
  function handleLogin() {
    navigation.reset({
      index: 0,
      routes: [{
        name: 'Login'
      }]
    });
  }
  async function enviarCodigo() {
    if (busy.current || segundosParaReenvio > 0) return;
    const emailNormalizado = email.current.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }
    email.current = emailNormalizado;
    busy.current = true;
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', {
        email: email.current
      });
      token.current = '';
      codigo.current = '';
      setStep(2);
      setSegundosParaReenvio(60);
      Alert.alert('Confira seu e-mail', 'Se houver uma conta para este e-mail, você receberá um link e um código válidos por 15 minutos.');
    } catch (error) {
      Alert.alert('Erro', getApiMessage(error, 'Não foi possível enviar o código. Tente novamente.'));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  async function verificarCodigo() {
    if (busy.current) return;
    if (!/^\d{6}$/.test(codigo.current)) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos enviado por e-mail.');
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      await apiClient.post('/auth/verify-reset-code', {
        email: email.current,
        codigo: codigo.current
      });
      setStep(3);
    } catch (error) {
      Alert.alert('Código inválido', getApiMessage(error, 'Confira o código enviado por e-mail e tente novamente.'));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  async function alterarSenha() {
    if (busy.current) return;
    const senhaValida = novaSenha.current.length >= 6 && unescape(encodeURIComponent(novaSenha.current)).length <= 72 && (/[0-9]/.test(novaSenha.current) || /[^A-Za-z0-9\s]/.test(novaSenha.current));
    if (!senhaValida) {
      Alert.alert('Atenção', 'Use pelo menos 6 caracteres e 1 número ou caractere especial, com no máximo 72 bytes.');
      return;
    }
    if (novaSenha.current !== confirmarSenha.current) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.current,
        codigo: token.current || codigo.current,
        novaSenha: novaSenha.current
      });
      token.current = '';
      codigo.current = '';
      novaSenha.current = '';
      confirmarSenha.current = '';
      Alert.alert('Pronto!', 'Sua senha foi redefinida. Faça login com a nova senha.');
      handleLogin();
    } catch (error) {
      Alert.alert('Erro', getApiMessage(error, 'Não foi possível redefinir a senha. Tente novamente.'));
      if ([400, 429].includes(error.response?.status)) {
        token.current = '';
        codigo.current = '';
        setStep(1);
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return <SafeAreaView style={{
    flex: 1
  }}>
      <KeyboardAvoidingView style={{
      flex: 1
    }} behavior={'padding'}>
        <View style={styles.container}>
          <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
          <Text style={styles.titulo}>Recuperar senha!</Text>
          <View style={styles.overlay}>
            {/* PASSO 1 - EMAIL */}
            {step === 1 && <>
                <Text style={styles.texto}>Digite seu e-mail</Text>
                <CustomTextInput placeholder="Email" textValue={email} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
                <CustomButton title="Enviar código" onPress={enviarCodigo} disabled={loading} loading={loading} />
              </>}

            {/* PASSO 2 - CÓDIGO */}
            {step === 2 && <>
                <Text style={styles.texto}>Digite o código enviado</Text>
                <CustomTextInput placeholder="Código" textValue={codigo} keyboardType="number-pad" maxLength={6} />
                <CustomButton title="Verificar" onPress={verificarCodigo} disabled={loading} loading={loading} />
                <CustomButton
                  title={segundosParaReenvio > 0 ? `Reenviar código em ${segundosParaReenvio}s` : 'Reenviar código'}
                  variant="secondary"
                  onPress={enviarCodigo}
                  disabled={loading || segundosParaReenvio > 0}
                />
                <CustomButton title="Alterar e-mail" variant="secondary" onPress={() => setStep(1)} disabled={loading} />
              </>}

            {/* PASSO 3 - NOVA SENHA */}
            {step === 3 && <>
                <Text style={styles.texto}>Crie uma nova senha</Text>
                <CustomTextInput placeholder="Nova senha" secureTextEntry textValue={novaSenha} />
                <CustomTextInput placeholder="Confirmar senha" secureTextEntry textValue={confirmarSenha} />
                <CustomButton title="Alterar senha" onPress={alterarSenha} disabled={loading} loading={loading} />
              </>}
          </View>
          <CustomButton title="Voltar ao login" onPress={handleLogin} disabled={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>;
}
