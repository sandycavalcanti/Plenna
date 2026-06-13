export function formatarValorMoedaParaTela(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');

  if (!digitos) {
    return '';
  }

  const numero = Number(digitos) / 100;

  if (!Number.isFinite(numero)) {
    return '';
  }

  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)}`;
}

export function formatarValorRealParaTela(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return '';
  }

  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)}`;
}

export function normalizarValorMoedaParaEntrada(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function valorMoedaParaNumero(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');

  if (!digitos) {
    return NaN;
  }

  return Number(digitos) / 100;
}

export function formatarValorMonetarioParaTela(valor) {
  const numero = Number(
    String(valor ?? '')
      .replace(/[^0-9,.-]/g, '')
      .replace(',', '.'),
  );

  if (!Number.isFinite(numero)) {
    return '';
  }

  return `R$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)}`;
}

export function normalizarValorMonetarioParaEntrada(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function valorMonetarioParaNumero(valor) {
  const texto = String(valor ?? '').trim();

  if (!texto) {
    return NaN;
  }

  const normalizado = texto
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : NaN;
}
