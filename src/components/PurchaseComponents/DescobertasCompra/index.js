import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { criarConsultaHistorico } from '../../../services/historicoCompraService';
import { diaCivil } from '../HistoricoConsumo/apresentacao';
import AnaliseAutomatica from '../AnaliseAutomatica';

const topics = {
  VALOR_FORA_FAIXA: 'Valor',
  VALOR_COMPARADO: 'Valor',
  VALOR_REGISTRADO: 'Valor',
  LIMITE_ATUAL: 'Sua referência',
  EVENTO_DECLARADO: 'Situação',
  DATA_COMERCIAL: 'Calendário',
  RECORRENCIA_VINCULADA: 'Recorrência',
  CONCENTRACAO_DATAS: 'Datas',
  COMPRAS_ANTERIORES_MES: 'Compras',
  FREQUENCIA_COMPARAVEL: 'Frequência',
  CATEGORIA_REPETIDA: 'Categoria',
};
const format = (value, unit) =>
  unit === 'CENTAVOS'
    ? (value / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export default function DescobertasCompra({
  compraId,
  revisao,
  onResponder,
  onExplorar,
  compact = false,
  refreshKey = 0,
}) {
  const [state, setState] = useState({ status: 'loading', dados: null }),
    [selected, setSelected] = useState(0),
    [chart, setChart] = useState(false);
  const query = useRef(null);
  const [usageMode, setUsageMode] = useState(null);
  const [automaticRefresh, setAutomaticRefresh] = useState(0);
  const refresh = () => {
    setAutomaticRefresh((n) => n + 1);
    query.current?.consultar();
  };
  useEffect(() => {
    const q = criarConsultaHistorico({
      compraId,
      revisao,
      client: apiClient,
      storage: tokenStorage,
      onChange: (s) => {
        setState({ ...s, compraId, revisao });
        setSelected(0);
        setChart(false);
      },
    });
    query.current = q;
    q.consultar();
    const listener = AppState?.addEventListener('change', (s) => {
      if (s === 'active') q.consultar();
      else q.invalidar();
    });
    return () => {
      listener?.remove();
      q.dispose();
    };
  }, [compraId, revisao, refreshKey]);
  const current =
    state.compraId === compraId && state.revisao === revisao
      ? state
      : { status: 'loading', dados: null };
  const d = current.dados,
    source = d?.descobertas,
    a = source
      ? {
          ...source,
          itens: source.itens
            .filter((i) =>
              [
                'VALOR_FORA_FAIXA',
                'VALOR_COMPARADO',
                'VALOR_REGISTRADO',
                'EVENTO_DECLARADO',
                'RECORRENCIA_VINCULADA',
              ].includes(i.codigo),
            )
            .slice(0, compact ? 2 : undefined),
        }
      : null,
    card = a?.itens[selected],
    max = card?.grafico
      ? Math.max(...card.grafico.pontos.map((p) => p.valor))
      : 0;
  const usagePoints =
    (usageMode === 'dias'
      ? d?.monitoramento?.porDia
      : d?.monitoramento?.porAplicativo) || [];
  return (
    <View style={styles.container}>
      <AnaliseAutomatica
        compraId={compraId}
        revisao={revisao}
        refreshKey={`${refreshKey}:${automaticRefresh}`}
      />
      {current.status === 'ready' &&
        d?.contextual?.contextoRevisao === revisao &&
        d.contextual.interpretacao?.reflexao && (
          <View style={[styles.card, { padding: 12, gap: 6 }]}>
            <Text accessibilityRole="header" style={styles.heading}>
              A partir do que você contou
            </Text>
            <Text style={styles.question}>
              {d.contextual.interpretacao.reflexao}
            </Text>
            <Text style={styles.caption}>
              Considera suas respostas atuais. Não é uma classificação
              automática.
            </Text>
          </View>
        )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text accessibilityRole="header" style={styles.heading}>
          O PLENNA observou
        </Text>
        {compact && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atualizar descobertas"
            disabled={current.status === 'loading'}
            onPress={refresh}
            style={{
              minWidth: 48,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="refresh" size={22} color="#8660A1" />
          </Pressable>
        )}
      </View>
      {current.status === 'loading' && (
        <ActivityIndicator
          accessibilityLabel="Analisando registros da compra"
          color="#8660A1"
        />
      )}
      {['error', 'unavailable', 'conflict'].includes(current.status) && (
        <Text accessibilityRole="alert" style={styles.note}>
          As descobertas não estão disponíveis agora. Você pode continuar.
        </Text>
      )}
      {current.status === 'session' && (
        <Text style={styles.note}>
          Entre novamente para ver suas descobertas.
        </Text>
      )}
      {d && !card && (
        <Text style={styles.note}>
          Seus registros já podem ser explorados. Novas descobertas aparecem
          quando houver informações suficientes.
        </Text>
      )}
      {a?.itens.length > 1 && (
        <View style={styles.row}>
          {a.itens.map((i, index) => (
            <Pressable
              key={i.codigo}
              accessibilityRole="button"
              accessibilityState={{ selected: index === selected }}
              onPress={() => {
                setSelected(index);
                setChart(false);
              }}
              style={[styles.chip, index === selected && styles.selected]}
            >
              <Text style={styles.link}>
                {topics[i.codigo] || 'Descoberta'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {card && (
        <View
          style={[
            styles.card,
            compact && { padding: 12, gap: 6, borderRadius: 16 },
          ]}
        >
          <Ionicons
            name={
              card.natureza === 'DECLARADO'
                ? 'chatbubble-outline'
                : 'analytics-outline'
            }
            size={21}
            color="#8660A1"
          />
          <Text style={styles.caption}>
            {card.natureza === 'DECLARADO'
              ? 'Sua declaração'
              : card.natureza === 'REFERENCIA_ATUAL'
                ? 'Comparação atual'
                : 'Nos seus registros'}
          </Text>
          <Text style={[styles.value, compact && { fontSize: 19 }]}>
            {card.titulo}
          </Text>
          <Text style={styles.note}>{card.detalhe}</Text>
          {a.reflexao && card.codigo === 'VALOR_FORA_FAIXA' && (
            <Text style={styles.question}>{a.reflexao}</Text>
          )}
          {max > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: chart }}
              onPress={() => setChart((v) => !v)}
              style={styles.action}
            >
              <Text style={styles.link}>
                {chart ? 'Recolher comparação' : 'Comparar valores e registros'}
              </Text>
            </Pressable>
          )}
          {chart &&
            max > 0 &&
            card.grafico.pontos.map((p, index) => (
              <View key={index} style={styles.barRow}>
                <Text style={styles.note}>{p.rotulo}</Text>
                <View style={styles.track}>
                  <View
                    style={[styles.bar, { width: `${(100 * p.valor) / max}%` }]}
                  />
                </View>
                <Text style={styles.caption}>
                  {format(p.valor, card.grafico.unidade)}
                </Text>
              </View>
            ))}
        </View>
      )}

      {onResponder && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onResponder(a?.perguntasSugeridas || [])}
          style={styles.action}
        >
          <Text style={styles.link}>Complementar esta compra · opcional</Text>
        </Pressable>
      )}
      {onExplorar && (
        <Pressable
          accessibilityRole="button"
          onPress={onExplorar}
          style={styles.action}
        >
          <Text style={styles.link}>Explorar minha compra →</Text>
        </Pressable>
      )}
      {!compact && !['loading', 'session'].includes(current.status) && (
        <Pressable
          accessibilityRole="button"
          onPress={refresh}
          style={styles.action}
        >
          <Text style={styles.link}>Atualizar descobertas</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 14 },
  heading: { fontSize: 18, fontWeight: '600', color: '#594367' },
  card: { padding: 18, borderRadius: 22, gap: 9, backgroundColor: '#EEE4F2' },
  value: { fontSize: 27, fontWeight: '700', color: '#594367' },
  note: { fontSize: 14, lineHeight: 21, color: '#655A70' },
  caption: { fontSize: 12, lineHeight: 18, color: '#655A70' },
  question: { fontSize: 16, lineHeight: 23, color: '#594367' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 48,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8CBDD',
  },
  selected: { backgroundColor: '#EEE4F2', borderColor: '#704389' },
  link: { color: '#893467', fontSize: 14, fontWeight: '600' },
  action: { minHeight: 48, justifyContent: 'center' },
  barRow: { gap: 5, paddingVertical: 7 },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  bar: { height: 10, borderRadius: 5, backgroundColor: '#8660A1' },
  usage: { padding: 14, gap: 8, borderRadius: 18, backgroundColor: '#FFF' },
});
