<script setup lang="ts">
import type {
  AssignmentRule,
  CandidateScopeType,
  RuleEvidence,
} from '#/types/ticket';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import { getPositionsApi, getRolesApi, getStaffsApi } from '#/api/ticket';

/** 触发时机选项（含 leave-node，保存时按需做类型断言） */
type TriggerMoment = 'action' | 'enter-node' | 'leave-node';

interface Props {
  /** Drawer 是否打开（支持 v-model:open） */
  open: boolean;
  /** 编辑时传入；新增时为 null */
  rule: AssignmentRule | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save', rule: AssignmentRule): void;
}>();

/** 表单内部结构（派单目标统一到 candidateScopeType） */
interface AssignmentForm {
  id?: string;
  name: string;
  code: string;
  enabled: boolean;
  trigger: TriggerMoment;
  triggerNodeId?: string;
  condition: string;
  candidateScopeType: 'dynamic' | 'person' | 'position' | 'role';
  targetPersonId?: string;
  targetPosition?: string;
  targetRoleId?: string;
  dynamicExpr?: string;
  strategy?: 'load-balance' | 'round-robin';
  // 兼容 DispatchRule 必填字段
  targetMode: 'person' | 'position';
  target: string;
  priority: 'high' | 'low' | 'medium' | 'urgent';
  hitCount: number;
  rulePriority: number;
  stopOnMatch: boolean;
  // 规则来源与 AI 解析依据（编辑时只读透传）
  source?: 'ai' | 'manual';
  evidence?: RuleEvidence;
}

const defaultForm = (): AssignmentForm => ({
  name: '',
  code: '',
  enabled: true,
  trigger: 'enter-node',
  triggerNodeId: undefined,
  condition: '',
  candidateScopeType: 'position',
  targetPersonId: undefined,
  targetPosition: undefined,
  targetRoleId: undefined,
  dynamicExpr: undefined,
  strategy: 'load-balance',
  targetMode: 'position',
  target: '',
  priority: 'medium',
  hitCount: 0,
  rulePriority: 10,
  stopOnMatch: true,
});

const form = ref<AssignmentForm>(defaultForm());

/** 同步外部 rule → 本地表单 */
watch(
  () => props.rule,
  (val) => {
    if (val) {
      const scope = val.candidateScope;
      const scopeType =
        (scope?.type as AssignmentForm['candidateScopeType']) ?? 'position';
      form.value = {
        id: val.id,
        name: val.name,
        code: val.code ?? '',
        enabled: val.enabled,
        trigger: (val.trigger as TriggerMoment) ?? 'enter-node',
        triggerNodeId: val.triggerNodeId,
        condition: val.condition,
        candidateScopeType: scopeType,
        targetPersonId:
          scopeType === 'person' ? scope?.ids?.[0] : val.targetPersonId,
        targetPosition:
          scopeType === 'position' ? scope?.ids?.[0] : val.targetPosition,
        targetRoleId: scopeType === 'role' ? scope?.ids?.[0] : undefined,
        dynamicExpr: scopeType === 'dynamic' ? scope?.dynamicExpr : undefined,
        strategy: val.strategy
          ? (val.strategy as unknown as 'load-balance' | 'round-robin')
          : undefined,
        targetMode: val.targetMode ?? 'position',
        target: val.target ?? '',
        priority: val.priority,
        hitCount: val.hitCount ?? 0,
        rulePriority: val.rulePriority ?? 10,
        stopOnMatch: val.stopOnMatch ?? true,
        source: val.source,
        evidence: val.evidence,
      };
    } else {
      form.value = defaultForm();
    }
  },
  { immediate: true },
);

const candidateScopeOptions = [
  { label: '指定人员', value: 'person' },
  { label: '指定岗位', value: 'position' },
  { label: '指定角色', value: 'role' },
  { label: '动态人员', value: 'dynamic' },
];

const strategyOptions = [
  { label: '负载均衡', value: 'load-balance' },
  { label: '轮询', value: 'round-robin' },
];

/** 岗位/角色/人员 下拉选项 */
const positionOptions = ref<{ label: string; value: string }[]>([]);
const roleOptions = ref<{ label: string; value: string }[]>([]);
const staffOptions = ref<{ label: string; value: string }[]>([]);

