import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 10,
  },

  displayedCategories: {
    gap: 10,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  cardContent: {
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F356B',
  },

  categoryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F356B',
    marginBottom: 6,
  },

  categoryPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },

  progressBarContainer: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 6,
  },

  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dadoDois,
  },

  emptyMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '500',
  },
});
