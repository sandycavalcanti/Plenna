import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usageMonitoringEnabled } from '../api/usageMonitoringPolicy';
import { synchronizeUsageMonitoring, cancelUsageMonitoring } from '../services/usageMonitoringService';
export function useTempoUsoSync() {
  useEffect(() => {
    if (!usageMonitoringEnabled) return undefined;
    const run = () => {
      if (AppState.currentState === 'active') synchronizeUsageMonitoring().catch(() => {});
    };
    run();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') run();else cancelUsageMonitoring();
    });
    return () => {
      cancelUsageMonitoring();
      subscription.remove();
    };
  }, []);
}