async function loadOptions() {
  const [posRes, roleRes, staffRes] = await Promise.all([
    getPositionsApi(),
    getRolesApi(),
    getStaffsApi(),
  ]);
  positionOptions.value = (posRes.data ?? []).map((p) => ({
    label: p.name,
    value: p.id,
  }));
  roleOptions.value = (roleRes.data ?? []).map((r) => ({
    label: r.name,
    value: r.id,
  }));
  staffOptions.value = (staffRes.data ?? []).map((s) => ({
    label: s.name,
    value: s.id,
  }));
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      loadOptions();
    }
  },
  { immediate: true },
);

/** 派单目标展示文案 */
function buildTargetText(): string {
  switch (form.value.candidateScopeType) {
    case 'dynamic': {
      return form.value.dynamicExpr ?? '';
    }
    case 'person': {
      return (
        staffOptions.value.find((o) => o.value === form.value.targetPersonId)
          ?.label ?? ''
      );
    }
    case 'position': {
      return (
        positionOptions.value.find((o) => o.value === form.value.targetPosition)
          ?.label ?? ''
      );
    }
    case 'role': {
      return (
        roleOptions.value.find((o) => o.value === form.value.targetRoleId)
          ?.label ?? ''
      );
    }
    default: {
      return '';
    }
  }
}

function onCandidateScopeTypeChange(val: any) {
  if (!val) return;
  form.value.candidateScopeType = val as AssignmentForm['candidateScopeType'];
  form.value.targetPersonId = undefined;
  form.value.targetPosition = undefined;
  form.value.targetRoleId = undefined;
  form.value.dynamicExpr = undefined;
  if (val === 'person' || val === 'dynamic') {
    form.value.strategy = undefined;
  } else if (!form.value.strategy) {
    form.value.strategy = 'load-balance';
  }
  // 同步 DispatchRule 兼容字段
  form.value.targetMode = val === 'person' ? 'person' : 'position';
}

function close() {
  emit('update:open', false);
}

function handleSave() {
  if (!form.value.name.trim()) {
    message.warning('请填写规则名称');
    return;
  }
  if (!form.value.code.trim()) {
    message.warning('请填写规则编码');
    return;
  }
  if (!form.value.condition.trim()) {
    message.warning('请填写触发条件');
    return;
  }
  const scopeType = form.value.candidateScopeType;
  if (
    (scopeType === 'person' && !form.value.targetPersonId) ||
    (scopeType === 'position' && !form.value.targetPosition) ||
    (scopeType === 'role' && !form.value.targetRoleId) ||
    (scopeType === 'dynamic' && !form.value.dynamicExpr?.trim())
  ) {
    message.warning('请完善派单目标');
    return;
  }
  if (
    (scopeType === 'position' || scopeType === 'role') &&
    !form.value.strategy
  ) {
    message.warning('请选择分配策略');
    return;
  }

  const candidateIds = (() => {
    if (scopeType === 'person')
      return form.value.targetPersonId ? [form.value.targetPersonId] : [];
    if (scopeType === 'position')
      return form.value.targetPosition ? [form.value.targetPosition] : [];
    if (scopeType === 'role')
      return form.value.targetRoleId ? [form.value.targetRoleId] : [];
    return [];
  })();

  const targetText = buildTargetText();

  const rule: AssignmentRule = {
    id: form.value.id ?? `r-${Date.now()}`,
    name: form.value.name.trim(),
    code: form.value.code.trim(),
    condition: form.value.condition.trim(),
    targetMode: form.value.targetMode,
    targetPosition: form.value.targetPosition,
    targetPersonId: form.value.targetPersonId,
    target: targetText,
    priority: form.value.priority,
    enabled: form.value.enabled,
    hitCount: form.value.hitCount,
    trigger: form.value.trigger as AssignmentRule['trigger'],
    triggerNodeId: form.value.triggerNodeId,
    candidateScope: {
      type: scopeType as CandidateScopeType,
      ids: candidateIds,
      dynamicExpr: form.value.dynamicExpr,
    },
    strategy: form.value.strategy ?? 'load-balance',
    rulePriority: form.value.rulePriority,
    stopOnMatch: form.value.stopOnMatch,
    source: form.value.source ?? 'manual',
    evidence: form.value.evidence,
  };

  emit('save', rule);
  message.success(form.value.id ? '派单规则已更新' : '派单规则已创建');
  close();
}
</script>

