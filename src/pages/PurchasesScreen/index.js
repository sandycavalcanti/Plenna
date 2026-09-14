import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../api/client';
import { logApiErrors } from '../../utils/error';
import PurchaseItem from '../../components/PurchaseComponents/PurchaseItem';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';

/**
 * Tela que apresenta todas as compras retornadas para o usuário autenticado.
 * A autenticação não é feita manualmente aqui: o interceptor do apiClient
 * adiciona o token existente em todas as requisições.
 */
export default function PurchasesScreen() {
  // Estes estados distinguem carregamento inicial, erro, lista e exclusão.
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  /**
   * Busca a lista preservando a ordem definida pela API (data decrescente).
   * O erro fica separado da lista vazia para que os dois estados não sejam
   * apresentados como se fossem a mesma situação.
   */
  const loadPurchases = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      // GET /compras já usa o usuário do JWT no back-end.
      const response = await apiClient.get('/compras');
      setPurchases(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      logApiErrors(error, 'Erro ao carregar compras');
      setErrorMessage('Não foi possível carregar suas compras. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Recarrega ao entrar ou voltar para a tela, seguindo o padrão já usado na
   * Dashboard e garantindo dados atuais após retornar de outra tela.
   */
  useFocusEffect(
    useCallback(() => {
      loadPurchases();
    }, [loadPurchases]),
  );

  /**
   * Executa a exclusão somente depois de o back-end confirmar o DELETE 204.
   * A remoção local ocorre depois da resposta para não esconder uma compra
   * quando a operação falhar.
   */
  const handleDeletePurchase = useCallback(async (purchase) => {
    const purchaseId = purchase.compra_id;
    setDeletingId(purchaseId);

    try {
      // O interceptor adiciona a autenticação; nenhum token é manipulado aqui.
      await apiClient.delete(`/compras/${purchaseId}`);

      // Atualização otimista é evitada: só filtramos após o sucesso da API.
      setPurchases((currentPurchases) => currentPurchases.filter((item) => item.compra_id !== purchaseId));
      Alert.alert('Compra excluída', 'A compra foi removida com sucesso.');
    } catch (error) {
      logApiErrors(error, 'Erro ao excluir compra');
      Alert.alert('Erro', 'Não foi possível excluir a compra. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }, []);

  if (loading) {
    // O carregamento inicial ocupa a tela para não confundir ausência de dados
    // com uma lista realmente vazia.
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.dashboardIconeBotaoCanto} />
          <Text style={styles.stateText}>Carregando compras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    // O erro possui uma tentativa explícita e não reutiliza o estado vazio.
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Minhas compras</Text>
        </View>
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPurchases()}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Cabeçalho simples, alinhado ao padrão de telas com título do app. */}
      <View style={styles.header}>
        <Text style={styles.title}>Minhas compras</Text>
      </View>

      {/*
        FlatList renderiza cada registro com o componente reutilizável. O
        RefreshControl oferece atualização manual sem adicionar nova tecnologia.
      */}
      <FlatList
        data={purchases}
        keyExtractor={(item) => String(item.compra_id)}
        renderItem={({ item }) => (
          <PurchaseItem
            purchase={item}
            isDeleting={deletingId === item.compra_id}
            onDelete={handleDeletePurchase}
          />
        )}
        contentContainerStyle={purchases.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPurchases(true)} tintColor={COLORS.dashboardIconeBotaoCanto} />}
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Nenhuma compra encontrada.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
