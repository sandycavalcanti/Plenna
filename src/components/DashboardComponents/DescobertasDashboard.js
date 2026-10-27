import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../ProfileComponents/ProfileCard';
import { apresentarMesHome } from '../../utils/periodoHome';
import ReadingDetails from '../ReadingDetails';
export default function DescobertasDashboard({ dados, onOpen }) {
  const items = (dados?.descobertas || [])
    .filter((d) => d.tipo === 'REGISTRADO' && d.evidencias?.length)
    .slice(0, 2);
  if (!items.length) return null;
  return (
    <ProfileCard title="Padrões observados" variant="dashboard">
      <Text style={{ fontSize: 12, color: '#655A70' }}>
        {apresentarMesHome(dados.periodo)}
      </Text>
      {items.map((d) => (
        <View key={d.id} style={{ gap: 6, paddingVertical: 10 }}>
          <MaterialCommunityIcons name="chart-line" size={21} color="#8660A1" />
          <Text style={{ fontWeight: '600', color: '#594367' }}>
            {d.titulo}
          </Text>
          <Text style={{ color: '#655A70' }}>{d.informacao}</Text>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={{ minHeight: 48, justifyContent: 'center' }}
      >
        <Text style={{ color: '#893467' }}>
          Ver compras relacionadas ao período
        </Text>
      </Pressable>
      <ReadingDetails label="Sobre estes registros">
        <Text style={{ color: '#655A70' }}>
          Somente registros disponíveis, sem garantia de histórico completo. As
          datas usam o horário de São Paulo; o período segue a mesma referência dos gráficos
          financeiros.
        </Text>
      </ReadingDetails>
    </ProfileCard>
  );
}
