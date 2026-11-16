<script setup lang="ts">
import type {
  ContractAuthorizationRule,
  ContractChatSession,
} from '#/types/contract-assistant';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getContractArchives,
  getContractSchemes,
} from '#/api/mock-contract-assistant';
import {
  deleteContractAuthorizationRule,
  getContractAuthorizationOptions,
  getContractAuthorizationRules,
  saveContractAuthorizationRule,
} from '#/api/mock-contract-authorization';
import { deepClone } from '#/utils/deep-clone';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import {
  contractPermissionOptions,
  contractScopeOptions,
  permissionLabel,
  validateAuthorizationRule,
} from './utils/authorization';

const rules = ref<ContractAuthorizationRule[]>([]);
const keyword = ref('');
const permission = ref('all');
const loading = ref(false);
const loadFailed = ref(false);
const saving = ref(false);
const open = ref(false);
const options =
  ref<Awaited<ReturnType<typeof getContractAuthorizationOptions>>['data']>();
const archives = ref<ContractChatSession[]>([]);
const categories = ref<{ label: string; value: string }[]>([]);
const draft = ref<ContractAuthorizationRule>();
const subjects = [
  { value: 'user', label: '人员' },
  { value: 'department', label: '部门' },
  { value: 'role', label: '平台角色' },
];
const subjectOptions = computed(() => {
  if (draft.value?.subjectType === 'user') return options.value?.users;
  if (draft.value?.subjectType === 'department')
    return options.value?.departments;
  return options.value?.roles;
});
const contractOptions = computed(() =>
  archives.value
    .filter(
      (item) =>
        !draft.value?.categoryId || item.scheme?.id === draft.value.categoryId,
    )
    .map((item) => ({
      value: item.id,
      label: item.fileName.replace(/\.[^.]+$/, ''),
    })),
);
const filtered = computed(() =>
  rules.value.filter(
    (item) =>
      (permission.value === 'all' || item.permission === permission.value) &&
      (!keyword.value.trim() ||
        `${item.name} ${item.subjectName}`.includes(keyword.value.trim())),
  ),
);
const columns = [
  { title: '规则名称', key: 'name', width: 210 },
  { title: '授权对象', key: 'subject', width: 180 },
  { title: '合同范围', key: 'scope', width: 200 },
  { title: '合同权限', key: 'permission', width: 100 },
  { title: '状态', key: 'enabled', width: 90 },
  { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', key: 'action', width: 120 },
];
function row(record: Record<string, unknown>): ContractAuthorizationRule {
  const item = rules.value.find((rule) => rule.id === record.id);
  if (!item) throw new Error('未找到授权规则');
  return item;
}
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请重试';
const categoryLabel = (id: string) =>
  categories.value.find((item) => item.value === id)?.label || '全部合同类别';
function create(rule?: ContractAuthorizationRule) {
  draft.value = rule
    ? deepClone(rule)
    : {
        id: `ca-${Date.now()}`,
        name: '',
        subjectType: 'user',
        subjectId: '',
        subjectName: '',
        permission: 'view',
        scope: 'owned',
        categoryId: '',
        contractIds: [],
        enabled: true,
        updatedAt: '',
      };
  open.value = true;
}
function changeSubject() {
  if (draft.value) {
    draft.value.subjectId = '';
    draft.value.subjectName = '';
  }
}
function pickSubject(value: unknown) {
  if (draft.value) {
    draft.value.subjectId = String(value);
    draft.value.subjectName =
      subjectOptions.value?.find((item) => item.value === value)?.label || '';
  }
}
async function load() {
  loading.value = true;
  loadFailed.value = false;
  try {
    const [o, c, a] = await Promise.all([
      getContractAuthorizationOptions(),
      getContractSchemes(),
      getContractArchives(),
    ]);
    options.value = o.data;
    categories.value = c.data.map((item) => ({
      value: item.id,
      label: item.name,
    }));
    archives.value = a.data;
    if (o.data.canManage) {
      const response = await getContractAuthorizationRules();
      rules.value = response.data;
    }
  } catch (error) {
    loadFailed.value = true;
    options.value = undefined;
    rules.value = [];
    message.error(errorText(error));
  } finally {
    loading.value = false;
  }
}
async function save() {
  if (!draft.value) return;
  const error = validateAuthorizationRule(draft.value);
  if (error) {
    message.warning(error);
    return;
  }
  saving.value = true;
  try {
    await saveContractAuthorizationRule(deepClone(draft.value));
    const response = await getContractAuthorizationRules();
    rules.value = response.data;
    open.value = false;
    message.success('授权规则已保存');
  } catch (error) {
    message.error(errorText(error));
  } finally {
    saving.value = false;
  }
}
async function toggle(rule: ContractAuthorizationRule, value: unknown) {
  try {
    await saveContractAuthorizationRule({ ...rule, enabled: !!value });
    const response = await getContractAuthorizationRules();
    rules.value = response.data;
  } catch (error) {
    message.error(errorText(error));
  }
}
function remove(rule: ContractAuthorizationRule) {
  Modal.confirm({
    title: '删除授权规则？',
    content: `删除“${rule.name}”后，该规则提供的权限将被移除；其他规则或单独授权仍然有效。`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteContractAuthorizationRule(rule.id);
        const response = await getContractAuthorizationRules();
        rules.value = response.data;
        message.success('授权规则已删除');
      } catch (error) {
        message.error(errorText(error));
      }
    },
  });
}
onMounted(load);
</script>
<template>
  <AiWorkPage
    title="合同授权管理"
    icon="lucide:shield-check"
    description="独立设置合同数据范围及操作权限，引用平台人员、部门和角色。"
  >
    <template #actions>
      <Button v-if="options?.canManage" type="primary" @click="create()">
        <Icon icon="lucide:plus" />
        新增授权规则
      </Button>
    </template>
    <div class="authorization-page">
      <div class="permission-guide">
        <div>
          <Icon icon="lucide:eye" />
          <strong>查看</strong>
          <span>合同信息、附件、摘要与业务进展</span>
        </div>
        <div>
          <Icon icon="lucide:clipboard-pen-line" />
          <strong>办理</strong>
          <span>补充信息、审核、确认日期与建档</span>
        </div>
        <div>
          <Icon icon="lucide:shield-check" />
          <strong>管理</strong>
          <span>包含办理，以及合同授权和管理操作</span>
        </div>
      </div>
      <section class="rules-panel">
        <header>
          <div>
            <h2>
              默认授权规则
              <small>{{ rules.length }} 条</small>
            </h2>
            <p>
              同一人员命中多项授权时，保留各规则授予的权限；停用规则不影响其他来源。
            </p>
          </div>
          <div class="filters">
            <Input
              v-model:value="keyword"
              allow-clear
              placeholder="搜索规则或授权对象"
            />
            <Select
              v-model:value="permission"
              :options="[
                { value: 'all', label: '全部权限' },
                ...contractPermissionOptions,
              ]"
            />
          </div>
        </header>
        <Table
          v-if="options?.canManage"
          :columns="columns"
          :data-source="filtered"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 1100 }"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <strong class="rule-name">{{ record.name }}</strong>
              <small class="cell-sub">
                {{ categoryLabel(record.categoryId) }}
              </small>
            </template>
            <template v-else-if="column.key === 'subject'">
              {{ record.subjectName }}
              <small class="cell-sub">
                {{
                  subjects.find((item) => item.value === record.subjectType)
                    ?.label
                }}
              </small>
            </template>
            <template v-else-if="column.key === 'scope'">
              {{
                contractScopeOptions.find((item) => item.value === record.scope)
                  ?.label
              }}
              <small v-if="record.scope === 'specified'" class="cell-sub">
                已选 {{ record.contractIds.length }} 份合同
              </small>
            </template>
            <template v-else-if="column.key === 'permission'">
              <Tag
                :color="
                  record.permission === 'manage'
                    ? 'green'
                    : record.permission === 'handle'
                      ? 'blue'
                      : 'default'
                "
              >
                {{ permissionLabel(record.permission) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'enabled'">
              <Switch
                :checked="record.enabled"
                size="small"
                @change="(value) => toggle(row(record), value)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="create(row(record))">
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                danger
                @click="remove(row(record))"
              >
                删除
              </Button>
            </template>
          </template>
        </Table>
        <Empty
          v-else
          :description="
            loading
              ? '正在加载授权规则…'
              : loadFailed
                ? '授权规则加载失败，请重试'
                : '当前用户未获得合同授权规则的管理权限'
          "
        >
          <Button v-if="loadFailed && !loading" @click="load">重新加载</Button>
        </Empty>
      </section>
    </div>
    <Modal
      v-model:open="open"
      :title="
        rules.some((item) => item.id === draft?.id)
          ? '编辑授权规则'
          : '新增授权规则'
      "
      :width="640"
      :confirm-loading="saving"
      :mask-closable="!saving"
      :closable="!saving"
      :keyboard="!saving"
      ok-text="保存"
      cancel-text="取消"
      @ok="save"
    >
      <div v-if="draft" class="rule-form">
        <label class="full">
          <span>
            规则名称
            <b>*</b>
          </span>
          <Input v-model:value="draft.name" placeholder="例如：部门合同查阅" />
        </label>
        <label>
          <span>
            授权对象类型
            <b>*</b>
          </span>
          <Select
            v-model:value="draft.subjectType"
            :options="subjects"
            @change="changeSubject"
          />
        </label>
        <label>
          <span>
            授权对象
            <b>*</b>
          </span>
          <Select
            :value="draft.subjectId || undefined"
            show-search
            option-filter-prop="label"
            :options="subjectOptions"
            placeholder="选择人员、部门或角色"
            @change="pickSubject"
          />
        </label>
        <label>
          <span>
            合同权限
            <b>*</b>
          </span>
          <Select
            v-model:value="draft.permission"
            :options="contractPermissionOptions"
          />
        </label>
        <label>
          <span>
            合同范围
            <b>*</b>
          </span>
          <Select v-model:value="draft.scope" :options="contractScopeOptions" />
        </label>
        <label class="full">
          <span>合同类别</span>
          <Select
            v-model:value="draft.categoryId"
            :options="[{ value: '', label: '全部合同类别' }, ...categories]"
            @change="draft.contractIds = []"
          />
        </label>
        <label v-if="draft.scope === 'specified'" class="full">
          <span>
            指定合同
            <b>*</b>
          </span>
          <Select
            v-model:value="draft.contractIds"
            mode="multiple"
            show-search
            option-filter-prop="label"
            :options="contractOptions"
            placeholder="请选择合同"
          />
        </label>
        <p class="form-note full">
          “本人负责”按实际获得授权的人员匹配合同负责人；“本部门”按该人员所在部门匹配合同归属部门。平台角色在此仅作为授权对象引用。
        </p>
      </div>
    </Modal>
  </AiWorkPage>
</template>
<style scoped>
.authorization-page {
  display: grid;
  gap: 16px;
}

.permission-guide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.permission-guide > div {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 7px 9px;
  padding: 16px;
  background: #f7faf8;
  border: 1px solid #dfe9e2;
  border-radius: 11px;
}

.permission-guide svg {
  font-size: 18px;
  color: #5e8c72;
}

.permission-guide strong {
  font-size: 13px;
  font-weight: 600;
  color: #3d5d48;
}

.permission-guide span {
  grid-column: 2;
  font-size: 11px;
  color: #91a196;
}

.rules-panel {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e0e9e3;
  border-radius: 12px;
}

.rules-panel > header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
}

.rules-panel h2 {
  font-size: 14px;
  font-weight: 600;
  color: #3b5d46;
}

.rules-panel h2 small {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 400;
  color: #99a69e;
}

.rules-panel header p {
  margin-top: 7px;
  font-size: 11px;
  color: #93a398;
}

.filters {
  display: flex;
  gap: 10px;
}

.filters > .ant-input-affix-wrapper {
  width: 220px;
}

.filters > .ant-select {
  width: 120px;
}

.rule-name {
  font-size: 12px;
  font-weight: 500;
  color: #4c6b57;
}

.cell-sub {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #96a69b;
}

.rule-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 20px;
}

.rule-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #607c69;
}

.rule-form .full {
  grid-column: 1/-1;
}

.rule-form b {
  color: #ef4444;
}

.form-note {
  font-size: 11px;
  line-height: 1.8;
  color: #97a69c;
}

:deep(.ant-btn) {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

@media (max-width: 760px) {
  .permission-guide {
    grid-template-columns: 1fr;
  }

  .rules-panel > header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters > .ant-input-affix-wrapper {
    width: 100%;
  }

  .rule-form {
    grid-template-columns: 1fr;
  }
}
</style>
