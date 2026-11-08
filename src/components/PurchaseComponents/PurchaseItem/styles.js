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
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#2F356B',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 0
  },
  pendingCard: {
    // O amarelo suave destaca a decisão pendente sem tratar a compra como erro.
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(131, 111, 226, 0.18)'
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10
  },
  headerInfo: {
    flex: 1,
    minWidth: 100,
    gap: 3
  },
  establishment: {
    color: COLORS.histChatItemTitulo,
    fontSize: 16,
    fontWeight: '700'
  },
  primaryItemName: {
    color: COLORS.histChatItemTitulo,
    fontSize: 16,
    fontWeight: '800'
  },
  purchaseSource: {
    color: COLORS.dadoUm,
    fontSize: 12,
    fontWeight: '600'
  },
  date: {
    color: COLORS.histChatItemMensagem,
    fontSize: 13,
    marginTop: 2
  },
  value: {
    color: COLORS.cadTitulo,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right'
  },
  headerValueGroup: {
    flexDirection: 'row',
    flexShrink: 0,
    flexWrap: 'wrap',
    maxWidth: '100%',
    alignItems: 'center',
    gap: 6
  },
  purchaseDeleteIconButton: {
    // A lixeira permanece fácil de tocar, mas não domina o card como o antigo
    // botão textual no rodapé. Ela só é renderizada para compras confirmadas.
    width: 48,
    height: 48,
    alignItems: 'center',
    marginLeft: 3,
    justifyContent: 'center'
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 13
  },
  emailOriginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  emailOriginBadgeText: {
    color: COLORS.cadTitulo,
    fontSize: 11,
    fontWeight: '600'
  },
  statusBadge: {
    // O status usa um tom positivo/lilás, separado visualmente da classificação.
    backgroundColor: COLORS.perfilPermissaoAvisoFundo,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statusBadgeText: {
    color: COLORS.perfilProfileCardTitulo,
    fontSize: 12,
    fontWeight: '700'
  },
  pendingStatusBadge: {
    backgroundColor: '#FBE4AE'
  },
  pendingMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14
  },
  pendingMessage: {
    color: '#8A5A00',
    fontSize: 13,
    fontWeight: '700'
  },
  classificationBadge: {
    maxWidth: '100%',
    flexShrink: 1,
    // A classificação padrão usa o lilás suave da identidade do aplicativo.
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  classificationBadgeText: {
    color: COLORS.cadTitulo,
    fontSize: 12,
    fontWeight: '700'
  },
  impulsiveBadge: {
    // A classificação impulsiva ganha um alerta rosado mais quente para
    // merecer maior atenção, sem recorrer a um vermelho agressivo.
    backgroundColor: COLORS.perfilPermissaoAvisoFundo
  },
  impulsiveBadgeText: {
    // Texto claro aumenta a legibilidade sobre o fundo rosado de alerta.
    color: COLORS.cadTitulo
  },
  contextAction: {
    minHeight: 38,
    marginTop: 3,
    paddingVertical: 4
  },
  itemsToggle: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingVertical: 4
  },
  itemsSection: {
    marginTop: 6,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF7',
    gap: 6
  },
  itemsTitle: {
    color: COLORS.histChatItemTitulo,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1
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
    gap: 8
  },
  categoryIconBox: {
    // O fundo tonalizado mantém o ícone delicado e conectado à paleta do app.
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cadCaixaPreferenciasValorFundo
  },
  itemInfo: {
    flex: 1,
    gap: 3
  },
  itemName: {
    color: COLORS.histChatItemTitulo,
    fontSize: 14,
    fontWeight: '600'
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 8
  },
  itemSecondary: {
    color: COLORS.dadoUm,
    fontSize: 11
  },
  itemValue: {
    color: COLORS.cadTitulo,
    fontSize: 13,
    fontWeight: '700'
  },
  itemDeleteButton: {
    width: 48,
    height: 48,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.perfilPermissaoAvisoFundo
  },
  purchaseActionRow: {
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF7'
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
    backgroundColor: COLORS.perfilPermissaoAvisoFundo
  },
  purchaseDeleteText: {
    color: COLORS.cadTextoAdicionarLimites,
    fontSize: 13,
    fontWeight: '700'
  },
  statusActionsGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginLeft: 0
  },
  ignoreButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FBE4AE'
  },
  ignoreButtonText: {
    color: '#8A5A00',
    fontSize: 13,
    fontWeight: '700'
  },
  confirmButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.cadTitulo
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  disabledAction: {
    opacity: 0.6
  }
});
