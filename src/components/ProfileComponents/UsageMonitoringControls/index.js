import { presentationStyles } from "./styles";
import { styles } from "./styles";
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { tokenStorage } from '../../../api/tokenStorage';
import { synchronizeUsageMonitoring, prepareUsageMonitoringActivation, readUsageMonitoringStatus } from '../../../services/usageMonitoringService';
import { observeUsageSyncState } from '../../../utils/usageMonitoringStatus';
import { listarConsentimentos, registrarConsentimento } from '../../../api/consentimento';
import ReadingDetails from '../../ReadingDetails';
export default function UsageMonitoringControls({
  consent,
  permission,
  statusRevision = 0,
  onStatusChange
}) {
  const [busy, setBusy] = useState(false),
    [needed, setNeeded] = useState(false),
    [message, setMessage] = useState('');
  const [detailed, setDetailed] = useState(null);
  const [detailedError, setDetailedError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [detailMessage, setDetailMessage] = useState('');
  const live = useRef(true);
  const statusCallback = useRef(onStatusChange);
  statusCallback.current = onStatusChange;
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    let session;
    setDetailedError(false);
    if (!consent) {
      setDetailed(null);
      return;
    }
    (async () => {
      session = await tokenStorage.captureSession();
      if (!session) return;
      const rows = await listarConsentimentos({
        usageMonitoringSessionId: session.id,
        signal: session.signal
      });
      tokenStorage.assertSession(session.id);
      if (mounted) setDetailed(rows.some(r => (r.tb_consentimento_tipo?.consentimento_tipo_codigo ?? r.consentimento_tipo_codigo) === 'MONITORAMENTO_ACESSOS' && r.consentimento_status === true));
    })().catch(() => {
      if (mounted && !session?.signal.aborted) setDetailedError(true);
    });
    return () => {
      mounted = false;
    };
  }, [consent, revision]);
  async function confirmationSession() {
    try {
      const session = await tokenStorage.captureSession();
      if (!session || session.signal.aborted || !live.current) return null;
      tokenStorage.assertSession(session.id);
      return session;
    } catch {
      return null;
    }
  }
  async function changeDetailed(value, expectedSession = null) {
    if (busy || !live.current) return;
    setBusy(true);
    setDetailMessage('');
    let confirmed = false;
    let session;
    try {
      session = await tokenStorage.captureSession();
      if (!session) return;
      if (expectedSession && (expectedSession.signal.aborted || expectedSession.id !== session.id)) return;
      tokenStorage.assertSession(session.id);
      await registrarConsentimento('MONITORAMENTO_ACESSOS', value, {
        usageMonitoringSessionId: session.id,
        signal: session.signal
      });
      tokenStorage.assertSession(session.id);
      if (live.current) setDetailed(value);
      confirmed = true;
      await prepareUsageMonitoringActivation(session);
      await synchronizeUsageMonitoring();
    } catch {
      if (live.current && session && !session.signal.aborted) setDetailMessage(confirmed ? 'Escolha salva. Os dados serão atualizados depois.' : 'Não foi possível salvar sua escolha. Tente novamente.');
    } finally {
      if (live.current) setBusy(false);
    }
  }
  useEffect(() => {
    let mounted = true,
      generation = 0,
      owner;
    const present = status => {
      setNeeded(status === 'ACTIVATION_REQUIRED');
      statusCallback.current?.(status);
    };
    const clear = () => {
      generation++;
      if (!mounted) return;
      setDetailed(null);
      setMessage('');
      setDetailMessage('');
      present('CHECKING');
    };
    const update = async () => {
      const request = ++generation;
      const session = await tokenStorage.captureSession();
      if (!mounted || request !== generation) return;
      if (!session) {
        clear();
        return;
      }
      if (owner?.id !== session.id) {
        owner?.signal.removeEventListener('abort', clear);
        owner = session;
        session.signal.addEventListener('abort', clear);
      }
      if (session.signal.aborted) {
        clear();
        return;
      }
      try {
        const status = !consent ? 'CONSENT_REQUIRED' : !permission ? 'PERMISSION_REQUIRED' : await readUsageMonitoringStatus(session);
        tokenStorage.assertSession(session.id);
        if (mounted && request === generation) present(status);
      } catch {
        if (mounted && request === generation && !session.signal.aborted) present('STATUS_UNAVAILABLE');
      }
    };
    update().catch(() => {});
    const unsubscribe = observeUsageSyncState(event => {
      if (!mounted || !owner || owner.signal.aborted || event?.sessionId !== owner.id) return;
      generation++;
      present(event.status);
    });
    return () => {
      mounted = false;
      generation++;
      owner?.signal.removeEventListener('abort', clear);
      unsubscribe();
    };
  }, [consent, permission, statusRevision]);
  async function activate(expectedSession) {
    if (busy || !live.current) return;
    setBusy(true);
    setMessage('');
    let session;
    try {
      session = await tokenStorage.captureSession();
      if (!session) return;
      if (expectedSession.signal.aborted || expectedSession.id !== session.id) return;
      tokenStorage.assertSession(session.id);
      await prepareUsageMonitoringActivation(session);
      await synchronizeUsageMonitoring();
      tokenStorage.assertSession(session.id);
    } catch {
      if (live.current && session && !session.signal.aborted) setMessage('Não foi possível concluir a ativação. Tente novamente.');
    } finally {
      if (live.current) setBusy(false);
    }
  }
  return <View>
    {consent && permission && needed && <Pressable disabled={busy} accessibilityRole="button" style={presentationStyles.inline1} onPress={async () => {
      const session = await confirmationSession();
      if (!session) return;
      Alert.alert('Concluir ativação', 'O PLENNA consultará o uso dos aplicativos de compra a partir desta autorização, somente enquanto estiver aberto. O Android não identifica quem utilizou o aparelho.', [{
        text: 'Cancelar',
        style: 'cancel'
      }, {
        text: 'Ativar',
        onPress: () => activate(session)
      }]);
    }}><Text style={styles.link}>{busy ? 'Ativando…' : 'Concluir ativação'}</Text></Pressable>}
    {!!message && <Text style={styles.status} accessibilityLiveRegion="polite">{message}</Text>}
    <ReadingDetails label="Privacidade e dados" presentation="sheet">
      <Text style={styles.status}>Opcional. Com sua autorização, o PLENNA consulta o uso dos aplicativos de compras monitorados somente enquanto está aberto. O Android pode fornecer dados incompletos e não identifica quem utilizou o aparelho.</Text>
      <Text style={styles.status}>Desativar interrompe novas coletas, preserva o histórico e não revoga a permissão Android. Você pode revogar essa permissão nas configurações de acesso aos dados de uso do Android.</Text>
      <Text style={styles.status}>Os dados descrevem hábitos de uso; não comprovam compra, intenção ou que um acesso causou uma compra. Os horários ficam disponíveis somente para processamento interno da análise comportamental, sem uma lista de acessos na interface.</Text>
      <Text accessibilityRole="header" style={styles.title}>Horários de uso (opcional)</Text>
      <Text style={styles.status}>Usar horários de início e término na análise comportamental exige uma autorização separada. Você pode mudar essa escolha a qualquer momento.</Text>
      {!consent ? <Text style={styles.status}>Ative Tempo em aplicativos para escolher se deseja incluir horários.</Text> : <>
      <Text style={styles.status}>{detailedError ? 'Não foi possível consultar sua escolha.' : detailed === null ? 'Verificando sua escolha…' : detailed ? 'Horários autorizados' : 'Horários não autorizados'}</Text>
      {!!detailMessage && <Text style={styles.status} accessibilityLiveRegion="polite">{detailMessage}</Text>}
    {!detailedError && <Pressable disabled={busy || detailed === null || !permission} accessibilityState={{
          disabled: busy || detailed === null || !permission
        }} accessibilityRole="button" style={presentationStyles.inline2} onPress={async () => {
          if (detailed) {
            changeDetailed(false);
            return;
          }
          const session = await confirmationSession();
          if (!session) return;
          Alert.alert('Autorizar horários de uso', 'Autoriza registrar horários de início e término conhecidos dos aplicativos de compra, além dos acumulados? A consulta ocorre com o PLENNA aberto. Os horários são usados internamente como contexto descritivo à análise de compras; proximidade não comprova que um acesso causou uma compra. Você pode revogar essa autorização no Perfil. O Android pode fornecer dados incompletos e não identifica quem utilizou o aparelho.', [{
            text: 'Cancelar',
            style: 'cancel'
          }, {
            text: 'Autorizar acessos',
            onPress: () => changeDetailed(true, session)
          }]);
        }}><Text style={styles.link}>{detailed ? 'Desativar horários de uso' : 'Permitir horários de uso'}</Text></Pressable>}
    {!permission && <Text style={styles.status}>Permita o acesso no Android para gerenciar os horários.</Text>}
    {detailedError && <Pressable disabled={busy} accessibilityRole="button" style={presentationStyles.inline3} onPress={() => setRevision(value => value + 1)}><Text style={styles.link}>Verificar escolha novamente</Text></Pressable>}
      </>}
    </ReadingDetails>
  </View>;
}
