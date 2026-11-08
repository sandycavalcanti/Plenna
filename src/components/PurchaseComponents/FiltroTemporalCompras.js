import { s } from "./FiltroTemporalCompras.styles";
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import SeletorMensalHome from '../HomeComponents/SeletorMensalHome';
import SeletorMes from '../SeletorMes';
import CalendarioData from '../CalendarioData';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import { dataCivilInput, diaAtualCompras, parametrosTemporaisCompras } from '../../utils/filtrosHistoricoCompras';
const format = iso => iso ? iso.split('-').reverse().join('/') : '';
const date = value => {
  const iso = dataCivilInput(value);
  return iso ? new Date(iso + 'T12:00:00') : undefined;
};
const civil = value => [value.getDate(), value.getMonth() + 1, value.getFullYear()].map((n, i) => i < 2 ? String(n).padStart(2, '0') : n).join('/');
export default function FiltroTemporalCompras({
  filtros,
  onChange,
  inicioHistorico,
  onRetry
}) {
  const [expanded, setExpanded] = useState(false),
    [picker, setPicker] = useState(null);
  const [draft, setDraft] = useState(filtros),
    [error, setError] = useState(null);
  const today = diaAtualCompras(),
    currentMonth = today.slice(0, 7);
  useEffect(() => {
    setDraft(filtros);
    setError(null);
    setPicker(null);
  }, [filtros]);
  useEffect(() => {
    if (!inicioHistorico) return;
    try {
      parametrosTemporaisCompras(filtros, new Date(), inicioHistorico);
    } catch {
      Alert.alert('Período ajustado', 'O período anterior está fora dos limites da sua conta. Selecionamos o mês atual.');
      onChange({
        ...filtros,
        modo: 'MES',
        mes: currentMonth,
        inicio: '',
        fim: ''
      });
    }
  }, [inicioHistorico, filtros, currentMonth]);
  const apply = next => {
    try {
      parametrosTemporaisCompras(next, new Date(), inicioHistorico);
      setError(null);
      onChange(next);
      setPicker(null);
    } catch (failure) {
      setError(failure.message);
    }
  };
  const mode = value => {
    setError(null);
    setPicker(null);
    setExpanded(false);
    const next = {
      ...filtros,
      modo: value,
      mes: filtros.mes || currentMonth
    };
    setDraft(next);
    if (value !== 'INTERVALO') apply(next);
  };
  if (!inicioHistorico) return <View style={s.container}><Text accessibilityRole="alert">Aguardando os limites da conta para liberar os filtros.</Text><Pressable accessibilityRole="button" onPress={onRetry}><Text>Tentar novamente</Text></Pressable></View>;
  return <View style={s.container}>
    <View style={s.modes} accessibilityRole="radiogroup" accessibilityLabel="Período das compras">
      {[['MES', 'Mês'], ['INTERVALO', 'Período'], ['TODOS', 'Todo o histórico']].map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{
        checked: draft.modo === value
      }} onPress={() => mode(value)} style={[s.mode, draft.modo === value && s.selected]}><Text style={[s.modeText, draft.modo === value && s.selectedText]}>{label}</Text></Pressable>)}
    </View>
    {draft.modo === 'MES' && <>
      <SeletorMensalHome periodo={filtros.mes || currentMonth} limites={{
        periodoMinimo: inicioHistorico.slice(0, 7),
        periodoMaximo: currentMonth
      }} nota="" onChange={mes => apply({
        ...filtros,
        modo: 'MES',
        mes
      })} onChoose={() => setExpanded(value => !value)} />
      {expanded && <SeletorMes inline visible value={filtros.mes || currentMonth} minMonth={inicioHistorico.slice(0, 7)} maxMonth={currentMonth} title="Mês das compras" onChange={mes => apply({
        ...filtros,
        modo: 'MES',
        mes
      })} onClose={() => setExpanded(false)} />}
    </>}
    {draft.modo === 'INTERVALO' && <View style={s.interval}>
      <View style={s.dates}>{[['inicio', 'Data inicial'], ['fim', 'Data final']].map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{
          expanded: picker === key
        }} onPress={() => setPicker(picker === key ? null : key)} style={s.date}><Text style={s.caption}>{label}</Text><Text style={s.value}>{draft[key] || 'Escolher data'}</Text></Pressable>)}</View>
      {picker && <CalendarioData key={picker} value={date(draft[picker])} min={date(format(inicioHistorico))} max={date(format(today))} onChange={value => {
        setDraft(previous => ({
          ...previous,
          [picker]: civil(value)
        }));
        setPicker(null);
        setError(null);
      }} />}
      {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" onPress={() => apply(draft)} style={s.apply}><Text style={s.selectedText}>Aplicar período</Text></Pressable>
    </View>}
    {error && draft.modo !== 'INTERVALO' && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}
const c = DASHBOARD_THEME.colors;
