import type {
  EntityAttribute,
  EntityDraft,
  EntityRecord,
  EntityRelation,
} from '#/types/enterprise-entity';

import {
  createMockResponse,
  mockDelay,
  mockDeviceAgentCases,
  mockDeviceChanges,
  mockDeviceSourceRecords,
  mockEnterpriseEntities,
  mockEntityRelationLinks,
  mockEntitySourceRecords,
} from './mock-data';

export async function getEnterpriseEntitiesApi() {
  await mockDelay();
  return createMockResponse(structuredClone(mockEnterpriseEntities));
}
export async function saveEnterpriseEntityApi(entity: EntityDraft) {
  await mockDelay();
  const index = mockEnterpriseEntities.findIndex(
    (item) => item.id === entity.id,
  );
  const copy = structuredClone(entity);
  if (index === -1) mockEnterpriseEntities.push(copy);
  else mockEnterpriseEntities[index] = copy;
  return createMockResponse(copy);
}
export function createEntityDraft(
  name: string,
  code: string,
  uniqueKey: string,
  description = '',
): EntityDraft {
  const device = code === 'Device';
  return {
    id: `entity-${Date.now()}`,
    name,
    code,
    uniqueKey,
    description,
    revision: 1,
    version: 'v1.0',
    activeVersion: '',
    serviceEnabled: false,
    modelConfirmed: false,
    identityVerified: false,
    sources: [],
    objects: [],
    attributes: [
      {
        id: device ? 'device_code' : 'business_code',
        name: uniqueKey,
        type: '文本',
        group: '基础信息',
        standard: true,
        dynamic: false,
        confirmed: true,
        nullable: false,
        alias: '',
        source: '',
        field: '',
        strategy: '身份同步',
        history: '不开放历史',
        historyRequired: false,
        historyObject: '',
        verified: false,
      },
    ],
    relations: [],
    records: [],
    cases: device
      ? createDeviceCases()
      : [
          {
            id: 'basic',
            name: '基础查询',
            question: '查询测试实体的当前属性',
            history: false,
            status: '未测试',
            answer: '',
            evidence: '',
          },
        ],
    releases: [],
    updatedAt: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    }),
    role: '运维管理员',
    scope: '当前租户',
    protocol: 'MCP',
  };
}
export function createDeviceCases() {
  return structuredClone(mockDeviceAgentCases);
}
/** 按已选权威来源与字段读取样例，缺失来源不会隐式回退。 */
export function getMockDeviceValue(
  attribute: EntityAttribute,
  record: EntityRecord,
) {
  const businessSource = mockEntitySourceRecords.find(
    (item) =>
      item.recordCode === record.code &&
      item.system === attribute.source &&
      record.sources.includes(item.system) &&
      attribute.field.startsWith(`${item.object}.`),
  );
  if (businessSource) {
    const value =
      businessSource.values[
        attribute.field.slice(businessSource.object.length + 1)
      ];
    return {
      value: value ?? '暂无样例',
      source: businessSource.system,
      time: businessSource.updatedAt,
      available: value !== undefined && value !== null,
    };
  }
  const source = mockDeviceSourceRecords.find(
    (item) =>
      item.deviceCode === record.code &&
      item.system === attribute.source &&
      record.sources.includes(item.system) &&
      attribute.field.startsWith(`${item.object}.`),
  );
  if (!source)
    return {
      value: '来源未关联',
      source: '未关联',
      time: '—',
      available: false,
    };
  const field = attribute.field.slice(source.object.length + 1);
  const value = source.values[field];
  return {
    value: value ?? '暂无样例',
    source: source.system,
    time: source.updatedAt,
    available: value !== undefined && value !== null,
  };
}
export function getMockDeviceHistory(
  entity: EntityDraft,
  record: EntityRecord,
) {
  return mockDeviceChanges
    .filter(
      (event) =>
        event.deviceCode === record.code &&
        record.sources.includes(event.source) &&
        entity.objects.some(
          (o) =>
            o.name === event.object &&
            o.system === event.source &&
            o.status === '已确认',
        ),
    )
    .map((event) => ({
      ...event,
      changes: event.changes.filter((change) =>
        entity.attributes.some(
          (a) =>
            a.id === change.attribute &&
            a.dynamic &&
            a.verified &&
            a.history !== '不开放历史' &&
            a.historyObject === event.object,
        ),
      ),
    }))
    .filter((event) => event.changes.length > 0);
}

export function isMockRelationReady(
  entity: EntityDraft,
  relation: EntityRelation,
) {
  const target = mockEnterpriseEntities.find((e) => e.code === relation.target);
  return Boolean(
    relation.enabled &&
    relation.verified &&
    target?.activeVersion &&
    target.serviceEnabled &&
    target.published?.attributes.some((a) =>
      a.field.endsWith(`.${relation.targetField}`),
    ) &&
    entity.objects.some(
      (o) =>
        o.system === relation.source &&
        o.name === relation.object &&
        o.status === '已确认' &&
        o.fields.some((f) => f.split('（')[0] === relation.sourceField),
    ),
  );
}
export function getMockEntityRelations(
  entity: EntityDraft,
  record: EntityRecord,
) {
  return entity.relations
    .filter((r) => isMockRelationReady(entity, r))
    .flatMap((relation) =>
      mockEntityRelationLinks
        .filter(
          (link) =>
            link.relationId === relation.id &&
            link.sourceRecordCode === record.code &&
            link.targetEntityCode === relation.target &&
            link.source === relation.source &&
            link.object === relation.object,
        )
        .flatMap((link) => {
          const target = mockEnterpriseEntities.find(
            (e) => e.code === relation.target,
          );
          const targetRecord = target?.published?.records.find(
            (r) => r.code === link.targetRecordCode,
          );
          return targetRecord && target
            ? [
                {
                  relationId: relation.id,
                  relationName: relation.name,
                  cardinality: relation.cardinality,
                  targetEntity: target.name,
                  targetId: targetRecord.id,
                  targetCode: targetRecord.code,
                  targetName: targetRecord.name,
                  targetVersion: target.activeVersion,
                  source: link.source,
                  object: link.object,
                  sourceKey: link.sourceKey,
                  updatedAt: link.updatedAt,
                },
              ]
            : [];
        }),
    );
}
export function getMockEntitySources(
  entity: EntityDraft,
  record: EntityRecord,
) {
  if (entity.code === 'Device')
    return mockDeviceSourceRecords.filter(
      (r) => r.deviceCode === record.code && record.sources.includes(r.system),
    );
  return mockEntitySourceRecords.filter(
    (r) =>
      r.entityCode === entity.code &&
      r.recordCode === record.code &&
      record.sources.includes(r.system),
  );
}
