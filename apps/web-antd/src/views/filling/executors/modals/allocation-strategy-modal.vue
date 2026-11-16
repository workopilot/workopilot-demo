<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Radio,
  Row,
  Space,
  Switch,
} from 'ant-design-vue';

// Props 定义
interface Props {
  open?: boolean;
}

defineProps<Props>();

const emit = defineEmits<Emits>();

// Emits 定义
interface Emits {
  (e: 'update:open', value: boolean): void;
}

// 表单数据
interface StrategyConfig {
  // 分配策略
  allocationMode:
    | 'least-queue'
    | 'manual'
    | 'priority'
    | 'random'
    | 'round-robin';
  // 是否启用自动分配
  autoAllocation: boolean;
  // 优先级规则
  priorityRule: 'fifo' | 'high-value-first' | 'lifo';
  // 任务超时时间（秒）
  taskTimeout: number;
  // 队列最大长度
  maxQueueLength: number;
  // 是否启用负载均衡
  loadBalancing: boolean;
  // 负载均衡阈值
  loadBalanceThreshold: number;
  // 备注
  description: string;
}

const formData = ref<StrategyConfig>({
  allocationMode: 'least-queue',
  autoAllocation: true,
  priorityRule: 'fifo',
  taskTimeout: 300,
  maxQueueLength: 10,
  loadBalancing: true,
  loadBalanceThreshold: 80,
  description: '',
});

// 取消
function handleCancel() {
  emit('update:open', false);
}

// 保存
async function handleSave() {
  try {
    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 500));

    message.success('分配策略保存成功');
    emit('update:open', false);
  } catch (error) {
    message.error('保存失败');
    console.error(error);
  }
}

// 分配模式说明
const allocationModeDescriptions = {
  'round-robin': {
    title: '轮询分配',
    description: '按照固定顺序依次分配给每个执行器，确保负载均匀',
    icon: 'lucide:refresh-cw',
  },
  'least-queue': {
    title: '最少队列优先',
    description: '优先分配给当前队列最短的执行器，避免队列积压',
    icon: 'lucide:arrow-up-down',
  },
  random: {
    title: '随机分配',
    description: '从可用执行器中随机选择一个进行分配',
    icon: 'lucide:shuffle',
  },
  priority: {
    title: '按优先级分配',
    description: '根据执行器性能和历史表现分配优先级',
    icon: 'lucide:zap',
  },
  manual: {
    title: '手动分配',
    description: '需要人工指定执行器，不进行自动分配',
    icon: 'lucide:user',
  },
};

// 优先级规则说明
const priorityRuleDescriptions = {
  fifo: '先进先出 - 按照任务提交时间顺序执行',
  lifo: '后进先出 - 最新提交的任务优先执行',
  'high-value-first': '高价值优先 - 重要任务优先执行',
};
</script>

