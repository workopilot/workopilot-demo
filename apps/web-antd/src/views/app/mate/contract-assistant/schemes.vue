<script setup lang="ts">
import type { AuditRule, AuditScheme } from '#/types/audit';
import type {
  ContractManagementConfig,
  ContractScheme,
} from '#/types/contract-assistant';
import type { NotificationTemplate } from '#/types/platform';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import { getAuditRulesApi, getAuditSchemesApi } from '#/api/audit';
import {
  getContractSchemes,
  saveContractScheme,
  setContractCategoryEnabled,
} from '#/api/mock-contract-assistant';
import { createContractManagementDefaults } from '#/api/mock-data';
import { getNotificationTemplatesApi } from '#/api/platform';
import { deepClone } from '#/utils/deep-clone';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import ContractExpirySimple from './components/contract-expiry-simple.vue';
import ContractExtractionEditor from './components/contract-extraction-editor.vue';
import {
  defaultContractExtraction,
  validateExtraction,
} from './utils/contract-extraction';
import {
  defaultExpiryActions,
  templatePresets,
} from './utils/implementation-presets';
import {
  defaultContractMessageTemplateId,
  supportsContractMessageTemplate,
} from './utils/message-template';

const schemes = ref<ContractScheme[]>([]);
const messageTemplates = ref<NotificationTemplate[]>([]);
const auditRules = ref<AuditRule[]>([]);
const auditSchemes = ref<AuditScheme[]>([]);
const loading = ref(false);
const busy = ref(false);
const open = ref(false);
const readOnly = ref(false);
const historyOpen = ref(false);
const historyCategory = ref('');
const publishOpen = ref(false);
const publishNote = ref('');
const historyRows = computed(() =>
  schemes.value
    .filter(
      (item) =>
        !historyCategory.value ||
        (item.management?.categoryKey || item.id) === historyCategory.value,
    )
    .toSorted((a, b) => b.version - a.version),
);
const historyColumns = [
  { title: '合同类型', dataIndex: 'name' },
  { title: '版本', key: 'version', width: 75 },
  { title: '状态', key: 'status', width: 90 },
  { title: '发布时间', key: 'date', width: 145 },
  { title: '发布人', key: 'publisher', width: 110 },
  { title: '发布说明', key: 'note' },
  { title: '操作', key: 'action', width: 100 },
];
function releaseOf(item: ContractScheme) {
  return item.releases.find((release) => release.version === item.version);
}
function showHistory(item?: ContractScheme) {
  historyCategory.value = item?.management?.categoryKey || item?.id || '';
  historyOpen.value = true;
}
function viewVersion(item: ContractScheme) {
  draft.value = deepClone(item);
  config.value = deepClone(
    item.management || createContractManagementDefaults(item.id),
  );
  config.value.extraction ||= defaultContractExtraction(
    draft.value?.contractCategory,
  );
  config.value.mappings.forEach((mapping) => {
    mapping.path ||= mapping.source.slice(mapping.source.indexOf(':') + 1);
  });
  readOnly.value = true;
  historyOpen.value = false;
  step.value = 0;
  open.value = true;
}
function requestPublish() {
  if (issues.value.length > 0) {
    message.warning(issues.value[0]);
    return;
  }
  publishNote.value = '';
  publishOpen.value = true;
}

