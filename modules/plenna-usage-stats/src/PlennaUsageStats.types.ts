export type NativeModuleStatus = {
  available: true;
  platform: 'android';
  module: 'plenna-usage-stats';
};

export type ModuleStatus = NativeModuleStatus | {
  available: false;
  platform: string;
  module: 'plenna-usage-stats';
  reason: 'unsupported_platform' | 'native_module_unavailable' | 'native_module_incompatible' | 'native_diagnostic_failed';
};

export type UsageEvent = {
  packageName: string;
  timestamp: number;
  eventType: number;
};

export type ForegroundUsage = {
  packageName: string;
  durationSeconds: number;
};

export type PlennaUsageStatsNativeModule = {
  getModuleStatus(): Promise<NativeModuleStatus>;
  hasUsageAccess(): Promise<boolean>;
  openUsageAccessSettings(): Promise<boolean>;
  getUsageEvents(startTime: number, endTime: number): Promise<UsageEvent[]>;
  getForegroundUsage(startTime: number, endTime: number): Promise<ForegroundUsage[]>;
};
