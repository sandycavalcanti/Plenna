const MAX_INTEGER_DIGITS = 8;
const MAX_CENTS = 9999999999n;

function onlySeparatorsAndDigits(value) {
  return String(value ?? '').trim().replace(/[^0-9.,]/g, '');
}

/**
 * Normaliza a entrada monetária do cofrinho sem usar ponto flutuante.
 * A saída é o texto canônico aceito pela API, sempre com duas casas.
 */
export function normalizarValorMeta(value) {
  const input = onlySeparatorsAndDigits(value);
  if (!input) return { value: null, error: 'Informe um valor.' };

  let integerPart = input;
  let fractionPart = '';
  const hasComma = input.includes(',');
  const hasDot = input.includes('.');

  if (hasComma && hasDot) {
    if (input.indexOf(',') < input.lastIndexOf(',')) return { value: null, error: 'Use apenas uma vírgula decimal.' };
    const commaIndex = input.lastIndexOf(',');
    integerPart = input.slice(0, commaIndex).replace(/\./g, '');
    fractionPart = input.slice(commaIndex + 1);
  } else if (hasComma) {
    if ((input.match(/,/g) || []).length > 1) return { value: null, error: 'Use apenas uma vírgula decimal.' };
    const commaIndex = input.indexOf(',');
    integerPart = input.slice(0, commaIndex);
    fractionPart = input.slice(commaIndex + 1);
  } else if (hasDot) {
    const dotParts = input.split('.');
    if (dotParts.length > 2) {
      if (dotParts.slice(1).some((part) => part.length !== 3)) return { value: null, error: 'Valor inválido.' };
      integerPart = dotParts.join('');
    } else if (dotParts[1].length === 3 && dotParts[0].length <= 3) {
      // No padrão brasileiro, 1.234 representa mil duzentos e trinta e quatro.
      integerPart = dotParts.join('');
    } else {
      integerPart = dotParts[0];
      fractionPart = dotParts[1];
    }
  }

  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  if (!/^\d+$/.test(integerPart) || fractionPart && !/^\d+$/.test(fractionPart)) return { value: null, error: 'Valor inválido.' };
  if (fractionPart.length > 2) return { value: null, error: 'Use no máximo duas casas decimais.' };
  if (integerPart.length > MAX_INTEGER_DIGITS) return { value: null, error: 'O valor excede o limite permitido.' };

  const centsText = `${integerPart}${fractionPart.padEnd(2, '0')}`;
  const cents = BigInt(centsText);
  if (cents <= 0n) return { value: null, error: 'O valor deve ser maior que zero.' };
  if (cents > MAX_CENTS) return { value: null, error: 'O valor excede o limite permitido.' };

  return {
    value: `${integerPart}.${fractionPart.padEnd(2, '0')}`,
    cents,
    error: null,
  };
}

/** Prepara payloads de criação/edição sem alterar a unidade real do valor. */
export function prepararPayloadMeta(data) {
  if (!data || typeof data !== 'object') throw new TypeError('dados da meta obrigatórios');
  if (!Object.hasOwn(data, 'valor')) return data;
  const normalized = normalizarValorMeta(data.valor);
  if (!normalized.value) throw new TypeError(normalized.error || 'valor de meta inválido');
  return { ...data, valor: normalized.value };
}

export function valorMetaParaCentavos(value) {
  const canonical = String(value ?? '').trim();
  if (!/^\d{1,8}\.\d{2}$/.test(canonical)) return null;
  return BigInt(canonical.replace('.', ''));
}

function canonicalRealMoney(value, allowZero = true) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim().replace(',', '.');
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(text)) return null;

  const [integerPart, fractionPart = ''] = text.split('.');
  const cents = BigInt(`${integerPart}${fractionPart.padEnd(2, '0')}`);
  if ((!allowZero && cents <= 0n) || cents > MAX_CENTS) return null;

  return `${integerPart}.${fractionPart.padEnd(2, '0')}`;
}

/** Formata valores do contrato de metas como reais, sem dividir por 100. */
export function formatarValorMeta(value) {
  const canonical = canonicalRealMoney(value);
  if (canonical === null) return null;
  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(canonical))}`;
}

/** Valor editável da meta; a vírgula é apenas apresentação, não mudança de unidade. */
export function formatarValorMetaParaEntrada(value) {
  const canonical = canonicalRealMoney(value);
  if (!canonical) return String(value ?? '');
  const [integerPart, fractionPart] = canonical.split('.');
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${groupedInteger},${fractionPart}`;
}

/** Finaliza a apresentação editável sem interferir na digitação intermediária. */
export function formatarValorMetaEmEdicao(value) {
  const normalized = normalizarValorMeta(value);
  return normalized.value ? formatarValorMetaParaEntrada(normalized.value) : String(value ?? '');
}

export function formatarPercentualMeta(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return 'Percentual indisponível';
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

