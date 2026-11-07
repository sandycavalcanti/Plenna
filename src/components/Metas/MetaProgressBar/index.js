import React from 'react';
import { View } from 'react-native';
import styles from './styles';

export default function MetaProgressBar({ value, accessibilityLabel }) {
  const numericValue = Number(value);
  const hasNumericValue = Number.isFinite(numericValue);
  const progress = hasNumericValue ? Math.min(100, Math.max(0, numericValue)) : 0;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel || 'Progresso da meta'}
      accessibilityValue={hasNumericValue ? { min: 0, max: 100, now: progress } : { min: 0, max: 100 }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${progress}%` }]} />
    </View>
  );
}
