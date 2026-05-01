import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 10,
    flexGrow: 1,
  },
  logo: {
    width: 180,
    height: 180,
  },
  titulo: {
    fontFamily: 'SugoDisplay',
    fontSize: 40,
    color: COLORS.cadTitulo,
    marginBottom: 10,
    marginTop: 5,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  segmentAction: {
    marginTop: 10,
    marginBottom: 20,
  },
  segmentActionText: {
    color: COLORS.cadTextoAdicionarLimites,
    fontSize: 18,
    textAlign: 'center',
  },
  checkboxRow: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 1,
    backgroundColor: COLORS.cadCheckboxFundo,
    marginRight: 10,
  },
  checkboxText: {
    color: COLORS.cadCheckboxTexto,
  },
  checkboxLink: {
    color: COLORS.cadCheckboxLink,
  },
  button: {
    marginTop: 15,
  },
  stepThreeContainer: {
    width: '95%',
    alignItems: 'center',
    flex: 0.95,
  },
  stepThreeTitle: {
    fontFamily: 'SugoDisplay',
    fontSize: 44,
    color: COLORS.cadTitulo,
    marginBottom: 8,
  },
  stepThreeScroll: {
    width: '100%',
  },
  stepThreeContent: {
    alignItems: 'center',
    paddingBottom: 26,
    paddingTop: 6,
  },
  questionBlock: {
    width: '95%',
    borderWidth: 2,
    borderRadius: 18,
    borderColor: COLORS.questionarioCaixaBorda,
    backgroundColor: COLORS.questionarioCaixaFundo,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 18,
    shadowColor: COLORS.questionarioCaixaSombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  questionTitle: {
    color: COLORS.questionarioCaixaTexto,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  stepThreeInput: {
    width: '100%',
    height: 44,
    backgroundColor: COLORS.questionarioTextInputFundo,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.questionarioTextInputBorda,
    paddingHorizontal: 12,
    color: COLORS.questionarioTextInputTexto,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: COLORS.questionarioOpcaoBorda,
    borderRadius: 999,
    backgroundColor: COLORS.questionarioOpcaoFundo,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionPillSelected: {
    backgroundColor: COLORS.questionarioOpcaoFundoSelecionada,
    borderColor: COLORS.questionarioOpcaoBordaSelecionada,
  },
  optionText: {
    color: COLORS.questionarioOpcaoTexto,
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: COLORS.questionarioOpcaoTextoSelecionada,
  },
  stepThreeButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  closeText: {
    fontSize: 22,
    color: COLORS.questionarioOpcaoTexto,
    fontWeight: '700',
  },
  pressableFecharModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
});
