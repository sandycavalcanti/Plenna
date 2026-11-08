import { presentationStyles } from "./styles";
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { styles } from './styles';
import { purchaseStyles } from '../presentationStyles';

/**
 * Converte o enum técnico de status em um texto adequado para a interface.
 * O fallback preserva o valor original para que novos status da API não
 * desapareçam visualmente antes de receberem um label específico.
 */
function getStatusLabel(status) {
  const labels = {
    AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
    CONFIRMADA: 'Confirmada',
    IGNORADA: 'Ignorada'
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
    PENDENTE: 'Sem classificação',
    IMPULSIVA: 'Impulsiva',
    NAO_IMPULSIVA: 'Não impulsiva'
  };
  return labels[classification] || classification;
}

/**
 * Escolhe um ícone vetorial coerente para cada categoria real do aplicativo.
 * O helper retorna também a família para manter o componente desacoplado da
 * decisão visual e permitir trocar a biblioteca sem alterar a renderização.
 * Categorias novas ou desconhecidas usam uma sacola neutra como fallback.
 */
export function getCategoryIcon(categoryName) {
  const normalizedName = String(categoryName || '').trim().toLocaleLowerCase('pt-BR');
  const icons = {
    moradia: {
      family: MaterialCommunityIcons,
      name: 'home'
    },
    'contas e serviços': {
      family: MaterialCommunityIcons,
      name: 'flash'
    },
    transporte: {
      family: MaterialCommunityIcons,
      name: 'car'
    },
    saúde: {
      family: MaterialCommunityIcons,
      name: 'medical-bag'
    },
    educação: {
      family: MaterialCommunityIcons,
      name: 'book-open-variant'
    },
    'restaurantes e delivery': {
      family: MaterialCommunityIcons,
      name: 'silverware-fork-knife'
    },
    pets: {
      family: MaterialCommunityIcons,
      name: 'paw'
    },
    'assinaturas e serviços digitais': {
      family: MaterialCommunityIcons,
      name: 'cellphone'
    },
    'roupas e calçados': {
      family: MaterialCommunityIcons,
      name: 'tshirt-crew'
    },
    // "lipstick" representa diretamente maquiagem/beleza e existe na versão
    // instalada, tornando a categoria imediatamente intuitiva para a usuária.
    'beleza e cosméticos': {
      family: MaterialCommunityIcons,
      name: 'lipstick'
    },
    'eletrônicos e gadgets': {
      family: MaterialCommunityIcons,
      name: 'laptop'
    },
    'hobbies e lazer': {
      family: MaterialCommunityIcons,
      name: 'gamepad-variant'
    },
    presentes: {
      family: MaterialCommunityIcons,
      name: 'gift'
    },
    outros: {
      family: MaterialCommunityIcons,
      name: 'shopping-outline'
    }
  };
  return icons[normalizedName] || {
    family: MaterialCommunityIcons,
    name: 'shopping-outline'
  };
}

/**
 * Card reutilizável para uma compra.
 *
 * Recebe a compra, os estados de exclusão e callbacks separadas para a compra
 * e para seus itens. Assim, a apresentação não precisa conhecer a lista
 * inteira nem manipular diretamente o estado da tela.
 */
