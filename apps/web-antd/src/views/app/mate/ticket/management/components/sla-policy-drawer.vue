<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<!-- SLA 策略编辑抽屉：响应时效 / 解决时效两块独立区域，各含「从节点 → 到节点」计算规则与单条超时告警 -->
<script setup lang="ts">
import type { RuleEvidence, SlaConfig, TicketPriority } from '#/types/ticket';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  Switch,
} from 'ant-design-vue';

interface Props {
  /** Drawer 是否打开（支持 v-model:open） */
  open: boolean;
  /** 编辑时传入；新增时为 null */
  policy: null | SlaConfig;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save', policy: SlaConfig): void;
}>();

/** 通知对象选项（4 类角色） */
const targetOptions: Array<{ label: string; value: string }> = [
  { label: '派单员', value: 'dispatcher' },
  { label: '处理人', value: 'assignee' },
  { label: '部门领导', value: 'leader' },
  { label: '工单创建人', value: 'creator' },
];

/** 工单流程节点选项（计算规则：从哪个节点到哪个节点计时） */
const flowNodeOptions = [
  '工单创建',
  '工单受理',
  '待派单',
  '待接单',
  '处理中',
  '待验收',
  '已完成',
].map((name) => ({ label: name, value: name }));

/** 单块时效的超时告警（每块仅一条规则） */
interface SlaAlertForm {
  enabled: boolean;
  /** 超时后告警延迟（分钟） */
  atMinutes: number;
  /** 通知对象（多选，保存时按领导优先映射为单值 target） */
  targets: string[];
}

/** 表单结构：响应 / 解决各一块，保存时合并为 SlaConfig 兼容字段 */
interface SlaPolicyForm {
  id?: string;
  name: string;
  code: string;
  enabled: boolean;
  applyConditionText: string;
  // 响应时效块
  responseHours: number;
  responseStart: string;
  responseEnd: string;
  responseAlert: SlaAlertForm;
  // 解决时效块
  resolveHours: number;
  resolveStart: string;
  resolveEnd: string;
  resolveAlert: SlaAlertForm;
  // SlaConfig 兼容字段
  priority: TicketPriority;
  penalty: string;
  alertChannels: ('email' | 'in-app' | 'phone' | 'sms' | 'wecom')[];
  // 规则来源与 AI 解析依据（编辑时只读透传）
  source?: 'ai' | 'manual';
  evidence?: RuleEvidence;
}

function defaultAlert(): SlaAlertForm {
  return { enabled: true, atMinutes: 30, targets: ['assignee'] };
}

function defaultForm(): SlaPolicyForm {
  return {
    name: '',
    code: '',
    enabled: true,
    applyConditionText: '',
    responseHours: 1,
    responseStart: '工单创建',
    responseEnd: '待接单',
    responseAlert: defaultAlert(),
    resolveHours: 24,
    resolveStart: '工单创建',
    resolveEnd: '已完成',
    resolveAlert: { ...defaultAlert(), targets: ['leader'] },
    priority: 'medium',
    penalty: '',
    alertChannels: ['in-app'],
  };
}

/** SlaConfig 上的运行时扩展字段（保存时写入、回读时读取，静态类型不含） */
interface SlaPolicyExt {
  code?: string;
  applyConditionText?: string;
  responseStart?: string;
  responseEnd?: string;
  resolveStart?: string;
  resolveEnd?: string;
  responseAlertEnabled?: boolean;
  responseTimeoutRules?: Array<{
    atMinutes: number;
    target?: 'assignee' | 'leader';
  }>;
  resolveAlertEnabled?: boolean;
  resolveTimeoutRules?: Array<{
    atMinutes: number;
    target?: 'assignee' | 'leader';
  }>;
}

const form = ref<SlaPolicyForm>(defaultForm());

