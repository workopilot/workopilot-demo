<script setup lang="ts">
import type { SourceSystem } from '#/types/settings';

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
  Radio,
  Row,
  Select,
  Space,
} from 'ant-design-vue';

import { updateSourceSystemAuditPolicyApi } from '#/api/settings';

interface Props {
  open: boolean;
  system: null | SourceSystem;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref();
const loading = ref(false);

// JSON 文本域的值
const approveParamsJson = ref('');

// 表单数据
const formData = ref({
  strategy: 'assist' as 'assist' | 'full_auto' | 'semi_auto',
  confidenceThreshold: 80,
  approveApi: '',
  approveMethod: 'POST' as 'GET' | 'POST',
  approveParams: {
    billid: '{{bill_id}}',
    states: '{{approve_status}}',
    message: '{{summary}}',
    manualReview: '{{manual_review}}',
  },
  statusMapping: {
    pass: 10,
    rejected: -10,
  },
});

// 监听 formData.approveParams 变化，同步更新 JSON 文本域
watch(
  () => formData.value.approveParams,
  (newParams) => {
    approveParamsJson.value = JSON.stringify(newParams, null, 2);
  },
  { immediate: true, deep: true },
);

// 监听 JSON 文本域变化，同步更新 formData.approveParams
watch(approveParamsJson, (newJson) => {
  try {
    const parsed = JSON.parse(newJson);
    formData.value.approveParams = parsed;
  } catch {
    // JSON 格式错误时不更新，让用户继续编辑
  }
});

const drawerTitle = computed(() => {
  return props.system ? `${props.system.name} - 审核策略配置` : '审核策略配置';
});

// 监听打开事件，初始化表单数据
watch(
  () => props.open,
  (newVal) => {
    if (newVal && props.system?.auditPolicy) {
      // 从系统配置中加载审核策略数据
      const policy = props.system.auditPolicy;
      formData.value = {
        strategy: policy.strategy,
        confidenceThreshold: policy.confidenceThreshold || 80,
        approveApi: policy.approveApi,
        approveMethod: policy.approveMethod,
        approveParams: policy.approveParams,
        statusMapping: policy.statusMapping,
      };
    } else if (newVal) {
      // 重置为默认值
      formData.value = {
        strategy: 'assist',
        confidenceThreshold: 80,
        approveApi: '',
        approveMethod: 'POST',
        approveParams: {
          billid: '{{bill_id}}',
          states: '{{approve_status}}',
          message: '{{summary}}',
          manualReview: '{{manual_review}}',
        },
        statusMapping: {
          pass: 10,
          rejected: -10,
        },
      };
    }
  },
);

function handleCancel() {
  emit('update:open', false);
}

// 提交保存
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (!props.system) {
      message.error('系统信息不存在');
      return;
    }

    // 调用API更新审核策略
    await updateSourceSystemAuditPolicyApi(props.system.id, formData.value);

