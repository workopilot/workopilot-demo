<script setup lang="ts">
import type { ContractFulfillmentConfig } from '#/types/contract-assistant';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Empty,
  Input,
  InputNumber,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  createFulfillmentPreset,
  fulfillmentPresets,
} from '../utils/implementation-presets';

defineProps<{
  fields: { label: string; type: string; value: string }[];
  readonly?: boolean;
}>();
const emit = defineEmits<{ ensureFields: [keys: string[]] }>();
const model = defineModel<ContractFulfillmentConfig[]>({ required: true });
function toggle(type: ContractFulfillmentConfig['type'], checked: boolean) {
  if (!checked) {
    model.value = model.value.filter((item) => item.type !== type);
    return;
  }
  const item = createFulfillmentPreset(
    type,
    `fulfillment-${Date.now()}-${model.value.length}`,
  );
  emit('ensureFields', item.fields);
  model.value.push(item);
}
const triggers = [
  { value: 'contract', label: '按每份合同约定识别' },
  { value: 'archived', label: '合同建档后' },
  { value: 'before-date', label: '指定日期前' },
  { value: 'on-date', label: '指定日期当天' },
  { value: 'after-event', label: '事件完成后' },
];
</script>
<template>
  <section class="fulfillment-editor">
    <header>
      <div>
        <h3>选择需要跟踪的履约事项</h3>
        <p>系统预选相关字段；日期、金额、频次及履约方从具体合同提取后确认。</p>
      </div>
      <Button :disabled="readonly" @click="toggle('custom', true)">
        <Icon icon="lucide:plus" />
        自定义事项
      </Button>
    </header>
    <div class="preset-options">
      <label v-for="preset in fulfillmentPresets" :key="preset.type">
        <Checkbox
          :checked="model.some((item) => item.type === preset.type)"
          :disabled="readonly"
          @change="(event) => toggle(preset.type, event.target.checked)"
        >
          {{ preset.name }}
        </Checkbox>
        <small>{{ preset.description }}</small>
      </label>
    </div>
    <Empty
      v-if="model.length === 0"
      description="可勾选需要跟踪的事项，不需要时可留空"
    />
    <section v-for="(item, index) in model" :key="item.id" class="item-card">
      <header>
        <strong>{{ item.name || '自定义事项' }}</strong>
        <Button
          :disabled="readonly"
          type="text"
          danger
          size="small"
          @click="model.splice(index, 1)"
        >
          <Icon icon="lucide:trash-2" />
        </Button>
      </header>
      <div class="simple-fields">
        <label>
          <span>事项名称</span>
          <Input
            v-model:value="item.name"
            :disabled="readonly"
            placeholder="如：设备交付"
          />
        </label>
        <label>
          <span>提前提醒</span>
          <InputNumber
            v-model:value="item.reminderDays"
            :disabled="readonly"
            :min="0"
            :max="3650"
            :precision="0"
            placeholder="默认3"
            addon-after="天"
          />
        </label>
      </div>
      <p class="defaults">
        跟进人：{{
          item.responsibility === 'owner'
            ? '合同负责人'
            : item.responsibility === 'field'
              ? fields.find((field) => field.value === item.ownerField)
                  ?.label || '人员字段待选择'
              : '执行时指定'
        }}
        · 办理方式：{{ item.method === 'manual' ? '人工跟进' : '数字员工承接' }}
      </p>
      <div class="field-tags">
        <Tag v-for="key in item.fields" :key="key">
          {{ fields.find((field) => field.value === key)?.label || key }}
        </Tag>
        <span v-if="item.fields.length === 0">
          暂无关联字段，可在高级设置中选择
        </span>
      </div>
      <details>
        <summary>
          高级设置
          <span
            v-if="
              item.method === 'assistant' ||
              item.responsibility === 'field' ||
              item.trigger !== 'contract'
            "
          >
            已配置
          </span>
        </summary>
        <div class="advanced-fields">
          <label>
            <span>关联字段</span>
            <Select
              v-model:value="item.fields"
              mode="multiple"
              :disabled="readonly"
              :options="fields"
            />
          </label>
          <label>
            <span>时间安排</span>
            <Select
              v-model:value="item.schedule"
              :disabled="readonly"
              :options="[
                { value: 'contract', label: '按合同识别' },
                { value: 'once', label: '一次性' },
                { value: 'staged', label: '分期' },
                { value: 'recurring', label: '周期执行' },
              ]"
              placeholder="按合同识别"
            />
          </label>
          <label>
            <span>履约方</span>
            <Select
              v-model:value="item.party"
              :disabled="readonly"
              :options="[
                { value: 'contract', label: '按合同识别' },
                { value: 'our', label: '我方' },
                { value: 'counterparty', label: '对方' },
              ]"
              placeholder="按合同识别"
            />
          </label>
          <label>
            <span>触发条件</span>
            <Select
              v-model:value="item.trigger"
              :disabled="readonly"
              :options="triggers"
            />
          </label>
          <label v-if="['before-date', 'on-date'].includes(item.trigger)">
            <span>日期字段</span>
            <Select
              v-model:value="item.triggerField"
              :disabled="readonly"
              :options="fields.filter((field) => field.type === 'date')"
            />
          </label>
          <label v-if="item.trigger === 'before-date'">
            <span>触发提前天数</span>
            <InputNumber
              v-model:value="item.advanceDays"
              :disabled="readonly"
              :min="0"
              :max="3650"
              :precision="0"
            />
          </label>
          <label v-if="item.trigger === 'after-event'">
            <span>触发事件</span>
            <Input
              v-model:value="item.event"
              :disabled="readonly"
              placeholder="如：客户验收完成"
            />
          </label>
          <label>
            <span>跟进人</span>
            <Select
              v-model:value="item.responsibility"
              :disabled="readonly"
              :options="[
                { value: 'owner', label: '合同负责人' },
                { value: 'field', label: '引用人员字段' },
                { value: 'execution', label: '执行时指定' },
              ]"
            />
          </label>
          <label v-if="item.responsibility === 'field'">
            <span>人员字段</span>
            <Select
              v-model:value="item.ownerField"
              :disabled="readonly"
              :options="fields"
            />
          </label>
          <label>
            <span>办理方式</span>
            <Select
              v-model:value="item.method"
              :disabled="readonly"
              :options="[
                { value: 'manual', label: '人工跟进' },
                { value: 'assistant', label: '数字员工承接' },
              ]"
            />
          </label>
          <label v-if="item.method === 'assistant'">
            <span>承接数字员工</span>
            <Select
              v-model:value="item.handler"
              :disabled="readonly"
              :options="[
                { value: 'pmo', label: '交付项目PMO' },
                { value: 'sales', label: 'AI销售助理' },
                { value: 'ticket', label: '工单助理' },
              ]"
            />
          </label>
        </div>
      </details>
    </section>
  </section>
