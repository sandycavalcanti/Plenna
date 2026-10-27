import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moedaCompra } from '../../utils/comprasPeriodo';
export default function ResumoCompra({ compra }) {
  const [selected, setSelected] = useState(null);
  if (!compra) return null;
  const items = (compra.tb_compra_item || []).filter(
    (i) => i.compra_item_ativo !== 0,
  );
  return (
    <View style={{ gap: 10, paddingVertical: 12 }}>
      <Text style={{ fontSize: 21, fontWeight: '700', color: '#594367' }}>
        {compra.compra_fonte || 'Sua compra'}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#594367' }}>
        {moedaCompra(compra.compra_valor)}
      </Text>
      <Text style={{ color: '#655A70' }}>
        {Number.isFinite(Date.parse(compra.compra_horario))
          ? new Date(compra.compra_horario).toLocaleDateString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
            })
          : 'Data não informada'}
      </Text>
      {items.length > 0 && (
        <Text style={{ fontWeight: '600', color: '#594367' }}>
          Itens · {items.length}
        </Text>
      )}
      {items.map((i) => (
        <View key={i.compra_item_id}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: selected === i.compra_item_id }}
            onPress={() =>
              setSelected((old) =>
                old === i.compra_item_id ? null : i.compra_item_id,
              )
            }
            style={{
              minHeight: 52,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#EEE4F2',
            }}
          >
            <Ionicons name="bag-outline" size={21} color="#8660A1" />
            <Text style={{ flex: 1, color: '#594367' }}>
              {i.compra_item_nome}
            </Text>
            <Text style={{ color: '#594367' }}>
              {i.compra_item_quantidade != null
                ? i.compra_item_quantidade + ' × '
                : null}
              {moedaCompra(i.compra_item_valor)}
            </Text>
            <Ionicons
              name={
                selected === i.compra_item_id ? 'chevron-up' : 'chevron-down'
              }
              size={18}
              color="#8660A1"
            />
          </Pressable>
          {selected === i.compra_item_id && (
            <View
              style={{
                padding: 12,
                gap: 6,
                backgroundColor: '#EEE4F2',
                borderRadius: 12,
              }}
            >
              {i.compra_item_quantidade != null && (
                <Text>
                  Quantidade: {i.compra_item_quantidade}
                  {i.compra_item_unidade_medida
                    ? ' ' + i.compra_item_unidade_medida
                    : ''}
                </Text>
              )}
              {i.tb_categoria?.categoria_nome && (
                <Text>{i.tb_categoria.categoria_nome}</Text>
              )}
              <Text>
                Valor unitário registrado: {moedaCompra(i.compra_item_valor)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
