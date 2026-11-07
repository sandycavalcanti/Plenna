import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants';

export default StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(35, 24, 48, 0.34)' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 30, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { color: COLORS.cadTextoAdicionarLimites, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: COLORS.cadTitulo, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  subtitle: { color: COLORS.dadoUm, lineHeight: 19 },
  closeButton: { width: 38, minHeight: 38, borderRadius: 13, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: COLORS.buttonGhostPressed },
  field: { gap: 6 },
  label: { color: COLORS.cadTitulo, fontSize: 13, fontWeight: '800' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cadCaixaPreferenciasBorda, paddingHorizontal: 14, color: COLORS.cadTitulo, fontSize: 16, backgroundColor: COLORS.cadCaixaPreferenciasFundo },
  moneyInput: { fontSize: 18, fontWeight: '700' },
  descriptionInput: { minHeight: 84, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cadCaixaPreferenciasBorda, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.cadTitulo, fontSize: 15, lineHeight: 21, backgroundColor: COLORS.cadCaixaPreferenciasFundo },
  inputFocused: { borderColor: COLORS.buttonPrimaryBackground, backgroundColor: COLORS.customTextInputFundo },
  error: { color: COLORS.buttonDangerText, lineHeight: 19, padding: 10, borderRadius: 10, backgroundColor: COLORS.buttonDangerBackground },
  actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  actionButton: { flex: 1, width: 'auto' },
  deleteButton: { width: '100%', minHeight: 46 },
});
