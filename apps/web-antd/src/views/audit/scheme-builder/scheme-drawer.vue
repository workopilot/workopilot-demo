<script setup lang="ts">
import type { AuditRule, AuditScheme, SchemeRuleConfig } from '#/types/audit';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createAuditSchemeApi,
  getAuditRulesApi,
  updateAuditSchemeApi,
} from '#/api/audit';
import { deepClone } from '#/utils/deep-clone';

const props = defineProps<{
  open: boolean;
  record?: AuditScheme;
}>();

const emit = defineEmits(['update:open', 'success']);

const loading = ref(false);
const isUpdate = computed(() => !!props.record?.id);
const title = computed(() =>
  isUpdate.value ? '编辑审核方案' : '新建审核方案',
);

const formState = ref<Partial<AuditScheme>>({
  code: '',
  globalConfidenceThreshold: 60,
  rules: [],
});

// All available rules for selection
const allRules = ref<AuditRule[]>([]);
const ruleSelectorOpen = ref(false);
const selectedRuleIds = ref<string[]>([]);
const ruleSearchKeyword = ref('');

const filteredRules = computed(() => {
  if (!ruleSearchKeyword.value) return allRules.value;
  const k = ruleSearchKeyword.value.toLowerCase();
  return allRules.value.filter(
    (r) =>
      r.name.toLowerCase().includes(k) ||
      r.code.toLowerCase().includes(k) ||
      (r.description && r.description.toLowerCase().includes(k)),
  );
});

const ruleSelectorColumns = [
  { title: '规则编码', dataIndex: 'code', width: 120 },
  { title: '规则名称', dataIndex: 'name' },
  { title: '范围', dataIndex: 'scope', width: 80 },
  { title: '备注', dataIndex: 'description' },
];

// Config Modal
const configModalOpen = ref(false);
const currentConfigRule = ref<null | SchemeRuleConfig>(null);
const currentConfigParam = ref('');

// Load rules on open
watch(
  () => props.open,
  async (val) => {
    if (val) {
      const res = await getAuditRulesApi();
      allRules.value = res.data;

      formState.value = props.record
        ? deepClone(props.record)
        : {
            name: '',
            code: `SCHEME_${Date.now()}`,
            billType: 'SAP_TRAVEL',
            globalConfidenceThreshold: 60,
            rules: [],
          };
    }
  },
);

function handleClose() {
  emit('update:open', false);
}

