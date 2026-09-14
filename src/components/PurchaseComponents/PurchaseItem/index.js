import React from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { styles } from './styles';

/**
 * Card reutilizável para uma compra.
 *
 * Recebe o objeto da compra, o estado de exclusão daquele card e a callback
 * fornecida pela tela. Assim, a apresentação não precisa conhecer a lista
 * inteira nem manipular diretamente o estado da tela.
 */
export default function PurchaseItem({ purchase, isDeleting, onDelete }) {
  const itemsCount = Array.isArray(purchase.tb_compra_item) ? purchase.tb_compra_item.length : 0;
  const establishment = purchase.compra_fonte || 'Origem não informada';

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
   * Pede confirmação antes de delegar a exclusão à tela.
   * Enquanto o DELETE estiver em andamento, o botão permanece desabilitado.
   */
  function confirmDelete() {
    if (isDeleting) return;

    Alert.alert('Excluir compra', 'Deseja realmente excluir esta compra?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onDelete(purchase) },
    ]);
  }

  return (
    <View style={styles.card}>
      {/* Conteúdo principal do card: somente campos definidos no roadmap. */}
      <View style={styles.content}>
        <Text style={styles.establishment} numberOfLines={1}>{establishment}</Text>
        <Text style={styles.date}>{formatDate(purchase.compra_horario)}</Text>
        <Text style={styles.value}>{formatCurrency(purchase.compra_valor)}</Text>

        <View style={styles.metadataRow}>
          <Text style={styles.metadata}>Status: {purchase.compra_status}</Text>
          {purchase.compra_classificacao && purchase.compra_classificacao !== 'PENDENTE' ? (
            <Text style={styles.metadata}>Classificação: {purchase.compra_classificacao}</Text>
          ) : null}
          <Text style={styles.metadata}>Itens: {itemsCount}</Text>
        </View>
      </View>

      {/*
        Ação destrutiva é visualmente separada e mostra processamento para
        impedir cliques repetidos enquanto a requisição aguarda resposta.
      */}
      <TouchableOpacity
        accessibilityLabel="Excluir compra"
        disabled={isDeleting}
        onPress={confirmDelete}
        style={styles.deleteButton}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={COLORS.cadTextoAdicionarLimites} />
        ) : (
          <Feather name="trash-2" size={21} color={COLORS.cadTextoAdicionarLimites} />
        )}
      </TouchableOpacity>
    </View>
  );
}
