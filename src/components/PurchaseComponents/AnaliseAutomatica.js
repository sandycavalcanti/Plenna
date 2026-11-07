import { presentationStyles } from "./AnaliseAutomatica.styles";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import { consultarAnaliseAutomatica } from '../../services/analiseAutomaticaService';
import ReadingDetails from '../ReadingDetails';
import { purchaseStyles as s } from './presentationStyles';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import { apresentarIndisponibilidades } from '../../utils/analiseAutomaticaPresentation';
const labels = {
  V01: 'Valor nos registros anteriores',
  V01_CATEGORIA: 'Valor na mesma categoria',
  V03: 'Limite comprovado da época',
  F05: 'Compras em janelas comparáveis',
  F04: 'Concentração em dias registrados'
};
const format = (v, u) => u === 'CENTAVOS' ? (v / 100).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}) : v.toLocaleString('pt-BR');
export default function AnaliseAutomatica({
  compraId,
  revisao,
  refreshKey,
  active = true,
  compact = false
}) {
  const visible = useRef(active);
  visible.current = active;
  const loader = useRef(null),
    suspended = useRef(false),
    suspend = useRef(null);
  useEffect(() => {
    if (active && suspended.current) loader.current?.();
    if (!active) suspend.current?.();
  }, [active]);
  const [state, setState] = useState({
      loading: true,
      data: null,
      error: false
    }),
    [retry, setRetry] = useState(0);
  const source = `${compraId}:${revisao}:${refreshKey}:${retry}`;
  useEffect(() => {
    let mounted = true,
      session,
      clear,
      request,
      generation = 0;
    const publish = next => { if (mounted) setState({ ...next, source }); };
    const pause = () => {
      suspended.current = true;
      generation++;
      request?.abort();
      publish({ loading: true, data: null, error: false });
    };
    suspend.current = pause;
    publish({ loading: true, data: null, error: false });
    async function load() {
      if (!visible.current) return;
      suspended.current = false;
      const run = ++generation;
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        if (!session) {
          const captured = await tokenStorage.captureSession();
          if (!mounted || run !== generation || controller.signal.aborted) return;
          if (!captured) throw Error('SESSION');
          session = captured;
          clear = () => {
            generation++;
            request?.abort();
            publish({
              loading: false,
              data: null,
              error: true
            });
          };
          session.signal.addEventListener('abort', clear, {
            once: true
          });
        }
        const data = await consultarAnaliseAutomatica({
          client: apiClient,
          storage: tokenStorage,
          session,
          compraId,
          signal: controller.signal
        });
        if (mounted && visible.current && run === generation) publish({
          loading: false,
          data,
          error: false
        });
      } catch {
        if (mounted && visible.current && run === generation) publish({
          loading: false,
          data: null,
          error: true
        });
      }
    }
    loader.current = load;
    if (visible.current) load(); else suspended.current = true;
    const listener = AppState?.addEventListener('change', s => {
      if (s === 'active' && visible.current) load(); else pause();
    });
    return () => {
      mounted = false;
      generation++;
      request?.abort();
      loader.current = null;
      suspend.current = null;
      listener?.remove();
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId, revisao, refreshKey, retry]);
  if (!active) return null;
  const current = state.source === source ? state : { loading: true, data: null, error: false };
  const d = current.data;
  const insuficiente = d?.estado === 'DADOS_INSUFICIENTES';
  const motivos = apresentarIndisponibilidades(d?.qualidadeDados.criteriosIndisponiveis);
  const limiteAtual = d?.referenciasFinanceiras?.limiteAtualCentavos;
  return <View style={s.card}>
      <Text accessibilityRole="header" style={presentationStyles.inline1}>
        {compact ? 'Nos seus registros' : 'Análise do Plenna'}
      </Text>
      {current.loading ? <ActivityIndicator accessibilityLabel="Consultando análise automática" /> : current.error ? <Pressable accessibilityRole="button" onPress={() => setRetry(v => v + 1)} style={presentationStyles.inline2}>
          <Text style={{
        color: '#893467'
      }}>
            Análise indisponível agora. Tentar novamente
          </Text>
        </Pressable> : d && <>
            <Text style={{
        color: '#594367'
      }}>
              {insuficiente ? 'Ainda não há dados para comparar.' : d.estado === 'SEM_SINAIS_RELEVANTES' ? 'As regras disponíveis não identificaram sinais relevantes.' : d.descobertas[0]?.titulo}
            </Text>
            {insuficiente && <>
              <Text style={presentationStyles.inline4}>
                As referências disponíveis ainda não permitem avaliar esta compra automaticamente.
              </Text>
              {motivos.principais.length > 0 && <View>
                <Text accessibilityRole="header" style={s.title}>Por quê?</Text>
                {motivos.principais.map(motivo => <Text key={motivo} style={presentationStyles.inline8}>{motivo}</Text>)}
              </View>}
            </>}
            {d.evidencias.length > 0 && <View><Text style={s.title}>Principais fatores considerados</Text>{[...d.evidencias].sort((a, b) => Number(b.sinal) - Number(a.sinal)).slice(0, 3).map(e => <View key={e.indicador} style={[s.row, s.divider]}><View style={s.icon}><Ionicons name="analytics-outline" color={DASHBOARD_THEME.colors.navy} size={19} /></View><View style={s.copy}><Text style={s.body}>{labels[e.indicador] || 'Referência disponível'}</Text><Text style={s.caption}>{e.sinal ? 'Diferença observada' : 'Sem diferença por este critério'}</Text><Text style={s.caption}>{format(e.observado, e.unidade)} · referência {format(e.referencia, e.unidade)}</Text></View></View>)}</View>}
            {d.descobertas[0] && <Text style={presentationStyles.inline3}>
                {d.descobertas[0].mensagem}
              </Text>}
            {d.descobertas[0] && <Text style={presentationStyles.inline4}>
                O que pode ter contribuído para essa diferença nos seus
                registros?
              </Text>}
            {!compact && d.contextualizacao && <Text style={presentationStyles.inline5}>
                {d.contextualizacao}
              </Text>}
            <ReadingDetails label="Entender esta análise">
              <Text style={presentationStyles.inline6}>
                Esta observação não classifica sua compra.{' '}
                {d.qualidadeDados.registrosElegiveis} registro(s) anterior(es)
                elegível(is).
              </Text>
              <Text style={presentationStyles.inline7}>
                Registros anteriores a{' '}
                {new Date(d.janela.fimExclusivo).toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          })}
                .
              </Text>
              {d.evidencias.map(e => <Text key={e.indicador} style={presentationStyles.inline8}>
                  {labels[e.indicador] || 'Referência disponível'}:{' '}
                  {format(e.observado, e.unidade)} · referência{' '}
                  {format(e.referencia, e.unidade)} · {e.amostra} registro(s).
                </Text>)}
              {(insuficiente ? motivos.adicionais : [...motivos.principais, ...motivos.adicionais]).map(motivo =>
                <Text key={motivo} style={presentationStyles.inline9}>{motivo}</Text>)}
              {insuficiente && Number.isSafeInteger(limiteAtual) && limiteAtual > 0 && <Text style={presentationStyles.inline9}>
                Seu limite atual por compra é {format(limiteAtual, 'CENTAVOS')}. Esse valor é uma referência atual e não é usado nesta comparação histórica.
              </Text>}
            </ReadingDetails>
          </>}
    </View>;
}
