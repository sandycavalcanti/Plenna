import { styles } from "./SeletorMensalHome.styles";
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apresentarMesHome, navegacaoMensalHome } from '../../utils/periodoHome';
export default function SeletorMensalHome({
  periodo,
  limites,
  loading,
  error,
  onChange,
  onChoose,
  nota = 'Compras confirmadas do mês'
}) {
  const nav = navegacaoMensalHome(periodo, limites, loading, error);
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" accessibilityState={{
      disabled: !nav.anterior
    }} disabled={!nav.anterior} onPress={() => {
      if (nav.anterior) onChange(nav.anterior);
    }} style={[styles.button, !nav.anterior && styles.disabled]}>
      <MaterialCommunityIcons name="chevron-left" size={26} color="#76658A" accessible={false} />
    </Pressable>
    <Pressable disabled={!onChoose} onPress={onChoose} accessibilityRole={onChoose ? 'button' : undefined} accessibilityLabel={onChoose ? 'Escolher mês e ano' : undefined} style={styles.label}><Text style={styles.month} accessibilityLiveRegion="polite">{apresentarMesHome(periodo)}</Text>{nota ? <Text style={styles.note}>{nota}</Text> : null}</Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" accessibilityState={{
      disabled: !nav.proximo
    }} disabled={!nav.proximo} onPress={() => {
      if (nav.proximo) onChange(nav.proximo);
    }} style={[styles.button, !nav.proximo && styles.disabled]}>
      <MaterialCommunityIcons name="chevron-right" size={26} color="#76658A" accessible={false} />
    </Pressable>
  </View>;
}
