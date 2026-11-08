import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s as periodStyles } from './DetalhesPeriodo.styles';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { monitoramentoEmAlteracao, observarAlteracaoMonitoramento } from '../../../api/consentimento';
import { criarConsultaUsoContextual } from '../../../services/usoContextualService';
import { purchaseStyles as s } from '../presentationStyles';
function Leitura({
  periodo
}) {
  const [state, setState] = useState({
      status: 'loading',
      dados: null
    }),
    query = useRef(null);
  useEffect(() => {
    const q = criarConsultaUsoContextual({
      periodo,
      client: apiClient,
      storage: tokenStorage,
      onChange: setState,
      emAlteracao: monitoramentoEmAlteracao
    });
    query.current = q;
    const remove = observarAlteracaoMonitoramento((id, details) => q.consentimentoAlterado(id, details));
    q.consultar();
    return () => {
      remove();
      q.dispose();
      query.current = null;
    };
  }, [periodo]);
  const d = state.dados;
  const [details, setDetails] = useState(false);
  return <View style={{
    gap: 8
  }}>
    {state.status === 'loading' && <ActivityIndicator accessibilityLabel="Consultando uso digital autorizado" />}
    {d?.minutosRegistrados !== null && d?.minutosRegistrados !== undefined && <>
      <View style={periodStyles.tiles}><View style={periodStyles.tile}><Ionicons name="time-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={periodStyles.number}>{d.minutosRegistrados.toLocaleString('pt-BR', {
        maximumFractionDigits: 1
      })} min</Text><Text style={periodStyles.tileLabel}>Tempo registrado</Text></View><View style={periodStyles.tile}><Ionicons name="calendar-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={periodStyles.number}>{d.diasComDados} {d.diasComDados === 1 ? 'dia' : 'dias'}</Text><Text style={periodStyles.tileLabel}>Com registros</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Detalhes do uso digital" accessibilityState={{expanded: details}} style={s.action} onPress={() => setDetails(v => !v)}><Text style={s.actionText}>{details ? 'Recolher detalhes' : 'Entender os registros'}</Text><Ionicons name="information-circle-outline" size={22} color={DASHBOARD_THEME.colors.navy} /></Pressable>
      {details && <View style={periodStyles.detail}><Text style={s.title}>Cobertura parcial.</Text><Text style={s.caption}>Os registros disponíveis não representam necessariamente todo o uso do período.</Text><Text style={s.caption}>Não indica em qual aplicativo uma compra ocorreu nem relação de causa.</Text></View>}
    </>}
    {(d?.disponibilidade === 'SEM_AUTORIZACAO' || state.status === 'consent') && <Text style={s.caption}>A consulta depende da sua autorização de monitoramento. Nenhum dado digital é necessário para o Panorama de compras.</Text>}
    {d && d.disponibilidade !== 'SEM_AUTORIZACAO' && d.minutosRegistrados === null && <Text style={s.caption}>Sem dados digitais suficientes para este mês.</Text>}
    {state.status === 'session' && <Text style={s.caption}>Sua sessão mudou. Entre novamente.</Text>}
    {state.status === 'error' && <Pressable accessibilityRole="button" style={s.action} onPress={() => query.current?.consultar()}><Text style={s.actionText}>Não foi possível consultar. Tentar novamente</Text></Pressable>}
  </View>;
}
export default function UsoDigitalPeriodo({
  periodo
}) {
  const [open, setOpen] = useState(false);
  return <View><Pressable accessibilityRole="button" accessibilityState={{
      expanded: open
    }} onPress={() => setOpen(v => !v)} style={s.action}><Text style={s.actionText}>Uso digital no período</Text></Pressable>{open && <Leitura periodo={periodo} />}</View>;
}
