<script setup lang="ts">
import type { ContractManagementConfig } from '#/types/contract-assistant';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, InputNumber, Select } from 'ant-design-vue';

import ContractMessageTemplateSelect from './contract-message-template-select.vue';

const props = withDefaults(
  defineProps<{ hideRenewalReview?: boolean; section?: 'all' | 'expiry' }>(),
  { section: 'all' },
);

const model = defineModel<ContractManagementConfig['lifecycle']>({
  required: true,
});
const visibleActions = computed(() =>
  model.value.actions
    .map((action, index) => ({ action, index }))
    .filter(
      ({ action }) =>
        !props.hideRenewalReview || action.purpose !== 'renewal-review',
    ),
);
const startOptions = [
  { value: 'fixed', label: '合同明确的固定日期' },
  { value: 'signing', label: '签约日' },
  { value: 'delivery', label: '到货日' },
  { value: 'acceptance', label: '验收日' },
  { value: 'go-live', label: '上线日' },
  { value: 'contract', label: '按每份合同约定识别并确认' },
];
const triggers = [
  { value: 'before-expiry', label: '到期前' },
  { value: 'on-expiry', label: '到期当天' },
  { value: 'after-expiry', label: '到期后' },
  { value: 'renewal-confirmed', label: '人工确认需要续约后' },
];
function add() {
  model.value.actions.push({
    id: `action-${Date.now()}-${model.value.actions.length}`,
    name: '',
    trigger: 'before-expiry',
    days: 30,
    action: 'message',
    recipients: ['合同负责人'],
    description: '',
    stopWhen: ['已续约', '已终止', '已作废'],
  });
}
function changeTrigger(index: number) {
  const item = model.value.actions[index];
  if (item) {
    if (!['after-expiry', 'before-expiry'].includes(item.trigger))
      item.days = 0;
    if (item.action === 'renewal-draft' && item.trigger !== 'renewal-confirmed')
      item.action = 'todo';
  }
}
</script>
<template>
  <div class="lifecycle-editor">
    <section v-if="section === 'all'" class="config-card">
      <header>
        <Icon icon="lucide:calendar-clock" />
        <div>
          <h3>生效与期限</h3>
          <p>配置取值规则，实际日期在合同建档时核对</p>
        </div>
      </header>
      <div class="config-body">
        <div class="form-grid">
          <label>
            <span>
              服务／合同起算依据
              <b>*</b>
            </span>
            <Select v-model:value="model.startBasis" :options="startOptions" />
          </label>
          <label>
            <span>
              到期日期取值方式
              <b>*</b>
            </span>
            <Select
              v-model:value="model.expiryBasis"
              :options="[
                { value: 'explicit', label: '使用合同明确的到期日期' },
                { value: 'duration', label: '从起算日期计算有效期限' },
                { value: 'contract', label: '按合同约定识别并人工确认' },
              ]"
            />
          </label>
          <label v-if="model.expiryBasis === 'duration'">
            <span>
              有效期限（月）
              <b>*</b>
            </span>
            <InputNumber
              v-model:value="model.durationMonths"
              :min="1"
              :max="1200"
              :precision="0"
            />
          </label>
          <label>
            <span>
              日期缺失时怎么办
              <b>*</b>
            </span>
            <Select
              v-model:value="model.missingDate"
              :options="[
                { value: 'ask', label: '请上传人补充并确认' },
                {
                  value: 'estimate',
                  label: '允许提出估算日期，人工确认后生效',
                },
              ]"
            />
          </label>
        </div>
        <p class="field-help">
          估算日期须记录依据并由上传人确认；未确认日期不触发到期提醒。
        </p>
      </div>
    </section>
    <section v-if="section === 'all'" class="config-card">
      <header>
        <Icon icon="lucide:repeat-2" />
        <div>
          <h3>续约与日期变更</h3>
          <p>合同条款识别不等于自动续约</p>
        </div>
      </header>
      <div class="config-body">
        <label>
          <span>
            续约处理方式
            <b>*</b>
          </span>
          <Select
            v-model:value="model.automaticRenewal"
            :options="[
              { value: 'none', label: '不配置续约处理' },
              { value: 'confirm', label: '到期前人工评估是否续约' },
              { value: 'clause', label: '识别自动续约条款，由负责人确认' },
            ]"
          />
        </label>
        <label v-if="model.automaticRenewal !== 'none'" class="mt-4">
          <span>
            续约确认要求
            <b>*</b>
          </span>
          <Input.TextArea
            v-model:value="model.renewalInstructions"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            placeholder="说明续约决策、通知期限，以及生成续签草稿的前提"
          />
        </label>
        <label class="mt-4">
          <span>
            日期变更、终止与作废如何处理
            <b>*</b>
          </span>
          <Input.TextArea
            v-model:value="model.changeHandling"
            :auto-size="{ minRows: 2, maxRows: 5 }"
          />
        </label>
      </div>
    </section>
    <section class="config-card">
      <header>
        <Icon icon="lucide:bell-ring" />
        <div>
          <h3>
            到期处理事项
            <small>{{ visibleActions.length }} 项</small>
          </h3>
          <p>可配置多次提醒、续约待办和续签草稿；不在这里生成业务计划</p>
        </div>
        <Button size="small" class="add-action" @click="add">
          <Icon icon="lucide:plus" />
          添加事项
        </Button>
      </header>
      <div class="config-body">
        <p v-if="visibleActions.length === 0" class="field-help">
          尚未配置到期事项。如本类别不需要提醒，可直接保存。
        </p>
        <details
          v-for="{ action, index } in visibleActions"
          :key="action.id"
          class="action-card"
          open
        >
          <summary class="action-heading">
            <span class="action-heading-label">
              <Icon icon="lucide:chevron-right" class="action-chevron" />
              <span>
                事项 {{ String(index + 1).padStart(2, '0') }}
                <strong>{{ action.name || '未命名事项' }}</strong>
              </span>
            </span>
            <Button
              type="text"
              danger
              size="small"
              :aria-label="`删除事项${index + 1}`"
              @click.stop.prevent="model.actions.splice(index, 1)"
            >
              <Icon icon="lucide:trash-2" />
            </Button>
          </summary>
          <label>
            <span>
              事项名称
              <b>*</b>
            </span>
            <Input
              v-model:value="action.name"
              placeholder="例如：续约评估、到期前再次提醒"
            />
          </label>
          <div class="form-grid mt-4">
            <label>
              <span>
                何时触发
                <b>*</b>
              </span>
              <Select
                v-model:value="action.trigger"
                :options="triggers"
                @change="changeTrigger(index)"
              />
            </label>
            <label
              v-if="['before-expiry', 'after-expiry'].includes(action.trigger)"
            >
              <span>
                {{ action.trigger === 'before-expiry' ? '提前' : '延后' }}天数
                <b>*</b>
              </span>
              <InputNumber
                v-model:value="action.days"
                :min="1"
                :max="3650"
                :precision="0"
              />
            </label>
            <label>
              <span>
                处理方式
                <b>*</b>
              </span>
              <Select
                v-model:value="action.action"
                :options="[
                  { value: 'message', label: '发送消息' },
                  { value: 'todo', label: '生成待办' },
                  {
                    value: 'renewal-draft',
                    label: '生成续签草稿',
                    disabled: action.trigger !== 'renewal-confirmed',
                  },
                ]"
              />
            </label>
            <label>
              <span>
                接收人／责任角色
                <b>*</b>
              </span>
              <Select
                v-model:value="action.recipients"
                mode="tags"
                :options="
                  ['合同负责人', '合同管理员', '上传人', '相关业务负责人'].map(
                    (value) => ({ value, label: value }),
                  )
                "
                placeholder="可输入具体人员或角色"
              />
            </label>
          </div>
          <label v-if="action.action === 'message'" class="mt-4">
            <span>
              消息模版
              <b>*</b>
            </span>
            <ContractMessageTemplateSelect v-model="model.reminderTemplateId" />
          </label>
          <label v-else class="mt-4">
            <span>
              处理要求
              <b>*</b>
            </span>
            <Input.TextArea
              v-model:value="action.description"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              placeholder="说明本次提醒或待办需要完成什么"
            />
          </label>
        </details>
        <p class="field-help">
          同一合同、同一配置事项、同一到期周期只触发一次；确认日期变更后重算未触发事项，保留已发送记录。
        </p>
      </div>
    </section>
  </div>
