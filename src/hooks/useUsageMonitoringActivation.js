import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { tokenStorage } from '../api/tokenStorage';
import { activateUsageMonitoring } from '../services/usageMonitoringService';
import { classifyUsageFailure } from '../utils/usageMonitoringStatus';

export function useUsageMonitoringActivation({ onSettings, onActivated } = {}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function confirm(label, button) {
    if (pending.current) return;
    pending.current = true;
    let session;
    try {
      session = await tokenStorage.captureSession();
      if (!session || session.signal.aborted || !active.current) return;
      tokenStorage.assertSession(session.id);
    } catch {
      return;
    } finally {
      pending.current = false;
    }
    Alert.alert(label, 'O PLENNA consultará o uso dos aplicativos de compra a partir desta autorização, somente enquanto estiver aberto. O Android não identifica quem utilizou o aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: button, onPress: async () => {
        if (!active.current || session.signal.aborted || pending.current) return;
        pending.current = true;
        setBusy(true);
        setMessage('');
        const handleStatus = status => {
          if (!active.current || session.signal.aborted) return;
          tokenStorage.assertSession(session.id);
          if (status === 'CONSENT_REQUIRED' || status === 'PERMISSION_REQUIRED') {
            if (onSettings) onSettings();
            else setMessage('Verifique o consentimento e a permissão do Android.');
          } else onActivated?.();
        };
        try {
          handleStatus(await activateUsageMonitoring(session));
        } catch (error) {
          if (active.current && !session.signal.aborted) {
            const { status } = classifyUsageFailure(error);
            if (status === 'CONSENT_REQUIRED' || status === 'PERMISSION_REQUIRED') handleStatus(status);
            else setMessage('Não foi possível concluir a ativação. Tente novamente.');
          }
        } finally {
          pending.current = false;
          if (active.current) setBusy(false);
        }
      } }
    ], { cancelable: true });
  }

  return { busy, message, confirm };
}
