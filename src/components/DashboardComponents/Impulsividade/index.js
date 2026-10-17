import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { distribuicaoClassificacoes } from '../../../utils/distribuicaoClassificacoes';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RING_SIZE = 136;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Impulsividade({
  data,
  impulsividade = [],
  title = 'Classificações registradas',
  emptyMessage = 'Nenhuma compra confirmada registrada neste período',
  classificationKey = 'compra_classificacao',
  classificationValue = 'IMPULSIVA',
  totalKey = null,
  centerLabel = 'marcadas como impulsivas',
  centerValueMode = 'percentage',
  infoTitle = 'Sobre estas marcações',
  highLabel = 'Impulsividade alta',
  mediumLabel = 'Impulsividade moderada',
  lowLabel = 'Impulsividade baixa',
  highDescription = 'O comportamento de compra está mais concentrado em decisões impulsivas.',
  mediumDescription = 'Existe um nível intermediário de compras impulsivas no período.',
  lowDescription = 'A maior parte das compras está fora do padrão impulsivo.',
} = {}) {
  const [expanded, setExpanded] = useState(false);
  const sourceData = data ?? impulsividade;
  const isArrayData = Array.isArray(sourceData);
  const isObjectData = !isArrayData && sourceData !== null && typeof sourceData === 'object';
  const isEmptyArray = isArrayData && sourceData.length === 0;
  const isEmptyObject = isObjectData && Object.keys(sourceData).length === 0;

  // Se não houver dados, retorna mensagem
  if ((!isArrayData && !isObjectData) || isEmptyArray || isEmptyObject) {
    return (
      <View style={styles.section}>
        <ProfileCard title={title}>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </ProfileCard>
      </View>
    );
  }


  if(isArrayData) {
    const distribution=distribuicaoClassificacoes(sourceData);
    return <View style={styles.section}><ProfileCard title={title}>
      <Text style={{fontSize:14,lineHeight:20,color:'#655A70',marginBottom:12}}>{distribution.total===0?emptyMessage:distribution.total+' compra(s) confirmadas neste período'}</Text>
      {distribution.total>0&&distribution.groups.map(group=><View key={group.codigo} style={{marginBottom:14,gap:6}}>
        <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:6}}><Text style={{flexShrink:1,color:'#594367',fontSize:14}}>{group.nome}</Text><Text style={{color:'#594367',fontWeight:'600'}}>{group.quantidade} · {group.percentual.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</Text></View>
        <View accessibilityRole="progressbar" accessibilityLabel={group.nome} accessibilityValue={{min:0,max:100,now:group.percentual,text:group.quantidade+' compras'}} style={{height:8,borderRadius:4,backgroundColor:'#F0EAF4'}}><View style={{height:8,borderRadius:4,width:group.percentual+'%',backgroundColor:group.cor}}/></View>
      </View>)}
      <Text style={{fontSize:12,lineHeight:18,color:'#655A70'}}>Marcações salvas nas compras. Não são diagnósticos nem avaliações automáticas do RF018.</Text>
      {distribution.comprasSemValor>0&&<Text style={{fontSize:12,lineHeight:18,color:'#655A70'}}>Inclui compras sem valor informado; este gráfico conta compras, não gastos.</Text>}
      {distribution.coberturaLegada&&<Text style={{fontSize:12,lineHeight:18,color:'#655A70'}}>Resposta anterior da API: a contagem pode omitir compras sem valor.</Text>}
    </ProfileCard></View>;
  }

  // Normaliza tanto listas quanto objetos resumidos vindos da API
  const totalQuantity = isArrayData ? sourceData.reduce((sum, item) => sum + Number(item?.quantidade || 0), 0) : Object.values(sourceData).reduce((sum, value) => sum + Number(value || 0), 0);

  const relevantQuantity = isArrayData
    ? sourceData.find((item) => String(item?.[classificationKey] || '').toUpperCase() === String(classificationValue).toUpperCase())?.quantidade || 0
    : Number(sourceData?.[totalKey || 'acima_limite'] ?? 0) || 0;

  const impulsivePercentage = totalQuantity > 0 ? Math.round((relevantQuantity / totalQuantity) * 100) : 0;
  const progress = Math.max(0, Math.min(100, impulsivePercentage));
  const progressOffset = RING_CIRCUMFERENCE - (progress / 100) * RING_CIRCUMFERENCE;

  const statusLabel = isArrayData ? 'Classificações registradas' : relevantQuantity > 0 ? 'Compras acima do limite registrado' : 'Sem excesso registrado';

  const statusDescription = isArrayData ? 'O gráfico reúne classificações já registradas, não uma avaliação automática do RF018. Compras pendentes de classificação não comprovam ausência de sinais.' : 'Este gráfico conta compras com excesso registrado. Não mede proximidade do orçamento nem comprova a vigência histórica do limite atual.'

  const centerValue = centerValueMode === 'quantity' ? relevantQuantity : `${progress}%`;

  return (
    <View style={styles.section}>
      <ProfileCard title={title}>
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View style={styles.ringShell}>
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#EAE3F7" strokeWidth={RING_STROKE} fill="transparent" />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={COLORS.dadoDois}
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>

              <View style={styles.ringCenter}>
                <Text style={styles.chartPercent}>{centerValue}</Text>
                <Text style={styles.chartCenterLabel}>{centerLabel}</Text>
              </View>
            </View>
          </View>

          {expanded && (
            <View style={styles.infoBlock}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>{statusLabel}</Text>
              </View>

              <Text style={styles.infoTitle}>{infoTitle}</Text>
              <Text style={styles.infoDescription}>{statusDescription}</Text>

              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : 'Ver mais'}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        </View>
      </ProfileCard>
    </View>
  );
}
