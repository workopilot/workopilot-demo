<script setup lang="ts">
import type {
  EntityAttribute,
  EntityDraft,
  EntityRecord,
  EntityRelation,
  SourceObject,
} from '#/types/enterprise-entity';

import { computed, onMounted, ref, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popover,
  Select,
  Spin,
  Switch,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getEnterpriseEntitiesApi,
  getMockDeviceHistory,
  getMockDeviceValue,
  getMockEntityRelations,
  getMockEntitySources,
  isMockRelationReady,
  saveEnterpriseEntityApi,
} from '#/api/enterprise-entity';
import {
  mockDeviceAttributes,
  mockDeviceChanges,
  mockDeviceRecords,
  mockDeviceRelations,
  mockDeviceSourceObjects,
  mockDeviceSourceRecords,
  mockEntitySourceRecords,
} from '#/api/mock-data';
import { deepClone } from '#/utils/deep-clone';

const route = useRoute();
const router = useRouter();
const entity = ref<EntityDraft>();
const tab = ref(String(route.query.tab || 'sources'));
const saving = ref(false);
const saved = ref('草稿已保存');
const steps = [
  {
    key: 'sources',
    title: '数据源与发现',
    goal: '确定数据来自哪些系统、哪些表或接口',
    icon: 'lucide:database',
  },
  {
    key: 'model',
    title: '实体模型',
    goal: '确认属性、关系及动态追溯需求',
    icon: 'lucide:shapes',
  },
  {
    key: 'mapping',
    title: '数据映射',
    goal: '配置权威来源、当前值获取方式和历史策略',
    icon: 'lucide:git-merge',
  },
  {
    key: 'data',
    title: '实体数据',
    goal: '验证统一身份与多系统来源关联',
    icon: 'lucide:box',
  },
  {
    key: 'services',
    title: '服务与验证',
    goal: '在测试环境验证 Agent，再发布正式能力',
    icon: 'lucide:shield-check',
  },
];
const currentStep = computed(
  () => steps.find((s) => s.key === tab.value) || steps[0],
);
const stepInstruction = computed(
  () =>
    (
      ({
        sources: '先关联数据源，再发现并确认需要使用的表或接口。',
        model: '勾选并确认属性；点击属性行配置类型、分组与动态追溯。',
        mapping: '匹配来源字段，点击属性配置权威来源与历史策略，再批量验证。',
        data: '预览注册结果，确认设备编号与来源关联后开始注册。',
        services: '确认服务契约与授权，执行 Agent 测试，通过后检查并发布。',
      }) as Record<string, string>
    )[tab.value] || '请选择实施步骤',
);
const stepSummary = computed(() => {
  const e = entity.value;
  if (!e) return '';
  if (tab.value === 'sources')
    return `${e.sources.length} 个数据源 · ${e.objects.filter((o) => o.status === '已确认').length}/${e.objects.length} 个对象已确认`;
  if (tab.value === 'model')
    return `${e.attributes.filter((a) => a.confirmed).length}/${e.attributes.length} 个属性已确认 · ${e.attributes.filter((a) => a.dynamic).length} 个动态属性`;
  if (tab.value === 'mapping')
    return `${e.attributes.filter((a) => a.verified).length}/${e.attributes.length} 个映射已验证`;
  if (tab.value === 'data')
    return `${e.records.length} 条${e.name}记录 · ${e.identityVerified ? '身份已验证' : '身份待验证'}`;
  return `${e.cases.filter((c) => c.status === '通过').length}/${e.cases.length} 个测试通过`;
});
const stepHelp = computed(
  () =>
    (
      ({
        sources:
          'AI 建议需要管理员确认。点击候选源对象查看字段、脱敏样例与推荐依据，确认后才用于模型和映射。',
        model:
          '标准 / 扩展与动态追溯是独立维度。关闭追溯的属性仍可更新；本页定义历史需求，具体来源在映射页配置。目标实体未实施时，关系可暂不开放。',
        mapping:
          '点击属性行配置来源并试运行。来源不可用时，只有明确配置的备用来源才能使用；快照检测时间不能替代业务变更时间。必需历史能力未就绪会阻塞发布。',
        data: '编号去除首尾空格后精确匹配；缺失、重复、冲突进入待处理。增量接入保留原 Entity ID。没有运维来源的设备仍可查询基础信息。',
        services:
          '服务先在测试环境验证。未开放能力标记不适用；必要用例通过后才能发布。本页 Agent 回答和调用证据为模拟数据。',
      }) as Record<string, string>
    )[tab.value] || '',
);
const linked = ref(false);
const selectedSystem = ref('设备系统');
const search = ref('');
const selectedObject = ref<SourceObject>();
const attribute = ref<EntityAttribute>();
const attrOpen = ref(false);
const mappingOpen = ref(false);
const group = ref('全部属性');
const modelTab = ref('attributes');
const mappingFilter = ref('全部');
const onlyPending = ref(false);
const mappingTab = ref('attributes');
const selectedIds = ref<string[]>([]);
const sourceModal = ref(false);
const manual = ref({ name: '', description: '', fields: '' });
const addAttribute = ref(false);
const attrForm = ref({ name: '', id: '', type: '文本', group: '基础信息' });
const preview = ref(false);
const device = ref<EntityRecord>();
const detailTab = ref('current');
const dataFilter = ref('全部');
const serviceTab = ref('data-services');
const serviceName = ref('get_device');
const caseId = ref('basic');
const testCode = ref('SB20260001');
const mapResult = ref('');
const publishOpen = ref(false);
const busy = ref(false);
const objects = computed(
  () =>
    entity.value?.objects.filter(
      (o) =>
        o.system === selectedSystem.value &&
        `${o.name}${o.description}`.includes(search.value),
    ) || [],
);
const attrs = computed(
  () =>
    entity.value?.attributes.filter(
      (a) => group.value === '全部属性' || a.group === group.value,
    ) || [],
);
const mapped = computed(() =>
  attrs.value.filter(
    (a) =>
      (!onlyPending.value || !a.verified) &&
      (mappingFilter.value === '全部' ||
        (mappingFilter.value === '已完成映射' && a.verified) ||
        (mappingFilter.value === '待确认映射' && !a.verified) ||
        (mappingFilter.value === '历史未就绪' &&
          a.dynamic &&
          a.historyRequired &&
          !a.historyObject)),
  ),
);
const currentCase = computed(() =>
  entity.value?.cases.find((c) => c.id === caseId.value),
);
const historyEnabled = computed(() =>
  entity.value?.attributes.some(
    (a) =>
      a.dynamic && a.history !== '不开放历史' && a.historyObject && a.verified,
  ),
);
const services = computed(() => [
  {
    id: `resolve_${entity.value?.code.toLowerCase()}`,
    name: '定位统一实体',
    status: '可测试',
  },
  {
    id: `get_${entity.value?.code.toLowerCase()}`,
    name: '查询当前属性',
    status: '可测试',
  },
  {
    id: `get_${entity.value?.code.toLowerCase()}_changes`,
    name: '查询动态属性变更',
    status: historyEnabled.value ? '可测试' : '暂不开放',
  },
  {
    id: `get_${entity.value?.code.toLowerCase()}_relations`,
    name: '查询实体关系',
    status: entity.value?.relations.some((r) =>
      isMockRelationReady(entity.value!, r),
    )
      ? '可测试'
      : '暂不开放',
  },
]);
const blockers = computed(() => {
  const e = entity.value;
  if (!e) return [];
  return [
    e.objects.some((o) => o.status === '已确认')
      ? ''
      : '至少确认一个可访问源对象',
    !e.modelConfirmed || e.attributes.some((a) => !a.confirmed)
      ? '当前实施范围模型尚未全部确认'
      : '',
    e.attributes.some((a) => !a.verified) ? '开放属性映射尚未全部验证' : '',
    e.attributes.some(
      (a) =>
        a.historyRequired && (!a.historyObject || a.history === '不开放历史'),
    )
      ? '必需历史能力尚未就绪'
      : '',
    !e.identityVerified || e.records.length === 0 ? '测试实体身份尚未验证' : '',
    e.cases.some((c) => c.status !== '通过' && c.status !== '不适用')
      ? '必要 Agent 测试尚未通过'
      : '',
    !e.role || !e.scope ? '请配置调用角色和访问范围' : '',
    e.relations.some((r) => r.enabled && !isMockRelationReady(e, r))
      ? '已启用关系的映射或目标实体尚未就绪'
      : '',
  ].filter(Boolean);
});
function progress(key: string) {
  const e = entity.value;
  if (!e) return '未开始';
  if (key === 'sources') {
    if (e.objects.some((o) => o.status === '已确认')) return '已完成';
    return e.sources.length > 0 ? '进行中' : '未开始';
  }
  if (key === 'model') {
    if (e.modelConfirmed && e.attributes.every((a) => a.confirmed)) {
      return '已完成';
    }
    return e.attributes.length > 0 ? '进行中' : '未开始';
  }
  if (key === 'mapping') {
    if (e.attributes.every((a) => a.verified)) return '已完成';
    return e.attributes.some((a) => a.field) ? '待处理' : '未开始';
  }
  if (key === 'data') {
    if (e.identityVerified) return '已完成';
    return e.records.length > 0 ? '待处理' : '未开始';
  }
  return blockers.value.length > 0 ? '待处理' : '已完成';
}
async function save() {
  if (!entity.value) return;
  saving.value = true;
  try {
    await saveEnterpriseEntityApi(toRaw(entity.value));
    saved.value = '草稿已保存';
  } catch {
    saved.value = '保存失败，请重试';
    message.error(saved.value);
  } finally {
    saving.value = false;
  }
}
function changed(invalidate = true) {
  const e = entity.value;
  if (!e) return;
  e.revision++;
  if (e.activeVersion && e.version === e.activeVersion) {
    const minor = Number(e.activeVersion.split('.')[1] || 0) + 1;
    e.version = `v1.${minor}`;
  }
  e.updatedAt = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
  });
  saved.value = '存在未保存修改';
  if (invalidate) {
    e.cases.forEach((c) => {
      c.status = '未测试';
      c.answer = '';
      c.evidence = '';
    });
  }
}
function selectTab(key: string) {
  tab.value = key;
  router.replace({ query: { ...route.query, tab: key } });
}
async function next() {
  await save();
  const index = steps.findIndex((s) => s.key === tab.value);
  const nextStep = steps[index + 1];
  if (nextStep) selectTab(nextStep.key);
}
function discover() {
  const e = entity.value;
  if (!e) return;
  if (e.sources.length === 0) {
    message.warning('请先关联数据源');
    return;
  }
  if (e.code !== 'Device') {
    message.info('自定义实体请手动添加源对象并补充业务说明');
    return;
  }
  const candidates: SourceObject[] = structuredClone(
    mockDeviceSourceObjects,
  ).map((o) => ({ ...o, status: '待确认' }));
  candidates.forEach((o) => {
    if (e.sources.includes(o.system) && !e.objects.some((i) => i.id === o.id))
      e.objects.push(o);
  });
  selectedObject.value = objects.value[0];
  changed();
  message.success('发现完成，AI 推测需要管理员确认');
}
function associate() {
  if (!entity.value) return;
  if (!entity.value.sources.includes(selectedSystem.value)) {
    entity.value.sources.push(selectedSystem.value);
    changed();
  }
  linked.value = false;
}
function confirmObject(status: string) {
  if (selectedObject.value) {
    selectedObject.value.status = status;
    entity.value?.attributes.forEach((a) => (a.verified = false));
    if (entity.value) entity.value.identityVerified = false;
    changed();
  }
}
function manualObject() {
  if (
    !entity.value ||
    !manual.value.name.trim() ||
    !manual.value.description.trim() ||
    !manual.value.fields.trim()
  ) {
    message.warning('请填写对象名称、业务说明和字段结构');
    return;
  }
  if (
    entity.value.objects.some(
      (o) => o.name === manual.value.name && o.system === selectedSystem.value,
    )
  ) {
    message.warning('该对象已存在');
    return;
  }
  entity.value.objects.push({
    id: `object-${Date.now()}`,
    system: selectedSystem.value,
    name: manual.value.name,
    description: manual.value.description,
    purpose: '管理员补充说明，需确认关联',
    fields: manual.value.fields.split(','),
    status: '待确认',
  });
  sourceModal.value = false;
  changed();
}
function recommend() {
  const e = entity.value;
  if (!e) return;
  if (e.code !== 'Device') {
    message.info('自定义实体请根据已确认来源新增属性');
    return;
  }
  mockDeviceAttributes.forEach((a) => {
    if (!e.attributes.some((item) => item.id === a.id))
      e.attributes.push({
        ...a,
        confirmed: false,
        source: '',
        field: '',
        history: '不开放历史',
        historyRequired: false,
        historyObject: '',
        verified: false,
      });
  });
  if (e.relations.length === 0)
    e.relations = structuredClone(mockDeviceRelations);
  e.modelConfirmed = false;
  changed();
  message.success('已生成建议，请勾选并确认');
}
function confirmModel() {
  const e = entity.value;
  if (!e) return;
  if (selectedIds.value.length === 0) {
    message.warning('请先勾选要确认的属性');
    return;
  }
  e.attributes
    .filter((a) => selectedIds.value.includes(a.id))
    .forEach((a) => (a.confirmed = true));
  e.modelConfirmed = e.attributes.every((a) => a.confirmed);
  selectedIds.value = [];
  changed();
}
function createAttribute() {
  const e = entity.value;
  if (!e) return;
  if (
    !attrForm.value.name.trim() ||
    !/^[a-z][a-z0-9_]*$/.test(attrForm.value.id) ||
    e.attributes.some((a) => a.id === attrForm.value.id)
  ) {
    message.warning('请填写属性名称和唯一的小写英文标识');
    return;
  }
  e.attributes.push({
    ...attrForm.value,
    standard: false,
    dynamic: false,
    confirmed: false,
    nullable: true,
    alias: '',
    source: '',
    field: '',
    strategy: '实时查询',
    history: '不开放历史',
    historyRequired: false,
    historyObject: '',
    verified: false,
  });
  e.modelConfirmed = false;
  addAttribute.value = false;
  changed();
}
function editAttribute(a: EntityAttribute, mapping = false) {
  attribute.value = deepClone(a);
  if (mapping) mappingOpen.value = true;
  else attrOpen.value = true;
  mapResult.value = '';
}
function applyAttribute() {
  const e = entity.value;
  const a = attribute.value;
  if (!e || !a) return;
  const index = e.attributes.findIndex((i) => i.id === a.id);
  if (index === -1) return;
  const original = e.attributes[index];
  if (a.id === e.attributes[0]?.id && (a.dynamic || a.nullable)) {
    message.warning('业务唯一标识不能允许为空或开启动态追溯');
    return;
  }
  if (original?.type !== a.type) {
    message.info('属性类型变更：映射与服务测试需重新验证');
  }
  if (!a.dynamic) {
    a.history = '不开放历史';
    a.historyRequired = false;
    a.historyObject = '';
  }
  a.verified = false;
  a.confirmed = true;
  e.attributes[index] = { ...a };
  e.modelConfirmed = e.attributes.every((i) => i.confirmed);
  e.identityVerified = false;
  changed();
  attrOpen.value = false;
  mappingOpen.value = false;
}
function match() {
  const e = entity.value;
  if (!e) return;
  const fields: Record<string, string> = {
    device_code: 'mst_dev.dev_no',
    device_name: 'mst_dev.device_name',
    model: 'mst_dev.model',
    scanner_model: 'device_config.scanner',
    os_version: 'device_config.os_ver',
    large_slot_count: 'device_config.large_slots',
  };
  e.attributes.forEach((a) => {
    const field = fields[a.id];
    if (
      field &&
      e.objects.some(
        (o) => o.status === '已确认' && field.startsWith(`${o.name}.`),
      )
    ) {
      a.field = field;
      a.source = field.startsWith('mst_dev') ? '设备系统' : '运维系统';
      if (a.id === 'device_code') {
        a.strategy = '身份同步';
      } else if (a.id === 'scanner_model') {
        a.strategy = '事件同步';
      } else {
        a.strategy = '实时查询';
      }
      a.verified = false;
    }
  });
  changed();
  message.success('已匹配来源字段，请确认权威来源并验证');
}
function validMapping(a: EntityAttribute) {
  const e = entity.value;
  const obj = e?.objects.find(
    (o) =>
      o.system === a.source &&
      o.status === '已确认' &&
      a.field.startsWith(`${o.name}.`),
  );
  const field = a.field.slice((obj?.name.length || 0) + 1);
  return (
    a.confirmed &&
    !!obj &&
    obj.fields.some((f) => f.split('（')[0] === field) &&
    (!a.historyRequired ||
      (a.history !== '不开放历史' &&
        !!a.historyObject &&
        e?.objects.some(
          (o) => o.status === '已确认' && o.name === a.historyObject,
        )))
  );
}
function validateMappings() {
  entity.value?.attributes.forEach(
    (a) => (a.verified = Boolean(validMapping(a))),
  );
  changed();
  message.info('已验证可执行映射；未确认字段或缺少必需历史来源的项需处理');
}
function testMapping() {
  const a = attribute.value;
  if (!a) return;
  if (!validMapping(a)) {
    mapResult.value = '失败：源对象/字段未确认，或必需历史来源未就绪';
    return;
  }
  const record = mockDeviceRecords.find(
    (r) => r.code === testCode.value.trim(),
  );
  if (!record || entity.value?.code !== 'Device') {
    mapResult.value = '未找到测试源记录';
    return;
  }
  const result = getMockDeviceValue(a, record);
  if (!result.available) {
    mapResult.value = '失败：来源未关联或来源字段没有样例值；未使用备用来源';
    return;
  }
  if (a.type === '整数' && !Number.isInteger(Number(result.value))) {
    mapResult.value = '失败：源值无法转换为整数';
    return;
  }
  const converted =
    a.type === '整数' ? Number(result.value) : String(result.value);
  mapResult.value = `源值：${result.value} → 转换后值：${converted}；来源：${result.source} / ${a.field}；更新时间：${result.time}`;
}
function register() {
  const e = entity.value;
  if (!e) return;
  if (!e.attributes[0]?.verified) {
    message.warning('请先验证业务唯一标识映射');
    return;
  }
  if (e.code !== 'Device') {
    message.info('当前自定义实体没有模拟源记录，请先使用设备模板体验注册');
    return;
  }
  const confirmedSystems = new Set(
    e.objects
      .filter(
        (o) =>
          o.status === '已确认' &&
          ['device_config', 'mst_dev'].includes(o.name),
      )
      .map((o) => o.system),
  );
  mockDeviceRecords.forEach((sample) => {
    const sources = sample.sources.filter((source) =>
      confirmedSystems.has(source),
    );
    if (!sources.includes('设备系统')) return;
    const existing = e.records.find((r) => r.code === sample.code);
    const registered = {
      ...sample,
      sources,
      status: sources.includes('运维系统') ? '正常' : '运维来源未关联',
    };
    if (existing) Object.assign(existing, registered, { id: existing.id });
    else e.records.push(registered);
  });
  e.identityVerified = true;
  changed();
  preview.value = false;
  message.success('已注册并验证身份；现有 Entity ID 保持不变');
}
async function runTests() {
  const e = entity.value;
  if (!e) return;
  busy.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const testedRevision = e.revision;
    const ready =
      e.identityVerified &&
      e.modelConfirmed &&
      e.attributes.every((a) => a.verified);
    e.cases.forEach((c) => {
      if (e.code !== 'Device') {
        const record = e.records[0];
        const values = record
          ? e.attributes.map((a) => getMockDeviceValue(a, record))
          : [];
        c.status =
          ready && values.length > 0 && values.every((v) => v.available)
            ? '通过'
            : '失败';
        c.answer =
          c.status === '通过'
            ? `${record?.code}：${record?.name}`
            : '实体当前属性尚未就绪';
        c.evidence = e.attributes
          .map((a) => `${a.source} / ${a.field}`)
          .join('；');
        return;
      }
      if (c.relation) {
        const relation = e.relations.find((r) => r.id === c.relation);
        if (!relation?.enabled) {
          c.status = '不适用';
          c.answer = '本次未开放该关系';
          c.evidence = '关系模型未启用';
          return;
        }
        const record = e.records.find((r) => r.code === 'SB20260001');
        const rows = record
          ? getMockEntityRelations(e, record).filter(
              (r) => r.relationId === c.relation,
            )
          : [];
        c.status =
          ready && isMockRelationReady(e, relation) && rows.length > 0
            ? '通过'
            : '失败';
        c.answer =
          c.status === '通过'
            ? rows
                .map(
                  (r) =>
                    `${r.relationName}：${r.targetName}（${r.targetCode}）`,
                )
                .join('；')
            : '关系映射或目标实体尚未就绪';
        c.evidence = rows
          .map(
            (r) =>
              `get_device_relations → ${r.targetId}；${r.source}/${r.object} · ${r.sourceKey}；目标生效 ${r.targetVersion}`,
          )
          .join('；');
        return;
      }
      const hasModel = e.attributes.some((a) => a.id === 'model' && a.verified);
      const scannerForCase = e.attributes.find(
        (a) => a.id === 'scanner_model' && a.verified,
      );
      if (
        (c.id === 'basic' && !hasModel) ||
        (['dynamic', 'unavailable'].includes(c.id) && !scannerForCase) ||
        (c.history &&
          (!historyEnabled.value ||
            !scannerForCase ||
            scannerForCase.history === '不开放历史' ||
            !scannerForCase.historyObject))
      ) {
        c.status = '不适用';
        c.answer = '本次未开放该测试对应能力；按当前服务契约标记不适用。';
        c.evidence = '依据已验证映射与本次开放属性判断';
        return;
      }
      c.status = ready && testedRevision === e.revision ? '通过' : '失败';
      if (!ready || testedRevision !== e.revision) {
        c.answer = '配置尚未完成，无法执行服务契约测试';
        c.evidence = '检查身份规则、模型和映射';
        return;
      }
      const record = e.records.find((r) => r.code === 'SB20260001');
      const model = e.attributes.find((a) => a.id === 'model');
      const scanner = e.attributes.find((a) => a.id === 'scanner_model');
      let value: ReturnType<typeof getMockDeviceValue> | undefined;
      if (c.id === 'basic' && model && record) {
        value = getMockDeviceValue(model, record);
      } else if (scanner && record) {
        value = getMockDeviceValue(scanner, record);
      }
      const event = record ? getMockDeviceHistory(e, record)[0] : undefined;
      const change = event?.changes.find(
        (item) => item.attribute === 'scanner_model',
      );
      if (
        (['basic', 'dynamic'].includes(c.id) && !value?.available) ||
        (c.id === 'history' && !change)
      ) {
        c.status = '失败';
        c.answer = '已开放能力未返回有效来源值或可靠历史事件';
        c.evidence = '请检查本次配置与对应源记录';
        return;
      }
      const answers: Record<string, string> = {
        basic: `设备 ${record?.code}（${record?.id}），型号 ${value?.value}。`,
        dynamic: `当前扫描仪型号 ${value?.value}，采用 ${value?.source} 权威来源。`,
        history: `${event?.effectiveAt}，扫描仪由 ${change?.oldValue} 更换为 ${change?.newValue}；工单 ${event?.document}，原因：${event?.reason}。`,
        missing: '未找到设备 SB20999999。',
        'no-history': '设备 SB20260002 当前基础信息可查询；历史数据暂不可用。',
        permission: '拒绝访问：当前身份没有设备查询权限；未返回设备属性。',
        unavailable:
          '来源接口不可用；未配置备用来源，明确返回 SOURCE_UNAVAILABLE。',
      };
      c.answer = answers[c.id] || '测试实体当前属性查询成功';
      switch (c.id) {
        case 'missing': {
          c.evidence = 'resolve_device → ENTITY_NOT_FOUND';
          break;
        }
        case 'no-history': {
          c.evidence =
            'resolve_device → DEV-000002；get_device_changes → HISTORY_UNAVAILABLE，无运维来源关联';
          break;
        }
        case 'permission': {
          c.evidence = '权限检查 → 拒绝（403），未调用数据源';
          break;
        }
        case 'unavailable': {
          c.evidence = 'get_device → SOURCE_UNAVAILABLE，无隐式备用来源';
          break;
        }
        default: {
          const tail = c.history
            ? `get_device_changes → ${event?.object} / ${event?.document}；事件时间 ${event?.effectiveAt}`
            : `get_device → ${c.id === 'basic' ? model?.field : scanner?.field}；来源 ${value?.source}；更新时间 ${value?.time}`;
          c.evidence = `resolve_device → ${record?.id}；${tail}；范围 ${e.scope}`;
        }
      }
    });
    saved.value = '存在未保存测试结果';
    await save();
  } finally {
    busy.value = false;
  }
}
async function publish() {
  const e = entity.value;
  if (!e || blockers.value.length > 0) {
    message.warning('请先处理发布阻塞项');
    return;
  }
  if (e.releases.at(-1)?.revision === e.revision) return;
  e.published = deepClone({
    attributes: e.attributes,
    objects: e.objects,
    records: e.records,
    relations: e.relations,
    role: e.role,
    scope: e.scope,
    protocol: e.protocol,
  });
  e.activeVersion = e.version;
  e.serviceEnabled = true;
  e.releases.push({
    version: e.version,
    time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    services: services.value
      .filter((s) => s.status === '可测试')
      .map((s) => s.id),
    revision: e.revision,
  });
  await save();
  publishOpen.value = false;
  message.success(`${e.activeVersion} 已发布并生效`);
}
onMounted(async () => {
  const response = await getEnterpriseEntitiesApi();
  entity.value = response.data.find((e) => e.id === String(route.params.id));
  if (!entity.value) {
    message.warning('实体不存在或模拟数据已重置');
    router.replace('/knowledge-archives/entities');
    return;
  }
  selectedObject.value = entity.value.objects[0];
  selectedSystem.value = entity.value.sources[0] || '设备系统';
  serviceName.value = `get_${entity.value.code.toLowerCase()}`;
  caseId.value = entity.value.cases[0]?.id || '';
});
const deviceValues = computed(() =>
  entity.value && device.value
    ? entity.value.attributes.map((a) => ({
        name: a.name,
        group: a.group,
        ...getMockDeviceValue(a, device.value!),
      }))
    : [],
);
const deviceHistory = computed(() =>
  entity.value && device.value
    ? getMockDeviceHistory(entity.value, device.value)
    : [],
);
const deviceSources = computed(() =>
  entity.value && device.value
    ? getMockEntitySources(entity.value, device.value)
    : [],
);
const deviceRelations = computed(() =>
  entity.value && device.value
    ? getMockEntityRelations(entity.value, device.value)
    : [],
);
const objectSample = computed(() =>
  selectedObject.value
    ? JSON.stringify(
        selectedObject.value.name === 'repair_changes'
          ? mockDeviceChanges.slice(0, 2).flatMap((event) =>
              event.changes.map((change) => ({
                dev_no: event.deviceCode,
                attribute: change.attribute,
                old_value: change.oldValue,
                new_value: change.newValue,
                effective_at: event.effectiveAt,
                event_id: event.id,
                work_order: event.document,
                reason: event.reason,
              })),
            )
          : [...mockDeviceSourceRecords, ...mockEntitySourceRecords]
              .filter(
                (r) =>
                  r.object === selectedObject.value?.name &&
                  r.system === selectedObject.value?.system,
              )
              .slice(0, 2)
              .map((r) => r.values),
        null,
        2,
      )
    : '',
);
const registrationPreview = computed(() => {
  const e = entity.value;
  if (!e || e.code !== 'Device') return { newEntities: 0, newLinks: 0 };
  const confirmed = new Set(
    e.objects
      .filter(
        (o) =>
          o.status === '已确认' &&
          ['device_config', 'mst_dev'].includes(o.name),
      )
      .map((o) => o.system),
  );
  if (!confirmed.has('设备系统')) return { newEntities: 0, newLinks: 0 };
  let newLinks = 0;
  for (const sample of mockDeviceRecords) {
    const existing = e.records.find((r) => r.code === sample.code);
    if (!existing) continue;
    newLinks += sample.sources.filter(
      (source) => confirmed.has(source) && !existing.sources.includes(source),
    ).length;
  }
  return {
    newEntities: mockDeviceRecords.filter(
      (sample) => !e.records.some((r) => r.code === sample.code),
    ).length,
    newLinks,
  };
});
const objColumns = [
  { title: '源对象', dataIndex: 'name' },
  { title: '业务说明', dataIndex: 'description' },
  { title: 'AI 推荐用途与依据', dataIndex: 'purpose' },
  { title: '确认状态', dataIndex: 'status' },
];
const attrColumns = [
  { title: '属性名称', dataIndex: 'name' },
  { title: '属性标识', dataIndex: 'id' },
  { title: '类型', dataIndex: 'type' },
  { title: '归属', key: 'standard' },
  { title: '动态追溯', key: 'dynamic' },
  { title: '确认状态', key: 'confirmed' },
];
const mapColumns = [
  { title: '企业属性', dataIndex: 'name' },
  { title: '权威来源', dataIndex: 'source' },
  { title: '来源字段', dataIndex: 'field' },
  { title: '获取策略', dataIndex: 'strategy' },
  { title: '历史策略', dataIndex: 'history' },
  { title: '状态', key: 'verified' },
];
const recordColumns = computed(() => [
  { title: 'Entity ID', dataIndex: 'id' },
  { title: `${entity.value?.name || '实体'}编号`, dataIndex: 'code' },
  { title: `${entity.value?.name || '实体'}名称`, dataIndex: 'name' },
  { title: '来源关联', key: 'sources' },
  { title: '数据状态', dataIndex: 'status' },
  { title: '操作', key: 'action' },
]);
</script>
<template>
  <Spin :spinning="!entity">
    <div v-if="entity" class="entity-workbench p-5 pb-24">
      <header
        class="entity-header mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <Button
            aria-label="返回企业实体列表"
            @click="router.push('/knowledge-archives/entities')"
          >
            <Icon icon="lucide:arrow-left" />
          </Button>
          <span class="entity-mark">
            <Icon icon="lucide:boxes" width="21" />
          </span>
          <h1 class="text-lg font-semibold">
            {{ entity.name }}
            <span class="ml-2 text-sm font-normal text-gray-400">
              / {{ entity.code }}
            </span>
          </h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Tag color="blue">草稿 {{ entity.version }}</Tag>
          <Tag :color="entity.activeVersion ? 'green' : 'default'">
            生效 {{ entity.activeVersion || '未发布' }}
            {{ entity.serviceEnabled ? '· 已启用' : '' }}
          </Tag>
        </div>
      </header>
      <nav aria-label="实施步骤" class="step-navigation mb-3">
        <button
          v-for="(step, i) in steps"
          :key="step.key"
          type="button"
          :aria-current="tab === step.key ? 'step' : undefined"
          class="step-button flex items-center gap-2 text-left"
          :class="{
            'is-active': tab === step.key,
            'is-complete': progress(step.key) === '已完成',
          }"
          @click="selectTab(step.key)"
        >
          <span class="step-symbol">
            <Icon
              :icon="
                progress(step.key) === '已完成' ? 'lucide:check' : step.icon
              "
              width="17"
            />
          </span>
          <span class="font-medium">{{ i + 1 }}. {{ step.title }}</span>
          <span
            class="step-status ml-auto text-xs"
            :class="progress(step.key) === '待处理' ? 'text-orange-600' : ''"
          >
            {{ progress(step.key) }}
          </span>
        </button>
      </nav>
      <div
        class="step-context mb-4 flex flex-wrap items-center justify-between gap-2"
      >
        <p class="text-sm text-gray-500">{{ stepInstruction }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <span class="step-summary text-xs">{{ stepSummary }}</span>
          <Popover
            trigger="click"
            placement="bottomRight"
            :title="`${currentStep?.title} · 操作说明`"
          >
            <template #content>
              <div class="step-help space-y-3 text-sm">
                <p>{{ stepHelp }}</p>
                <p class="text-gray-500">{{ entity.description }}</p>
                <p class="border-t pt-3 text-gray-500">
                  草稿仅用于配置和测试，发布前不会改变正式 Agent
                  的查询能力。模拟数据刷新后重置。
                </p>
              </div>
            </template>
            <Button type="text" size="small">
              <Icon icon="lucide:circle-help" class="mr-1" />
              操作说明
            </Button>
          </Popover>
        </div>
      </div>
      <div v-if="tab === 'sources'" class="work-grid">
        <Card title="已关联数据源">
          <Button block class="mb-4" @click="linked = true">
            ＋ 关联数据源
          </Button>
          <button
            v-for="source in entity.sources"
            :key="source"
            class="source-choice mb-3 w-full p-4 text-left"
            :class="{ 'is-selected': selectedSystem === source }"
            @click="
              selectedSystem = source;
              selectedObject = objects[0];
            "
          >
            <div class="font-medium">{{ source }}</div>
            <Tag class="mt-2" color="green">
              连接正常 · {{ source === '设备系统' ? '数据库' : 'REST API' }}
            </Tag>
            <p class="mt-2 text-xs text-gray-500">
              {{
                entity.objects.filter(
                  (o) => o.system === source && o.status === '已确认',
                ).length
              }}
              个已确认对象
            </p>
            <p class="mt-1 text-xs text-gray-400">
              最近发现：{{
                entity.objects.some((o) => o.system === source)
                  ? entity.updatedAt
                  : '尚未发现'
              }}
            </p>
          </button>
          <Empty
            v-if="entity.sources.length === 0"
            description="请先关联数据源"
          />
        </Card>
        <Card title="发现结果">
          <div class="mb-4 flex flex-wrap gap-2">
            <Input
              v-model:value="search"
              placeholder="搜索表或接口"
              class="!w-48"
            />
            <Button type="primary" @click="discover">
              <Icon icon="lucide:sparkles" class="mr-1" />
              AI 发现
            </Button>
            <Button
              :disabled="entity.sources.length === 0"
              @click="sourceModal = true"
            >
              手动添加对象
            </Button>
          </div>
          <Table
            :columns="objColumns"
            :data-source="objects"
            row-key="id"
            :pagination="false"
            :custom-row="
              (record: SourceObject) => ({
                onClick: () => (selectedObject = record),
                class:
                  record.id === selectedObject?.id
                    ? 'workbench-row-selected'
                    : '',
                style: { cursor: 'pointer' },
              })
            "
            :scroll="{ x: 650 }"
          />
          <p class="mt-4 text-gray-500">
            已关联 {{ entity.sources.length }} 个数据源，确认
            {{ entity.objects.filter((o) => o.status === '已确认').length }}
            个源对象
          </p>
        </Card>
        <Card title="对象详情">
          <template v-if="selectedObject">
            <h3 class="font-semibold">{{ selectedObject.name }}</h3>
            <p class="mt-2 text-gray-500">{{ selectedObject.description }}</p>
            <Tag class="my-3" color="blue">{{ selectedObject.status }}</Tag>
            <h4 class="mb-2 font-medium">字段结构与候选身份字段</h4>
            <div
              v-for="field in selectedObject.fields"
              :key="field"
              class="border-b py-2 font-mono text-xs"
            >
              {{ field }}
            </div>
            <h4 class="mb-2 mt-5 font-medium">脱敏样例</h4>
            <pre class="overflow-auto rounded bg-gray-50 p-3 text-xs">{{
              objectSample || '需要管理员补充说明'
            }}</pre>
            <details class="my-3 text-sm text-gray-500">
              <summary class="cursor-pointer">推荐依据 · 待管理员确认</summary>
              <p class="mt-2">{{ selectedObject.purpose }}</p>
              <p class="mt-1">AI 建议不代表已确认的业务含义。</p>
            </details>
            <div class="flex gap-2">
              <Button type="primary" @click="confirmObject('已确认')">
                确认关联
              </Button>
              <Button @click="confirmObject('已忽略')">忽略</Button>
            </div>
          </template>
          <Empty v-else description="选择源对象查看详情" />
        </Card>
      </div>
      <div v-else-if="tab === 'model'" class="work-grid model-grid">
        <Card title="属性分组">
          <button
            v-for="g in [
              '全部属性',
              ...new Set(entity.attributes.map((a) => a.group)),
            ]"
            :key="g"
            class="group-choice mb-2 w-full px-3 py-3 text-left"
            :class="{ 'is-selected': group === g }"
            @click="group = g"
          >
            {{ g }}
            <span class="float-right text-gray-400">
              {{
                entity.attributes.filter(
                  (a) => g === '全部属性' || a.group === g,
                ).length
              }}
            </span>
          </button>
        </Card>
        <Card>
          <Tabs v-model:active-key="modelTab">
            <TabPane key="attributes" tab="实体属性">
              <div class="mb-4 flex gap-2">
                <Button type="primary" @click="recommend">AI 推荐模型</Button>
                <Button @click="addAttribute = true">新增属性</Button>
                <Button @click="confirmModel">确认勾选项</Button>
              </div>
              <Table
                :columns="attrColumns"
                :data-source="attrs"
                row-key="id"
                :pagination="false"
                :row-selection="{
                  selectedRowKeys: selectedIds,
                  onChange: (keys) => (selectedIds = keys.map(String)),
                }"
                :custom-row="
                  (a: EntityAttribute) => ({
                    onClick: () => editAttribute(a),
                    style: { cursor: 'pointer' },
                  })
                "
                :scroll="{ x: 650 }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'standard'">
                    <Tag>{{ record.standard ? '标准' : '企业扩展' }}</Tag>
                  </template>
                  <template v-else-if="column.key === 'dynamic'">
                    <Tag :color="record.dynamic ? 'blue' : 'default'">
                      {{ record.dynamic ? '开启' : '关闭' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'confirmed'">
                    <Tag :color="record.confirmed ? 'green' : 'orange'">
                      {{ record.confirmed ? '已确认' : 'AI 推荐 / 待确认' }}
                    </Tag>
                  </template>
                </template>
              </Table>
            </TabPane>
            <TabPane key="relations" tab="实体关系">
              <p class="mb-3 text-sm text-gray-500">
                已启用关系用于关联已发布的目标实体；其余关系可暂不开放。
              </p>
              <Table
                :data-source="entity.relations"
                row-key="id"
                :pagination="false"
                :columns="[
                  { title: '关系名称', dataIndex: 'name' },
                  { title: '关系标识', dataIndex: 'id' },
                  { title: '目标实体', dataIndex: 'target' },
                  { title: '数量关系', dataIndex: 'cardinality' },
                  { title: '实施状态', key: 'state' },
                ]"
              >
                <template #bodyCell="{ column, record }">
                  <Tag
                    v-if="column.key === 'state'"
                    :color="record.enabled ? 'green' : 'default'"
                  >
                    {{ record.enabled ? '已启用' : '暂不启用' }}
                  </Tag>
                </template>
              </Table>
            </TabPane>
          </Tabs>
          <p class="mt-4 text-gray-500">
            {{ entity.attributes.filter((a) => a.confirmed).length }}
            个属性已确认，{{
              entity.attributes.filter((a) => a.dynamic).length
            }}
            个动态属性；{{
              entity.relations.filter((r) => r.enabled).length
            }}
            个关系已启用，{{
              entity.relations.filter((r) => !r.enabled).length
            }}
            个暂不启用
          </p>
        </Card>
      </div>
      <Card v-else-if="tab === 'mapping'">
        <div class="mb-3 flex flex-wrap gap-2">
          <button
            v-for="item in [
              {
                name: '已完成映射',
                count: entity.attributes.filter((a) => a.verified).length,
              },
              {
                name: '待确认映射',
                count: entity.attributes.filter((a) => !a.verified).length,
              },
              {
                name: '历史未就绪',
                count: entity.attributes.filter(
                  (a) => a.dynamic && a.historyRequired && !a.historyObject,
                ).length,
              },
            ]"
            :key="item.name"
            class="mapping-filter flex items-center gap-2 px-3 py-2 text-sm"
            :class="{ 'is-selected': mappingFilter === item.name }"
            @click="
              mappingFilter = mappingFilter === item.name ? '全部' : item.name
            "
          >
            <span>{{ item.name }}</span>
            <span class="font-semibold tabular-nums">{{ item.count }}</span>
          </button>
        </div>
        <Tabs v-model:active-key="mappingTab">
          <TabPane key="attributes" tab="属性映射">
            <div class="mb-4 flex flex-wrap items-center gap-3">
              <Select
                v-model:value="group"
                class="w-44"
                :options="
                  [
                    '全部属性',
                    ...new Set(entity.attributes.map((a) => a.group)),
                  ].map((value) => ({ value, label: value }))
                "
              />
              <Checkbox v-model:checked="onlyPending">只看待处理</Checkbox>
              <Button type="primary" @click="match">AI 匹配</Button>
              <Button @click="validateMappings">批量验证</Button>
              <Button
                @click="
                  mappingFilter = '全部';
                  group = '全部属性';
                  onlyPending = false;
                "
              >
                重置筛选
              </Button>
            </div>
            <Table
              :columns="mapColumns"
              :data-source="mapped"
              row-key="id"
              :pagination="false"
              :custom-row="
                (a: EntityAttribute) => ({
                  onClick: () => editAttribute(a, true),
                  style: { cursor: 'pointer' },
                })
              "
            >
              <template #bodyCell="{ column, record }">
                <Tag
                  v-if="column.key === 'verified'"
                  :color="record.verified ? 'green' : 'orange'"
                >
                  {{ record.verified ? '已验证' : '待验证' }}
                </Tag>
              </template>
            </Table>
          </TabPane>
          <TabPane key="relations" tab="关系映射">
            <Table
              v-if="entity.relations.some((r) => r.enabled)"
              :data-source="entity.relations.filter((r) => r.enabled)"
              row-key="id"
              :pagination="false"
              :columns="[
                { title: '关系', dataIndex: 'name' },
                { title: '权威来源', dataIndex: 'source' },
                { title: '来源对象', dataIndex: 'object' },
                { title: '关联字段', dataIndex: 'sourceField' },
                { title: '目标实体', dataIndex: 'target' },
                { title: '目标身份字段', dataIndex: 'targetField' },
                { title: '验证状态', key: 'state' },
              ]"
            >
              <template #bodyCell="{ column, record }">
                <Tag
                  v-if="column.key === 'state'"
                  :color="
                    isMockRelationReady(entity!, record as EntityRelation)
                      ? 'green'
                      : 'orange'
                  "
                >
                  {{
                    isMockRelationReady(entity!, record as EntityRelation)
                      ? '已验证'
                      : '待处理'
                  }}
                </Tag>
              </template>
            </Table>
            <Empty v-else description="本次没有启用的关系" />
          </TabPane>
        </Tabs>
      </Card>
      <div v-else-if="tab === 'data'">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span class="font-medium">唯一标识：{{ entity.uniqueKey }}</span>
            <span class="text-gray-500">编号精确匹配 · 保留 Entity ID</span>
            <Popover
              trigger="click"
              title="统一身份规则"
              placement="bottomLeft"
            >
              <template #content>
                <div class="step-help">
                  <Descriptions :column="1" size="small">
                    <DescriptionsItem label="平台身份">
                      自动生成 Entity ID
                    </DescriptionsItem>
                    <DescriptionsItem label="标准化">
                      去除首尾空格
                    </DescriptionsItem>
                    <DescriptionsItem label="异常处理">
                      缺失、重复、冲突进入待处理
                    </DescriptionsItem>
                    <DescriptionsItem label="增量接入">
                      保留现有 Entity ID
                    </DescriptionsItem>
                  </Descriptions>
                </div>
              </template>
              <Button type="link" size="small">查看规则</Button>
            </Popover>
          </div>
          <div class="flex gap-2">
            <Button @click="preview = true">预览注册结果</Button>
            <Button type="primary" @click="register">开始注册</Button>
          </div>
        </div>
        <Card title="实体记录">
          <div class="mb-4 flex gap-2">
            <Button
              :type="dataFilter === '全部' ? 'primary' : 'default'"
              @click="dataFilter = '全部'"
            >
              全部
            </Button>
            <Button
              :type="dataFilter === '待处理' ? 'primary' : 'default'"
              @click="dataFilter = '待处理'"
            >
              待处理
            </Button>
          </div>
          <Table
            :columns="recordColumns"
            :data-source="
              entity.records.filter(
                (r) => dataFilter === '全部' || r.status === '身份异常',
              )
            "
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'sources'">
                <Tag v-for="s in record.sources" :key="s">{{ s }}</Tag>
              </template>
              <Button
                v-else-if="column.key === 'action'"
                type="link"
                @click="
                  device = record as EntityRecord;
                  detailTab = 'current';
                "
              >
                查看
              </Button>
            </template>
          </Table>
        </Card>
      </div>
      <div v-else-if="tab === 'services'">
        <div class="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <Icon
            :icon="
              blockers.length > 0
                ? 'lucide:circle-alert'
                : 'lucide:circle-check'
            "
            :class="blockers.length > 0 ? 'text-orange-600' : 'text-green-600'"
            width="18"
          />
          <span
            :class="blockers.length > 0 ? 'text-orange-600' : 'text-green-600'"
          >
            {{
              blockers.length > 0
                ? `发布前需处理 ${blockers.length} 项`
                : '已满足发布条件'
            }}
          </span>
          <Popover
            v-if="blockers.length > 0"
            trigger="click"
            title="发布待处理事项"
            placement="bottomLeft"
          >
            <template #content>
              <ul class="step-help list-disc space-y-2 pl-4">
                <li v-for="issue in blockers" :key="issue">{{ issue }}</li>
              </ul>
            </template>
            <Button type="link" size="small">查看待处理项</Button>
          </Popover>
        </div>
        <Card>
          <Tabs v-model:active-key="serviceTab">
            <TabPane key="data-services" tab="数据服务">
              <div class="grid gap-6 lg:grid-cols-2">
                <div>
                  <button
                    v-for="s in services"
                    :key="s.id"
                    class="service-choice mb-3 flex w-full justify-between p-4 text-left"
                    :class="{ 'is-selected': serviceName === s.id }"
                    @click="serviceName = s.id"
                  >
                    <div>
                      <p class="font-mono font-medium">{{ s.id }}</p>
                      <p class="mt-1 text-gray-500">{{ s.name }}</p>
                    </div>
                    <Tag :color="s.status === '可测试' ? 'blue' : 'default'">
                      {{ s.status }}
                    </Tag>
                  </button>
                </div>
                <div class="detail-surface p-5">
                  <h3 class="mb-4 font-semibold">
                    服务契约 · {{ serviceName }}
                  </h3>
                  <Descriptions :column="1">
                    <DescriptionsItem label="输入参数">
                      {{
                        serviceName.includes('resolve')
                          ? 'business_code'
                          : 'entity_id / business_code'
                      }}{{
                        serviceName.includes('relations')
                          ? '{ relations: [{ relation_id, target_entity_id, target_code, target_name, source, updated_at }] }'
                          : serviceName.includes('changes')
                            ? '、start_time、end_time'
                            : ''
                      }}
                    </DescriptionsItem>
                    <DescriptionsItem label="输出结构">
                      {{
                        serviceName.includes('relations')
                          ? '{ relations: [{ relation_id, target_entity_id, target_code, target_name, source, updated_at }] }'
                          : serviceName.includes('changes')
                            ? 'events[] { effective_at, old_value, new_value, event_id, reason, work_order }'
                            : '{ entity_id, attributes, source, updated_at, availability }'
                      }}
                    </DescriptionsItem>
                    <DescriptionsItem label="开放属性">
                      {{
                        entity.attributes
                          .filter((a) => a.verified)
                          .map((a) => a.name)
                          .join('、') || '待配置'
                      }}
                    </DescriptionsItem>
                    <DescriptionsItem label="关系">
                      {{
                        entity.relations
                          .filter((r) => isMockRelationReady(entity!, r))
                          .map((r) => r.name)
                          .join('、') || '本次暂不开放'
                      }}
                    </DescriptionsItem>
                    <DescriptionsItem label="来源与时效">
                      返回来源及更新时间；不可用返回明确状态
                    </DescriptionsItem>
                  </Descriptions>
                  <Form layout="vertical" class="mt-4">
                    <FormItem label="允许调用角色">
                      <Select
                        v-model:value="entity.role"
                        :options="
                          ['运维管理员', '设备查询员'].map((value) => ({
                            value,
                            label: value,
                          }))
                        "
                        @change="changed()"
                      />
                    </FormItem>
                    <FormItem label="数据访问范围">
                      <Select
                        v-model:value="entity.scope"
                        :options="[
                          { value: '当前租户', label: '当前租户内授权设备' },
                        ]"
                        @change="changed()"
                      />
                    </FormItem>
                    <FormItem label="Agent Tool 协议">
                      <Select
                        v-model:value="entity.protocol"
                        :options="
                          ['MCP', 'Function Calling'].map((value) => ({
                            value,
                            label: value,
                          }))
                        "
                        @change="changed()"
                      />
                    </FormItem>
                  </Form>
                </div>
              </div>
            </TabPane>
            <TabPane key="agent" tab="Agent 验证">
              <p class="mb-3 flex items-center gap-2 text-sm text-gray-500">
                <Tag color="blue">测试环境</Tag>
                模拟 Agent 回答及调用证据
              </p>
              <div class="work-grid">
                <div>
                  <Button
                    type="primary"
                    block
                    class="mb-4"
                    :loading="busy"
                    @click="runTests"
                  >
                    执行全部测试
                  </Button>
                  <button
                    v-for="c in entity.cases"
                    :key="c.id"
                    class="case-choice mb-2 w-full p-3 text-left"
                    :class="{ 'is-selected': caseId === c.id }"
                    @click="caseId = c.id"
                  >
                    <p>{{ c.name }}</p>
                    <Tag
                      class="mt-2"
                      :color="
                        c.status === '通过'
                          ? 'green'
                          : c.status === '失败'
                            ? 'red'
                            : 'default'
                      "
                    >
                      {{ c.status }}
                    </Tag>
                  </button>
                </div>
                <div v-if="currentCase" class="detail-surface p-5">
                  <h3 class="mb-4 font-semibold">测试问题</h3>
                  <p class="rounded-lg bg-blue-50 p-4 text-blue-700">
                    {{ currentCase.question }}
                  </p>
                  <h3 class="mb-4 mt-8 font-semibold">Agent 回答</h3>
                  <p class="rounded-lg bg-gray-50 p-4 leading-7">
                    {{ currentCase.answer || '执行测试后展示回答' }}
                  </p>
                  <p class="mt-5 text-gray-500">
                    结果判断：{{ currentCase.status }}
                  </p>
                </div>
                <div class="detail-surface p-5">
                  <h3 class="mb-4 font-semibold">调用证据</h3>
                  <p
                    class="whitespace-pre-wrap break-words leading-8 text-gray-500"
                  >
                    {{
                      currentCase?.evidence ||
                      '执行测试后展示解析身份、采用来源、数据时间与来源单据。'
                    }}
                  </p>
                </div>
              </div>
            </TabPane>
            <TabPane key="releases" tab="发布记录">
              <Table
                :data-source="entity.releases"
                :columns="[
                  { title: '版本', dataIndex: 'version' },
                  { title: '发布时间', dataIndex: 'time' },
                  { title: '开放服务', key: 'services' },
                  { title: '配置修订', dataIndex: 'revision' },
                ]"
                row-key="version"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'services'">
                    <Tag v-for="s in record.services" :key="s">{{ s }}</Tag>
                  </template>
                </template>
              </Table>
            </TabPane>
          </Tabs>
        </Card>
      </div>
      <div
        class="workbench-footer fixed bottom-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-3 px-8 py-3"
      >
        <span class="text-gray-500">
          {{ saving ? '保存中…' : saved }} · 草稿 {{ entity.version }}
        </span>
        <div class="flex gap-3">
          <Button :loading="saving" @click="save">保存草稿</Button>
          <Button
            :disabled="tab === 'sources'"
            @click="
              selectTab(
                steps[Math.max(0, steps.findIndex((s) => s.key === tab) - 1)]
                  ?.key || 'sources',
              )
            "
          >
            上一步
          </Button>
          <Button v-if="tab !== 'services'" type="primary" @click="next">
            下一步：{{
              steps[steps.findIndex((s) => s.key === tab) + 1]?.title
            }}
          </Button>
          <Button v-else type="primary" @click="publishOpen = true">
            检查并发布
          </Button>
        </div>
      </div>
      <Modal v-model:open="linked" title="关联已有数据源" @ok="associate">
        <p class="mb-4 text-gray-500">
          选择平台已有数据源，返回工作台增量配置。
        </p>
        <Select
          v-model:value="selectedSystem"
          class="w-full"
          :options="
            ['设备系统', '运维系统'].map((value) => ({
              value,
              label: `${value} · 连接正常`,
            }))
          "
        />
        <p class="mt-4 text-gray-400">
          Demo 提供两个可用数据源；真实连接需对接数据源管理。
        </p>
      </Modal>
      <Modal
        v-model:open="sourceModal"
        title="手动添加源对象"
        @ok="manualObject"
      >
        <Form layout="vertical">
          <FormItem label="对象名称">
            <Input v-model:value="manual.name" />
          </FormItem>
          <FormItem label="业务说明">
            <Input v-model:value="manual.description" />
          </FormItem>
          <FormItem label="字段结构（英文逗号分隔）">
            <Input v-model:value="manual.fields" />
          </FormItem>
        </Form>
      </Modal>
      <Modal v-model:open="addAttribute" title="新增属性" @ok="createAttribute">
        <Form layout="vertical">
          <FormItem label="属性名称">
            <Input v-model:value="attrForm.name" />
          </FormItem>
          <FormItem label="属性标识">
            <Input v-model:value="attrForm.id" />
          </FormItem>
          <FormItem label="类型">
            <Select
              v-model:value="attrForm.type"
              :options="
                ['文本', '整数', '日期', '布尔'].map((value) => ({
                  value,
                  label: value,
                }))
              "
            />
          </FormItem>
          <FormItem label="属性组">
            <Input v-model:value="attrForm.group" />
          </FormItem>
        </Form>
      </Modal>
      <Drawer v-model:open="attrOpen" title="属性配置" :width="420">
        <Form v-if="attribute" layout="vertical">
          <FormItem label="属性名称">
            <Input v-model:value="attribute.name" />
          </FormItem>
          <FormItem label="属性标识">
            <Input :value="attribute.id" disabled />
          </FormItem>
          <FormItem label="数据类型">
            <Select
              v-model:value="attribute.type"
              :options="
                ['文本', '整数', '日期', '布尔'].map((value) => ({
                  value,
                  label: value,
                }))
              "
            />
          </FormItem>
          <FormItem label="属性组">
            <Input v-model:value="attribute.group" />
          </FormItem>
          <FormItem label="允许为空">
            <Switch
              v-model:checked="attribute.nullable"
              :disabled="attribute.id === entity.attributes[0]?.id"
            />
          </FormItem>
          <FormItem label="身份用途">
            {{
              attribute.id === entity.attributes[0]?.id
                ? '业务唯一标识'
                : '普通业务属性'
            }}
          </FormItem>
          <FormItem label="开启动态追溯">
            <Switch
              v-model:checked="attribute.dynamic"
              :disabled="attribute.id === entity.attributes[0]?.id"
            />
          </FormItem>
          <FormItem v-if="attribute.dynamic" label="历史属于本次必需能力">
            <Switch v-model:checked="attribute.historyRequired" />
          </FormItem>
          <FormItem label="业务别名">
            <Input
              v-model:value="attribute.alias"
              placeholder="例如：扫描器型号"
            />
          </FormItem>
          <Alert
            class="mb-4"
            type="info"
            message="保存后受影响映射、身份与服务测试需重新验证"
          />
          <Button type="primary" @click="applyAttribute">确认并保存</Button>
        </Form>
      </Drawer>
      <Drawer v-model:open="mappingOpen" title="映射配置与试运行" :width="540">
        <Form v-if="attribute" layout="vertical">
          <h3 class="mb-4 font-semibold">{{ attribute.name }} · 来源映射</h3>
          <FormItem label="权威来源系统">
            <Select
              v-model:value="attribute.source"
              :options="
                entity.sources.map((value) => ({ value, label: value }))
              "
            />
          </FormItem>
          <FormItem label="来源字段">
            <Select
              v-model:value="attribute.field"
              show-search
              :options="
                entity.objects
                  .filter(
                    (o) =>
                      o.status === '已确认' && o.system === attribute?.source,
                  )
                  .flatMap((o) =>
                    o.fields.map((f) => ({
                      value: `${o.name}.${f.split('（')[0]}`,
                      label: `${o.name}.${f.split('（')[0]}`,
                    })),
                  )
              "
            />
          </FormItem>
          <p class="mb-4 text-gray-500">
            设备定位参数：{{
              entity.uniqueKey
            }}，精确匹配；类型按实体模型转换，空值保持为空。
          </p>
          <FormItem label="当前值获取方式">
            <Select
              v-model:value="attribute.strategy"
              :options="
                ['身份同步', '实时查询', '事件同步'].map((value) => ({
                  value,
                  label: value,
                }))
              "
            />
          </FormItem>
          <Alert
            class="mb-4"
            message="来源不可用时明确返回不可用；未配置备用来源或缓存。"
            type="info"
          />
          <FormItem label="历史策略">
            <Select
              v-model:value="attribute.history"
              :disabled="!attribute.dynamic"
              :options="
                ['不开放历史', '查询来源历史', '平台记录变更'].map((value) => ({
                  value,
                  label: value,
                }))
              "
            />
          </FormItem>
          <template v-if="attribute.history !== '不开放历史'">
            <FormItem label="可靠历史 / 变更事件对象">
              <Select
                v-model:value="attribute.historyObject"
                allow-clear
                :options="
                  entity.objects
                    .filter(
                      (o) =>
                        o.status === '已确认' && o.name === 'repair_changes',
                    )
                    .map((o) => ({
                      value: o.name,
                      label: `${o.name} · 维修变更事件`,
                    }))
                "
              />
            </FormItem>
            <Descriptions size="small" :column="1">
              <DescriptionsItem label="身份 / 属性">
                dev_no / attribute
              </DescriptionsItem>
              <DescriptionsItem label="时间 / 原值 / 新值">
                effective_at / old_value / new_value
              </DescriptionsItem>
              <DescriptionsItem label="事件 / 原因 / 单据">
                event_id / reason / work_order
              </DescriptionsItem>
              <DescriptionsItem label="起始范围">2026-09-01</DescriptionsItem>
              <DescriptionsItem
                v-if="attribute.history === '平台记录变更'"
                label="采集规则"
              >
                可靠维修事件，按 event_id
                去重，业务时间排序；接收时间单独记录；初始快照 2026-09-01，保留
                3 年
              </DescriptionsItem>
            </Descriptions>
            <Alert
              class="my-4"
              type="warning"
              message="定期快照只能代表检测到变化的时间，不作为实际维修时间。"
            />
          </template>
          <div class="mt-5 flex gap-2">
            <Input v-model:value="testCode" placeholder="输入设备编号" />
            <Button @click="testMapping">测试映射</Button>
          </div>
          <p class="my-4 rounded bg-gray-50 p-3 text-sm">
            {{ mapResult || '试运行展示源值、转换后值、采用来源与更新时间' }}
          </p>
          <Button type="primary" @click="applyAttribute">保存映射配置</Button>
        </Form>
      </Drawer>
      <Modal v-model:open="preview" title="注册预览" :footer="null">
        <Descriptions :column="1">
          <DescriptionsItem label="将新建实体">
            {{ registrationPreview.newEntities }}
          </DescriptionsItem>
          <DescriptionsItem label="增加来源关联">
            {{ registrationPreview.newLinks }}
          </DescriptionsItem>
          <DescriptionsItem label="无法处理记录">
            0（当前模拟样例）
          </DescriptionsItem>
          <DescriptionsItem label="现有身份影响">
            不改变现有 Entity ID
          </DescriptionsItem>
        </Descriptions>
        <Alert
          class="my-4"
          type="info"
          message="缺失、重复或冲突编号会进入待处理；本批次样例无身份异常。"
        />
        <Button type="primary" @click="register">确认开始注册</Button>
      </Modal>
      <Drawer
        :open="!!device"
        :title="`${device?.code} · 实体详情`"
        :width="720"
        @close="device = undefined"
      >
        <template v-if="device">
          <Descriptions :column="2">
            <DescriptionsItem label="Entity ID">
              {{ device.id }}
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              {{ device.status }}
            </DescriptionsItem>
          </Descriptions>
          <Tabs v-model:active-key="detailTab">
            <TabPane key="current" tab="当前属性">
              <Table
                :data-source="deviceValues"
                :columns="[
                  { title: '属性', dataIndex: 'name' },
                  { title: '属性组', dataIndex: 'group' },
                  { title: '当前值', dataIndex: 'value' },
                  { title: '采用来源', dataIndex: 'source' },
                  { title: '更新时间', dataIndex: 'time' },
                ]"
                :pagination="false"
                row-key="name"
              />
            </TabPane>
            <TabPane key="history" tab="变更历史">
              <div v-if="deviceHistory.length > 0" class="space-y-4">
                <Card
                  v-for="event in deviceHistory"
                  :key="event.id"
                  :title="`${event.effectiveAt} · ${event.reason}`"
                >
                  <p v-for="change in event.changes" :key="change.attribute">
                    {{ change.name }}：{{ change.oldValue }} →
                    {{ change.newValue }}
                  </p>
                  <p class="mt-3 text-gray-500">
                    来源：{{ event.source }} / {{ event.object }} · 事件
                    {{ event.id }} · 工单 {{ event.document }}
                  </p>
                </Card>
              </div>
              <Empty v-else description="当前值可查询；历史数据暂不可用。" />
            </TabPane>
            <TabPane key="sources" tab="来源记录">
              <Descriptions :column="1">
                <DescriptionsItem
                  v-for="source in deviceSources"
                  :key="source.system + source.object"
                  :label="source.system"
                >
                  {{ source.object }} · 来源主键 {{ source.primaryKey }} ·
                  {{ entity.uniqueKey }}精确匹配 · 更新时间
                  {{ source.updatedAt }}
                </DescriptionsItem>
              </Descriptions>
            </TabPane>
            <TabPane key="relations" tab="业务关系">
              <Table
                v-if="deviceRelations.length > 0"
                :data-source="deviceRelations"
                :pagination="false"
                :row-key="(row) => row.relationId + row.targetId"
                :columns="[
                  { title: '关系', dataIndex: 'relationName' },
                  { title: '关联对象', dataIndex: 'targetName' },
                  { title: '业务编号', dataIndex: 'targetCode' },
                  { title: 'Entity ID', dataIndex: 'targetId' },
                  { title: '生效版本', dataIndex: 'targetVersion' },
                  { title: '来源', dataIndex: 'object' },
                ]"
                :scroll="{ x: 650 }"
              />
              <Empty
                v-else
                :description="
                  entity.relations.some((r) => r.enabled)
                    ? '该实体没有可用关联记录'
                    : '本次关系暂不开放'
                "
              />
            </TabPane>
          </Tabs>
        </template>
      </Drawer>
      <Drawer v-model:open="publishOpen" title="发布摘要" :width="560">
        <Descriptions :column="1">
          <DescriptionsItem label="草稿版本">
            {{ entity.version }} · 修订 {{ entity.revision }}
          </DescriptionsItem>
          <DescriptionsItem label="模型与映射">
            {{ entity.attributes.length }} 个属性，{{
              entity.attributes.filter((a) => a.verified).length
            }}
            个映射已验证
          </DescriptionsItem>
          <DescriptionsItem label="开放服务">
            {{
              services
                .filter((s) => s.status === '可测试')
                .map((s) => s.id)
                .join('、')
            }}
          </DescriptionsItem>
          <DescriptionsItem label="授权范围">
            {{ entity.role }} / {{ entity.scope }}
          </DescriptionsItem>
          <DescriptionsItem label="验证结果">
            {{ entity.cases.filter((c) => c.status === '通过').length }}
            通过，{{ entity.cases.filter((c) => c.status === '不适用').length }}
            不适用
          </DescriptionsItem>
          <DescriptionsItem label="未开放事项">
            {{
              [
                ...entity.relations
                  .filter((r) => !r.enabled)
                  .map((r) => r.name),
                ...(!historyEnabled ? ['历史能力'] : []),
              ].join('、') || '无'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="生效影响">
            {{
              entity.activeVersion
                ? `发布后替换当前 ${entity.activeVersion}`
                : '首次发布'
            }}；Entity ID 保持不变
          </DescriptionsItem>
          <DescriptionsItem label="工具协议">
            {{ entity.protocol }}
          </DescriptionsItem>
        </Descriptions>
        <Alert
          class="my-5"
          :type="blockers.length > 0 ? 'warning' : 'success'"
          :message="
            blockers.length > 0
              ? blockers.join('；')
              : '检查通过，发布后正式 Agent 可使用本版本能力'
          "
        />
        <Button
          type="primary"
          :disabled="
            blockers.length > 0 ||
            entity.releases.at(-1)?.revision === entity.revision
          "
          :loading="saving"
          @click="publish"
        >
          发布并生效
        </Button>
      </Drawer>
    </div>
  </Spin>
</template>
<style scoped>
.entity-workbench {
  --work-surface: hsl(var(--card));
  --work-border: hsl(var(--border));
  --work-accent: hsl(var(--primary));
  --work-soft: hsl(var(--primary) / 6.5%);
  --work-text: hsl(var(--foreground));
  --work-muted: hsl(var(--muted-foreground));

  color: var(--work-text);
}

.entity-header {
  padding: 2px 0;
}

.entity-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--work-accent);
  background: var(--work-soft);
  border: 1px solid hsl(var(--primary) / 12%);
  border-radius: 11px;
}

