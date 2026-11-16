<script setup lang="ts">
import type {
  ContractChatSession,
  ContractExtractionField,
} from '#/types/contract-assistant';

import { computed } from 'vue';

import { Alert, Button, Input, InputNumber, Select } from 'ant-design-vue';

import {
  contractExtractionOptions,
  extractionValue,
} from '../utils/contract-extraction';

const props = defineProps<{
  allFields?: boolean;
  item: ContractChatSession;
  readonly?: boolean;
}>();
const mandatory = new Set([
  'company',
  'contractNumber',
  'counterparty',
  'name',
  'owner',
  'scope',
]);
const fields = computed(() => {
  let source = props.item.scheme?.management?.extraction || [];
  if (props.allFields) {
    const configured = new Set(source.map((field) => field.key));
    source = [
      ...source,
      ...contractExtractionOptions.filter(
        (field) => mandatory.has(field.key) && !configured.has(field.key),
      ),
    ].map((field) =>
      mandatory.has(field.key) ? { ...field, required: true } : field,
    );
  }
  return source.filter((field) =>
    props.allFields
      ? !['expiryDate', 'startDate'].includes(field.key)
      : ![
          'amount',
          'company',
          'contractNumber',
          'counterparty',
          'expiryDate',
          'location',
          'name',
          'owner',
          'scope',
          'signedAt',
          'startDate',
        ].includes(field.key) &&
        (!['invoiceTerms', 'paymentTerms'].includes(field.key) ||
          !['purchase', 'sales'].includes(props.item.businessType || '')) &&
        (field.key !== 'requirements' ||
          props.item.businessType !== 'maintenance'),
  );
});
const groups = computed(() =>
  props.allFields
    ? [
        {
          key: 'required',
          fields: fields.value.filter((field) => field.required),
        },
        {
          key: 'optional',
          fields: fields.value.filter((field) => !field.required),
        },
      ]
    : [{ key: 'all', fields: fields.value }],
);
function setValue(key: string, value: unknown) {
  const item = props.item;
  const text = value === null || value === undefined ? '' : String(value);
  item.extractedFields ||= {};
  item.extractedFields[key] = text;
  let target = key;
  if (key === 'name') {
    target = 'fileName';
  } else if (key === 'requirements') {
    target = 'special';
  }
  if (
    [
      'company',
      'contractNumber',
      'counterparty',
      'deliveryDate',
      'fileName',
      'invoiceTerms',
      'location',
      'owner',
      'paymentTerms',
      'salesManager',
      'scope',
      'signedAt',
      'special',
    ].includes(target)
  )
    (item as unknown as Record<string, unknown>)[target] = text;
  if (key === 'amount') item.amount = text ? Number(text) : undefined;
}
function rows(field: ContractExtractionField): Record<string, unknown>[] {
  try {
    const value: unknown = JSON.parse(
      extractionValue(props.item, field.key) || '[]',
    );
    return Array.isArray(value) &&
      value.every(
        (row) => row && typeof row === 'object' && !Array.isArray(row),
      )
      ? value
      : [];
  } catch {
    return [];
  }
}
function validRows(field: ContractExtractionField) {
  try {
    const value: unknown = JSON.parse(
      extractionValue(props.item, field.key) || '[]',
    );
    return (
      Array.isArray(value) &&
      value.every(
        (row) => row && typeof row === 'object' && !Array.isArray(row),
      )
    );
  } catch {
    return false;
  }
}
function updateCell(
  field: ContractExtractionField,
  index: number,
  key: string,
  value: unknown,
) {
  const data = rows(field);
  data[index] ||= {};
  data[index]![key] = value;
  setValue(field.key, JSON.stringify(data));
}
function add(field: ContractExtractionField) {
  const data = rows(field);
  data.push(
    Object.fromEntries((field.columns || []).map((column) => [column.key, ''])),
  );
  setValue(field.key, JSON.stringify(data));
}
function remove(field: ContractExtractionField, index: number) {
  const data = rows(field);
  data.splice(index, 1);
  setValue(field.key, JSON.stringify(data));
}
</script>
<template>
  <div
    v-if="fields.length > 0"
    class="extraction-values"
    :class="{ 'all-fields': allFields }"
  >
    <component
      :is="group.key === 'optional' ? 'details' : 'div'"
      v-for="group in groups"
      :key="group.key"
      class="field-group"
    >
      <summary v-if="group.key === 'optional'">
        其他合同信息与约定（{{ group.fields.length }} 项）
      </summary>
      <div class="field-grid">
        <section
          v-for="field in group.fields"
          :key="field.key"
          :class="{
            'wide-field': field.type === 'detail' || field.key === 'scope',
          }"
        >
          <header>
            <strong>
              {{ field.name }}
              <i v-if="field.required">*</i>
            </strong>
            <Button
              v-if="field.type === 'detail' && !readonly"
              size="small"
              @click="add(field)"
            >
              添加明细
            </Button>
          </header>
          <small
            v-if="
              !readonly && field.required && !extractionValue(item, field.key)
            "
            class="missing-value"
          >
            待补充
          </small>
          <template v-if="field.type === 'detail'">
            <Alert
              v-if="!validRows(field)"
              type="warning"
              message="明细格式需修正，请核对原始提取内容"
            />
            <Input.TextArea
              v-if="!validRows(field) && !readonly"
              :value="extractionValue(item, field.key)"
              @change="(event) => setValue(field.key, event.target.value)"
            />
            <div v-if="rows(field).length === 0" class="empty-detail">
              未提取到明细，{{ readonly ? '暂无内容' : '可按合同补充' }}
            </div>
            <div
              v-for="(row, index) in rows(field)"
              :key="index"
              class="detail-row"
            >
              <label v-for="column in field.columns" :key="column.key">
                <span>
                  {{ column.name }}
                  <i v-if="column.required">*</i>
                </span>
                <span v-if="readonly">{{ row[column.key] ?? '—' }}</span>
                <Input
                  v-else
                  :value="String(row[column.key] ?? '')"
                  :type="
                    column.type === 'date'
                      ? 'date'
                      : column.type === 'amount'
                        ? 'number'
                        : 'text'
                  "
                  @change="
                    (event) =>
                      updateCell(field, index, column.key, event.target.value)
                  "
                />
              </label>
              <Button
                v-if="!readonly"
                type="text"
                danger
                @click="remove(field, index)"
              >
                删除
              </Button>
            </div>
          </template>
          <p v-else-if="readonly">
            {{ extractionValue(item, field.key) || '未约定／待补充' }}
          </p>
          <Select
            v-else-if="field.type === 'option'"
            :value="extractionValue(item, field.key) || undefined"
            allow-clear
            :options="field.options?.map((value) => ({ value, label: value }))"
            @change="(value) => setValue(field.key, value)"
          />
          <InputNumber
            v-else-if="field.type === 'amount'"
            :value="
              extractionValue(item, field.key)
                ? Number(extractionValue(item, field.key))
                : undefined
            "
            @change="(value) => setValue(field.key, value)"
          />
          <Input
            v-else
            :value="extractionValue(item, field.key)"
            :type="field.type === 'date' ? 'date' : 'text'"
            @change="(event) => setValue(field.key, event.target.value)"
          />
          <small v-if="item.extractionEvidence?.[field.key]" class="evidence">
            提取依据：{{ item.extractionEvidence[field.key] }}
          </small>
        </section>
      </div>
    </component>
  </div>
