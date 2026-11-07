import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export const styles = StyleSheet.create({
  button: {
    width: '55%',
    minHeight: 48,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconOnly: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 14,
  },
  content: {
    minHeight: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
  },
  loadingText: {
    opacity: 0,
  },
  primaryButton: {
    backgroundColor: COLORS.buttonPrimaryBackground,
  },
  primaryPressed: {
    backgroundColor: COLORS.buttonPrimaryPressed,
  },
  primaryText: {
    color: COLORS.buttonPrimaryText,
  },
  accentButton: {
    backgroundColor: COLORS.buttonAccentBackground,
  },
  accentPressed: {
    backgroundColor: COLORS.buttonAccentPressed,
  },
  accentText: {
    color: COLORS.buttonAccentText,
  },
  secondaryButton: {
    backgroundColor: COLORS.buttonSecondaryBackground,
  },
  secondaryPressed: {
    backgroundColor: COLORS.buttonSecondaryPressed,
  },
  secondaryText: {
    color: COLORS.buttonSecondaryText,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.buttonOutlineBorder,
  },
  outlinePressed: {
    backgroundColor: COLORS.buttonOutlinePressed,
  },
  outlineText: {
    color: COLORS.buttonOutlineText,
  },
  dangerButton: {
    backgroundColor: COLORS.buttonDangerBackground,
    borderWidth: 1,
    borderColor: COLORS.buttonDangerBorder,
  },
  dangerPressed: {
    backgroundColor: COLORS.buttonDangerPressed,
  },
  dangerText: {
    color: COLORS.buttonDangerText,
  },
  ghostButton: {
    backgroundColor: COLORS.buttonGhostBackground,
  },
  ghostPressed: {
    backgroundColor: COLORS.buttonGhostPressed,
  },
  ghostText: {
    color: COLORS.buttonGhostText,
  },
  disabledButton: {
    backgroundColor: COLORS.buttonDisabledBackground,
    borderColor: COLORS.buttonDisabledBackground,
  },
  disabledText: {
    color: COLORS.buttonDisabledText,
  },
  buttonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
