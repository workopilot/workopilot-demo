<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { ExtractionStrategy, FieldExtractionRule } from '#/types/settings';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';

import {
  getExtractionRulesApi,
  updateExtractionRulesApi,
} from '#/api/settings';

const props = defineProps<{
  billTypeId: string;
  open: boolean;
  rule: FieldExtractionRule | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);

// 表单数据
interface FormData {
  fieldKey: string;
  fieldDesc: string;
  required: boolean;
  strategies: ExtractionStrategy[];
}

const formData = reactive<FormData>({
  fieldKey: '',
  fieldDesc: '',
  required: false,
  strategies: [],
});

const formRef = ref();

// 表单验证规则
const rules: Record<string, Rule[]> = {
  fieldKey: [{ required: true, message: '请输入字段键' }],
  fieldDesc: [{ required: true, message: '请输入字段描述' }],
};

// 策略类型选项
const strategyTypeOptions = [
  { label: 'ID 选择器', value: 'ID' },
  { label: 'XPath 表达式', value: 'XPATH' },
  { label: 'CSS 选择器', value: 'CSS' },
  { label: '正则表达式', value: 'REGEX' },
];

// 是否为编辑模式
const isEdit = computed(() => !!props.rule);

// 弹窗标题
const title = computed(() =>
  isEdit.value ? '编辑字段提取规则' : '新增字段提取规则',
);

// 监听弹窗打开
watch(
  () => props.open,
  (open) => {
    if (open) {
      if (props.rule) {
        // 编辑模式
        formData.fieldKey = props.rule.fieldKey;
        formData.fieldDesc = props.rule.fieldDesc;
        formData.required = props.rule.required;
        formData.strategies = [...props.rule.strategies];
      } else {
        // 新增模式
        formRef.value?.resetFields();
        formData.fieldKey = '';
        formData.fieldDesc = '';
        formData.required = false;
        formData.strategies = [{ type: 'ID', selector: '' }];
      }
    }
  },
);

// 添加策略
function addStrategy() {
  formData.strategies.push({ type: 'ID', selector: '' });
}

// 删除策略
function removeStrategy(index: number) {
  formData.strategies.splice(index, 1);
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate();

    // 验证策略
    if (formData.strategies.length === 0) {
      message.error('至少需要添加一个提取策略');
      return;
    }

    for (const strategy of formData.strategies) {
      if (!strategy.selector.trim()) {
        message.error('请填写完整的提取策略选择器');
        return;
      }
    }

    loading.value = true;

    // 获取现有规则
    const response = await getExtractionRulesApi(props.billTypeId);
    const existingRules = response.data || [];

    let updatedRules: FieldExtractionRule[];

    if (isEdit.value && props.rule) {
      // 编辑模式:更新现有规则
      updatedRules = existingRules.map((r) =>
        r.id === props.rule!.id
          ? {
              ...r,
              fieldKey: formData.fieldKey,
              fieldDesc: formData.fieldDesc,
              required: formData.required,
              strategies: formData.strategies,
            }
          : r,
      );
    } else {
      // 新增模式:添加新规则
      const newRule: FieldExtractionRule = {
        id: `${Date.now()}`,
        fieldKey: formData.fieldKey,
        fieldDesc: formData.fieldDesc,
        required: formData.required,
        strategies: formData.strategies,
      };
      updatedRules = [...existingRules, newRule];
    }

    await updateExtractionRulesApi(props.billTypeId, updatedRules);
    message.success(isEdit.value ? '更新成功' : '新增成功');
    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
      return;
    }
    message.error(isEdit.value ? '更新失败' : '新增失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleCancel() {
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
    width="700px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <Form.Item label="字段键" name="fieldKey">
        <Input
          v-model:value="formData.fieldKey"
          placeholder="如: bill_no"
          :disabled="isEdit"
        />
      </Form.Item>

      <Form.Item label="字段描述" name="fieldDesc">
        <Input v-model:value="formData.fieldDesc" placeholder="如: 单据号" />
      </Form.Item>

      <Form.Item label="是否必填" name="required">
        <Switch v-model:checked="formData.required" />
        <span class="ml-2 text-sm text-muted-foreground">
          {{ formData.required ? '必填' : '非必填' }}
        </span>
      </Form.Item>

      <Form.Item label="提取策略">
        <div class="space-y-3">
          <div
            v-for="(strategy, index) in formData.strategies"
            :key="index"
            class="rounded-lg border p-3"
          >
            <Space direction="vertical" :size="8" class="w-full">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">策略 {{ index + 1 }}</span>
                <Button
                  v-if="formData.strategies.length > 1"
                  type="text"
                  danger
                  size="small"
                  @click="removeStrategy(index)"
                >
                  <Icon icon="lucide:trash-2" class="size-3" />
                </Button>
              </div>

              <Select
                v-model:value="strategy.type"
                :options="strategyTypeOptions"
                placeholder="选择策略类型"
                class="w-full"
              />

              <Input.TextArea
                v-model:value="strategy.selector"
                :placeholder="
                  strategy.type === 'ID'
                    ? 'billNo'
                    : strategy.type === 'XPATH'
                      ? '//input[@id=\'billNo\']/@value'
                      : strategy.type === 'CSS'
                        ? '#billNo'
                        : '单据号[:：]\\s*([A-Z0-9]+)'
                "
                :rows="2"
              />
            </Space>
          </div>

          <Button type="dashed" block @click="addStrategy">
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            添加策略
          </Button>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          支持多个提取策略,按优先级从上到下依次尝试
        </p>
      </Form.Item>
    </Form>
  </Modal>
</template>
