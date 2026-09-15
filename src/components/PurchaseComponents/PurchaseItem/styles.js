import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

// O card reutiliza o padrão branco/borda suave já empregado nos componentes do app.
export const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    // A borda sutil deixa a sombra fazer a separação principal entre os cards.
    borderColor: 'rgba(131, 111, 226, 0.12)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#2F356B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  establishment: {
    color: COLORS.histChatItemTitulo,
    fontSize: 19,
    fontWeight: '700',
  },
  date: {
    color: COLORS.histChatItemMensagem,
    fontSize: 13,
    marginTop: 2,
  },
  value: {
    color: COLORS.dashboardGastosGeraisValor,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 13,
  },
  statusBadge: {
    // O status usa um tom positivo/lilás, separado visualmente da classificação.
    backgroundColor: COLORS.perfilPermissaoAvisoFundo,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: COLORS.perfilProfileCardTitulo,
    fontSize: 12,
    fontWeight: '700',
  },
  classificationBadge: {
    // A classificação padrão usa o lilás suave da identidade do aplicativo.
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  classificationBadgeText: {
    color: COLORS.cadTitulo,
    fontSize: 12,
    fontWeight: '700',
  },
  impulsiveBadge: {
    // A classificação impulsiva ganha um alerta rosado mais quente para
    // merecer maior atenção, sem recorrer a um vermelho agressivo.
    backgroundColor: '#D98291',
  },
  impulsiveBadgeText: {
    // Texto claro aumenta a legibilidade sobre o fundo rosado de alerta.
    color: '#FFF7FA',
  },
  itemsSummary: {
    color: COLORS.dadoUm,
    fontSize: 12,
    marginLeft: 'auto',
  },
  itemsSection: {
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF7',
    gap: 8,
  },
  itemsTitle: {
    color: COLORS.histChatItemTitulo,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  itemRow: {
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    // O fundo tonalizado diferencia o item do card branco sem criar outra cor.
    backgroundColor: COLORS.cadCaixaPreferenciasFundo,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIconBox: {
    // O fundo tonalizado mantém o ícone delicado e conectado à paleta do app.
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    color: COLORS.histChatItemTitulo,
    fontSize: 14,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  itemSecondary: {
    color: COLORS.dadoUm,
    fontSize: 11,
  },
  itemValue: {
    color: COLORS.cadTitulo,
    fontSize: 13,
    fontWeight: '700',
  },
  itemDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.perfilPermissaoAvisoFundo,
  },
  purchaseActionRow: {
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF7',
  },
  purchaseDeleteButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    // A ação continua claramente destrutiva, mas usa um fundo suave para
    // funcionar como ação secundária e não como botão principal do card.
    backgroundColor: COLORS.perfilPermissaoAvisoFundo,
  },
  purchaseDeleteText: {
    color: COLORS.cadTextoAdicionarLimites,
    fontSize: 13,
    fontWeight: '700',
  },
});
