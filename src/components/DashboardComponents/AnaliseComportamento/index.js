import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


function monthLabel(periodo) {
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(periodo ?? '')) return 'Período não informado';
  return new Date(periodo + '-01T12:00:00Z').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
const styles = {
  card: { marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE4F2' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#594367', flexShrink: 1 },
  body: { gap: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryName: { fontSize: 13, lineHeight: 19, color: '#655A70', flexGrow: 1, flexShrink: 1, flexBasis: 100 },
  caveat: { fontSize: 12, lineHeight: 18, color: '#655A70' },
  metric: { flexGrow: 1, flexBasis: 110, padding: 12, borderRadius: 14, backgroundColor: '#FAF7FC' },
  value: { fontSize: 23, fontWeight: '700', color: '#594367' },
  label: { fontSize: 13, lineHeight: 19, color: '#655A70' },
  heading: { fontSize: 16, fontWeight: '600', color: '#594367' },
  note: { fontSize: 13, lineHeight: 19, color: '#655A70' },
  recommendation: { minHeight: 48, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E9DCEE', gap: 6 },
  category: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingVertical: 6 },
  retry: { minHeight: 48, justifyContent: 'center' },
};
export default function AnaliseComportamento({ dados, loading, error, onRetry }) {
  const [opened, setOpened] = useState(null);
  const [openedRecommendation, setOpenedRecommendation] = useState(null);
  const expanded = Boolean(dados?.analise?.periodo && opened === dados.analise.periodo);
  let content;
  if (loading) content = <View><ActivityIndicator accessibilityLabel="Carregando análise de consumo" /><Text style={styles.note}>Carregando análise...</Text></View>;
  else if (error) content = <View><Text style={styles.note}>Não foi possível carregar a análise.</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={onRetry}><Text style={styles.heading}>Tentar novamente</Text></Pressable></View>;
  else if (!dados) content = <Text style={styles.note}>Análise indisponível.</Text>;
  else {
    const { analise, recomendacoes, categorias = [] } = dados;
    const { frequencia, categorias: concentration, financeiro, comparacao } = analise.indicadores;
    const labels = new Map(categorias.map(c => [c.id, c.nome]));
    const groups = concentration?.grupos ?? [];
    const recommendations = recomendacoes?.recomendacoes ?? [];
    content = <View style={styles.body}>
      <Text style={styles.heading}>{monthLabel(analise.periodo)}</Text>
      <View style={styles.row}>
        <View style={styles.metric}><View style={styles.metricTop}><MaterialCommunityIcons name="shopping-outline" size={20} color="#8660A1" accessible={false} /><Text style={styles.value}>{frequencia.compras}</Text></View><Text style={styles.label}>Compras confirmadas</Text></View>
        <View style={styles.metric}><View style={styles.metricTop}><MaterialCommunityIcons name="cash-check" size={20} color="#8660A1" accessible={false} /><Text style={styles.value}>{typeof financeiro.total==='number'&&Number.isFinite(financeiro.total)?financeiro.total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'--'}</Text></View><Text style={styles.label}>Compras com valor conhecido</Text></View>
      </View>
      {frequencia.compras === 0 && <Text style={styles.note}>Nenhuma compra confirmada registrada neste período.</Text>}
      {financeiro.comprasSemValor > 0 && <Text style={styles.note}>{financeiro.comprasSemValor} compra(s) sem valor. Os totais conhecidos podem estar incompletos.</Text>}
      <Text style={styles.note}>Considera apenas os registros disponíveis; podem faltar gastos.</Text>
      {analise.avaliacao.estado === 'DADOS_INSUFICIENTES' && <Text style={styles.note}>Não há uma avaliação de impulsividade disponível.</Text>}
      {(expanded || comparacao.disponibilidade !== 'INDISPONIVEL') && <Text style={styles.note}>{comparacao.disponibilidade === 'INDISPONIVEL' ? 'Ainda não há dados suficientes para comparar os períodos.' : comparacao.diferenca === 0 ? 'A quantidade de compras registradas é igual à do período anterior.' : Math.abs(comparacao.diferenca) + ' compra(s) ' + (comparacao.diferenca > 0 ? 'a mais' : 'a menos') + ' que no período anterior.'}</Text>}
      {groups.length > 0 && <View><Text style={styles.heading}>Suas categorias</Text>{(expanded ? groups : groups.slice(0, 2)).map(group => <View key={group.categoriaId} style={styles.category}><Text style={styles.categoryName}>{labels.get(group.categoriaId) || 'Categoria não identificada'}</Text><Text style={styles.note}>{group.compras} compra(s) · {(group.participacao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</Text>{Number.isFinite(group.participacao) && <View style={{width:'100%',height:6,borderRadius:3,backgroundColor:'#F0EAF4'}} accessible={false}><View style={{width:Math.max(0,Math.min(1,group.participacao))*100+'%',height:6,borderRadius:3,backgroundColor:'#C69ABA'}} /></View>}</View>)}<Text style={styles.note}>Participação entre compras categorizadas; grupos podem se sobrepor.</Text></View>}
      {concentration.comprasSemCategoria > 0 && <Text style={styles.note}>{concentration.comprasSemCategoria} compra(s) sem categoria informada.</Text>}
      {recommendations.length > 0 && <Text style={styles.heading}>Para refletir</Text>}
      {recommendations.slice(0, 2).map(rec => <Pressable key={rec.codigo} accessibilityRole="button" accessibilityState={{expanded: expanded || openedRecommendation === analise.periodo + ':' + rec.codigo}} onPress={() => { if (expanded) setOpened(null); setOpenedRecommendation(expanded || openedRecommendation === analise.periodo + ':' + rec.codigo ? null : analise.periodo + ':' + rec.codigo); }} style={styles.recommendation}>
        <View style={styles.metricTop}><MaterialCommunityIcons name="lightbulb-outline" size={20} color="#8660A1" accessible={false} /><Text style={[styles.heading,{flex:1}]}>{rec.titulo}</Text><MaterialCommunityIcons name={expanded || openedRecommendation === analise.periodo + ':' + rec.codigo ? 'chevron-up' : 'chevron-down'} size={20} color="#8660A1" accessible={false} /></View>{(expanded || openedRecommendation === analise.periodo + ':' + rec.codigo) && <Text style={styles.note}>{rec.mensagem}</Text>}


      </Pressable>)}
      {recommendations.length === 0 && <Text style={styles.note}>Sem orientações disponíveis neste mês.</Text>}
      {recommendations.length > 0 && <Text style={styles.note}>Referência: limites atuais, sem vigência histórica comprovada.</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{expanded}} accessibilityLabel={expanded ? 'Recolher explicações do resumo' : 'Entender o resumo e suas orientações'} style={[styles.retry, styles.row]} onPress={() => setOpened(expanded ? null : analise.periodo)}><MaterialCommunityIcons name={expanded ? 'chevron-up' : 'information-outline'} size={20} color="#8660A1" accessible={false} /><Text style={styles.heading}>{expanded ? 'Mostrar menos' : 'Entenda o resumo'}</Text></Pressable>
      {expanded && <Text style={styles.note}>Estes indicadores não classificam compras como impulsivas. O período financeiro usa UTC.</Text>}
    </View>;
  }
  return <View style={styles.card}><View style={styles.header}><MaterialCommunityIcons name="chart-box-outline" size={22} color="#8660A1" accessible={false} /><Text style={styles.title}>Seu consumo</Text></View>{content}</View>;
}
