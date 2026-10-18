import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../constants';
import { styles } from './styles';
import MoneyInput from '../MoneyInput';
import { validarValorMonetario } from '../../utils/orcamento';

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
  moneyEditing = false,
  registerMoneyEditor,
  beforeSliderChange,
}) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const visualMax = Number.isFinite(max) && max >= safeMin ? max : safeMin;
  const safeMax = moneyEditing && !horas && Number.isFinite(value) ? Math.max(visualMax, value) : visualMax;
  const financialMax = Number.isFinite(maxAllowedValue) ? Math.max(safeMin, maxAllowedValue) : null;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const limitSliderMax = Number.isFinite(maxAllowedValue) ? (maxAllowedValue >= 0 ? Math.min(maxAllowedValue, safeMax) : 0) : safeMax;

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
  const gesture = useRef(null);
  const latestSliderChange = useRef(null);
  const sliderRef = useRef(null);
  const latestValue = useRef(null);

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

      const boundedValue = Math.min(Math.max(numericValue, safeMin), Math.max(safeMin, limitSliderMax));

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
    [formatInputText, parseFormattedInput, textValue, isControlled, onValueChange, safeMin, limitSliderMax],
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

      if (moneyEditing) parsed = Math.round(parsed * 100) / 100;
      parsed = Math.max(safeMin, Math.min(parsed, Math.max(safeMin, limitSliderMax)));

      if (textValue && typeof textValue === 'object') {
        textValue.current = parsed;
      }

      if (!isControlled) {
        setInternalValue(parsed);
      }

      if (typeof onValueChange === 'function') {
        const error = onValueChange(parsed);
        if (typeof error === 'string') sliderRef.current?.setNativeProps?.({ value: latestValue.current });
      }
    },
    [safeMin, limitSliderMax, textValue, isControlled, onValueChange, moneyEditing],
  );
  useLayoutEffect(() => {
    latestSliderChange.current = disabled ? () => {} : handleSliderChange;
    latestValue.current = currentValue;
  });
  useLayoutEffect(() => {
    // O slider nativo não é controlado e sua implementação omite value=0.
    if (moneyEditing) sliderRef.current?.setNativeProps?.({ value: currentValue });
  }, [moneyEditing, currentValue, safeMax]);

  async function changeSlider(nextValue) {
    if (beforeSliderChange) {
      const ready = gesture.current || beforeSliderChange();
      if (!await ready) {
        sliderRef.current?.setNativeProps?.({ value: latestValue.current });
        return;
      }
    }
    latestSliderChange.current(nextValue);
  }

  function confirmMoney(nextValue) {
    try {
      validarValorMonetario(nextValue);
    } catch (error) {
      return error.message;
    }
    if (financialMax !== null && nextValue > financialMax) {
      return `O limite disponível para esta categoria é R$ ${financialMax.toFixed(2)}.`;
    }
    // Digitação confirma o valor financeiro, sem passar pelo limitador visual do gesto.
    const error = onValueChange?.(nextValue);
    if (typeof error === 'string') return error;
    if (textValue && typeof textValue === 'object') textValue.current = nextValue;
    if (!isControlled) setInternalValue(nextValue);
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>

      <View style={[styles.row, moneyEditing && !horas && styles.moneyRow]}>
        <Slider
          ref={sliderRef}
          style={[styles.slider, compact && styles.sliderCompact, moneyEditing && !horas && styles.moneySlider]}
          minimumValue={safeMin}
          maximumValue={safeMax}
          step={safeStep}
          value={currentValue}
          upperLimit={limitSliderMax}
          onSlidingStart={() => {
            gesture.current = beforeSliderChange ? beforeSliderChange() : null;
          }}
          onValueChange={changeSlider}
          onSlidingComplete={() => { gesture.current = null; }}
          minimumTrackTintColor={COLORS.limitSliderThumbEsquerda}
          maximumTrackTintColor={COLORS.limitSliderThumbDireita}
          thumbTintColor={COLORS.limitSliderThumb}
          disabled={disabled || (moneyEditing && safeMax === safeMin)}
          testID={testID}
        />

        <View style={[styles.valuePill, compact && styles.valuePillCompact, moneyEditing && !horas && styles.moneyPill]}>
          {moneyEditing && !horas ? (
            <MoneyInput
              value={currentValue}
              onConfirm={confirmMoney}
              registerEditor={registerMoneyEditor}
              onFinishEditing={beforeSliderChange}
              accessibilityLabel={title}
              editable={!disabled}
              inputStyle={[styles.valueText, compact && styles.valueTextCompact, styles.moneyInput]}
              focusStyle={styles.moneyFocused}
              errorStyle={styles.inputError}
            />
          ) : (
          <TextInput
            style={[styles.valueText, compact && styles.valueTextCompact]}
            value={isEditing ? inputText : displayValue}
            onChangeText={handleTextInputChange}
            onFocus={handleTextInputFocus}
            selectTextOnFocus
            onBlur={handleTextInputBlur}
            placeholder={displayValue}
            placeholderTextColor={COLORS.cadCaixaPreferenciasValorTexto}
            keyboardType="numeric"
            editable={!disabled}
            maxLength={10}
          />
          )}
        </View>
      </View>
    </View>
  );
}
