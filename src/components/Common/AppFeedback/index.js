import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import styles from './styles';

const FEEDBACK_TYPES = {
  success: {
    icon: 'check-circle-outline',
    backgroundColor: COLORS.buttonPositiveBackground,
    borderColor: COLORS.buttonPositiveText,
    iconColor: COLORS.buttonPositiveText,
    textColor: COLORS.buttonPositiveText,
  },
  error: {
    icon: 'alert-circle-outline',
    backgroundColor: COLORS.buttonDangerBackground,
    borderColor: COLORS.buttonDangerBorder,
    iconColor: COLORS.buttonDangerText,
    textColor: COLORS.buttonDangerText,
  },
  warning: {
    icon: 'alert-outline',
    backgroundColor: COLORS.cadCaixaPreferenciasFundo,
    borderColor: COLORS.cadCaixaPreferenciasBorda,
    iconColor: COLORS.cadCaixaPreferenciasValorTexto,
    textColor: COLORS.cadCaixaPreferenciasValorTexto,
  },
  info: {
    icon: 'information-outline',
    backgroundColor: COLORS.buttonSecondaryBackground,
    borderColor: COLORS.buttonOutlineBorder,
    iconColor: COLORS.buttonSecondaryText,
    textColor: COLORS.buttonSecondaryText,
  },
};

export default function AppFeedback({ message, type = 'info', onDismiss, actionLabel, onAction, testID }) {
  if (!message) return null;

  const appearance = FEEDBACK_TYPES[type] || FEEDBACK_TYPES.info;
  const isAlert = type === 'error' || type === 'warning';

  return (
    <View
      testID={testID}
      style={[styles.container, {
        backgroundColor: appearance.backgroundColor,
        borderColor: appearance.borderColor,
      }]}
      accessibilityRole={isAlert ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
    >
      <MaterialCommunityIcons name={appearance.icon} size={20} color={appearance.iconColor} accessible={false} />
      <Text style={[styles.message, { color: appearance.textColor }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={[styles.actionText, { color: appearance.textColor }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar mensagem"
          hitSlop={8}
          onPress={onDismiss}
          style={styles.dismiss}
        >
          <MaterialCommunityIcons name="close" size={18} color={appearance.textColor} accessible={false} />
        </Pressable>
      ) : null}
    </View>
  );
}

export { FEEDBACK_TYPES };
