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
} from 'react-native';

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

export default function Permissions({ data }) {
  const [emailEnabled, setEmailEnabled] = useState(
    data?.email ?? true
  );

  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [usageAccessEnabled, setUsageAccessEnabled] = useState(false);
  const [loadingTracking, setLoadingTracking] = useState(true);

  const montado = useRef(false);
  const alterando = useRef(false);
  const consulta = useRef(0);

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

  useEffect(() => {
    montado.current = true;
    let removerCancelamento;
    tokenStorage.captureSession().then(sessao => {
      if (!sessao || !montado.current) return;
      const limpar = () => {
        consulta.current++;
        setTrackingEnabled(false);
        setUsageAccessEnabled(false);
        setLoadingTracking(false);
      };
      if (sessao.signal.aborted) limpar();
      else {
        sessao.signal.addEventListener('abort', limpar);
        removerCancelamento = () => sessao.signal.removeEventListener('abort', limpar);
      }
    }).catch(() => {});
    carregarEstadoMonitoramento();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') carregarEstadoMonitoramento();
    });
    return () => {
      montado.current = false;
      consulta.current++;
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
    </ProfileCard>
  );
}
