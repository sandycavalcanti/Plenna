import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarConsultaAvaliacao } from '../../../services/avaliacaoCompraService';
import RegistroHistorico, { LinhaHistorica } from './RegistroHistorico';
import { styles as s } from './RegistroHistorico.styles';
import { apresentarAvaliacaoHistorica } from './apresentacao';
export default function RegistroAvaliacao({
  row,
  compraId,
  modo,
  expanded,
  onToggle
}) {
  const [state, setState] = useState({
    status: 'idle',
    dados: null
  });
  const [retry, setRetry] = useState(0);
  const reflections = modo === 'reflexoes';
  const needsFull = !row.explicacao || !reflections && !row.explicacao.fatoresCompletos;
  const cached = state.compraId === compraId && state.id === row.avaliacaoId ? state : {
    status: 'idle',
    dados: null
  };
  useEffect(() => {
    if (!expanded || !needsFull || cached.status === 'ready') return;
    let active = true;
    const service = criarConsultaAvaliacao({
      compraId,
      avaliacaoId: row.avaliacaoId,
      client: apiClient,
      storage: tokenStorage,
      onChange: next => {
        if (!active) return;
        const d = next.dados,
          r = d?.resultado;
        const mismatch = r && (r.contextoRevisao !== row.contextoRevisao || r.versaoMotor !== row.versaoMotor || Date.parse(d.criadaEm) !== Date.parse(row.criadaEm));
        setState({
          ...next,
          ...(mismatch ? {
            status: 'error',
            dados: null
          } : {}),
          compraId,
          id: row.avaliacaoId
        });
      }
    });
    service.consultar();
    return () => {
      active = false;
      service.dispose();
    };
  }, [expanded, needsFull, compraId, row.avaliacaoId, row.contextoRevisao, row.versaoMotor, row.criadaEm, retry]);
  const available = needsFull ? cached.status === 'ready' : true;
  const resultado = available ? cached.dados?.resultado : null;
  const explicacao = needsFull ? cached.dados?.explicacao : row.explicacao;
  const view = apresentarAvaliacaoHistorica(resultado, explicacao);
  const missing = available && !resultado && !explicacao;
  const preview = reflections ? view.pergunta ?? view.reflexaoOriginal ?? 'Nenhuma reflexão registrada.' : null;
  const synthesis = view.resultado ?? (!/^As informações declaradas ajudam|^Não há contexto suficiente|^Esta compra não está ativa/.test(view.resumo ?? '') ? view.resumo : null) ?? {
    CONTEXTO_DISPONIVEL: 'Contexto registrado',
    DADOS_INSUFICIENTES: 'Contexto insuficiente',
    NAO_AVALIAVEL: 'Compra não disponível para avaliação'
  }[view.estado] ?? 'Sem síntese registrada.';
  return <RegistroHistorico data={row.criadaEm} estado={row.atualidade === 'VIGENTE' ? 'Atual' : 'Anterior'} statusNote={row.atualidade === 'DESATUALIZADA' ? cached.dados?.motivos.includes('DADOS_UTILIZADOS_ALTERADOS') ? 'Dados alterados' : 'Desatualizada' : undefined} label={reflections ? 'Reflexão registrada' : 'Avaliação registrada'} icone={reflections ? 'chatbubble-outline' : 'analytics-outline'} expanded={expanded} onToggle={onToggle} preview={preview}>
    {!available && ['idle', 'loading'].includes(cached.status) && <ActivityIndicator accessibilityLabel="Consultando registro histórico" />}
    {!available && ['error', 'conflict', 'session'].includes(cached.status) && <>
      <Text accessibilityRole="alert" style={s.text}>Não foi possível consultar este registro.</Text>
      {cached.status !== 'session' && <Pressable accessibilityRole="button" style={s.action} onPress={() => setRetry(value => value + 1)}><Text style={s.link}>Tentar novamente</Text></Pressable>}
    </>}
    {missing && <Text style={s.text}>Conteúdo indisponível neste registro.</Text>}
    {available && !missing && (reflections ? <>
      <View style={s.highlight}><Text style={s.text}>{view.pergunta ?? view.reflexaoOriginal ?? 'Nenhuma reflexão registrada.'}</Text></View>
    </> : <>
      <View style={s.highlight}><Text style={s.title}>{synthesis}</Text></View>
      {!!view.fatores.length && <Text style={s.title}>Fatores considerados</Text>}
      {view.fatores.map(line => <LinhaHistorica key={line.id} {...line} />)}
      {!!view.outras.length && <Text style={s.title}>Outras respostas registradas</Text>}
      {view.outras.map(line => <LinhaHistorica key={line.id} {...line} />)}
      {!!view.complementos.length && <Text style={s.title}>Comparação registrada</Text>}
      {view.complementos.map(line => <Text key={line.id} style={s.text}>{line.texto}</Text>)}
      {!!view.ausentes.length && <Text style={s.caption}>Sem resposta: {view.ausentes.join(', ')}.</Text>}
      {view.limitacoes.includes('ITENS_COM_CONTEXTO_AUSENTE') && <Text style={s.caption}>Há itens sem resposta.</Text>}
      {view.limitacoes.includes('LIMITE_INDISPONIVEL') && <Text style={s.caption}>Sem referência financeira nesta avaliação.</Text>}
    </>)}
  </RegistroHistorico>;
}
