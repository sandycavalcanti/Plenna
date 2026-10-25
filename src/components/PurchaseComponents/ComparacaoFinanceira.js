import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { apiClient } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
export function apresentarComparacao(d, historico = false) {
  const limit = historico ? d?.limiteHistoricoCentavos : d?.limiteAtualCentavos,
    value = d?.compraCentavos;
  if (value == null || limit == null || limit <= 0) return null;
  return {
    compra: value,
    limite: limit,
    diferenca: value - limit,
    titulo: historico ? 'Limite da época' : 'Comparação com seu limite atual',
    max: Math.max(value, limit),
  };
}
const money = (v) =>
  (v / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export default function ComparacaoFinanceira({ compraId }) {
  const [data, setData] = useState(null),
    [historico, setHistorico] = useState(false),
    [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let active = true,
      session,
      clear;
    setData(null);
    setHistorico(false);
    setExpanded(false);
    (async () => {
      try {
        session = await tokenStorage.captureSession();
        if (!session) return;
        clear = () => {
          active = false;
          setData(null);
        };
        session.signal.addEventListener('abort', clear, { once: true });
        const r = await apiClient.get(`/v2/compras/${compraId}/referencias`, {
          signal: session.signal,
          rf017SessionId: session.id,
        });
        tokenStorage.assertSession(session.id);
        if (
          r.data?.versaoContrato === 1 &&
          r.data.compraId === compraId &&
          active
        )
          setData(r.data);
      } catch {}
    })();
    return () => {
      active = false;
      session?.signal.removeEventListener('abort', clear);
    };
  }, [compraId]);
  const c = apresentarComparacao(data, historico);
  if (!c) return null;
  return (
    <View
      style={{ padding: 12, borderRadius: 16, backgroundColor: '#FFF', gap: 8 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
        style={{ minHeight: 48, justifyContent: 'center' }}
      >
        <Text style={{ fontWeight: '600', color: '#594367' }}>{c.titulo}</Text>
        <Text style={{ color: c.diferenca > 0 ? '#B32646' : '#594367' }}>
          {money(Math.abs(c.diferenca))}{' '}
          {c.diferenca > 0
            ? 'acima'
            : c.diferenca < 0
              ? 'abaixo'
              : 'de diferença'}
        </Text>
      </Pressable>
      {expanded && (
        <>
          {[
            ['Compra', c.compra, '#8660A1'],
            [
              historico ? 'Limite vigente' : 'Limite atual',
              c.limite,
              '#9A87AF',
            ],
          ].map(([label, value, color]) => (
            <View key={label} style={{ gap: 4 }}>
              <Text>
                {label}: {money(value)}
              </Text>
              <View
                style={{
                  height: 9,
                  backgroundColor: '#EEE4F2',
                  borderRadius: 5,
                }}
              >
                <View
                  style={{
                    height: 9,
                    width: `${(100 * value) / c.max}%`,
                    backgroundColor: color,
                    borderRadius: 5,
                  }}
                />
              </View>
            </View>
          ))}
          {data.historicoComprovado ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                [false, 'Atual'],
                [true, 'Da época'],
              ].map(([mode, label]) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: historico === mode }}
                  onPress={() => setHistorico(mode)}
                  style={{ minHeight: 48, justifyContent: 'center' }}
                >
                  <Text style={{ color: '#893467' }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: '#655A70' }}>
              O limite da época não está comprovado.
            </Text>
          )}
        </>
      )}
    </View>
  );
}
