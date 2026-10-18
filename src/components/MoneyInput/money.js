// O texto em reais permanece intacto durante a edição. Só convertemos ao confirmar.
import { MAX_VALOR_MONETARIO, MENSAGEM_VALOR_MONETARIO, validarValorMonetario } from '../../utils/orcamento';

export function parseMoneyDraft(text, { required = false, emptyValue = 0 } = {}) {
  const raw = String(text).trim();
  if (!raw) {
    return required
      ? { error: 'Informe um orçamento mensal maior que zero.' }
      : { value: emptyValue };
  }
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(raw)) {
    return { error: 'Informe um valor em reais, com no máximo duas casas decimais (ex.: 340,50).' };
  }
  const [reais, decimal = ''] = raw.split(/[,.]/);
  const cents = Number(reais) * 100 + Number(decimal.padEnd(2, '0'));
  if (cents > Math.round(MAX_VALOR_MONETARIO * 100)) {
    return { error: MENSAGEM_VALOR_MONETARIO };
  }
  if (!Number.isSafeInteger(cents) || (required && cents <= 0)) {
    return { error: required && cents === 0
      ? 'Informe um orçamento mensal maior que zero.'
      : 'Informe um valor monetário válido.' };
  }
  return { value: cents / 100 };
}

export function moneyToDraft(value) {
  if (value === '' || value === null || value === undefined) return '';
  try { validarValorMonetario(Number(value)); }
  catch { return String(value).replace('.', ','); }
  return Number(value).toFixed(2).replace('.', ',');
}

export function formatMoney(value) {
  if (value === '' || value === null || value === undefined) return '';
  try { validarValorMonetario(Number(value)); }
  catch { return `R$ ${String(value).replace('.', ',')}`; }
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}
