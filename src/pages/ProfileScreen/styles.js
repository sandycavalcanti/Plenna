import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.fundoPrincipal,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  accountActionWrapper: {
    position: 'relative',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  accountActionButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  accountDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    minWidth: 182,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.chatContainerEnviarSombra,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    paddingVertical: 6,
  },
  accountDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accountDropdownText: {
    color: COLORS.cadTitulo,
    fontSize: 14,
    fontWeight: '600',
  },
  accountDropdownTextDanger: {
    color: COLORS.buttonDangerText,
  },
  accountDropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  securitySection: {
    marginTop: 4,
    marginBottom: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  securityTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  securityHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },
  securityIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.buttonSecondaryBackground,
  },
  securityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  securityCopy: {
    flex: 1,
    minWidth: 0,
  },
  securityActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cadTitulo,
  },
  securityActionDescription: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.dadoUm,
  },
  pinFallback: {
    width: 'auto',
    alignSelf: 'center',
    marginBottom: 10,
  },
});