/** 同步外部 policy → 本地表单（告警取该块的第一条规则；节点优先读扩展字段，缺省按 startTiming 推断） */
watch(
  () => props.policy,
  (val) => {
    if (!val) {
      form.value = defaultForm();
      return;
    }
    const ext = val as SlaConfig & SlaPolicyExt;
    const responseRule = ext.responseTimeoutRules?.[0];
    const resolveRule = ext.resolveTimeoutRules?.[0];
    const defaultStart = val.startTiming === 'create' ? '工单创建' : '工单受理';
    form.value = {
      id: val.id,
      name: val.name ?? '',
      code: ext.code ?? '',
      enabled: val.enabled,
      applyConditionText: ext.applyConditionText ?? '',
      responseHours: val.responseHours ?? 1,
      responseStart: ext.responseStart ?? defaultStart,
      responseEnd: ext.responseEnd ?? '待接单',
      responseAlert: {
        enabled: ext.responseAlertEnabled ?? val.responseAlert.enabled,
        atMinutes:
          responseRule?.atMinutes ?? val.responseAlert.delayMinutes ?? 30,
        targets: responseRule
          ? [responseRule.target ?? 'assignee']
          : ['assignee'],
      },
      resolveHours: val.resolveHours ?? 24,
      resolveStart: ext.resolveStart ?? defaultStart,
      resolveEnd: ext.resolveEnd ?? '已完成',
      resolveAlert: {
        enabled: ext.resolveAlertEnabled ?? val.resolveAlert.enabled,
        atMinutes:
          resolveRule?.atMinutes ?? val.resolveAlert.delayMinutes ?? 60,
        targets: resolveRule ? [resolveRule.target ?? 'leader'] : ['leader'],
      },
      priority: val.priority ?? 'medium',
      penalty: ext.applyConditionText ?? val.penalty ?? '',
      alertChannels: ['in-app'],
      source: val.source,
      evidence: val.evidence,
    };
  },
  { immediate: true },
);

/** 同步 open=true 时重置表单（新增场景：policy 为 null） */
watch(
  () => props.open,
  (val) => {
    if (val && !props.policy) {
      form.value = defaultForm();
    }
  },
);

function close() {
  emit('update:open', false);
}

/** 校验单块时效配置 */
function validateSlab(
  label: string,
  hours: number | undefined,
  start: string,
  end: string,
): string {
  if (!hours || hours <= 0) return `请填写${label}`;
  if (!start || !end) return `请选择${label}计算节点`;
  if (start === end) return `${label}计算的起点与终点不能相同`;
  return '';
}

function handleSave() {
  if (!form.value.name.trim()) {
    message.warning('请填写策略名称');
    return;
  }
  if (!form.value.code.trim()) {
    message.warning('请填写策略编码');
    return;
  }
  if (!form.value.applyConditionText.trim()) {
    message.warning('请填写触发条件');
    return;
  }
  const responseError = validateSlab(
    '响应时效',
    form.value.responseHours,
    form.value.responseStart,
    form.value.responseEnd,
  );
  if (responseError) {
    message.warning(responseError);
    return;
  }
  const resolveError = validateSlab(
    '解决时效',
    form.value.resolveHours,
    form.value.resolveStart,
    form.value.resolveEnd,
  );
  if (resolveError) {
    message.warning(resolveError);
    return;
  }

  const id = form.value.id ?? `s-${Date.now()}`;
  // 单条告警 → SlaConfig 兼容结构（channels 固定站内信，target 按领导优先映射）
  const toTimeoutRule = (alert: SlaAlertForm, ruleId: string) => ({
    id: ruleId,
    atMinutes: Number(alert.atMinutes) || 0,
    target: (alert.targets.includes('leader') ? 'leader' : 'assignee') as
      'assignee' | 'leader',
    channels: ['in-app' as const],
  });
  // 构造合法 SlaConfig（含扩展字段，通过 as 断言保留运行时字段）
  const policy = {
    id,
    name: form.value.name.trim(),
    priority: form.value.priority,
    responseHours: Number(form.value.responseHours) || 1,
    resolveHours: Number(form.value.resolveHours) || 24,
    penalty: form.value.applyConditionText.trim(),
    responseAlert: {
      enabled: form.value.responseAlert.enabled,
      delayMinutes: form.value.responseAlert.atMinutes,
      targetPersonIds: [],
      channels: ['in-app' as const],
    },
    resolveAlert: {
      enabled: form.value.resolveAlert.enabled,
      delayMinutes: form.value.resolveAlert.atMinutes,
      targetPersonIds: [],
      channels: ['in-app' as const],
    },
    alertChannels: ['in-app' as const],
    enabled: form.value.enabled,
    startTiming: (form.value.responseStart === '工单创建'
      ? 'create'
      : 'accept') as 'accept' | 'create',
    // 扩展字段（运行时保留，类型通过 as SlaConfig 收窄）
    code: form.value.code.trim(),
    applyConditionText: form.value.applyConditionText.trim(),
    responseStart: form.value.responseStart,
    responseEnd: form.value.responseEnd,
    resolveStart: form.value.resolveStart,
    resolveEnd: form.value.resolveEnd,
    responseAlertEnabled: form.value.responseAlert.enabled,
    responseTimeoutRules: form.value.responseAlert.enabled
      ? [toTimeoutRule(form.value.responseAlert, `rtr-${Date.now()}`)]
      : [],
    resolveAlertEnabled: form.value.resolveAlert.enabled,
    resolveTimeoutRules: form.value.resolveAlert.enabled
      ? [toTimeoutRule(form.value.resolveAlert, `dtr-${Date.now()}`)]
      : [],
    source: form.value.source ?? 'manual',
    evidence: form.value.evidence,
  } as unknown as SlaConfig;

  emit('save', policy);
  message.success(form.value.id ? 'SLA 策略已更新' : 'SLA 策略已创建');
  close();
}
</script>

