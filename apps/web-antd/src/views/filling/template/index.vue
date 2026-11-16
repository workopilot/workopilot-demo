<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Col,
  message,
  Row,
  Tag,
  TypographyParagraph,
} from 'ant-design-vue';

const router = useRouter();

// Mock data for templates
const templates = ref([
  {
    id: 'tpl_1',
    title: '典型差旅报销单',
    description:
      '适用于标准差旅报销场景，包含行程提取、发票查验及合规审查规则。',
    icon: 'lucide:plane',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
    tags: ['财务', '报销', '高频'],
    rulesCount: 5,
    promptCount: 12,
  },
  {
    id: 'tpl_2',
    title: '通用请假申请单',
    description: '标准化的请假申请模板，自带考勤规则及假期类型自动判断提示词。',
    icon: 'lucide:calendar-clock',
    color: '#10b981',
    bgColor: '#d1fae5',
    tags: ['人事', '考勤'],
    rulesCount: 3,
    promptCount: 8,
  },
  {
    id: 'tpl_3',
    title: '标准化运维工单',
    description:
      'IT 或运维事件单，包含从聊天记录中自动抽取故障现象及定级的规则。',
    icon: 'lucide:wrench',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    tags: ['IT', '运维', '工单'],
    rulesCount: 6,
    promptCount: 15,
  },
  {
    id: 'tpl_4',
    title: '对公付款申请',
    description:
      '标准的供应商对公付款模板，含合同金额对比、收款方账户验证规则。',
    icon: 'lucide:building-2',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    tags: ['财务', '付款'],
    rulesCount: 8,
    promptCount: 20,
  },
]);

function handleApplyTemplate(template: any) {
  message.success(`已成功应用模板: ${template.title}`);
}

function handlePreview(template: any) {
  router.push(`/agent/smart_filling/template/preview/${template.id}`);
}
</script>

<template>
  <div class="flex min-h-screen flex-col gap-6 bg-slate-50/50 p-6 md:p-8">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold tracking-tight text-slate-900">模板中心</h1>
      <p class="font-medium text-slate-500">
        浏览并应用内置的标准业务模板，快速构建填报规则与提取经验池。
      </p>
    </div>

    <!-- Template Grid -->
    <Row :gutter="[24, 24]" class="mt-4">
      <Col
        v-for="tpl in templates"
        :key="tpl.id"
        :xs="24"
        :sm="12"
        :lg="8"
        :xl="6"
      >
        <div
          class="group relative flex h-[280px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]"
        >
          <!-- Content -->
          <div>
            <!-- Header (Icon & Action) -->
            <div class="mb-4 flex items-start justify-between">
              <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                :style="{ backgroundColor: tpl.bgColor, color: tpl.color }"
              >
                <Icon :icon="tpl.icon" class="size-7" />
              </div>
            </div>

            <!-- Title & Tags -->
            <div class="mb-3">
              <h3
                class="mb-2 truncate text-lg font-bold text-slate-900"
                :title="tpl.title"
              >
                {{ tpl.title }}
              </h3>
              <div class="flex flex-wrap gap-1.5">
                <Tag
                  v-for="tag in tpl.tags"
                  :key="tag"
                  :bordered="false"
                  class="!m-0 !rounded-md !bg-slate-100 !px-2 text-xs !font-medium !text-slate-600"
                >
                  {{ tag }}
                </Tag>
              </div>
            </div>

            <!-- Description -->
            <TypographyParagraph
              class="!mb-0 h-[40px] text-sm text-slate-500"
              :ellipsis="{ rows: 2, tooltip: tpl.description }"
              :content="tpl.description"
            />
          </div>

          <!-- Footer (Stats & Actions) -->
          <div
            class="mt-auto flex items-center justify-between border-t border-slate-100 pt-4"
          >
            <div class="flex gap-4 text-xs font-semibold text-slate-400">
              <div
                class="tooltip-wrap flex items-center gap-1.5"
                title="内置全局业务规则数"
              >
                <Icon icon="lucide:book-open-check" class="size-4" />
                <span>{{ tpl.rulesCount }}</span>
              </div>
              <div
                class="tooltip-wrap flex items-center gap-1.5"
                title="标准数据提取Prompt数"
              >
                <Icon icon="lucide:brain-circuit" class="size-4" />
                <span>{{ tpl.promptCount }}</span>
              </div>
            </div>

            <div
              class="flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            >
              <Button
                type="text"
                size="small"
                class="!px-2 !text-slate-500 hover:!text-primary"
                @click="handlePreview(tpl)"
              >
                预览
              </Button>
              <Button
                type="primary"
                size="small"
                class="!rounded-lg !border-slate-900 !bg-slate-900 !px-3 shadow-sm hover:!border-slate-800 hover:!bg-slate-800"
                @click="handleApplyTemplate(tpl)"
              >
                应用
              </Button>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  </div>
</template>

<style scoped>
.tooltip-wrap {
  cursor: help;
}
</style>
