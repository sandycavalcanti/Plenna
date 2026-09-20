import React from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
 * Escolhe um ícone vetorial coerente para cada categoria real do aplicativo.
 * O helper retorna também a família para manter o componente desacoplado da
 * decisão visual e permitir trocar a biblioteca sem alterar a renderização.
 * Categorias novas ou desconhecidas usam uma sacola neutra como fallback.
 */
function getCategoryIcon(categoryName) {
  const normalizedName = String(categoryName || '').trim().toLocaleLowerCase('pt-BR');
  const icons = {
    moradia: { family: MaterialCommunityIcons, name: 'home' },
    'contas e serviços': { family: MaterialCommunityIcons, name: 'flash' },
    transporte: { family: MaterialCommunityIcons, name: 'car' },
    saúde: { family: MaterialCommunityIcons, name: 'medical-bag' },
    educação: { family: MaterialCommunityIcons, name: 'book-open-variant' },
    'restaurantes e delivery': { family: MaterialCommunityIcons, name: 'silverware-fork-knife' },
    pets: { family: MaterialCommunityIcons, name: 'paw' },
    'assinaturas e serviços digitais': { family: MaterialCommunityIcons, name: 'cellphone' },
    'roupas e calçados': { family: MaterialCommunityIcons, name: 'tshirt-crew' },
    // "lipstick" representa diretamente maquiagem/beleza e existe na versão
    // instalada, tornando a categoria imediatamente intuitiva para a usuária.
    'beleza e cosméticos': { family: MaterialCommunityIcons, name: 'lipstick' },
    'eletrônicos e gadgets': { family: MaterialCommunityIcons, name: 'laptop' },
    'hobbies e lazer': { family: MaterialCommunityIcons, name: 'gamepad-variant' },
    presentes: { family: MaterialCommunityIcons, name: 'gift' },
    outros: { family: MaterialCommunityIcons, name: 'shopping-bag' },
  };

  return icons[normalizedName] || { family: MaterialCommunityIcons, name: 'shopping-bag' };
}

/**
 * Card reutilizável para uma compra.
 *
 * Recebe a compra, os estados de exclusão e callbacks separadas para a compra
 * e para seus itens. Assim, a apresentação não precisa conhecer a lista
 * inteira nem manipular diretamente o estado da tela.
 */
