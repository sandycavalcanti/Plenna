import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: COLORS.fundoPrincipal,
  },
  content: {
    paddingVertical: 24,
  },
  header: {
    backgroundColor: COLORS.cadFundo,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 14,
  },
  subtitle: { fontSize: 13, color: COLORS.dadoUm, marginTop: 6 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: COLORS.perfilNome },
  label: { fontSize: 13, color: COLORS.perfilInfoLabel, marginTop: 8, marginBottom: 6 },

  // inputs: we rely on CustomTextInput styles, but add small helpers
  inputWrapper: { marginBottom: 8 },

  // buttons (we usually reuse CustomButton, this is fallback)
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },

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
