<script setup lang="ts">
import type {
  ContractLifecycleAction,
  ContractManagementConfig,
} from '#/types/contract-assistant';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import { deepClone } from '#/utils/deep-clone';

import { defaultExpiryActions } from '../utils/implementation-presets';
import ContractMessageTemplateSelect from './contract-message-template-select.vue';
import LifecycleConfigEditor from './lifecycle-config-editor.vue';

const props = defineProps<{ readonly?: boolean }>();
const model = defineModel<ContractManagementConfig['lifecycle']>({
  required: true,
});
const savedReminders = ref<ContractLifecycleAction[]>([]);
const savedReview = ref<ContractLifecycleAction>();
const roles = [
  { value: '合同负责人', label: '合同负责人' },
  { value: '合同管理员', label: '合同管理员' },
  { value: '上传人', label: '上传人' },
];
const review = computed(() =>
  model.value.actions.find((item) => item.purpose === 'renewal-review'),
);
const reminderActions = computed(() =>
  model.value.actions.filter(
    (item) =>
      item.purpose !== 'renewal-review' && item.trigger !== 'renewal-confirmed',
  ),
);
const beforeActions = computed(() =>
  reminderActions.value.filter(
    (item) => item.trigger === 'before-expiry' && item.action === 'message',
  ),
);
const sameDay = computed(() =>
  reminderActions.value.some(
    (item) => item.trigger === 'on-expiry' && item.action === 'message',
  ),
);
const extraActions = computed(() =>
  model.value.actions.filter(
    (item) =>
      item.purpose !== 'renewal-review' &&
      !(
        item.action === 'message' &&
        ['before-expiry', 'on-expiry'].includes(item.trigger)
      ),
  ),
);
const recipients = computed({
  get: () => reminderActions.value[0]?.recipients || ['合同负责人'],
  set: (value: string[]) => {
    for (const action of reminderActions.value) action.recipients = [...value];
  },
});
function createReview() {
  return {
    id: `renewal-review-${Date.now()}`,
    purpose: 'renewal-review' as const,
    name: '续约评估',
    trigger: 'before-expiry' as const,
    days: 30,
    action: 'todo' as const,
    recipients: ['合同负责人'],
    description:
      model.value.renewalInstructions ||
      '评估是否续约并记录结论；续签后关联新旧合同。',
    stopWhen: ['已续约', '已终止', '已作废'],
  };
}
watch(
  () => model.value.automaticRenewal,
  (mode) => {
    if (props.readonly) return;
    if (mode === 'none') {
      if (review.value) savedReview.value = deepClone(review.value);
      model.value.actions = model.value.actions.filter(
        (item) => item.purpose !== 'renewal-review',
      );
    } else if (!review.value)
      model.value.actions.push(
        savedReview.value ? deepClone(savedReview.value) : createReview(),
      );
  },
  { immediate: true },
);
watch(
  () => model.value.renewalInstructions,
  (text) => {
    if (!props.readonly && review.value) review.value.description = text;
  },
);
function toggleReminders(enabled: boolean) {
  if (props.readonly) return;
  if (enabled)
    model.value.actions.push(
      ...deepClone(
        savedReminders.value.length > 0
          ? savedReminders.value
          : defaultExpiryActions(`expiry-${Date.now()}`),
      ),
    );
  else {
    savedReminders.value = deepClone(reminderActions.value);
    model.value.actions = model.value.actions.filter(
      (item) => !reminderActions.value.includes(item),
    );
  }
}
function addTime() {
  if (props.readonly) return;
  const used = beforeActions.value.map((item) => item.days);
  const days =
    [30, 60, 7, 90].find((day) => !used.includes(day)) ||
    Math.max(0, ...used) + 1;
  const action = defaultExpiryActions(`expiry-${Date.now()}`)[0]!;
  action.days = days;
  action.recipients = [...recipients.value];
  model.value.actions.push(action);
}
function toggleSameDay(checked: boolean) {
  if (props.readonly) return;
  if (checked && !sameDay.value) {
    const action = defaultExpiryActions(`expiry-${Date.now()}`)[1]!;
    action.recipients = [...recipients.value];
    model.value.actions.push(action);
  } else if (!checked)
    model.value.actions = model.value.actions.filter(
      (item) =>
        !(
          item.purpose !== 'renewal-review' &&
          item.trigger === 'on-expiry' &&
          item.action === 'message'
        ),
    );
}
function remove(id: string) {
  if (!props.readonly)
    model.value.actions = model.value.actions.filter((item) => item.id !== id);
}
function triggerText(item: ContractLifecycleAction) {
  if (item.trigger === 'before-expiry') return `到期前${item.days}天`;
  if (item.trigger === 'after-expiry') return `到期后${item.days}天`;
  if (item.trigger === 'on-expiry') return '到期当天';
  return '确认需要续约后';
}
const merged = (item: ContractLifecycleAction) =>
  !!review.value &&
  item.action === 'message' &&
  item.trigger === review.value.trigger &&
  item.days === review.value.days &&
  item.recipients.toSorted().join('|') ===
    review.value.recipients.toSorted().join('|');
