import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileCard from '../../ProfileComponents/ProfileCard';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import { obterJanelaDiaLocal } from '../../../utils/tempoUsoSync';

function formatMinutes(totalMinutes) {
  const seconds = Math.max(0, Math.round(Number(totalMinutes) * 60));
  if (seconds < 60) return seconds + 's';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60), remaining = minutes % 60;
  const tail = seconds % 60;
  return [hours ? hours + 'h' : '', remaining ? remaining + 'm' : '', tail ? tail + 's' : ''].filter(Boolean).join(' ');
}

export default function TempoApp({ tempoUso = [], title = 'Tempo em aplicativos de compras', loading = false, error = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const { dataLocal: hoje } = obterJanelaDiaLocal();


const agregado = tempoUso
  .filter((item) => item?.tempo_uso_data_local?.slice(0, 10) === hoje)
  .reduce((acc, item) => {
    const nome = item?.tempo_uso_nome;

    if (!nome) return acc;

    const segundos = Number(item?.tempo_uso_duracao_segundos);

    const minutos =
      Number.isFinite(segundos) && segundos > 0
        ? segundos / 60
        : Number(item?.tempo_uso_minutos);

    if (!Number.isFinite(minutos) || minutos <= 0) {
      return acc;
    }

    acc[nome] = (acc[nome] || 0) + minutos;

    return acc;
  }, {});

const items = Object.entries(agregado)
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);
  const totalMinutes = items.reduce((acc, item) => acc + item.value, 0);
  const topItem = items[0];
  const displayedItems = expanded ? items : items.slice(0, 3);


  const colors = [COLORS.dadoDois, COLORS.dadoTres, COLORS.dadoUm, COLORS.customButtonFundo];

  const getItemColor = (index) => colors[index % colors.length];
  if (loading || error) return <View style={styles.section}><ProfileCard title={title}><Text style={styles.emptyMessage}>{loading ? 'Carregando registros de hoje...' : 'Não foi possível consultar o tempo de uso. Atualize a tela para tentar novamente.'}</Text></ProfileCard></View>;
  if (items.length === 0) {

    return (
      <View style={styles.section}>
        <ProfileCard title={title}>
          <Text style={styles.emptyMessage}>Sem registros disponíveis hoje. Isso não comprova ausência de uso.</Text>
        </ProfileCard>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ProfileCard title={title}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Maior tempo registrado</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {topItem?.label || 'Sem dados'}
            </Text>
          </View>

          <View style={styles.summaryBadge}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.dashboardBoxMaiorTempoBorda} />
            <Text style={styles.summaryBadgeText}>{formatMinutes(topItem?.value)}</Text>
          </View>
        </View>

        <Text style={{ color: '#655A70', fontSize: 13, lineHeight: 19, marginVertical: 10 }}>
          Hoje: {formatMinutes(totalMinutes)} registrados em {items.length} aplicativo(s) monitorado(s).
          {'\n'}Esses registros não comprovam compras nem incluem outros dispositivos.
        </Text>
        <View style={{ backgroundColor: '#FAF7FC', borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', color: '#4A4E7A' }}>Observe seu tempo</Text>
          <Text style={{ color: '#655A70', lineHeight: 19 }}>{topItem.label} teve a maior participação no tempo observado hoje.</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:showTip}} onPress={() => setShowTip(!showTip)} style={{minHeight:48,justifyContent:'center'}}><Text style={{color:'#893467',fontWeight:'600'}}>{showTip ? 'Recolher dica' : 'Uma dica para a próxima visita'}</Text></TouchableOpacity>
          {showTip && <Text style={{color:'#655A70',lineHeight:19}}>Sugestão opcional: escolha o que pretende procurar antes de abrir {topItem.label} novamente.</Text>}
        </View>
        <View style={styles.rankList}>
          {displayedItems.map((item, index) => {
            const color = getItemColor(index);
            const share = totalMinutes > 0 ? Math.round((item.value / totalMinutes) * 100) : 0;

            return (
              <View key={`${item.label}-${index}`} style={styles.rankItem}>
                <View style={[styles.rankPosition, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.rankPositionText, { color }]}>{index + 1}</Text>
                </View>

                <View style={styles.rankContent}>
                  <View style={styles.rankTopRow}>
                    <Text style={styles.rankLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.rankValue}>{formatMinutes(item.value)}</Text>
                  </View>

                  <View style={styles.rankTrack}>
                    <Animated.View
                      style={[
                        styles.rankFill,
                        {
                          width: `${(totalMinutes > 0 ? item.value / totalMinutes : 0) * 100}%`,
                          backgroundColor: color,
                          transform: [
                            {
                              scaleX: 1,
                            },
                          ],
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.rankShare}>{share}% do total</Text>
                </View>
              </View>
            );
          })}
        </View>

        {items.length > 3 && (
          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButtonText}>{expanded ? 'Recolher' : `Ver mais (${items.length - 3})`}</Text>
            <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.dadoDois} />
          </TouchableOpacity>
        )}
      </ProfileCard>
    </View>
  );
}