async function handleSubmit() {
  try {
    loading.value = true;
    if (isUpdate.value && props.record?.id) {
      await updateAuditSchemeApi(props.record.id, formState.value);
      message.success('更新成功');
    } else {
      await createAuditSchemeApi(formState.value);
      message.success('创建成功');
    }
    emit('success');
    handleClose();
  } catch {
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

// --- Rule Management ---

function handleAddRules() {
  selectedRuleIds.value = [];
  ruleSearchKeyword.value = '';
  ruleSelectorOpen.value = true;
}

function confirmAddRules() {
  const newRules: SchemeRuleConfig[] = selectedRuleIds.value.map((id) => ({
    ruleId: id,
    action: 'BLOCK',
    priority: (formState.value.rules?.length || 0) + 1,
    localConfidenceThreshold: 80,
  }));
  formState.value.rules = [...(formState.value.rules || []), ...newRules];
  ruleSelectorOpen.value = false;
}

function removeRule(index: number) {
  formState.value.rules?.splice(index, 1);
}

function moveRule(index: number, direction: 'down' | 'up') {
  if (!formState.value.rules) return;
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex >= 0 && newIndex < formState.value.rules.length) {
    const temp = formState.value.rules[index];
    formState.value.rules[index] = formState.value.rules[newIndex];
    formState.value.rules[newIndex] = temp;
  }
}

function getRuleName(id: string) {
  return allRules.value.find((r) => r.id === id)?.name || id;
}

function openConfig(rule: SchemeRuleConfig) {
  currentConfigRule.value = rule;
  currentConfigParam.value = JSON.stringify(rule.paramOverrides || {}, null, 2);
  configModalOpen.value = true;
}

function saveConfig() {
  if (currentConfigRule.value) {
    try {
      currentConfigRule.value.paramOverrides = JSON.parse(
        currentConfigParam.value,
      );
      configModalOpen.value = false;
    } catch {
      message.error('JSON 格式错误');
    }
  }
}

const columns = [
  { title: '排序', key: 'sort', width: 80 },
  { title: '规则名称', key: 'name' },
  { title: '风险处置', key: 'action', width: 150 },
  { title: '局部置信度', key: 'confidence', width: 120 },
  { title: '操作', key: 'action_btn', width: 150 },
];
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="800"
    @close="handleClose"
    :mask-closable="false"
  >
    <div class="flex h-full flex-col">
      <!-- Header Form -->
      <Form layout="vertical" :model="formState" class="mb-4 border-b pb-4">
        <div class="grid grid-cols-2 gap-4">
          <Form.Item label="方案名称" required>
            <Input
              v-model:value="formState.name"
              placeholder="如：SAP国内差旅标准方案"
            />
          </Form.Item>
          <Form.Item label="方案编码" required>
            <Input
              v-model:value="formState.code"
              :disabled="isUpdate"
              placeholder="自动生成或手动输入"
            />
          </Form.Item>
          <Form.Item label="适用单据类型" required>
            <Select v-model:value="formState.billType">
              <Select.Option value="SAP_TRAVEL">SAP 差旅报销单</Select.Option>
              <Select.Option value="OA_GENERAL">OA 通用报销单</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="全局最低置信度">
            <InputNumber
              v-model:value="formState.globalConfidenceThreshold"
              :min="0"
              :max="100"
              addon-after="%"
            />
            <div class="mt-1 text-xs text-gray-400">
              低于此分数的 AI 判决将转人工
            </div>
          </Form.Item>
        </div>
      </Form>

      <!-- Rules List -->
      <div class="flex-1 overflow-y-auto">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-bold">规则编排列表</h3>
          <Button type="dashed" @click="handleAddRules">
            <Icon icon="lucide:plus" class="mr-1" />
            从规则库导入
          </Button>
        </div>

        <Table
          :data-source="formState.rules"
          :columns="columns"
          :pagination="false"
          row-key="ruleId"
          size="small"
        >
          <template #bodyCell="{ column, record: item, index }">
            <template v-if="column.key === 'sort'">
              <Space direction="vertical" :size="0">
                <Button
                  type="text"
                  size="small"
                  @click="moveRule(index, 'up')"
                  :disabled="index === 0"
                >
                  <Icon icon="lucide:chevron-up" />
                </Button>
                <Button
                  type="text"
                  size="small"
                  @click="moveRule(index, 'down')"
                  :disabled="index === (formState.rules?.length || 0) - 1"
                >
                  <Icon icon="lucide:chevron-down" />
                </Button>
              </Space>
            </template>
            <template v-else-if="column.key === 'name'">
              {{ getRuleName(item.ruleId) }}
              <div v-if="item.paramOverrides" class="text-xs text-blue-500">
                已配置参数覆盖
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <Select v-model:value="item.action" class="w-full">
                <Select.Option value="BLOCK">🚫 阻断 (Block)</Select.Option>
                <Select.Option value="WARNING">⚠️ 警告 (Warning)</Select.Option>
              </Select>
            </template>
            <template v-else-if="column.key === 'confidence'">
              <InputNumber
                v-model:value="item.localConfidenceThreshold"
                size="small"
                :min="0"
                :max="100"
              />
            </template>
            <template v-else-if="column.key === 'action_btn'">
              <Space>
                <Button type="link" size="small" @click="openConfig(item)">
                  配置
                </Button>
                <Button
                  type="link"
                  danger
                  size="small"
                  @click="removeRule(index)"
                >
                  移除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>

      <div class="border-t pt-4 text-right">
        <Space>
          <Button @click="handleClose">取消</Button>
          <Button type="primary" :loading="loading" @click="handleSubmit">
            保存方案
          </Button>
        </Space>
      </div>
    </div>

    <!-- Rule Selector Modal -->
    <Modal
      v-model:open="ruleSelectorOpen"
      title="选择规则"
      width="800px"
      @ok="confirmAddRules"
    >
      <div class="mb-4">
        <Input.Search
          v-model:value="ruleSearchKeyword"
          placeholder="搜索规则名称/编码/备注"
          enter-button
          allow-clear
        />
      </div>
      <Table
        row-key="id"
        size="small"
        :columns="ruleSelectorColumns"
        :data-source="filteredRules"
        :row-selection="{
          selectedRowKeys: selectedRuleIds,
          onChange: (keys: any[]) => (selectedRuleIds = keys),
        }"
        :pagination="{ pageSize: 5 }"
        :scroll="{ y: 400 }"
      >
        <template #bodyCell="{ column, record: ruleRecord }">
          <template v-if="column.dataIndex === 'scope'">
            <Tag :color="ruleRecord.scope === 'line' ? 'blue' : 'orange'">
              {{ ruleRecord.scope === 'line' ? '行级' : '整单级' }}
            </Tag>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- Param Config Modal -->
    <Modal v-model:open="configModalOpen" title="参数覆盖配置" @ok="saveConfig">
      <p class="mb-2 text-gray-500">输入 JSON 格式的参数覆盖：</p>
      <Input.TextArea
        v-model:value="currentConfigParam"
        :rows="6"
        class="font-mono"
      />
    </Modal>
  </Drawer>
</template>
