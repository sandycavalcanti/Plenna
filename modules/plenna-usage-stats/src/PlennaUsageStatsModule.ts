import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { ModuleStatus, PlennaUsageStatsNativeModule, UsageEvent, ForegroundUsage } from './PlennaUsageStats.types';

type UnavailableReason = Extract<ModuleStatus, { available: false }>['reason'];

function resolverModulo(): { native: Partial<PlennaUsageStatsNativeModule> | null; reason?: UnavailableReason } {
  if (Platform.OS !== 'android') {
    return { native: null, reason: 'unsupported_platform' };
  }
  try {
    const native = requireOptionalNativeModule<Partial<PlennaUsageStatsNativeModule>>('PlennaUsageStats');
    return native ? { native } : { native: null, reason: 'native_module_unavailable' };
  } catch {
    return { native: null, reason: 'native_diagnostic_failed' };
  }
}

export async function getModuleStatus(): Promise<ModuleStatus> {
  const { native, reason } = resolverModulo();
  const indisponivel = (motivo: UnavailableReason): ModuleStatus => ({
    available: false, platform: Platform.OS, module: 'plenna-usage-stats', reason: motivo,
  });
  if (!native) return indisponivel(reason!);
  const metodos: (keyof PlennaUsageStatsNativeModule)[] = [
    'getModuleStatus', 'hasUsageAccess', 'openUsageAccessSettings', 'getUsageEvents', 'getForegroundUsage',
  ];
  if (metodos.some(nome => typeof native[nome] !== 'function')) {
    return indisponivel('native_module_incompatible');
  }
  try {
    const status = await native.getModuleStatus!();
    if (status?.available === true && status.platform === 'android' && status.module === 'plenna-usage-stats') {
      return status;
    }
  } catch {
    // Diagnóstico não deve impedir a inicialização ou exibição da interface.
  }
  return indisponivel('native_diagnostic_failed');
}

export async function hasUsageAccess(): Promise<boolean> {
  const { native } = resolverModulo();
  return typeof native?.hasUsageAccess === 'function' ? await native.hasUsageAccess() : false;
}

export async function openUsageAccessSettings(): Promise<boolean> {
  const { native } = resolverModulo();
  return typeof native?.openUsageAccessSettings === 'function' ? await native.openUsageAccessSettings() : false;
}

export async function getUsageEvents(
  startTime: number,
  endTime: number
): Promise<UsageEvent[]> {
  const { native } = resolverModulo();
  return typeof native?.getUsageEvents === 'function' ? await native.getUsageEvents(startTime, endTime) : [];
}

export async function getForegroundUsage(
  startTime: number,
  endTime: number
): Promise<ForegroundUsage[]> {
  const { native } = resolverModulo();
  return typeof native?.getForegroundUsage === 'function' ? await native.getForegroundUsage(startTime, endTime) : [];
}