export default function PurchaseItem({
  purchase,
  isDeleting,
  hasItemDeleting,
  isItemDeleting,
  isStatusActionRunning,
  statusAction,
  onConfirm,
  onIgnore,
  onDelete,
  onDeleteItem,
  onContext,
  onManage,
  resumo
}) {
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const visibleItems = useMemo(() => (purchase.tb_compra_item || []).filter(item => item.compra_item_ativo !== 0 && !resumo?.itensOcultos?.includes(item.compra_item_id)), [purchase.tb_compra_item, resumo?.itensOcultos]);
  const categories = useMemo(() => [...new Set(visibleItems.map(item => item.tb_categoria?.categoria_nome).filter(Boolean))].slice(0, 3).join(' · '), [visibleItems]);
  const movements = [[resumo?.cancelamentos, 'Cancelamento registrado'], [resumo?.devolucoes, 'Devolu\u00e7\u00e3o registrada'], [resumo?.reembolsadoCentavos, 'Reembolso registrado']].filter(([count]) => Number.isSafeInteger(count) && count > 0).map(([, label]) => label);
  const itemsCount = visibleItems.length;
  const establishment = purchase.compra_fonte || 'Origem não informada';
  // Os helpers são usados somente na apresentação; o objeto recebido não é alterado.
  const statusLabel = getStatusLabel(purchase.compra_status);
  const voluntaryClassification = resumo?.classificacao === 'PREFIRO_NAO_CLASSIFICAR' ? 'PENDENTE' : resumo?.classificacao ?? purchase.compra_classificacao;
  const classificationLabel = resumo?.classificacao === 'PREFIRO_NAO_CLASSIFICAR' ? 'Prefiro não classificar' : getClassificationLabel(voluntaryClassification);
  const isPending = purchase.compra_status === 'AGUARDANDO_CONFIRMACAO';
  const isEmailOrigin = purchase.compra_email === true;

  /** Formata a data ISO da API sem expor o formato técnico ao usuário. */
  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data não informada';
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
  }

  /** Formata Decimal/string/número em moeda brasileira com fallback seguro. */
  function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return 'Valor não informado';
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Valor não informado';
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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
    if (onManage) {
      onManage(purchase, item);
      return;
    }
    if (isDeleting || hasItemDeleting) return;

    // Quando só resta um item, a exclusão precisa seguir o DELETE da compra,
    // pois o resultado esperado é remover o card inteiro e suas métricas.
    if (itemsCount === 1) {
      Alert.alert('Excluir compra?', 'Ela deixará o histórico e os totais financeiros. Isso não registra cancelamento ou reembolso.', [{
        text: 'Cancelar',
        style: 'cancel'
      }, {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => onDelete(purchase)
      }]);
      return;
    }
    Alert.alert('Excluir item?', 'Deseja excluir este item?', [{
      text: 'Cancelar',
      style: 'cancel'
    }, {
      text: 'Excluir',
      style: 'destructive',
      onPress: () => onDeleteItem(item)
    }]);
  }

  /**
   * Pede confirmação antes de delegar a exclusão à tela.
   * Enquanto o DELETE estiver em andamento, o botão permanece desabilitado.
   */
  function confirmDelete() {
    if (onManage) {
      onManage(purchase);
      return;
    }
    if (isDeleting || hasItemDeleting) return;
    Alert.alert('Excluir compra?', 'Ela deixará o histórico e os totais financeiros. Isso não registra cancelamento ou reembolso.', [{
      text: 'Cancelar',
      style: 'cancel'
    }, {
      text: 'Excluir',
      style: 'destructive',
      onPress: () => onDelete(purchase)
    }]);
  }

  /**
   * Confirmar altera o status persistido e faz a compra participar dos gastos
   * e métricas. Por isso a API só é chamada depois de uma decisão explícita;
   * cancelar fecha o alerta sem alterar estado local ou remoto.
   */
  function confirmPurchaseStatus() {
    if (isStatusActionRunning) return;
    Alert.alert('Confirmar compra?', 'Deseja confirmar esta compra?', [{
      text: 'Cancelar',
      style: 'cancel'
    }, {
      text: 'Confirmar',
      onPress: () => onConfirm(purchase)
    }]);
  }

  /**
   * Ignorar também muda um estado persistido. A confirmação evita que um
   * toque acidental retire a compra dos pendentes; cancelar não produz efeito
   * colateral e a chamada existente só ocorre após escolher Ignorar.
   */
  function confirmIgnoreStatus() {
    if (isStatusActionRunning) return;
    Alert.alert('Ignorar compra?', 'Deseja ignorar esta compra?', [{
      text: 'Cancelar',
      style: 'cancel'
    }, {
      text: 'Ignorar',
      style: 'destructive',
      onPress: () => onIgnore(purchase)
    }]);
  }
  return <View style={[styles.card, isPending ? styles.pendingCard : null]}>
      {/* Cabeçalho: estabelecimento e valor são os dois pontos de maior destaque. */}
      <View style={styles.headerRow}>
        <View style={purchaseStyles.icon}><MaterialCommunityIcons name="shopping-outline" size={22} color={COLORS.cadTitulo} /></View>
        <View style={styles.headerInfo}>
          <Text style={styles.establishment} numberOfLines={1}>{establishment}</Text>
          <Text style={styles.date}>{formatDate(purchase.compra_horario)}</Text>
        </View>
        <View style={styles.headerValueGroup}>
          <Text style={styles.value}>{formatCurrency(purchase.compra_valor)}</Text>
          {purchase.compra_status === 'CONFIRMADA' ? <TouchableOpacity accessibilityLabel={onManage ? 'Gerenciar compra' : 'Excluir compra e todos os itens'} disabled={isDeleting || hasItemDeleting} onPress={confirmDelete} style={styles.purchaseDeleteIconButton}>
              {isDeleting ? <ActivityIndicator size="small" color={COLORS.cadTextoAdicionarLimites} /> : <Feather name={onManage ? 'more-horizontal' : 'trash-2'} size={25} color={COLORS.cadTextoAdicionarLimites} />}
            </TouchableOpacity> : null}
        </View>
      </View>
      {onContext && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Abrir análise e contexto da compra" onPress={() => onContext(purchase.compra_id)} style={[purchaseStyles.action, purchaseStyles.row]}>
        <MaterialCommunityIcons name="chart-box-outline" size={18} color={COLORS.cadTitulo} />
        <Text style={[purchaseStyles.copy, purchaseStyles.actionText]}>Sobre sua compra</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.cadTitulo} />
      </TouchableOpacity>}
      {/* Badges traduzem os enums sem alterar os dados recebidos da API. */}
      <View style={styles.badgesRow}>
        {!isPending && <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{statusLabel}</Text></View>}
        {isEmailOrigin ? <View style={styles.emailOriginBadge} accessibilityLabel="Via e-mail">
            <MaterialCommunityIcons name="email-outline" size={14} color={COLORS.cadTitulo} />
            <Text style={styles.emailOriginBadgeText}>Via e-mail</Text>
          </View> : null}

        {voluntaryClassification && (voluntaryClassification !== 'PENDENTE' || resumo?.classificacao === 'PREFIRO_NAO_CLASSIFICAR') ? <View style={[styles.classificationBadge, voluntaryClassification === 'IMPULSIVA' ? styles.impulsiveBadge : null]}>
            {/*
              A classificação impulsiva recebe texto próprio para manter
              contraste com o fundo rosado e chamar atenção sem agressividade.
             */}
            <Text style={[styles.classificationBadgeText, voluntaryClassification === 'IMPULSIVA' ? styles.impulsiveBadgeText : null]} accessibilityRole="button" accessibilityLabel="Entender classificação registrada" onPress={() => Alert.alert('Sobre esta classificação', voluntaryClassification === 'PENDENTE' ? resumo?.classificacao === 'PREFIRO_NAO_CLASSIFICAR' ? 'Você preferiu não classificar esta compra.' : 'Classificação voluntária opcional. A análise automática utiliza os dados disponíveis, independentemente dessa escolha.' : 'Esta é uma classificação registrada, que você pode rever no gerenciamento da compra. Não é uma conclusão automática da análise.')}>{voluntaryClassification === 'PENDENTE' ? classificationLabel : 'Sua classificação: ' + classificationLabel}</Text>
          </View> : null}
        <Text style={styles.itemsSummary}>{itemsCount} {itemsCount === 1 ? 'item' : 'itens'}</Text>
      </View>
      {!!categories && <Text style={[purchaseStyles.caption, {
      marginTop: 6
    }]} numberOfLines={2}>{categories}</Text>}
      {!!movements.length && <Text style={[purchaseStyles.caption, {
      marginTop: 4
    }]}>{movements.join(' \u00b7 ')}</Text>}

      {/*
        Somente compras visíveis chegam a este componente: pendentes ou
        confirmadas. A exclusão de item permanece restrita às confirmadas.
       */}
      {itemsCount > 0 && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver itens da compra" accessibilityState={{
      expanded: itemsExpanded
    }} onPress={() => setItemsExpanded(value => !value)} style={presentationStyles.inline1}>
        <Text style={styles.itemSecondary}>{itemsExpanded ? 'Recolher itens' : `Ver itens (${itemsCount})`}</Text><MaterialCommunityIcons name={itemsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.cadTitulo} />
      </TouchableOpacity>}
      {itemsExpanded && <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Itens da compra</Text>
        {visibleItems.length > 0 ? visibleItems.map(item => {
        const quantityLabel = formatQuantity(item.compra_item_quantidade);
        const categoryLabel = item.tb_categoria?.categoria_nome;
        const categoryIcon = getCategoryIcon(categoryLabel);
        const CategoryIcon = categoryIcon.family;
        return <View key={String(item.compra_item_id)} style={styles.itemRow}>
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
                {purchase.compra_status === 'CONFIRMADA' ? <TouchableOpacity accessibilityLabel={`${onManage ? 'Gerenciar' : 'Excluir'} item ${item.compra_item_nome}`} disabled={isDeleting || hasItemDeleting} onPress={() => confirmDeleteItem(item)} style={styles.itemDeleteButton}>
                  {isItemDeleting ? <ActivityIndicator size="small" color={COLORS.cadTextoAdicionarLimites} /> : <Feather name={onManage ? 'more-horizontal' : 'trash-2'} size={20} color={COLORS.cadTextoAdicionarLimites} />}
                </TouchableOpacity> : null}
              </View>;
      }) : <Text style={styles.itemSecondary}>Nenhum item informado.</Text>}
      </View>}

      {/*
        Somente pendentes precisam de uma ação de status no rodapé.
        A exclusão da compra confirmada fica no cabeçalho para reduzir a altura
        do card sem remover a confirmação nem o soft delete existente.
       */}
      {isPending ? <View style={styles.purchaseActionRow}>
        {isPending ? <View style={styles.statusActionsGroup}>
            <TouchableOpacity accessibilityLabel="Ignorar compra" disabled={isStatusActionRunning} onPress={confirmIgnoreStatus} style={[styles.ignoreButton, isStatusActionRunning && styles.disabledAction]}>
              {isStatusActionRunning && statusAction === 'ignore' ? <ActivityIndicator size="small" color="#8A5A00" /> : null}
              <Text style={styles.ignoreButtonText}>Ignorar</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Confirmar compra" disabled={isStatusActionRunning} onPress={confirmPurchaseStatus} style={[styles.confirmButton, isStatusActionRunning && styles.disabledAction]}>
              {isStatusActionRunning && statusAction === 'confirm' ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View> : null}
      </View> : null}
    </View>;
}
