import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { apresentarMeiaLua } from '../../utils/meiaLuaHome';
import { styles } from './ResumoFinanceiroPeriodo.styles';
const formatCents = value => `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function ResumoFinanceiroPeriodo({ dados, loading, error, onRetry }) {
  const financeiro = { dados, loading, error, refresh: onRetry };
  const resumoFinanceiro = apresentarMeiaLua(loading || error ? null : dados);
  return <View style={styles.financialSummaryCard}>
          <View style={styles.financialSummaryHeader}><Text style={styles.financialSummaryEyebrow}>Resumo financeiro</Text></View>
          {financeiro.loading ? <ActivityIndicator accessibilityLabel="Carregando resumo financeiro" /> : financeiro.error ? <><Text>Erro ao carregar os dados financeiros.</Text><Pressable accessibilityRole="button" onPress={financeiro.refresh} style={styles.retryButton}><Text>Tentar novamente</Text></Pressable></> : <>
            <Text style={styles.financialSummaryLabel}>Gastos do mês</Text>
            <Text style={styles.financialSummaryValue}>{resumoFinanceiro.compras === null ? 'Valor não informado' : formatCents(resumoFinanceiro.compras)}</Text>
            {resumoFinanceiro.orcamento !== null ? <View style={styles.financialBars}>
              {[['Orçamento do mês', resumoFinanceiro.orcamento, 100, COLORS.dadoTres], ['Gastos registrados', resumoFinanceiro.compras, resumoFinanceiro.percentual, resumoFinanceiro.cor]].map(([label, value, width, color]) => <View key={label} style={styles.financialBarRow}>
                <View style={styles.financialBarHeader}><Text style={styles.financialBarLabel}>{label}</Text><Text style={styles.financialBarValue}>{value === null ? '--' : formatCents(value)}</Text></View>
                {width !== null && <View style={styles.financialBarTrack} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: Math.min(100, width)
                }}><View style={[styles.financialBarFill, {
                    width: `${Math.min(100, width)}%`,
                    backgroundColor: color
                  }]} /></View>}
              </View>)}
            </View> : <Text style={styles.noLimitText}>Orçamento do mês não disponível.</Text>}
            {resumoFinanceiro.percentual !== null && <View style={styles.financialSummaryPercentBlock}><Text style={[styles.financialSummaryPercentValue, {
                color: resumoFinanceiro.cor
              }]}>{resumoFinanceiro.percentual.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1
                })}%</Text><Text style={styles.financialSummaryPercentLabel}>do orçamento utilizado</Text></View>}
            {resumoFinanceiro.excesso !== null && <Text style={styles.noLimitText}>{formatCents(resumoFinanceiro.excesso)} acima do orçamento</Text>}
            {financeiro.dados?.financeiro?.qualidade === 'PARCIAL' && <Text style={styles.noLimitText}>Total parcial: há compras sem valor informado.</Text>}
            {financeiro.dados?.orcamento?.vigencia === 'REFERENCIA_OBSERVADA' && <Text style={styles.noLimitText}>Referência observada no mês · histórico parcial</Text>}
          </>}

  </View>;
}
