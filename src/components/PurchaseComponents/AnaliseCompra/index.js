import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { apresentarAvaliacao } from './apresentacao';
import { comporInsightsContextuais, fatoresDoInsight } from './insightsContextuais';
import { useAvaliacaoCompra } from './useAvaliacaoCompra';
import PainelAnalise from './PainelAnalise';
import { styles as s } from './styles';
import { apresentarDadosObjetivos } from './dimensoes';
import { interpretarSinais } from './sinaisDecisao';
import RespostaAnalise from './RespostaAnalise';
import AnaliseAutomatica from '../AnaliseAutomatica';
export function formatarAtualizacao(value) {
  if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Date.parse(value))) return null;
  const date = new Date(value),
    opcoes = {
      timeZone: 'America/Sao_Paulo'
    };
  const dia = date.toLocaleDateString('pt-BR', opcoes);
  const hora = date.toLocaleTimeString('pt-BR', {
    ...opcoes,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const [h, m] = hora.split(':');
  return `${dia}, \u00e0s ${h}h${m === '00' ? '' : m}`;
}
export default function AnaliseCompra({
  compraId,
  compra,
  classificacaoDeclarada,
  revisao,
  refreshKey = 0,
  active = true,
  onOpenDetails,
  restricaoInsight,
  itensPermitidos,
  onRevalidar,
  revisaoEventos,
  eventos,
  onDecisaoSalva,
  onClassificar,
  gerarInicialAutomaticamente = false,
  respostaPermitida = true
}) {
  const {
    state,
    consultar,
    calcular
  } = useAvaliacaoCompra({
    compraId,
    revisao,
    refreshKey,
    active
  });
  const [localPanel, setLocalPanel] = useState(null);
  const geracoesIniciais = useRef(new Set());
  useEffect(() => {
    const chave = `${compraId}:${revisao}`;
    if (gerarInicialAutomaticamente && respostaPermitida && active && !restricaoInsight && Number.isInteger(revisao) && state.status === 'ready' && state.dados?.atualidade === 'SEM_AVALIACAO' && !geracoesIniciais.current.has(chave)) {
      geracoesIniciais.current.add(chave);
      calcular();
    }
  }, [gerarInicialAutomaticamente, respostaPermitida, active, restricaoInsight, compraId, revisao, state.status, state.dados, calcular]);
  const detailsHost = useRef(onOpenDetails);
  detailsHost.current = onOpenDetails;
  const view = useMemo(() => apresentarAvaliacao(state.dados, revisao), [state.dados, revisao]);
  const composto = useMemo(() => comporInsightsContextuais(state.dados, {
    compraId,
    revisao,
    indisponibilidade: active ? restricaoInsight : 'ANALISE_INATIVA',
    itensPermitidos
  }), [state.dados, compraId, revisao, restricaoInsight, itensPermitidos, active]);
  const insight = composto.principal,
    fatores = fatoresDoInsight(insight).slice(0, 3);
  const sinais = useMemo(() => interpretarSinais(composto), [composto]);
  const classificacao = {
    IMPULSIVA: 'Impulsiva',
    NAO_IMPULSIVA: 'Não impulsiva'
  }[classificacaoDeclarada ?? compra?.compra_classificacao];
  const decisaoHumana = [...(eventos ?? [])].sort((a, b) => b.revisao - a.revisao).find(e => e.tipo === 'CLASSIFICACAO' || e.tipo === 'RESPOSTA_ANALISE' && e.dados?.confirmarImpulsiva);
  const dataAnalise = formatarAtualizacao(state.dados?.criadaEm);
  const dataClassificacao = formatarAtualizacao(decisaoHumana?.registradaEm);
  const objetivo = active && ['ready', 'error', 'conflict'].includes(state.status) ? apresentarDadosObjetivos(compra, {
    compraId,
    restricao: restricaoInsight,
    itensPermitidos
  }) : null;
  const stale = view.stale || composto.estado === 'DESATUALIZADO';
  useEffect(() => {
    if (!active || state.status !== 'ready' || restricaoInsight) {
      setLocalPanel(null);
      detailsHost.current?.(null);
    }
  }, [active, state.status, restricaoInsight]);
  const ready = state.status === 'ready',
    loading = state.status === 'loading';
  const restrictions = {
    VERIFICANDO_COMPRA: 'Verificando a situação atual da compra…',
    VERIFICACAO_INDISPONIVEL: 'Não foi possível verificar a situação da compra.',
    CANCELAMENTO_REGISTRADO: 'Há cancelamento registrado. O insight não será tratado como atual.',
    COMPRA_NAO_CONFIRMADA: 'O insight fica disponível para compras confirmadas.'
  };
  const message = state.status === 'session' ? 'Sua sessão mudou. Entre novamente para consultar.' : state.status === 'conflict' ? 'Suas respostas mudaram. Recarregue a análise.' : !ready ? 'Não foi possível consultar a análise agora.' : stale ? 'Esta avaliação está desatualizada. Atualize para considerar os dados atuais.' : restricaoInsight ? restrictions[restricaoInsight] ?? 'O insight está indisponível para esta compra.' : !state.dados?.resultado ? 'Nenhuma avaliação registrada para esta compra.' : composto.estado === 'INVALIDO' ? 'Não foi possível verificar as evidências desta avaliação.' : composto.estado === 'INDISPONIVEL' ? 'Não há insight disponível para a situação atual desta compra.' : !insight ? 'Sem evidências contextuais válidas para uma reflexão sobre os motivos desta compra.' : insight.reflexao;
  const open = () => {
    const value = {
      avaliacao: state.dados,
      opcoesInsight: {
        indisponibilidade: restricaoInsight,
        itensPermitidos
      }
    };
    if (onOpenDetails) onOpenDetails(value);else setLocalPanel(value);
  };
  return <View style={s.content}>
    {!restricaoInsight && respostaPermitida && <AnaliseAutomatica compact compraId={compraId} revisao={revisao} refreshKey={refreshKey} active={active} />}
    {!insight && objetivo && <View style={s.reflection}><Ionicons name="receipt-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><View style={s.copy}>
      <Text accessibilityRole="header" style={s.title}>Sobre este registro</Text><Text style={s.body}>{objetivo.observacao}</Text>
      <Text style={s.caption}>{objetivo.origem}. Contexto voluntário e histórico são dimensões independentes.</Text>
      <Text style={s.body}>{objetivo.pergunta}</Text>
    </View></View>}
    <View style={s.hero}>
      <View style={s.heading}><Ionicons name="sparkles-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><Text accessibilityRole="header" style={s.title}>Análise do Plenna</Text></View>
      {ready && !restricaoInsight && <Text style={s.result}>{sinais.titulo}</Text>}
      {loading ? <ActivityIndicator accessibilityLabel="Consultando avaliação registrada" /> : <Text accessibilityRole={!ready || stale || restricaoInsight ? 'alert' : undefined} style={s.body}>{message}</Text>}
      {insight && <Text style={s.caption}>{sinais.estado === 'NAO_IDENTIFICADOS' ? 'Isso não comprova ausência de impulsividade.' : 'Interpretação das suas declarações, sem classificação automática.'}</Text>}
      {restricaoInsight === 'VERIFICACAO_INDISPONIVEL' && onRevalidar && <Pressable accessibilityRole="button" onPress={onRevalidar} style={s.action}><Text style={s.link}>Recarregar dados</Text></Pressable>}
      {!loading && state.status !== 'session' && !restricaoInsight && <Pressable accessibilityRole="button" onPress={ready && Number.isInteger(revisao) ? calcular : consultar} style={s.action}>
        <Text style={s.link}>{!ready ? 'Tentar novamente' : !Number.isInteger(revisao) ? 'Recarregar análise' : state.dados?.avaliacaoId ? 'Atualizar reflexão' : 'Gerar reflexão opcional'}</Text>
      </Pressable>}
    </View>
    {!!fatores.length && <View style={s.section}><Text accessibilityRole="header" style={s.title}>Fatores relacionados</Text>
      <View style={s.factors}>{fatores.map(f => <View key={f.id} style={s.factor}>
        <Ionicons name={f.icone} size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={s.factorLabel}>{f.titulo}</Text><Text style={s.factorValue}>{f.valorCurto}</Text>
      </View>)}</View>
    </View>}
    {active && ready && insight && sinais.estado === 'OBSERVADOS' && !restricaoInsight && !stale && respostaPermitida && <RespostaAnalise key={sinais.id} compraId={compraId} avaliacao={state.dados} sinais={sinais} revisaoEventos={revisaoEventos} eventos={eventos} onSaved={onDecisaoSalva} />}
    {active && ready && !restricaoInsight && <View style={s.classification}><Ionicons name="person-outline" size={20} color={DASHBOARD_THEME.colors.navy} /><Text style={s.body}>Sua classificação: {classificacao ?? 'Ainda não informada'}</Text></View>}
    {active && ready && !restricaoInsight && onClassificar && <Pressable accessibilityRole="button" onPress={onClassificar} style={s.action}><Text style={s.link}>Revisar classificação</Text></Pressable>}
    {insight?.pergunta && <View style={s.reflection}><Ionicons name="chatbubble-ellipses-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><View style={s.copy}>
      <Text accessibilityRole="header" style={s.title}>Para refletir</Text><Text style={s.body}>{insight.pergunta}</Text>
    </View></View>}
    <Pressable accessibilityRole="button" accessibilityLabel="Entender esta análise" disabled={loading || state.status === 'session'} onPress={open} style={[s.detailsButton, (loading || state.status === 'session') && s.disabled]}>
      <Ionicons name="analytics-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={[s.link, s.copy]}>Entender esta análise</Text><Ionicons name="chevron-forward" size={18} color={DASHBOARD_THEME.colors.navy} />
    </Pressable>
    {localPanel && <PainelAnalise {...localPanel} compraId={compraId} revisao={revisao} onClose={() => setLocalPanel(null)} />}
    {active && ready && !restricaoInsight && (dataAnalise || dataClassificacao) && <View style={s.updates}>
      <Text style={s.caption}>Últimas atualizações</Text>
      {dataAnalise && <View style={s.updateRow}><Ionicons name="refresh-outline" size={14} color={DASHBOARD_THEME.colors.navy} /><Text style={s.caption}>Análise: {dataAnalise}</Text></View>}
      {dataClassificacao && <View style={s.updateRow}><Ionicons name="person-outline" size={14} color={DASHBOARD_THEME.colors.navy} /><Text style={s.caption}>Classificação: {dataClassificacao}</Text></View>}
    </View>}

  </View>;
}
