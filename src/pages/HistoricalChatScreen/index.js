import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatItem from '../../components/ChatComponents/historicalChatItem';
import { getChatErrorMessage, listHistories } from '../../api/chat';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';

function formatHistoryDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data disponível';
  return `Atualizada em ${date.toLocaleDateString('pt-BR')}`;
}

export default function HistoricalChatScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
  const [histories, setHistories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadHistories = useCallback(async (isRefresh = false) => {
    const requestId = ++requestIdRef.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const nextHistories = await listHistories();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setHistories(nextHistories);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setErrorMessage(getChatErrorMessage(error, 'Não foi possível carregar suas conversas.'));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      loadHistories().catch(() => {
        // loadHistories já converte a falha em estado visual; evita rejeição solta.
      });

      return () => {
        mountedRef.current = false;
        requestIdRef.current += 1;
      };
    }, [loadHistories]),
  );

  const handleCreateHistory = useCallback(() => {
    navigation.navigate('Chat', { mode: 'new' });
  }, [navigation]);

  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const visibleHistories = histories.filter((history) => (
    !normalizedSearch
      || history.historico_nome?.toLocaleLowerCase().includes(normalizedSearch)
  ));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Conversas</Text>
          <Text style={styles.subtitle}>Organize suas ideias com a Plenna</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Nova conversa"
          accessibilityRole="button"
          style={styles.newButton}
          onPress={handleCreateHistory}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={21} color={COLORS.histChatBotao3Pontos} />
        <TextInput
          accessibilityLabel="Pesquisar conversas"
          placeholder="Pesquisar conversa..."
          placeholderTextColor={COLORS.histChatTextInputTexto}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText ? (
          <TouchableOpacity accessibilityLabel="Limpar pesquisa" onPress={() => setSearchText('')}>
            <MaterialIcons name="close" size={20} color={COLORS.histChatBotao3Pontos} />
          </TouchableOpacity>
        ) : null}
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="cloud-off" size={19} color={COLORS.loginEsqueciSenha} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => loadHistories()}>
            <Text style={styles.retryText}>Tentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={COLORS.chatBotaoEnviar} />
          <Text style={styles.stateText}>Carregando conversas...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleHistories}
          keyExtractor={(item) => String(item.historico_id)}
          renderItem={({ item }) => (
            <ChatItem
              title={item.historico_nome || 'Nova conversa'}
              lastMessage={formatHistoryDate(item.historico_data_modificacao || item.historico_data_criacao)}
              onPress={() => navigation.navigate('Chat', {
                mode: 'existing',
                historicoId: item.historico_id,
              })}
            />
          )}
          style={styles.list}
          contentContainerStyle={[styles.listContent, !visibleHistories.length && styles.emptyListContent, { paddingBottom: tabBarHeight + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistories(true)} tintColor={COLORS.chatBotaoEnviar} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <MaterialIcons name={normalizedSearch ? 'search-off' : 'forum'} size={42} color={COLORS.histChatBotao3Pontos} />
              <Text style={styles.emptyTitle}>{normalizedSearch ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</Text>
              <Text style={styles.stateText}>
                {normalizedSearch ? 'Tente outro termo de pesquisa.' : 'Crie uma conversa para começar a organizar seus pensamentos.'}
              </Text>
              {!normalizedSearch ? (
                <TouchableOpacity style={styles.emptyButton} onPress={handleCreateHistory}>
                  <Text style={styles.emptyButtonText}>Começar conversa</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
