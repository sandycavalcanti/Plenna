import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../constants';
import { styles } from './styles';

export default function LimitSlider({
  title,
  min = 0,
  max = 1000,
  step = 1,
  maxAllowedValue,
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
  const effectiveMax = Number.isFinite(maxAllowedValue) ? Math.min(maxAllowedValue, safeMax) : safeMax;

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
  const [inputText, setInputText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

  // Formata o texto enquanto o usuário digita
  const formatInputText = useCallback(
    (rawInput) => {
      const digitsOnly = rawInput.replace(/\D/g, '');

      if (horas) {
        // Para horas: 6 → 0h06, 60 → 1h00, 600 → 10h00
        const padded = digitsOnly.padStart(3, '0');
        const minutes = parseInt(padded.slice(-2), 10);
        const hours = parseInt(padded.slice(0, -2), 10);
        return `${hours}h${String(minutes).padStart(2, '0')}`;
      }

      if (valor || suffix === 'R$') {
        // Para reais: 1 → 0,01, 10 → 0,10, 100 → 1,00, 1000 → 10,00
        const padded = digitsOnly.padStart(3, '0');
        const cents = padded.slice(-2);
        const reais = padded.slice(0, -2) || '0';
        return `R$${reais},${cents}`;
      }

      return digitsOnly;
    },
    [horas, valor, suffix],
  );

  // Converte o texto formatado em valor numérico
  const parseFormattedInput = useCallback(
    (formatted) => {
      if (horas) {
        // "1h30" → 90 minutos
        const match = formatted.match(/(\d+)h(\d{2})/);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          return hours * 60 + minutes;
        }
        return 0;
      }

      if (valor || suffix === 'R$') {
        // "R$10,50" → 10.50
        const digitsOnly = formatted.replace(/\D/g, '');
        if (digitsOnly.length === 0) return 0;
        return parseInt(digitsOnly, 10) / 100;
      }

      return parseInt(formatted.replace(/\D/g, ''), 10);
    },
    [horas, valor, suffix],
  );

  // Atualiza valor quando o usuário digita
  const handleTextInputChange = useCallback(
    (text) => {
      if (text.trim() === '') {
        setInputText('');
        return;
      }

      const formatted = formatInputText(text);
      setInputText(formatted);

      const numericValue = parseFormattedInput(formatted);

      const boundedValue = Math.min(Math.max(numericValue, safeMin), nextMax);

      if (textValue && typeof textValue === 'object') {
        textValue.current = boundedValue;
      }

      if (!isControlled) {
        setInternalValue(boundedValue);
      }

      if (typeof onValueChange === 'function') {
        onValueChange(boundedValue);
      }
    },
    [formatInputText, parseFormattedInput, textValue, isControlled, onValueChange, safeMin],
  );

  const handleTextInputFocus = useCallback(() => {
    setIsEditing(true);

    if (horas) {
      const minutes = Math.max(0, Math.round(currentValue));
      setInputText(formatInputText(String(minutes)));
      return;
    }

    if (valor || suffix === 'R$') {
      const cents = Math.max(0, Math.round(currentValue * 100));
      setInputText(formatInputText(String(cents)));
      return;
    }

    setInputText(formatInputText(String(Math.max(0, Math.round(currentValue)))));
  }, [formatInputText, currentValue, horas, valor, suffix]);

  // Limpa o estado de edição quando perde o foco
  const handleTextInputBlur = useCallback(() => {
    setIsEditing(false);
    setInputText('');
  }, []);

  const handleSliderChange = useCallback(
    (nextValue) => {
      let parsed = nextValue;

      if (!Number.isFinite(parsed)) {
        parsed = safeMin;
      }

      parsed = Math.max(safeMin, Math.min(parsed, safeMax));

      if (textValue && typeof textValue === 'object') {
        textValue.current = parsed;
      }

      if (!isControlled) {
        setInternalValue(parsed);
      }

      if (typeof onValueChange === 'function') {
        onValueChange(parsed);
      }
    },
    [safeMin, safeMax, textValue, isControlled, onValueChange],
  );
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
          upperLimit={effectiveMax}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={COLORS.limitSliderThumbEsquerda}
          maximumTrackTintColor={COLORS.limitSliderThumbDireita}
          thumbTintColor={COLORS.limitSliderThumb}
          disabled={disabled}
          testID={testID}
        />

        <View style={[styles.valuePill, compact && styles.valuePillCompact]}>
          <TextInput
            style={[styles.valueText, compact && styles.valueTextCompact]}
            value={isEditing ? inputText : displayValue}
            onChangeText={handleTextInputChange}
            onFocus={handleTextInputFocus}
            onBlur={handleTextInputBlur}
            placeholder={displayValue}
            placeholderTextColor={COLORS.cadCaixaPreferenciasValorTexto}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>
    </View>
  );
}
