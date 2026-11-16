<script setup lang="ts">
import type { ContractExtractionField } from '#/types/contract-assistant';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Alert, Button, Checkbox, Input, Modal, Select } from 'ant-design-vue';

import { deepClone } from '#/utils/deep-clone';

import {
  contractExtractionOptions,
  validateExtraction,
} from '../utils/contract-extraction';

const props = defineProps<{ readonly?: boolean }>();
const model = defineModel<ContractExtractionField[]>({ required: true });
const customOpen = ref(false);
const editingKey = ref<string>();
const customDraft = ref<ContractExtractionField>({
  key: '',
  name: '',
  type: 'text',
  required: false,
  instruction: '',
});
const customErrors = ref<string[]>([]);
const addOpen = ref(false);
const mandatoryKeys = [
  'name',
  'contractNumber',
  'counterparty',
  'company',
  'scope',
  'owner',
];
watch(
  [() => model.value, () => props.readonly],
  () => {
    if (props.readonly) return;
    for (const key of mandatoryKeys) {
      const field = model.value.find((item) => item.key === key);
      if (field) {
        if (!field.required) field.required = true;
      } else {
        const preset = contractExtractionOptions.find(
          (item) => item.key === key,
        );
        if (preset)
          model.value = [
            ...model.value,
            { ...deepClone(preset), required: true },
          ];
      }
    }
  },
  { immediate: true, deep: true },
);
const isStandard = (key: string) =>
  contractExtractionOptions.some((field) => field.key === key);
