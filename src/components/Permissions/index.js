/**
 * Arquivo: Permissions/index.js
 * Descrição: Componente responsável por gerenciar as permissões do usuário,
 * permitindo ativar ou desativar funcionalidades como captura por e-mail
 * e monitoramento de comportamento.
 * Autor: Marina Souza
 * Última atualização: 20/04/2026
 */

//Importações necessárias para o componente
import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import ProfileCard from '../ProfileCard';
import styles from './styles';

/**
 * Componente: Permissions
 * Responsabilidade: Controlar permissões do usuário com confirmação
 * para ações que impactam funcionalidades do sistema
 */
export default function Permissions({ data }) {

  // Estado responsável por controlar a captura via e-mail
  const [emailEnabled, setEmailEnabled] = useState(data?.email ?? true);

  // Estado responsável por controlar o monitoramento do dispositivo
  const [trackingEnabled, setTrackingEnabled] = useState(data?.tracking ?? true);

  /**
   * Manipula a alteração da permissão de e-mail
   * Exibe alerta de confirmação ao desativar
   */
  function handleToggleEmail(value) {
    if (!value) {
      Alert.alert(
        'Desativar captura por e-mail',
        'Você pode perder a coleta automática de compras. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => setEmailEnabled(false) }
        ]
      );
    } else {
      setEmailEnabled(true);
    }
  }

  /**
   * Manipula a alteração da permissão de monitoramento
   * Exibe alerta de confirmação ao desativar
   */
  function handleToggleTracking(value) {
    if (!value) {
      Alert.alert(
        'Desativar monitoramento',
        'Sem isso, o app perde automação e análise de comportamento. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => setTrackingEnabled(false) }
        ]
      );
    } else {
      setTrackingEnabled(true);
    }
  }

  return (
    // Card principal de permissões
    <ProfileCard title="Permissões" onEdit={() => {}}>

      {/* Permissão: Captura via e-mail */}
      <View style={styles.row}>
        <View>
          <Text style={styles.text}>
            Captura via e-mail
          </Text>

          <Text style={styles.sub}>
            Importa compras automaticamente
          </Text>
        </View>

        <Switch
          value={emailEnabled}
          onValueChange={handleToggleEmail}
        />
      </View>

      {/* Permissão: Monitoramento do celular */}
      <View style={styles.row}>
        <View>
          <Text style={styles.text}>
            Monitoramento do celular
          </Text>

          <Text style={styles.sub}>
            Analisa comportamento de consumo
          </Text>
        </View>

        <Switch
          value={trackingEnabled}
          onValueChange={handleToggleTracking}
        />
      </View>

      {/* Aviso sobre impacto das permissões */}
      <Text style={styles.warning}>
        Desativar permissões pode reduzir funcionalidades do app
      </Text>

    </ProfileCard>
  );
}