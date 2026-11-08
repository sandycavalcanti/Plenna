import { styles } from "./styles";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarConsultaAvaliacao } from '../../../services/avaliacaoCompraService';
export default function AvaliacaoContextual({
  compraId,
  revisao,
  avaliacaoId,
  somenteReflexao = false
}) {
  const [state, setState] = useState({
    status: 'loading',
    dados: null
  });
  const [details, setDetails] = useState(false);
  const service = useRef(null);
  useEffect(() => {
    setDetails(false);
    const instance = criarConsultaAvaliacao({
      compraId,
      avaliacaoId,
      client: apiClient,
      storage: tokenStorage,
      onChange: s => setState({
        ...s,
        compraId,
        revisao,
        avaliacaoId
      })
    });
    service.current = instance;
    instance.consultar();
    return () => instance.dispose();
  }, [compraId, revisao, avaliacaoId]);
  const current = state.compraId === compraId && state.revisao === revisao && state.avaliacaoId === avaliacaoId ? state : {
    status: 'loading',
    dados: null
  };
  const d = current.dados;
  // Evita mostrar uma interpretação anterior enquanto o contexto é recarregado.
  const stale = d?.atualidade === 'DESATUALIZADA' || d?.resultado && d.resultado.contextoRevisao !== revisao;
  const historical = avaliacaoId !== undefined;
  const r = (historical || !stale) && current.status === 'ready' ? d?.resultado : null;
  if (somenteReflexao) return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Reflexão sugerida pelo PLENNA</Text>
    {current.status === 'loading' && <ActivityIndicator accessibilityLabel="Consultando reflexão registrada" />}
    {r ? <><Text style={styles.reflection}>{r.interpretacao.reflexao ?? 'Esta avaliação não registrou uma reflexão.'}</Text><Text style={styles.note}>Origem: avaliação contextual registrada. Não representa uma resposta sua.</Text></> : current.status !== 'loading' && <Text accessibilityRole="alert" style={styles.note}>Não foi possível consultar esta reflexão.</Text>}
    {['error', 'conflict'].includes(current.status) && <Pressable accessibilityRole="button" style={styles.button} onPress={() => service.current.consultar()}><Text style={styles.link}>Tentar consultar novamente</Text></Pressable>}
    {stale && <Text style={styles.note}>Registro histórico; considera os dados daquela avaliação.</Text>}
  </View>;
  return <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {historical ? 'Avaliação registrada' : 'Uma reflexão para você'}
      </Text>
      {current.status === 'loading' && <ActivityIndicator accessibilityLabel="Consultando reflexão" color="#8660A1" />}
      {current.status === 'session' && <Text style={styles.note}>Sua sessão mudou. Feche esta janela.</Text>}
      {['error', 'conflict'].includes(current.status) && <Text accessibilityRole="alert" style={styles.note}>
          {current.status === 'conflict' ? 'Suas respostas mudaram. Recarregue para continuar.' : 'A reflexão não está disponível agora. Você pode continuar explorando.'}
        </Text>}
      {stale && <Text accessibilityRole="alert" style={styles.note}>
          {historical ? 'Registro histórico. Não representa uma análise dos dados atuais.' : 'Esta reflexão está desatualizada. Atualize para considerar as informações atuais.'}
        </Text>}
      {d?.atualidade === 'SEM_AVALIACAO' && <Text style={styles.note}>
          Quer refletir com base no que você contou?
        </Text>}
      {r && <Text style={styles.reflection}>
          {r.interpretacao.reflexao ?? (r.estado === 'NAO_AVALIAVEL' ? 'Esta compra ainda não está disponível para reflexão.' : 'Ainda falta contexto para uma reflexão. Você pode contar mais quando quiser.')}
        </Text>}
      {r && <Pressable accessibilityRole="button" accessibilityState={{
      expanded: details
    }} onPress={() => setDetails(v => !v)} style={styles.button}>
          <Text style={styles.link}>
            {details ? 'Ocultar detalhes' : 'Como chegamos a esta reflexão'}
          </Text>
        </Pressable>}
      {r && details && d?.explicacao && <View style={{
      gap: 10
    }}>
        <Text style={styles.title}>Como analisamos</Text>
        <Text style={styles.note}>{d.explicacao.resumo}</Text>
        {['REGISTRADO', 'DECLARADO', 'INTERPRETADO'].map(natureza => {
        const fatores = d.explicacao.fatores.filter(f => f.natureza === natureza);
        return fatores.length ? <View key={natureza} style={{
          gap: 5
        }}><Text style={styles.title}>{{
              REGISTRADO: 'Registros considerados',
              DECLARADO: 'Você informou',
              INTERPRETADO: 'Relações calculadas'
            }[natureza]}</Text>{fatores.map((f, index) => <Text key={index} style={styles.note}>{f.mensagem}</Text>)}</View> : null;
      })}
        <Text style={styles.note}>Esta explicação preserva os dados da avaliação registrada. Indicadores atuais e histórico de outras compras não foram acrescentados retroativamente.</Text>
        {d.explicacao.limitacoes.includes('LIMITE_INDISPONIVEL') && <Text style={styles.note}>A comparação com o limite individual não estava disponível.</Text>}
        {d.explicacao.limitacoes.includes('REFERENCIA_ATUAL_SEM_VIGENCIA_HISTORICA') && <Text style={styles.note}>A referência individual usada não comprova o limite vigente na data da compra.</Text>}
        <Text style={styles.note}>Não determina impulsividade nem altera sua classificação voluntária.</Text>
      </View>}
      {r && details && !d?.explicacao && <>
          <Text style={styles.title}>O que o PLENNA observou</Text>
          {r.observacoes.length ? r.observacoes.map((o, i) => <Text key={i} style={styles.note}>
                {o.mensagem}
              </Text>) : <Text style={styles.note}>
              Não há observações financeiras disponíveis.
            </Text>}
          <Text style={styles.title}>O que você informou</Text>
          {r.declaracoes.length ? r.declaracoes.map((o, i) => <Text key={i} style={styles.note}>
                {o.mensagem}
              </Text>) : <Text style={styles.note}>
              Você ainda não informou contexto para esta decisão.
            </Text>}
          {r.autopercepcao && <>
              <Text style={styles.title}>Sua autopercepção</Text>
              <Text style={styles.note}>{r.autopercepcao.mensagem}</Text>
            </>}
          <Text style={styles.title}>Reflexão sugerida</Text>
          <Text style={styles.note}>{r.interpretacao.mensagem}</Text>
          {r.interpretacao.reflexao && <Text style={styles.note}>{r.interpretacao.reflexao}</Text>}
          <Text style={styles.note}>
            {historical ? 'Considera os registros e a referência usados nesta avaliação. Não comprova a vigência histórica do limite nem determina impulsividade.' : 'Considera somente os registros disponíveis e a referência individual atual. Não comprova o limite vigente na compra nem determina impulsividade.'}
          </Text>
        </>}
      {!historical && !['loading', 'session', 'conflict'].includes(current.status) && <Pressable accessibilityRole="button" style={styles.button} onPress={() => service.current.calcular(revisao)}>
          <Text style={styles.link}>
            {d?.avaliacaoId ? 'Atualizar reflexão' : 'Gerar reflexão opcional'}
          </Text>
        </Pressable>}
      {current.status === 'error' && <Pressable accessibilityRole="button" style={styles.button} onPress={() => service.current.consultar()}>
          <Text style={styles.link}>Tentar consultar novamente</Text>
        </Pressable>}
    </View>;
}
