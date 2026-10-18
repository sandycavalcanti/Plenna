import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { apresentarResumoFinanceiro } from '../../../utils/resumoFinanceiro';
import { resumirTempoHoje, formatarTempoUso } from '../../../utils/resumoTempoUso';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';
import CardFinanceiroHome from '../CardFinanceiroHome';
import { financeiroHome } from '../../../utils/resumoHome';
const moeda = value => value === null || value === undefined ? '--' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export default function ResumoInterativo({ dados, loading, error, selecionado, onSelect, perspectiva, onPerspectiva, tempo, onDetalhes, onRetry, onMetas }) {


  const resumo = financeiroHome(dados);
  const view = apresentarResumoFinanceiro(resumo, loading, error);



  const seconds = resumirTempoHoje(tempo.registros);
  const timeText = tempo.estado === 'CARREGANDO' ? 'Carregando' : tempo.estado === 'ERRO' ? 'Indisponível' : tempo.estado === 'SEM_CONSENTIMENTO' ? 'Sem autorização' : seconds > 0 ? formatarTempoUso(seconds) : '--';
  const options = [{ id: 'gastos', icon: 'wallet-outline', label: 'Gastos', value: moeda(view.total) }, { id: 'meta', icon: 'bullseye-arrow', label: 'Orçamento', value: moeda(view.orcamento) }, { id: 'tempo', icon: 'clock-outline', label: 'Tempo em Aplicativos', value: timeText }];
  return <View style={styles.section}>
    <Text style={styles.heading}>Resumo do mês</Text>
    <View style={styles.selectors}>{options.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: selecionado === option.id }} onPress={() => onSelect(option.id)} style={[styles.selector, selecionado === option.id && styles.active]}>
      <MaterialCommunityIcons name={option.icon} size={22} color="#8660A1" accessible={false} /><Text style={styles.label}>{option.label}</Text><Text style={styles.value}>{option.value}</Text>
    </Pressable>)}</View>
    <View style={styles.detail} accessibilityLiveRegion="polite">
      {selecionado !== 'tempo' ? <CardFinanceiroHome dados={dados} loading={loading} error={error} onRetry={onRetry} /> : <>
        <View style={styles.detailHeader}><Text style={styles.label}>Tempo em Aplicativos · hoje</Text><Text style={styles.amount}>{timeText}</Text></View>
        <Text>{tempo.estado === 'NAO_SOLICITADO' || tempo.estado === 'CARREGANDO' ? 'Carregando registros disponíveis...' : tempo.estado === 'ERRO' ? 'Falha ao consultar registros. Tente novamente.' : tempo.estado === 'SEM_CONSENTIMENTO' ? 'Monitoramento não autorizado. Gerencie suas permissões no Perfil.' : seconds > 0 ? 'Uso registrado nos aplicativos monitorados. Não representa o uso de todos os dispositivos.' : 'Sem registros disponíveis hoje; isso não comprova ausência de uso.'}</Text>
      </>}
      <View style={styles.actions}>

        <Pressable accessibilityRole="button" onPress={() => onDetalhes(selecionado)}><Text style={styles.link}>Ver detalhes</Text></Pressable>
      </View>
    </View>
    <Text style={styles.heading}>Seus próximos passos</Text>
    {!loading && !error && dados && <Text style={styles.summary}>{dados.financeiro.comprasConfirmadas} compra(s) confirmada(s) registrada(s) neste mês.</Text>}
    <View style={styles.selectors}>
      <Pressable accessibilityRole="button" onPress={onMetas} style={styles.selector}><MaterialCommunityIcons name="bullseye-arrow" size={22} color="#8660A1" accessible={false}/><Text style={styles.label}>Suas metas</Text><Text style={styles.note}>Acompanhe seus objetivos no Perfil.</Text><Text style={styles.link}>Ver metas</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => onDetalhes('orientacoes')} style={styles.selector}><MaterialCommunityIcons name="chart-box-outline" size={22} color="#8660A1" accessible={false}/><Text style={styles.label}>Análises no Dashboard</Text><Text style={styles.note}>Escolha o período e veja suas análises.</Text><Text style={styles.link}>Abrir Dashboard</Text></Pressable>
    </View>
    <Text style={styles.note}>Categorias e pagamentos permanecem indisponíveis nesta Home para preservar sua privacidade.</Text>
  </View>;
}
