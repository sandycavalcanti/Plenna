import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { COLORS } from '../../../constants';

const { width } = Dimensions.get('window');

export default function AlertasHabito() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef();

  const alerts = [
    {
      id: '1',
      categoria: 'ROUPA',
      qtd: 3,
      recomendacao: 'Espere até 48h para próxima compra',
    },
    {
      id: '2',
      categoria: 'DELIVERY',
      qtd: 5,
      recomendacao: 'Você já gastou bastante essa semana 👀',
    },
    {
      id: '3',
      categoria: 'ELETRÔNICOS',
      qtd: 2,
      recomendacao: 'Talvez seja bom revisar sua necessidade',
    },
  ];

  const onScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(slide);
  };

  const renderItem = ({ item }) => (
    <View style={[{ width: width - 40 }, styles.card]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={22} color={COLORS.dashboardAlertaCardTitulo} />
        <Text style={styles.title}> Alerta de Hábito repetitivo</Text>
      </View>

      <Text style={styles.text}>
        Você comprou {item.qtd} itens da categoria <Text style={styles.highlight}>{item.categoria}</Text> na última semana
      </Text>

      <Text style={styles.recomendacao}>Recomendação: {item.recomendacao}</Text>
    </View>
  );

  return (
    <View>
      <FlatList ref={flatRef} data={alerts} renderItem={renderItem} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.id} onScroll={onScroll} />

      {/* Bolinhas */}
      <View style={styles.dots}>
        {alerts.map((_, index) => (
          <View key={index} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}