</script>
<template>
  <div class="lifecycle-settings">
    <section class="setting-card">
      <header>
        <div class="section-title">
          <span class="section-icon"><Icon icon="lucide:bell-ring" /></span>
          <div>
            <h3>到期提醒</h3>
            <p>确定何时提醒、提醒谁</p>
          </div>
        </div>
        <Switch
          :checked="reminderActions.length > 0"
          :disabled="readonly"
          checked-children="开启"
          un-checked-children="关闭"
          aria-label="开启到期提醒"
          @change="(value) => toggleReminders(!!value)"
        />
      </header>
      <div v-if="reminderActions.length > 0" class="settings-body">
        <div class="setting-row">
          <span class="field-label">提前提醒</span>
          <div class="time-options">
            <div
              v-for="action in beforeActions"
              :key="action.id"
              class="time-chip"
            >
              <span>到期前</span>
              <InputNumber
                v-model:value="action.days"
                :disabled="readonly"
                :min="1"
                :max="3650"
                :precision="0"
                size="small"
                aria-label="提前提醒天数"
              />
              <span>天</span>
              <Button
                type="text"
                size="small"
                :disabled="readonly"
                aria-label="移除提前提醒"
                @click="remove(action.id)"
              >
                <Icon icon="lucide:x" />
              </Button>
            </div>
            <Button
              type="link"
              size="small"
              :disabled="readonly"
              @click="addTime"
            >
              <Icon icon="lucide:plus" />
              增加提醒时间
            </Button>
          </div>
        </div>
        <div class="setting-row">
          <span class="field-label">当天提醒</span>
          <Checkbox
            :checked="sameDay"
            :disabled="readonly"
            @change="(event) => toggleSameDay(!!event.target.checked)"
          >
            合同到期当天提醒
          </Checkbox>
        </div>
        <div class="setting-row">
          <span class="field-label">
            接收人
            <i>*</i>
          </span>
          <Select
            v-model:value="recipients"
            mode="tags"
            :disabled="readonly"
            :options="roles"
            placeholder="选择接收角色"
            class="role-select"
          />
        </div>
        <div class="setting-row">
          <span class="field-label">
            消息模版
            <i>*</i>
          </span>
          <ContractMessageTemplateSelect
            v-model="model.reminderTemplateId"
            :disabled="readonly"
            class="role-select"
          />
        </div>
        <p class="date-hint">
          <Icon icon="lucide:info" />
          使用建档时确认的到期日期；日期未确认时不触发提醒。
        </p>
      </div>
      <p v-else class="off-hint">
        本类型不发送常规到期提醒；续约评估可单独开启。
      </p>
      <details class="advanced-settings">
        <summary>
          更多设置：到期后提醒及其他处理事项
          <Tag v-if="extraActions.length > 0">{{ extraActions.length }}项</Tag>
        </summary>
        <div :inert="readonly">
          <LifecycleConfigEditor
            v-model="model"
            section="expiry"
            hide-renewal-review
          />
        </div>
      </details>
    </section>
    <section class="setting-card">
      <header>
        <div class="section-title">
          <span class="section-icon"><Icon icon="lucide:refresh-cw" /></span>
          <div>
            <h3>续约处理</h3>
            <p>到期前是否需要评估续约？</p>
          </div>
        </div>
        <Switch
          :checked="model.automaticRenewal !== 'none'"
          :disabled="readonly"
          checked-children="需要"
          un-checked-children="不需要"
          aria-label="开启续约评估"
          @change="
            (value) => (model.automaticRenewal = value ? 'confirm' : 'none')
          "
        />
      </header>
      <div v-if="model.automaticRenewal !== 'none'" class="settings-body">
        <template v-if="review">
          <div class="setting-row">
            <span class="field-label">开始时间</span>
            <div class="inline-control">
              到期前
              <InputNumber
                v-model:value="review.days"
                :disabled="readonly"
                :min="1"
                :max="3650"
                :precision="0"
                aria-label="续约评估提前天数"
              />
              天生成评估待办
            </div>
          </div>
          <div class="setting-row">
            <span class="field-label">
              处理人
              <i>*</i>
            </span>
            <Select
              v-model:value="review.recipients"
              mode="tags"
              :disabled="readonly"
              :options="roles"
              class="role-select"
              placeholder="选择处理角色"
            />
          </div>
        </template>
        <div class="setting-row align-top">
          <span class="field-label">
            处理要求
            <i>*</i>
          </span>
          <Input.TextArea
            v-model:value="model.renewalInstructions"
            :disabled="readonly"
            :rows="2"
            placeholder="评估是否续约，记录结论；续签后关联新旧合同。"
          />
        </div>
        <div class="setting-row align-top">
          <span class="field-label">续约条款</span>
          <div>
            <Checkbox
              :checked="model.automaticRenewal === 'clause'"
              :disabled="readonly"
              @change="
                (event) =>
                  (model.automaticRenewal = event.target.checked
                    ? 'clause'
                    : 'confirm')
              "
            >
              识别合同中的自动续约条款
            </Checkbox>
            <p class="field-help">提取条款后交用户确认，不自动执行续约。</p>
          </div>
        </div>
      </div>
      <p v-else class="off-hint">
        不生成续约评估待办，合同到期仍按提醒设置处理。
      </p>
    </section>
    <details class="setting-card change-settings">
      <summary>
        <span class="section-title">
          <span class="section-icon"><Icon icon="lucide:file-pen-line" /></span>
          <span>
            <strong>变更处理</strong>
            <small>系统默认执行，按需补充人工要求</small>
          </span>
        </span>
        <Icon icon="lucide:chevron-down" />
      </summary>
      <div class="settings-body">
        <ul class="default-rules">
          <li>到期日期调整后，重新计算尚未触发的提醒。</li>
          <li>合同终止或作废后，取消不再适用的提醒。</li>
          <li>保留已发送消息、处理结果及历史版本。</li>
        </ul>
        <details class="manual-requirements">
          <summary>补充人工处理要求</summary>
          <Input.TextArea
            v-model:value="model.changeHandling"
            :disabled="readonly"
            :rows="3"
            placeholder="如：核对续签附件、交接未完成事项。此处为人工办理说明。"
          />
        </details>
      </div>
    </details>
    <section class="effect-preview">
      <Icon icon="lucide:list-checks" />
      <div>
        <h3>配置效果</h3>
        <p v-if="model.actions.length === 0">
          本类型未配置到期提醒或处理待办。
        </p>
        <ul v-else>
          <li v-for="action in model.actions" :key="action.id">
            <template v-if="merged(action)">
              {{
                triggerText(action)
              }}的到期提示合并至续约评估待办，不重复通知。
            </template>
            <template v-else>
              {{ triggerText(action) }}，{{
                action.action === 'message'
                  ? '提醒'
                  : action.action === 'todo'
                    ? `生成“${action.name}”待办，交由`
                    : '生成续签草稿，交由'
              }}
              {{ action.recipients.join('、') || '待设置接收人'
              }}{{
                action.action === 'message' ? '核对合同到期安排' : '处理'
              }}。
            </template>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
