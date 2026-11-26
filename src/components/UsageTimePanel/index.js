import React, { useMemo } from 'react';
import { useUsageMonitoringPeriod } from '../../hooks/useUsageMonitoringPeriod';
import { useUsageMonitoringActivation } from '../../hooks/useUsageMonitoringActivation';
import { synchronizeUsageMonitoring } from '../../services/usageMonitoringService';
import UsageTimeCard from './UsageTimeCard';
import { usageTodayData, usageUpdateLabel, usageCardMetrics, usageCardState } from '../../utils/usageMonitoringView';
import { obterJanelaDiaLocal } from '../../utils/tempoUsoSync';
export default function UsageTimePanel({
  month,
  compact = false,
  onSettings,
  onDetails
}) {
  const today = obterJanelaDiaLocal().dataLocal;
  const period = useUsageMonitoringPeriod(compact ? today.slice(0, 7) : month);
  const data = useMemo(() => compact ? usageTodayData(period.data, today) : period.data, [compact, period.data, today]);
  const metrics = useMemo(() => usageCardMetrics(data, today), [data, today]);
  const state = usageCardState({ ...period, today }, data, metrics, compact);
  const activation = useUsageMonitoringActivation({ onSettings, onActivated: period.refresh });
  async function retry() {
    if (state.action === 'SYNC') {
      try {
        await synchronizeUsageMonitoring();
      } catch {/* O estado da sessão já informa a falha. */}
    }
    period.refresh();
  }
  const total = metrics.total === 0 && state.kind !== 'DATA' ? null : metrics.total;
  return <UsageTimeCard compact={compact} scope={compact ? today : month} total={total} apps={metrics.apps} updated={usageUpdateLabel(data, compact)} state={state} onRetry={retry} onSettings={onSettings} onDetails={onDetails}
    onResume={() => activation.confirm('Retomar monitoramento', 'Retomar')} resumeBusy={activation.busy} resumeMessage={activation.message} />;
}
