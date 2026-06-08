import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [animatedGasto, setAnimatedGasto] = useState(0);
  const animatedMetaValue = useRef(new Animated.Value(0)).current;
  const [animatedMeta, setAnimatedMeta] = useState(0);
  const porcentagem = parsedMeta > 0 ? Math.round(((gasto - parsedMeta) / parsedMeta) * 100) : 0;
  const percentualAtingido = parsedMeta > 0 ? Math.round((gasto / parsedMeta) * 100) : 0;
  const percentualAcima = parsedMeta > 0 ? Math.round(((gasto - parsedMeta) / parsedMeta) * 100) : 0;
  const subtituloMeta = parsedMeta <= 0 ? 'Sem meta definida' : gasto > parsedMeta ? `${percentualAcima}% acima` : `${percentualAtingido}% atingido`;
  const gastoFmt = Number(animatedGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const metaFmt = Number(animatedMeta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percentualMeta = parsedMeta > 0 ? (gasto / parsedMeta) * 100 : 0;

  let statusTitulo = 'Dentro da meta';
  let statusMensagem = '';
  let statusCor = '#4CAF50';
  let statusIcone = 'check-circle';

  if (parsedMeta > 0) {
    if (percentualMeta >= 100) {
      statusTitulo = 'Meta excedida';
      statusMensagem = `R$ ${(gasto - parsedMeta).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} acima da meta`;

      statusCor = '#E53935';
      statusIcone = 'alert-circle';
    } else if (percentualMeta >= 80) {
      statusTitulo = 'Atenção';
      statusMensagem = `${Math.round(percentualMeta)}% da meta utilizada`;

      statusCor = '#FFB300';
      statusIcone = 'alert';
    } else {
      statusTitulo = 'Dentro da meta';

      statusMensagem = `Restam R$ ${(parsedMeta - gasto).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      statusCor = '#4CAF50';
      statusIcone = 'check-circle';
    }
  }
  useEffect(() => {
    animatedValue.setValue(0);
    animatedMetaValue.setValue(0);

    animatedValue.addListener(({ value }) => {
      setAnimatedGasto(value);
    });

    animatedMetaValue.addListener(({ value }) => {
      setAnimatedMeta(value);
    });

    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: gasto,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(animatedMetaValue, {
        toValue: parsedMeta,
        duration: 700,
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      animatedValue.removeAllListeners();
      animatedMetaValue.removeAllListeners();
    };
  }, [gasto, parsedMeta]);
  const StatCard = ({ icon, iconColor, label, value, subtitle }) => (
    <View
      style={[
        styles.statCard,
        {
          borderTopColor: iconColor,
          borderTopWidth: 4,
        },
      ]}>
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
        <StatCard icon={statusIcone} iconColor={statusCor} label={statusTitulo} value={`R$ ${gastoFmt}`} subtitle={statusMensagem} />
        <StatCard icon="target" iconColor={COLORS.dadoTres} label="Meta" value={`R$ ${metaFmt}`} subtitle={subtituloMeta} />
        <StatCard icon="clock-outline" iconColor={COLORS.customButtonFundo} label="Tempo em sites" value="2h 45m" subtitle="Hoje" />
      </ScrollView>
    </View>
  );
}
