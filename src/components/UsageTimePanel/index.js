import React, { useMemo } from 'react';
import { useUsageMonitoringPeriod } from '../../hooks/useUsageMonitoringPeriod';
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
  const state = usageCardState(period, data, metrics, compact);
  async function retry() {
    if (state.action === 'SYNC') {
      try {
        await synchronizeUsageMonitoring();
      } catch {/* O estado da sessão já informa a falha. */}
    }
    period.refresh();
  }
  return <UsageTimeCard compact={compact} scope={compact ? today : month} total={metrics.total} apps={metrics.apps} updated={usageUpdateLabel(data, compact)} state={state} onRetry={retry} onSettings={onSettings} onDetails={onDetails} />;
}
