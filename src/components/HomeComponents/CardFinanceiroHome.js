import { styles } from "./CardFinanceiroHome.styles";
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apresentarMeiaLua, CORES_ORCAMENTO } from '../../utils/meiaLuaHome';
const money = cents => cents === null ? '--' : (cents / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});
const length = Math.PI * 100;
export default function CardFinanceiroHome({
  dados,
  loading,
  error,
  onRetry
}) {
  const [expanded, setExpanded] = useState(false);
  const chart = apresentarMeiaLua(loading || error ? null : dados);
  if (loading) return <View style={styles.card}><Text style={styles.title}>Gastos e orçamento</Text><ActivityIndicator accessibilityLabel="Carregando resumo financeiro" /></View>;
  if (error || !dados) return <View style={styles.card}><Text style={styles.title}>Gastos e orçamento</Text><Text>Erro ao carregar os dados financeiros.</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.touch}><Text style={styles.link}>Tentar novamente</Text></Pressable></View>;
  const f = dados.financeiro;
  return <View style={styles.card}>
    <View style={styles.heading}><Text style={[styles.title, {
        flex: 1
      }]}>Gastos e orçamento</Text>
      {chart.percentual !== null && <Pressable accessibilityRole="button" accessibilityLabel="Sobre o orçamento" accessibilityState={{
        expanded
      }} onPress={() => setExpanded(!expanded)} style={styles.infoButton}><MaterialCommunityIcons name="information-outline" size={20} color="#76658A" accessible={false} /></Pressable>}
    </View>
    {chart.percentual !== null && <View style={styles.gauge} accessible accessibilityRole="progressbar" accessibilityLabel={chart.mensagem} accessibilityValue={{
      min: 0,
      max: 100,
      now: Math.min(100, chart.percentual),
      text: chart.percentual.toLocaleString('pt-BR', {
        maximumFractionDigits: 1
      }) + '%'
    }}>
      <Svg width="100%" height="100%" viewBox="0 0 240 140" accessible={false}>
        <Path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={chart.cor} strokeOpacity={0.2} strokeWidth={14} />
        {chart.progresso > 0 && <Path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={chart.cor} strokeWidth={14} strokeDasharray={[length, length]} strokeDashoffset={length * (1 - chart.progresso)} />}
      </Svg>
    </View>}
    <Text style={[styles.percent, {
      color: chart.cor
    }]}>{chart.percentual === null ? money(chart.compras) : chart.percentual.toLocaleString('pt-BR', {
        maximumFractionDigits: 1
      }) + '%'}</Text>
    <Text style={styles.caption}>{chart.compras === null ? 'Valor não informado' : chart.percentual === null ? 'Gastos registrados' : 'do orçamento utilizado'}</Text>
    {chart.orcamento === null && <Text style={styles.note}>{dados.orcamento?.motivo === 'HISTORICO_INDISPONIVEL' ? 'Orçamento não disponível' : dados.orcamento?.motivo === 'ORCAMENTO_SEM_VIGENCIA_MENSAL' ? 'Orçamento do mês não confirmado' : 'Sem orçamento neste mês'}</Text>}
    {chart.orcamento !== null && <View style={styles.metrics}>
      {chart.percentual !== null && <View style={styles.metric}><Text style={styles.caption}>Gastos</Text><Text style={styles.amount}>{money(chart.compras)}</Text></View>}
      {chart.orcamento !== null && <View style={styles.metric}><Text style={styles.caption}>Orçamento do mês</Text><Text style={styles.amount}>{money(chart.orcamento)}</Text></View>}
    </View>}
    {chart.excesso !== null && <Text style={styles.balance}>Acima do orçamento: {money(chart.excesso)}</Text>}
    {f.qualidade === 'SEM_COMPRAS' && <Text style={styles.note}>Sem compras confirmadas registradas neste mês.</Text>}
    {(f.qualidade === 'PARCIAL' || f.qualidade === 'INSUFICIENTE') && <Text style={styles.note}>{f.comprasSemValor} compra(s) sem valor informado{f.qualidade === 'PARCIAL' ? '. Total parcial.' : '.'}</Text>}
    {dados.orcamento?.vigencia === 'REFERENCIA_OBSERVADA' && <Text style={styles.note}>Referência observada no mês · histórico parcial</Text>}
    {expanded && chart.percentual !== null && <View style={styles.colorList}>
      {['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO'].map((color, index) => <View key={color} style={styles.colorRow}>
        <View style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: CORES_ORCAMENTO[color]
        }} />
        <Text style={[styles.note, styles.colorCopy]}>{['Abaixo de 50%', '50% a menos de 75%', '75% a 100%', 'Acima de 100%'][index]}</Text>
      </View>)}
      <Text style={styles.note}>Utilização do orçamento nos gastos registrados. Não indica impulsividade.</Text>
      {dados.orcamento?.vigencia === 'REFERENCIA_OBSERVADA' && <Text style={styles.note}>Última referência comprovada no mês; não comprova vigência desde o primeiro dia.</Text>}
      <Text style={styles.note}>Cobertura dos registros: {f.cobertura === 'COMPLETA' ? 'completa' : f.cobertura === 'PARCIAL' ? 'parcial' : 'não comprovada'}.</Text>
    </View>}
  </View>;
}
