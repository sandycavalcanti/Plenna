import { s } from "./DetalhesPeriodo.styles";
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { getCategoryIcon } from '../PurchaseItem';
import UsoDigitalPeriodo from './UsoDigitalPeriodo';
import ComportamentoPeriodo from './ComportamentoPeriodo';
import { classificacoesPeriodo, comporPeriodo, consultaLegivel, detalheFator, fatoresPeriodo, periodoLegivel } from './detalhamento';
const c = DASHBOARD_THEME.colors,
  dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function Titulo({
  children
}) {
  return <Text accessibilityRole="header" style={s.title}>{children}</Text>;
}
function Categoria({
  categoria: v
}) {
  const {
    family: Icon,
    name
  } = getCategoryIcon(v.nome);
  return <View style={s.row}><Icon name={name} size={22} color={c.navy} /><Text style={[s.body, s.grow]}>{v.nome}</Text><Text style={s.count}>{v.compras} {v.compras === 1 ? 'compra' : 'compras'}</Text></View>;
}
export default function DetalhesPeriodo({
  dados: d,
  filtros,
  consultadoEm
}) {
  const [fator, setFator] = useState(null),
    [relacao, setRelacao] = useState(null),
    [metodo, setMetodo] = useState(false);
  const composicao = useMemo(() => comporPeriodo(d), [d]);
  const fatores = useMemo(() => fatoresPeriodo(d.sinais), [d]);
  const max = Math.max(1, ...d.habitos.diasSemana.map(v => v.compras));
  const horario = consultaLegivel(consultadoEm);
  const classificacoes = classificacoesPeriodo(d);
  return <View style={s.container}>
    <Text style={s.period}>{periodoLegivel(filtros)}</Text>
    <View style={s.summary}><Titulo>Resumo do período</Titulo>
      <View style={s.tiles}>{[[d.universo, 'Compras elegíveis', 'bag-outline'], [d.comContexto, 'Com contexto', 'checkbox-outline'], [d.comAutopercepcao, 'Com autopercepção', 'person-outline']].map(([n, label, icon]) => <View key={label} style={s.tile}><Ionicons name={icon} size={24} color={c.navy} /><Text style={s.number}>{n}</Text><Text style={s.tileLabel}>{label}</Text></View>)}</View>
    </View>
    {classificacoes && <View style={s.section}><Titulo>Classificações registradas</Titulo>
      <View accessibilityLabel="Proporções das classificações" style={s.distribution}>{[[classificacoes.impulsivas, '#D90035'], [classificacoes.naoImpulsivas, '#44866C'], [classificacoes.semClassificacao, '#9C99A8']].filter(([n]) => n > 0).map(([n, color]) => <View key={color} style={{flex: n, backgroundColor: color, height: 12}} />)}</View>
      {[[classificacoes.impulsivas, 'Impulsivas', '#D90035'], [classificacoes.naoImpulsivas, 'Não impulsivas', '#44866C'], [classificacoes.semClassificacao, 'Sem classificação', '#9C99A8']].map(([n, label, color]) => <View key={label} style={s.row}><View style={[s.dot, {backgroundColor: color}]} /><Text style={[s.body, s.grow]}>{label}</Text><Text style={s.count}>{n} ({d.universo ? Math.round(n / d.universo * 100) : 0}%)</Text></View>)}
    </View>}
    <View style={s.highlight}><Titulo>Destaque do período</Titulo><Text style={s.body}>{composicao.destaque.observacao}</Text></View>
    {d.universo > 0 && <View style={s.section}><Titulo>Hábitos de compra</Titulo><Text style={s.caption}>Compras por dia da semana</Text>
      <View style={s.week}>{dias.map((label, dia) => {
          const n = d.habitos.diasSemana.find(v => v.dia === dia)?.compras ?? 0;
          return <View key={dia} accessible accessibilityLabel={`${label}: ${n} compras`} style={s.day}><Text style={s.caption}>{n}</Text><View style={s.track}><View style={[s.bar, {
                height: `${n / max * 100}%`
              }]} /></View><Text style={s.caption}>{label}</Text></View>;
        })}</View>
      {!!d.habitos.categorias.length && <><Text style={s.caption}>Categorias mais frequentes</Text>{d.habitos.categorias.slice(0, 3).map((v, i) => <Categoria key={`${v.nome}:${i}`} categoria={v} />)}<Text style={s.caption}>Uma compra pode ter várias categorias.</Text></>}
    </View>}
    <ComportamentoPeriodo dados={d.comportamento} />
    {!!fatores.length && <View style={s.section}><Titulo>Fatores observados</Titulo>
      <View style={s.tiles}>{fatores.slice(0, 3).map(v => <Pressable key={v.codigo} accessibilityRole="button" accessibilityLabel={`Detalhes de ${v.nome}`} accessibilityState={{expanded: fator === v.codigo}} onPress={() => setFator(fator === v.codigo ? null : v.codigo)} style={s.tile}><Ionicons name={v.icone} size={26} color={c.navy} /><Text style={s.tileLabel}>{v.codigo === 'IMPULSO' ? 'Impulso percebido' : v.nome}</Text><Text style={s.count}>{v.condicao} {v.condicao === 1 ? 'compra' : 'compras'}</Text></Pressable>)}</View>
      {fatores.filter(v => v.codigo === fator).map(v => <View key={v.codigo} style={s.detail}><Text style={s.body}>{v.significado}</Text>{detalheFator(v, d.universo).map(t => <Text key={t} style={s.caption}>{t}</Text>)}</View>)}
    </View>}
    {!!composicao.relacoes.length && <View style={s.section}><Titulo>Relações observadas</Titulo>{composicao.relacoes.map(v => <View key={v.codigo} style={{gap: 8}}><Pressable accessibilityRole="button" accessibilityLabel={`Detalhes da relação ${v.fatores.join(' e ')}`} accessibilityState={{expanded: relacao === v.codigo}} onPress={() => setRelacao(relacao === v.codigo ? null : v.codigo)} style={s.row}>{v.fatores.map((nome, i) => <React.Fragment key={nome}>{i > 0 && <Ionicons name="add-circle" size={24} color={c.navy} />}<View style={s.tile}><Ionicons name={v.codigo.split('_')[i] === 'PROMOCAO' ? 'pricetag-outline' : nome.includes('Impulso') ? 'flash-outline' : 'calendar-outline'} size={26} color={c.navy} /><Text style={s.tileLabel}>{nome}</Text></View></React.Fragment>)}</Pressable><Text style={[s.detail, s.caption]}>Apareceram juntos em {v.condicao} compras.</Text>{relacao === v.codigo && <Text style={s.caption}>{v.validos} compras tinham ambas as respostas válidas. A associação não comprova causa.</Text>}</View>)}</View>}
    <View style={s.highlight}><Titulo>{filtros.modo === 'MES' ? `Reflexão de ${periodoLegivel(filtros).split(' de ')[0].toLowerCase()}` : 'Reflexão do período'}</Titulo><Text style={s.strong}>{composicao.reflexao.titulo}</Text><Text style={s.body}>{composicao.reflexao.observacao}</Text>{composicao.reflexao.pergunta && <><Text style={s.strong}>Para pensar</Text><Text style={s.body}>{composicao.reflexao.pergunta}</Text></>}</View>
    {filtros.modo === 'MES' && <UsoDigitalPeriodo periodo={filtros.mes} />}
    <Pressable accessibilityRole="button" accessibilityState={{
      expanded: metodo
    }} onPress={() => setMetodo(v => !v)} style={s.toggle}><Text style={s.strong}>Sobre os dados deste período</Text><Ionicons name={metodo ? 'chevron-up' : 'chevron-down'} size={18} color={c.navy} /></Pressable>
    {metodo && <View style={s.detail}><Text style={s.caption}>Classificações são escolhas salvas; sugestões automáticas não entram nas contagens. Fatores e relações consideram somente respostas válidas, que podem cobrir parte das compras. Os registros refletem o estado disponível na consulta; não há informação completa sobre alterações posteriores.</Text>{d.limitacoes.map((v, i) => <Text key={i} style={s.caption}>{v}</Text>)}<Text style={s.caption}>Fatores descrevem respostas voluntárias. Autopercepção e classificação são registros distintos; não há classificação automática. Não há comparação com períodos sem cobertura comprovada.</Text></View>}
    {horario && <Text style={s.caption}>{horario}</Text>}
  </View>;
}
