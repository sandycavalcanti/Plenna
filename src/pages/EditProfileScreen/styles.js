import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cadFundo,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: COLORS.fundoPrincipal,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  heroLogo: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.cadTextoAdicionarLimites,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: 'SugoDisplay',
    fontSize: 42,
    color: COLORS.cadTitulo,
    textAlign: 'center',
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.dadoUm,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionsWrap: {
    gap: 20,
  },
  goalsIntroCard: {
    alignItems: 'center',
    backgroundColor: COLORS.fundoPrincipal,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  goalsIntroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cadTitulo,
    textAlign: 'center',
  },
  goalsIntroSubtitle: {
    fontSize: 13,
    color: COLORS.dadoUm,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionCard: {
    width: '100%',
    marginBottom: 0,
  },
  fieldBlock: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.perfilInfoLabel,
    marginBottom: 6,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionPillSelected: {
    backgroundColor: COLORS.cadCheckboxFundo,
  },
  optionText: {
    color: COLORS.cadCaixaPreferenciasTitulo,
    fontSize: 12.5,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    marginBottom: 0,
  },
  actionsRow: {
    marginTop: 6,
  },
  saveButton: {
    width: '100%',
  },
  addGoalAction: {
    marginTop: 2,
    marginBottom: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  addGoalActionText: {
    color: COLORS.cadTextoAdicionarLimites,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  goalEditorCard: {
    width: '100%',
    marginBottom: 0,
  },
  goalDescriptionInput: {
    backgroundColor: COLORS.customTextInputFundo,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // meta card
  metaCard: {
    backgroundColor: COLORS.perfilMetaFundo,
    borderWidth: 1,
    borderColor: COLORS.perfilMetaBorda,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  metaTitle: { fontSize: 16, fontWeight: '700', color: COLORS.perfilMetaTitulo },
  metaDesc: { fontSize: 13, color: COLORS.perfilInfoValor, marginTop: 6 },
  metaValue: { fontSize: 14, fontWeight: '700', color: COLORS.perfilMetaValor, marginTop: 6 },
});
