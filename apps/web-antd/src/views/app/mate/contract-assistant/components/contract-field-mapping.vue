<script setup lang="ts">
import type { ContractFieldMapping } from '#/types/contract-assistant';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  AutoComplete,
  Button,
  Checkbox,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  allowedMappingTransforms,
  discoverJsonPaths,
  previewFieldMappings,
  sourcePath,
  standardContractFields,
  validateFieldMappings,
} from '../utils/field-mapping';
import { getDefaultContractFieldTarget } from '../utils/management-config';

const props = defineProps<{
  fields: { label: string; type: string; value: string }[];
  readonly?: boolean;
}>();
const model = defineModel<ContractFieldMapping[]>({ required: true });
const jsonText = ref('');
const jsonPlaceholder =
  '粘贴提取结果 JSON，例如 {"buyer":{"name":"华信科技"},"total_amount":180000}';
const enumMapPlaceholder = '如 {"monthly":"每月"}';
const result = ref<ReturnType<typeof previewFieldMappings>>();
const previewError = ref('');
watch(
  model,
  () => {
    result.value = undefined;
    previewError.value = '';
  },
  { deep: true },
);
watch(
  () => props.fields,
  () => {
    result.value = undefined;
  },
  { deep: true },
);
const input = computed(() => {
  try {
    return JSON.parse(jsonText.value);
  } catch {
    return null;
  }
});
const paths = computed(() => discoverJsonPaths(input.value));
const issues = computed(() =>
  validateFieldMappings(
    model.value,
    props.fields.map((field) => field.value),
  ),
);
function add() {
  const field = props.fields[0];
  if (!field) return;
  model.value.push({
    source: field.value,
    path: field.value.slice(field.value.indexOf(':') + 1),
    target: 'details',
    transform: 'auto',
    required: false,
  });
  result.value = undefined;
}
function recommend(notify = true) {
  const aliases: Record<string, string> = {
    合同编号: 'contractNumber',
    合同名称: 'name',
    客户名称: 'counterparty',
    客户: 'counterparty',
    签约对方: 'counterparty',
    合同总额: 'amount',
    合同金额: 'amount',
    签订日期: 'signedAt',
    签约日期: 'signedAt',
    服务开始日期: 'startDate',
    服务结束日期: 'expiryDate',
    到期日期: 'expiryDate',
    服务范围: 'scope',
    服务地点: 'location',
    巡检频次: 'frequency',
    检查要求: 'requirements',
    负责人: 'owner',
    销售经理: 'salesManager',
  };
  const existing = new Set(
    model.value.map((item) => `${item.source}|${sourcePath(item)}`),
  );
  const targets = new Set(
    model.value
      .filter((item) => item.target !== 'details')
      .map((item) => item.target),
  );
  let count = 0;
  for (const field of props.fields) {
    const root = field.value.slice(field.value.indexOf(':') + 1);
    const candidates = paths.value.filter(
      (path) => path.startsWith(`${root}.`) || path.startsWith(`${root}[].`),
    );
    const selected = candidates.filter(
      (path) =>
        !candidates.some(
          (other) =>
            other.startsWith(`${path}.`) || other.startsWith(`${path}[].`),
        ),
    );
    for (const path of selected.length > 0 ? selected : [root]) {
      if (existing.has(`${field.value}|${path}`)) continue;
      const key = path.split('.').at(-1)!.replace(/\[\]$/, '');
      let target =
        aliases[key] ||
        (selected.length === 0 ? aliases[field.label] : '') ||
        getDefaultContractFieldTarget(key);
      if (path.includes('[]') || targets.has(target)) target = 'details';
      if (target !== 'details') targets.add(target);
      model.value.push({
        source: field.value,
        path,
        target,
        transform: 'auto',
        required: false,
      });
      count++;
    }
  }
  result.value = undefined;
  if (notify)
    message.info(
      count
        ? `已补充${count}条推荐对应，请核对后保存`
        : '已有对应关系已保留，无新增推荐',
    );
}
function changeSource(row: ContractFieldMapping) {
  row.path = row.source.slice(row.source.indexOf(':') + 1);
  result.value = undefined;
}
function preview() {
  result.value = undefined;
  previewError.value = '';
  if (issues.value.length > 0) {
    previewError.value = issues.value.join('；');
    return;
  }
  if (model.value.length === 0) {
    previewError.value = '请先添加字段对应关系';
    return;
  }
  try {
    result.value = previewFieldMappings(
      JSON.parse(jsonText.value),
      model.value,
    );
  } catch (error) {
    previewError.value =
      error instanceof SyntaxError
        ? '提取结果不是有效JSON，请检查格式'
        : (error as Error).message;
  }
}
const transforms = [
  { value: 'auto', label: '按产品字段类型转换' },
  { value: 'text', label: '文本' },
  { value: 'number', label: '数值' },
  { value: 'amount', label: '金额 → 元' },
  { value: 'wan-amount', label: '万元 → 元' },
  { value: 'date', label: '日期 → YYYY-MM-DD' },
  { value: 'json', label: '保留／解析 JSON' },
];

