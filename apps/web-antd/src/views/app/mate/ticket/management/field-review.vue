<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

/** 字段类型 */
type FieldType =
  '人员选择' | '单选' | '多行文本' | '多选' | '数字' | '文本' | '日期';

/** 数据字典项 */
interface DataDictionary {
  /** 字典编码（数据源下拉选项 value） */
  code: string;
  /** 字典名称（展示文案） */
  name: string;
  /** 字典选项 */
  options: string[];
}

/** 数据源选项：数据字典类型 */
const dictionaries: DataDictionary[] = [
  {
    code: 'fault-level',
    name: '故障等级',
    options: ['一级故障', '二级故障', '三级故障', '四级故障'],
  },
  {
    code: 'customer-level',
    name: '客户等级',
    options: ['VIP', '战略客户', '普通客户', '潜在客户'],
  },
  { code: 'priority', name: '优先级', options: ['紧急', '高', '中', '低'] },
  {
    code: 'ticket-type',
    name: '工单类型',
    options: ['故障报修', '费用报销', '项目实施', '供应商协作'],
  },
  {
    code: 'warranty-status',
    name: '在保状态',
    options: ['在保', '过保', '续保中', '未知'],
  },
  {
    code: 'device-category',
    name: '设备类别',
    options: ['打印设备', '检测设备', '包装设备', '通用设备'],
  },
];

/** 字典 code → 字典项 */
const dictionaryMap = new Map(dictionaries.map((d) => [d.code, d]));

/** 字典下拉选项 */
const dictionaryOptions = dictionaries.map((d) => ({
  label: d.name,
  value: d.code,
}));

/** 参与角色 */
type FieldRole = '发起人' | '处理人';

/** 参考依据：AI 提取字段时的制度原文出处 */
interface FieldReference {
  /** AI 置信度 */
  confidence: string;
  /** 来源文件与章节 */
  source: string;
  /** 制度原文片段 */
  snippet: string;
}

interface FieldItem {
  canDelete: boolean;
  /** 数据源：关联的数据字典 code（仅单选/多选类型生效） */
  dataSource?: string;
  /** 数据字典 code，作为数据源下拉选项 value */
  id: string;
  label: string;
  locked: boolean;
  name: string;
  order: number;
  /** 参与角色（发起人/处理人） */
  roles: FieldRole[];
  required: boolean;
  source: 'AI 解析' | '系统' | '自定义';
  type: FieldType;
  /** 校验规则（数据合法性，如长度限制、正则等） */
  validation?: FieldValidation;
  /** 字段权限 */
  permission?: FieldPermission;
  /** 参考依据（AI 解析字段） */
  reference?: FieldReference;
}

/** 字段校验规则 */
interface FieldValidation {
  /** 字段长度上限 */
  maxLength?: number;
  /** 字段长度下限 */
  minLength?: number;
  /** 正则校验表达式 */
  pattern?: string;
  /** 数值最小值（仅数字类型生效） */
  min?: number;
  /** 数值最大值（仅数字类型生效） */
  max?: number;
  /** 自定义校验提示 */
  patternMessage?: string;
}

/** 字段权限 */
interface FieldPermission {
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否在列表中显示 */
  listVisible?: boolean;
  /** 是否参与派单规则 */
  usedInDispatch?: boolean;
  /** 是否参与 SLA */
  usedInSla?: boolean;
  /** 是否参与流程规则 */
  usedInWorkflow?: boolean;
}

const fieldTypeOptions: Array<{ label: string; value: FieldType }> = [
  { label: '文本', value: '文本' },
  { label: '多行文本', value: '多行文本' },
  { label: '单选', value: '单选' },
  { label: '多选', value: '多选' },
  { label: '数字', value: '数字' },
  { label: '日期', value: '日期' },
  { label: '人员选择', value: '人员选择' },
];

const baseFields: FieldItem[] = [
  {
    id: 'f1',
    name: 'title',
    label: '工单标题',
    type: '文本',
    required: true,
    locked: true,
    source: '系统',
    canDelete: false,
    order: 1,
    roles: ['发起人'],
  },
  {
    id: 'f2',
    name: 'type',
    label: '工单类型',
    type: '单选',
    required: true,
    locked: true,
    source: '系统',
    canDelete: false,
    order: 2,
    roles: ['发起人'],
    dataSource: 'ticket-type',
  },
  {
    id: 'f3',
    name: 'priority',
    label: '优先级',
    type: '单选',
    required: true,
    locked: true,
    source: '系统',
    canDelete: false,
    order: 3,
    roles: ['发起人', '处理人'],
    dataSource: 'priority',
  },
  {
    id: 'f4',
    name: 'description',
    label: '问题描述',
    type: '多行文本',
    required: true,
    locked: true,
    source: '系统',
    canDelete: false,
    order: 4,
    roles: ['发起人', '处理人'],
  },
  {
    id: 'f5',
    name: 'assignee',
    label: '处理人',
    type: '人员选择',
    required: false,
    locked: true,
    source: '系统',
    canDelete: false,
    order: 5,
    roles: ['处理人'],
  },
];

