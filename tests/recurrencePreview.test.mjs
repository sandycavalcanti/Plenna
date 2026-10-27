import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs
  .readFileSync(new URL('../src/utils/recurrencePreview.js', import.meta.url), 'utf8')
  .replace('export const ', 'const ')
  .replaceAll('export function ', 'function ');

const getRecurrencePreview = new Function(`${source}\nreturn getRecurrencePreview;`)();

const dates = (values) => values.map((value) => value.toISOString().slice(0, 10));

test('preserva o dia âncora nas recorrências mensais', () => {
  const preview = getRecurrencePreview(new Date(2026, 0, 31, 12), 'MENSAL', 4);

  assert.deepEqual(dates(preview), [
    '2026-01-31',
    '2026-02-28',
    '2026-03-31',
    '2026-04-30',
  ]);
});

test('aplica o último dia disponível para dia 30', () => {
  const preview = getRecurrencePreview(new Date(2026, 0, 30, 12), 'MENSAL', 3);

  assert.deepEqual(dates(preview), ['2026-01-30', '2026-02-28', '2026-03-30']);
});

test('aplica o último dia disponível para dia 29 e restaura a âncora', () => {
  const preview = getRecurrencePreview(new Date(2026, 0, 29, 12), 'MENSAL', 3);

  assert.deepEqual(dates(preview), ['2026-01-29', '2026-02-28', '2026-03-29']);
});

test('calcula frequências diária, semanal e anual', () => {
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 9, 18, 12), 'DIARIA', 3)),
    ['2026-10-18', '2026-10-19', '2026-10-20'],
  );
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 9, 18, 12), 'SEMANAL', 3)),
    ['2026-10-18', '2026-10-25', '2026-11-01'],
  );
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 9, 18, 12), 'ANUAL', 2)),
    ['2026-10-18', '2027-10-18'],
  );
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 9, 18, 12), 'MENSAL', 2)),
    ['2026-10-18', '2026-11-18'],
  );
});

test('limita a prévia à data final de forma inclusiva', () => {
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 0, 1, 12), 'DIARIA', 5, new Date(2026, 0, 3, 12))),
    ['2026-01-01', '2026-01-02', '2026-01-03'],
  );
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 0, 1, 12), 'SEMANAL', 5, new Date(2026, 0, 15, 12))),
    ['2026-01-01', '2026-01-08', '2026-01-15'],
  );
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 0, 31, 12), 'MENSAL', 5, new Date(2026, 1, 28, 12))),
    ['2026-01-31', '2026-02-28'],
  );
  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2026, 0, 1, 12), 'ANUAL', 5, new Date(2027, 0, 1, 12))),
    ['2026-01-01', '2027-01-01'],
  );
});

test('uma data final igual à primeira mantém apenas uma ocorrência', () => {
  const firstDate = new Date(2026, 5, 10, 12);

  assert.deepEqual(
    dates(getRecurrencePreview(firstDate, 'MENSAL', 5, firstDate)),
    ['2026-06-10'],
  );
});

test('remover a data final restaura a prévia sem limite', () => {
  const preview = getRecurrencePreview(new Date(2026, 0, 31, 12), 'MENSAL', 5, null);

  assert.deepEqual(dates(preview), [
    '2026-01-31',
    '2026-02-28',
    '2026-03-31',
    '2026-04-30',
    '2026-05-31',
  ]);
});

test('rejeita datas finais inválidas ou anteriores à primeira ocorrência', () => {
  const firstDate = new Date(2026, 0, 10, 12);

  assert.deepEqual(getRecurrencePreview(firstDate, 'DIARIA', 5, new Date('data inválida')), []);
  assert.deepEqual(
    getRecurrencePreview(firstDate, 'DIARIA', 5, new Date(2026, 0, 9, 12)),
    [],
  );
  assert.deepEqual(getRecurrencePreview(new Date('data inválida'), 'DIARIA', 5), []);
});

test('preserva a âncora de 29 de fevereiro nos ciclos anuais', () => {
  const preview = getRecurrencePreview(new Date(2028, 1, 29, 12), 'ANUAL', 5);

  assert.deepEqual(dates(preview), [
    '2028-02-29',
    '2029-02-28',
    '2030-02-28',
    '2031-02-28',
    '2032-02-29',
  ]);

  assert.deepEqual(
    dates(getRecurrencePreview(new Date(2028, 1, 29, 12), 'ANUAL', 5, new Date(2029, 1, 28, 12))),
    ['2028-02-29', '2029-02-28'],
  );
});