const onlyPending = ref(true);
const showMoreFields = ref(false);
const advanced = ref<ContractFieldMapping>();
const advancedOpen = ref(false);
const standardRows = computed(() =>
  standardContractFields.filter(
    (field) =>
      field.value !== 'details' &&
      (showMoreFields.value ||
        [
          'amount',
          'company',
          'contractNumber',
          'counterparty',
          'expiryDate',
          'name',
          'scope',
          'signedAt',
          'startDate',
        ].includes(field.value) ||
        model.value.some((row) => row.target === field.value)),
  ),
);
function mapped(target: string) {
  return model.value.find((row) => row.target === target);
}
const sourceOptions = computed(() => {
  const options = props.fields.flatMap((field) => {
    const root = field.value.slice(field.value.indexOf(':') + 1);
    const nested = paths.value.filter(
      (path) => path.startsWith(`${root}.`) || path.startsWith(`${root}[].`),
    );
    return [root, ...nested].map((path) => ({
      value: JSON.stringify([field.value, path]),
      label:
        path === root
          ? field.label
          : `${field.label} · ${path.slice(root.length).replace(/^\./, '')}`,
    }));
  });
  for (const row of model.value) {
    const value = JSON.stringify([row.source, sourcePath(row)]);
    if (options.some((option) => option.value === value)) continue;
    const field = props.fields.find((field) => field.value === row.source);
    options.push({
      value,
      label: `${field?.label || '字段已失效'} · ${sourcePath(row)}`,
    });
  }
  return options;
});
function sourceValue(target: string) {
  const row = mapped(target);
  return row ? JSON.stringify([row.source, sourcePath(row)]) : undefined;
}
function chooseSource(target: string, value: unknown) {
  const index = model.value.findIndex((row) => row.target === target);
  if (!value) {
    if (index !== -1) model.value.splice(index, 1);
    return;
  }
  const [source, path] = JSON.parse(String(value)) as [string, string];
  const old = index === -1 ? undefined : model.value[index];
  const next: ContractFieldMapping = {
    ...old,
    source,
    path,
    target,
    transform: old?.transform || 'auto',
  };
  if (index === -1) {
    model.value.push(next);
  } else {
    model.value[index] = next;
  }
}
function sample(target: string) {
  const row = mapped(target);
  if (!row || !input.value) return undefined;
  return previewFieldMappings(input.value, [row]).results[0];
}
function pending(target: string) {
  const row = mapped(target);
  return (
    !row ||
    validateFieldMappings(
      [row],
      props.fields.map((field) => field.value),
    ).length > 0 ||
    !!sample(target)?.error
  );
}
const visibleRows = computed(() =>
  standardRows.value.filter(
    (field) => !onlyPending.value || pending(field.value),
  ),
);
const matchedCount = computed(
  () => standardRows.value.filter((field) => !pending(field.value)).length,
);
const extensions = computed(() =>
  model.value.filter((row) => row.target === 'details'),
);
const columns = [
  { title: '产品字段', dataIndex: 'label', key: 'label', width: '20%' },
  { title: '提取来源', key: 'source', width: '36%' },
  { title: '提取示例', key: 'sample', width: '22%' },
  { title: '匹配结果', key: 'status', width: '14%' },
  { title: '', key: 'action', width: '8%' },
];
function editAdvanced(target: string) {
  const row = mapped(target);
  if (!row) return;
  advanced.value = row;
  advancedOpen.value = true;
}
watch(
  () => props.fields,
  () => {
    if (model.value.length === 0 && props.fields.length > 0 && !props.readonly)
      recommend(false);
  },
  { immediate: true },
);
</script>
<template>
  <section class="mapping-card">
    <header>
      <div>
        <Icon icon="lucide:git-compare-arrows" />
        <div>
          <h3>字段对应</h3>
          <p>系统推荐提取来源，优先核对待对应项；非必需字段可留空。</p>
        </div>
      </div>
      <Button :disabled="readonly || fields.length === 0" @click="recommend()">
        <Icon icon="lucide:sparkles" />
        自动匹配
      </Button>
    </header>
    <div class="mapping-body">
      <div class="mapping-summary">
        <span>
          <b>{{ matchedCount }}</b>
          项已匹配，
          <b>{{ standardRows.length - matchedCount }}</b>
          项待对应或核对
        </span>
        <Checkbox v-model:checked="onlyPending">只看待处理</Checkbox>
        <Button
          type="link"
          size="small"
          @click="showMoreFields = !showMoreFields"
        >
          {{ showMoreFields ? '收起更多字段' : '更多产品字段' }}
        </Button>
      </div>
      <Table
        :columns="columns"
        :data-source="visibleRows"
        row-key="value"
        :pagination="false"
        size="small"
        table-layout="fixed"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'source'">
            <Select
              :value="sourceValue(record.value)"
              :disabled="readonly"
              :options="sourceOptions"
              show-search
              option-filter-prop="label"
              allow-clear
              placeholder="请选择提取字段"
              class="full-width"
              @change="(value) => chooseSource(record.value, value)"
            />
          </template>
          <template v-else-if="column.key === 'sample'">
            <span
              :title="
                sample(record.value)?.error ||
                JSON.stringify(sample(record.value)?.value)
              "
            >
              {{
                sample(record.value)?.error
                  ? '提取内容需核对'
                  : sample(record.value)?.value === undefined
                    ? '—'
                    : typeof sample(record.value)?.value === 'object'
                      ? JSON.stringify(sample(record.value)?.value)
                      : sample(record.value)?.value
              }}
            </span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="pending(record.value) ? 'orange' : 'green'">
              <Icon
                :icon="
                  pending(record.value)
                    ? 'lucide:triangle-alert'
                    : 'lucide:check'
                "
              />
              {{
                mapped(record.value)
                  ? pending(record.value)
                    ? '需核对'
                    : '已匹配'
                  : '待对应'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              type="link"
              size="small"
              :disabled="!mapped(record.value)"
              @click="editAdvanced(record.value)"
            >
              高级
            </Button>
          </template>
        </template>
        <template #emptyText>
          <div class="empty-pending">
            <Icon icon="lucide:circle-check" />
            当前展示字段已匹配，可取消“只看待处理”核对全部
          </div>
        </template>
      </Table>
      <Alert
        v-if="issues.length > 0"
        class="mapping-notice"
        type="warning"
        show-icon
        :message="issues.join('；')"
      />
      <details class="extension-panel">
        <summary>
          扩展信息
          <span>{{ extensions.length }} 项显式对应</span>
        </summary>
        <p>
          未对应的提取内容默认保留为扩展信息，无需逐项设置；特殊转换可单独添加。
        </p>
        <div
          v-for="(row, index) in extensions"
          :key="index"
          class="extension-row"
        >
          <span>
            {{
              fields.find((field) => field.value === row.source)?.label ||
              row.source
            }}
            <small>{{ sourcePath(row) }}</small>
          </span>
          <Button
            type="link"
            size="small"
            @click="
              advanced = row;
              advancedOpen = true;
            "
          >
            高级设置
          </Button>
          <Button
            type="text"
            danger
            size="small"
            :disabled="readonly"
            @click="model.splice(model.indexOf(row), 1)"
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>
        <Button
          :disabled="readonly || fields.length === 0"
          size="small"
          @click="add"
        >
          添加特殊对应
        </Button>
      </details>
      <details class="preview-panel">
        <summary>验证提取结果与对应预览</summary>
        <p>
          粘贴附件分类的提取结果后，自动显示嵌套来源选项和各字段示例。预览不修改合同档案。
        </p>
        <Input.TextArea
          v-model:value="jsonText"
          :rows="5"
          :placeholder="jsonPlaceholder"
          @change="
            result = undefined;
            previewError = '';
          "
        />
        <Button class="preview-button" @click="preview">验证并预览</Button>
        <Alert
          v-if="previewError"
          type="error"
          show-icon
          :message="previewError"
        />
        <template v-if="result">
          <div
            v-for="(item, index) in result.results"
            :key="index"
            class="preview-result"
          >
            <Tag :color="item.error ? 'orange' : 'green'">
              {{ item.error ? '待补充' : '对应成功' }}
            </Tag>
            <strong>{{ item.label }}</strong>
            <span>{{ item.error || JSON.stringify(item.value) }}</span>
          </div>
          <div class="output-grid">
            <div>
              <h4>产品标准字段</h4>
              <pre>{{ JSON.stringify(result.output, null, 2) }}</pre>
            </div>
            <div>
              <h4>租户扩展信息</h4>
              <pre>{{ JSON.stringify(result.extensions, null, 2) }}</pre>
            </div>
          </div>
          <details>
            <summary>查看原始结果</summary>
            <pre>{{ jsonText }}</pre>
          </details>
        </template>
      </details>
    </div>
    <Modal
      v-model:open="advancedOpen"
      title="字段高级设置"
      :width="640"
      :footer="null"
    >
      <div v-if="advanced" class="advanced-form">
        <label>
          <span>产品字段</span>
          <Select
            v-model:value="advanced.target"
            :disabled="readonly"
            :options="standardContractFields"
            @change="advanced.transform = 'auto'"
          />
        </label>
        <label>
          <span>提取字段</span>
          <Select
            v-model:value="advanced.source"
            :disabled="readonly"
            :options="fields"
            @change="changeSource(advanced)"
          />
        </label>
        <label>
          <span>JSON 来源路径</span>
          <AutoComplete
            v-model:value="advanced.path"
            :disabled="readonly"
            :options="paths.map((value) => ({ value }))"
            placeholder="如 buyer.name、payment_nodes[].date"
          />
        </label>
        <label>
          <span>格式转换</span>
          <Select
            v-model:value="advanced.transform"
            :disabled="readonly"
            :options="
              transforms.filter((item) =>
                allowedMappingTransforms(advanced!.target).includes(item.value),
              )
            "
            placeholder="按产品字段类型转换"
          />
        </label>
        <label v-if="advanced.target === 'details'">
          <span>扩展字段编码</span>
          <Input
            v-model:value="advanced.extensionKey"
            :disabled="readonly"
            placeholder="默认使用来源路径"
          />
        </label>
        <label>
          <span>枚举对应（JSON）</span>
          <Input
            v-model:value="advanced.enumMap"
            :disabled="readonly"
            :placeholder="enumMapPlaceholder"
          />
        </label>
        <Checkbox v-model:checked="advanced.required" :disabled="readonly">
          关键字段，缺失或转换失败时提示补充
        </Checkbox>
        <Button type="primary" @click="advancedOpen = false">完成</Button>
      </div>
    </Modal>
  </section>
</template>
<style scoped>
.mapping-card {
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid #dfe8e3;
  border-radius: 12px;
  background: white;
}
.mapping-card > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #f6f9f7;
  border-bottom: 1px solid #e6ede8;
}
.mapping-card > header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mapping-card > header svg {
  color: #418168;
  font-size: 20px;
}
h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  color: #2c513f;
}
header p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #94a398;
}
.mapping-body {
  padding: 18px;
}
.mapping-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-bottom: 14px;
  font-size: 12px;
  color: #70877a;
}
.mapping-summary b {
  color: #26735a;
}
.full-width,
.advanced-form :deep(.ant-select) {
  width: 100%;
}
.mapping-body :deep(.ant-table-cell) {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.mapping-body :deep(.ant-tag) {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  margin: 0;
  white-space: normal;
}
.mapping-body :deep(.ant-btn-link) {
  padding-inline: 0;
}
.empty-pending {
  padding: 12px;
  color: #458168;
}
.empty-pending svg {
  display: inline-block;
  margin-right: 6px;
}
.mapping-notice,
.extension-panel,
.preview-panel {
  margin-top: 16px;
}
summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #385b45;
}
summary > span {
  font-size: 11px;
  color: #8b9b92;
  margin-left: 8px;
}
.extension-panel p,
.preview-panel p {
  color: #7a8d81;
  font-size: 12px;
  margin: 8px 0;
}
.extension-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #edf1ee;
}
.extension-row > span {
  flex: 1;
  font-size: 12px;
}
.extension-row small {
  display: block;
  color: #94a398;
}
.preview-button {
  margin: 12px 0;
}
.preview-result {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #edf1ee;
  font-size: 12px;
}
.output-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
pre {
  padding: 12px;
  background: #f7faf8;
  border-radius: 8px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 12px;
}
h4 {
  font-size: 13px;
  color: #466051;
}
.advanced-form {
  display: grid;
  gap: 16px;
}
.advanced-form label > span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #466051;
}
@media (max-width: 700px) {
  .output-grid {
    grid-template-columns: 1fr;
  }
}
</style>
