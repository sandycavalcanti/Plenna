import { presentationStyles } from "./styles";
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { DASHBOARD_THEME } from '../../../constants/dashboardTheme';
import { distribuicaoClassificacoes } from '../../../utils/distribuicaoClassificacoes';
const RING_SIZE = 104;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
export default function Impulsividade({
  data,
  onSelect,
  impulsividade = [],
  title = 'Classificações registradas',
  emptyMessage = 'Nenhuma compra confirmada registrada neste período',
  classificationKey = 'compra_classificacao',
  classificationValue = 'IMPULSIVA',
  totalKey = null,
  centerLabel = 'marcadas como impulsivas',
  centerValueMode = 'percentage'
} = {}) {
  const sourceData = data ?? impulsividade;
  const isArrayData = Array.isArray(sourceData);
  const isObjectData = !isArrayData && sourceData !== null && typeof sourceData === 'object';
  const isEmptyArray = isArrayData && sourceData.length === 0;
  const isEmptyObject = isObjectData && Object.keys(sourceData).length === 0;

  // Se não houver dados, retorna mensagem
  if (!isArrayData && !isObjectData || isEmptyArray || isEmptyObject) {
    return <View style={styles.section}>
        <ProfileCard title={title} variant="dashboard">
          <Text style={styles.emptyMessage}>{isArrayData ? 'Nenhuma classificação registrada neste período.' : emptyMessage}</Text>
        </ProfileCard>
      </View>;
  }
  if (isArrayData) {
    const distribution = distribuicaoClassificacoes(sourceData);
    const groups = distribution.groups.filter(group => group.quantidade > 0);
    const declared = groups.some(group => ['IMPULSIVA', 'NAO_IMPULSIVA'].includes(group.codigo));
    if (!declared) return <View style={styles.section}><ProfileCard title={title} variant="dashboard">
      <Text style={styles.emptyMessage}>Nenhuma classificação registrada neste período.</Text>
      {distribution.total > 0 && <Text style={styles.distributionLegendValue}>{distribution.total} compras sem classificação voluntária</Text>}
    </ProfileCard></View>;
    let offset = 0;
    const segments = groups.map(group => {
      const rotation = -90 + offset / distribution.total * 360;
      offset += group.quantidade;
      return {
        ...group,
        rotation
      };
    });
    const labels = {
      IMPULSIVA: 'Impulsivas',
      NAO_IMPULSIVA: 'Não impulsivas',
      PENDENTE: 'Sem classificação'
    };
    return <View style={styles.section}><ProfileCard title={title} variant="dashboard">
      <View style={styles.distributionLayout}>
        <View style={styles.distributionChart} accessible accessibilityRole="image" accessibilityLabel={`${distribution.total} compras: ${groups.map(group => `${group.quantidade} ${labels[group.codigo] || group.nome}`).join(', ')}`}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.distributionSvg}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={DASHBOARD_THEME.colors.track} strokeWidth={RING_STROKE} fill="transparent" />
            {segments.map(group => <Circle key={group.codigo} cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={group.cor} strokeWidth={RING_STROKE} fill="transparent" strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`} strokeDashoffset={RING_CIRCUMFERENCE * (1 - group.percentual / 100)} rotation={group.rotation} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />)}
          </Svg>
          <View style={styles.distributionCenter}><Text style={styles.distributionTotal}>{distribution.total}</Text><Text style={styles.distributionTotalLabel}>compras</Text></View>
        </View>
        <View style={styles.distributionLegend}>{groups.map(group => <Pressable key={group.codigo} accessibilityRole="button" disabled={!onSelect} accessibilityLabel={`${labels[group.codigo] || group.nome}: ${group.quantidade} compras, ${group.percentual.toLocaleString('pt-BR', {
              maximumFractionDigits: 1
            })}%`} onPress={() => onSelect?.(group.codigo)} style={presentationStyles.inline1}>
          <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: group.cor
              }} />
          <View style={{
                flex: 1
              }}><Text style={styles.distributionLegendLabel}>{labels[group.codigo] || group.nome}</Text>
            <Text style={styles.distributionLegendValue}>{group.quantidade} · {group.percentual.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1
                  })}%</Text></View>
        </Pressable>)}</View>
      </View>
      <Text style={presentationStyles.inline2}>{groups.filter(group => ['IMPULSIVA', 'NAO_IMPULSIVA'].includes(group.codigo)).reduce((sum, group) => sum + group.quantidade, 0)} classificadas · Classificações voluntárias</Text>
    </ProfileCard></View>;
  }
  if (isObjectData && totalKey === 'acima_limite') {
    const above = sourceData.acima_limite,
      within = sourceData.dentro_limite;
    const valid = [above, within].every(value => Number.isSafeInteger(value) && value >= 0);
    const total = valid ? above + within : 0;
    return <View style={styles.section}><ProfileCard title={title} variant="dashboard">
      {!valid || total === 0 ? <Text style={styles.emptyMessage}>Nenhuma comparação disponível neste período.</Text> : <>
        <View style={presentationStyles.inline3}>
          <View><Text style={styles.chartPercent}>{above}</Text><Text style={styles.distributionLegendValue}>acima do limite</Text></View>
          <Text style={styles.distributionLegendLabel}>{within} dentro do limite</Text>
        </View>
        <View style={styles.limitContextTrack} accessible accessibilityRole="progressbar" accessibilityLabel={`${above} compras acima do limite entre ${total} avaliadas`} accessibilityValue={{
            min: 0,
            max: total,
            now: above
          }}>
          <View style={[styles.limitContextFill, {
              width: `${above / total * 100}%`
            }]} />
        </View>
        <Text style={styles.distributionLegendValue}>{total} compras com comparação disponível</Text>
      </>}
    </ProfileCard></View>;
  }

  // Normaliza tanto listas quanto objetos resumidos vindos da API
  const totalQuantity = isArrayData ? sourceData.reduce((sum, item) => sum + Number(item?.quantidade || 0), 0) : Object.values(sourceData).reduce((sum, value) => sum + Number(value || 0), 0);
  const relevantQuantity = isArrayData ? sourceData.find(item => String(item?.[classificationKey] || '').toUpperCase() === String(classificationValue).toUpperCase())?.quantidade || 0 : Number(sourceData?.[totalKey || 'acima_limite'] ?? 0) || 0;
  const impulsivePercentage = totalQuantity > 0 ? Math.round(relevantQuantity / totalQuantity * 100) : 0;
  const progress = Math.max(0, Math.min(100, impulsivePercentage));
  const progressOffset = RING_CIRCUMFERENCE - progress / 100 * RING_CIRCUMFERENCE;
  const withinLimitQuantity = Math.max(0, totalQuantity - relevantQuantity);
  const centerValue = centerValueMode === 'quantity' ? relevantQuantity : `${progress}%`;
  return <View style={styles.section}>
      <ProfileCard title={title} variant="dashboard">
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View style={styles.ringShell} accessible accessibilityRole="image" accessibilityLabel={`${relevantQuantity} compras acima do limite neste período`}>
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#EAE3F7" strokeWidth={RING_STROKE} fill="transparent" />
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={COLORS.dadoDois} strokeWidth={RING_STROKE} fill="transparent" strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`} strokeDashoffset={progressOffset} strokeLinecap="round" rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />
              </Svg>

              <View style={styles.ringCenter}>
                <Text style={styles.chartPercent}>{centerValue}</Text>
                <Text style={styles.chartCenterLabel}>{centerLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.limitContext}>
            <View style={styles.limitContextHeader}>
              <Text style={styles.limitContextTitle}>Distribuição do período</Text>
              <Text style={styles.limitContextTotal}>{totalQuantity} compras</Text>
            </View>
            <View style={styles.limitContextTrack}>
              <View style={[styles.limitContextFill, {
              width: `${progress}%`
            }]} />
            </View>
            <View style={styles.limitContextLabels}>
              <Text style={styles.limitContextLabel}>{relevantQuantity} acima do limite</Text>
              <Text style={styles.limitContextLabel}>{withinLimitQuantity} dentro do limite</Text>
            </View>
          </View>
        </View>
      </ProfileCard>
    </View>;
}
