import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import CustomButton from '../../CustomButton';
import styles from './styles';

export default function AppScreenHeader({
  icon,
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightAction = null,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {showBackButton ? (
        <CustomButton
          accessibilityLabel="Voltar"
          variant="ghost"
          icon="arrow-left"
          iconOnly
          onPress={onBackPress}
          style={styles.backButton}
        />
      ) : null}
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={23} color={COLORS.cadTitulo} />
      </View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" numberOfLines={2} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={3} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}
