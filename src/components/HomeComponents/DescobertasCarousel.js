import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { selecionarDescobertas } from '../../utils/selecionarDescobertas';
export default function DescobertasCarousel({ cards = [], onAction }) {
  const { width } = useWindowDimensions(),
    page = Math.max(220, width - 36);
  const [index, setIndex] = useState(0);
  const items = selecionarDescobertas(cards);
  const signature = items.map((c) => c.codigo).join('|');
  useEffect(() => setIndex(0), [signature]);
  if (!items.length)
    return (
      <View style={{ marginHorizontal: 18, marginBottom: 14, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#594367' }}>
          Para voc?
        </Text>
        <Text style={{ color: '#655A70', lineHeight: 20 }}>
          Nenhuma descoberta dispon?vel para mostrar agora.
        </Text>
      </View>
    );
  return (
    <View style={{ marginBottom: 14, gap: 8 }}>
      <Text
        style={{
          marginHorizontal: 18,
          fontSize: 18,
          fontWeight: '700',
          color: '#594367',
        }}
      >
        Para você
      </Text>
      <ScrollView
        key={signature}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: 18 }}
        onMomentumScrollEnd={(e) =>
          setIndex(
            Math.max(
              0,
              Math.min(
                items.length - 1,
                Math.round(e.nativeEvent.contentOffset.x / page),
              ),
            ),
          )
        }
      >
        {items.map((c) => (
          <View
            key={c.codigo}
            style={{
              width: page,
              padding: 16,
              borderRadius: 18,
              backgroundColor: '#FFF',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons
              name={c.icone || 'lightbulb-outline'}
              size={23}
              color="#8660A1"
            />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#594367' }}>
              {c.titulo}
            </Text>
            <Text style={{ color: '#655A70', lineHeight: 20 }}>
              {c.mensagem}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onAction(c)}
              style={{ minHeight: 48, justifyContent: 'center' }}
            >
              <Text style={{ color: '#893467', fontWeight: '600' }}>
                {c.acao === 'metas'
                  ? 'Ver meta'
                  : c.acao === 'notificacoes'
                    ? 'Ver avisos'
                    : c.acao === 'descobertas'
                      ? 'Entender meus registros'
                      : 'Ver compras'}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {items.length > 1 && (
        <View
          accessibilityLabel={`Descoberta ${index + 1} de ${items.length}`}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          {items.map((c, i) => (
            <View
              key={c.codigo}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? '#704389' : '#D8CBDD',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
