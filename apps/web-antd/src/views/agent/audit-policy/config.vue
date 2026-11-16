<script setup lang="ts">
import type { SourceSystem } from '#/types/settings';

import { computed, onMounted, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  getSourceSystemsApi,
  updateSourceSystemAuditPolicyApi,
} from '#/api/settings';

const formRef = ref();
const loading = ref(false);
const saving = ref(false);
const systems = ref<SourceSystem[]>([]);
const selectedSystemId = ref<string>('');
const system = ref<null | SourceSystem>(null);

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

// 获取系统列表
async function fetchSystems() {
  loading.value = true;
  try {
    const response = await getSourceSystemsApi();
    systems.value = response.data || [];

    // 默认选择第一个系统
    if (systems.value.length > 0 && !selectedSystemId.value) {
      selectedSystemId.value = systems.value[0].id;
    }

    // 加载选中系统的配置
    if (selectedSystemId.value) {
      await loadSystemConfig(selectedSystemId.value);
    }
  } catch (error) {
    message.error('获取系统列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 加载指定系统的配置
async function loadSystemConfig(systemId: string) {
  const found = systems.value.find((s) => s.id === systemId);
  if (!found) {
    message.error('系统不存在');
    return;
  }

  system.value = found;

  // 重置表单数据
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

  // 加载已有配置
  if (found.auditPolicy) {
    formData.value = {
      strategy: found.auditPolicy.strategy,
      confidenceThreshold: found.auditPolicy.confidenceThreshold || 80,
      approveApi: found.auditPolicy.approveApi,
      approveMethod: found.auditPolicy.approveMethod,
      approveParams: found.auditPolicy.approveParams,
      statusMapping: found.auditPolicy.statusMapping,
    };
  }
}

// 切换系统
async function handleSystemChange(systemId: string) {
  selectedSystemId.value = systemId;
  await loadSystemConfig(systemId);
}

// 提交保存
async function handleSave() {
  try {
    await formRef.value?.validate();
    saving.value = true;

    if (!system.value) {
      message.error('系统信息不存在');
      return;
    }

    // 调用API更新审核策略
    await updateSourceSystemAuditPolicyApi(system.value.id, formData.value);

    message.success('保存成功');
    await loadSystemConfig(system.value.id); // 重新加载数据
  } catch (error: any) {
    message.error(`保存失败: ${error.message || error}`);
  } finally {
    saving.value = false;
  }
}

// 可用的模板变量
const templateVariables = [
  { key: 'bill_id', desc: '单据ID' },
  { key: 'approve_status', desc: '审核通过状态' },
  { key: 'summary', desc: 'AI审核总结' },
  { key: 'manual_review', desc: '是否需要人工审核（true/false）' },
];

// 表单验证规则
const rules = computed(() => {
  const isAssist = formData.value.strategy === 'assist';

  return {
    approveApi: isAssist
      ? []
      : [
          { required: true, message: '请输入审核通过接口地址' },
          { type: 'url', message: '请输入有效的URL地址' },
        ],
    confidenceThreshold: [
      { required: true, message: '请输入置信度阈值' },
      { type: 'number', min: 0, max: 100, message: '阈值为0-100之间' },
    ],
    approveParams: isAssist
      ? []
      : [
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
});

onMounted(() => {
  fetchSystems();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between border-b bg-white px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="text-lg font-semibold">审核策略配置</div>
        <Select
          v-model:value="selectedSystemId"
          style="width: 300px"
          placeholder="请选择业务系统"
          @change="handleSystemChange"
        >
          <Select.Option v-for="sys in systems" :key="sys.id" :value="sys.id">
            {{ sys.name }}
          </Select.Option>
        </Select>
      </div>
      <Button type="primary" :loading="saving" @click="handleSave">
        <template #icon><Icon icon="lucide:save" /></template>
        保存配置
      </Button>
    </div>

    <!-- Content -->
    <div v-if="!loading && system" class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-6xl space-y-6">
        <!-- 功能说明 -->
        <div class="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          配置该业务系统的审核策略和回调接口，控制AI审核结果的自动处理方式。
        </div>

        <Form ref="formRef" :model="formData" :rules="rules" layout="vertical">
          <!-- 全局设置 - 审核策略 -->
          <Card size="small" class="mb-4">
            <template #title>
              <div class="flex items-center gap-2">
                <Icon icon="lucide:sliders" class="size-5 text-primary" />
                <span>全局设置</span>
              </div>
            </template>

            <Form.Item label="审核策略" name="strategy" required>
              <div class="grid grid-cols-3 gap-4">
                <!-- 辅助模式卡片 -->
                <div
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="[
                    formData.strategy === 'assist'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  ]"
                  @click="formData.strategy = 'assist'"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="flex size-12 shrink-0 items-center justify-center rounded-xl transition-all"
                      :class="[
                        formData.strategy === 'assist'
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground',
                      ]"
                    >
                      <Icon icon="lucide:user-pen" class="size-6" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="mb-1">
                        <span class="text-base font-semibold">辅助模式</span>
                      </div>
                      <p class="text-sm leading-relaxed text-muted-foreground">
                        AI提供审核建议，需要人工确认后才能通过
                      </p>
                      <div
                        class="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Icon icon="lucide:info" class="size-3" />
                        <span>适合需要严格人工复核的场景</span>
                      </div>
                    </div>
                    <div
                      v-if="formData.strategy === 'assist'"
                      class="flex items-center"
                    >
                      <Icon
                        icon="lucide:check-circle-2"
                        class="size-5 text-primary"
                      />
                    </div>
                  </div>
                </div>

                <!-- 半自动模式卡片 -->
                <div
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="[
                    formData.strategy === 'semi_auto'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  ]"
                  @click="formData.strategy = 'semi_auto'"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="flex size-12 shrink-0 items-center justify-center rounded-xl transition-all"
                      :class="[
                        formData.strategy === 'semi_auto'
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground',
                      ]"
                    >
                      <Icon icon="lucide:scale" class="size-6" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="mb-1 flex items-center gap-2">
                        <span class="text-base font-semibold">半自动模式</span>
                        <Tag color="orange" class="origin-left scale-90">
                          推荐
                        </Tag>
                      </div>
                      <p class="text-sm leading-relaxed text-muted-foreground">
                        根据置信度自动决策，低于阈值需要人工审核
                      </p>
                      <div
                        class="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Icon icon="lucide:zap" class="size-3" />
                        <span>平衡效率与准确性的最佳方案</span>
                      </div>
                    </div>
                    <div
                      v-if="formData.strategy === 'semi_auto'"
                      class="flex items-center"
                    >
                      <Icon
                        icon="lucide:check-circle-2"
                        class="size-5 text-primary"
                      />
                    </div>
                  </div>
                </div>

                <!-- 全自动模式卡片 -->
                <div
                  class="relative cursor-pointer rounded-xl border-2 p-4 transition-all"
                  :class="[
                    formData.strategy === 'full_auto'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  ]"
                  @click="formData.strategy = 'full_auto'"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="flex size-12 shrink-0 items-center justify-center rounded-xl transition-all"
                      :class="[
                        formData.strategy === 'full_auto'
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground',
                      ]"
                    >
                      <Icon icon="lucide:rocket" class="size-6" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="mb-1">
                        <span class="text-base font-semibold">全自动模式</span>
                      </div>
                      <p class="text-sm leading-relaxed text-muted-foreground">
                        AI自动完成审核并直接调用业务系统接口
                      </p>
                      <div
                        class="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Icon icon="lucide:infinity" class="size-3" />
                        <span>最高效的无人值守审核方案</span>
                      </div>
                    </div>
                    <div
                      v-if="formData.strategy === 'full_auto'"
                      class="flex items-center"
                    >
                      <Icon
                        icon="lucide:check-circle-2"
                        class="size-5 text-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
          </Card>

          <!-- 审核通过接口配置 -->
          <Card v-if="formData.strategy !== 'assist'" size="small" class="mb-4">
            <template #title>
              <div class="flex items-center gap-2">
                <Icon icon="lucide:webhook" class="size-5 text-primary" />
                <span>审核通过接口配置</span>
              </div>
            </template>

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
            <Row :gutter="16">
              <Col :span="16">
                <div class="rounded-lg border border-border bg-muted/50 p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm font-medium">接口参数配置</div>
                    <div class="text-xs text-muted-foreground">
                      JSON 格式配置
                    </div>
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
                </div>
              </Col>
              <Col :span="8">
                <!-- 可用变量说明 -->
                <div
                  class="rounded-lg border border-border bg-blue-50 p-4 text-xs text-blue-700"
                >
                  <div class="mb-3 font-medium">可用模板变量：</div>
                  <div class="space-y-2">
                    <div
                      v-for="variable in templateVariables"
                      :key="variable.key"
                      class="rounded bg-white p-2"
                    >
                      <code class="text-blue-600">{{ variable.key }}</code>
                      <div class="mt-1 text-blue-700">{{ variable.desc }}</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          <!-- 状态映射配置 -->
          <Card v-if="formData.strategy !== 'assist'" size="small">
            <template #title>
              <div class="flex items-center gap-2">
                <Icon icon="lucide:git-commit" class="size-5 text-primary" />
                <span>状态映射配置</span>
              </div>
            </template>

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
          </Card>
        </Form>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else class="flex flex-1 items-center justify-center">
      <Spin size="large" tip="加载中..." />
    </div>
  </div>
</template>
