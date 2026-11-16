<!-- 团队周报 - 人员画像与历周周报预览 Drawer (PersonDetailDrawer) -->
<!-- 支持年份选择（默认今年）、按月折叠，且每个月下按单行列表展现 4 个周次的周报，点击整行直接唤起【周报完整大弹窗】 -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Drawer, Select, Tag } from 'ant-design-vue';

import WeeklyReportFullModal from './weekly-report-full-modal.vue';

export interface PersonInfo {
  id: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
  manager: string;
  avgScore: number;
  statusTag: string;
  aiComment: string;
}

interface HistoricalWeekReport {
  id: string;
  weekNum: number;
  weekLabel: string;
  dateRange: string;
  score: number;
  status: 'approved' | 'pending';
  statusLabel: string;
  workItemsCount: number;
}

interface MonthReportGroup {
  monthNum: number;
  monthLabel: string;
  collapsed: boolean;
  weeks: HistoricalWeekReport[];
}

const props = defineProps<{
  open: boolean;
  personName?: null | string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

// 人员基本信息 Mock
const currentPerson = ref<PersonInfo>({
  id: 'li-ming',
  name: '李明',
  avatar: '李',
  department: '运维部',
  role: '资深运维工程师',
  manager: '王主管',
  avgScore: 95,
  statusTag: '表现突出 / 交付稳健',
  aiComment:
    '🤖 AI 人员画像评语：李明技术功底扎实，解决复杂线上故障能力极强。近 6 个月周报提交及时率 100%，本周主动补充知识库文档，具备良好的团队协同带头作用。',
});

// 年份选择状态（默认 2026 年）
const selectedYear = ref<string>('2026');
const yearOptions = [
  { value: '2026', label: '2026 年 (今年)' },
  { value: '2025', label: '2025 年 (往期)' },
  { value: '2024', label: '2024 年 (往期)' },
];

// 按月折叠的数据结构
const monthGroups = ref<MonthReportGroup[]>([]);

function toggleMonthCollapse(group: MonthReportGroup) {
  group.collapsed = !group.collapsed;
}

// 唤起【周报完整大弹窗】
const reportPreviewModalOpen = ref(false);
const activeReportWeekLabel = ref<null | string>(null);
const activeReportDateRange = ref<null | string>(null);

function previewReportDetail(report: HistoricalWeekReport) {
  activeReportWeekLabel.value = report.weekLabel;
  activeReportDateRange.value = report.dateRange;
  reportPreviewModalOpen.value = true;
}

// 生成年度历周周报数据 (一年 30+ 50 个周次，按月分组，每月 4 周)
function generateYearlyReports(yearStr: string, _name: string) {
  const year = Number.parseInt(yearStr, 10);
  const baseScore = currentPerson.value.avgScore;
  const groups: MonthReportGroup[] = [];

  // 如果是 2026 年，展示 8 月 down to 1 月；若是往年，展示 12 月 down to 1 月
  const maxMonth = year === 2026 ? 8 : 12;

  for (let m = maxMonth; m >= 1; m--) {
    const monthStr = m < 10 ? `0${m}` : `${m}`;
    const weeks: HistoricalWeekReport[] = [];

    // 每月 4 周
    for (let w = 4; w >= 1; w--) {
      const overallWeekNum = (m - 1) * 4 + w;
      const weekCode =
        overallWeekNum < 10 ? `W0${overallWeekNum}` : `W${overallWeekNum}`;

      // 日期计算辅助
      const startDay = (w - 1) * 7 + 1;
      const endDay = Math.min(w * 7, 28);
      const startStr = `${m < 10 ? `0${m}` : m}.${startDay < 10 ? `0${startDay}` : startDay}`;
      const endStr = `${m < 10 ? `0${m}` : m}.${endDay < 10 ? `0${endDay}` : endDay}`;

      // 稍微波动分数
      const scoreOffset = (overallWeekNum % 5) - 2;

      weeks.push({
        id: `${year}-w${overallWeekNum}`,
        weekNum: overallWeekNum,
        weekLabel: `${year}年${monthStr}月 ${weekCode}周报`,
        dateRange: `${startStr} -- ${endStr}`,
        score: Math.min(100, Math.max(80, baseScore + scoreOffset)),
        status: 'approved',
        statusLabel: '已发布',
        workItemsCount: (overallWeekNum % 3) + 2,
      });
    }

    groups.push({
      monthNum: m,
      monthLabel: `${year}年 ${monthStr}月 (${weeks.length} 周)`,
      collapsed: m !== maxMonth, // 仅当月/最新月默认展开，其余折叠
      weeks,
    });
  }

  monthGroups.value = groups;
}

// 模拟加载不同员工的基本信息与历周周报
function loadPersonData(name: string) {
  if (name === '王强') {
    currentPerson.value = {
      id: 'wang-qiang',
      name: '王强',
      avatar: '王',
      department: '运维部',
      role: '现场支持专员',
      manager: '王主管',
      avgScore: 84,
      statusTag: '负荷偏高 / 建议分流',
      aiComment:
        '🤖 AI 人员画像评语：王强近期承接工单量巨大，连续 2 周处理量占全组 30% 以上。工作勤勉，但高负荷运转下容易产生疲劳与响应时效风险，建议主管进行任务分流。',
    };
  } else if (name === '张三') {
    currentPerson.value = {
      id: 'zhang-san',
      name: '张三',
      avatar: '张',
      department: '产研部',
      role: '高级 Vue 前端工程师',
      manager: '李经理',
      avgScore: 88,
      statusTag: '进度良好 / 重点卡点',
      aiComment:
        '🤖 AI 人员画像评语：张三逻辑清晰，负责工作台 UI 重构与 AI 交互控制台开发。在跟进宏远科技接口时存在外部资源阻塞，需主管介入协助。',
    };
  } else {
    currentPerson.value = {
      id: 'li-ming',
      name: name || '李明',
      avatar: (name || '李')[0]!,
      department: name === '王五' ? '产研部' : '运维部',
      role: '资深技术骨干',
      manager: '部门主管',
      avgScore: 92,
      statusTag: '交付稳健 / 表现突出',
      aiComment: `🤖 AI 人员画像评语：${name} 近 6 个月交付质量稳定，无严重延期记录，团队协同配合度高。`,
    };
  }

  generateYearlyReports(selectedYear.value, currentPerson.value.name);
}

// 监听年份切换
watch(selectedYear, (newYear) => {
  if (currentPerson.value?.name) {
    generateYearlyReports(newYear, currentPerson.value.name);
  }
});

watch(
  () => props.personName,
  (val) => {
    if (val) {
      loadPersonData(val);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Drawer
    v-model:open="open"
    :width="560"
    placement="right"
    :title="null"
    class="person-detail-drawer"
  >
    <div v-if="currentPerson" class="space-y-4 text-xs text-[#334155]">
      <!-- 1. 顶部人员 Card -->
      <header
        class="shadow-xs space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="shadow-xs flex size-12 items-center justify-center rounded-2xl bg-[#2563EB] text-lg font-bold text-white"
            >
              {{ currentPerson.avatar }}
            </div>

            <div>
              <div class="flex items-center gap-2">
                <h2 class="margin-none text-base font-bold text-[#0F172A]">
                  {{ currentPerson.name }}
                </h2>
                <Tag
                  color="blue"
                  class="border-none px-2 py-0.5 text-[10px] font-bold"
                >
                  {{ currentPerson.role }}
                </Tag>
              </div>
              <p class="margin-none mt-0.5 text-xs text-[#64748B]">
                {{ currentPerson.department }} · 直属主管：{{
                  currentPerson.manager
                }}
              </p>
            </div>
          </div>

          <Tag
            color="green"
            class="rounded-lg border-none px-2.5 py-0.5 text-xs font-bold"
          >
            {{ currentPerson.statusTag }}
          </Tag>
        </div>

        <!-- 关键绩效与提交统计 -->
        <div
          class="grid grid-cols-3 gap-2 rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-[11px]"
        >
          <div class="border-r border-[#F1F5F9] text-center">
            <span class="block text-[10px] text-[#94A3B8]">平均周报得分</span>
            <span class="font-mono text-sm font-bold text-[#059669]">
              {{ currentPerson.avgScore }} 分
            </span>
          </div>
          <div class="border-r border-[#F1F5F9] text-center">
            <span class="block text-[10px] text-[#94A3B8]">周报提交率</span>
            <span class="font-mono text-sm font-bold text-[#2563EB]">100%</span>
          </div>
          <div class="text-center">
            <span class="block text-[10px] text-[#94A3B8]">阻塞卡点</span>
            <span class="font-mono text-sm font-bold text-[#0F172A]">0 项</span>
          </div>
        </div>

        <!-- AI 人员画像评语 -->
        <div
          class="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3 leading-relaxed text-[#1E40AF]"
        >
          {{ currentPerson.aiComment }}
        </div>
      </header>

      <!-- 2. 下方：历周周报列表 (顶部年份选择 + 按月折叠 + 单行周报列表) -->
      <section class="space-y-3 border-t border-[#E2E8F0] pt-2">
        <!-- 头部：标题与年份选择下拉框 -->
        <div
          class="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
        >
          <h3
            class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
          >
            <Icon icon="lucide:calendar-days" class="size-4 text-[#2563EB]" />
            全年度历周周报 (按月折叠)
          </h3>

          <div class="flex items-center gap-2">
            <span class="text-[11px] text-[#64748B]">年份:</span>
            <Select
              v-model:value="selectedYear"
              size="small"
              class="w-32 text-xs font-bold"
              :options="yearOptions"
            />
          </div>
        </div>

        <!-- 月份折叠列表 -->
        <div class="space-y-2">
          <div
            v-for="group in monthGroups"
            :key="group.monthNum"
            class="month-group shadow-2xs overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
          >
            <!-- 可点击折叠的月份标头 -->
            <button
              type="button"
              class="flex w-full items-center justify-between bg-[#F8FAFC] p-3 text-left transition-colors hover:bg-[#F1F5F9]"
              @click="toggleMonthCollapse(group)"
            >
              <div class="flex items-center gap-2">
                <Icon
                  :icon="
                    group.collapsed ? 'lucide:folder' : 'lucide:folder-open'
                  "
                  class="size-4 text-[#2563EB]"
                />
                <span class="text-xs font-bold text-[#0F172A]">
                  {{ group.monthLabel }}
                </span>
              </div>

              <div class="flex items-center gap-2 text-[#94A3B8]">
                <span class="text-[10px]">
                  包含 {{ group.weeks.length }} 个周次
                </span>
                <Icon
                  :icon="
                    group.collapsed
                      ? 'lucide:chevron-right'
                      : 'lucide:chevron-down'
                  "
                  class="size-3.5 transition-transform"
                />
              </div>
            </button>

            <!-- 月份下 4 个周次的单行列表行 (整行点击唤起大弹窗) -->
            <div
              v-show="!group.collapsed"
              class="space-y-1.5 border-t border-[#F1F5F9] bg-white p-2"
            >
              <div
                v-for="week in group.weeks"
                :key="week.id"
                class="group flex cursor-pointer items-center justify-between rounded-lg border border-[#F1F5F9] px-3 py-2 text-xs transition-all hover:border-[#2563EB] hover:bg-[#EFF6FF]/30"
                @click="previewReportDetail(week)"
              >
                <!-- 左侧：图标 + 周次标题 + 查询条件样式日期区间 -->
                <div class="flex min-w-0 items-center gap-2.5">
                  <Icon
                    icon="lucide:file-text"
                    class="size-4 flex-none text-[#2563EB] transition-transform group-hover:scale-110"
                  />
                  <span class="truncate font-bold text-[#0F172A]">
                    {{ week.weekLabel }}
                  </span>
                  <span class="flex-none font-mono text-[11px] text-[#64748B]">
                    ({{ week.dateRange }})
                  </span>
                </div>

                <!-- 右侧：得分 + 状态 + 事项数 + 点击查看按钮 -->
                <div class="flex flex-none items-center gap-2 pl-2">
                  <Tag
                    color="green"
                    class="margin-none scale-95 border-none text-[10px] font-bold"
                  >
                    {{ week.score }}分 · 已发布
                  </Tag>
                  <span class="hidden text-[10px] text-[#94A3B8] sm:inline">
                    {{ week.workItemsCount }}项
                  </span>
                  <span
                    class="flex items-center gap-0.5 text-[11px] font-semibold text-[#2563EB] group-hover:underline"
                  >
                    查看
                    <Icon icon="lucide:chevron-right" class="size-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 【周报完整大弹窗】 (1:1 复制“我的周报”页面预览样式，不可编辑，仅点赞与评论) -->
      <WeeklyReportFullModal
        v-model:open="reportPreviewModalOpen"
        :person-name="currentPerson?.name"
        :week-label="activeReportWeekLabel"
        :date-range="activeReportDateRange"
      />
    </div>
  </Drawer>
</template>

<style scoped>
.person-detail-drawer {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
