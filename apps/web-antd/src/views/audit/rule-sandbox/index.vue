<script setup lang="ts">
import type { AuditRule } from '#/types/audit';

import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Descriptions,
  List,
  message,
  Progress,
  Select,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import { getAuditRulesApi, mockDelay } from '#/api/audit';
import CodeEditor from '#/components/CodeEditor/index.vue';

const route = useRoute();
const loading = ref(false);
const testing = ref(false);
const progress = ref(0);
const allRules = ref<AuditRule[]>([]);
const selectedRuleId = ref<string>();
const currentRule = ref<AuditRule>();
const inputJson = ref('');
const fileList = ref<any[]>([]);

// Result State
const showResult = ref(false);
const auditSummary = ref<any>({});
const auditCheckpoints = ref<any[]>([]);
const attachmentResultList = ref<any[]>([]);
const pluginResultList = ref<any[]>([]);
const policyResultList = ref<any[]>([]);
const toolResultList = ref<any[]>([]);

// Columns
const checkpointColumns = [
  { title: '审核要点', dataIndex: 'point', key: 'point' },
  {
    title: '结果',
    dataIndex: 'result',
    key: 'result',
    width: 100,
    align: 'center',
  },
  { title: '不通过原因', dataIndex: 'reason', key: 'reason' },
];

const attachmentColumns = [
  { title: '附件名称', dataIndex: 'name', key: 'name' },
  { title: '分类编码', dataIndex: 'classCode', key: 'classCode' },
  { title: '分类名称', dataIndex: 'className', key: 'className' },
  { title: '取数内容', dataIndex: 'content', key: 'content', ellipsis: true },
];

const toolColumns = [
  { title: '工具名称', dataIndex: 'name', key: 'name' },
  {
    title: '是否调用',
    dataIndex: 'called',
    key: 'called',
    width: 100,
    align: 'center',
  },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getAuditRulesApi();
    allRules.value = res.data;

    const ruleId = route.query.ruleId as string;
    if (ruleId) {
      selectedRuleId.value = ruleId;
    }
  } finally {
    loading.value = false;
  }
});

watch(selectedRuleId, (newId) => {
  if (newId) {
    currentRule.value = allRules.value.find((r) => r.id === newId);
    showResult.value = false;
    // Generate mock input JSON based on rule
    inputJson.value = currentRule.value?.name.includes('差旅')
      ? JSON.stringify(
          {
            billType: 'TRAVEL_EXPENSE',
            employeeId: 'E12345',
            totalAmount: 3500,
            items: [
              { type: 'HOTEL', amount: 2000, city: 'Beijing', days: 2 },
              {
                type: 'FLIGHT',
                amount: 1500,
                from: 'Shanghai',
                to: 'Beijing',
              },
            ],
          },
          null,
          2,
        )
      : JSON.stringify(
          {
            billType: 'GENERAL_PAYMENT',
            vendorId: 'V98765',
            amount: 50_000,
            contractId: 'C2024001',
          },
          null,
          2,
        );
  } else {
    currentRule.value = undefined;
    inputJson.value = '';
  }
});

