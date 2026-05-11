import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../../constants';

export default function GastosTotais({ compras = [], meta = 0, monthTitle = 'Resumo do mês' }) {
  const parsedMeta = Number(meta) || 0;

  const gasto = compras.reduce((acc, c) => {
    if (c == null) return acc;

    if (typeof c === 'object') {
      if ('compra_item_valor' in c) {
        return acc + (Number(c.compra_item_valor) || 0);
      }

      if ('compra_valor' in c) {
        return acc + (Number(c.compra_valor) || 0);
      }
    }

    const n = Number(c) || 0;
    return acc + n;
  }, 0);

  const porcentagem = parsedMeta > 0 ? Math.round(((gasto - parsedMeta) / parsedMeta) * 100) : 0;
  const gastoFmt = gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const metaFmt = parsedMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const StatCard = ({ icon, iconColor, label, value, subtitle }) => (
    <View style={[styles.statCard, { borderTopColor: iconColor }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.monthTitle}>{monthTitle}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <StatCard icon="wallet" iconColor={COLORS.dadoDois} label="Gastos totais" value={`R$ ${gastoFmt}`} subtitle={`${porcentagem >= 0 ? '+' : ''}${porcentagem}% da meta`} />
        <StatCard icon="target" iconColor={COLORS.dadoTres} label="Meta" value={`R$ ${metaFmt}`} subtitle={`${Math.round((gasto / parsedMeta) * 100)}% atingido`} />
        <StatCard icon="clock-outline" iconColor={COLORS.customButtonFundo} label="Tempo em sites" value="2h 45m" subtitle="Hoje" />
      </ScrollView>
    </View>
  );
}
