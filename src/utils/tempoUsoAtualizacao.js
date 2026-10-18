const observadores = new Set();

/**
 * Registra um observador para atualizações reais dos dados de tempo de uso.
 * O retorno é idempotente para permitir cleanup seguro em desmontagens e
 * mudanças de foco do React Navigation.
 */
export function observarAtualizacaoTempoUso(observador) {
  if (typeof observador !== 'function') return () => {};

  observadores.add(observador);
  let ativo = true;

  return () => {
    if (!ativo) return;
    ativo = false;
    observadores.delete(observador);
  };
}

/**
 * Notifica as telas após uma sincronização que confirmou persistência.
 * Um observador com erro não impede os demais de receberem a atualização.
 */
export function emitirAtualizacaoTempoUso() {
  [...observadores].forEach((observador) => {
    try {
      observador();
    } catch {
      // Observadores pertencem à camada de UI; falhas isoladas não podem
      // interromper o fluxo de sincronização do tempo de uso.
    }
  });
}
