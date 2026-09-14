import React from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { styles } from './styles';

/**
 * Converte o enum técnico de status em um texto adequado para a interface.
 * O fallback preserva o valor original para que novos status da API não
 * desapareçam visualmente antes de receberem um label específico.
 */
function getStatusLabel(status) {
  const labels = {
    AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
    CONFIRMADA: 'Confirmada',
    IGNORADA: 'Ignorada',
  };

  return labels[status] || status;
}

/**
 * Converte a classificação persistida em um label amigável para o usuário.
 * Assim como no status, valores desconhecidos continuam sendo apresentados
 * sem alteração para manter a informação disponível na tela.
 */
function getClassificationLabel(classification) {
  const labels = {
    PENDENTE: 'Pendente',
    IMPULSIVA: 'Impulsiva',
    NAO_IMPULSIVA: 'Não impulsiva',
  };

  return labels[classification] || classification;
}

/**
 * Card reutilizável para uma compra.
 *
 * Recebe a compra, os estados de exclusão e callbacks separadas para a compra
 * e para seus itens. Assim, a apresentação não precisa conhecer a lista
 * inteira nem manipular diretamente o estado da tela.
 */
export default function PurchaseItem({ purchase, isDeleting, hasItemDeleting, isItemDeleting, onDelete, onDeleteItem }) {
  const itemsCount = Array.isArray(purchase.tb_compra_item) ? purchase.tb_compra_item.length : 0;
  const establishment = purchase.compra_fonte || 'Origem não informada';
  // Os helpers são usados somente na apresentação; o objeto recebido não é alterado.
  const statusLabel = getStatusLabel(purchase.compra_status);
  const classificationLabel = getClassificationLabel(purchase.compra_classificacao);

  /** Formata a data ISO da API sem expor o formato técnico ao usuário. */
  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data não informada';
    return date.toLocaleDateString('pt-BR');
  }

  /** Formata Decimal/string/número em moeda brasileira com fallback seguro. */
  function formatCurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Valor não informado';
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Mostra quantidade somente quando o modelo trouxe um valor útil.
   * A ausência de quantidade não é convertida artificialmente em "1".
   */
  function formatQuantity(value) {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    return `Qtd. ${quantity}`;
  }

  /**
   * Pede confirmação específica para remover um item.
   * A callback recebe o item e a compra para que a tela possa atualizar seu
   * estado usando a compra atualizada devolvida pela API.
   */
  function confirmDeleteItem(item) {
    if (isDeleting || hasItemDeleting) return;

    Alert.alert(
      'Excluir item?',
      `Tem certeza de que deseja excluir "${item.compra_item_nome}"? Essa ação é permanente e não poderá ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir definitivamente', style: 'destructive', onPress: () => onDeleteItem(item) },
      ],
    );
  }

  /**
   * Pede confirmação antes de delegar a exclusão à tela.
   * Enquanto o DELETE estiver em andamento, o botão permanece desabilitado.
   */
  function confirmDelete() {
    if (isDeleting || hasItemDeleting) return;

    Alert.alert('Excluir compra?', 'Tem certeza de que deseja excluir esta compra e todos os seus itens? Essa ação é permanente e não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir definitivamente', style: 'destructive', onPress: () => onDelete(purchase) },
    ]);
  }

  return (
    <View style={styles.card}>
      {/* Cabeçalho: estabelecimento e valor são os dois pontos de maior destaque. */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.establishment} numberOfLines={1}>{establishment}</Text>
          <Text style={styles.date}>{formatDate(purchase.compra_horario)}</Text>
        </View>
        <Text style={styles.value}>{formatCurrency(purchase.compra_valor)}</Text>
      </View>

      {/* Badges traduzem os enums sem alterar os dados recebidos da API. */}
      <View style={styles.badgesRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </View>
        {purchase.compra_classificacao ? (
          <View style={styles.classificationBadge}>
            <Text style={styles.classificationBadgeText}>{classificationLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.itemsSummary}>{itemsCount} {itemsCount === 1 ? 'item' : 'itens'}</Text>
      </View>

      {/* Cada item fica em uma linha compacta, com categoria e ação própria. */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Itens da compra</Text>
        {Array.isArray(purchase.tb_compra_item) && purchase.tb_compra_item.length > 0 ? (
          purchase.tb_compra_item.map((item) => {
            const quantityLabel = formatQuantity(item.compra_item_quantidade);
            const categoryLabel = item.tb_categoria?.categoria_nome;

            return (
              <View key={String(item.compra_item_id)} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.compra_item_nome}</Text>
                  <View style={styles.itemDetails}>
                    {categoryLabel ? <Text style={styles.itemSecondary} numberOfLines={1}>{categoryLabel}</Text> : null}
                    {quantityLabel ? <Text style={styles.itemSecondary}>{quantityLabel}</Text> : null}
                  </View>
                </View>
                <Text style={styles.itemValue}>{formatCurrency(item.compra_item_valor)}</Text>
                <TouchableOpacity
                  accessibilityLabel={`Excluir item ${item.compra_item_nome}`}
                  disabled={isDeleting || hasItemDeleting}
                  onPress={() => confirmDeleteItem(item)}
                  style={styles.itemDeleteButton}
                >
                  {isItemDeleting ? (
                    <ActivityIndicator size="small" color={COLORS.cadTextoAdicionarLimites} />
                  ) : (
                    <Feather name="trash-2" size={17} color={COLORS.cadTextoAdicionarLimites} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <Text style={styles.itemSecondary}>Nenhum item informado.</Text>
        )}
      </View>

      {/* Ação da compra fica separada para não ser confundida com a do item. */}
      <View style={styles.purchaseActionRow}>
        <TouchableOpacity
          accessibilityLabel="Excluir compra e todos os itens"
          disabled={isDeleting || hasItemDeleting}
          onPress={confirmDelete}
          style={styles.purchaseDeleteButton}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.cadTextoAdicionarLimites} />
          ) : (
            <Feather name="trash-2" size={17} color={COLORS.cadTextoAdicionarLimites} />
          )}
          <Text style={styles.purchaseDeleteText}>Excluir compra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
