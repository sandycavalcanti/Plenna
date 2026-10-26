import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';
import { excluirMemoria, listarMemorias } from '../../api/memoria';
import { COLORS } from '../../constants/colors';

const styles = {
  container: { flex: 1, backgroundColor: COLORS.fundoPrincipal, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, color: COLORS.cadTitulo, fontSize: 21, fontWeight: '700' },
  intro: { color: '#655A70', lineHeight: 19, marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10, gap: 10 },
  content: { color: '#594367', lineHeight: 20, fontSize: 15 },
  origin: { color: '#655A70', fontSize: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardContent: { flex: 1 },
  delete: { color: '#A31414', fontWeight: '700', minHeight: 44, textAlignVertical: 'center' },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 },
  stateText: { color: '#655A70', textAlign: 'center', lineHeight: 20 },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#8660A1' },
  actionText: { color: '#FFFFFF', fontWeight: '700' },
};

function originLabel(origin) {
  if (origin === 'DECLARADA') return 'Origem: informação declarada';
  if (origin === 'INFERIDA') return 'Origem: inferida com evidência';
  return 'Origem: não informada';
}

function Header({ navigation }) {
  return <View style={styles.header}><TouchableOpacity accessibilityLabel="Voltar" accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.cadTitulo} /></TouchableOpacity><Text style={styles.title}>Gerenciar memórias</Text></View>;
}

function SecurityState({ access, navigation }) {
  const busy = [PROTECTED_ACCESS_STATES.CHECKING, PROTECTED_ACCESS_STATES.BIOMETRIC].includes(access.status);
  const message = access.status === PROTECTED_ACCESS_STATES.ERROR ? access.errorMessage : access.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? 'Confirme sua identidade no aviso do aparelho.' : access.status === PROTECTED_ACCESS_STATES.LOCKOUT ? access.errorMessage : 'Confirme sua identidade para gerenciar memórias.';
  return <SafeAreaView style={styles.container} edges={['top']}><Header navigation={navigation} /><View style={styles.state}>{busy ? <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /> : null}<Text style={styles.stateText}>{message}</Text>{access.status === PROTECTED_ACCESS_STATES.BIOMETRIC ? <Pressable style={styles.action} onPress={access.usePinFallback}><Text style={styles.actionText}>Usar PIN</Text></Pressable> : null}{access.status === PROTECTED_ACCESS_STATES.ERROR ? <Pressable style={styles.action} onPress={access.beginAccess}><Text style={styles.actionText}>Tentar novamente</Text></Pressable> : null}</View><PinModal visible={access.status === PROTECTED_ACCESS_STATES.SETUP || access.status === PROTECTED_ACCESS_STATES.PIN} mode={access.status === PROTECTED_ACCESS_STATES.SETUP ? 'setup' : 'unlock'} errorMessage={access.errorMessage} onSubmit={access.status === PROTECTED_ACCESS_STATES.SETUP ? access.completeSetup : access.submitPin} onCancel={access.cancelAccess} /></SafeAreaView>;
}

export default function MemoryManagementScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const access = useProtectedAccess();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingIds, setDeletingIds] = useState({});
  const deletingRef = useRef(new Set());

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await listarMemorias({ limite: 50 });
      setMemories(Array.isArray(response?.itens) ? response.itens : []);
    } catch (error) {
      setMemories([]);
      setErrorMessage(error?.response?.status === 403 ? 'Ative a memória da IA no Perfil para gerenciar suas memórias.' : 'Não foi possível consultar suas memórias. Tente novamente.');
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
      deletingRef.current.clear();
      setDeletingIds({});
      setMemories([]);
      setLoading(true);
      setErrorMessage('');
    };
  }, [access.beginAccess, access.cancelAccess]));

  useEffect(() => {
    if (isFocused && access.status === PROTECTED_ACCESS_STATES.UNLOCKED) loadMemories();
  }, [access.lifecycleRevision, access.status, isFocused, loadMemories]);

  const confirmDelete = useCallback((memoryId) => {
    const id = String(memoryId);
    if (deletingRef.current.has(id)) return;
    Alert.alert('Excluir memória', 'Essa ação remove somente a memória selecionada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (deletingRef.current.has(id)) return;
        deletingRef.current.add(id);
        setDeletingIds((current) => ({ ...current, [id]: true }));
        setErrorMessage('');
        try {
          await excluirMemoria(memoryId);
          setMemories((current) => current.filter((item) => String(item.memoria_id) !== id));
        } catch {
          setErrorMessage('Não foi possível excluir essa memória. Tente novamente.');
        } finally {
          deletingRef.current.delete(id);
          setDeletingIds((current) => { const next = { ...current }; delete next[id]; return next; });
        }
      } },
    ]);
  }, []);

  if (access.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return <SecurityState access={access} navigation={navigation} />;

  return <SafeAreaView style={styles.container} edges={['top']}><Header navigation={navigation} /><Text style={styles.intro}>Revise as informações que a Plenna guardou e exclua individualmente o que não deseja manter.</Text>{loading ? <View style={styles.state}><ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /><Text style={styles.stateText}>Carregando memórias...</Text></View> : errorMessage && !memories.length ? <View style={styles.state}><Text style={styles.stateText}>{errorMessage}</Text><Pressable style={styles.action} onPress={loadMemories}><Text style={styles.actionText}>Tentar novamente</Text></Pressable></View> : memories.length === 0 ? <View style={styles.state}><Text style={styles.stateText}>Nenhuma memória está disponível para gerenciamento.</Text></View> : <View>{memories.map((item) => { const id = String(item.memoria_id); return <View key={id} style={styles.card}><View style={styles.cardRow}><View style={styles.cardContent}><Text style={styles.content}>{item.conteudo}</Text><Text style={styles.origin}>{originLabel(item.origem)}</Text></View><Pressable accessibilityRole="button" accessibilityState={{ busy: Boolean(deletingIds[id]) }} disabled={Boolean(deletingIds[id])} onPress={() => confirmDelete(item.memoria_id)}><Text style={styles.delete}>{deletingIds[id] ? 'Excluindo...' : 'Excluir'}</Text></Pressable></View></View>; })}{errorMessage ? <Text style={{ color: '#A31414', marginTop: 8 }}>{errorMessage}</Text> : null}</View>}</SafeAreaView>;
}