.step-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px;
  background: hsl(var(--muted) / 55%);
  border: 1px solid var(--work-border);
  border-radius: 12px;
}

.step-button {
  flex: 1 1 170px;
  min-width: 0;
  padding: 10px 12px;
  color: var(--work-muted);
  border: 1px solid transparent;
  border-radius: 8px;
  transition:
    background-color 0.16s,
    color 0.16s,
    box-shadow 0.16s;
}

.step-button:hover {
  color: var(--work-text);
  background: hsl(var(--card) / 65%);
}

.step-button.is-active {
  color: var(--work-accent);
  background: var(--work-surface);
  border-color: hsl(var(--primary) / 13%);
  box-shadow: 0 2px 6px hsl(var(--foreground) / 4%);
}

.step-symbol {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: hsl(var(--foreground) / 3.5%);
  border-radius: 8px;
}

.is-active .step-symbol {
  color: hsl(var(--primary-foreground));
  background: var(--work-accent);
}

.is-complete:not(.is-active) .step-symbol {
  color: var(--work-accent);
  background: var(--work-soft);
}

.step-status {
  font-size: 11px;
  white-space: nowrap;
}

.step-context {
  min-height: 32px;
  padding: 0 2px;
}

.step-summary {
  padding: 4px 9px;
  font-variant-numeric: tabular-nums;
  color: var(--work-muted);
  background: hsl(var(--muted) / 65%);
  border-radius: 6px;
}

