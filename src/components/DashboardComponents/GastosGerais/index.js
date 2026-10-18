import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { obterJanelaDiaLocal } from '../../../utils/tempoUsoSync';
import { resumirTempoHoje, formatarTempoUso } from '../../../utils/resumoTempoUso';
import { apresentarResumoFinanceiro, apresentarEstadoOrcamento } from '../../../utils/resumoFinanceiro';

function StatCard({ icon, iconColor, label, value, subtitle, cardStyle }) {
  return (
    <View
      style={[
        styles.statCard,
        cardStyle,
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
        {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function ResumoMensalCarousel({
  cards = [],
  monthTitle = 'Resumo do mês',
  onInteractionChange,
  sectionStyle,
  cardStyle,
  scrollContentStyle,
}) {
  return (
    <View style={[styles.section, sectionStyle]}>
      <Text style={styles.monthTitle}>{monthTitle}</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={scrollContentStyle}
        onTouchStart={() => onInteractionChange?.(true)}
        onTouchEnd={() => onInteractionChange?.(false)}
        onTouchCancel={() => onInteractionChange?.(false)}
        onScrollBeginDrag={() => onInteractionChange?.(true)}
        onScrollEndDrag={() => onInteractionChange?.(false)}
        onMomentumScrollEnd={() => onInteractionChange?.(false)}>
        {cards.map((card) => (
          <StatCard key={card.key || card.label} {...card} cardStyle={cardStyle} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function GastosTotais({
  resumo = null,
  resumoLoading = false,
  resumoError = false,
  tempoUso = [],
  cobertura = 'DESCONHECIDA',
  monthTitle = 'Resumo do mês',
})  {
  const { width, fontScale } = useWindowDimensions();
  const cardWidth = Math.max(220, Math.min(width - 44, fontScale > 1.3 ? width - 44 : 300));
  const [showNotes, setShowNotes] = useState(false);
  const totalSegundosHoje = resumirTempoHoje(tempoUso);
  const tempoHojeFormatado = formatarTempoUso(totalSegundosHoje);
  const view = apresentarResumoFinanceiro(resumo, resumoLoading, resumoError);
  const gasto = view.total ?? 0;
  const parsedMeta = view.orcamento ?? 0;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [animatedGasto, setAnimatedGasto] = useState(0);
  const animatedMetaValue = useRef(new Animated.Value(0)).current;
  const [animatedMeta, setAnimatedMeta] = useState(0);
  const gastoFmt = Number(animatedGasto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const metaFmt = Number(animatedMeta).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const statusTitulo = view.titulo;
  const budgetState = apresentarEstadoOrcamento(resumo, resumoLoading, resumoError, cobertura);
  const statusMensagem = `${view.mensagem} · ${budgetState.mensagem}`;
  const statusCor = budgetState.cor;
  const statusIcone = budgetState.estado === 'VERMELHO' ? 'alert-circle' : 'chart-donut';
  const subtituloMeta = view.subtitulo;
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
          borderTopWidth: 3,
          width: cardWidth,
        },
      ]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
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
        <StatCard icon={statusIcone} iconColor={statusCor} label={statusTitulo} value={view.total === null ? '--' : `R$ ${gastoFmt}`} subtitle={budgetState.mensagem} />
        <StatCard icon="target" iconColor={COLORS.dadoTres} label="Orçamento mensal" value={view.orcamento === null ? '--' : `R$ ${metaFmt}`} subtitle={subtituloMeta} />
        <StatCard
          icon="clock-outline"
          iconColor={COLORS.customButtonFundo}
          label="Tempo em aplicativos"
          value={tempoHojeFormatado}
          subtitle={totalSegundosHoje > 0 ? 'Hoje' : 'Sem dados registrados'}
/>
      </ScrollView>
      <Text style={styles.coverageNote}>{view.mensagem}. Os registros podem não incluir todos os gastos.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showNotes }} onPress={() => setShowNotes(!showNotes)} style={styles.notesButton}><Text style={styles.notesLink}>Sobre estes dados</Text></Pressable>
      {showNotes && <Text style={styles.coverageNote}>{statusMensagem}. Limites atuais, sem comprovação da vigência histórica.</Text>}
    </View>
  );
}
