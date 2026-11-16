import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './styles';
import { COLORS } from '../../constants/colors';

// Calendário civil extraído do cadastro de compra, sem conversão de fuso.
export default function CalendarioData({
  value,
  onChange,
  min,
  max,
  modal = false,
  visible = true,
  onClose,
  title = 'Selecionar data'
}) {
  const [month, setMonth] = useState(() => {
    let initial = value || max || new Date();
    if (min && initial < min) initial = min;
    if (max && initial > max) initial = max;
    return new Date(initial.getFullYear(), initial.getMonth(), 1, 12);
  });
  const year = month.getFullYear();
  const index = month.getMonth();
  const days = [
    ...Array(new Date(year, index, 1, 12).getDay()).fill(null),
    ...Array.from({
      length: new Date(year, index + 1, 0, 12).getDate()
    }, (_, i) => new Date(year, index, i + 1, 12))
  ];
  const key = date => date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
  const canMove = offset => {
    const next = new Date(year, index + offset, offset < 0 ? new Date(year, index, 0).getDate() : 1, 12);
    return next.getFullYear() >= 1000
      && next.getFullYear() <= 9999
      && (!max || key(next) <= key(max))
      && (!min || key(next) >= key(min));
  };
  const selectDate = date => {
    onChange(date);
    if (modal) onClose?.();
  };

  const calendar = (
    <>
      <View style={[styles.monthNavigation, modal && styles.modalMonthNavigation]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          disabled={!canMove(-1)}
          style={[
            styles.monthNavigationButton,
            modal && styles.modalMonthNavigationButton,
            { opacity: canMove(-1) ? 1 : 0.35 }
          ]}
          onPress={() => setMonth(new Date(year, index - 1, 1, 12))}>
          <MaterialCommunityIcons name="chevron-left" size={21} color={COLORS.dadoUm} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, modal && styles.modalMonthTitle]}>
          {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          disabled={!canMove(1)}
          style={[
            styles.monthNavigationButton,
            modal && styles.modalMonthNavigationButton,
            { opacity: canMove(1) ? 1 : 0.35 }
          ]}
          onPress={() => setMonth(new Date(year, index + 1, 1, 12))}>
          <MaterialCommunityIcons name="chevron-right" size={21} color={COLORS.dadoUm} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <Text key={i} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((date, i) => {
          const disabled = date && (
            (min && key(date) < key(min)) ||
            (max && key(date) > key(max))
          );
          const selected = date && key(date) === key(value);
          return (
            <View
              key={key(date) || `empty-${i}`}
              style={[styles.calendarDayCell, modal && styles.modalCalendarDayCell]}>
              {date ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={date.toLocaleDateString('pt-BR')}
                  accessibilityState={{ disabled: !!disabled, selected: !!selected }}
                  disabled={!!disabled}
                  onPress={() => selectDate(date)}
                  style={[
                    styles.calendarDayButton,
                    modal && styles.modalCalendarDayButton,
                    !modal && { minHeight: 48 },
                    disabled && styles.calendarDayButtonDisabled,
                    selected && (modal ? styles.modalCalendarDayButtonSelected : styles.calendarDayButtonSelected)
                  ]}>
                  <Text style={[
                    styles.calendarDayText,
                    disabled && styles.calendarDayTextDisabled,
                    selected && styles.calendarDayTextSelected
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );

  if (!modal) return calendar;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalSafeArea}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={event => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar calendário"
                style={styles.modalCloseButton}
                onPress={onClose}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.dadoUm} />
              </TouchableOpacity>
            </View>
            {calendar}
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
