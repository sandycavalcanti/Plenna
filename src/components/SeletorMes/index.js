import React, { useState, useEffect } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';
import { apresentarMesHome as monthLabel } from '../../utils/periodoHome';
const parseMonth = value => ({
  year: Number(value.slice(0, 4)),
  month: Number(value.slice(5))
});
const compareMonths = (a, b) => a.localeCompare(b);
const monthName = n => new Date(Date.UTC(2020, n - 1, 15)).toLocaleDateString('pt-BR', {
  month: 'long',
  timeZone: 'UTC'
});
export default function MonthPickerModal({
  visible,
  value,
  maxMonth,
  minMonth,
  title,
  onChange,
  onClose,
  inline = false
}) {
  const [draftValue, setDraftValue] = useState(value);
  useEffect(() => {
    if (!visible) return;
    const boundedValue = minMonth && compareMonths(value, minMonth) < 0 ? minMonth : compareMonths(value, maxMonth) > 0 ? maxMonth : value;
    setDraftValue(boundedValue);
  }, [minMonth, maxMonth, value, visible]);
  const {
    year: selectedYear,
    month: selectedMonthNumber
  } = parseMonth(draftValue);
  const {
    year: maxYear
  } = parseMonth(maxMonth);
  const firstYear = minMonth ? parseMonth(minMonth).year : Math.max(maxYear - 7, 2000);
  const years = Array.from({
    length: maxYear - firstYear + 1
  }, (_, index) => firstYear + index);
  const months = Array.from({
    length: 12
  }, (_, index) => index + 1);
  const boundedMonthForYear = (year, desiredMonth) => {
    let candidate = `${year}-${String(desiredMonth).padStart(2, '0')}`;
    if (compareMonths(candidate, maxMonth) > 0) candidate = maxMonth;
    if (minMonth && compareMonths(candidate, minMonth) < 0) candidate = minMonth;
    return candidate;
  };
  const chooseMonth = monthNumber => {
    const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
    const isBeforeAccount = minMonth && compareMonths(candidate, minMonth) < 0;
    if (compareMonths(candidate, maxMonth) <= 0 && !isBeforeAccount) setDraftValue(candidate);
  };
  const changeYear = amount => {
    const currentIndex = years.indexOf(selectedYear);
    const nextIndex = Math.min(Math.max(currentIndex + amount, 0), years.length - 1);
    if (nextIndex !== currentIndex) {
      setDraftValue(boundedMonthForYear(years[nextIndex], selectedMonthNumber));
    }
  };
  const applySelection = () => {
    onChange(draftValue);
    onClose();
  };
  const content = <>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>Período</Text>
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} accessibilityLabel="Fechar seletor de período">
              <MaterialCommunityIcons name="close" size={21} color={COLORS.dadoUm} />
            </TouchableOpacity>
          </View>

          {years.length > 1 ? <>
              <Text style={styles.pickerLabel}>Ano</Text>
              <View style={styles.yearControl}>
                <TouchableOpacity style={[styles.yearControlButton, years.indexOf(selectedYear) === 0 && styles.yearControlButtonDisabled]} onPress={() => changeYear(-1)} disabled={years.indexOf(selectedYear) === 0} accessibilityLabel="Ano anterior">
                  <MaterialCommunityIcons name="chevron-left" size={20} color={COLORS.dadoUm} />
                </TouchableOpacity>
                <Text style={styles.yearControlValue}>{selectedYear}</Text>
                <TouchableOpacity style={[styles.yearControlButton, years.indexOf(selectedYear) === years.length - 1 && styles.yearControlButtonDisabled]} onPress={() => changeYear(1)} disabled={years.indexOf(selectedYear) === years.length - 1} accessibilityLabel="Próximo ano">
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.dadoUm} />
                </TouchableOpacity>
              </View>
            </> : <View style={styles.singleYearRow}>
              <Text style={styles.pickerLabel}>Ano</Text>
              <Text style={styles.singleYearValue}>{selectedYear}</Text>
            </View>}

          <Text style={styles.pickerLabel}>Mês</Text>
          <View style={styles.monthGrid}>
            {months.map(monthNumber => {
        const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
        const disabled = compareMonths(candidate, maxMonth) > 0 || minMonth && compareMonths(candidate, minMonth) < 0;
        const selected = selectedMonthNumber === monthNumber;
        return <TouchableOpacity key={candidate} style={[styles.monthChip, selected && styles.monthChipActive, disabled && styles.monthChipDisabled]} onPress={() => chooseMonth(monthNumber)} disabled={disabled} accessibilityRole="radio" accessibilityState={{
          selected,
          disabled
        }}>
                  <Text style={[styles.monthChipText, selected && styles.monthChipTextActive, disabled && styles.monthChipTextDisabled]}>{monthName(monthNumber)}</Text>
                </TouchableOpacity>;
      })}
          </View>

          <View style={styles.selectedMonthBlock}>
            <Text style={styles.selectedMonthText}>{monthLabel(draftValue)}</Text>
            <Text style={styles.selectedMonthHint}>Selecione um mês no histórico disponível.</Text>
          </View>

          <TouchableOpacity style={styles.modalDoneButton} onPress={applySelection} activeOpacity={0.85}>
            <Text style={styles.modalDoneText}>Concluir</Text>
          </TouchableOpacity>
  </>;
  if (inline) return <View style={{
    padding: 12,
    backgroundColor: COLORS.fundoPrincipal,
    borderRadius: 16
  }}>{content}</View>;
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.modalBackdrop} onPress={onClose}>
      <Pressable onPress={event => event.stopPropagation()}><SafeAreaView edges={['bottom']} style={styles.monthModal}>
        <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView>
      </SafeAreaView></Pressable>
    </Pressable>
  </Modal>;
}
