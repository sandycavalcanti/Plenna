import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { consultarAnaliseAutomatica } from '../../services/analiseAutomaticaService';
import ReadingDetails from '../ReadingDetails';
const labels = {
  V01: 'Valor nos registros anteriores',
  V01_CATEGORIA: 'Valor na mesma categoria',
  V03: 'Limite comprovado da época',
  F05: 'Compras em janelas comparáveis',
  F04: 'Concentração em dias registrados',
};
const format = (v, u) =>
  u === 'CENTAVOS'
    ? (v / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : v.toLocaleString('pt-BR');
export default function AnaliseAutomatica({ compraId, revisao, refreshKey }) {
  const [state, setState] = useState({
      loading: true,
      data: null,
      error: false,
    }),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true,
      session,
      clear,
      generation = 0;
    setState({ loading: true, data: null, error: false });
    async function load() {
      const run = ++generation;
      try {
        if (!session) {
          session = await tokenStorage.captureSession();
          if (!active || run !== generation) return;
          if (!session) throw Error('SESSION');
          clear = () => {
            generation++;
            if (active) setState({ loading: false, data: null, error: true });
          };
          session.signal.addEventListener('abort', clear, { once: true });
        }
        const data = await consultarAnaliseAutomatica({
          client: apiClient,
          storage: tokenStorage,
          session,
          compraId,
        });
        if (active && run === generation)
          setState({ loading: false, data, error: false });
      } catch {
        if (active && run === generation)
          setState({ loading: false, data: null, error: true });
      }
    }
    load();
    const listener = AppState?.addEventListener('change', (s) => {
      if (s === 'active') load();
      else {
        generation++;
        if (active) setState({ loading: true, data: null, error: false });
      }
    });
    return () => {
      active = false;
      generation++;
      listener?.remove();
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, revisao, refreshKey, retry]);
  const d = state.data;
  return (
    <View
      style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: '#FFF' }}
    >
      <Text
        accessibilityRole="header"
        style={{ fontWeight: '600', color: '#594367' }}
      >
        Análise automática
      </Text>
      {state.loading ? (
        <ActivityIndicator accessibilityLabel="Consultando análise automática" />
      ) : state.error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setRetry((v) => v + 1)}
          style={{ minHeight: 48, justifyContent: 'center' }}
        >
          <Text style={{ color: '#893467' }}>
            Análise indisponível agora. Tentar novamente
          </Text>
        </Pressable>
      ) : (
        d && (
          <>
            <Text style={{ color: '#594367' }}>
              {d.estado === 'DADOS_INSUFICIENTES'
                ? 'Ainda faltam referências suficientes.'
                : d.estado === 'SEM_SINAIS_RELEVANTES'
                  ? 'As regras disponíveis não identificaram sinais relevantes.'
                  : d.descobertas[0]?.titulo}
            </Text>
            {d.descobertas[0] && (
              <Text style={{ fontSize: 12, lineHeight: 18, color: '#655A70' }}>
                {d.descobertas[0].mensagem}
              </Text>
            )}
            {d.descobertas[0] && (
              <Text style={{ fontSize: 14, lineHeight: 21, color: '#594367' }}>
                O que pode ter contribuído para essa diferença nos seus
                registros?
              </Text>
            )}
            {d.contextualizacao && (
              <Text style={{ fontSize: 12, lineHeight: 18, color: '#655A70' }}>
                {d.contextualizacao}
              </Text>
            )}
            <ReadingDetails label="Entender esta análise">
              <Text style={{ color: '#655A70', fontSize: 12 }}>
                Esta observação não classifica sua compra.{' '}
                {d.qualidadeDados.registrosElegiveis} registro(s) anterior(es)
                elegível(is).
              </Text>
              <Text style={{ fontSize: 12, color: '#655A70' }}>
                Registros anteriores a{' '}
                {new Date(d.janela.fimExclusivo).toLocaleDateString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                })}
                .
              </Text>
              {d.evidencias.map((e) => (
                <Text
                  key={e.indicador}
                  style={{ fontSize: 12, color: '#655A70', marginTop: 8 }}
                >
                  {labels[e.indicador] || 'Referência disponível'}:{' '}
                  {format(e.observado, e.unidade)} · referência{' '}
                  {format(e.referencia, e.unidade)} · {e.amostra} registro(s).
                </Text>
              ))}
              {d.qualidadeDados.criteriosIndisponiveis?.length > 0 && (
                <Text style={{ fontSize: 12, color: '#655A70', marginTop: 8 }}>
                  Algumas comparações não estão disponíveis por falta de
                  histórico, cobertura ou vigência comprovada.
                </Text>
              )}
            </ReadingDetails>
          </>
        )
      )}
    </View>
  );
}
