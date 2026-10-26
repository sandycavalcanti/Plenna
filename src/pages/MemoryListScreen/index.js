import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';
import { listarMemorias } from '../../api/memoria';
import { COLORS } from '../../constants/colors';

const screenStyles = {
  container: { flex: 1, backgroundColor: COLORS.fundoPrincipal, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, color: COLORS.cadTitulo, fontSize: 21, fontWeight: '700' },
  subtitle: { color: '#655A70', lineHeight: 19, marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10, gap: 8 },
  content: { color: '#594367', lineHeight: 20, fontSize: 15 },
  origin: { color: '#655A70', fontSize: 12 },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 },
  stateText: { color: '#655A70', textAlign: 'center', lineHeight: 20 },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#8660A1' },
  actionText: { color: '#FFFFFF', fontWeight: '700' },
  link: { color: '#893467', fontWeight: '700', minHeight: 48, textAlignVertical: 'center' },
};

function MemoryHeader({ navigation }) {
  return (
    <View style={screenStyles.header}>
      <TouchableOpacity accessibilityLabel="Voltar" accessibilityRole="button" style={screenStyles.back} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.cadTitulo} />
      </TouchableOpacity>
      <Text style={screenStyles.title}>Minhas memórias</Text>
    </View>
  );
}

function SecurityState({ access, navigation }) {
  const busy = [PROTECTED_ACCESS_STATES.CHECKING, PROTECTED_ACCESS_STATES.BIOMETRIC].includes(access.status);
  const message = access.status === PROTECTED_ACCESS_STATES.ERROR
    ? access.errorMessage
    : access.status === PROTECTED_ACCESS_STATES.BIOMETRIC
      ? 'Confirme sua identidade no aviso do aparelho.'
      : access.status === PROTECTED_ACCESS_STATES.LOCKOUT
        ? access.errorMessage
        : 'Suas memórias ficam protegidas por uma confirmação local.';

  return (
    <SafeAreaView style={screenStyles.container} edges={['top']}>
      <MemoryHeader navigation={navigation} />
      <View style={screenStyles.state}>
        {busy ? <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /> : null}
        <Text style={screenStyles.stateText}>{message}</Text>
        {access.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? <Pressable style={screenStyles.action} onPress={access.usePinFallback}><Text style={screenStyles.actionText}>Usar PIN</Text></Pressable> : null}
        {access.status === PROTECTED_ACCESS_STATES.ERROR ? <Pressable style={screenStyles.action} onPress={access.beginAccess}><Text style={screenStyles.actionText}>Tentar novamente</Text></Pressable> : null}
      </View>
      <PinModal
        visible={access.status === PROTECTED_ACCESS_STATES.SETUP || access.status === PROTECTED_ACCESS_STATES.PIN}
        mode={access.status === PROTECTED_ACCESS_STATES.SETUP ? 'setup' : 'unlock'}
        errorMessage={access.errorMessage}
        onSubmit={access.status === PROTECTED_ACCESS_STATES.SETUP ? access.completeSetup : access.submitPin}
        onCancel={access.cancelAccess}
      />
    </SafeAreaView>
  );
}

function originLabel(origin) {
  if (origin === 'DECLARADA') return 'Origem: informação declarada';
  if (origin === 'INFERIDA') return 'Origem: inferida com evidência';
  return 'Origem: não informada';
}

export default function MemoryListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const access = useProtectedAccess();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await listarMemorias({ limite: 50 });
      setMemories(Array.isArray(response?.itens) ? response.itens : []);
    } catch (error) {
      const status = error?.response?.status;
      setMemories([]);
      setErrorMessage(status === 403
        ? 'Ative a memória da IA no Perfil para consultar suas memórias.'
        : status === 401
          ? 'Sua sessão expirou. Entre novamente para continuar.'
          : 'Não foi possível consultar suas memórias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setMemories([]);
    setLoading(true);
    setErrorMessage('');
    access.beginAccess();
    return () => {
      access.cancelAccess();
      setMemories([]);
      setLoading(true);
      setErrorMessage('');
    };
  }, [access.beginAccess, access.cancelAccess]));

  useEffect(() => {
    if (isFocused && access.status === PROTECTED_ACCESS_STATES.UNLOCKED) loadMemories();
  }, [access.lifecycleRevision, access.status, isFocused, loadMemories]);

  if (access.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return <SecurityState access={access} navigation={navigation} />;

  return (
    <SafeAreaView style={screenStyles.container} edges={['top']}>
      <MemoryHeader navigation={navigation} />
      <Text style={screenStyles.subtitle}>Estas são informações relevantes que a Plenna identificou durante suas conversas autorizadas.</Text>
      {loading ? (
        <View style={screenStyles.state}><ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /><Text style={screenStyles.stateText}>Carregando memórias...</Text></View>
      ) : errorMessage ? (
        <View style={screenStyles.state}><Text style={screenStyles.stateText}>{errorMessage}</Text><Pressable style={screenStyles.action} onPress={loadMemories}><Text style={screenStyles.actionText}>Tentar novamente</Text></Pressable></View>
      ) : memories.length === 0 ? (
        <View style={screenStyles.state}><Text style={screenStyles.stateText}>Nenhuma memória está disponível para consulta.</Text><Pressable accessibilityRole="button" style={screenStyles.action} onPress={() => navigation.navigate('MemoryManagement')}><Text style={screenStyles.actionText}>Gerenciar memórias</Text></Pressable></View>
      ) : (
        <View>
          {memories.map((item) => <View key={String(item.memoria_id)} style={screenStyles.card}><Text style={screenStyles.content}>{item.conteudo}</Text><Text style={screenStyles.origin}>{originLabel(item.origem)}</Text></View>)}
          <Pressable accessibilityRole="button" style={screenStyles.action} onPress={() => navigation.navigate('MemoryManagement')}><Text style={screenStyles.actionText}>Gerenciar memórias</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
