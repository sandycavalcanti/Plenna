import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { comporInsightsContextuais, fatoresDoInsight } from './insightsContextuais';
import { styles as s } from './styles';

// Composição derivada: o resultado original permanece no Histórico.
export default function PainelAnalise({
  avaliacao,
  compraId,
  revisao,
  opcoesInsight,
  onClose
}) {
  const composto = useMemo(() => comporInsightsContextuais(avaliacao, {
    ...opcoesInsight,
    compraId,
    revisao
  }), [avaliacao, compraId, revisao, opcoesInsight]);
  const insight = composto.principal;
  const fatores = fatoresDoInsight(insight);
  const uncertain = composto.estado === 'SEM_EVIDENCIAS' ? avaliacao?.resultado?.declaracoes?.filter(d => ['NAO_LEMBRO', 'PREFIRO_NAO_RESPONDER'].includes(d.valor)) ?? [] : [];
  return <View style={s.overlay}>
    <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes da análise" onPress={onClose} style={s.backdrop} />
    <View style={s.sheet} accessibilityViewIsModal>
      <View style={s.handle} />
      <View style={s.sheetHeader}><Text accessibilityRole="header" style={s.sheetTitle}>Entender esta análise</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar Entender esta análise" onPress={onClose} style={s.close}><Ionicons name="close" size={24} color={DASHBOARD_THEME.colors.navy} /></Pressable></View>
      <ScrollView contentContainerStyle={s.sheetContent} keyboardShouldPersistTaps="handled">
        <View style={s.group}><Text accessibilityRole="header" style={s.title}>Como o Plenna interpretou</Text>
          <View style={s.factors}>{fatores.slice(0, 3).map((f, index) => <React.Fragment key={f.id}>
            {index > 0 && <Ionicons name="link-outline" size={18} color={DASHBOARD_THEME.colors.navy} accessibilityLabel="Associação contextual" />}
            <View style={s.factor}><Ionicons name={f.icone} size={22} color={DASHBOARD_THEME.colors.navy} /><Text style={s.factorLabel}>{f.titulo}</Text><Text style={s.factorValue}>{f.valorCurto}</Text></View>
          </React.Fragment>)}</View>
          {!fatores.length && <Text style={s.body}>Sem evidências válidas suficientes para uma relação contextual.</Text>}
          {insight && <View style={s.heading}><Ionicons name="arrow-forward-outline" size={20} color={DASHBOARD_THEME.colors.navy} /><Text style={s.subheading}>Observação contextual</Text></View>}
        </View>
        <View style={s.group}><Text accessibilityRole="header" style={s.title}>Por que isso apareceu?</Text>
          <Text style={s.body}>{insight?.relacao ?? (composto.estado === 'DESATUALIZADO' ? 'Atualize a reflexão para considerar os dados atuais.' : 'Nenhuma relação foi inferida a partir de dados ausentes ou incertos.')}</Text>
        </View>
        <View style={s.group}><Text accessibilityRole="header" style={s.title}>Sobre esta interpretação</Text>
          {!!uncertain.length && <Text style={s.caption}>{[...new Set(uncertain.map(d => d.valor === 'NAO_LEMBRO' ? 'Não lembro' : 'Prefiro não responder'))].join(' e ')}: respostas preservadas, sem tratá-las como evidências conhecidas.</Text>}
          <Text style={s.caption}>As associações não comprovam causa, não determinam impulsividade e não constituem diagnóstico.</Text>
        </View>
      </ScrollView>
    </View>
  </View>;
}
