import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cadFundo,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 56,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: COLORS.fundoPrincipal,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 2,
  },
  heroMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EEF9',
    marginBottom: 10,
  },
  heroLogo: {
    width: 116,
    height: 116,
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
  metaHeroTitle: {
    fontSize: 32,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.dadoUm,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionsWrap: {
    gap: 12,
  },
  metasIntroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E1F2',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  metasIntroIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EEF9',
  },
  metasIntroCopy: {
    flex: 1,
    gap: 3,
  },
  metasIntroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cadTitulo,
  },
  metasIntroSubtitle: {
    fontSize: 12,
    color: COLORS.dadoUm,
    lineHeight: 17,
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
  addMetaAction: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: '#893467',
  },
  addMetaActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metaEditorCard: {
    width: '100%',
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9E1F2',
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  metaEditorCardCollapsed: {
    gap: 8,
    paddingBottom: 12,
  },
  metaEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaEditorTitleCopy: {
    flex: 1,
    gap: 2,
  },
  metaEditorEyebrow: {
    color: '#893467',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaEditorTitle: {
    color: '#594367',
    fontSize: 17,
    fontWeight: '800',
  },
  metaEditorActions: {
    flexDirection: 'row',
    gap: 6,
  },
  metaEditorIconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3FA',
  },
  metaEditorDeleteButton: {
    backgroundColor: '#FFF7F7',
  },
  metaCollapsedHint: {
    color: '#8F8398',
    fontSize: 12,
  },
  metaDescriptionInput: {
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
