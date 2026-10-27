import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PinModal from '../../components/SecurityComponents/PinModal';
import { PROTECTED_ACCESS_STATES, useProtectedAccess } from '../../hooks/useProtectedAccess';
import { excluirMemoria, listarMemorias } from '../../api/memoria';
import { COLORS } from '../../constants/colors';

const screenStyles = {
  container: { flex: 1, backgroundColor: COLORS.fundoPrincipal, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, color: COLORS.cadTitulo, fontSize: 21, fontWeight: '700' },
  subtitle: { color: '#655A70', lineHeight: 20, marginBottom: 18 },
  list: { paddingBottom: 28 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, gap: 14, borderWidth: 1, borderColor: 'rgba(131, 111, 226, 0.12)', shadowColor: '#4A3156', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardContent: { flex: 1, gap: 7 },
  content: { color: '#594367', lineHeight: 21, fontSize: 15, fontWeight: '500' },
  origin: { color: '#655A70', fontSize: 12 },
  deleteButton: { minWidth: 44, minHeight: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBF2F7' },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 },
  stateText: { color: '#655A70', textAlign: 'center', lineHeight: 20 },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#8660A1' },
  actionText: { color: '#FFFFFF', fontWeight: '700' },
  inlineError: { color: '#A31414', backgroundColor: '#FFF4F4', borderRadius: 10, padding: 12, marginBottom: 12, lineHeight: 18 },
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
  const [deletingIds, setDeletingIds] = useState({});
  const deletingRef = useRef(new Set());

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

  const confirmDelete = useCallback((memoryId) => {
    const id = String(memoryId);
    if (deletingRef.current.has(id)) return;

    Alert.alert(
      'Excluir memória',
      'Tem certeza que deseja excluir esta memória?\nEssa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (deletingRef.current.has(id)) return;
            deletingRef.current.add(id);
            setDeletingIds((current) => ({ ...current, [id]: true }));
            setErrorMessage('');
            try {
              await excluirMemoria(memoryId);
              setMemories((current) => current.filter((item) => String(item.memoria_id) !== id));
            } catch {
              setErrorMessage('Não foi possível excluir esta memória. Tente novamente.');
            } finally {
              deletingRef.current.delete(id);
              setDeletingIds((current) => {
                const next = { ...current };
                delete next[id];
                return next;
              });
            }
          },
        },
      ],
    );
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

  if (access.status !== PROTECTED_ACCESS_STATES.UNLOCKED) return <SecurityState access={access} navigation={navigation} />;

  return (
    <SafeAreaView style={screenStyles.container} edges={['top']}>
      <MemoryHeader navigation={navigation} />
      <ScrollView contentContainerStyle={screenStyles.list}>
        <Text style={screenStyles.subtitle}>Estas são informações relevantes que a Plenna identificou durante suas conversas autorizadas.</Text>
        {loading ? (
          <View style={screenStyles.state}><ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} /><Text style={screenStyles.stateText}>Carregando memórias...</Text></View>
        ) : errorMessage && memories.length === 0 ? (
          <View style={screenStyles.state}><Text style={screenStyles.stateText}>{errorMessage}</Text><Pressable style={screenStyles.action} onPress={loadMemories}><Text style={screenStyles.actionText}>Tentar novamente</Text></Pressable></View>
        ) : memories.length === 0 ? (
          <View style={screenStyles.state}><Text style={screenStyles.stateText}>Nenhuma memória disponível no momento.</Text></View>
        ) : (
          <View>
            {errorMessage ? <Text style={screenStyles.inlineError}>{errorMessage}</Text> : null}
            {memories.map((item) => {
              const id = String(item.memoria_id);
              const deleting = Boolean(deletingIds[id]);
              return (
                <View key={id} style={screenStyles.card}>
                  <View style={screenStyles.cardContent}>
                    <Text style={screenStyles.content}>{item.conteudo}</Text>
                    <Text style={screenStyles.origin}>{originLabel(item.origem)}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir memória ${item.memoria_id}`}
                    accessibilityState={{ busy: deleting, disabled: deleting }}
                    disabled={deleting}
                    onPress={() => confirmDelete(item.memoria_id)}
                    style={screenStyles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={22} color={deleting ? '#B7AAB8' : '#A31414'} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
