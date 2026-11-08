import { s } from "./styles";
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../../api/client';
import { tokenStorage } from '../../../api/tokenStorage';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { criarConsultaPanorama } from '../../../services/panoramaComprasService';
import DetalhesPeriodo from './DetalhesPeriodo';
const c = DASHBOARD_THEME.colors;
export default function PanoramaCompras({
  filtros,
  active = true,
  refreshKey = 0
}) {
  const [state, setState] = useState({
      status: 'idle',
      dados: null
    }),
    [open, setOpen] = useState(false);
  const query = useRef(null);
  const key = JSON.stringify(filtros);
  useEffect(() => {
    setOpen(false);
    setState({
      status: 'idle',
      dados: null
    });
    if (!active) return;
    const q = criarConsultaPanorama({
      filtros,
      client: apiClient,
      storage: tokenStorage,
      onChange: next => {
        setState({
          ...next,
          key,
          refreshKey
        });
        if (next.status === 'session') setOpen(false);
      }
    });
    query.current = q;
    q.consultar();
    const listener = AppState?.addEventListener('change', next => {
      setOpen(false);
      if (next === 'active') q.consultar();else q.invalidar();
    });
    return () => {
      listener?.remove();
      q.dispose();
      query.current = null;
    };
  }, [key, active, refreshKey]);
  // Evita exibir o período anterior antes da limpeza do efeito.
  if (!active) return null;
  const current = state.key === key && state.refreshKey === refreshKey ? state : {
    status: 'loading',
    dados: null
  };
  const d = current.dados,
    loading = current.status === 'loading';
  const explorar = () => {
    setOpen(true);
    query.current?.consultar(true,true);
  };
  const retry = () => query.current?.consultar(open,open);
  const estado = <>{loading && <ActivityIndicator accessibilityLabel="Carregando panorama" color={c.navy} />}
    {current.status === 'error' && <><Text accessibilityRole="alert" style={s.body}>Não foi possível consultar o panorama.</Text><Pressable accessibilityRole="button" onPress={retry} style={s.action}><Text style={s.link}>Tentar novamente</Text></Pressable></>}
    {current.status === 'session' && <Text style={s.body}>Sua sessão mudou. Entre novamente para consultar.</Text>}</>;
  return <View style={s.card}>
    <View style={s.row}><Ionicons name="stats-chart-outline" size={24} color={c.navy} /><View style={s.copy}><Text accessibilityRole="header" style={s.title}>Panorama das compras</Text></View></View>
    {estado}
    {d && <><View style={s.metrics}><View style={s.metric}><Text style={s.number}>{d.universo}</Text><Text style={s.body}>Compras elegíveis</Text></View><View style={s.metric}><Text style={s.number}>{d.comContexto}</Text><Text style={s.body}>Com contexto válido</Text></View></View>
      <Pressable accessibilityRole="button" onPress={explorar} style={s.action}><Text style={s.link}>Explorar análise do período</Text><Ionicons name="chevron-forward" size={20} color={c.navy} /></Pressable></>}
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={s.screen}><View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Fechar análise do período" onPress={() => setOpen(false)} style={s.close}><Ionicons name="arrow-back" size={24} color={c.navy} /></Pressable><Text accessibilityRole="header" style={s.title}>Análise do período</Text></View>
        <ScrollView contentContainerStyle={s.content}>{estado}
          {open && d?.habitos && <DetalhesPeriodo dados={d} filtros={filtros} consultadoEm={current.consultadoEm} />}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}
