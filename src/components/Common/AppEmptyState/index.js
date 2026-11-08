import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../../CustomButton';
import { COLORS } from '../../../constants/colors';
import styles from './styles';

export default function AppEmptyState({
  icon = 'information-outline',
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  circleIcon = false,
  style,
}) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      <View style={[styles.iconWrap, compact && styles.compactIconWrap, circleIcon && styles.circleIconWrap]}>
        <MaterialCommunityIcons name={icon} size={compact ? 20 : 24} color={COLORS.dadoUm} accessible={false} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? <CustomButton title={actionLabel} variant="outline" onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}