<template>
  <Drawer
    :open="open"
    :title="form.id ? '编辑 SLA 策略' : '新增 SLA 策略'"
    :width="720"
    placement="right"
    :mask="true"
    :body-style="{ overflowX: 'hidden' }"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <div class="sla-form">
      <!-- AI 解析依据（来源为 AI 解析的策略展示） -->
      <div v-if="form.source === 'ai' && form.evidence" class="ai-evidence">
        <div class="ai-evidence__header">
          <span class="ai-evidence__badge">
            <Icon icon="lucide:sparkles" />
            AI 解析规则
          </span>
          <span v-if="form.evidence.confidence" class="ai-evidence__meta">
            AI 置信度 {{ form.evidence.confidence }}
          </span>
        </div>
        <p class="ai-evidence__source">来源：{{ form.evidence.source }}</p>
        <blockquote class="ai-evidence__quote">
          {{ form.evidence.snippet }}
        </blockquote>
      </div>

      <Form layout="vertical" :model="form">
        <div class="grid grid-cols-2 gap-3">
          <FormItem label="策略名称" required>
            <Input
              v-model:value="form.name"
              placeholder="例如：VIP 客户运维 SLA"
            />
          </FormItem>
          <FormItem label="策略编码" required>
            <Input
              v-model:value="form.code"
              placeholder="如 sla-urgent-priority"
            />
          </FormItem>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <FormItem label="触发条件" required>
            <Input.TextArea
              v-model:value="form.applyConditionText"
              :rows="2"
              placeholder="如 客户等级为 VIP 的运维工单；7×24 小时响应。"
            />
          </FormItem>
          <div class="grid grid-cols-2 gap-3">
            <FormItem label="优先级">
              <Select
                v-model:value="form.priority"
                :options="[
                  { label: '紧急', value: 'urgent' },
                  { label: '高', value: 'high' },
                  { label: '中', value: 'medium' },
                  { label: '低', value: 'low' },
                ]"
              />
            </FormItem>
            <FormItem label="启用状态">
              <Switch v-model:checked="form.enabled" />
            </FormItem>
          </div>
        </div>

        <!-- ===== 响应时效块 ===== -->
        <section class="sla-slab sla-slab--response">
          <header class="sla-slab__head">
            <span class="sla-slab__icon sla-slab__icon--response">
              <Icon icon="lucide:timer" />
            </span>
            <div class="sla-slab__title">
              <strong>响应时效</strong>
              <p>从计时起点到工单首次被响应的最长允许时长</p>
            </div>
          </header>

          <div class="sla-calc">
            <div class="sla-calc__row">
              <span class="sla-calc__label">计算规则</span>
              <div class="sla-calc__nodes">
                <span class="sla-calc__cap">从</span>
                <Select
                  v-model:value="form.responseStart"
                  class="sla-calc__node"
                  :options="flowNodeOptions"
                  placeholder="起始节点"
                />
                <Icon icon="lucide:move-right" class="sla-calc__arrow" />
                <span class="sla-calc__cap">到</span>
                <Select
                  v-model:value="form.responseEnd"
                  class="sla-calc__node"
                  :options="flowNodeOptions"
                  placeholder="截止节点"
                />
              </div>
            </div>
            <div class="sla-calc__row">
              <span class="sla-calc__label">时效目标</span>
              <div class="sla-calc__hours">
                <InputNumber
                  v-model:value="form.responseHours"
                  :min="0.5"
                  :step="0.5"
                  style="width: 110px"
                />
                <span class="sla-calc__unit">小时</span>
                <small class="sla-calc__hint">
                  按所选节点区间计时时长，超出即视为响应超时
                </small>
              </div>
            </div>
          </div>

          <div class="sla-alert">
            <div class="sla-alert__head">
              <Icon icon="lucide:bell" class="sla-alert__bell" />
              <strong>超时告警</strong>
              <small>响应超时后的提醒动作</small>
              <Switch
                v-model:checked="form.responseAlert.enabled"
                size="small"
              />
            </div>
            <div v-if="form.responseAlert.enabled" class="sla-alert__body">
              <div class="sla-alert__row">
                <span class="sla-alert__label">超时</span>
                <InputNumber
                  v-model:value="form.responseAlert.atMinutes"
                  :min="0"
                  :step="5"
                  style="width: 110px"
                />
                <span class="sla-alert__unit">分钟后</span>
              </div>
              <div class="sla-alert__row">
                <span class="sla-alert__label">通知</span>
                <Select
                  v-model:value="form.responseAlert.targets"
                  class="sla-alert__targets"
                  mode="multiple"
                  placeholder="选择通知对象"
                  :options="targetOptions"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- ===== 解决时效块 ===== -->
        <section class="sla-slab sla-slab--resolve">
          <header class="sla-slab__head">
            <span class="sla-slab__icon sla-slab__icon--resolve">
              <Icon icon="lucide:hourglass" />
            </span>
            <div class="sla-slab__title">
              <strong>解决时效</strong>
              <p>从计时起点到工单完成解决的最长允许时长</p>
            </div>
          </header>

          <div class="sla-calc">
            <div class="sla-calc__row">
              <span class="sla-calc__label">计算规则</span>
              <div class="sla-calc__nodes">
                <span class="sla-calc__cap">从</span>
                <Select
                  v-model:value="form.resolveStart"
                  class="sla-calc__node"
                  :options="flowNodeOptions"
                  placeholder="起始节点"
                />
                <Icon icon="lucide:move-right" class="sla-calc__arrow" />
                <span class="sla-calc__cap">到</span>
                <Select
                  v-model:value="form.resolveEnd"
                  class="sla-calc__node"
                  :options="flowNodeOptions"
                  placeholder="截止节点"
                />
              </div>
            </div>
            <div class="sla-calc__row">
              <span class="sla-calc__label">时效目标</span>
              <div class="sla-calc__hours">
                <InputNumber
                  v-model:value="form.resolveHours"
                  :min="1"
                  :step="1"
                  style="width: 110px"
                />
                <span class="sla-calc__unit">小时</span>
                <small class="sla-calc__hint">
                  按所选节点区间计时时长，超出即视为解决超时
                </small>
              </div>
            </div>
          </div>

          <div class="sla-alert">
            <div class="sla-alert__head">
              <Icon icon="lucide:alarm-clock" class="sla-alert__bell" />
              <strong>超时告警</strong>
              <small>解决超时后的提醒动作</small>
              <Switch
                v-model:checked="form.resolveAlert.enabled"
                size="small"
              />
            </div>
            <div v-if="form.resolveAlert.enabled" class="sla-alert__body">
              <div class="sla-alert__row">
                <span class="sla-alert__label">超时</span>
                <InputNumber
                  v-model:value="form.resolveAlert.atMinutes"
                  :min="0"
                  :step="5"
                  style="width: 110px"
                />
                <span class="sla-alert__unit">分钟后</span>
              </div>
              <div class="sla-alert__row">
                <span class="sla-alert__label">通知</span>
                <Select
                  v-model:value="form.resolveAlert.targets"
                  class="sla-alert__targets"
                  mode="multiple"
                  placeholder="选择通知对象"
                  :options="targetOptions"
                />
              </div>
            </div>
          </div>
        </section>
      </Form>

      <div class="flex items-center justify-end gap-2 pt-4">
        <Button @click="close">取消</Button>
        <Button type="primary" @click="handleSave">保存</Button>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.sla-form :deep(.ant-form-item) {
  margin-bottom: 14px;
}