    message.success('保存成功');
    emit('success');
  } catch (error) {
    message.error('保存失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 策略说明
const strategyDescriptions = {
  assist: '辅助模式：AI提供审核建议，需要人工确认后才能通过',
  semi_auto: '半自动模式：根据置信度自动决策，低于阈值需要人工审核',
  full_auto: '全自动模式：AI自动完成审核并直接调用业务系统接口',
};

// 可用的模板变量
const templateVariables = [
  { key: 'bill_id', desc: '单据ID' },
  { key: 'approve_status', desc: '审核通过状态' },
  { key: 'summary', desc: 'AI审核总结' },
  { key: 'manual_review', desc: '是否需要人工审核（true/false）' },
];

// 表单验证规则
const rules = {
  approveApi: [
    { required: true, message: '请输入审核通过接口地址' },
    { type: 'url', message: '请输入有效的URL地址' },
  ],
  confidenceThreshold: [
    { required: true, message: '请输入置信度阈值' },
    { type: 'number', min: 0, max: 100, message: '阈值为0-100之间' },
  ],
  approveParams: [
    {
      validator: (_rule: any, _value: any) => {
        try {
          const jsonStr = approveParamsJson.value;
          if (!jsonStr || jsonStr.trim() === '') {
            return Promise.reject(new Error('请输入接口参数配置'));
          }
          JSON.parse(jsonStr);
          return Promise.resolve();
        } catch {
          return Promise.reject(new Error('请输入有效的 JSON 格式'));
        }
      },
    },
  ],
};
</script>

<template>
  <Drawer
    :open="open"
    :title="drawerTitle"
    placement="right"
    :width="700"
    @close="handleCancel"
  >
    <div class="space-y-6">
      <!-- 功能说明 -->
      <div class="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        配置该业务系统的审核策略和回调接口，控制AI审核结果的自动处理方式。
      </div>

      <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
        <!-- 全局设置 - 审核策略 -->
        <div class="mb-6">
          <h3 class="mb-4 flex items-center gap-2 text-base font-semibold">
            <Icon icon="lucide:sliders" class="size-5 text-primary" />
            全局设置
          </h3>

          <Form.Item label="审核策略" name="strategy" required>
            <Radio.Group v-model:value="formData.strategy">
              <Space direction="vertical" :size="8">
                <Radio value="assist">
                  <div>
                    <div class="font-medium">辅助模式</div>
                    <div class="text-xs text-muted-foreground">
                      {{ strategyDescriptions.assist }}
                    </div>
                  </div>
                </Radio>
                <Radio value="semi_auto">
                  <div>
                    <div class="font-medium">半自动模式</div>
                    <div class="text-xs text-muted-foreground">
                      {{ strategyDescriptions.semi_auto }}
                    </div>
                  </div>
                </Radio>
                <Radio value="full_auto">
                  <div>
                    <div class="font-medium">全自动模式</div>
                    <div class="text-xs text-muted-foreground">
                      {{ strategyDescriptions.full_auto }}
                    </div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <!-- 半自动模式时显示置信度阈值 -->
          <Form.Item
            v-if="formData.strategy === 'semi_auto'"
            label="置信度阈值"
            name="confidenceThreshold"
            required
            extra="低于此阈值的结果将转人工审核"
          >
            <InputNumber
              v-model:value="formData.confidenceThreshold"
              :min="0"
              :max="100"
              :formatter="(value: number) => `${value}%`"
              :parser="(value: string) => Number(value.replace('%', ''))"
              class="w-full"
            />
          </Form.Item>
        </div>

        <!-- 审核通过接口配置 -->
        <div class="mb-6">
          <h3 class="mb-4 flex items-center gap-2 text-base font-semibold">
            <Icon icon="lucide:webhook" class="size-5 text-primary" />
            审核通过接口配置
          </h3>

          <Row :gutter="16">
            <Col :span="16">
              <Form.Item
                label="接口地址"
                name="approveApi"
                required
                extra="AI审核通过后调用的业务系统接口"
              >
                <Input
                  v-model:value="formData.approveApi"
                  placeholder="https://api.example.com/approve"
                />
              </Form.Item>
            </Col>
            <Col :span="8">
              <Form.Item label="请求方法" name="approveMethod" required>
                <Select v-model:value="formData.approveMethod">
                  <Select.Option value="POST">POST</Select.Option>
                  <Select.Option value="GET">GET</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <!-- 参数配置 -->
          <div class="rounded-lg border border-border bg-muted/50 p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="text-sm font-medium">接口参数配置</div>
              <div class="text-xs text-muted-foreground">JSON 格式配置</div>
            </div>

            <Form.Item name="approveParams">
              <!-- eslint-disable vue/html-quotes -->
              <Input.TextArea
                v-model:value="approveParamsJson"
                :rows="10"
                placeholder='{
  "billid": "{{bill_id}}",
  "states": "{{approve_status}}",
  "message": "{{summary}}",
  "manualReview": "{{manual_review}}"
}'
                class="font-mono text-sm"
              />
              <!-- eslint-enable vue/html-quotes -->
            </Form.Item>

            <!-- 可用变量说明 -->
            <div class="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <div class="mb-2 font-medium">可用模板变量：</div>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="variable in templateVariables"
                  :key="variable.key"
                  class="flex items-center justify-between"
                >
                  <code class="rounded bg-white px-1">{{ variable.key }}</code>
                  <span>{{ variable.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 状态映射配置 -->
        <div>
          <h3 class="mb-4 flex items-center gap-2 text-base font-semibold">
            <Icon icon="lucide:git-commit" class="size-5 text-primary" />
            状态映射配置
          </h3>

          <div class="rounded-lg border border-border bg-muted/50 p-4">
            <div class="mb-3 text-sm text-muted-foreground">
              配置业务系统接口返回的状态码与审核结果的映射关系
            </div>

            <Row :gutter="16">
              <Col :span="12">
                <Form.Item
                  label="通过状态值"
                  name="statusMapping.pass"
                  required
                  extra="审核通过时传递给业务系统的状态值"
                >
                  <InputNumber
                    v-model:value="formData.statusMapping.pass"
                    :min="-100"
                    :max="100"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
              <Col :span="12">
                <Form.Item
                  label="拒绝状态值"
                  name="statusMapping.rejected"
                  required
                  extra="审核拒绝时传递给业务系统的状态值"
                >
                  <InputNumber
                    v-model:value="formData.statusMapping.rejected"
                    :min="-100"
                    :max="100"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>
      </Form>
    </div>

    <!-- 底部按钮 -->
    <div class="flex justify-end gap-2 border-t pt-4">
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" :loading="loading" @click="handleSubmit">
        保存配置
      </Button>
    </div>
  </Drawer>
</template>
