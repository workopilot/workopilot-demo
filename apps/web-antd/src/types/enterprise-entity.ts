export interface SourceObject {
  id: string;
  system: string;
  name: string;
  description: string;
  purpose: string;
  fields: string[];
  status: string;
}
export interface EntityAttribute {
  id: string;
  name: string;
  type: string;
  group: string;
  standard: boolean;
  dynamic: boolean;
  confirmed: boolean;
  nullable: boolean;
  alias: string;
  source: string;
  field: string;
  strategy: string;
  history: string;
  historyRequired: boolean;
  historyObject: string;
  verified: boolean;
}
export interface EntityRecord {
  id: string;
  code: string;
  name: string;
  sources: string[];
  status: string;
}
export interface EntityRelation {
  id: string;
  name: string;
  target: string;
  cardinality: string;
  enabled: boolean;
  source?: string;
  object?: string;
  sourceField?: string;
  targetField?: string;
  verified?: boolean;
}
export interface AgentCase {
  id: string;
  name: string;
  question: string;
  history: boolean;
  relation?: string;
  status: string;
  answer: string;
  evidence: string;
}
export interface EntityDraft {
  id: string;
  name: string;
  code: string;
  description: string;
  uniqueKey: string;
  revision: number;
  version: string;
  activeVersion: string;
  published?: {
    attributes: EntityAttribute[];
    objects: SourceObject[];
    protocol: string;
    records: EntityRecord[];
    relations?: EntityRelation[];
    role: string;
    scope: string;
  };
  serviceEnabled: boolean;
  modelConfirmed: boolean;
  identityVerified: boolean;
  sources: string[];
  objects: SourceObject[];
  attributes: EntityAttribute[];
  relations: EntityRelation[];
  records: EntityRecord[];
  cases: AgentCase[];
  releases: {
    revision: number;
    services: string[];
    time: string;
    version: string;
  }[];
  updatedAt: string;
  role: string;
  scope: string;
  protocol: string;
}

/** 经脱敏的设备来源样例；动态配置仍属于设备属性。 */
export interface DeviceSourceRecord {
  system: string;
  object: string;
  primaryKey: string;
  deviceCode: string;
  updatedAt: string;
  values: Record<string, boolean | null | number | string>;
}
export interface DeviceChangeEvent {
  id: string;
  deviceCode: string;
  effectiveAt: string;
  reason: string;
  source: string;
  object: string;
  document: string;
  changes: {
    attribute: string;
    name: string;
    newValue: number | string;
    oldValue: number | string;
  }[];
}

export interface EntitySourceRecord {
  entityCode: string;
  recordCode: string;
  system: string;
  object: string;
  primaryKey: string;
  updatedAt: string;
  values: Record<string, boolean | null | number | string>;
}
export interface EntityRelationLink {
  relationId: string;
  sourceRecordCode: string;
  targetEntityCode: string;
  targetRecordCode: string;
  source: string;
  object: string;
  sourceKey: string;
  updatedAt: string;
}
