<script setup lang="ts">
// 类型定义
import type { Executor, ExecutorStatus, ExecutorType } from '../types';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
} from 'ant-design-vue';

// Props 定义
interface Props {
  open?: boolean;
  executor?: Executor | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  executor: null,
});

const emit = defineEmits<Emits>();

// Emits 定义
interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

// 表单实例
const formRef = ref<any>();
const formLoading = ref(false);

// 表单数据
interface FormData {
  name: string;
  code: string;
  type: ExecutorType;
  description: string;
  status: ExecutorStatus;
  maxConcurrentTasks: number;
}

const formData = ref<FormData>({
  name: '',
  code: '',
  type: 'playwright',
  description: '',
  status: 'idle',
  maxConcurrentTasks: 5,
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入执行器名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入执行器编码', trigger: 'blur' },
    {
      pattern: /^[\w-]+$/,
      message: '编码只能包含字母、数字、下划线和连字符',
      trigger: 'blur',
    },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择执行器类型', trigger: 'change' }],
  maxConcurrentTasks: [
    { required: true, message: '请输入最大并发任务数', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      max: 20,
      message: '并发任务数在 1 到 20 之间',
      trigger: 'blur',
    },
  ],
};

// 计算标题
const modalTitle = computed(() => {
  return props.executor ? '编辑执行器' : '新增执行器';
});

// 监听 executor 变化，初始化表单
watch(
  () => props.executor,
  (newExecutor) => {
    formData.value = newExecutor
      ? {
          name: newExecutor.name,
          code: newExecutor.code,
          type: newExecutor.type,
          description: newExecutor.description || '',
          status: newExecutor.status,
          maxConcurrentTasks: newExecutor.maxConcurrentTasks,
        }
      : {
          name: '',
          code: '',
          type: 'playwright',
          description: '',
          status: 'idle',
          maxConcurrentTasks: 5,
        };
  },
  { immediate: true },
);

// 监听弹窗打开状态，重置表单
watch(
  () => props.open,
  (newOpen) => {
    if (!newOpen) {
      formRef.value?.resetFields();
    }
  },
);

// 取消
function handleCancel() {
  emit('update:open', false);
}

// 提交
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    formLoading.value = true;

    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (props.executor) {
      // 编辑模式
      message.success(`执行器 "${formData.value.name}" 更新成功`);
    } else {
      // 新增模式
      message.success(`执行器 "${formData.value.name}" 创建成功`);
    }

    emit('success');
    emit('update:open', false);
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    formLoading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    :title="modalTitle"
    width="560"
    placement="right"
    :closable="true"
    @close="handleCancel"
  >
    <div class="flex h-full flex-col">
      <!-- 表单内容 -->
      <div class="flex-1 space-y-6 overflow-y-auto pr-2">
        <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
          <!-- 基本信息 -->
          <div>
            <h3
              class="mb-4 border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-700"
            >
              基本信息
            </h3>
            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  label="执行器名称"
                  name="name"
                  tooltip="例如：生产环境Playwright执行器-01"
                >
                  <Input
                    v-model:value="formData.name"
                    placeholder="请输入执行器名称"
                    size="large"
                  >
                    <template #prefix>
                      <Icon icon="lucide:bot" class="text-slate-400" />
                    </template>
                  </Input>
                </Form.Item>
              </Col>

              <Col :span="12">
                <Form.Item
                  label="执行器编码"
                  name="code"
                  tooltip="用于唯一标识执行器，只能包含字母、数字、下划线和连字符"
                >
                  <Input
                    v-model:value="formData.code"
                    placeholder="例如：EXEC-PROD-PW-001"
                    size="large"
                  >
                    <template #prefix>
                      <Icon icon="lucide:code" class="text-slate-400" />
                    </template>
                  </Input>
                </Form.Item>
              </Col>

              <Col :span="12">
                <Form.Item
                  label="执行器类型"
                  name="type"
                  tooltip="选择执行器的运行模式：Playwright（服务端）或浏览器插件（客户端）"
                >
                  <Select
                    v-model:value="formData.type"
                    placeholder="请选择执行器类型"
                    size="large"
                  >
                    <Select.Option value="playwright">
                      <div class="flex items-center gap-2">
                        <Icon icon="logos:nodejs-icon" class="size-4" />
                        <div>
                          <div class="text-sm font-medium">Playwright</div>
                          <div class="text-xs text-slate-500">服务端自动化</div>
                        </div>
                      </div>
                    </Select.Option>
                    <Select.Option value="browser-plugin">
                      <div class="flex items-center gap-2">
                        <Icon icon="lucide:puzzle" class="size-4" />
                        <div>
                          <div class="text-sm font-medium">浏览器插件</div>
                          <div class="text-xs text-slate-500">客户端自动化</div>
                        </div>
                      </div>
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col :span="12">
                <Form.Item
                  label="最大并发数"
                  name="maxConcurrentTasks"
                  tooltip="该执行器最多可以同时处理的填报任务数量，建议设置为 3-10 个"
                >
                  <InputNumber
                    v-model:value="formData.maxConcurrentTasks"
                    :min="1"
                    :max="20"
                    class="!w-full"
                    size="large"
                  >
                    <template #prefix>
                      <Icon icon="lucide:layers" class="text-slate-400" />
                    </template>
                  </InputNumber>
                </Form.Item>
              </Col>

              <Col :span="12">
                <Form.Item
                  label="初始状态"
                  name="status"
                  tooltip="执行器的初始状态，通常设置为空闲或维护中"
                >
                  <Select v-model:value="formData.status" size="large">
                    <Select.Option value="idle">
                      <div class="flex items-center gap-2">
                        <Icon
                          icon="lucide:circle"
                          class="size-4 text-green-500"
                        />
                        <span>空闲</span>
                      </div>
                    </Select.Option>
                    <Select.Option value="busy">
                      <div class="flex items-center gap-2">
                        <Icon
                          icon="lucide:activity"
                          class="size-4 text-orange-500"
                        />
                        <span>执行中</span>
                      </div>
                    </Select.Option>
                    <Select.Option value="maintenance">
                      <div class="flex items-center gap-2">
                        <Icon
                          icon="lucide:wrench"
                          class="size-4 text-yellow-500"
                        />
                        <span>维护中</span>
                      </div>
                    </Select.Option>
                    <Select.Option value="offline">
                      <div class="flex items-center gap-2">
                        <Icon
                          icon="lucide:power"
                          class="size-4 text-gray-500"
                        />
                        <span>离线</span>
                      </div>
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col :span="24">
                <Form.Item
                  label="描述"
                  name="description"
                  tooltip="简要描述该执行器的用途和配置环境"
                >
                  <Input.TextArea
                    v-model:value="formData.description"
                    placeholder="例如：生产环境主执行器，负责处理核心业务单据填报"
                    :rows="3"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button size="large" @click="handleCancel">取消</Button>
        <Button
          type="primary"
          size="large"
          :loading="formLoading"
          @click="handleSubmit"
        >
          <Icon icon="lucide:save" class="mr-1 size-4" />
          保存
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
:deep(.ant-input-prefix) {
  margin-right: 8px;
}
</style>
