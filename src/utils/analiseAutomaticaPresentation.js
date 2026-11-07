// Traduções dos motivos existentes. Não deduz causas que a API não distingue.
const motivos = {
  'V01:VALOR_AUSENTE': [10, 'O valor da compra não está disponível para comparação.'],
  'V01:AMOSTRA_MENOR_QUE_QUATRO': [10, 'Há menos de quatro valores anteriores para comparar.'],
  'V01:FAIXA_SEM_DISPERSAO': [10, 'Os valores anteriores não variam o suficiente para esta comparação.'],
  'V03:VIGENCIA_HISTORICA_NAO_COMPROVADA': [20, 'Não foi possível usar um limite comprovado da época da compra.'],
  'F05:COBERTURA_OU_JANELA_INSUFICIENTE': [30, 'Não foi possível comparar a frequência em períodos equivalentes com cobertura comprovada.'],
  'V01_CATEGORIA:VALOR_AUSENTE': [40, 'O valor da compra não está disponível para comparação.'],
  'V01_CATEGORIA:AMOSTRA_MENOR_QUE_QUATRO': [40, 'Há menos de quatro valores anteriores da mesma categoria para comparar.'],
  'V01_CATEGORIA:FAIXA_SEM_DISPERSAO': [40, 'Os valores da mesma categoria não variam o suficiente para esta comparação.'],
  'V01_CATEGORIA:CATEGORIA_INCOMPLETA_OU_MULTIPLA': [40, 'A comparação por categoria exige uma única categoria identificada em todos os itens.'],
  'F04:DIAS_HISTORICOS_OU_DISPERSAO_INSUFICIENTES': [50, 'Os dias registrados ainda não permitem comparar a concentração de compras.'],
};

export function apresentarIndisponibilidades(codigos = []) {
  const conhecidos = (Array.isArray(codigos) ? codigos : [])
    .map(codigo => typeof codigo === 'string' && Object.hasOwn(motivos, codigo) ? motivos[codigo] : null)
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);
  const descricoes = [...new Set(conhecidos.map(([, mensagem]) => mensagem))];
  return { principais: descricoes.slice(0, 3), adicionais: descricoes.slice(3) };
}
