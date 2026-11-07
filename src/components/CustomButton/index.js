import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { styles } from './styles';

export const BUTTON_VARIANTS = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  OUTLINE: 'outline',
  DANGER: 'danger',
  GHOST: 'ghost',
});

const textStyles = {
  primary: styles.primaryText,
  secondary: styles.secondaryText,
  outline: styles.outlineText,
  danger: styles.dangerText,
  ghost: styles.ghostText,
};

const activityColors = {
  primary: COLORS.buttonPrimaryText,
  secondary: COLORS.buttonSecondaryText,
  outline: COLORS.buttonOutlineText,
  danger: COLORS.buttonDangerText,
  ghost: COLORS.buttonGhostText,
};

export default function CustomButton({
  title,
  onPress,
  style,
  disabled = false,
  loading = false,
  icon = null,
  iconOnly = false,
  fullWidth = false,
  variant = BUTTON_VARIANTS.PRIMARY,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
}) {
  const resolvedVariant = Object.values(BUTTON_VARIANTS).includes(String(variant).toLowerCase())
    ? String(variant).toLowerCase()
    : BUTTON_VARIANTS.PRIMARY;
  const isDisabled = disabled || loading;
  const label = accessibilityLabel || title;
  const iconNode = typeof icon === 'string'
    ? <MaterialCommunityIcons name={icon} size={iconOnly ? 20 : 18} color={isDisabled ? COLORS.buttonDisabledText : activityColors[resolvedVariant]} />
    : icon;

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: Boolean(loading) }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`${resolvedVariant}Button`],
        pressed && styles[`${resolvedVariant}Pressed`],
        fullWidth && styles.fullWidth,
        iconOnly && styles.iconOnly,
        isDisabled && styles.disabledButton,
        style,
      ]}
    >
      <View style={styles.content}>
        {iconNode ? <View style={styles.icon}>{iconNode}</View> : null}
        {iconOnly ? null : <Text style={[styles.buttonText, textStyles[resolvedVariant], isDisabled && styles.disabledText, loading && styles.loadingText]} numberOfLines={2}>{title}</Text>}
        {loading ? <ActivityIndicator accessibilityLabel="Carregando" size="small" color={isDisabled ? COLORS.buttonDisabledText : activityColors[resolvedVariant]} style={styles.loadingIndicator} /> : null}
      </View>
    </Pressable>
  );
}