<style scoped>
.lifecycle-settings {
  display: grid;
  gap: 16px;
}
.setting-card {
  border: 1px solid #dfe8e3;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}
.setting-card > header,
.change-settings > summary {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 11px;
}
.section-icon {
  display: grid;
  place-items: center;
  background: #edf5f0;
  color: #39715b;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  font-size: 17px;
}
h3 {
  font-size: 15px;
  color: #2c513f;
  margin: 0;
}
header p,
.section-title small {
  display: block;
  font-size: 12px;
  color: #82928a;
  margin: 5px 0 0;
}
.section-title strong {
  font-size: 14px;
  color: #2c513f;
}
.settings-body {
  padding: 4px 18px 18px;
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 16px;
  font-size: 13px;
  color: #415e4d;
}
.field-label {
  flex: 0 0 80px;
  color: #6e8275;
}
.field-label i {
  color: #dc2626;
  font-style: normal;
}
.time-options,
.time-chip,
.inline-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.time-chip {
  padding: 5px 7px;
  background: #f7f9f8;
  border: 1px solid #e5ece8;
  border-radius: 7px;
}
.time-chip :deep(.ant-input-number) {
  width: 66px;
}
.inline-control :deep(.ant-input-number) {
  width: 80px;
}
.role-select {
  width: 310px;
  max-width: 100%;
}
.setting-row > .ant-input-textarea,
.setting-row > textarea {
  flex: 1;
}
.align-top {
  align-items: flex-start;
}
.field-help,
.date-hint {
  font-size: 12px;
  color: #84968b;
  margin: 9px 0 0;
  line-height: 1.7;
}
.date-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
}
.off-hint {
  padding: 0 18px 16px;
  margin: 0;
  font-size: 12px;
  color: #84968b;
}
.advanced-settings {
  border-top: 1px solid #edf1ee;
  padding: 12px 18px;
}
.advanced-settings > summary,
.manual-requirements > summary {
  cursor: pointer;
  color: #678573;
  font-size: 12px;
}
.advanced-settings > div {
  margin-top: 14px;
}
.content-editor {
  margin: 10px 0 0 98px;
  display: grid;
  gap: 10px;
}
.content-editor label > span {
  display: block;
  margin-bottom: 6px;
  color: #71877a;
  font-size: 12px;
}
.change-settings > summary {
  cursor: pointer;
  list-style: none;
}
.change-settings > summary::-webkit-details-marker {
  display: none;
}
.default-rules {
  padding-left: 18px;
  margin: 0;
  color: #6e8275;
  font-size: 12px;
  line-height: 2;
}
.manual-requirements {
  margin-top: 12px;
}
.manual-requirements textarea {
  margin-top: 10px;
}
.effect-preview {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #d9e8df;
  background: #f0f7f3;
  border-radius: 10px;
  padding: 16px 18px;
  color: #456c56;
}
.effect-preview > svg {
  margin-top: 2px;
  font-size: 18px;
}
.effect-preview h3 {
  font-size: 14px;
}
.effect-preview ul {
  padding-left: 16px;
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.9;
}
.effect-preview p {
  font-size: 12px;
  margin: 8px 0 0;
}
@media (max-width: 700px) {
  .setting-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .field-label {
    flex-basis: 100%;
  }
  .content-editor {
    margin-left: 0;
  }
  .role-select {
    width: 100%;
  }
}
</style>
