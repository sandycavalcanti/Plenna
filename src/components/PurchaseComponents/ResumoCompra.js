import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moedaCompra } from '../../utils/comprasPeriodo';
import { purchaseStyles as s } from './presentationStyles';
import { DASHBOARD_THEME } from '../../constants/dashboardTheme';
import HistoricoEventos from './HistoricoEventos';
export default function ResumoCompra({
  compra,
  onManage,
  onContext,
  refreshKey = 0
}) {
  const [expanded, setExpanded] = useState(false),
    [selected, setSelected] = useState(null),
    [history, setHistory] = useState(false);
  if (!compra) return null;
  const items = (compra.tb_compra_item || []).filter(i => i.compra_item_ativo !== 0);
  const item = items.find(i => i.compra_item_id === selected);
  const status = {
    CONFIRMADA: 'Confirmada',
    AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
    IGNORADA: 'Ignorada'
  }[compra.compra_status];
  const date = Number.isFinite(Date.parse(compra.compra_horario)) ? new Date(compra.compra_horario).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  }) : null;
  return <View>
  <View style={s.card}>
    <View style={s.sectionHeading}><Ionicons name="bag-handle-outline" size={23} color={DASHBOARD_THEME.colors.navy} /><Text style={s.title}>Detalhes da compra</Text></View>
    <View style={s.row}><View style={s.icon}><Ionicons name="storefront-outline" size={22} color={DASHBOARD_THEME.colors.navy} /></View><View style={s.copy}><Text style={s.title}>{compra.compra_fonte || 'Origem não informada'}</Text><Text style={s.caption}>{date ?? 'Data não informada'}</Text></View></View>
    <View style={[s.row, s.divider]}><Text style={[s.body, s.copy]}>Valor total</Text><Text style={s.value}>{moedaCompra(compra.compra_valor)}</Text></View>
    {items.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{
        expanded
      }} onPress={() => setExpanded(v => !v)} style={[s.row, s.action]}><Ionicons name="bag-outline" size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={[s.actionText, s.copy]}>{expanded ? 'Recolher itens' : `Ver detalhes dos itens (${items.length})`}</Text><Ionicons name="chevron-forward" size={19} color={DASHBOARD_THEME.colors.navy} /></Pressable>}
  </View>
  {expanded && items.length > 0 && <><Text style={s.title}>Itens da compra</Text>{items.map(i => <View key={i.compra_item_id} style={[s.card, {
        marginTop: 8
      }]}><Pressable accessibilityRole="button" accessibilityLabel={`Detalhes de ${i.compra_item_nome}`} style={s.row} onPress={() => {
          setSelected(selected === i.compra_item_id ? null : i.compra_item_id);
          setHistory(false);
        }}><View style={s.icon}><Ionicons name="cube-outline" size={21} color={DASHBOARD_THEME.colors.navy} /></View><View style={s.copy}><Text style={s.title}>{i.compra_item_nome}</Text>{i.tb_categoria?.categoria_nome && <Text style={s.caption}>{i.tb_categoria.categoria_nome}</Text>}{i.compra_item_quantidade != null && <Text style={s.caption}>{i.compra_item_quantidade} {i.compra_item_unidade_medida || 'un.'}</Text>}</View><Text style={s.body}>{moedaCompra(i.compra_item_valor)}</Text><Ionicons name="chevron-forward" size={18} color={DASHBOARD_THEME.colors.navy} /></Pressable>
   {selected === i.compra_item_id && <View style={s.divider}><Text style={s.caption}>{i.compra_item_quantidade == null ? 'Valor registrado: ' : 'Valor unitário registrado: '}{moedaCompra(i.compra_item_valor)}</Text><View style={s.chips}>
    {onManage && compra.compra_status === 'CONFIRMADA' && <Pressable accessibilityRole="button" style={s.chip} onPress={() => onManage(i)}><Text style={s.actionText}>Gerenciar item</Text></Pressable>}
    <Pressable accessibilityRole="button" style={s.chip} onPress={() => setHistory(v => !v)}><Text style={s.actionText}>{history ? 'Recolher histórico' : 'Histórico do item'}</Text></Pressable>
   </View></View>}
  </View>)}</>}
  {item && history && <HistoricoEventos itens={compra.tb_compra_item} compraId={compra.compra_id} itemId={item.compra_item_id} refreshKey={refreshKey} />}
  <View style={[s.card, s.row]}><Text style={[s.title, s.copy]}>Situação do registro</Text><Text style={s.badge}>{status ?? 'Não informada'}</Text></View>
  <View style={s.card}><Text style={s.title}>Ações</Text><View style={s.factorGrid}>
    {onContext && <Pressable accessibilityRole="button" onPress={onContext} style={[s.factor, {
          minHeight: 84
        }]}><Ionicons name="create-outline" size={25} color={DASHBOARD_THEME.colors.navy} /><Text style={s.actionText}>Editar contexto</Text></Pressable>}
    {!!items.length && <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} style={[s.factor, {
          minHeight: 84
        }]}><Ionicons name="cube-outline" size={25} color={DASHBOARD_THEME.colors.navy} /><Text style={s.actionText}>Gerenciar itens</Text></Pressable>}
    {onManage && ['CONFIRMADA', 'AGUARDANDO_CONFIRMACAO'].includes(compra.compra_status) && <Pressable accessibilityRole="button" onPress={() => onManage()} style={[s.factor, {
          minHeight: 84
        }]}><Ionicons name="options-outline" size={25} color={DASHBOARD_THEME.colors.navy} /><Text style={s.actionText}>Gerenciar compra</Text></Pressable>}
  </View></View>
  <View style={s.card}><Text style={s.title}>Informações da compra</Text>

   {compra.tb_forma_pagamento?.forma_pagamento_nome && <View style={s.divider}><Text style={s.caption}>Forma de pagamento</Text><Text style={s.body}>{compra.tb_forma_pagamento.forma_pagamento_nome}</Text></View>}
   <View style={s.divider}><Text style={s.caption}>Origem do registro</Text><Text style={s.body}>{compra.compra_email === true ? 'E-mail' : compra.compra_email === false ? 'Manual' : 'Não identificada'}</Text></View>
  </View>
 </View>;
}
