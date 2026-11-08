import React from 'react';
import { Text, View } from 'react-native';
import { s } from './DetalhesPeriodo.styles';

const moeda = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 3 });
const dia = instant => new Date(instant).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const intervalo = j => `${dia(j.inicio)} a ${dia(new Date(Date.parse(j.fimExclusivo) - 1).toISOString())}`;
export default function ComportamentoPeriodo({ dados }) {
  if (!dados) return null;
  const r = dados.recorrencias, c = dados.comparacao;
  const mensagens = {
    COMPARACAO_APENAS_PARA_MES: 'A comparação entre períodos está disponível apenas para meses com cobertura comprovada.',
    JANELA_SEM_OBSERVACAO: 'Ainda não há um intervalo observado para comparar.',
    JANELAS_NAO_EQUIVALENTES: 'Os intervalos disponíveis não permitem uma comparação equivalente.',
    FONTES_HISTORICAS_INCONSISTENTES: 'Os registros disponíveis não permitem comparar esses intervalos.',
  };
  const indisponivel = mensagens[c.motivos[0]] ?? 'Ainda não há cobertura suficiente para comparar períodos com segurança.';
  const diferenca = c.frequencia?.diferenca;
  return <View style={s.section}>
    <Text accessibilityRole="header" style={s.title}>Vínculos registrados</Text>
    <Text style={s.body}>{r.comprasVinculadas
      ? `${r.comprasVinculadas} ${r.comprasVinculadas === 1 ? 'compra com vínculo' : 'compras com vínculo'} de recorrência registrado, em ${r.vinculosDistintos} ${r.vinculosDistintos === 1 ? 'vínculo distinto' : 'vínculos distintos'}.`
      : 'Nenhuma compra deste período tem vínculo de recorrência registrado.'}</Text>
    {c.disponibilidade === 'INDISPONIVEL' ? <Text style={s.caption}>{indisponivel}</Text> : <>
      <Text style={s.caption}>Intervalos comparados: {intervalo(c.anterior)} e {intervalo(c.atual)}.</Text>
      <Text style={s.body}>{diferenca === 0 ? 'Mesma quantidade de compras nos intervalos comparáveis.' : `${Math.abs(diferenca)} ${Math.abs(diferenca) === 1 ? 'compra' : 'compras'} ${diferenca > 0 ? 'a mais' : 'a menos'} nos intervalos comparáveis.`}</Text>
      {c.medianaCentavos ? <><Text style={s.body}>Mediana por compra: {moeda(c.medianaCentavos.anterior)} → {moeda(c.medianaCentavos.atual)}.</Text>
        <Text style={s.caption}>Valor central das compras registradas em cada intervalo; não é gasto mensal.</Text></>
        : <Text style={s.caption}>Os valores registrados não permitem comparar a mediana por compra.</Text>}
    </>}
  </View>;
}
