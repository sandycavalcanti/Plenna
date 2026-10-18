import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: 18,
    marginVertical: 10,
    overflow: 'visible',
  },

  statsScroll: {
    flexGrow: 0,
  },

  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 10,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'visible',
    minWidth: 220,
  },

  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  statContent: {
    flex: 1,
    justifyContent: 'center',
  },

  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6578',
    marginBottom: 5,
    letterSpacing: 0.3,
  },

  statValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2F356B',
    marginBottom: 5,
    letterSpacing: -0.5,
  },

  statSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    color: '#8B2863',
  },

  coverageNote: { fontSize: 12, color: '#655A70', lineHeight: 18, paddingHorizontal: 5 },
  notesButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 5 },
  notesLink: { color: '#893467', fontSize: 13, fontWeight: '600' },
  monthTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.perfilProfileCardTitulo,
    marginBottom: 8,
  },
});