.step-help {
  max-width: min(360px, calc(100vw - 48px));
}

.entity-workbench :deep(.ant-card) {
  background: var(--work-surface);
  border: 1px solid var(--work-border);
  border-radius: 12px;
  box-shadow: 0 3px 12px hsl(var(--foreground) / 2.5%);
}

.entity-workbench :deep(.ant-card-head) {
  min-height: 46px;
  padding: 0 18px;
  border-bottom: 1px solid hsl(var(--border) / 65%);
}

.entity-workbench :deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.entity-workbench :deep(.ant-card-body) {
  padding: 18px;
}

.entity-workbench :deep(.ant-btn) {
  border-radius: 7px;
}

.entity-workbench :deep(.ant-btn-primary:not(:disabled)) {
  box-shadow: 0 3px 7px hsl(var(--primary) / 14%);
}

.entity-workbench :deep(.ant-input),
.entity-workbench :deep(.ant-select-selector) {
  border-radius: 7px;
}

.entity-workbench :deep(.ant-tag) {
  border-radius: 5px;
}

.entity-workbench :deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  font-weight: 500;
  color: var(--work-muted);
  background: hsl(var(--muted) / 50%);
  border-bottom-color: var(--work-border);
}

.entity-workbench :deep(.ant-table-tbody > tr > td) {
  padding-top: 15px;
  padding-bottom: 15px;
  border-bottom-color: hsl(var(--border) / 65%);
}

