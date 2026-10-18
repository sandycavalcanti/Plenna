import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { COLORS } from '../../../constants/colors';
import { styles } from './styles';

function recommendationKey(periodo, codigo) {
  return `${periodo}:${codigo}`;
}

export default function AnaliseComportamento({ dados, loading, error, onRetry }) {
  const [openedCategoriesPeriod, setOpenedCategoriesPeriod] = useState(null);
  const [openedRecommendation, setOpenedRecommendation] = useState(null);
  const categoriesExpanded = Boolean(
    dados?.analise?.periodo && openedCategoriesPeriod === dados.analise.periodo,
  );
  let content;

  if (loading) {
    content = (
      <View style={styles.state}>
        <ActivityIndicator accessibilityLabel="Carregando análise de consumo" color={COLORS.dadoTres} />
        <Text style={styles.note}>Carregando análise...</Text>
      </View>
    );
  } else if (error) {
    content = (
      <View style={styles.state}>
        <Text style={styles.note}>Não foi possível carregar a análise.</Text>
        <Pressable accessibilityRole="button" style={styles.retry} onPress={onRetry}>
          <Text style={styles.actionText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  } else if (!dados) {
    content = <Text style={styles.note}>Análise indisponível.</Text>;
  } else {
    const { analise, recomendacoes, categorias = [] } = dados;
    const { frequencia, categorias: concentration, financeiro, comparacao } = analise.indicadores;
    const labels = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));
    const groups = concentration?.grupos ?? [];
    const recommendations = recomendacoes?.recomendacoes ?? [];

    content = (
      <View style={styles.body}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <View style={styles.metricTop}>
              <MaterialCommunityIcons name="shopping-outline" size={19} color={COLORS.dadoTres} accessible={false} />
              <Text style={styles.value}>{frequencia.compras}</Text>
            </View>
            <Text style={styles.label}>Compras confirmadas</Text>
          </View>

          <View style={styles.metric}>
            <View style={styles.metricTop}>
              <MaterialCommunityIcons name="cash-check" size={19} color={COLORS.dadoTres} accessible={false} />
              <Text style={styles.value}>
                {typeof financeiro.total === 'number' && Number.isFinite(financeiro.total)
                  ? financeiro.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '--'}
              </Text>
            </View>
            <Text style={styles.label}>Compras com valor conhecido</Text>
          </View>
        </View>

        {frequencia.compras === 0 && <Text style={styles.note}>Nenhuma compra confirmada registrada neste período.</Text>}
        {financeiro.comprasSemValor > 0 && (
          <Text style={styles.note}>
            {financeiro.comprasSemValor} compra(s) sem valor. Os totais conhecidos podem estar incompletos.
          </Text>
        )}
        <Text style={styles.note}>
          {comparacao.disponibilidade === 'INDISPONIVEL'
            ? 'Ainda não há dados suficientes para comparar os períodos.'
            : comparacao.diferenca === 0
              ? 'A quantidade de compras registradas é igual à do período anterior.'
              : `${Math.abs(comparacao.diferenca)} compra(s) ${comparacao.diferenca > 0 ? 'a mais' : 'a menos'} que no período anterior.`}
        </Text>

        {groups.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.sectionHeading}>Suas categorias</Text>
            {(categoriesExpanded ? groups : groups.slice(0, 2)).map((group) => (
              <View key={group.categoriaId} style={styles.category}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>
                    {labels.get(group.categoriaId) || 'Categoria não identificada'}
                  </Text>
                  <Text style={styles.note}>
                    {group.compras} compra(s) · {(group.participacao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%
                  </Text>
                </View>
                {Number.isFinite(group.participacao) && (
                  <View style={styles.progressTrack} accessible={false}>
                    <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, group.participacao)) * 100}%` }]} />
                  </View>
                )}
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: categoriesExpanded }}
              accessibilityLabel={categoriesExpanded ? 'Mostrar menos categorias' : 'Ver mais categorias'}
              style={styles.moreButton}
              onPress={() => setOpenedCategoriesPeriod(categoriesExpanded ? null : analise.periodo)}
            >
              <Text style={styles.actionText}>{categoriesExpanded ? 'Mostrar menos' : 'Ver mais'}</Text>
              <MaterialCommunityIcons
                name={categoriesExpanded ? 'chevron-up' : 'chevron-down'}
                size={19}
                color={COLORS.dadoTres}
                accessible={false}
              />
            </Pressable>
          </View>
        )}

        {concentration.comprasSemCategoria > 0 && (
          <Text style={styles.note}>{concentration.comprasSemCategoria} compra(s) sem categoria informada.</Text>
        )}

        {recommendations.length > 0 && <Text style={styles.sectionHeading}>Para refletir</Text>}
        {recommendations.slice(0, 2).map((recommendation) => {
          const key = recommendationKey(analise.periodo, recommendation.codigo);
          const recommendationExpanded = openedRecommendation === key;
          return (
            <Pressable
              key={recommendation.codigo}
              accessibilityRole="button"
              accessibilityState={{ expanded: recommendationExpanded }}
              onPress={() => setOpenedRecommendation(recommendationExpanded ? null : key)}
              style={styles.recommendation}
            >
              <View style={styles.recommendationHeader}>
                <MaterialCommunityIcons name="lightbulb-outline" size={19} color={COLORS.dadoTres} accessible={false} />
                <Text style={[styles.sectionHeading, styles.recommendationTitle]}>{recommendation.titulo}</Text>
                <MaterialCommunityIcons
                  name={recommendationExpanded ? 'chevron-up' : 'chevron-down'}
                  size={19}
                  color={COLORS.dadoTres}
                  accessible={false}
                />
              </View>
              {recommendationExpanded && <Text style={styles.note}>{recommendation.mensagem}</Text>}
            </Pressable>
          );
        })}

        {recommendations.length === 0 && <Text style={styles.note}>Sem orientações disponíveis neste mês.</Text>}
        {recommendations.length > 0 && <Text style={styles.note}>Referência: limites atuais, sem vigência histórica comprovada.</Text>}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title="Seu consumo" variant="dashboard">
        {content}
      </ProfileCard>
    </View>
  );
}
