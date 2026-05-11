import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  heroCard: {
    backgroundColor: '#F0E6F0',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  contentContainer: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F356B',
    marginBottom: 4,
    fontStyle: 'italic',
  },

  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    fontStyle: 'italic',
  },

  buttonsContainer: {
    gap: 8,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },

  primaryButton: {
    backgroundColor: COLORS.dadoDois,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.dadoDois,
  },

  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dadoDois,
  },
});
