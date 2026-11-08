import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatarValorMeta, formatarPercentualMeta } from '../../../utils/metaMoney';
import { COLORS } from '../../../constants';
import MetaProgressBar from '../MetaProgressBar';
import CustomButton from '../../CustomButton';
import styles from './styles';

const Icon = typeof MaterialCommunityIcons === 'undefined' ? View : MaterialCommunityIcons;

function getMetaName(meta) {
  return meta?.nome ?? meta?.meta_titulo ?? 'Meta sem título';
}

function getMetaValue(meta) {
  return meta?.valor ?? meta?.meta_valor;
}

function getMetaProgress(meta) {
  return meta?.progressoPercentual ?? meta?.progresso_percentual;
}

function isCompleted(meta) {
  return meta?.concluida === true || meta?.meta_completado === true;
}

function formatarValorExibicao(value) {
  return formatarValorMeta(value) || 'Valor não informado';
}

export default function MetaSummaryCard({ meta, onOpen, onToggleComplete }) {
  const nome = getMetaName(meta);
  const completed = isCompleted(meta);
  const percent = formatarPercentualMeta(getMetaProgress(meta));

  function handleToggle(event) {
    event?.stopPropagation?.();
    onToggleComplete?.(meta);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir detalhes da meta ${nome}`}
      onPress={() => onOpen?.(meta)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="target" size={20} color={COLORS.metaProgressFill} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>{nome}</Text>
          {completed ? <View style={[styles.statusBadge, styles.completedBadge]}>
            <View style={[styles.statusDot, styles.completedDot]} />
            <Text style={[styles.statusText, styles.completedText]}>Concluída</Text>
          </View> : null}
        </View>
        {onToggleComplete ? (
          <CustomButton
            title={completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}
            accessibilityLabel={completed ? `Desmarcar meta ${nome} como concluída` : `Marcar meta ${nome} como concluída`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed }}
            variant="ghost"
            icon={completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
            iconOnly
            onPress={handleToggle}
            style={[styles.completeButton, completed && styles.completeButtonActive]}
          />
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Objetivo</Text>
          <Text style={styles.value}>{formatarValorExibicao(getMetaValue(meta))}</Text>
        </View>
        <View style={styles.progressDetail}>
          <Text style={styles.detailLabel}>Progresso</Text>
          <Text style={styles.progressValue}>{percent}</Text>
        </View>
      </View>

      <MetaProgressBar value={getMetaProgress(meta)} accessibilityLabel={`Progresso da meta: ${percent}`} />
    </Pressable>
  );
}