export default function PurchaseItem({ purchase, isDeleting, hasItemDeleting, isItemDeleting, isStatusActionRunning, statusAction, onConfirm, onIgnore, onDelete, onDeleteItem }) {
  const itemsCount = Array.isArray(purchase.tb_compra_item) ? purchase.tb_compra_item.length : 0;
  const establishment = purchase.compra_fonte || 'Origem não informada';
  // Os helpers são usados somente na apresentação; o objeto recebido não é alterado.
  const statusLabel = getStatusLabel(purchase.compra_status);
  const classificationLabel = getClassificationLabel(purchase.compra_classificacao);
  const isPending = purchase.compra_status === 'AGUARDANDO_CONFIRMACAO';

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

    // Quando só resta um item, a exclusão precisa seguir o DELETE da compra,
    // pois o resultado esperado é remover o card inteiro e suas métricas.
    if (itemsCount === 1) {
      Alert.alert(
        'Excluir compra?',
        'Este é o único item desta compra. Ao excluí-lo, a compra inteira também será removida. Essa ação é permanente e não poderá ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir definitivamente', style: 'destructive', onPress: () => onDelete(purchase) },
        ],
      );
      return;
    }

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
    <View style={[styles.card, isPending ? styles.pendingCard : null]}>
      {/* Cabeçalho: estabelecimento e valor são os dois pontos de maior destaque. */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.establishment} numberOfLines={1}>{establishment}</Text>
          <Text style={styles.date}>{formatDate(purchase.compra_horario)}</Text>
        </View>
        <View style={styles.headerValueGroup}>
          <Text style={styles.value}>{formatCurrency(purchase.compra_valor)}</Text>
          {purchase.compra_status === 'CONFIRMADA' ? (
            <TouchableOpacity
              accessibilityLabel="Excluir compra e todos os itens"
              disabled={isDeleting || hasItemDeleting}
              onPress={confirmDelete}
              style={styles.purchaseDeleteIconButton}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.cadTextoAdicionarLimites} />
              ) : (
                <Feather name="trash-2" size={25} color={COLORS.cadTextoAdicionarLimites} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {/* Badges traduzem os enums sem alterar os dados recebidos da API. */}
      <View style={styles.badgesRow}>

        {purchase.compra_classificacao ? (
          <View style={[
            styles.classificationBadge,
            purchase.compra_classificacao === 'IMPULSIVA' ? styles.impulsiveBadge : null,
          ]}>
            {/*
              A classificação impulsiva recebe texto próprio para manter
              contraste com o fundo rosado e chamar atenção sem agressividade.
            */}
            <Text style={[
              styles.classificationBadgeText,
              purchase.compra_classificacao === 'IMPULSIVA' ? styles.impulsiveBadgeText : null,
            ]}>{classificationLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.itemsSummary}>{itemsCount} {itemsCount === 1 ? 'item' : 'itens'}</Text>
      </View>

      {/*
        Somente compras visíveis chegam a este componente: pendentes ou
        confirmadas. A exclusão de item permanece restrita às confirmadas.
      */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Itens da compra</Text>
        {Array.isArray(purchase.tb_compra_item) && purchase.tb_compra_item.length > 0 ? (
          purchase.tb_compra_item.map((item) => {
            const quantityLabel = formatQuantity(item.compra_item_quantidade);
            const categoryLabel = item.tb_categoria?.categoria_nome;
            const categoryIcon = getCategoryIcon(categoryLabel);
            const CategoryIcon = categoryIcon.family;

            return (
              <View key={String(item.compra_item_id)} style={styles.itemRow}>
                {/* O emoji contextualiza a categoria sem criar uma informação nova. */}
                <View style={styles.categoryIconBox}>
                  <CategoryIcon name={categoryIcon.name} size={19} color={COLORS.cadTitulo} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.compra_item_nome}</Text>
                  <View style={styles.itemDetails}>
                    {categoryLabel ? <Text style={styles.itemSecondary} numberOfLines={1}>{categoryLabel}</Text> : null}
                    {quantityLabel ? <Text style={styles.itemSecondary}>{quantityLabel}</Text> : null}
                  </View>
                </View>
                <Text style={styles.itemValue}>{formatCurrency(item.compra_item_valor)}</Text>
                {!isPending ? <TouchableOpacity
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
                </TouchableOpacity> : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.itemSecondary}>Nenhum item informado.</Text>
        )}
      </View>

      {/*
        Somente pendentes precisam de uma ação de status no rodapé.
        A exclusão da compra confirmada fica no cabeçalho para reduzir a altura
        do card sem remover a confirmação nem o soft delete existente.
      */}
      {isPending ? <View style={styles.purchaseActionRow}>
        {isPending ? (
          <View style={styles.statusActionsGroup}>
            <TouchableOpacity accessibilityLabel="Ignorar compra" disabled={isStatusActionRunning} onPress={() => onIgnore(purchase)} style={[styles.ignoreButton, isStatusActionRunning && styles.disabledAction]}>
              {isStatusActionRunning && statusAction === 'ignore' ? <ActivityIndicator size="small" color="#8A5A00" /> : null}
              <Text style={styles.ignoreButtonText}>Ignorar</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Confirmar compra" disabled={isStatusActionRunning} onPress={() => onConfirm(purchase)} style={[styles.confirmButton, isStatusActionRunning && styles.disabledAction]}>
              {isStatusActionRunning && statusAction === 'confirm' ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View> : null}
    </View>
  );
}
