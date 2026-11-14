import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { styles } from './styles';

const parseMonth = value => ({
  year: Number(value.slice(0, 4)),
  month: Number(value.slice(5))
});

const compareMonths = (a, b) => a.localeCompare(b);

const monthName = number => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  timeZone: 'UTC'
}).format(new Date(Date.UTC(2020, number - 1, 15)));

export default function SeletorMes({
  visible,
  value,
  maxMonth,
  minMonth,
  onChange,
  onClose,
  inline = false
}) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (!visible) return;
    const boundedValue = minMonth && compareMonths(value, minMonth) < 0
      ? minMonth
      : compareMonths(value, maxMonth) > 0
        ? maxMonth
        : value;
    setDraftValue(boundedValue);
  }, [minMonth, maxMonth, value, visible]);

  const { year: selectedYear, month: selectedMonthNumber } = parseMonth(draftValue);
  const { year: maxYear } = parseMonth(maxMonth);
  const minYear = minMonth ? parseMonth(minMonth).year : null;
  const hasPreviousYear = minYear == null ? selectedYear > 1 : selectedYear > minYear;
  const hasNextYear = selectedYear < maxYear;
  const months = Array.from({ length: 12 }, (_, index) => index + 1);

  const boundedMonthForYear = (year, desiredMonth) => {
    let candidate = `${year}-${String(desiredMonth).padStart(2, '0')}`;
    if (compareMonths(candidate, maxMonth) > 0) candidate = maxMonth;
    if (minMonth && compareMonths(candidate, minMonth) < 0) candidate = minMonth;
    return candidate;
  };

  const chooseMonth = monthNumber => {
    const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
    const isBeforeAccount = minMonth && compareMonths(candidate, minMonth) < 0;
    if (compareMonths(candidate, maxMonth) > 0 || isBeforeAccount) return;

    setDraftValue(candidate);
    if (candidate !== value) onChange(candidate);
    onClose?.();
  };

  const changeYear = amount => {
    if (amount < 0 && !hasPreviousYear) return;
    if (amount > 0 && !hasNextYear) return;
    setDraftValue(boundedMonthForYear(selectedYear + amount, selectedMonthNumber));
  };

  const content = (
    <>
      <View style={styles.sheetHandle} />

      <View style={styles.modalHeader}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar seletor de período">
          <MaterialCommunityIcons name="close" size={21} color={COLORS.dadoUm} />
        </TouchableOpacity>
      </View>

      <View style={styles.yearSection}>
        <Text style={styles.sectionLabel}>Ano</Text>
        <View style={styles.yearControl}>
          <TouchableOpacity
            style={[styles.yearControlButton, !hasPreviousYear && styles.yearControlButtonDisabled]}
            onPress={() => changeYear(-1)}
            disabled={!hasPreviousYear}
            accessibilityRole="button"
            accessibilityLabel="Ano anterior"
            accessibilityState={{ disabled: !hasPreviousYear }}>
            <MaterialCommunityIcons name="chevron-left" size={25} color={COLORS.dadoUm} />
          </TouchableOpacity>
          <Text style={styles.yearControlValue} accessibilityLiveRegion="polite">{selectedYear}</Text>
          <TouchableOpacity
            style={[styles.yearControlButton, !hasNextYear && styles.yearControlButtonDisabled]}
            onPress={() => changeYear(1)}
            disabled={!hasNextYear}
            accessibilityRole="button"
            accessibilityLabel="Próximo ano"
            accessibilityState={{ disabled: !hasNextYear }}>
            <MaterialCommunityIcons name="chevron-right" size={25} color={COLORS.dadoUm} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.monthSectionHeader}>
        <Text style={styles.sectionTitle}>Mês</Text>
      </View>

      <View style={styles.monthGrid}>
        {months.map(monthNumber => {
          const candidate = `${selectedYear}-${String(monthNumber).padStart(2, '0')}`;
          const disabled = compareMonths(candidate, maxMonth) > 0
            || (minMonth && compareMonths(candidate, minMonth) < 0);
          const selected = selectedMonthNumber === monthNumber;

          return (
            <TouchableOpacity
              key={candidate}
              style={[
                styles.monthChip,
                selected && styles.monthChipActive,
                disabled && styles.monthChipDisabled
              ]}
              onPress={() => chooseMonth(monthNumber)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={`${monthName(monthNumber)} de ${selectedYear}`}
              accessibilityState={{ selected, disabled }}>
              <Text style={[
                styles.monthChipText,
                selected && styles.monthChipTextActive,
                disabled && styles.monthChipTextDisabled
              ]}>
                {monthName(monthNumber)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  if (inline) return <View style={styles.inline}>{content}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable onPress={event => event.stopPropagation()}>
          <SafeAreaView edges={['bottom']} style={styles.monthModal}>
            {content}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
