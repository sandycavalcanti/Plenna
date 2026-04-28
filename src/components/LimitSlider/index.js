import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../constants';
import { styles } from './styles';

export default function LimitSlider({
  title,
  min = 0,
  max = 1000,
  step = 1,
  suffix = 'R$',
  valor = false,
  horas = false,
  compact = false,
  initialValue,
  value,
  onValueChange,
  formatValue,
  disabled = false,
  testID,
  textValue,
}) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max >= safeMin ? max : safeMin;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;

  const normalizeValue = (raw) => {
    if (!Number.isFinite(raw)) {
      return safeMin;
    }
    if (raw < safeMin) {
      return safeMin;
    }
    if (raw > safeMax) {
      return safeMax;
    }
    return raw;
  };

  const isControlled = Number.isFinite(value);
  const [internalValue, setInternalValue] = useState(normalizeValue(initialValue ?? safeMin));

  useEffect(() => {
    if (!isControlled) {
      setInternalValue((prev) => normalizeValue(prev));
    }
  }, [safeMin, safeMax]);

  useEffect(() => {
    if (initialValue) {
      if (textValue && typeof textValue === 'object') {
        textValue.current = normalizeValue(initialValue);
      }
    }
  }, []);

  const currentValue = useMemo(() => {
    if (isControlled) {
      return normalizeValue(value);
    }
    return internalValue;
  }, [isControlled, value, internalValue, safeMin, safeMax]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const displayValue = useMemo(() => {
    if (typeof formatValue === 'function') {
      return formatValue(currentValue);
    }

    if (horas) {
      const totalMinutes = Math.max(0, Math.round(currentValue));
      const totalHours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (totalHours === 0) {
        return `${minutes}min`;
      }

      if (minutes === 0) {
        return `${totalHours}h`;
      }

      return `${totalHours}h${String(minutes).padStart(2, '0')}`;
    }

    if (valor || suffix === 'R$') {
      return currencyFormatter.format(currentValue);
    }

    const rounded = Math.round(currentValue);
    if (!suffix) {
      return String(rounded);
    }

    return `${rounded}${suffix}`;
  }, [formatValue, currentValue, suffix, valor, horas, currencyFormatter]);

  function handleSliderChange(nextValue) {
    const parsed = normalizeValue(nextValue);
    if (textValue && typeof textValue === 'object') {
      textValue.current = parsed;
    }

    if (!isControlled) {
      setInternalValue(parsed);
    }

    if (typeof onValueChange === 'function') {
      onValueChange(parsed);
    }
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>

      <View style={styles.row}>
        <Slider
          style={[styles.slider, compact && styles.sliderCompact]}
          minimumValue={safeMin}
          maximumValue={safeMax}
          step={safeStep}
          value={currentValue}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={COLORS.limitSliderThumbEsquerda}
          maximumTrackTintColor={COLORS.limitSliderThumbDireita}
          thumbTintColor={COLORS.limitSliderThumb}
          disabled={disabled}
          testID={testID}
        />

        <View style={[styles.valuePill, compact && styles.valuePillCompact]}>
          <Text style={[styles.valueText, compact && styles.valueTextCompact]}>{displayValue}</Text>
        </View>
      </View>
    </View>
  );
}
