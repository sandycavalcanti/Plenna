import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parser = require('@babel/parser');

const codigo = readFileSync(
  new URL('../src/components/LimitSlider/index.js', import.meta.url),
  'utf8'
);

test('LimitSlider possui JSX e JavaScript válidos', () => {
  assert.doesNotThrow(() => {
    parser.parse(codigo, {
      sourceType: 'module',
      plugins: ['jsx'],
    });
  });
});

test('digitação respeita o limite máximo permitido', () => {
  assert.match(
    codigo,
    /const boundedValue = Math\.min\(Math\.max\(numericValue, safeMin\), Math\.max\(safeMin, limitSliderMax\)\)/
  );
  assert.doesNotMatch(codigo, /\bnextMax\b/);
});

test('arrastar o slider respeita o limite máximo permitido', () => {
  assert.match(
    codigo,
    /parsed = Math\.max\(safeMin, Math\.min\(parsed, Math\.max\(safeMin, limitSliderMax\)\)\)/
  );
  assert.match(codigo, /upperLimit=\{limitSliderMax\}/);
});

test('campo digitável respeita a propriedade disabled', () => {
  assert.match(codigo, /editable=\{!disabled\}/);
  assert.match(codigo, /disabled=\{disabled \|\| \(moneyEditing && safeMax === safeMin\)\}/);
});

test('callbacks acompanham alterações do limite permitido', () => {
  assert.match(
    codigo,
    /\[formatInputText, parseFormattedInput, textValue, isControlled, onValueChange, safeMin, limitSliderMax\]/
  );
  assert.match(
    codigo,
    /\[safeMin, limitSliderMax, textValue, isControlled, onValueChange, moneyEditing\]/
  );
});
