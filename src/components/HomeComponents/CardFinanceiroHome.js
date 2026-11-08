import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apresentarMeiaLua, CORES_ORCAMENTO } from '../../utils/meiaLuaHome';
import { valorRealParaCentavos } from '../../utils/metaMoney';

const money = (cents) => cents === null ? '--' : (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const length = Math.PI * 100;

export default function CardFinanceiroHome({ dados, loading, error, onRetry, orcamentoFixo }) {
  const [expanded, setExpanded] = useState(false);
  const chart = apresentarMeiaLua(loading || error ? null : dados, valorRealParaCentavos(orcamentoFixo));

  if (loading) {
    return <View style={styles.card}><Text style={styles.title}>Compras e orçamento</Text><ActivityIndicator accessibilityLabel="Carregando resumo financeiro" /></View>;
  }
  if (error || !dados) {
    return <View style={styles.card}><Text style={styles.title}>Compras e orçamento</Text><Text>Erro ao carregar os dados financeiros.</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.touch}><Text style={styles.link}>Tentar novamente</Text></Pressable></View>;
  }

  const f = dados.financeiro || {};
  const hasCompleteCoverage = ['COMPLETA', 'COMPLETO'].includes(f.qualidade) && f.cobertura === 'COMPLETA';
  const qualityNote = ['PARCIAL', 'INSUFICIENTE'].includes(f.qualidade)
      ? `${f.comprasSemValor || 0} compra(s) sem valor informado${f.qualidade === 'PARCIAL' ? '. Total parcial.' : '.'}`
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compras e orçamento</Text>
      {chart.percentual !== null && <View
        style={styles.gauge}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={chart.mensagem}
        accessibilityValue={{ min: 0, max: 100, now: Math.min(100, chart.percentual), text: chart.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 240 140" accessible={false}>
          <Path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#EEE8F2" strokeWidth={14} />
          {chart.progresso > 0 && <Path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={chart.cor} strokeWidth={14} strokeDasharray={[length, length]} strokeDashoffset={length * (1 - chart.progresso)} />}
        </Svg>
      </View>}
      <Text style={[styles.percent, { color: chart.cor }]}>{chart.percentual === null ? '--' : chart.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'}</Text>
      <Text style={styles.caption}>{chart.percentual === null ? 'Utilização indisponível' : 'do orçamento utilizado'}</Text>
      <Text style={[styles.state, { color: chart.cor }]}>{chart.percentual === null ? `Utilização indisponível · ${chart.mensagem}` : hasCompleteCoverage ? chart.mensagem : 'Dados parciais'}</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}><MaterialCommunityIcons name="shopping-outline" size={22} color="#8660A1" accessible={false} /><Text style={styles.caption}>Compras</Text><Text style={styles.amount}>{money(chart.compras)}</Text></View>
        <View style={styles.metric}><MaterialCommunityIcons name="bullseye-arrow" size={22} color="#8660A1" accessible={false} /><Text style={styles.caption}>Orçamento</Text><Text style={styles.amount}>{money(chart.orcamento)}</Text></View>
      </View>
      {chart.excesso !== null && <Text style={styles.state}>Excesso conhecido: {money(chart.excesso)} · Acima do orçamento</Text>}
      {chart.orcamento === null && <Text style={styles.note}>{dados.orcamento?.motivo === 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' ? 'Sem orçamento neste mês.' : 'Sem orçamento neste mês.'}</Text>}
      {qualityNote && <Text style={styles.note}>{qualityNote}</Text>}
      {dados.orcamento?.vigencia === 'REFERENCIA_OBSERVADA' && <Text style={styles.note}>Referência observada no mês · histórico parcial.</Text>}
      {dados.orcamento?.motivo === 'ORCAMENTO_HISTORICO_NAO_COMPROVADO' && <Text style={styles.note}>Orçamento histórico não comprovado para este período.</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.touch}>
        <MaterialCommunityIcons name="information-outline" size={20} color="#76658A" accessible={false} /><Text style={styles.link}>Entenda as cores</Text><MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#76658A" accessible={false} />
      </Pressable>
      {expanded && <View style={styles.colorList}>
        {['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO'].map((color, index) => <View key={color} style={styles.colorRow}><MaterialCommunityIcons name="circle" size={9} color={CORES_ORCAMENTO[color]} accessible={false} /><View style={styles.colorCopy}><Text style={styles.link}>{['Abaixo de 50%', '50% a menos de 75%', '75% a 100%', 'Acima de 100%'][index]}</Text><Text style={styles.note}>Utilização do orçamento nos gastos registrados.</Text></View></View>)}
        <Text style={styles.note}>A utilização do orçamento não indica impulsividade nem representa saldo bancário.</Text>
        <Text style={styles.note}>Cobertura dos registros: {f.cobertura === 'COMPLETA' ? 'completa' : f.cobertura === 'PARCIAL' ? 'parcial' : 'não comprovada'}.</Text>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  title: { marginBottom: 2, fontSize: 19, fontWeight: '700', color: '#4A4E7A', textAlign: 'center' },
  gauge: { width: '100%', maxWidth: 210, aspectRatio: 240 / 132, alignSelf: 'center', marginTop: -2, marginBottom: -9 },
  percent: { fontSize: 27, lineHeight: 31, fontWeight: '800', textAlign: 'center' },
  caption: { fontSize: 13, lineHeight: 17, color: '#4A4E7A', textAlign: 'center' },
  state: { fontSize: 13, lineHeight: 18, textAlign: 'center', marginVertical: 4 },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#FAF7FC', borderRadius: 14 },
  amount: { fontSize: 18, lineHeight: 22, fontWeight: '700', color: '#4A4E7A', textAlign: 'center' },
  note: { fontSize: 11, lineHeight: 16, color: '#76658A', marginVertical: 2 },
  touch: { minHeight: 38, marginTop: 4, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#EEE8F2', borderRadius: 10, backgroundColor: '#FAF7FC' },
  link: { color: '#76658A', fontSize: 13, fontWeight: '600' },
  colorList: { marginTop: 2 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  colorCopy: { flex: 1, minWidth: 0 },
});
