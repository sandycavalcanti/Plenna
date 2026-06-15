import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export default StyleSheet.create({
  header: {
    width: '95%',
    marginBottom: 20,
  },

  logo: {
    width: 140,
    height: 140,
  },
  stepTwoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    justifyContent: 'center',
    flexGrow: 1,
  },
  titulo: {
    fontFamily: 'SugoDisplay',
    fontSize: 52,
    color: COLORS.cadTitulo,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6F6570',
    lineHeight: 20,
  },
  borderOverlay: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: COLORS.cadCaixaPreferenciasBorda,
    width: '95%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  fieldHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
  stepTwoExtraFields: {
    marginBottom: 8,
  },
  stepTwoFieldCard: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepTwoFieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.cadCaixaPreferenciasTitulo,
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  stepTwoFieldInput: {
    height: 40,
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: COLORS.cadCheckboxTexto,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  stepTwoHelperText: {
    color: '#7A6E78',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: -1,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  stepTwoErrorText: {
    width: '95%',
    color: COLORS.loginEsqueciSenha,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'left',
  },
  segmentAction: {
    marginTop: 16,
    marginBottom: 16,
  },
  segmentActionText: {
    color: COLORS.cadTextoAdicionarLimites,
    fontSize: 15,
    textAlign: 'center',
  },
  pressableFecharModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.cadFundo,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: '70%',
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E2A2E',
    marginBottom: 6,
  },
  questionSubtitle: {
    color: '#6F6570',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 18,
  },
  viewModalCarregando: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriaNomeTouchable: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3E8',
  },
  categoriaNome: {
    fontSize: 15,
    color: '#3A3538',
    fontWeight: '500',
  },
  avisoNenhumaCategoria: {
    fontSize: 13,
    color: '#9A8F98',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  textoFecharModalTouchable: {
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E3E8',
  },
  textoFecharModal: {
    fontSize: 15,
    color: COLORS.cadTextoAdicionarLimites,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsRow: {
    width: '95%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#D6C0D6',
  },
  submitButton: {
    flex: 1,
  },
});