const groups = computed(() =>
  [
    {
      name: '基本信息',
      description: '确认合同主体及归属',
      keys: [
        'name',
        'contractNumber',
        'counterparty',
        'company',
        'owner',
        'salesManager',
      ],
    },
    {
      name: '金额与日期',
      description: '识别金额与关键日期',
      keys: ['amount', 'signedAt', 'startDate', 'expiryDate', 'deliveryDate'],
    },
    {
      name: '合同约定',
      description: '保留合同明确约定的业务内容',
      keys: [
        'scope',
        'location',
        'invoiceTerms',
        'paymentTerms',
        'paymentSchedule',
        'frequency',
        'requirements',
        'devices',
      ],
    },
    {
      name: '补充信息',
      description: '本类合同特有的信息',
      keys: model.value
        .filter((field) => !isStandard(field.key))
        .map((field) => field.key),
    },
  ].map((group) => ({
    ...group,
    fields: model.value.filter((field) => group.keys.includes(field.key)),
  })),
);
const availableFields = computed(() =>
  contractExtractionOptions.filter(
    (field) => !model.value.some((item) => item.key === field.key),
  ),
);
function addField(key: string) {
  if (props.readonly) return;
  const field = availableFields.value.find((item) => item.key === key);
  if (field) model.value = [...model.value, deepClone(field)];
}
function removeField(key: string) {
  if (props.readonly || mandatoryKeys.includes(key)) return;
  model.value = model.value.filter((field) => field.key !== key);
}
function openCustom(field?: ContractExtractionField) {
  if (props.readonly) return;
  editingKey.value = field?.key;
  customErrors.value = [];
  customDraft.value = field
    ? deepClone(field)
    : {
        key: `custom_${Date.now()}`,
        name: '',
        type: 'text',
        required: false,
        instruction: '',
      };
  customOpen.value = true;
}
function confirmCustom() {
  if (props.readonly) return;
  const field = deepClone(customDraft.value);
  field.name = field.name.trim();
  field.key = field.key.trim();
  field.instruction = field.instruction.trim();
  field.options = field.options?.map((value) => value.trim()).filter(Boolean);
  if (field.type !== 'detail') delete field.columns;
  if (field.type !== 'option') delete field.options;
  const unchanged = model.value.filter((item) => item.key !== editingKey.value);
  customErrors.value = validateExtraction([field]);
  if (unchanged.some((item) => item.key === field.key))
    customErrors.value.push('字段编码已存在，请使用不同编码');
  if (mandatoryKeys.includes(field.key)) field.required = true;
  if (customErrors.value.length > 0) return;
  const index = model.value.findIndex((item) => item.key === editingKey.value);
  model.value =
    index === -1
      ? [...model.value, field]
      : model.value.map((item, i) => (i === index ? field : item));
  customOpen.value = false;
}
const types = [
  { value: 'text', label: '文本' },
  { value: 'amount', label: '金额（元）' },
  { value: 'date', label: '日期' },
  { value: 'option', label: '选项' },
  { value: 'detail', label: '明细表' },
];
</script>
<template>
  <section class="extraction-editor">
    <header>
      <div>
        <Icon icon="lucide:scan-text" />
        <div>
          <h3>信息提取</h3>
          <p>已按合同大类推荐提取内容，请确认收集范围并补充特殊要求。</p>
        </div>
      </div>
      <div class="header-actions">
        <Button :disabled="readonly" @click="addOpen = true">
          <Icon icon="lucide:plus" />
          添加信息
        </Button>
        <Button :disabled="readonly" @click="openCustom()">
          新增自定义字段
        </Button>
      </div>
    </header>
    <div class="extraction-body">
      <p class="extraction-hint">
        选择提取不代表合同必须约定。原文未约定时保留待确认；标为“建档前必须补齐”的信息需由用户核对补充。
      </p>
      <section
        v-for="group in groups"
        :key="group.name"
        class="information-group"
      >
        <div class="group-heading">
          <h4>
            {{ group.name }}
            <span>{{ group.fields.length }}</span>
          </h4>
          <small>{{ group.description }}</small>
        </div>
        <p v-if="group.fields.length === 0" class="group-empty">
          暂未添加，可通过“{{
            group.name === '补充信息' ? '新增自定义字段' : '添加信息'
          }}”补充。
        </p>
        <div v-else class="field-table">
          <div class="field-table-heading">
            <span>信息名称</span>
            <span>提取要求</span>
            <span>建档确认要求</span>
            <span>操作</span>
          </div>
          <div
            v-for="field in group.fields"
            :key="field.key"
            class="information-row"
          >
            <strong>
              {{ field.name }}
              <small v-if="mandatoryKeys.includes(field.key)">基础必需</small>
            </strong>
            <p>{{ field.instruction }}</p>
            <span class="confirmation" :class="{ required: field.required }">
              {{ field.required ? '建档前必须补齐' : '允许未约定' }}
            </span>
            <div class="row-actions">
              <Button
                type="link"
                size="small"
                :disabled="readonly"
                @click="openCustom(field)"
              >
                编辑
              </Button>
              <Button
                v-if="!mandatoryKeys.includes(field.key)"
                type="link"
                size="small"
                danger
                :disabled="readonly"
                @click="removeField(field.key)"
              >
                移除
              </Button>
            </div>
          </div>
        </div>
      </section>
      <div class="execution-preview">
        <Icon icon="lucide:list-checks" />
        <div>
          <strong>上传后的确认内容</strong>
          <p>
            用户将核对 {{ model.length }} 项信息，其中
            {{ model.filter((field) => field.required).length }}
            项须在建档前补齐。提取结果与原文依据一并展示，审核结论单独确认。
          </p>
        </div>
      </div>
    </div>
    <Modal
      v-model:open="addOpen"
      title="添加提取信息"
      :footer="null"
      :width="620"
    >
      <p class="extraction-hint">
        已配置的信息不再重复展示，添加后可编辑提取要求。
      </p>
      <div class="available-fields">
        <Button
          v-for="field in availableFields"
          :key="field.key"
          :disabled="readonly"
          @click="addField(field.key)"
        >
          <Icon icon="lucide:plus" />
          {{ field.name }}
        </Button>
      </div>
      <p v-if="availableFields.length === 0">标准信息已全部添加。</p>
    </Modal>
    <Modal
      v-model:open="customOpen"
      :title="editingKey ? '编辑提取信息' : '新增自定义字段'"
      :width="740"
      ok-text="确认"
      cancel-text="取消"
      :mask-closable="false"
      @ok="confirmCustom"
    >
      <div class="field-grid">
        <label>
          <span>
            字段名称
            <i>*</i>
          </span>
          <Input
            v-model:value="customDraft.name"
            :disabled="readonly || isStandard(customDraft.key)"
          />
        </label>
        <label v-if="!isStandard(customDraft.key)">
          <span>
            数据类型
            <i>*</i>
          </span>
          <Select
            v-model:value="customDraft.type"
            :disabled="readonly || isStandard(customDraft.key)"
            :options="types"
          />
        </label>
        <label v-if="!isStandard(customDraft.key)" class="wide">
          <span>
            字段编码
            <i>*</i>
          </span>
          <Input
            v-model:value="customDraft.key"
            disabled
            placeholder="自动生成"
          />
        </label>
        <label v-if="customDraft.type === 'option'">
          <span>
            可选值
            <i>*</i>
          </span>
          <Select
            v-model:value="customDraft.options"
            :disabled="readonly"
            mode="tags"
            placeholder="输入可选值"
          />
        </label>
        <label class="wide">
          <span>
            提取要求
            <i>*</i>
          </span>
          <Input.TextArea
            v-model:value="customDraft.instruction"
            :disabled="readonly"
            :rows="2"
            placeholder="描述取值范围、排除项及缺失时的处理，不编造未约定内容"
          />
        </label>
      </div>
      <Checkbox
        v-model:checked="customDraft.required"
        :disabled="readonly || mandatoryKeys.includes(customDraft.key)"
      >
        确认建档前必须补齐
      </Checkbox>
      <div v-if="customDraft.type === 'detail'" class="detail-columns">
        <div
          v-for="(column, i) in customDraft.columns"
          :key="i"
          class="column-row"
        >
          <Input
            v-model:value="column.name"
            :disabled="readonly"
            placeholder="列名称"
          />
          <Input
            v-model:value="column.key"
            :disabled="readonly"
            placeholder="列编码"
          />
          <Select
            v-model:value="column.type"
            :disabled="readonly"
            :options="
              types.filter((type) =>
                ['text', 'amount', 'date'].includes(type.value),
              )
            "
          />
          <Checkbox v-model:checked="column.required" :disabled="readonly">
            必填
          </Checkbox>
          <Button
            type="text"
            danger
            :disabled="readonly"
            @click="customDraft.columns!.splice(i, 1)"
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>
        <Button
          size="small"
          :disabled="readonly"
          @click="
            (customDraft.columns ||= []).push({
              key: `column_${Date.now()}`,
              name: '',
              type: 'text',
            })
          "
        >
          添加明细列
        </Button>
      </div>
      <Alert
        v-if="customErrors.length > 0"
        type="error"
        show-icon
        :message="customErrors.join('；')"
        class="custom-errors"
      />
    </Modal>
  </section>