</template>
<style scoped>
.lifecycle-editor {
  display: grid;
  gap: 16px;
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

.config-card h3 small {
  margin-left: 8px;
  font-size: 10px;
  font-weight: 400;
  color: #8da194;
}

.config-card header p {
  margin-top: 4px;
  font-size: 11px;
  color: #94a398;
}

.config-body {
  padding: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #536e5e;
}

b {
  font-weight: 500;
  color: #ef4444;
}

.field-help {
  margin-top: 10px;
  font-size: 11px;
  line-height: 21px;
  color: #9ba99e;
}

.action-card {
  padding: 14px;
  margin-bottom: 14px;
  background: #fcfefc;
  border: 1px solid #dfe9e2;
  border-radius: 10px;
}

.action-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
  font-size: 10px;
  font-weight: 650;
  color: #84a18f;
  cursor: pointer;
  list-style: none;
}

.add-action {
  margin-left: auto;
}

.config-body :deep(.ant-input-number) {
  width: 100%;
}

.config-body :deep(.ant-checkbox-group) {
  gap: 9px;
}

:deep(.ant-btn) {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

@media (max-width: 650px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .config-card > header {
    flex-wrap: wrap;
  }

  .add-action {
    margin-left: 0;
  }
}

.action-heading::-webkit-details-marker {
  display: none;
}

.action-card[open] > .action-heading {
  margin-bottom: 12px;
}

.action-heading-label {
  display: flex;
  gap: 9px;
  align-items: center;
  min-width: 0;
}

.action-heading-label > span {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.action-heading-label strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 550;
  color: #5c7c67;
  white-space: nowrap;
}

.action-chevron {
  flex: none;
  font-size: 15px;
  transition: transform 0.15s;
}

.action-card[open] .action-chevron {
  transform: rotate(90deg);
}

.action-heading:focus-visible {
  outline: 2px solid #6fa88a;
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