const aiFields = ref<FieldItem[]>([
  {
    id: 'a1',
    name: 'deviceModel',
    label: '设备型号',
    type: '文本',
    required: true,
    locked: false,
    source: 'AI 解析',
    canDelete: true,
    order: 6,
    roles: ['发起人'],
    reference: {
      confidence: '92%',
      source: '《设备维保服务管理制度 V3.0》· 4.2 报修要求',
      snippet:
        '客户发起报修时，须填写故障设备型号及序列号，如 HP LaserJet Pro M405dn（S/N：CNB4X12345），以便服务台提前核查保单并准备备件。',
    },
  },
  {
    id: 'a2',
    name: 'faultLevel',
    label: '故障等级',
    type: '单选',
    required: true,
    locked: false,
    source: 'AI 解析',
    canDelete: true,
    order: 7,
    roles: ['发起人', '处理人'],
    dataSource: 'fault-level',
    reference: {
      confidence: '88%',
      source: '《设备维保服务管理制度 V3.0》· 5.1 故障分级标准',
      snippet:
        '故障按影响范围分为四级：一级（整机停机且影响生产）、二级（主要功能失效）、三级（部分功能异常）、四级（外观或非核心部件问题），报修时须如实勾选。',
    },
  },
  {
    id: 'a3',
    name: 'customerLevel',
    label: '客户等级',
    type: '多选',
    required: false,
    locked: false,
    source: 'AI 解析',
    canDelete: true,
    order: 8,
    roles: ['处理人'],
    dataSource: 'customer-level',
    reference: {
      confidence: '85%',
      source: '《客户分级与服务策略管理办法》· 2.3 客户分级',
      snippet:
        '客户按年度服务合同金额与战略重要性划分为 VIP、战略客户、普通客户、潜在客户四级，不同等级客户适用差异化的响应时效与服务资源。',
    },
  },
]);

const customFields = ref<FieldItem[]>([]);

const allFields = computed(() =>
  [...baseFields, ...aiFields.value, ...customFields.value].toSorted(
    (a, b) => a.order - b.order,
  ),
);

function toggleRequired(field: FieldItem, val: boolean) {
  field.required = val;
}

function deleteField(field: FieldItem) {
  const idx = customFields.value.findIndex((f) => f.id === field.id);
  if (idx !== -1) {
    customFields.value.splice(idx, 1);
    message.success(`已删除字段「${field.label}」`);
    return;
  }
  const idxA = aiFields.value.findIndex((f) => f.id === field.id);
  if (idxA !== -1) {
    aiFields.value.splice(idxA, 1);
    message.success(`已删除字段「${field.label}」`);
  }
}

/* ============ 拖拽排序 ============ */
const dragFieldId = ref('');
const dragOverId = ref('');

function onDragStart(field: FieldItem) {
  dragFieldId.value = field.id;
}

function resetDrag() {
  dragFieldId.value = '';
  dragOverId.value = '';
}

/** 拖拽落到目标行：按当前展示顺序重排并重新分配 order */
function onDrop(target: FieldItem) {
  const dragId = dragFieldId.value;
  if (!dragId || dragId === target.id) {
    resetDrag();
    return;
  }
  const list = [...allFields.value];
  const fromIdx = list.findIndex((f) => f.id === dragId);
  if (fromIdx === -1) {
    resetDrag();
    return;
  }
  const [moved] = list.splice(fromIdx, 1);
  if (!moved) {
    resetDrag();
    return;
  }
  const toIdx = list.findIndex((f) => f.id === target.id);
  if (toIdx !== -1) {
    list.splice(toIdx, 0, moved);
  }
  list.forEach((f, i) => {
    f.order = i + 1;
  });
  resetDrag();
}

/* ============ 参考依据弹窗 ============ */
const referenceOpen = ref(false);
const referenceField = ref<FieldItem | null>(null);

function openReference(field: FieldItem) {
  referenceField.value = field;
  referenceOpen.value = true;
}

