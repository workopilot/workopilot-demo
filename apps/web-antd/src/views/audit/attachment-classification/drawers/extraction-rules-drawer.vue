<script setup lang="ts">
import type {
  AttachmentClassification,
  FieldRule,
} from '#/types/attachment-classification';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { updateClassificationApi } from '#/api/attachment-classification';

const props = defineProps<{
  classification: AttachmentClassification | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const saving = ref(false);
const fields = ref<FieldRule[]>([]);
const fieldModalOpen = ref(false);
const editingField = ref<Partial<FieldRule>>({});
const isEditField = ref(false);

const fieldFormRef = ref();

// 字段类型选项
const fieldTypeOptions = [
  { label: '文本 (String)', value: 'string' },
  { label: '数字 (Number)', value: 'number' },
  { label: '日期 (Date)', value: 'date' },
  { label: '金额 (Money)', value: 'money' },
  { label: '数组 (Array)', value: 'array' },
  { label: '对象 (JSON)', value: 'json' },
];

const typeColorMap: Record<string, string> = {
  string: 'blue',
  number: 'orange',
  money: 'orange',
  date: 'cyan',
  array: 'purple',
  json: 'purple',
};

// 监听分类变化，加载字段配置
watch(
  () => props.classification,
  (val) => {
    if (val) {
      // 深拷贝字段规则，避免直接修改
      fields.value = JSON.parse(JSON.stringify(val.fieldRules || []));
    } else {
      fields.value = [];
    }
  },
  { immediate: true },
);

// 保存整体配置
async function handleSave() {
  if (!props.classification) return;

  saving.value = true;
  try {
    await updateClassificationApi(props.classification.id, {
      ...props.classification,
      fieldRules: fields.value,
    });
    message.success('保存成功');
    emit('success');
    emit('update:open', false);
  } catch (error) {
    message.error('保存失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
}

// 打开新增字段弹窗
function handleAddField() {
  isEditField.value = false;
  editingField.value = {
    required: false,
    type: 'string',
  };
  fieldModalOpen.value = true;
}

// 删除字段
function handleDeleteField(index: number) {
  fields.value.splice(index, 1);
}

// 重新实现字段保存逻辑
const currentEditIndex = ref(-1);

function handleEditFieldSafe(record: FieldRule, index: number) {
  currentEditIndex.value = index;
  isEditField.value = true;
  editingField.value = { ...record };
  fieldModalOpen.value = true;
}

async function handleSaveFieldSafe() {
  try {
    await fieldFormRef.value?.validate();

    if (isEditField.value && currentEditIndex.value > -1) {
      fields.value[currentEditIndex.value] = editingField.value as FieldRule;
    } else {
      fields.value.push(editingField.value as FieldRule);
    }

    fieldModalOpen.value = false;
  } catch (error) {
    console.error(error);
  }
}

const columns = [
  {
    title: '#',
    key: 'index',
    width: 60,
    align: 'center',
    customRender: ({ index }: { index: number }) => index + 1,
  },
  { title: '字段名称', dataIndex: 'name', width: 150 },
  { title: '字段编码', dataIndex: 'code', width: 150 },
  { title: '类型', dataIndex: 'type', width: 120 },
  { title: 'Prompt 提示词', dataIndex: 'prompt' },
  { title: '必填', dataIndex: 'required', width: 100, align: 'center' },
  { title: '操作', key: 'action', width: 150, fixed: 'right', align: 'center' },
];
</script>

<template>
  <Drawer
    :open="open"
    title="配置取数规则"
    width="800"
    @close="$emit('update:open', false)"
  >
    <div class="mb-4 flex justify-between">
      <div class="text-sm text-muted-foreground">
        配置需要从文档中提取的字段。支持 OCR 提取和 LLM 推理。
      </div>
      <Button type="primary" @click="handleAddField">
        <Icon icon="lucide:plus" class="mr-1 size-4" />
        添加字段
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="fields"
      :pagination="false"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'required'">
          <Tag color="success" v-if="record.required">必填</Tag>
          <Tag v-else>选填</Tag>
        </template>

        <template v-if="column.dataIndex === 'type'">
          <Tag :color="typeColorMap[record.type?.toLowerCase()] || 'default'">
            {{ record.type }}
          </Tag>
        </template>

        <template v-if="column.dataIndex === 'prompt'">
          <Tooltip
            v-if="record.prompt && record.prompt.length > 10"
            :title="record.prompt"
          >
            <span class="cursor-help border-b border-dashed border-gray-400">
              {{ record.prompt.slice(0, 10) }}...
            </span>
          </Tooltip>
          <span v-else>{{ record.prompt || '-' }}</span>
        </template>

        <template v-if="column.key === 'action'">
          <Space>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                @click="handleEditFieldSafe(record, index)"
              >
                <Icon icon="lucide:edit" class="size-4 text-orange-500" />
              </Button>
            </Tooltip>
            <Popconfirm title="确定删除?" @confirm="handleDeleteField(index)">
              <Tooltip title="删除">
                <Button type="text" size="small" danger>
                  <Icon icon="lucide:trash-2" class="size-4" />
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <template #footer>
      <Space class="flex justify-end">
        <Button @click="$emit('update:open', false)">取消</Button>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存配置
        </Button>
      </Space>
    </template>

    <!-- 字段编辑弹窗 -->
    <Modal
      v-model:open="fieldModalOpen"
      :title="isEditField ? '编辑字段' : '添加字段'"
      width="600px"
      @ok="handleSaveFieldSafe"
    >
      <Form
        ref="fieldFormRef"
        :model="editingField"
        layout="vertical"
        class="mt-4"
      >
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="字段名称"
              name="name"
              :rules="[{ required: true, message: '请输入字段名称' }]"
            >
              <Input
                v-model:value="editingField.name"
                placeholder="如: 发票金额"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              label="字段编码"
              name="code"
              :rules="[{ required: true, message: '请输入字段编码' }]"
            >
              <Input
                v-model:value="editingField.code"
                placeholder="如: amount"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <Form.Item
              label="字段类型"
              name="type"
              :rules="[{ required: true, message: '请选择字段类型' }]"
            >
              <Select
                v-model:value="editingField.type"
                :options="fieldTypeOptions"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col :span="24">
            <Form.Item label="Prompt 提示词" name="prompt">
              <Input.TextArea
                v-model:value="editingField.prompt"
                placeholder="告诉 LLM 如何提取该字段，例如：提取发票上的总金额，不包含货币符号"
                :rows="3"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col :span="24">
            <Form.Item label="正则表达式 (Regex)" name="regex">
              <Input
                v-model:value="editingField.regex"
                placeholder="可选，用于二次校验提取结果"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col :span="24">
            <Form.Item name="required">
              <Checkbox v-model:checked="editingField.required">
                这是一个必填字段
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  </Drawer>
</template>
