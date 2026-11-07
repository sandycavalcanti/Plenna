/**
 * Arquivo: Permissions/index.js
 * Descrição: Componente responsável por gerenciar as permissões do usuário,
 * permitindo ativar ou desativar funcionalidades como captura por e-mail
 * e monitoramento de comportamento.
 * Autor: Marina Souza
 * Última atualização: 13/09/2026
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, Alert, AppState, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProfileCard from '../ProfileCard';
import ReadingDetails from '../../ReadingDetails';
import { usageMonitoringEnabled } from '../../../api/usageMonitoringPolicy';
const UsageMonitoringControls = usageMonitoringEnabled ? require('../UsageMonitoringControls').default : null;
import styles from './styles';
import { alterarConsentimentoMonitoramento } from '../../../services/monitoramentoConsentService';
import { getModuleStatus, hasUsageAccess, openUsageAccessSettings } from '../../../../modules/plenna-usage-stats';
import { listarConsentimentos, registrarConsentimento } from '../../../api/consentimento';
import { tokenStorage } from '../../../api/tokenStorage';
import { logApiErrors } from '../../../utils/error';
function logErroMonitoramento(error, texto) {
  if (!__DEV__) return;
  const statusOriginal = error && typeof error === 'object' ? error.response?.status : undefined;
  const codigoOriginal = error && typeof error === 'object' ? error.code : undefined;
  const status = Number.isInteger(statusOriginal) && statusOriginal >= 400 && statusOriginal <= 599 ? statusOriginal : undefined;
  const codigosPermitidos = new Set(['ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'ERR_NETWORK']);
  const codigo = typeof codigoOriginal === 'string' && codigosPermitidos.has(codigoOriginal) ? codigoOriginal : undefined;
  const erroSeguro = {
    code: codigo,
    response: {
      status,
      data: {
        message: 'Não foi possível concluir a operação de monitoramento.'
      }
    }
  };
  logApiErrors(erroSeguro, texto);
}
function logErroPermissoes(error, metodo, caminho, operacao) {
  if (!__DEV__) return;
  const statusOriginal = error?.response?.status;
  const codigoOriginal = error?.code;
  const status = Number.isInteger(statusOriginal) && statusOriginal >= 100 && statusOriginal <= 599 ? statusOriginal : null;
  const codigo = ['ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'ERR_NETWORK', 'ECONNABORTED'].includes(codigoOriginal) ? codigoOriginal : null;
  const categoria = status === 401 ? 'AUTENTICACAO' : status === 403 ? 'AUTORIZACAO' : status !== null && status >= 500 ? 'SERVIDOR' : codigo === 'ERR_NETWORK' ? 'REDE' : status === 400 ? 'CONTRATO' : 'DESCONHECIDA';
  logApiErrors({
    code: codigo,
    response: {
      status,
      data: {
        message: 'Falha segura na API de permissões.'
      }
    }
  }, 'Erro de integração de permissões:', true, {
    operacao,
    metodo,
    caminho,
    status,
    ambiente: __DEV__ ? 'desenvolvimento' : 'producao',
    categoria
  });
}
export default function Permissions({ data }) {
  const navigation = useNavigation();
  const [emailEnabled, setEmailEnabled] = useState(data?.email ?? true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [usageAccessEnabled, setUsageAccessEnabled] = useState(false);
  const [loadingTracking, setLoadingTracking] = useState(true);
  const [nativeAvailable, setNativeAvailable] = useState(null);
  const [trackingStatusKnown, setTrackingStatusKnown] = useState(false);
  const [usagePermissionKnown, setUsagePermissionKnown] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [proactivityEnabled, setProactivityEnabled] = useState(false);
  const [proactivityActionLoading, setProactivityActionLoading] = useState(false);
  const [personalizationActionLoading, setPersonalizationActionLoading] = useState(false);
  const [consentimentosDisponiveis, setConsentimentosDisponiveis] = useState(false);
  const [loadingMemory, setLoadingMemory] = useState(true);
  const [memoryActionLoading, setMemoryActionLoading] = useState(false);
  const [memoryError, setMemoryError] = useState('');
  const [memorySuccess, setMemorySuccess] = useState('');
  const [monitoringStatus, setMonitoringStatus] = useState('CHECKING');
  const [monitoringRevision, setMonitoringRevision] = useState(0);
  const montado = useRef(false);
  const alterando = useRef(false);
  const consulta = useRef(0);
  const alterandoMemoria = useRef(false);
  const alterandoPersonalizacao = useRef(false);
  const alterandoProatividade = useRef(false);
  const consultaMemoria = useRef(0);
  function validarSessao(sessao) {
    tokenStorage.assertSession(sessao.id);
    if (!montado.current || sessao.signal.aborted) throw new Error('Operação cancelada');
  }
  async function carregarEstadoMonitoramento() {
    if (alterando.current) return;
    const numero = ++consulta.current;
    let sessao;
    try {
      setLoadingTracking(true);
      sessao = await tokenStorage.captureSession();
      if (!sessao || !montado.current) return;
      const [consentimentos, usageAccess, modulo] = await Promise.allSettled([listarConsentimentos({
        usageMonitoringSessionId: sessao.id,
        signal: sessao.signal
      }), hasUsageAccess(), getModuleStatus()]);
      validarSessao(sessao);
      if (numero !== consulta.current) return;
      const consentKnown = consentimentos.status === 'fulfilled' && Array.isArray(consentimentos.value);
      setTrackingStatusKnown(consentKnown);
      if (consentKnown) setTrackingEnabled(consentimentos.value.some(item => (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo) === 'MONITORAMENTO_TEMPO_USO' && item.consentimento_status === true));
      setUsageAccessEnabled(usageAccess.status === 'fulfilled' && usageAccess.value === true);
      setUsagePermissionKnown(usageAccess.status === 'fulfilled');
      setNativeAvailable(modulo.status === 'fulfilled' ? modulo.value?.available === true : null);
      } catch (error) {
      logErroMonitoramento(error, 'Erro ao carregar monitoramento:');
      if (montado.current && numero === consulta.current) {
        setTrackingStatusKnown(false);
        setUsagePermissionKnown(false);
      }
    } finally {
      if (montado.current && numero === consulta.current) {
        setLoadingTracking(false);
        setMonitoringRevision(value => value + 1);
      }
    }
  }
  async function carregarEstadoMemoria(force = false) {
    if (alterandoMemoria.current && !force) return;
    const numero = ++consultaMemoria.current;
    let sessao;
    try {
      setLoadingMemory(true);
      setMemoryError('');
      sessao = await tokenStorage.captureSession();
      if (!sessao || !montado.current) return;
      const consentimentos = await listarConsentimentos({
        usageMonitoringSessionId: sessao.id,
        signal: sessao.signal
      });
      validarSessao(sessao);
      if (numero !== consultaMemoria.current) return;
      setConsentimentosDisponiveis(true);
      const ativo = consentimentos.some(item => (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo) === 'IA_MEMORIA' && item.consentimento_status === true);
      const personalizacaoAtiva = consentimentos.some(item => (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo) === 'IA_PERSONALIZACAO' && item.consentimento_status === true);
      const proatividadeAtiva = consentimentos.some(item => (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo) === 'IA_PROATIVIDADE' && item.consentimento_status === true);
      if (numero !== consultaMemoria.current) return;
      setMemoryEnabled(ativo);
      setPersonalizationEnabled(personalizacaoAtiva);
      setProactivityEnabled(proatividadeAtiva);
    } catch (error) {
      if (montado.current && numero === consultaMemoria.current) {
        setConsentimentosDisponiveis(false);
        setMemoryError('Nao foi possivel consultar as permissoes da IA.');
        logErroPermissoes(error, 'GET', '/consentimento', 'listar_consentimentos');
      }
    } finally {
      if (montado.current && numero === consultaMemoria.current) setLoadingMemory(false);
    }
  }
  useEffect(() => {
    montado.current = true;
    let removerCancelamento;
    tokenStorage.captureSession().then(sessao => {
      if (!sessao || !montado.current) return;
      const limpar = () => {
        consulta.current++;
        consultaMemoria.current++;
        setTrackingEnabled(false);
        setTrackingStatusKnown(false);
        setUsageAccessEnabled(false);
        setLoadingTracking(false);
        setMemoryEnabled(false);
        setPersonalizationEnabled(false);
        setProactivityEnabled(false);
        setConsentimentosDisponiveis(false);
        setLoadingMemory(false);
      };
      if (sessao.signal.aborted) limpar();else {
        sessao.signal.addEventListener('abort', limpar);
        removerCancelamento = () => sessao.signal.removeEventListener('abort', limpar);
      }
    }).catch(() => {});
    carregarEstadoMonitoramento();
    carregarEstadoMemoria();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        carregarEstadoMonitoramento();
        carregarEstadoMemoria();
      }
    });
    return () => {
      montado.current = false;
      consulta.current++;
      consultaMemoria.current++;
      setMemoryEnabled(false);
      setPersonalizationEnabled(false);
      setProactivityEnabled(false);
      setConsentimentosDisponiveis(false);
      removerCancelamento?.();
      subscription.remove();
    };
  }, []);
  function handleToggleEmail(value) {
    if (!value) {
      Alert.alert(
        'Desativar captura por e-mail',
        'Você pode perder a coleta automática de compras. Deseja continuar?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Confirmar',
            onPress: () => setEmailEnabled(false),
          },
        ]
      );

      return;
    }

    setEmailEnabled(true);
  }

  async function alterarMonitoramento(value, sessao) {
    if (alterando.current) return;
    alterando.current = true;
    consulta.current++;
    try {
      validarSessao(sessao);
      setLoadingTracking(true);
      const monitoring = await alterarConsentimentoMonitoramento(value, sessao, registrarConsentimento, tokenStorage.assertSession);
      validarSessao(sessao);
      setTrackingEnabled(value);
      const permitido = await hasUsageAccess();
      validarSessao(sessao);
      setUsageAccessEnabled(permitido === true);
      if (monitoring?.activationPending) Alert.alert('Consentimento salvo', 'Falta concluir a ativação neste aparelho. Use a opção Concluir ativação em Tempo em aplicativos.');else if (value && !permitido) {
        Alert.alert('Permissão necessária', 'Para medir o tempo de uso dos aplicativos de compra, o PLENNA precisa do Acesso aos dados de uso do Android.', [{
          text: 'Agora não',
          style: 'cancel'
        }, {
          text: 'Abrir configurações',
          onPress: async () => {
            try {
              validarSessao(sessao);
              const abriu = await openUsageAccessSettings();
              validarSessao(sessao);
              if (!abriu) Alert.alert('Erro', 'Não foi possível abrir as configurações do Android.');
            } catch {
              // Uma sessão antiga não deve abrir configurações ou atualizar a tela.
            }
          }
        }]);
      }
    } catch (error) {
      if (!value) {
        logErroMonitoramento(error, 'Erro ao desativar monitoramento:');
      } else {
        logErroMonitoramento(error, 'Erro ao ativar monitoramento:');
      }
      if (montado.current && !sessao.signal.aborted) {
        Alert.alert('Erro', 'Não foi possível alterar o monitoramento.');
      }
    } finally {
      alterando.current = false;
      if (montado.current && !sessao.signal.aborted) await carregarEstadoMonitoramento();
    }
  }
  async function handleToggleTracking(value) {
    if (loadingTracking || alterando.current) return;
    try {
      const sessao = await tokenStorage.captureSession();
      if (!sessao) return;
      validarSessao(sessao);
      if (!value) {
        Alert.alert('Desativar monitoramento', 'Novas coletas serão interrompidas. Seu histórico e a permissão Android serão preservados. Deseja continuar?', [{
          text: 'Cancelar',
          style: 'cancel'
        }, {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => alterarMonitoramento(false, sessao)
        }]);
      } else {
        await alterarMonitoramento(true, sessao);
      }
    } catch {
      // Logout/troca de usuário invalida inclusive confirmações ainda abertas.
    }
  }
  async function alterarMemoria(value) {
    if (loadingMemory || memoryActionLoading || alterandoMemoria.current) return;
    alterandoMemoria.current = true;
    let sessao;
    try {
      sessao = await tokenStorage.captureSession();
      if (!sessao) return;
      validarSessao(sessao);
      setMemoryActionLoading(true);
      setMemoryError('');
      setMemorySuccess('');
      await registrarConsentimento('IA_MEMORIA', value, {
        usageMonitoringSessionId: sessao.id,
        signal: sessao.signal
      });
      validarSessao(sessao);
      setMemoryEnabled(value);
      setMemorySuccess(value ? 'Memória da IA ativada.' : 'Memória da IA revogada.');
      if (value) await carregarEstadoMemoria(true);
    } catch (error) {
      logErroPermissoes(error, 'POST', '/consentimento', 'registrar_IA_MEMORIA');
      if (montado.current && !sessao?.signal?.aborted) {
        setMemoryError('Não foi possível alterar a memória da IA.');
      }
    } finally {
      alterandoMemoria.current = false;
      setMemoryActionLoading(false);
    }
  }
  function handleToggleMemory(value) {
    if (loadingMemory || !consentimentosDisponiveis || memoryActionLoading) return;
    if (!value) {
      Alert.alert('Revogar memória da IA', 'A IA deixará de consultar e salvar memórias. Suas memórias existentes poderão ser excluídas.', [{
        text: 'Cancelar',
        style: 'cancel'
      }, {
        text: 'Revogar',
        style: 'destructive',
        onPress: () => alterarMemoria(false)
      }]);
      return;
    }
    alterarMemoria(true);
  }
  async function alterarPersonalizacao(value) {
    if (personalizationActionLoading || alterandoPersonalizacao.current) return;
    alterandoPersonalizacao.current = true;
    let sessao;
    try {
      sessao = await tokenStorage.captureSession();
      if (!sessao) return;
      validarSessao(sessao);
      setPersonalizationActionLoading(true);
      await registrarConsentimento('IA_PERSONALIZACAO', value, {
        usageMonitoringSessionId: sessao.id,
        signal: sessao.signal
      });
      validarSessao(sessao);
      setPersonalizationEnabled(value);
    } catch (error) {
      logErroPermissoes(error, 'POST', '/consentimento', 'registrar_IA_PERSONALIZACAO');
      if (!sessao) {
        setMemoryError('Nao foi possivel alterar as recomendacoes personalizadas.');
        return;
      }
      if (montado.current && !sessao.signal.aborted) setMemoryError('Não foi possível alterar as recomendações personalizadas.');
    } finally {
      alterandoPersonalizacao.current = false;
      setPersonalizationActionLoading(false);
    }
  }
  function handleTogglePersonalizacao(value) {
    if (loadingMemory || !consentimentosDisponiveis || personalizationActionLoading) return;
    if (!value) {
      Alert.alert('Revogar recomendações personalizadas', 'Novas recomendações personalizadas deixarão de ser geradas.', [{
        text: 'Cancelar',
        style: 'cancel'
      }, {
        text: 'Revogar',
        style: 'destructive',
        onPress: () => alterarPersonalizacao(false)
      }]);
      return;
    }
    alterarPersonalizacao(true);
  }
  async function alterarProatividade(value) {
    if (proactivityActionLoading || alterandoProatividade.current) return;
    alterandoProatividade.current = true;
    let sessao;
    try {
      sessao = await tokenStorage.captureSession();
      if (!sessao) return;
      validarSessao(sessao);
      setProactivityActionLoading(true);
      await registrarConsentimento('IA_PROATIVIDADE', value, {
        usageMonitoringSessionId: sessao.id,
        signal: sessao.signal
      });
      validarSessao(sessao);
      setProactivityEnabled(value);
      setMemorySuccess(value ? 'Conversas proativas ativadas.' : 'Conversas proativas revogadas.');
    } catch (error) {
      logErroPermissoes(error, 'POST', '/consentimento', 'registrar_IA_PROATIVIDADE');
      if (!sessao) {
        setMemoryError('Nao foi possivel alterar as conversas proativas.');
        return;
      }
      if (montado.current && !sessao.signal.aborted) setMemoryError('Nao foi possivel alterar as conversas proativas.');
    } finally {
      alterandoProatividade.current = false;
      setProactivityActionLoading(false);
    }
  }
  function handleToggleProatividade(value) {
    if (loadingMemory || !consentimentosDisponiveis || proactivityActionLoading) return;
    if (!value) {
      Alert.alert('Revogar conversas proativas', 'A Plenna deixara de iniciar novas conversas automaticamente. Historicos existentes continuarao acessiveis.', [{
        text: 'Cancelar',
        style: 'cancel'
      }, {
        text: 'Revogar',
        style: 'destructive',
        onPress: () => alterarProatividade(false)
      }]);
      return;
    }
    alterarProatividade(true);
  }
  const statusMonitoramento = loadingTracking ? 'Verificando...' : !trackingStatusKnown ? 'Temporariamente indisponível' : !trackingEnabled ? 'Desativado' : nativeAvailable !== true || !usagePermissionKnown ? 'Temporariamente indisponível' : !usageAccessEnabled || monitoringStatus === 'PERMISSION_REQUIRED' ? 'Permissão necessária' : usageMonitoringEnabled && ['CHECKING', 'CONSENT_REQUIRED', 'SERVICE_DISABLED', 'SERVICE_UNAVAILABLE', 'SOURCE_UNAVAILABLE', 'STATUS_UNAVAILABLE', 'ERROR', 'DISABLED'].includes(monitoringStatus) ? 'Temporariamente indisponível' : monitoringStatus === 'ACTIVATION_REQUIRED' ? 'Ativação necessária' : monitoringStatus === 'CONTROLLED_PAUSE' ? 'Atualizações pausadas' : 'Ativado';
  const aguardandoAtualizacao = statusMonitoramento === 'Ativado' && usageMonitoringEnabled && ['PENDING', 'SYNCING'].includes(monitoringStatus);
  return <ProfileCard title="Permissões">
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            Captura via e-mail
          </Text>

          <Text style={styles.sub}>
            Importar compras automaticamente
          </Text>

          <Text style={styles.status}>
            {emailEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </View>

        <Switch value={emailEnabled} onValueChange={handleToggleEmail} trackColor={{
        false: 'rgba(131, 111, 226, 0.25)',
        true: '#A9A2F1'
      }} thumbColor={emailEnabled ? '#4652A4' : '#F4F3F4'} ios_backgroundColor="rgba(131, 111, 226, 0.25)" />
      </View>

      <View style={styles.monitoringSection}>
        <View style={styles.monitoringHeader}>
          <Text style={[styles.text, styles.monitoringTitle]}>Tempo em aplicativos</Text>
          <Switch accessibilityLabel="Tempo em aplicativos" accessibilityHint="Autoriza ou interrompe novas coletas; preserva o histórico" value={trackingEnabled} onValueChange={handleToggleTracking} disabled={loadingTracking || !trackingStatusKnown} trackColor={{
          false: 'rgba(131, 111, 226, 0.25)',
          true: '#A9A2F1'
        }} thumbColor={trackingEnabled ? '#4652A4' : '#F4F3F4'} ios_backgroundColor="rgba(131, 111, 226, 0.25)" />
        </View>
        <Text style={styles.sub}>Acompanhe seus hábitos de uso em aplicativos de compras.</Text>
        <Text style={styles.monitoringStatus} accessibilityLiveRegion="polite">{statusMonitoramento}</Text>
        {aguardandoAtualizacao && <Text style={styles.sub}>Aguardando atualização dos dados.</Text>}
        {!loadingTracking && statusMonitoramento === 'Temporariamente indisponível' && <Pressable accessibilityRole="button" style={styles.monitoringAction} onPress={carregarEstadoMonitoramento}><Text style={styles.monitoringLink}>Verificar novamente</Text></Pressable>}
        {!loadingTracking && trackingStatusKnown && trackingEnabled && nativeAvailable === true && usagePermissionKnown && (!usageAccessEnabled || monitoringStatus === 'PERMISSION_REQUIRED') && <Pressable accessibilityRole="button" style={styles.monitoringAction} onPress={async () => {
        try {
          const session = await tokenStorage.captureSession();
          if (!session) return;
          validarSessao(session);
          await openUsageAccessSettings();
        } catch {}
      }}><Text style={styles.monitoringLink}>Permitir no Android</Text></Pressable>}
        {UsageMonitoringControls ? <UsageMonitoringControls consent={trackingStatusKnown && trackingEnabled} permission={usagePermissionKnown && usageAccessEnabled} statusRevision={monitoringRevision} onStatusChange={setMonitoringStatus} /> : <ReadingDetails label="Privacidade e dados" presentation="sheet">
            <Text style={styles.sub}>Opcional. O PLENNA consulta os aplicativos de compras monitorados somente enquanto está aberto. O Android pode fornecer dados incompletos e não identifica quem utilizou o aparelho.</Text>
            <Text style={styles.sub}>Desativar interrompe novas coletas, preserva o histórico e não revoga a permissão Android. Você pode revogar essa permissão nas configurações de acesso aos dados de uso do Android.</Text>
            <Text style={styles.sub}>Os dados descrevem hábitos de uso; não comprovam compra ou intenção.</Text>
          </ReadingDetails>}
      </View>

      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Recomendações personalizadas</Text>
          <Text style={styles.sub}>Permitir sugestões baseadas nos seus dados financeiros</Text>
          <Text style={styles.status}>{loadingMemory ? 'Verificando...' : personalizationEnabled ? 'Recomendações autorizadas' : 'Recomendações desativadas'}</Text>
        </View>
        <Switch value={personalizationEnabled} onValueChange={handleTogglePersonalizacao} disabled={loadingMemory || !consentimentosDisponiveis || personalizationActionLoading} trackColor={{
        false: 'rgba(131, 111, 226, 0.25)',
        true: '#A9A2F1'
      }} thumbColor={personalizationEnabled ? '#4652A4' : '#F4F3F4'} ios_backgroundColor="rgba(131, 111, 226, 0.25)" />
      </View>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Conversas proativas</Text>
          <Text style={styles.sub}>Permitir que a Plenna inicie uma conversa sobre uma recomendacao relevante</Text>
          <Text style={styles.status}>{loadingMemory ? 'Verificando...' : proactivityEnabled ? 'Conversas autorizadas' : 'Conversas desativadas'}</Text>
        </View>
        <Switch value={proactivityEnabled} onValueChange={handleToggleProatividade} disabled={loadingMemory || !consentimentosDisponiveis || proactivityActionLoading} trackColor={{
        false: 'rgba(131, 111, 226, 0.25)',
        true: '#A9A2F1'
      }} thumbColor={proactivityEnabled ? '#4652A4' : '#F4F3F4'} ios_backgroundColor="rgba(131, 111, 226, 0.25)" />
      </View>
      <View style={styles.memorySection}>
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>Memória da IA</Text>
            <Text style={styles.sub}>Permitir que a Plenna lembre informações relevantes identificadas durante suas conversas.</Text>
            <Text style={styles.status}>
              {loadingMemory ? 'Verificando...' : memoryEnabled ? 'Memória autorizada' : 'Memória desativada'}
            </Text>
          </View>
          <Switch value={memoryEnabled} onValueChange={handleToggleMemory} disabled={loadingMemory || !consentimentosDisponiveis || memoryActionLoading} trackColor={{
          false: 'rgba(131, 111, 226, 0.25)',
          true: '#A9A2F1'
        }} thumbColor={memoryEnabled ? '#4652A4' : '#F4F3F4'} ios_backgroundColor="rgba(131, 111, 226, 0.25)" />
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{
        disabled: !memoryEnabled || loadingMemory || !consentimentosDisponiveis
      }} onPress={() => navigation.navigate('MemoryList')} disabled={!memoryEnabled || loadingMemory || !consentimentosDisponiveis} style={[styles.memoryButton, (!memoryEnabled || loadingMemory || !consentimentosDisponiveis) && styles.memoryButtonDisabled]}>
          <Text style={styles.memoryButtonText}>Consultar minhas memórias</Text>
        </Pressable>
        {memoryError ? <Text style={styles.memoryError}>{memoryError}</Text> : null}
        {memorySuccess ? <Text style={styles.memorySuccess}>{memorySuccess}</Text> : null}
      </View>
      <Text style={styles.warning}>
        Desativar permissões pode reduzir funcionalidades do app
      </Text>
    </ProfileCard>;
}
