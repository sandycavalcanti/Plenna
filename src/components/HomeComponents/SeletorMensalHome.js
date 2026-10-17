import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apresentarMesHome, navegacaoMensalHome } from '../../utils/periodoHome';
export default function SeletorMensalHome({ periodo, limites, loading, error, onChange }) {
  const nav = navegacaoMensalHome(periodo, limites, loading, error);
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" accessibilityState={{disabled: !nav.anterior}} disabled={!nav.anterior} onPress={() => { if (nav.anterior) onChange(nav.anterior); }} style={[styles.button, !nav.anterior && styles.disabled]}>
      <MaterialCommunityIcons name="chevron-left" size={26} color="#76658A" accessible={false} />
    </Pressable>
    <View style={styles.label}><Text style={styles.month} accessibilityLiveRegion="polite">{apresentarMesHome(periodo)}</Text><Text style={styles.note}>Compras confirmadas do mês</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" accessibilityState={{disabled: !nav.proximo}} disabled={!nav.proximo} onPress={() => { if (nav.proximo) onChange(nav.proximo); }} style={[styles.button, !nav.proximo && styles.disabled]}>
      <MaterialCommunityIcons name="chevron-right" size={26} color="#76658A" accessible={false} />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { marginHorizontal:18, marginBottom:12, padding:4, backgroundColor:'#FFFFFF', borderRadius:18, flexDirection:'row', alignItems:'center' },
  button: { minWidth:48, minHeight:48, alignItems:'center', justifyContent:'center' },
  disabled: { opacity:0.35 },
  label: { flex:1, paddingVertical:8, paddingHorizontal:4 },
  month: { color:'#4A4E7A', fontWeight:'700', fontSize:16, textAlign:'center' },
  note: { color:'#76658A', fontSize:12, textAlign:'center', marginTop:3 },
});