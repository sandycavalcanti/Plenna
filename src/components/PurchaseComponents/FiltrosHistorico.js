import { presentationStyles } from "./FiltrosHistorico.styles";
import { styles } from "./FiltrosHistorico.styles";
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parametrosHistorico } from '../../utils/filtrosHistoricoCompras';
import SeletorMensalHome from '../HomeComponents/SeletorMensalHome';
import SeletorMes from '../SeletorMes';
import CalendarioData from '../CalendarioData';
import { periodoMensalSaoPaulo } from '../../utils/resumoFinanceiro';
import { dataCivilInput } from '../../utils/filtrosHistoricoCompras';
export default function FiltrosHistorico({
  filtros,
  ocultas,
  onApply,
  onClose
}) {
  const [draft, setDraft] = useState(filtros),
    [hidden, setHidden] = useState(ocultas),
    [error, setError] = useState(null);
  const [month, setMonth] = useState(filtros.mes || periodoMensalSaoPaulo());
  const [picker, setPicker] = useState(null);
  const parse = value => {
    const iso = dataCivilInput(value);
    return iso ? new Date(iso + 'T12:00:00') : undefined;
  };
  const choose = modo => {
    setDraft(previous => ({
      ...previous,
      modo
    }));
    setError(null);
  };
  return <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet"><SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>Filtrar compras</Text>
      <Text style={styles.label}>Período</Text>
      <View style={styles.row}>{[['TODOS', 'Todo o histórico'], ['MES', 'Mês'], ['INTERVALO', 'Intervalo']].map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{
            checked: draft.modo === value
          }} onPress={() => choose(value)} style={[styles.option, draft.modo === value && styles.selected]}><Text>{label}</Text></Pressable>)}</View>
      {draft.modo === 'MES' && <SeletorMensalHome periodo={month} limites={{
          periodoMinimo: '1000-01',
          periodoMaximo: periodoMensalSaoPaulo()
        }} onChange={setMonth} onChoose={() => setPicker('mes')} nota="" />}
      {draft.modo === 'INTERVALO' && <>{[['inicio', 'De'], ['fim', 'Até']].map(([key, label]) => <View key={key}><Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setPicker(picker === key ? null : key)} style={styles.option}><Text>{label}: {draft[key] || 'Escolher data'}</Text></Pressable>{picker === key && <CalendarioData value={parse(draft[key])} min={key === 'fim' ? parse(draft.inicio) : undefined} max={new Date()} onChange={date => {
              const value = [date.getDate(), date.getMonth() + 1, date.getFullYear()].map((v, i) => i < 2 ? String(v).padStart(2, '0') : v).join('/');
              setDraft(previous => ({
                ...previous,
                [key]: value
              }));
              setPicker(null);
            }} />}</View>)}</>}
      <Text style={styles.label}>Privacidade</Text>
      <View style={styles.row}>{[[false, 'Compras visíveis'], [true, 'Compras ocultas']].map(([value, label]) => <Pressable key={String(value)} accessibilityRole="radio" accessibilityState={{
            checked: hidden === value
          }} onPress={() => setHidden(value)} style={[styles.option, hidden === value && styles.selected]}><Text>{label}</Text></Pressable>)}</View>
      <Text style={styles.note}>Ocultar retira a compra da lista principal, sem alterar os valores financeiros. O acesso continua protegido.</Text>
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" style={[styles.option, styles.apply]} onPress={() => {
          const next = {
            ...draft,
            mes: draft.modo === 'MES' ? month : draft.mes
          };
          try {
            parametrosHistorico(next);
            onApply(next, hidden);
          } catch (error) {
            setError(error.message);
          }
        }}><Text style={presentationStyles.inline1}>Aplicar filtros</Text></Pressable>
      <Pressable accessibilityRole="button" style={styles.option} onPress={onClose}><Text>Cancelar</Text></Pressable>
    </ScrollView>
    {picker === 'mes' && <SeletorMes visible value={month} minMonth="1000-01" maxMonth={periodoMensalSaoPaulo()} title="Mês das compras" onChange={setMonth} onClose={() => setPicker(null)} />}
  </SafeAreaView></Modal>;
}