</template>
<style scoped>
.fulfillment-editor > header,
.item-card > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h3 {
  margin: 0;
  color: #2c513f;
  font-size: 15px;
}
header p,
.defaults {
  font-size: 12px;
  color: #91a095;
  margin: 6px 0 0;
}
.preset-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin: 18px 0;
}
.preset-options > label {
  padding: 12px;
  border: 1px solid #dce8df;
  border-radius: 8px;
  background: #f7faf8;
}
.preset-options small {
  display: block;
  font-size: 11px;
  color: #91a095;
  margin-top: 7px;
}
.item-card {
  padding: 16px;
  border: 1px solid #dce8df;
  border-radius: 10px;
  margin-top: 14px;
}
.item-card > header {
  font-size: 13px;
  color: #385b45;
}
.simple-fields,
.advanced-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 12px;
}
label > span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #466051;
}
.simple-fields :deep(.ant-input-number),
.advanced-fields :deep(.ant-select),
.advanced-fields :deep(.ant-input-number) {
  width: 100%;
}
.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 12px 0;
}
.field-tags > span {
  font-size: 11px;
  color: #91a095;
}
summary {
  font-size: 12px;
  cursor: pointer;
  color: #4a755b;
}
summary > span {
  color: #c58c33;
  margin-left: 8px;
}
@media (max-width: 900px) {
  .preset-options {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .simple-fields,
  .advanced-fields {
    grid-template-columns: 1fr;
  }
}
</style>