</template>
<style scoped>
.missing-value {
  color: #d97706;
  display: block;
  margin-bottom: 6px;
}
.extraction-values {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}
.field-grid {
  display: grid;
  gap: 12px;
}
.all-fields .field-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.wide-field {
  grid-column: 1 / -1;
}
.field-group > summary {
  margin: 8px 0 14px;
  cursor: pointer;
  color: #52735e;
  font-size: 13px;
}
@media (max-width: 640px) {
  .all-fields .field-grid {
    grid-template-columns: 1fr;
  }
}
.field-grid > section {
  padding: 14px;
  border: 1px solid #e1e9e4;
  border-radius: 8px;
}
.extraction-values header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: #3b604b;
}
.extraction-values i {
  color: #dc2626;
  font-style: normal;
  margin-left: 3px;
}
.extraction-values :deep(.ant-select),
.extraction-values :deep(.ant-input-number) {
  width: 100%;
}
.detail-row {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.detail-row label {
  flex: 1;
  min-width: 110px;
}
.detail-row label > span:first-child {
  display: block;
  font-size: 11px;
  color: #8a9a93;
  margin-bottom: 4px;
}
.evidence {
  display: block;
  font-size: 11px;
  color: #8a9a93;
  margin-top: 8px;
  overflow-wrap: anywhere;
}
.empty-detail {
  font-size: 12px;
  color: #8a9a93;
}
.extraction-values p {
  font-size: 13px;
  margin: 0;
  color: #466051;
}
</style>