/* ===== AI 解析依据 ===== */
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

.ai-evidence__badge {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #7e22ce;
  background: #f3e8ff;
  border-radius: 999px;
}

.ai-evidence__badge svg {
  width: 11px;
  height: 11px;
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

/* ===== 时效块（响应 / 解决） ===== */
.sla-slab {
  padding: 16px;
  margin-top: 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

.sla-slab--response {
  background: linear-gradient(180deg, #fffdf8 0%, #fff7ec 100%);
  border-color: #f1ddb0;
}

.sla-slab--resolve {
  background: linear-gradient(180deg, #fdf8f6 0%, #fdf0ed 100%);
  border-color: #f0c4b5;
}

.sla-slab__head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.sla-slab__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #fff;
  border-radius: 11px;
  box-shadow: 0 3px 8px rgb(15 23 42 / 16%);
}

.sla-slab__icon svg {
  width: 19px;
  height: 19px;
}

.sla-slab__icon--response {
  background: linear-gradient(135deg, #f59e0b, #ea7c12);
}

.sla-slab__icon--resolve {
  background: linear-gradient(135deg, #f0715a, #d4452f);
}

.sla-slab__title strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #10231f;
}

.sla-slab__title p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #8a938c;
}

/* 计算规则 */
.sla-calc {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid rgb(15 23 42 / 6%);
  border-radius: 11px;
}

.sla-calc__row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sla-calc__row + .sla-calc__row {
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed #eef0ee;
}

.sla-calc__label {
  flex: none;
  width: 56px;
  font-size: 12px;
  font-weight: 600;
  color: #5f6b64;
}

.sla-calc__nodes {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.sla-calc__cap {
  flex: none;
  font-size: 12px;
  color: #8a938c;
}

.sla-calc__node {
  width: 128px;
}

.sla-calc__arrow {
  flex: none;
  width: 16px;
  height: 16px;
  color: #0b6e65;
}

.sla-calc__hours {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.sla-calc__unit {
  font-size: 12px;
  color: #5f6b64;
}

.sla-calc__hint {
  overflow: hidden;
  font-size: 11px;
  color: #9aa59e;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 超时告警 */
.sla-alert {
  padding: 10px 14px 12px;
  background: #fff;
  border: 1px dashed #e4d6bd;
  border-radius: 11px;
}

.sla-slab--resolve .sla-alert {
  border-color: #ecc9bc;
}

.sla-alert__head {
  display: flex;
  gap: 7px;
  align-items: center;
}

.sla-alert__head strong {
  font-size: 12.5px;
  font-weight: 700;
  color: #10231f;
}

.sla-alert__head small {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  color: #9aa59e;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sla-alert__bell {
  flex: none;
  width: 14px;
  height: 14px;
  color: #d97706;
}

.sla-slab--resolve .sla-alert__bell {
  color: #d4452f;
}

.sla-alert__body {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  align-items: center;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed #eef0ee;
}

.sla-alert__row {
  display: flex;
  gap: 7px;
  align-items: center;
}

.sla-alert__label {
  flex: none;
  font-size: 12px;
  color: #5f6b64;
}

.sla-alert__unit {
  font-size: 12px;
  color: #5f6b64;
}

.sla-alert__targets {
  width: 260px;
}
</style>
