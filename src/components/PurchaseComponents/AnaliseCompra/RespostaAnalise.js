import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarGravadorEvento, mensagemGestao } from '../../../services/gestaoCompraService';
import { styles as s } from './styles';
export default function RespostaAnalise({
  compraId,
  avaliacao,
  sinais,
  revisaoEventos,
  eventos = [],
  onSaved
}) {
  const [state, setState] = useState({
    busy: false,
    error: null,
    salvo: null
  });
  const saver = useRef(null),
    locked = useRef(false),
    pending = useRef(null),
    identity = useRef(null),
    ultimoSucesso = useRef(null);
  const key = `${compraId}:${avaliacao.avaliacaoId}:${sinais.id}`;
  identity.current = key;
  useEffect(() => {
    identity.current = key;
    saver.current = criarGravadorEvento({
      client: apiClient,
      storage: tokenStorage,
      uuid: randomUUID,
      compraId
    });
    return () => {
      identity.current = null;
    };
  }, [compraId]);
  useEffect(() => {
    setState({
      busy: false,
      error: null,
      salvo: null
    });
    pending.current = null;
    locked.current = false;
    ultimoSucesso.current = null;
  }, [key]);
  const salva = [...eventos].sort((a, b) => b.revisao - a.revisao).find(e => e.tipo === 'RESPOSTA_ANALISE' && e.dados?.avaliacaoId === avaliacao.avaliacaoId && e.dados?.interpretacaoId === sinais.id);
  const resposta = state.salvo ?? salva?.dados.resposta;
  const salvar = async valor => {
    if (locked.current || !Number.isSafeInteger(revisaoEventos)) return;
    if (!pending.current && (ultimoSucesso.current === valor || resposta === valor)) return;
    if (pending.current && pending.current.resposta !== valor) return;
    locked.current = true;
    const captured = key;
    pending.current ??= {
      versaoContrato: 1,
      tipo: 'RESPOSTA_ANALISE',
      dataEfetiva: null,
      revisaoEsperada: revisaoEventos,
      avaliacaoId: avaliacao.avaliacaoId,
      versaoMotor: avaliacao.resultado.versaoMotor,
      versaoInterpretacao: sinais.versao,
      interpretacaoId: sinais.id,
      resposta: valor,
      confirmarImpulsiva: valor === 'CONCORDO' && sinais.estado === 'OBSERVADOS'
    };
    setState(v => ({
      ...v,
      busy: true,
      error: null
    }));
    try {
      await saver.current(pending.current);
      if (identity.current !== captured) return;
      pending.current = null;
      ultimoSucesso.current = valor;
      setState({
        busy: false,
        error: null,
        salvo: valor
      });
      onSaved?.();
    } catch (error) {
      if (identity.current !== captured) return;
      if (error?.response && [400, 404, 409, 422, 503].includes(error.response.status)) pending.current = null;
      setState(v => ({
        ...v,
        busy: false,
        error: mensagemGestao(error)
      }));
    } finally {
      if (identity.current === captured) locked.current = false;
    }
  };
  return <View style={s.section}>
    <Text accessibilityRole="header" style={s.title}>Você concorda com essa interpretação?</Text>
    {sinais.estado === 'OBSERVADOS' && <Text style={s.caption}>Concordar registra sua confirmação e classifica a compra como impulsiva. Discordar mantém sua classificação atual.</Text>}
    <View style={s.factors}>{[['CONCORDO', sinais.estado === 'OBSERVADOS' ? 'Concordar e classificar como impulsiva' : 'Concordo'], ['DISCORDO', 'Discordo'], ['NAO_SEI', 'Não sei']].map(([valor, label]) => <Pressable key={valor} accessibilityRole="radio" accessibilityState={{
        selected: resposta === valor,
        disabled: state.busy || !Number.isSafeInteger(revisaoEventos) || !!pending.current && pending.current.resposta !== valor
      }} disabled={state.busy || !Number.isSafeInteger(revisaoEventos) || !!pending.current && pending.current.resposta !== valor} onPress={() => salvar(valor)} style={[s.answer, resposta === valor && s.answerSelected]}><Text style={s.link}>{label}</Text></Pressable>)}</View>
    {state.busy && <ActivityIndicator accessibilityLabel="Registrando resposta à análise" />}
    {state.error && <Text accessibilityRole="alert" style={s.caption}>{state.error}</Text>}
    <Text accessibilityLiveRegion="polite" style={s.caption}>{resposta ? 'Resposta salva no histórico de classificações. Você pode revisá-la.' : 'Opcional. Sua resposta será registrada sem substituir decisões anteriores.'}</Text>
  </View>;
}