const step = ref(0);
const query = ref('');
const filter = ref('all');
const draft = ref<ContractScheme>();
const config = ref<ContractManagementConfig>();
const useCategoryDefaults = ref(false);
function changeContractCategory() {
  if (!config.value || !draft.value) return;
  if (useCategoryDefaults.value) {
    const name = draft.value.name;
    const code = config.value.code;
    applyPreset(draft.value.contractCategory || '');
    if (name.trim()) draft.value.name = name;
    if (code.trim()) config.value.code = code;
    message.success('已带入本大类推荐配置，可继续调整');
  } else {
    message.info('已更换大类，现有配置已保留；可按需使用新大类推荐配置');
  }
}
function restoreCategoryDefaults() {
  if (!draft.value?.contractCategory || !config.value || readOnly.value) return;
  Modal.confirm({
    title: '使用本大类推荐配置？',
    content:
      '将替换当前提取字段、审核方案和变更到期规则，保留合同类型名称、编码及识别说明。',
    okText: '替换配置',
    cancelText: '保留现有配置',
    onOk: () => {
      if (!draft.value || !config.value) return;
      const { name, scope, purpose } = draft.value;
      const code = config.value.code;
      applyPreset(draft.value.contractCategory || '');
      Object.assign(draft.value, { name, scope, purpose });
      config.value.code = code;
      message.success('已使用本大类推荐配置');
    },
  });
}
const originalStatus = ref<ContractScheme['status']>('draft');
const contractCategories = [
  { value: 'sales', label: '销售类' },
  { value: 'purchase', label: '采购类' },
  { value: 'service', label: '服务类' },
];
function contractCategoryLabel(value?: string) {
  return (
    contractCategories.find((item) => item.value === value)?.label || '未选择'
  );
}
const steps = ['类型定义', '信息提取与智能审核', '变更与到期管理'];
function applyPreset(category: string) {
  const preset = templatePresets.find((item) => item.value === category);
  if (!preset || !draft.value || !config.value) return;
  draft.value.contractCategory = preset.value;
  draft.value.name = preset.name;
  draft.value.scope = preset.scope;
  draft.value.purpose = preset.purpose;
  config.value.code = `${category.toUpperCase()}_${Date.now().toString().slice(-6)}`;
  config.value.extraction = defaultContractExtraction(category);
  config.value.audit = {
    mode: 'intelligent',
    schemeId: 'contract-general',
    resultHandling:
      '阻断问题解决后才能建档；警告与无法判断事项需说明人工核对结果。',
  };
  config.value.lifecycle.automaticRenewal = 'none';
  config.value.lifecycle.startBasis = 'contract';
  config.value.lifecycle.expiryBasis = 'contract';
  config.value.lifecycle.actions = defaultExpiryActions(draft.value.id);
  config.value.lifecycle.renewalInstructions =
    '由合同负责人评估并确认是否续约，续签后关联新旧合同。';
  config.value.lifecycle.changeHandling =
    '日期变化后重算尚未触发事项；变更、终止或作废时核对未完成履约事项，保留已发生的业务记录。';
  useCategoryDefaults.value = false;
}
function copyTemplate(source: ContractScheme) {
  edit(source);
  if (!draft.value || !config.value) return;
  draft.value.id = `template-copy-${Date.now()}-${++categorySequence}`;
  draft.value.version = 1;
  draft.value.releases = [];
  draft.value.name = `${source.name}（副本）`;
  draft.value.status = 'draft';
  draft.value.enabled = true;
  config.value.categoryKey = draft.value.id;
  config.value.code = `${source.management?.code || 'TEMPLATE'}_COPY_${Date.now().toString().slice(-4)}`;
  originalStatus.value = 'draft';
}
const allAuditRules = computed(() =>
  (
    auditSchemes.value.find((item) => item.id === config.value?.audit.schemeId)
      ?.rules || []
  ).map((item) => ({
    ...item,
    rule: auditRules.value.find((rule) => rule.id === item.ruleId),
  })),
);
const selectedAuditRules = computed(() =>
  allAuditRules.value.filter(
    (item) =>
      !config.value?.audit.ruleIds ||
      config.value.audit.ruleIds.includes(item.ruleId),
  ),
);
function toggleAuditRule(id: string, checked: boolean) {
  if (!config.value) return;
  const ids =
    config.value.audit.ruleIds ||
    allAuditRules.value.map((item) => item.ruleId);
  config.value.audit.ruleIds = checked
    ? [...new Set([id, ...ids])]
    : ids.filter((value) => value !== id);
}
const latest = computed(() => {
  const values = new Map<string, ContractScheme>();
  for (const item of schemes.value) {
    const key = item.management?.categoryKey || item.id;
    if (!values.has(key) || item.version >= values.get(key)!.version)
      values.set(key, item);
  }
  return [...values.values()];
});
const rows = computed(() =>
  latest.value.filter(
    (item) =>
      (!query.value.trim() ||
        `${item.name} ${item.management?.code || ''}`.includes(
          query.value.trim(),
        )) &&
      (filter.value === 'all' ||
        (filter.value === 'enabled'
          ? categoryEnabled(item)
          : !categoryEnabled(item))),
  ),
);
const columns = [
  { title: '合同类型', key: 'name', width: '21%' },
  { title: '所属大类', key: 'contractCategory', width: '8%' },
  { title: '提取字段', key: 'extraction', width: '15%' },
  { title: '审核方式', key: 'audit', width: '16%' },
  { title: '版本', key: 'version', width: '12%' },
  { title: '状态', key: 'enabled', width: '8%' },
  { title: '更新时间', dataIndex: 'updatedAt', width: '9%' },
  { title: '操作', key: 'action', width: '11%' },
];
const statuses = { draft: '草稿', published: '已发布', disabled: '已停用' };
const switchingId = ref('');
function categoryEnabled(item: ContractScheme) {
  return item.enabled ?? item.status !== 'disabled';
}
async function toggleCategory(item: ContractScheme, value: boolean) {
  switchingId.value = item.id;
  try {
    await setContractCategoryEnabled(item.id, value);
    const response = await getContractSchemes();
    schemes.value = response.data;
    message.success(value ? '合同类型已启用' : '合同类型已停用');
  } catch {
    message.error('状态更新失败，请重试');
  } finally {
    switchingId.value = '';
  }
}
function effectiveVersion(item: ContractScheme) {
  const key = item.management?.categoryKey || item.id;
  const released = schemes.value
    .filter(
      (value) =>
        (value.management?.categoryKey || value.id) === key &&
        value.status !== 'draft',
    )
    .toSorted((a, b) => b.version - a.version)[0];
  return released?.status === 'published' ? `V${released.version}` : null;
}
function row(record: Record<string, unknown>): ContractScheme {
  const item = schemes.value.find((item) => item.id === record.id);
  if (!item) throw new Error('未找到合同类型');
  return item;
}
function auditName(item: ContractScheme) {
  return (
    auditSchemes.value.find(
      (scheme) => scheme.id === item.management?.audit.schemeId,
    )?.name || '未选择审核方案'
  );
}
const issues = computed(() => {
  if (!draft.value || !config.value) return [];
  const errors: string[] = [];
  if (!draft.value.name.trim()) errors.push('请填写合同类型名称');
  if (
    !contractCategories.some(
      (item) => item.value === draft.value!.contractCategory,
    )
  )
    errors.push('请选择所属大类');
  if (!config.value.code.trim()) errors.push('请填写类型编码');
  if (
    latest.value.some(
      (item) =>
        (item.management?.categoryKey || item.id) !==
          config.value!.categoryKey &&
        item.management?.code === config.value!.code,
    )
  )
    errors.push('类型编码已被使用');
  if (
    config.value.audit.mode === 'intelligent' &&
    !auditSchemes.value.some((item) => item.id === config.value!.audit.schemeId)
  )
    errors.push('请选择有效的智能审核方案');
  if (
    config.value.audit.mode === 'intelligent' &&
    (selectedAuditRules.value.length === 0 ||
      selectedAuditRules.value.some(
        (item) => !item.rule || item.rule.status !== 'active',
      ))
  )
    errors.push('审核方案中没有可用审核事项，或引用事项已停用');
  errors.push(...validateExtraction(config.value.extraction || []));
  if (
    config.value.lifecycle.automaticRenewal !== 'none' &&
    !config.value.lifecycle.renewalInstructions.trim()
  )
    errors.push('请填写续约处理要求');
  if (
    config.value.lifecycle.actions.some(
      (action) => action.action === 'message',
    ) &&
    !messageTemplates.value.some(
      (template) =>
        template.id ===
          (config.value!.lifecycle.reminderTemplateId ||
            defaultContractMessageTemplateId) &&
        supportsContractMessageTemplate(template),
    )
  )
    errors.push('请选择可用的合同消息模版');
  const actionKeys = new Set<string>();
  for (const [index, action] of config.value.lifecycle.actions.entries()) {
    const signature = `${action.purpose || ''}|${action.trigger}|${action.days}|${action.action}|${action.recipients.toSorted().join(',')}`;
    if (actionKeys.has(signature))
      errors.push('存在时间、处理方式和接收人相同的重复到期事项');
    actionKeys.add(signature);
    const prefix = `到期事项 ${index + 1}：`;
    if (!action.name.trim()) errors.push(`${prefix}请填写事项名称`);
    if (
      action.recipients.length === 0 ||
      action.recipients.some((value) => !value.trim())
    )
      errors.push(`${prefix}请选择接收人或责任角色`);
    if (
      ['after-expiry', 'before-expiry'].includes(action.trigger) &&
      (!Number.isInteger(action.days) || action.days < 1 || action.days > 3650)
    )
      errors.push(`${prefix}提前或延后天数须为1至3650的整数`);
    if (
      action.action === 'renewal-draft' &&
      action.trigger !== 'renewal-confirmed'
    )
      errors.push(`${prefix}续签草稿应在人工确认续约后生成`);
    if (!action.description.trim()) errors.push(`${prefix}请填写处理要求`);
  }
  return errors;
});
async function load() {
  loading.value = true;
  try {
    const [list, audit, rules, templates] = await Promise.all([
      getContractSchemes(),
      getAuditSchemesApi(),
      getAuditRulesApi(),
      getNotificationTemplatesApi(),
    ]);
    schemes.value = list.data;
    messageTemplates.value = templates.data;
    auditSchemes.value = audit.data;
    auditRules.value = rules.data;
  } catch {
    message.error('配置加载失败，请重试');
  } finally {
    loading.value = false;
  }
}
let categorySequence = 0;
function edit(source?: ContractScheme) {
  useCategoryDefaults.value = !source;
  readOnly.value = false;
  if (source) {
    const key = source.management?.categoryKey || source.id;
    source =
      schemes.value.find(
        (item) =>
          (item.management?.categoryKey || item.id) === key &&
          item.status === 'draft',
      ) || source;
  }
  const id = `category-${Date.now()}-${++categorySequence}`;
  draft.value = source
    ? deepClone(source)
    : {
        id,
        name: '',
        purpose: '',
        scope: '',
        owner: '实施管理员',
        categoryIds: [],
        fields: [],
        version: 1,
        status: 'draft',
        updatedAt: '',
        releases: [],
      };
  config.value = deepClone(
    source?.management || createContractManagementDefaults(source?.id || id),
  );
  if (!source) {
    config.value.code = '';
    config.value.mappings = [];
  }
  originalStatus.value = source?.status || 'draft';
  if (source && source.status !== 'draft') {
    draft.value.id = id;
    draft.value.version =
      Math.max(
        ...schemes.value
          .filter(
            (item) =>
              (item.management?.categoryKey || item.id) ===
              config.value!.categoryKey,
          )
          .map((item) => item.version),
      ) + 1;
  }
  config.value.extraction ||= defaultContractExtraction(
    draft.value?.contractCategory,
  );
  config.value.mappings.forEach((mapping) => {
    mapping.path ||= mapping.source.slice(mapping.source.indexOf(':') + 1);
  });
  step.value = 0;
  open.value = true;
}
function close() {
  if (readOnly.value) {
    open.value = false;
    return;
  }
  Modal.confirm({
    title: '关闭配置？',
    content: '未保存的修改将丢失。',
    okText: '关闭',
    cancelText: '继续编辑',
    onOk: () => {
      open.value = false;
    },
  });
}
async function save(publish: boolean) {
  if (!draft.value || !config.value || readOnly.value || busy.value) return;
  if (publish && issues.value.length > 0) {
    message.warning(issues.value[0]);
    return;
  }
  if (
    !contractCategories.some(
      (item) => item.value === draft.value!.contractCategory,
    )
  ) {
    message.warning('请选择所属大类');
    return;
  }
  if (!draft.value.name.trim()) {
    message.warning('请填写合同类型名称');
    return;
  }
  busy.value = true;
  try {
    const data = deepClone(draft.value);
    data.name = data.name.trim();
    data.fields = (config.value.extraction || []).map((field) => field.key);
    data.management = deepClone(config.value);
    delete data.management.fulfillment;
    data.categoryIds = [];
    data.management.mappings = [];
    data.management.code = data.management.code.trim();
    data.updatedAt = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Shanghai',
    });
    data.status = publish ? 'published' : 'draft';
    if (publish)
      data.releases.push({
        version: data.version,
        date: data.updatedAt,
        owner: data.owner,
        note: publishNote.value.trim() || '发布合同类型管理配置',
      });
    await saveContractScheme(data);
    const response = await getContractSchemes();
    schemes.value = response.data;
    open.value = false;
    publishOpen.value = false;
    message.success(publish ? '合同类型配置已发布' : '草稿已保存');
  } catch {
    message.error('保存失败，请重试');
  } finally {
    busy.value = false;
  }
}
onMounted(load);
</script>

