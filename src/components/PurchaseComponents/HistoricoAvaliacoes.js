import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { consultarAvaliacaoComExplicacao, validarExplicacaoAvaliacao } from '../../services/avaliacaoCompraService';
import RegistroAvaliacao from './RegistrosContextuais/RegistroAvaliacao';
import { styles } from './RegistrosContextuais/RegistroHistorico.styles';
export default function HistoricoAvaliacoes({
  compraId,
  revisao,
  modo = 'avaliacoes'
}) {
  const [cursor, setCursor] = useState(undefined);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [state, setState] = useState({
    loading: true,
    rows: []
  });
  useEffect(() => {
    setCursor(undefined);
    setSelected(null);
  }, [compraId, revisao]);
  useEffect(() => {
    let active = true,
      session,
      clear;
    setSelected(null);
    setState({
      loading: true,
      rows: [],
      compraId,
      revisao,
      cursor
    });
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!active) return;
        if (!session) throw Error('SESSION_REQUIRED');
        clear = () => {
          active = false;
          setSelected(null);
          setState({
            rows: [],
            session: true,
            compraId,
            revisao,
            cursor
          });
        };
        session.signal.addEventListener('abort', clear, {
          once: true
        });
        tokenStorage.assertSession(session.id);
        const {
          data
        } = await consultarAvaliacaoComExplicacao(apiClient, `/v2/compras/${compraId}/avaliacoes/historico`, {
          params: cursor === undefined ? {} : {
            antes: cursor
          },
          signal: session.signal,
          usageMonitoringSessionId: session.id
        });
        tokenStorage.assertSession(session.id);
        if (data?.versaoContrato !== 1 || data.compraId !== compraId || !Array.isArray(data.avaliacoes) || data.avaliacoes.length > 20 || !data.avaliacoes.every((row, index, rows) => Number.isSafeInteger(row.avaliacaoId) && row.avaliacaoId > 0 && (cursor === undefined || row.avaliacaoId < cursor) && (index === 0 || row.avaliacaoId < rows[index - 1].avaliacaoId) && typeof row.criadaEm === 'string' && Number.isFinite(Date.parse(row.criadaEm)) && typeof row.versaoMotor === 'string' && Number.isSafeInteger(row.contextoRevisao) && row.contextoRevisao >= 0 && ['VIGENTE', 'DESATUALIZADA'].includes(row.atualidade)) || data.proximoAntes !== null && (data.avaliacoes.length !== 20 || data.proximoAntes !== data.avaliacoes[19].avaliacaoId)) throw Error('INVALID_HISTORY');
        data.avaliacoes.forEach(row => validarExplicacaoAvaliacao(row.explicacao));
        if (active) setState({
          rows: data.avaliacoes,
          next: data.proximoAntes,
          compraId,
          revisao,
          cursor
        });
      } catch {
        if (active) setState({
          rows: [],
          error: true,
          compraId,
          revisao,
          cursor
        });
      }
    })();
    return () => {
      active = false;
      if (clear) session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, revisao, cursor, retry]);
  const current = state.compraId === compraId && state.revisao === revisao && state.cursor === cursor ? state : {
    loading: true,
    rows: []
  };
  const touch = {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 8
  };
  if (current.session) return <Text>Sua sessão mudou. Feche esta janela.</Text>;
  return <View style={styles.list}>

    {modo === 'reflexoes' && <Text style={styles.caption}>Perguntas e reflexões geradas pelo PLENNA em cada avaliação.</Text>}
    {current.loading && <ActivityIndicator accessibilityLabel="Carregando histórico de avaliações" />}
    {current.error && <><Text accessibilityRole="alert">Não foi possível consultar as avaliações.</Text>
      <Pressable accessibilityRole="button" style={touch} onPress={() => setRetry(value => value + 1)}><Text>Tentar novamente</Text></Pressable></>}
    {!current.loading && !current.error && current.rows.length === 0 && <Text>Nenhuma avaliação registrada nesta página.</Text>}
    {current.rows.map(row => <RegistroAvaliacao key={row.avaliacaoId} row={row} compraId={compraId} modo={modo} expanded={selected === row.avaliacaoId} onToggle={() => setSelected(selected === row.avaliacaoId ? null : row.avaliacaoId)} />)}
    {!!current.next && <Pressable accessibilityRole="button" style={touch} onPress={() => {
      setSelected(null);
      setCursor(current.next);
    }}><Text>Avaliações anteriores</Text></Pressable>}
    {cursor !== undefined && <Pressable accessibilityRole="button" style={touch} onPress={() => {
      setSelected(null);
      setCursor(undefined);
    }}><Text>Voltar às mais recentes</Text></Pressable>}
  </View>;
}
