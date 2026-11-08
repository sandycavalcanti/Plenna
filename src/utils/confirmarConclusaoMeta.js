import { Alert } from 'react-native';
import { formatarValorMeta } from './metaMoney';

function concluida(meta) {
  return meta?.meta_completado === true || meta?.concluida === true;
}

function valor(meta, ...keys) {
  return keys.map((key) => meta?.[key]).find((value) => value !== undefined && value !== null);
}

export function confirmarConclusaoMeta(meta, onConfirm) {
  if (!meta || typeof onConfirm !== 'function') return;

  if (concluida(meta)) {
    Alert.alert(
      'Reabrir esta meta?',
      'O saldo reservado e as movimentações desta meta serão preservados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reabrir meta', onPress: onConfirm },
      ],
    );
    return;
  }

  const reservado = formatarValorMeta(valor(meta, 'meta_valor_reservado', 'valorReservado')) || 'valor indisponível';
  const objetivo = formatarValorMeta(valor(meta, 'meta_valor', 'valor')) || 'valor indisponível';
  const progresso = Number(valor(meta, 'progresso_percentual', 'progressoPercentual'));
  const detalhe = Number.isFinite(progresso) && progresso < 100
    ? 'É possível concluir seu objetivo mesmo sem atingir o valor previsto. Nenhum depósito adicional será registrado.'
    : 'A conclusão não registra depósitos ou retiradas e não altera o saldo reservado.';

  Alert.alert(
    'Concluir esta meta?',
    `Você guardou ${reservado} dos ${objetivo} planejados.\n\n${detalhe}`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Concluir meta', onPress: onConfirm },
    ],
  );
}