</template>
<style scoped>
.extraction-editor {
  border: 1px solid #dfe8e3;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}
.extraction-editor > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 16px 18px;
  background: #f6f9f7;
  border-bottom: 1px solid #e6ede8;
}
.extraction-editor > header > div,
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
h3,
h4 {
  margin: 0;
  color: #2c513f;
  font-size: 14px;
}
header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #74867c;
}
header svg {
  color: #418168;
  font-size: 20px;
}
.extraction-body {
  padding: 18px;
}
.extraction-hint {
  margin: 0 0 18px;
  color: #718379;
  font-size: 12px;
  line-height: 1.7;
}
.information-group {
  margin-bottom: 22px;
}
.group-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.group-heading h4 span {
  margin-left: 6px;
  color: #7c9185;
  font-weight: 400;
  font-size: 12px;
}
.group-heading small,
.group-empty {
  font-size: 12px;
  color: #84948b;
}
.field-table {
  border: 1px solid #e5ece8;
  border-radius: 8px;
  overflow: hidden;
}
.field-table-heading,
.information-row {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) minmax(150px, 2fr) 128px 88px;
  gap: 14px;
  padding: 12px 14px;
  align-items: center;
}
.field-table-heading {
  background: #f7f9f8;
  color: #7a8a81;
  font-size: 12px;
}
.information-row + .information-row {
  border-top: 1px solid #edf1ee;
}
.information-row strong {
  font-size: 13px;
  color: #334e40;
  font-weight: 500;
}
.information-row strong small {
  display: block;
  color: #84968a;
  font-size: 11px;
  margin-top: 4px;
  font-weight: 400;
}
.information-row p {
  margin: 0;
  font-size: 12px;
  color: #6c7d73;
  line-height: 1.7;
}
.confirmation {
  font-size: 12px;
  color: #829087;
}
.confirmation.required {
  color: #ad7538;
}
.row-actions {
  display: flex;
}
.execution-preview {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: #f1f7f4;
  border-radius: 8px;
  color: #3f6b56;
  font-size: 13px;
}
.execution-preview p {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.7;
}
.available-fields {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 12px 0;
}
.field-grid label > span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #466051;
}
.field-grid i {
  color: #dc2626;
  font-style: normal;
}
.field-grid :deep(.ant-select) {
  width: 100%;
}
.wide {
  grid-column: 1/-1;
}
.column-row {
  display: grid;
  grid-template-columns: 1fr 1fr 120px 70px 36px;
  gap: 8px;
  margin: 10px 0;
}
.detail-columns,
.custom-errors {
  margin-top: 16px;
}
@media (max-width: 900px) {
  .field-table-heading {
    display: none;
  }
  .information-row {
    grid-template-columns: 1fr 1fr;
  }
  .information-row p {
    grid-column: 1/-1;
    grid-row: 2;
  }
  .row-actions {
    justify-content: flex-end;
  }
  .column-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
