import { useEffect } from 'react';
import { AppState } from 'react-native';
import { sincronizarTempoUsoDoDia } from '../services/tempoUsoSyncService';

export function useTempoUsoSync() {
  useEffect(() => {
    const controller = new AbortController();
    let estadoAnterior = AppState.currentState;

    async function executar() {
      try {
        // O service verifica consentimento, sessão, permissão, cooldown e concorrência.
        // Nesta etapa prepara os dados; o transporte PUT permanece bloqueado.
        await sincronizarTempoUsoDoDia(undefined, { signal: controller.signal });
      } catch (error) {
        if (__DEV__ && !controller.signal.aborted) {
          console.error('Não foi possível preparar o tempo de uso.', {
            status: error?.response?.status,
          });
        }
      }
    }

    if (estadoAnterior === 'active') executar();
    const subscription = AppState.addEventListener('change', estado => {
      const retornou = estado === 'active' && estadoAnterior !== 'active';
      estadoAnterior = estado;
      if (retornou) executar();
    });
    return () => {
      controller.abort();
      subscription.remove();
    };
  }, []);
}