/** 切换字段类型时，若新类型不需要数据源则清空 */
function onTypeChange(field: FieldItem, newType: FieldType) {
  field.type = newType;
  if (newType !== '单选' && newType !== '多选') {
    field.dataSource = undefined;
  } else if (!field.dataSource) {
    field.dataSource = dictionaries[0]?.code;
  }
}

/** 数据源下拉变更：从字典 code 取选项值并写入字段 */
function onDataSourceChange(field: FieldItem, dictCode: string) {
  field.dataSource = dictCode;
}

/** 获取字段数据源对应的选项列表 */
function getDictionaryOptions(field: FieldItem): string[] {
  if (!field.dataSource) return [];
  return dictionaryMap.get(field.dataSource)?.options || [];
}

/* ============ 新增字段弹窗 ============ */
const roleOptions: Array<{ label: FieldRole; value: FieldRole }> = [
  { label: '发起人', value: '发起人' },
  { label: '处理人', value: '处理人' },
];

const addFieldOpen = ref(false);
const addFieldForm = ref<{
  dataSource?: string;
  label: string;
  name: string;
  permission: FieldPermission;
  required: boolean;
  roles: FieldRole[];
  type: FieldType;
  validation: FieldValidation;
}>({
  name: '',
  label: '',
  type: '单选',
  dataSource: 'fault-level',
  required: false,
  roles: ['发起人'],
  validation: {},
  permission: { editable: true, listVisible: true },
});

function openAddField() {
  addFieldForm.value = {
    name: '',
    label: '',
    type: '单选',
    dataSource: 'fault-level',
    required: false,
    roles: ['发起人'],
    validation: {},
    permission: { editable: true, listVisible: true },
  };
  addFieldOpen.value = true;
}

function confirmAddField() {
  const name = addFieldForm.value.name?.trim();
  const label = addFieldForm.value.label?.trim();
  if (!name || !label) {
    message.warning('请填写字段编码与名称');
    return;
  }
  if (allFields.value.some((f) => f.name === name)) {
    message.warning('字段编码已存在');
    return;
  }
  const type = addFieldForm.value.type;
  const needsDataSource = type === '单选' || type === '多选';
  if (needsDataSource && !addFieldForm.value.dataSource) {
    message.warning('请选择数据源（数据字典类型）');
    return;
  }
  let maxOrder = 0;
  for (const f of allFields.value) {
    if (f.order > maxOrder) maxOrder = f.order;
  }
  const created: FieldItem = {
    id: `c-${Date.now()}`,
    name,
    label,
    type,
    required: addFieldForm.value.required,
    locked: false,
    source: '自定义',
    canDelete: true,
    order: maxOrder + 1,
    roles:
      addFieldForm.value.roles.length > 0
        ? addFieldForm.value.roles
        : ['发起人'],
    dataSource: needsDataSource ? addFieldForm.value.dataSource : undefined,
    validation: { ...addFieldForm.value.validation },
    permission: { ...addFieldForm.value.permission },
  };
  customFields.value.push(created);
  addFieldOpen.value = false;
  message.success(`自定义字段「${label}」已添加`);
}

/** 行内编辑校验规则（保留接口，后续可在列表行扩展使用） */
const editValidationOpen = ref<string>('');
function toggleValidationEdit(fieldId: string) {
  editValidationOpen.value =
    editValidationOpen.value === fieldId ? '' : fieldId;
}
void editValidationOpen.value;
void toggleValidationEdit;
</script>

