import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

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
  textValue
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
    textValue.current = parsed;

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
          minimumTrackTintColor="#595D7C"
          maximumTrackTintColor="#E3E0F4"
          thumbTintColor="#595D7C"
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 5,
  },
  containerCompact: {
    marginVertical: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#595D7C',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  titleCompact: {
    fontSize: 15,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginRight: 12,
  },
  sliderCompact: {
    height: 28,
    marginRight: 8,
  },
  valuePill: {
    backgroundColor: '#E3E0F4',
    borderRadius: 999,
    minWidth: 124,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePillCompact: {
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  valueText: {
    color: '#595D7C',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  valueTextCompact: {
    fontSize: 16,
  },
});