<template>
  <AiWorkPage
    :title="open ? '配置合同类型' : '合同类型管理'"
    icon="lucide:settings-2"
    description="按合同类型定义提取内容、智能审核及变更到期规则。"
  >
    <template #title-suffix>
      <Tag v-if="!open">{{ latest.length }}</Tag>
    </template>
    <template #actions>
      <Button v-if="!open" @click="showHistory()">
        <Icon icon="lucide:history" />
        发布与版本记录
      </Button>
      <Button v-if="!open" type="primary" @click="edit()">
        <Icon icon="lucide:plus" />
        新增合同类型
      </Button>
      <Button v-else :disabled="busy" @click="close">
        <Icon icon="lucide:arrow-left" />
        返回类型列表
      </Button>
    </template>
    <div v-if="!open" class="category-page">
      <section class="category-list">
        <header class="list-toolbar">
          <h2>合同类型</h2>
          <div>
            <Input
              v-model:value="query"
              allow-clear
              placeholder="搜索类型名称或编码"
            />
            <Select
              v-model:value="filter"
              :options="[
                { value: 'all', label: '全部状态' },
                { value: 'enabled', label: '已启用' },
                { value: 'disabled', label: '已停用' },
              ]"
            />
          </div>
        </header>
        <Table
          :columns="columns"
          :data-source="rows"
          :loading="loading"
          row-key="id"
          class="category-table"
          table-layout="fixed"
          size="small"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <strong>{{ record.name }}</strong>
              <small>
                {{ record.management?.code || '未填写编码' }}
              </small>
            </template>
            <template v-else-if="column.key === 'contractCategory'">
              {{ contractCategoryLabel(record.contractCategory) }}
            </template>
            <template v-else-if="column.key === 'extraction'">
              {{ record.management?.extraction?.length || 0 }} 个字段
            </template>
            <template v-else-if="column.key === 'audit'">
              {{
                record.management?.audit.mode === 'intelligent'
                  ? '智能审核'
                  : '不审核'
              }}
              <small v-if="record.management?.audit.mode === 'intelligent'">
                {{ auditName(row(record)) }}
              </small>
            </template>
            <template v-else-if="column.key === 'version'">
              <div class="cell-version">
                <div
                  v-if="effectiveVersion(row(record))"
                  class="cell-version__row"
                >
                  <span class="cell-version__num">
                    {{ effectiveVersion(row(record)) }}
                  </span>
                  <Tag color="green" class="cell-version__tag">生效</Tag>
                </div>
                <span v-else class="cell-version__empty">生效版本 —</span>
                <div v-if="record.status === 'draft'" class="cell-version__row">
                  <span class="cell-version__num">V{{ record.version }}</span>
                  <Tag color="orange" class="cell-version__tag">配置中</Tag>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'enabled'">
              <Switch
                :checked="categoryEnabled(row(record))"
                checked-children="启用"
                un-checked-children="停用"
                :loading="switchingId === record.id"
                :disabled="!!switchingId"
                :aria-label="`${record.name}启用状态`"
                @change="
                  (checked) => toggleCategory(row(record), Boolean(checked))
                "
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="edit(row(record))">
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                @click="copyTemplate(row(record))"
              >
                复制
              </Button>
              <Button
                type="link"
                size="small"
                @click="showHistory(row(record))"
              >
                版本记录
              </Button>
            </template>
          </template>
          <template #emptyText><Empty description="暂无合同类型" /></template>
        </Table>
      </section>
    </div>
    <div v-else-if="draft && config" class="configuration-flow">
      <nav class="steps" aria-label="合同类型管理步骤">
        <button
          v-for="(name, index) in steps"
          :key="name"
          :class="{ active: step === index, complete: step > index }"
          :disabled="busy"
          :aria-current="step === index ? 'step' : undefined"
          @click="step = index"
        >
          <span>
            <Icon
              :icon="
                step > index
                  ? 'lucide:check'
                  : ['lucide:folders', 'lucide:scan-text', 'lucide:bell-ring'][
                      index
                    ]!
              "
            />
          </span>
          <div>
            <small>STEP {{ String(index + 1).padStart(2, '0') }}</small>
            <strong>{{ name }}</strong>
            <em>
              {{
                [
                  '类型信息、所属大类与识别说明',
                  '提取字段、提取要求与审核事项',
                  '变更续约规则与到期事项',
                ][index]
              }}
            </em>
          </div>
        </button>
      </nav>
      <div class="configuration-body">
        <Alert
          v-if="readOnly"
          type="info"
          show-icon
          :message="`正在查看 V${draft.version} 历史配置，内容只读`"
          class="version-hint"
        />
        <fieldset
          :disabled="readOnly || busy"
          class="configuration-fields"
          :inert="busy"
        >
          <header class="flow-heading">
            <small>STEP {{ String(step + 1).padStart(2, '0') }}</small>
            <h2>
              {{
                [
                  '定义合同类型与适用范围',
                  '定义需要提取的信息与智能审核要求',
                  '明确变更、续约与到期处理安排',
                ][step]
              }}
            </h2>
            <p>
              {{
                [
                  '定义类型适用范围；无法明确匹配时，由用户选择类型。',
                  '确认已配置的信息、提取要求及建档确认要求，再选择适用的审核事项。',
                  '分别配置变更续约规则与到期处理事项，日期未确认时不触发提醒。',
                ][step]
              }}
            </p>
          </header>
          <div v-show="step === 0" class="two-columns">
            <section class="config-card">
              <header>
                <Icon icon="lucide:folder-tree" />
                <div>
                  <h3>合同类型</h3>
                  <p>定义类型名称、编码与适用范围</p>
                </div>
              </header>
              <div class="card-body form-grid">
                <label>
                  <span>
                    类型名称
                    <i>*</i>
                  </span>
                  <Input
                    v-model:value="draft.name"
                    :maxlength="60"
                    placeholder="如：设备运维合同类型"
                  />
                </label>
                <label>
                  <span>
                    类型编码
                    <i>*</i>
                  </span>
                  <Input
                    v-model:value="config.code"
                    :maxlength="60"
                    placeholder="填写唯一类型编码"
                  />
                </label>
                <label class="wide">
                  <span>
                    所属大类
                    <i>*</i>
                  </span>
                  <Select
                    :disabled="readOnly || busy"
                    v-model:value="draft.contractCategory"
                    @change="changeContractCategory"
                    placeholder="请选择所属大类"
                    :options="contractCategories"
                  />
                  <div class="category-defaults">
                    <small>
                      首次选择后自动带入推荐字段、审核方案及到期提醒，可继续调整。
                    </small>
                    <Button
                      v-if="draft.contractCategory && !readOnly"
                      type="link"
                      size="small"
                      :disabled="busy"
                      @click="restoreCategoryDefaults"
                    >
                      使用本大类推荐配置
                    </Button>
                  </div>
                </label>
                <label class="wide">
                  <span>适用范围</span>
                  <Input.TextArea
                    v-model:value="draft.scope"
                    :rows="2"
                    placeholder="描述适用的合同范围"
                  />
                </label>
              </div>
            </section>
            <section class="config-card">
              <header>
                <Icon icon="lucide:scan-search" />
                <div>
                  <h3>类型识别说明</h3>
                  <p>用于合同助理匹配类型，无法确定时由用户选择</p>
                </div>
              </header>
              <div class="card-body">
                <Input.TextArea
                  v-model:value="draft.purpose"
                  :rows="5"
                  placeholder="例如：适用于设备维护、定期巡检合同；不适用于仅设备采购的合同"
                />
              </div>
            </section>
          </div>
          <ContractExtractionEditor
            @update:model-value="
              draft.contractCategory && (useCategoryDefaults = false)
            "
            v-show="step === 1"
            :key="draft.id"
            v-model="config.extraction!"
            :readonly="readOnly"
          />
          <section v-show="step === 1" class="config-card audit-section">
            <header>
              <Icon icon="lucide:shield-check" />
              <div>
                <h3>智能审核</h3>
                <p>默认选用常用审核方案，按需勾选事项。</p>
              </div>
            </header>
            <div class="card-body">
              <div class="audit-simple-mode">
                <span>审核方式</span>
                <Select
                  :disabled="readOnly || busy"
                  v-model:value="config.audit.mode"
                  :options="[
                    { value: 'none', label: '不审核' },
                    { value: 'intelligent', label: '智能审核' },
                  ]"
                />
              </div>
              <template v-if="config.audit.mode === 'intelligent'">
                <p class="muted">
                  当前方案：{{
                    auditSchemes.find(
                      (item) => item.id === config?.audit.schemeId,
                    )?.name || '待选择'
                  }}
                </p>
                <div class="audit-rule-list">
                  <div v-for="item in allAuditRules" :key="item.ruleId">
                    <Checkbox
                      :checked="
                        !config.audit.ruleIds ||
                        config.audit.ruleIds.includes(item.ruleId)
                      "
                      :disabled="readOnly"
                      @change="
                        (event) =>
                          toggleAuditRule(item.ruleId, event.target.checked)
                      "
                    >
                      <Tag :color="item.action === 'BLOCK' ? 'red' : 'orange'">
                        {{ item.action === 'BLOCK' ? '阻断' : '警告' }}
                      </Tag>
                      <strong>{{ item.rule?.name || '审核事项已失效' }}</strong>
                    </Checkbox>
                    <details class="rule-description">
                      <summary>查看审核要求</summary>
                      <p>{{ item.rule?.prompt }}</p>
                    </details>
                  </div>
                </div>
                <details class="audit-advanced">
                  <summary>高级设置：更换审核方案</summary>
                  <Select
                    :disabled="readOnly || busy"
                    v-model:value="config.audit.schemeId"
                    class="full-width"
                    show-search
                    option-filter-prop="label"
                    :options="
                      auditSchemes.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))
                    "
                    @change="config.audit.ruleIds = undefined"
                  />
                </details>
              </template>
            </div>
          </section>
          <ContractExpirySimple
            v-show="step === 2"
            :key="draft.id"
            v-model="config.lifecycle"
            :readonly="readOnly || busy"
          />
        </fieldset>
        <Alert
          v-if="!readOnly && issues.length > 0"
          class="validation"
          type="warning"
          show-icon
          message="发布前需完善以下内容"
        >
          <template #description>
            <ul>
              <li v-for="issue in issues" :key="issue">{{ issue }}</li>
            </ul>
          </template>
        </Alert>
      </div>
      <div class="flow-footer">
        <Button :disabled="busy" @click="close">
          {{ readOnly ? '返回列表' : '取消' }}
        </Button>
        <span></span>
        <Button v-if="step > 0" :disabled="busy" @click="step--">上一步</Button>
        <Button v-if="!readOnly" :loading="busy" @click="save(false)">
          保存草稿
        </Button>
        <Button
          v-if="step < steps.length - 1"
          type="primary"
          :disabled="busy"
          @click="step++"
        >
          下一步
        </Button>
        <Button
          v-else-if="!readOnly"
          type="primary"
          :loading="busy"
          @click="requestPublish"
        >
          {{ originalStatus === 'published' ? '发布新版本' : '发布' }}
        </Button>
      </div>
    </div>
    <Modal
      v-model:open="publishOpen"
      title="发布合同类型配置"
      :confirm-loading="busy"
      :mask-closable="!busy"
      ok-text="确认发布"
      cancel-text="取消"
      @ok="save(true)"
    >
      <p>
        发布 V{{ draft?.version }} 后，新合同可引用此版本，已有合同保留原配置。
      </p>
      <Input.TextArea
        v-model:value="publishNote"
        :rows="3"
        :maxlength="500"
        placeholder="填写本次发布说明"
        class="publish-note"
      />
    </Modal>
    <Modal
      v-model:open="historyOpen"
      title="发布与版本记录"
      :width="1000"
      :footer="null"
    >
      <Table
        :columns="historyColumns"
        :data-source="historyRows"
        row-key="id"
        :pagination="{ pageSize: 8, showSizeChanger: false }"
        :scroll="{ x: 850 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'version'">
            V{{ record.version }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag>{{ statuses[record.status as keyof typeof statuses] }}</Tag>
          </template>
          <template v-else-if="column.key === 'date'">
            {{ releaseOf(row(record))?.date || '尚未发布' }}
          </template>
          <template v-else-if="column.key === 'publisher'">
            {{ releaseOf(row(record))?.owner || '—' }}
          </template>
          <template v-else-if="column.key === 'note'">
            {{ releaseOf(row(record))?.note || '—' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="viewVersion(row(record))">
              查看配置
            </Button>
          </template>
        </template>
      </Table>
    </Modal>
  </AiWorkPage>
</template>

<style scoped>
.category-defaults {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.category-defaults small {
  color: #819087;
  font-size: 12px;
  line-height: 1.6;
}
.audit-simple-mode {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  font-size: 13px;
}
.audit-simple-mode :deep(.ant-select) {
  width: 180px;
}
.rule-description,
.audit-advanced {
  margin-top: 10px;
}
.rule-description summary,
.audit-advanced summary {
  font-size: 12px;
  color: #4a755b;
  cursor: pointer;
}
.audit-advanced :deep(.ant-select) {
  margin-top: 10px;
}

.preset-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-bottom: 18px;
  border: 1px solid #cfe3d6;
  border-radius: 10px;
  background: #f2f8f4;
}
.preset-bar h3 {
  font-size: 14px;
  color: #2c513f;
}
.preset-bar p {
  font-size: 12px;
  color: #819789;
  margin-top: 6px;
}
.preset-bar :deep(.ant-select) {
  min-width: 230px;
}
.renewal-advanced {
  margin-top: 14px;
}
.renewal-advanced summary {
  cursor: pointer;
  font-size: 12px;
  color: #4a755b;
}

.audit-rule-list {
  margin: 16px 0 0;
}
.audit-rule-list > div {
  padding: 12px 0;
  border-top: 1px solid #edf1ee;
}
.audit-rule-list strong {
  font-size: 13px;
  color: #466051;
}
.audit-rule-list p {
  margin-top: 8px;
  font-size: 12px;
  color: #8b9b92;
}

.category-table :deep(.ant-table-cell) {
  padding: 12px 8px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.category-table :deep(.ant-table-thead > tr > th) {
  padding-inline: 8px;
}
.category-table :deep(.ant-table-cell .ant-btn-link) {
  padding-inline: 0;
  margin-right: 8px;
  height: auto;
}
.category-table .cell-version__row {
  gap: 4px;
  flex-wrap: wrap;
}
.category-table .item-tags :deep(.ant-tag) {
  white-space: normal;
  overflow-wrap: anywhere;
}
.category-table :deep(.ant-switch) {
  min-width: 42px;
}
.category-table small {
  overflow-wrap: anywhere;
}

.cell-version {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-version__row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.cell-version__num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #102e29;
}

.cell-version__tag {
  padding: 0 6px;
  margin: 0;
  font-size: 10px;
  line-height: 16px;
}

.cell-version__empty {
  font-size: 11px;
  color: #8ba8a0;
}

.configuration-fields {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.audit-section,
.renewal-section,
.version-hint {
  margin-top: 18px;
}
.publish-note {
  margin-top: 14px;
}

.category-page {
  height: 100%;
  padding: 18px;
  overflow: auto;
  background: #f7faf8;
}
.category-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e0e8e4;
  border-radius: 12px;
}
.list-toolbar,
.section-heading {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}
.list-toolbar {
  padding: 12px;
  flex-wrap: wrap;
}
.list-toolbar > div {
  flex-wrap: wrap;
}

.list-toolbar > div,
.section-heading > div:last-child,
.add-item {
  display: flex;
  gap: 8px;
  align-items: center;
}
.list-toolbar .ant-input-affix-wrapper {
  width: 260px;
}
.list-toolbar :deep(.ant-select) {
  min-width: 130px;
}
h2,
h3,
p {
  margin: 0;
}
h2,
h3 {
  font-size: 15px;
  font-weight: 600;
  color: #294b3f;
}
small {
  display: block;
  margin-top: 5px;
  color: #8a9a93;
  font-size: 12px;
}
.muted {
  color: #8a9a93;
  font-size: 12px;
  margin-top: 5px;
}
.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.item-tags :deep(.ant-tag) {
  margin: 0;
}
.configuration-flow {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  background: #f8fbfa;
  border-bottom: 1px solid #dfeae4;
}

.steps button {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 76px;
  padding: 12px 16px;
  text-align: left;
  border-right: 1px solid #e1eae7;
}

.steps button:last-child {
  border-right: 0;
}

.steps button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.steps button.active {
  background: #edf5f2;
  box-shadow: inset 0 -3px #176e5b;
}

.steps button.complete {
  background: #f3f8f6;
}

.steps button > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #176e5b;
  background: white;
  border: 1px solid #c9ded8;
  border-radius: 9px;
}

.steps button > div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.steps small {
  font-size: 9px;
  font-weight: 800;
  color: #176e5b;
}

.steps strong {
  font-size: 13px;
  color: #234835;
}

.steps em {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  font-style: normal;
  color: #8b9e91;
  white-space: nowrap;
}

.configuration-body {
  flex: 1;
  min-height: 0;
  padding: 20px 24px;
  overflow: auto;
  background: white;
}

.flow-heading {
  margin-bottom: 18px;
}

.flow-heading > small {
  font-size: 10px;
  color: #5f9075;
}

.flow-heading h2 {
  margin: 8px 0;
  font-size: 20px;
  font-weight: 650;
  color: #2b513c;
}

.flow-heading p {
  font-size: 12px;
  line-height: 22px;
  color: #94a598;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.config-card {
  overflow: hidden;
  background: white;
  border: 1px solid #dfe8e3;
  border-radius: 12px;
}

.config-card > header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 14px 18px;
  background: #f6f9f7;
  border-bottom: 1px solid #e6ede8;
}

.config-card header > svg {
  font-size: 20px;
  color: #418168;
}

.config-card h3 {
  font-size: 14px;
  font-weight: 650;
  color: #2c513f;
}

.config-card header p {
  margin-top: 4px;
  font-size: 11px;
  color: #94a398;
}

.card-body {
  padding: 18px;
}

.config-section {
  padding: 16px;
  border: 1px solid #e0e8e3;
  border-radius: 10px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.form-grid label {
  min-width: 0;
}
.form-grid label > span {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
  color: #466051;
}
.form-grid i {
  color: #e24d4d;
  font-style: normal;
  margin-left: 4px;
}
.form-grid :deep(.ant-select),
.form-grid :deep(.ant-input-number),
.full-width {
  width: 100%;
}
.wide {
  grid-column: 1/-1;
}
.field-preview {
  margin-top: 14px;
  padding: 14px;
  background: #f7faf8;
  border-radius: 8px;
}
.field-preview > span {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  color: #728c7c;
}
.validation {
  margin-top: 16px;
}
.validation ul {
  margin: 0;
  padding-left: 18px;
}
.flow-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid #dfe8e3;
  background: white;
  display: flex;
  gap: 8px;
  align-items: center;
}
.flow-footer > span {
  flex: 1;
}
:deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
@media (max-width: 900px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .list-toolbar,
  .section-heading {
    flex-wrap: wrap;
  }
}
</style>
