/**
 * Arquivo: Permissions/index.js
 * Descrição: Componente responsável por gerenciar as permissões do usuário,
 * permitindo ativar ou desativar funcionalidades como captura por e-mail
 * e monitoramento de comportamento.
 * Autor: Marina Souza
 * Última atualização: 13/09/2026
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Switch,
  Alert,
  AppState,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ProfileCard from '../ProfileCard';
import styles from './styles';

import {
  getModuleStatus,
  hasUsageAccess,
  openUsageAccessSettings,
} from '../../../../modules/plenna-usage-stats';

import {
  listarConsentimentos,
  registrarConsentimento,
} from '../../../api/consentimento';

import { tokenStorage } from '../../../api/tokenStorage';
import { logApiErrors } from '../../../utils/error';

function logErroMonitoramento(error, texto) {
  if (!__DEV__) return;

  const statusOriginal = error && typeof error === 'object'
    ? error.response?.status
    : undefined;

  const codigoOriginal = error && typeof error === 'object'
    ? error.code
    : undefined;

  const status = Number.isInteger(statusOriginal) &&
    statusOriginal >= 400 &&
    statusOriginal <= 599
    ? statusOriginal
    : undefined;

  const codigosPermitidos = new Set([
    'ERR_BAD_REQUEST',
    'ERR_BAD_RESPONSE',
    'ERR_NETWORK',
  ]);

  const codigo = typeof codigoOriginal === 'string' &&
    codigosPermitidos.has(codigoOriginal)
    ? codigoOriginal
    : undefined;

  const erroSeguro = {
    code: codigo,
    response: {
      status,
      data: {
        message: 'Não foi possível concluir a operação de monitoramento.',
      },
    },
  };

  logApiErrors(erroSeguro, texto);
}

function logErroPermissoes(error, metodo, caminho, operacao) {
  if (!__DEV__) return;
  const statusOriginal = error?.response?.status;
  const codigoOriginal = error?.code;
  const status = Number.isInteger(statusOriginal) && statusOriginal >= 100 && statusOriginal <= 599
    ? statusOriginal
    : null;
  const codigo = ['ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'ERR_NETWORK', 'ECONNABORTED'].includes(codigoOriginal)
    ? codigoOriginal
    : null;
  const categoria = status === 401
    ? 'AUTENTICACAO'
    : status === 403
      ? 'AUTORIZACAO'
      : status !== null && status >= 500
        ? 'SERVIDOR'
        : codigo === 'ERR_NETWORK'
          ? 'REDE'
          : status === 400
            ? 'CONTRATO'
            : 'DESCONHECIDA';
  logApiErrors({
    code: codigo,
    response: { status, data: { message: 'Falha segura na API de permissões.' } },
  }, 'Erro de integração de permissões:', true, {
    operacao,
    metodo,
    caminho,
    status,
    ambiente: __DEV__ ? 'desenvolvimento' : 'producao',
    categoria,
  });
}

export default function Permissions({ data }) {
  const navigation = useNavigation();
  const [emailEnabled, setEmailEnabled] = useState(
    data?.email ?? true
  );

  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [usageAccessEnabled, setUsageAccessEnabled] = useState(false);
  const [loadingTracking, setLoadingTracking] = useState(true);
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
      const [consentimentos, usageAccess, modulo] = await Promise.all([
        listarConsentimentos({ rf017SessionId: sessao.id, signal: sessao.signal }),
        hasUsageAccess(),
        getModuleStatus(),
      ]);
      validarSessao(sessao);
      if (numero !== consulta.current) return;
      setTrackingEnabled(consentimentos.some(item =>
        (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo)
          === 'MONITORAMENTO_TEMPO_USO' && item.consentimento_status === true));
      setUsageAccessEnabled(usageAccess === true);

    } catch (error) {
       logErroMonitoramento(error, 'Erro ao carregar monitoramento:');

       if (montado.current && numero === consulta.current) {
        setTrackingEnabled(false);
        setUsageAccessEnabled(false);
      }
    } finally {
      if (montado.current && numero === consulta.current) setLoadingTracking(false);
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
        rf017SessionId: sessao.id,
        signal: sessao.signal,
      });
      validarSessao(sessao);
      if (numero !== consultaMemoria.current) return;
      setConsentimentosDisponiveis(true);
      const ativo = consentimentos.some(item =>
        (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo)
          === 'IA_MEMORIA' && item.consentimento_status === true);
      const personalizacaoAtiva = consentimentos.some(item =>
        (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo)
          === 'IA_PERSONALIZACAO' && item.consentimento_status === true);
      const proatividadeAtiva = consentimentos.some(item =>
        (item?.tb_consentimento_tipo?.consentimento_tipo_codigo ?? item?.consentimento_tipo_codigo)
          === 'IA_PROATIVIDADE' && item.consentimento_status === true);
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
        setUsageAccessEnabled(false);
        setLoadingTracking(false);
        setMemoryEnabled(false);
        setPersonalizationEnabled(false);
        setProactivityEnabled(false);
        setConsentimentosDisponiveis(false);
        setLoadingMemory(false);
      };
      if (sessao.signal.aborted) limpar();
      else {
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
      await registrarConsentimento('MONITORAMENTO_TEMPO_USO', value, {
        rf017SessionId: sessao.id,
      });
      validarSessao(sessao);
      setTrackingEnabled(value);
      const permitido = await hasUsageAccess();
      validarSessao(sessao);
      setUsageAccessEnabled(permitido === true);
      if (value && !permitido) {
        Alert.alert('Permissão necessária',
          'Para medir o tempo de uso dos aplicativos de compra, o PLENNA precisa do Acesso aos dados de uso do Android.', [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: async () => {
              try {
                validarSessao(sessao);
                const abriu = await openUsageAccessSettings();
                validarSessao(sessao);
                if (!abriu) Alert.alert('Erro', 'Não foi possível abrir as configurações do Android.');
              } catch {
                // Uma sessão antiga não deve abrir configurações ou atualizar a tela.
              }
            } },
          ]);
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
        Alert.alert('Desativar monitoramento',
          'O PLENNA deixará de coletar e sincronizar o tempo de uso dos aplicativos de compra. Deseja continuar?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', style: 'destructive', onPress: () => alterarMonitoramento(false, sessao) },
          ]);
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
        rf017SessionId: sessao.id,
        signal: sessao.signal,
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
      Alert.alert(
        'Revogar memória da IA',
        'A IA deixará de consultar e salvar memórias. Suas memórias existentes poderão ser excluídas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Revogar', style: 'destructive', onPress: () => alterarMemoria(false) },
        ],
      );
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
      await registrarConsentimento('IA_PERSONALIZACAO', value, { rf017SessionId: sessao.id, signal: sessao.signal });
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
      Alert.alert('Revogar recomendações personalizadas', 'Novas recomendações personalizadas deixarão de ser geradas.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revogar', style: 'destructive', onPress: () => alterarPersonalizacao(false) },
      ]);
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
      await registrarConsentimento('IA_PROATIVIDADE', value, { rf017SessionId: sessao.id, signal: sessao.signal });
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
      Alert.alert('Revogar conversas proativas', 'A Plenna deixara de iniciar novas conversas automaticamente. Historicos existentes continuarao acessiveis.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revogar', style: 'destructive', onPress: () => alterarProatividade(false) },
      ]);
      return;
    }
    alterarProatividade(true);
  }

  const statusMonitoramento = loadingTracking
    ? 'Verificando...'
    : trackingEnabled
      ? usageAccessEnabled
        ? 'Monitoramento autorizado'
        : 'Acesso aos dados de uso pendente'
      : 'Monitoramento desativado';

  return (
    <ProfileCard title="Permissões">
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            Captura via e-mail
          </Text>

          <Text style={styles.sub}>
            Importar compras automaticamente
          </Text>
        </View>

        <Switch
          value={emailEnabled}
          onValueChange={handleToggleEmail}
          trackColor={{
            false: 'rgba(131, 111, 226, 0.25)',
            true: '#A9A2F1',
          }}
          thumbColor={
            emailEnabled
              ? '#4652A4'
              : '#F4F3F4'
          }
          ios_backgroundColor="rgba(131, 111, 226, 0.25)"
        />
      </View>

      <View
        style={[
          styles.row,
          styles.lastRow,
        ]}
      >
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            Monitoramento do celular
          </Text>

          <Text style={styles.sub}>
            Analisar tempo de uso em aplicativos de compra
          </Text>

          <Text style={styles.status}>
            {statusMonitoramento}
          </Text>
        </View>

        <Switch
          value={trackingEnabled}
          onValueChange={handleToggleTracking}
          disabled={loadingTracking}
          trackColor={{
            false: 'rgba(131, 111, 226, 0.25)',
            true: '#A9A2F1',
          }}
          thumbColor={
            trackingEnabled
              ? '#4652A4'
              : '#F4F3F4'
          }
          ios_backgroundColor="rgba(131, 111, 226, 0.25)"
        />
      </View>

      <Text style={styles.warning}>
        Desativar permissões pode reduzir funcionalidades do app
      </Text>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Recomendações personalizadas</Text>
          <Text style={styles.sub}>Permitir sugestões baseadas nos seus dados financeiros</Text>
          <Text style={styles.status}>{loadingMemory ? 'Verificando...' : personalizationEnabled ? 'Recomendações autorizadas' : 'Recomendações desativadas'}</Text>
        </View>
        <Switch
          value={personalizationEnabled}
          onValueChange={handleTogglePersonalizacao}
          disabled={loadingMemory || !consentimentosDisponiveis || personalizationActionLoading}
          trackColor={{ false: 'rgba(131, 111, 226, 0.25)', true: '#A9A2F1' }}
          thumbColor={personalizationEnabled ? '#4652A4' : '#F4F3F4'}
          ios_backgroundColor="rgba(131, 111, 226, 0.25)"
        />
      </View>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Conversas proativas</Text>
          <Text style={styles.sub}>Permitir que a Plenna inicie uma conversa sobre uma recomendacao relevante</Text>
          <Text style={styles.status}>{loadingMemory ? 'Verificando...' : proactivityEnabled ? 'Conversas autorizadas' : 'Conversas desativadas'}</Text>
        </View>
        <Switch
          value={proactivityEnabled}
          onValueChange={handleToggleProatividade}
          disabled={loadingMemory || !consentimentosDisponiveis || proactivityActionLoading}
          trackColor={{ false: 'rgba(131, 111, 226, 0.25)', true: '#A9A2F1' }}
          thumbColor={proactivityEnabled ? '#4652A4' : '#F4F3F4'}
          ios_backgroundColor="rgba(131, 111, 226, 0.25)"
        />
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
          <Switch
            value={memoryEnabled}
            onValueChange={handleToggleMemory}
            disabled={loadingMemory || !consentimentosDisponiveis || memoryActionLoading}
            trackColor={{ false: 'rgba(131, 111, 226, 0.25)', true: '#A9A2F1' }}
            thumbColor={memoryEnabled ? '#4652A4' : '#F4F3F4'}
            ios_backgroundColor="rgba(131, 111, 226, 0.25)"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !memoryEnabled || loadingMemory || !consentimentosDisponiveis }}
          onPress={() => navigation.navigate('MemoryList')}
          disabled={!memoryEnabled || loadingMemory || !consentimentosDisponiveis}
          style={[styles.memoryButton, (!memoryEnabled || loadingMemory || !consentimentosDisponiveis) && styles.memoryButtonDisabled]}
        >
          <Text style={styles.memoryButtonText}>Consultar minhas memórias</Text>
        </Pressable>
        {memoryError ? <Text style={styles.memoryError}>{memoryError}</Text> : null}
        {memorySuccess ? <Text style={styles.memorySuccess}>{memorySuccess}</Text> : null}
      </View>
    </ProfileCard>
  );
}