.entity-workbench :deep(.ant-table-tbody > tr.workbench-row-selected > td) {
  background: var(--work-soft);
}

.entity-workbench
  :deep(.ant-table-tbody > tr.workbench-row-selected > td:first-child) {
  box-shadow: inset 3px 0 var(--work-accent);
}

.entity-workbench :deep(.ant-tabs-nav::before) {
  border-bottom-color: hsl(var(--border) / 70%);
}

.source-choice,
.group-choice,
.mapping-filter,
.service-choice,
.case-choice {
  background: var(--work-surface);
  border: 1px solid var(--work-border);
  border-radius: 9px;
  transition:
    background-color 0.16s,
    border-color 0.16s;
}

.source-choice:hover,
.group-choice:hover,
.mapping-filter:hover,
.service-choice:hover,
.case-choice:hover {
  background: hsl(var(--muted) / 45%);
  border-color: hsl(var(--primary) / 25%);
}

.source-choice.is-selected,
.service-choice.is-selected,
.case-choice.is-selected {
  background: var(--work-soft);
  border-color: hsl(var(--primary) / 25%);
  box-shadow: inset 3px 0 var(--work-accent);
}

.group-choice {
  border-color: transparent;
}

.group-choice.is-selected,
.mapping-filter.is-selected {
  color: var(--work-accent);
  background: var(--work-soft);
  border-color: hsl(var(--primary) / 18%);
}

.detail-surface {
  background: var(--work-surface);
  border: 1px solid var(--work-border);
  border-radius: 10px;
}

.workbench-footer {
  background: hsl(var(--card) / 94%);
  border-top: 1px solid hsl(var(--border));
  box-shadow: 0 -3px 14px hsl(var(--foreground) / 3.5%);
  backdrop-filter: blur(12px);
}

.work-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 320px;
  gap: 16px;
}

.model-grid {
  grid-template-columns: 180px minmax(0, 1fr);
}

@media (max-width: 1200px) {
  .work-grid,
  .model-grid {
    grid-template-columns: 1fr;
  }

  .entity-workbench {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-button,
  .source-choice,
  .group-choice,
  .mapping-filter,
  .service-choice,
  .case-choice {
    transition: none;
  }
}
</style>
