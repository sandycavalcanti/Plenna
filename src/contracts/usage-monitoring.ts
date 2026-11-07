/** Contrato compartilhado; cópias da API e do Mobile verificadas por testes. */
export const USAGE_MONITORING_VERSION = 2 as const;
export type UtcInstant = string;
export type LocalDate = string;
export type Interval = { start: UtcInstant; end: UtcInstant };
export type Installation = { id: string; createdAt: UtcInstant };
export type CloseReason = 'LOGOUT' | 'ACCOUNT_SWITCH' | 'CONSENT_REVOKED' | 'EXPIRED' | 'TIMEZONE_CHANGE';
export type Authorization = {
  id: string; accountId: number; installationId: string;
  grantedAt: UtcInstant; revokedAt: UtcInstant | null;
};
export type Association = {
  id: string; accountId: number; installationId: string; authorizationId: string;
  timezone: string; eligibleFrom: UtcInstant; validatedAt: UtcInstant;
  expiresAt: UtcInstant | null;
} & ({ state: 'ACTIVE'; endedAt: null; closeReason: null } |
  { state: 'CLOSED'; endedAt: UtcInstant; closeReason: CloseReason });
export type QualityFlag = 'OPEN_INTERVAL_ESTIMATED' | 'MISSING_CONTEXT' | 'REBOOT_GAP' | 'CLOCK_ANOMALY';
export type Coverage = {
  interval: Interval;
  /** Uma consulta bem-sucedida não garante que o Android reteve todos os eventos. */
  completeness: 'UNKNOWN' | 'PARTIAL';
  dayExtent: 'PARTIAL_DAY' | 'WHOLE_DAY';
};
export type Provenance = {
  source: 'ANDROID_USAGE_EVENTS'; collectorVersion: string; catalogVersion: number;
};
export type Snapshot = {
  associationId: string; localDate: LocalDate; timezone: string; revision: number;
  observedAt: UtcInstant; provenance: Provenance;
} & ({
  sourceStatus: 'AVAILABLE'; coverage: Coverage; qualityFlags: QualityFlag[];
  applications: { packageId: string; durationSeconds: number }[];
} | {
  sourceStatus: 'UNAVAILABLE'; attemptedInterval: Interval;
  reason: 'USAGE_ACCESS_DENIED' | 'SOURCE_UNAVAILABLE' | 'DEVICE_LOCKED' | 'QUERY_FAILED';
  applications: null;
});
export type AssociationRequest = {
  schemaVersion: 2; operationId: string; installationId: string;
  expectedAssociationId: string | null; timezone: string;
  action: 'ACTIVATE' | 'RESUME' | 'VALIDATE';
};
export type AssociationResponse = {
  schemaVersion: 2; operationId: string; serverTime: UtcInstant;
  association: Association; limits: { recoveryPreviousDays: number; maxSnapshotsPerBatch: number };
  revisions?: { localDate: LocalDate; revision: number }[];
};
export type AssociationCloseRequest = {
  schemaVersion: 2; operationId: string; associationId: string; reason: 'LOGOUT';
};
export type SnapshotRequest = { schemaVersion: 2; batchId: string; snapshots: Snapshot[] };
export type SnapshotStatus = 'APPLIED' | 'DUPLICATE' | 'STALE' | 'OBSERVATION_RECORDED' | 'APPLIED_WITH_SUPPRESSIONS';
export type SnapshotResponse = {
  schemaVersion: 2; batchId: string; receivedAt: UtcInstant;
  results: { associationId: string; localDate: LocalDate; revision: number; status: SnapshotStatus }[];
};
export type DeletionScope =
  { kind: 'APP_DAY'; packageId: string; localDate: LocalDate; timezone: string } |
  { kind: 'PERIOD'; interval: Interval; packageIds: string[] | null };
export type DeletionTarget = { kind: 'ACCOUNT' } | { kind: 'INSTALLATION'; installationId: string };
export type DeletionRequest = {
  schemaVersion: 2; operationId: string; target: DeletionTarget; scope: DeletionScope;
};
/** Registro validado no servidor: accountId nunca vem da solicitação de exclusão. */
export type Tombstone = {
  id: string; accountId: number; createdAt: UtcInstant;
  target: DeletionTarget; scope: DeletionScope;
  /** Limites UTC imutáveis definidos no servidor; opcionais nas fixtures antigas. */
  effectiveInterval?: Interval;
};
export type DeletionResponse = { schemaVersion: 2; operationId: string; tombstone: Tombstone };
export type ErrorResponse = {
  schemaVersion: 2; error: { code: string; correlationId: string; message: string };
};
export type SnapshotProjection = {
  associationId: string; localDate: LocalDate; timezone: string; revision: number;
  observedAt: UtcInstant; provenance: Provenance; qualityFlags: QualityFlag[];
  observedInterval: Interval | null; sourceStatus: Snapshot['sourceStatus']; coverage: 'UNKNOWN' | 'PARTIAL';
  applications: { packageId: string; durationSeconds: number | null; durationMs?: number | null;
    suppression: { reason: 'DELETED_INTERVAL'; tombstoneIds: string[] } | null }[];
};
export type DescriptiveSummary = {
  schemaVersion: 2; localMonth: string;
  totalRegisteredSeconds: number | null; totalRegisteredMs?: number | null; installationCount: number;
  semantics: 'SUM_OF_REGISTERED_APP_TIME_NOT_EXCLUSIVE_PERSON_TIME';
  coverage: 'UNKNOWN' | 'PARTIAL'; sources: ('LEGACY' | 'V2')[];
  availability: 'NO_DATA' | 'PARTIAL' | 'AMBIGUOUS';
  sourceTotals: { legacyRegisteredSeconds: number | null; v2RegisteredSeconds: number | null; legacyRegisteredMs?: number | null; v2RegisteredMs?: number | null };
  references: { associationId: string; localDate: LocalDate; revision: number }[];
  limitations: string[];
};