<template>
  <Drawer
    :open="open"
    :title="form.id ? '编辑派单规则' : '新增派单规则'"
    :width="720"
    placement="right"
    :mask="true"
    :body-style="{ overflowX: 'hidden' }"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <div class="flex gap-4">
      <!-- 左侧表单区 -->
      <div class="min-w-0 flex-1">
        <!-- AI 解析依据（来源为 AI 解析的规则展示） -->
        <div v-if="form.source === 'ai' && form.evidence" class="ai-evidence">
          <div class="ai-evidence__header">
            <Tag color="purple" class="!mr-0">
              <Icon icon="lucide:sparkles" class="mr-1 size-3" />
              AI 解析规则
            </Tag>
            <span v-if="form.evidence.confidence" class="ai-evidence__meta">
              AI 置信度 {{ form.evidence.confidence }}
            </span>
          </div>
          <p class="ai-evidence__source">来源：{{ form.evidence.source }}</p>
          <blockquote class="ai-evidence__quote">
            {{ form.evidence.snippet }}
          </blockquote>
        </div>

        <Form layout="vertical" :model="form" class="rule-form">
          <FormItem label="规则名称" required>
            <Input
              v-model:value="form.name"
              placeholder="例如：VIP 客户优先派单"
            />
          </FormItem>

          <FormItem label="规则编码" required>
            <Input
              v-model:value="form.code"
              placeholder="如 rule-onsite-engineer"
            />
          </FormItem>

          <FormItem label="触发条件" required>
            <Input.TextArea
              v-model:value="form.condition"
              :rows="3"
              placeholder="如 工单类型 = 上门 AND 优先级 = 高"
            />
          </FormItem>

          <FormItem label="派单目标">
            <Select
              :value="form.candidateScopeType"
              :options="candidateScopeOptions"
              placeholder="选择派单目标"
              @change="onCandidateScopeTypeChange"
            />
          </FormItem>

          <div class="grid grid-cols-2 gap-3">
            <FormItem
              v-if="form.candidateScopeType === 'person'"
              label="目标人员"
              required
            >
              <Select
                v-model:value="form.targetPersonId"
                :options="staffOptions"
                placeholder="选择目标人员"
                option-filter-prop="label"
                show-search
              />
            </FormItem>

            <FormItem
              v-if="form.candidateScopeType === 'position'"
              label="目标岗位"
              required
            >
              <Select
                v-model:value="form.targetPosition"
                :options="positionOptions"
                placeholder="选择目标岗位"
                option-filter-prop="label"
                show-search
              />
            </FormItem>

            <FormItem
              v-if="form.candidateScopeType === 'role'"
              label="目标角色"
              required
            >
              <Select
                v-model:value="form.targetRoleId"
                :options="roleOptions"
                placeholder="选择目标角色"
                option-filter-prop="label"
                show-search
              />
            </FormItem>

            <FormItem
              v-if="
                form.candidateScopeType === 'position' ||
                form.candidateScopeType === 'role'
              "
              label="分配策略"
              required
            >
              <Select
                v-model:value="form.strategy"
                :options="strategyOptions"
                placeholder="选择分配策略"
              />
            </FormItem>
          </div>

          <FormItem
            v-if="form.candidateScopeType === 'dynamic'"
            label="动态人员表达式"
            required
          >
            <Input.TextArea
              v-model:value="form.dynamicExpr"
              :rows="2"
              placeholder="工单的负责人"
            />
          </FormItem>

          <FormItem label="启用状态">
            <Switch v-model:checked="form.enabled" />
          </FormItem>
        </Form>

        <div class="flex items-center justify-end gap-2 pt-4">
          <Button @click="close">取消</Button>
          <Button type="primary" @click="handleSave">保存</Button>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.rule-form :deep(.ant-form-item) {
  margin-bottom: 14px;
}

.ai-evidence {
  padding: 10px 12px;
  margin-bottom: 14px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
}

.ai-evidence__header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ai-evidence__header :deep(.ant-tag) {
  margin: 0;
}

.ai-evidence__meta {
  font-size: 11px;
  font-weight: 600;
  color: #7e22ce;
}

.ai-evidence__source {
  margin: 6px 0 4px;
  font-size: 11px;
  color: #6d827b;
}

.ai-evidence__quote {
  padding: 6px 10px;
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #1f3b34;
  background: #fff;
  border-left: 3px solid #a855f7;
  border-radius: 6px;
}
</style>