<template>
  <div class="step-wrap">
    <section class="step-card">
      <header>
        <div>
          <Icon icon="lucide:database" />
          <span>
            <h3>工单信息</h3>
            <p>配置发起工单、处理和完成工单所需的信息</p>
          </span>
        </div>
        <div class="field-tags">
          <Button type="primary" size="small" @click="openAddField">
            <Icon icon="lucide:plus" class="mr-1 size-3" />
            新增字段
          </Button>
        </div>
      </header>
      <div class="overflow-hidden rounded-xl border border-[#e4edea]">
        <div
          class="grid grid-cols-[20px_0.9fr_1.2fr_0.9fr_1.3fr_0.6fr_1fr_0.8fr_1.1fr] gap-3 border-b border-[#e4edea] bg-[#f6fbf9] px-4 py-3 text-[11px] font-bold text-[#5a756d]"
        >
          <span></span>
          <span>编码</span>
          <span>名称</span>
          <span>类型</span>
          <span>数据源</span>
          <span>必填</span>
          <span>参与角色</span>
          <span>来源</span>
          <span>操作</span>
        </div>

        <div
          v-for="field in allFields"
          :key="field.id"
          draggable="true"
          class="grid cursor-grab grid-cols-[20px_0.9fr_1.2fr_0.9fr_1.3fr_0.6fr_1fr_0.8fr_1.1fr] items-center gap-3 border-b border-[#eef3f0] px-4 py-3 last:border-b-0 hover:bg-[#f6fbf9] active:cursor-grabbing"
          :class="{
            'bg-[#fafcfb]': field.locked && dragOverId !== field.id,
            'bg-[#e9f5f1]': dragOverId === field.id,
            'opacity-50': dragFieldId === field.id,
          }"
          @dragstart="onDragStart(field)"
          @dragover.prevent="dragOverId = field.id"
          @dragleave="dragOverId = ''"
          @drop.prevent="onDrop(field)"
          @dragend="resetDrag"
        >
          <span class="text-[#b0c1bb]">
            <Icon icon="lucide:grip-vertical" class="size-4" />
          </span>
          <span class="font-mono text-[12px] text-[#94a8a1]">
            {{ field.name }}
          </span>
          <span>
            <Input
              v-if="!field.locked"
              :value="field.label"
              size="small"
              @change="(e: any) => (field.label = e.target.value)"
            />
            <span v-else class="text-[13px] font-semibold text-[#0c4a3f]">
              {{ field.label }}
            </span>
          </span>
          <span>
            <Select
              v-if="!field.locked"
              :value="field.type"
              size="small"
              style="width: 100%"
              :options="fieldTypeOptions"
              @change="(v: any) => onTypeChange(field, v as FieldType)"
            />
            <span v-else class="text-[12px] text-[#1f3b34]">
              {{ field.type }}
            </span>
          </span>
          <span>
            <Select
              v-if="
                (field.type === '单选' || field.type === '多选') &&
                !field.locked
              "
              :value="field.dataSource"
              size="small"
              placeholder="选择数据字典"
              style="width: 100%"
              :options="dictionaryOptions"
              @change="(v: any) => onDataSourceChange(field, v as string)"
            />
            <Tag
              v-else-if="field.type === '单选' || field.type === '多选'"
              color="blue"
              class="!text-[10px]"
            >
              {{ dictionaryMap.get(field.dataSource || '')?.name || '—' }} ·
              {{ getDictionaryOptions(field).length }} 项
            </Tag>
            <span v-else class="text-[12px] text-[#94a8a1]">—</span>
          </span>
          <span>
            <Switch
              :checked="field.required"
              :disabled="field.locked"
              size="small"
              @change="(v: unknown) => toggleRequired(field, Boolean(v))"
            />
          </span>
          <span class="flex flex-wrap items-center gap-1">
            <Tag
              v-for="role in field.roles"
              :key="role"
              :color="role === '发起人' ? 'green' : 'blue'"
              class="!text-[10px]"
            >
              {{ role }}
            </Tag>
          </span>
          <span class="justify-self-end">
            <Tag v-if="field.locked" color="default">系统字段</Tag>
            <Tag v-else-if="field.source === 'AI 解析'" color="purple">
              <Icon icon="lucide:sparkles" class="mr-0.5 size-3" />
              AI 解析
            </Tag>
            <Tag v-else color="blue">
              {{ field.source }}
            </Tag>
          </span>
          <span class="flex flex-wrap items-center gap-1">
            <template v-if="field.locked">
              <span
                class="inline-flex items-center gap-1 text-[11px] text-[#b0c1bb]"
              >
                <Icon icon="lucide:lock" class="size-3" />
                锁定
              </span>
            </template>
            <template v-else>
              <Button
                type="link"
                size="small"
                class="!px-1"
                @click="openReference(field)"
              >
                <Icon icon="lucide:book-open" class="mr-0.5 size-3" />
                参考依据
              </Button>
              <Button
                type="link"
                danger
                size="small"
                class="!px-1"
                @click="deleteField(field)"
              >
                <Icon icon="lucide:trash-2" class="mr-0.5 size-3" />
                删除
              </Button>
            </template>
          </span>
        </div>
      </div>
    </section>

    <Modal
      v-model:open="addFieldOpen"
      title="新增自定义字段"
      ok-text="保存"
      cancel-text="取消"
      @ok="confirmAddField"
    >
      <Form layout="vertical">
        <Form.Item label="字段编码 *">
          <Input
            v-model:value="addFieldForm.name"
            placeholder="例如：faultLevel、客户等级"
          />
        </Form.Item>
        <Form.Item label="字段名称 *">
          <Input
            v-model:value="addFieldForm.label"
            placeholder="例如：故障等级"
          />
        </Form.Item>
        <Form.Item label="字段类型 *">
          <Select
            v-model:value="addFieldForm.type"
            :options="fieldTypeOptions"
          />
        </Form.Item>
        <Form.Item
          v-if="addFieldForm.type === '单选' || addFieldForm.type === '多选'"
          label="数据源（数据字典类型） *"
        >
          <Select
            v-model:value="addFieldForm.dataSource"
            :options="dictionaryOptions"
            placeholder="选择数据字典类型"
          />
        </Form.Item>
        <Form.Item label="是否必填">
          <Switch v-model:checked="addFieldForm.required" />
        </Form.Item>
        <Form.Item label="参与角色">
          <Select
            v-model:value="addFieldForm.roles"
            mode="multiple"
            :options="roleOptions"
            placeholder="选择该字段对哪些角色开放"
          />
        </Form.Item>

        <Collapse :default-active-key="[]" class="mt-2" :bordered="false">
          <Collapse.Panel key="validation" header="校验规则">
            <Form.Item label="长度上限（文本/多行文本）">
              <InputNumber
                v-model:value="addFieldForm.validation.maxLength"
                :min="1"
                :max="1000"
                placeholder="如 200"
                style="width: 100%"
              />
            </Form.Item>
            <Form.Item label="长度下限（文本/多行文本）">
              <InputNumber
                v-model:value="addFieldForm.validation.minLength"
                :min="0"
                :max="1000"
                placeholder="如 5"
                style="width: 100%"
              />
            </Form.Item>
            <Form.Item label="正则校验表达式">
              <Input
                v-model:value="addFieldForm.validation.pattern"
                placeholder="如 ^[A-Za-z0-9]+$"
              />
            </Form.Item>
            <Form.Item label="校验失败提示语">
              <Input
                v-model:value="addFieldForm.validation.patternMessage"
                placeholder="如 只能输入字母和数字"
              />
            </Form.Item>
            <template v-if="addFieldForm.type === '数字'">
              <Form.Item label="最小值">
                <InputNumber
                  v-model:value="addFieldForm.validation.min"
                  style="width: 100%"
                  placeholder="如 0"
                />
              </Form.Item>
              <Form.Item label="最大值">
                <InputNumber
                  v-model:value="addFieldForm.validation.max"
                  style="width: 100%"
                  placeholder="如 100"
                />
              </Form.Item>
            </template>
          </Collapse.Panel>
          <Collapse.Panel key="permission" header="字段权限">
            <Form.Item label="是否可编辑">
              <Switch v-model:checked="addFieldForm.permission.editable" />
            </Form.Item>
            <Form.Item label="是否在列表显示">
              <Switch v-model:checked="addFieldForm.permission.listVisible" />
            </Form.Item>
            <Form.Item label="参与派单规则">
              <Switch
                v-model:checked="addFieldForm.permission.usedInDispatch"
              />
            </Form.Item>
            <Form.Item label="参与 SLA 计算">
              <Switch v-model:checked="addFieldForm.permission.usedInSla" />
            </Form.Item>
            <Form.Item label="参与流程规则">
              <Switch
                v-model:checked="addFieldForm.permission.usedInWorkflow"
              />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Modal>

    <!-- 参考依据弹窗 -->
    <Modal
      v-model:open="referenceOpen"
      :title="
        referenceField ? `参考依据 · ${referenceField.label}` : '参考依据'
      "
      :footer="null"
      width="560px"
    >
      <template v-if="referenceField?.reference">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <Tag color="green">
            <Icon icon="lucide:sparkles" class="mr-1 size-3" />
            AI 置信度 {{ referenceField.reference.confidence }}
          </Tag>
          <span class="text-[12px] text-[#5a756d]">
            来源：{{ referenceField.reference.source }}
          </span>
        </div>
        <blockquote
          class="rounded-lg border-l-4 border-[#32c8a5] bg-[#f6fbf9] p-3 text-[13px] leading-6 text-[#1f3b34]"
        >
          {{ referenceField.reference.snippet }}
        </blockquote>
      </template>
      <Empty v-else description="暂无参考依据" />
    </Modal>
  </div>
</template>

<style scoped>
.step-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-card {
  padding: 16px 18px 14px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 18px;
}

.step-card > header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-card > header > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.step-card > header > div > svg,
.step-card > header > div > span :deep(.iconify) {
  display: block;
  width: 20px;
  height: 20px;
  padding: 10px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 12px;
}

.step-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.step-card > header p {
  margin: 3px 0 0;
  font-size: 11px;
  color: #6d827b;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

:deep(.ant-tag) {
  margin: 0;
}
</style>
