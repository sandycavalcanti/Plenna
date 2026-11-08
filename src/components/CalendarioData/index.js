import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './styles';
import { COLORS } from '../../constants/colors';

// Calendário civil extraído do cadastro de compra, sem conversão de fuso.
export default function CalendarioData({
  value,
  onChange,
  min,
  max
}) {
  const [month, setMonth] = useState(() => {
    let initial = value || max || new Date();
    if (min && initial < min) initial = min;
    if (max && initial > max) initial = max;
    return new Date(initial.getFullYear(), initial.getMonth(), 1, 12);
  });
  const year = month.getFullYear(),
    index = month.getMonth();
  const days = [...Array(new Date(year, index, 1, 12).getDay()).fill(null), ...Array.from({
    length: new Date(year, index + 1, 0, 12).getDate()
  }, (_, i) => new Date(year, index, i + 1, 12))];
  const key = date => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
  const canMove = offset => {
    const next = new Date(year, index + offset, offset < 0 ? new Date(year, index, 0).getDate() : 1, 12);
    return next.getFullYear() >= 1000 && next.getFullYear() <= 9999 && (!max || key(next) <= key(max)) && (!min || key(next) >= key(min));
  };
  return <View>
    <View style={styles.monthNavigation}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mês anterior" disabled={!canMove(-1)} style={[styles.monthNavigationButton, {
        minWidth: 48,
        minHeight: 48,
        opacity: canMove(-1) ? 1 : 0.35
      }]} onPress={() => setMonth(new Date(year, index - 1, 1, 12))}><MaterialCommunityIcons name="chevron-left" size={21} color={COLORS.dadoUm} /></TouchableOpacity>
      <Text style={[styles.monthTitle, {
        flex: 1,
        textAlign: 'center'
      }]}>{month.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        })}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Próximo mês" disabled={!canMove(1)} style={[styles.monthNavigationButton, {
        minWidth: 48,
        minHeight: 48,
        opacity: canMove(1) ? 1 : 0.35
      }]} onPress={() => setMonth(new Date(year, index + 1, 1, 12))}><MaterialCommunityIcons name="chevron-right" size={21} color={COLORS.dadoUm} /></TouchableOpacity>
    </View>
    <View style={styles.weekdayRow}>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => <Text key={i} style={styles.weekdayText}>{day}</Text>)}</View>
    <View style={styles.calendarGrid}>{days.map((date, i) => {
        const disabled = date && (min && key(date) < key(min) || max && key(date) > key(max));
        const selected = date && key(date) === key(value);
        return <View key={key(date) || `empty-${i}`} style={styles.calendarDayCell}>{date && <TouchableOpacity accessibilityRole="button" accessibilityLabel={date.toLocaleDateString('pt-BR')} accessibilityState={{
            disabled: !!disabled,
            selected: !!selected
          }} disabled={!!disabled} onPress={() => onChange(date)} style={[styles.calendarDayButton, {
            minHeight: 48
          }, disabled && styles.calendarDayButtonDisabled, selected && styles.calendarDayButtonSelected]}><Text style={[styles.calendarDayText, disabled && styles.calendarDayTextDisabled, selected && styles.calendarDayTextSelected]}>{date.getDate()}</Text></TouchableOpacity>}</View>;
      })}</View>
  </View>;
}