<template>
  <Drawer
    :open="open"
    title="执行器分配策略配置"
    width="700"
    placement="right"
    :closable="true"
    @close="handleCancel"
  >
    <div class="space-y-4">
      <!-- 分配模式 -->
      <Card title="分配模式" size="small">
        <Radio.Group v-model:value="formData.allocationMode" class="w-full">
          <Space direction="vertical" class="w-full">
            <div
              v-for="(mode, key) in allocationModeDescriptions"
              :key="key"
              :value="key"
              class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:border-blue-400 hover:bg-blue-50"
              :class="
                formData.allocationMode === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              "
            >
              <Radio :value="key" class="mt-0.5">
                <div class="flex items-start gap-3">
                  <div
                    class="flex size-8 items-center justify-center rounded-full"
                    :class="
                      formData.allocationMode === key
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    "
                  >
                    <Icon
                      :icon="mode.icon"
                      class="size-4"
                      :class="
                        formData.allocationMode === key
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      "
                    />
                  </div>
                  <div class="flex-1">
                    <div
                      class="font-semibold"
                      :class="
                        formData.allocationMode === key
                          ? 'text-blue-700'
                          : 'text-gray-900'
                      "
                    >
                      {{ mode.title }}
                    </div>
                    <div
                      class="mt-1 text-sm"
                      :class="
                        formData.allocationMode === key
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      "
                    >
                      {{ mode.description }}
                    </div>
                  </div>
                </div>
              </Radio>
            </div>
          </Space>
        </Radio.Group>
      </Card>

      <!-- 基础配置 -->
      <Card title="基础配置" size="small">
        <Row :gutter="16">
          <Col :span="12">
            <div class="mb-4">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">
                  启用自动分配
                </span>
                <Switch v-model:checked="formData.autoAllocation" />
              </div>
              <div class="text-xs text-gray-500">
                开启后系统将自动分配任务给执行器
              </div>
            </div>
          </Col>
          <Col :span="12">
            <div class="mb-4">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">
                  启用负载均衡
                </span>
                <Switch v-model:checked="formData.loadBalancing" />
              </div>
              <div class="text-xs text-gray-500">
                开启后将根据执行器负载动态调整分配
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <!-- 队列配置 -->
      <Card title="队列配置" size="small">
        <Form :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
          <Form.Item label="优先级规则">
            <Radio.Group v-model:value="formData.priorityRule">
              <Space direction="vertical">
                <Radio value="fifo">
                  <div>
                    <div class="font-medium text-gray-900">先进先出</div>
                    <div class="text-xs text-gray-500">
                      {{ priorityRuleDescriptions.fifo }}
                    </div>
                  </div>
                </Radio>
                <Radio value="lifo">
                  <div>
                    <div class="font-medium text-gray-900">后进先出</div>
                    <div class="text-xs text-gray-500">
                      {{ priorityRuleDescriptions.lifo }}
                    </div>
                  </div>
                </Radio>
                <Radio value="high-value-first">
                  <div>
                    <div class="font-medium text-gray-900">高价值优先</div>
                    <div class="text-xs text-gray-500">
                      {{ priorityRuleDescriptions['high-value-first'] }}
                    </div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="任务超时时间">
            <div class="flex items-center gap-2">
              <Input
                v-model:value="formData.taskTimeout"
                type="number"
                :min="60"
                :max="3600"
                style="width: 150px"
              />
              <span class="text-sm text-gray-500">秒</span>
            </div>
            <div class="mt-1 text-xs text-gray-500">
              超过此时间未完成的任务将被标记为超时
            </div>
          </Form.Item>

          <Form.Item label="队列最大长度">
            <div class="flex items-center gap-2">
              <Input
                v-model:value="formData.maxQueueLength"
                type="number"
                :min="1"
                :max="50"
                style="width: 150px"
              />
              <span class="text-sm text-gray-500">个任务</span>
            </div>
            <div class="mt-1 text-xs text-gray-500">
              单个执行器队列中等待的最大任务数
            </div>
          </Form.Item>
        </Form>
      </Card>

      <!-- 负载均衡配置 -->
      <Card v-if="formData.loadBalancing" title="负载均衡配置" size="small">
        <Form :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
          <Form.Item label="负载阈值">
            <div class="flex items-center gap-2">
              <Input
                v-model:value="formData.loadBalanceThreshold"
                type="number"
                :min="1"
                :max="100"
                style="width: 150px"
              />
              <span class="text-sm text-gray-500">%</span>
            </div>
            <div class="mt-1 text-xs text-gray-500">
              当执行器负载超过此值时，将不再分配新任务
            </div>
          </Form.Item>
        </Form>
      </Card>

      <!-- 备注 -->
      <Card title="备注" size="small">
        <Input.TextArea
          v-model:value="formData.description"
          :rows="3"
          placeholder="请输入策略说明或备注信息..."
        />
      </Card>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button size="large" @click="handleCancel">取消</Button>
        <Button type="primary" size="large" @click="handleSave">
          <Icon icon="lucide:save" class="mr-1 size-4" />
          保存策略
        </Button>
      </div>
    </template>
  </Drawer>
</template>
