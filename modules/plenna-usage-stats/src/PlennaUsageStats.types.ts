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
  getUsageObservations(windows: {
    start: number;
    end: number;
  }[], packages: string[], eligibleFrom: number, includeDetails: boolean): Promise<NativeUsageObservation[]>;
  cancelUsageCollection(): boolean;
  getInstallationAnchor(): Promise<string>;
  getUsageSnapshots(windows: {
    start: number;
    end: number;
  }[], packages: string[]): Promise<NativeUsageSnapshot[]>;
  getModuleStatus(): Promise<NativeModuleStatus>;
  hasUsageAccess(): Promise<boolean>;
  openUsageAccessSettings(): Promise<boolean>;
  getUsageEvents(startTime: number, endTime: number): Promise<UsageEvent[]>;
  getForegroundUsage(startTime: number, endTime: number): Promise<ForegroundUsage[]>;
};
export type NativeUsageSnapshot = {
  sourceStatus: 'AVAILABLE';
  qualityFlags: string[];
  applications: {
    packageId: string;
    durationSeconds: number;
  }[];
} | {
  sourceStatus: 'UNAVAILABLE';
  reason: 'USAGE_ACCESS_DENIED' | 'SOURCE_UNAVAILABLE' | 'DEVICE_LOCKED' | 'QUERY_FAILED';
};
export type NativeUsageObservation = {
  sourceStatus: 'AVAILABLE';
  collectorVersion: 4;
  quality: number;
  applications: {
    packageId: string;
    durationMs: number;
    quality: number;
    accesses: {
      origin: number;
      start: number;
      end: number | null;
      quality: number;
    }[];
  }[];
} | {
  sourceStatus: 'UNAVAILABLE';
  reason: string;
};
