import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { styles } from './CardFinanceiroHome.styles';
import { apresentarMeiaLua, CORES_ORCAMENTO } from '../../utils/meiaLuaHome';
import { valorRealParaCentavos } from '../../utils/metaMoney';

const money = (cents) => cents === null
  ? '--'
  : (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const length = Math.PI * 100;

export default function CardFinanceiroHome({ dados, loading, error, onRetry, orcamentoFixo }) {
  const [expanded, setExpanded] = useState(false);
  const chart = apresentarMeiaLua(loading || error ? null : dados, valorRealParaCentavos(orcamentoFixo));

  if (loading) {
    return <View style={styles.card}><Text style={styles.title}>Gastos e orçamento</Text><ActivityIndicator accessibilityLabel="Carregando resumo financeiro" /></View>;
  }

  if (error || !dados) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Gastos e orçamento</Text>
        <Text>Erro ao carregar os dados financeiros.</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.touch}>
          <Text style={styles.link}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const financeiro = dados.financeiro;
  const percentual = chart.percentual;
  const hasCompleteCoverage = financeiro?.qualidade === 'COMPLETO' && financeiro?.cobertura === 'COMPLETA';

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={[styles.title, { flex: 1 }]}>Gastos e orçamento</Text>
        {percentual !== null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sobre o orçamento"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((current) => !current)}
            style={styles.infoButton}
          >
            <MaterialCommunityIcons name="information-outline" size={20} color="#76658A" accessible={false} />
          </Pressable>
        ) : null}
      </View>

      {percentual !== null ? (
        <View
          style={styles.gauge}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={chart.mensagem}
          accessibilityValue={{ min: 0, max: 100, now: Math.min(100, percentual), text: `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 240 140" accessible={false}>
            <Path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={chart.cor} strokeOpacity={0.2} strokeWidth={14} />
            {chart.progresso > 0 ? <Path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={chart.cor} strokeWidth={14} strokeDasharray={[length, length]} strokeDashoffset={length * (1 - chart.progresso)} /> : null}
          </Svg>
        </View>
      ) : null}

      <Text style={[styles.percent, { color: chart.cor }]}>
        {percentual === null ? (chart.compras === null ? '--' : money(chart.compras)) : `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
      </Text>
      <Text style={styles.caption}>{chart.compras === null ? 'Valor não informado' : percentual === null ? 'Utilização indisponível' : 'do orçamento utilizado'}</Text>
      <Text style={[styles.state, { color: chart.cor }]}>{percentual === null ? 'Utilização indisponível' : hasCompleteCoverage ? chart.mensagem : 'Dados parciais'}</Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="shopping-outline" size={22} color="#8660A1" accessible={false} />
          <Text style={styles.caption}>Gastos</Text>
          <Text style={styles.amount}>{money(chart.compras)}</Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="bullseye-arrow" size={22} color="#8660A1" accessible={false} />
          <Text style={styles.caption}>Orçamento do mês</Text>
          <Text style={styles.amount}>{money(chart.orcamento)}</Text>
        </View>
      </View>

      {chart.orcamento === null ? <Text style={styles.note}>{dados.orcamento?.motivo === 'HISTORICO_INDISPONIVEL' ? 'Orçamento não disponível' : dados.orcamento?.motivo === 'ORCAMENTO_SEM_VIGENCIA_MENSAL' ? 'Orçamento do mês não confirmado' : 'Sem orçamento neste mês'}</Text> : null}
      {chart.excesso !== null ? <Text style={styles.balance}>Acima do orçamento: {money(chart.excesso)}</Text> : null}
      {financeiro?.qualidade === 'PARCIAL' || financeiro?.qualidade === 'INSUFICIENTE' ? <Text style={styles.note}>{financeiro.comprasSemValor} compra(s) sem valor informado{financeiro.qualidade === 'PARCIAL' ? '. Total parcial.' : '.'}</Text> : null}
      {dados.orcamento?.vigencia === 'REFERENCIA_OBSERVADA' ? <Text style={styles.note}>Referência observada no mês · histórico parcial</Text> : null}

      {percentual !== null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entender as cores do orçamento"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((current) => !current)}
          style={styles.touch}
        >
          <MaterialCommunityIcons name="information-outline" size={20} color="#76658A" accessible={false} />
          <Text style={styles.link}>Entenda as cores</Text>
          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#76658A" accessible={false} />
        </Pressable>
      ) : null}

      {expanded && percentual !== null ? (
        <View style={styles.colorList}>
          {['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO'].map((color, index) => (
            <View key={color} style={styles.colorRow}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CORES_ORCAMENTO[color] }} />
              <Text style={[styles.note, styles.colorCopy]}>{['Abaixo de 50%', '50% a menos de 75%', '75% a 100%', 'Acima de 100%'][index]}</Text>
            </View>
          ))}
          <Text style={styles.note}>Utilização do orçamento nos gastos registrados. Não indica impulsividade.</Text>
          {dados.orcamento?.vigencia === 'REFERENCIA_OBSERVADA' ? <Text style={styles.note}>Última referência comprovada no mês; não comprova vigência desde o primeiro dia.</Text> : null}
          <Text style={styles.note}>Cobertura dos registros: {financeiro?.cobertura === 'COMPLETA' ? 'completa' : financeiro?.cobertura === 'PARCIAL' ? 'parcial' : 'não comprovada'}.</Text>
        </View>
      ) : null}
    </View>
  );
}