// Mock Run
async function handleRunTest() {
  if (!currentRule.value) {
    message.warning('请先选择规则');
    return;
  }

  testing.value = true;
  showResult.value = false;
  progress.value = 0;

  // Simulate progress
  const interval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += 10;
    }
  }, 200);

  await mockDelay(2000);

  clearInterval(interval);
  progress.value = 100;

  // Generate Mock Results
  const isPassed = Math.random() > 0.3;
  const sessionId = `SID-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

  auditSummary.value = {
    ruleName: currentRule.value.name,
    sessionId,
    result: isPassed ? 'pass' : 'fail',
    confidence: (Math.random() * 20 + 80).toFixed(2), // 80-100
    summary: isPassed
      ? '单据符合所有审核规则，建议通过。'
      : '单据存在违规项，建议驳回或人工复核。',
    suggestions: isPassed ? '无' : '请确认住宿标准是否超标，或补充特批说明。',
    overview: '本次审核共调用3个数据插件，匹配2条制度条款，识别2个附件。',
  };

  auditCheckpoints.value = [
    { point: '单据类型匹配', result: true, reason: '-' },
    { point: '金额一致性校验', result: true, reason: '-' },
    {
      point: '差旅标准校验',
      result: isPassed,
      reason: isPassed ? '-' : '一线城市住宿超标 (标准:800, 实际:1000)',
    },
    { point: '发票真伪查验', result: true, reason: '-' },
  ];

  attachmentResultList.value = [
    {
      name: '电子发票.pdf',
      classCode: 'INVOICE',
      className: '增值税发票',
      content: '{"code":"01100...", "amount":1000.00}',
    },
    {
      name: '行程单.pdf',
      classCode: 'ITINERARY',
      className: '行程单',
      content: '{"flight":"CA1234", "date":"2024-03-20"}',
    },
  ];

  pluginResultList.value = [
    { name: 'HR人员信息查询', data: '{"level": "P7", "dept": "研发部"}' },
    { name: '差旅标准查询', data: '{"city": "Beijing", "hotel_limit": 800}' },
  ];

  policyResultList.value = [
    {
      name: '《差旅管理制度》V3.0',
      content: '第3.1条：一线城市住宿标准800元/天。',
    },
    { name: '《财务报销规范》', content: '必须提供增值税专用发票。' },
  ];

  toolResultList.value = [
    { name: 'OCR识别', called: true },
    { name: 'NLP解析', called: true },
    { name: '规则引擎', called: true },
    { name: '外部API网关', called: false },
  ];

  showResult.value = true;
  testing.value = false;
}
</script>

<template>
  <Page>
    <div class="flex h-full flex-col items-stretch gap-4 p-4 lg:flex-row">
      <!-- 左侧：输入区域 -->
      <Card :bordered="false" class="flex w-full flex-col shadow-sm lg:w-5/12">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:file-input" class="text-primary" />
            <span>审核输入</span>
          </div>
        </template>

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
          <!-- 1. 选择规则 -->
          <div>
            <div class="mb-2 font-medium text-gray-700">选择审核规则</div>
            <Select
              v-model:value="selectedRuleId"
              :options="allRules.map((r) => ({ label: r.name, value: r.id }))"
              placeholder="请选择规则"
              class="w-full"
              show-search
              :filter-option="
                (input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
              "
            />
          </div>

          <!-- 2. 展示需要的数据 -->
          <div
            v-if="currentRule"
            class="rounded border border-blue-100 bg-blue-50 p-3"
          >
            <div class="mb-1 text-sm font-bold text-blue-700">所需数据:</div>
            <div class="flex flex-wrap gap-2">
              <Tag color="blue">单据JSON</Tag>
              <Tag color="cyan" v-if="currentRule.name.includes('住宿')">
                住宿发票
              </Tag>
              <Tag color="cyan" v-if="currentRule.name.includes('交通')">
                行程单
              </Tag>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              {{ currentRule.description }}
            </div>
          </div>

          <!-- 3. 模拟输入单据JSON -->
          <div class="flex min-h-[300px] flex-1 flex-col">
            <div
              class="mb-2 flex items-center justify-between font-medium text-gray-700"
            >
              <span>单据数据 (JSON)</span>
              <Button type="link" size="small" @click="() => {}">
                生成示例
              </Button>
            </div>
            <div class="flex-1 overflow-hidden rounded border">
              <CodeEditor
                v-model:value="inputJson"
                mode="json"
                class="h-full"
              />
            </div>
          </div>

          <!-- 4. 附件上传区域 -->
          <div>
            <div class="mb-2 font-medium text-gray-700">附件上传</div>
            <Upload.Dragger
              v-model:file-list="fileList"
              name="file"
              :multiple="true"
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
            >
              <p class="ant-upload-drag-icon">
                <Icon
                  icon="lucide:cloud-upload"
                  class="mx-auto size-8 text-gray-400"
                />
              </p>
              <p class="ant-upload-text">点击或拖拽上传附件</p>
            </Upload.Dragger>
          </div>
        </div>

        <div class="mt-4 border-t pt-4">
          <Button
            type="primary"
            block
            size="large"
            :loading="testing"
            :disabled="!currentRule"
            @click="handleRunTest"
          >
            <template #icon><Icon icon="lucide:play" /></template>
            开始审核
          </Button>
          <div v-if="testing" class="mt-2">
            <Progress
              :percent="progress"
              status="active"
              :show-info="false"
              size="small"
            />
            <div class="mt-1 text-center text-xs text-gray-500">
              审核进行中...
            </div>
          </div>
        </div>
      </Card>

      <!-- 右侧：审核报告 -->
      <Card
        :bordered="false"
        class="flex w-full flex-col overflow-hidden shadow-sm lg:w-7/12"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:file-check" class="text-primary" />
            <span>审核报告</span>
          </div>
        </template>

        <div
          v-if="!showResult && !testing"
          class="flex h-full flex-col items-center justify-center text-gray-400"
        >
          <Icon icon="lucide:clipboard-list" class="mb-4 size-16 opacity-20" />
          <div>请在左侧配置并开始审核</div>
        </div>

        <div
          v-else-if="testing"
          class="flex h-full items-center justify-center"
        >
          <div class="text-center">
            <Icon
              icon="lucide:loader-2"
              class="mx-auto mb-2 size-10 animate-spin text-primary"
            />
            <div class="text-gray-500">正在生成审核报告...</div>
          </div>
        </div>

        <div v-else class="flex h-full flex-col gap-6 overflow-y-auto pr-2">
          <!-- 1. 整体审核情况 -->
          <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h3 class="text-lg font-bold text-gray-800">
                  {{ auditSummary.ruleName }}
                </h3>
                <div class="mt-1 text-xs text-gray-500">
                  Session ID: {{ auditSummary.sessionId }}
                </div>
              </div>
              <div class="text-right">
                <Tag
                  :color="auditSummary.result === 'pass' ? 'success' : 'error'"
                  class="px-3 py-1 text-lg"
                >
                  <template #icon>
                    <Icon
                      :icon="
                        auditSummary.result === 'pass'
                          ? 'lucide:check-circle'
                          : 'lucide:x-circle'
                      "
                    />
                  </template>
                  {{
                    auditSummary.result === 'pass' ? '审核通过' : '审核不通过'
                  }}
                </Tag>
                <div class="mt-1 text-sm text-gray-500">
                  置信度:
                  <span class="font-bold text-gray-700">
                    {{ auditSummary.confidence }}%
                  </span>
                </div>
              </div>
            </div>

            <Descriptions :column="1" size="small" bordered>
              <Descriptions.Item label="审核总结">
                {{ auditSummary.summary }}
              </Descriptions.Item>
              <Descriptions.Item label="审核建议">
                {{ auditSummary.suggestions }}
              </Descriptions.Item>
              <Descriptions.Item label="整体概述">
                {{ auditSummary.overview }}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <!-- 2. 审核要点列表 -->
          <div>
            <div
              class="mb-2 border-l-4 border-primary pl-2 font-bold text-gray-800"
            >
              审核要点
            </div>
            <Table
              :columns="checkpointColumns"
              :data-source="auditCheckpoints"
              :pagination="false"
              size="small"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'result'">
                  <Icon
                    :icon="record.result ? 'lucide:check' : 'lucide:x'"
                    :class="record.result ? 'text-green-500' : 'text-red-500'"
                    class="mx-auto"
                  />
                </template>
                <template v-if="column.key === 'reason'">
                  <span :class="{ 'text-red-500': !record.result }">{{
                    record.reason
                  }}</span>
                </template>
              </template>
            </Table>
          </div>

          <!-- 3. 审核数据源 -->
          <div>
            <div
              class="mb-2 border-l-4 border-blue-500 pl-2 font-bold text-gray-800"
            >
              审核数据源
            </div>

            <!-- 附件列表 -->
            <div class="mb-4">
              <div class="mb-2 text-sm font-medium text-gray-600">附件列表</div>
              <Table
                :columns="attachmentColumns"
                :data-source="attachmentResultList"
                :pagination="false"
                size="small"
                bordered
              />
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <!-- 插件列表 -->
              <div>
                <div class="mb-2 text-sm font-medium text-gray-600">
                  数据插件
                </div>
                <List size="small" bordered :data-source="pluginResultList">
                  <template #renderItem="{ item }">
                    <List.Item>
                      <List.Item.Meta
                        :title="item.name"
                        :description="item.data"
                      />
                    </List.Item>
                  </template>
                </List>
              </div>

              <!-- 制度列表 -->
              <div>
                <div class="mb-2 text-sm font-medium text-gray-600">
                  参考制度
                </div>
                <List size="small" bordered :data-source="policyResultList">
                  <template #renderItem="{ item }">
                    <List.Item>
                      <List.Item.Meta
                        :title="item.name"
                        :description="item.content"
                      />
                    </List.Item>
                  </template>
                </List>
              </div>
            </div>
          </div>

          <!-- 4. 工具列表 -->
          <div>
            <div
              class="mb-2 border-l-4 border-purple-500 pl-2 font-bold text-gray-800"
            >
              工具调用
            </div>
            <Table
              :columns="toolColumns"
              :data-source="toolResultList"
              :pagination="false"
              size="small"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'called'">
                  <Tag :color="record.called ? 'blue' : 'default'">
                    {{ record.called ? '已调用' : '未调用' }}
                  </Tag>
                </template>
              </template>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
