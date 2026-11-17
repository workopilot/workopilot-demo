<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, message, Tag } from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';
import FillInvoiceCard from '#/views/ai-employee/workbench/components/fill-assistant/FillInvoiceCard.vue';
import FillPlanCard from '#/views/ai-employee/workbench/components/fill-assistant/FillPlanCard.vue';
import FillSummaryCard from '#/views/ai-employee/workbench/components/fill-assistant/FillSummaryCard.vue';
import HeaderCollectCard from '#/views/ai-employee/workbench/components/smart-fill/HeaderCollectCard.vue';

interface FillInvoice {
  amount: string;
  anomaly?: string;
  date: string;
  id: string;
  number: string;
  seller: string;
  type: string;
}

interface FillChatMsg {
  id: string;
  role: 'agent' | 'user';
  content?: string;
  time: string;
  cardType?:
    | 'fill-invoice'
    | 'fill-plan'
    | 'fill-summary'
    | 'header-collect'
    | 'todo-card';
  cardData?: Record<string, any>;
  cardTitle?: string;
  cardDesc?: string;
  done?: boolean;
}

const router = useRouter();

const employee =
  mockMateEmployees.find((item) => item.id === 'fill-assistant') ||
  mockMateEmployees[0]!;

const draft = ref('');
const scroller = ref<HTMLElement>();
const drawerVisible = ref(false);
const submitting = ref(false);
/** 报销单是否已提交（控制待办卡片与抽屉按钮状态） */
const billSubmitted = ref(false);

const fillInvoices: FillInvoice[] = [
  {
    id: 'inv_1',
    type: '火车票',
    seller: '中国铁路上海局集团有限公司',
    number: '00483217',
    amount: '¥286.00',
    date: '2026-07-20',
  },
  {
    id: 'inv_2',
    type: '火车票',
    seller: '中国铁路上海局集团有限公司',
    number: '00483218',
    amount: '¥286.00',
    date: '2026-07-24',
  },
  {
    id: 'inv_3',
    type: '增值税专用发票',
    seller: '上海如家精选酒店有限公司',
    number: '87654321',
    amount: '¥1,280.00',
    date: '2026-07-20',
  },
  {
    id: 'inv_4',
    type: '增值税专用发票',
    seller: '上海如家精选酒店有限公司',
    number: '87654322',
    amount: '¥1,350.00',
    date: '2026-07-23',
    anomaly: '入住人数待补充',
  },
  {
    id: 'inv_5',
    type: '增值税普通发票',
    seller: '上海锦江餐饮管理有限公司',
    number: '99887766',
    amount: '¥300.00',
    date: '2026-07-22',
  },
  {
    id: 'inv_6',
    type: '电子普票',
    seller: '上海申通地铁集团有限公司',
    number: '66554433',
    amount: '¥86.00',
    date: '2026-07-20',
  },
  {
    id: 'inv_7',
    type: '电子普票',
    seller: '上海强生出租汽车股份有限公司',
    number: '66554434',
    amount: '¥92.00',
    date: '2026-07-22',
  },
  {
    id: 'inv_8',
    type: '出租车发票',
    seller: '上海海博出租汽车有限公司',
    number: '03398877',
    amount: '¥45.00',
    date: '2026-07-21',
    anomaly: '连号发票，建议人工复核',
  },
];

const fillHeader = ref({
  company: '上海家化联合股份有限公司',
  budgetCategory: '全年预算',
  project: '',
  description: '7月份差旅费用报销',
  applicant: '当前登录人（自动带出）',
  department: '数字化创新部',
  businessType: '管理-国内差旅',
  currency: 'RMB_人民币',
  contact: '138****5678',
});

const selectedInvoices = ref<FillInvoice[]>([]);
const billNo = 'CLS20260728002';

const summaryItems = computed(() => {
  const byCategory: Record<
    string,
    {
      amount: number;
      category: string;
      count: number;
      invoiceNos: string[];
      status: 'pass' | 'warn';
      tip: string;
    }
  > = {};
  for (const inv of selectedInvoices.value) {
    let category: string;
    if (inv.type === '火车票') {
      category = '城际交通费';
    } else if (inv.type.includes('专用发票') && inv.seller.includes('酒店')) {
      category = '住宿费';
    } else if (inv.type === '出租车发票' || inv.type === '电子普票') {
      category = '市内交通费';
    } else {
      category = '其他费用';
    }
    if (!byCategory[category]) {
      byCategory[category] = {
        amount: 0,
        category,
        count: 0,
        invoiceNos: [],
        status: 'pass',
        tip: '',
      };
    }
    byCategory[category]!.amount += Number.parseFloat(
      inv.amount.replaceAll(/[¥,]/g, '') || '0',
    );
    byCategory[category]!.count += 1;
    byCategory[category]!.invoiceNos.push(inv.number);
    if (inv.anomaly) {
      byCategory[category]!.status = 'warn';
      byCategory[category]!.tip = `${inv.number} ${inv.anomaly}，请补充后提交`;
    }
  }
  const defaultTips: Record<string, string> = {
    城际交通费: '已与行程日期逐条匹配，全部一致',
    住宿费: '符合差旅住宿标准（≤¥600/晚）',
    市内交通费: '均在市内交通报销范围内',
    其他费用: '餐费需附招待审批单，已自动关联',
  };
  return Object.values(byCategory).map((item) => ({
    ...item,
    amount: `¥${item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    invoiceNos: item.invoiceNos.join('、'),
    tip: item.tip || defaultTips[item.category] || '校验通过',
  }));
});

const fillTotal = computed(() => {
  const sum = selectedInvoices.value.reduce(
    (acc, inv) =>
      acc + Number.parseFloat(inv.amount.replaceAll(/[¥,]/g, '') || '0'),
    0,
  );
  return `¥${(sum + 400).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

const invoiceTotal = computed(() => {
  const sum = fillInvoices.reduce(
    (acc, inv) =>
      acc + Number.parseFloat(inv.amount.replaceAll(/[¥,]/g, '') || '0'),
    0,
  );
  return `¥${sum.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

const planSteps = [
  { title: '发票智能筛选', desc: '自动扫描发票池，匹配行程日期' },
  { title: '表头信息确认', desc: 'AI 推断单据表头，可修改' },
  { title: '费用汇总校验', desc: '归类汇总并执行合规预校验' },
  { title: '生成报销单', desc: '生成单据待办，支持预览提交' },
];

let msgSeq = 0;
function nextId() {
  msgSeq += 1;
  return `fill-msg-${Date.now()}-${msgSeq}`;
}

function initialMessages(): FillChatMsg[] {
  return [
    {
      id: nextId(),
      role: 'agent',
      content:
        '您好！我是您的填报助理，可以帮您完成报销单的分步填报：发票智能筛选 → 表头信息确认 → 费用汇总校验 → 生成报销单。请告诉我您的填报需求。',
      time: '10:00',
    },
    {
      id: nextId(),
      role: 'user',
      content: '帮我填报7月份的差旅报销单',
      time: '10:01',
    },
    {
      id: nextId(),
      role: 'agent',
      content:
        '收到！我已扫描您的发票池并匹配行程数据，为您生成如下填报方案，请确认后开始。',
      time: '10:01',
    },
    {
      id: nextId(),
      role: 'agent',
      cardType: 'fill-plan',
      cardData: {
        docType: '差旅报销单',
        period: '2026-07',
        invoiceCount: fillInvoices.length,
        invoiceTotal: invoiceTotal.value,
        steps: planSteps,
      },
      time: '10:01',
    },
  ];
}

const messages = ref<FillChatMsg[]>(initialMessages());

const chatHistory = [
  {
    icon: 'lucide:check',
    title: '7月差旅报销单填报',
    time: '今天',
    active: true,
  },
  {
    icon: 'lucide:message-square',
    title: '6月差旅报销单（已提交）',
    time: '昨天',
  },
  { icon: 'lucide:message-square', title: '招待费报销咨询', time: '08-14' },
];

const quickActions = computed<Array<[string, string]>>(() => [
  ['开始填报差旅报销单', 'fill-report'],
  ['查看我的单据', '/app/mate/employee/fill-assistant/my-bills'],
]);

async function scrollBottom() {
  await nextTick();
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
}

function pushMsg(msg: Omit<FillChatMsg, 'id'>) {
  messages.value.push({ id: nextId(), ...msg });
}

/** 重置会话并回到初始填报方案 */
async function restartFlow() {
  billSubmitted.value = false;
  selectedInvoices.value = [];
  fillHeader.value = {
    company: '上海家化联合股份有限公司',
    budgetCategory: '全年预算',
    project: '',
    description: '7月份差旅费用报销',
    applicant: '当前登录人（自动带出）',
    department: '数字化创新部',
    businessType: '管理-国内差旅',
    currency: 'RMB_人民币',
    contact: '138****5678',
  };
  messages.value = initialMessages();
  await scrollBottom();
}

// ============ 分步填报流程：方案 → 发票 → 表头 → 汇总 → 生成待办 ============

function handleFillPlanConfirm() {
  pushMsg({ role: 'user', content: '方案没问题，开始填报', time: '刚刚' });
  pushMsg({
    role: 'agent',
    content:
      '好的，我已扫描发票池并按行程日期智能匹配，共命中 8 张差旅相关发票（其中 2 张存在异常已为您排除勾选），请核对确认。',
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    cardType: 'fill-invoice',
    cardData: {
      invoices: fillInvoices,
      matchBasis:
        '结合本单报销期间（2026-07）与行程数据（2026-07-20 至 2026-07-24 上海），按发票日期、费用类型与行程规则自动匹配，连号及信息缺失发票将标记提醒。',
    },
    time: '刚刚',
  });
  void scrollBottom();
}

function handleFillInvoiceConfirm(selected: FillInvoice[]) {
  selectedInvoices.value = selected;
  pushMsg({
    role: 'user',
    content: `已确认 ${selected.length} 张发票`,
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    content: '好的，已根据您的描述推断出单据表头信息，请确认或修改。',
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    cardType: 'header-collect',
    cardData: { ...fillHeader.value },
    time: '刚刚',
  });
  void scrollBottom();
}

function handleFillHeaderConfirm(data: any) {
  fillHeader.value = { ...data };
  pushMsg({
    role: 'user',
    content: `单头信息已确认：${data.company} · ${data.budgetCategory} · ${data.description}`,
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    content:
      '已按科目自动归类费用明细并完成合规预校验，请查看汇总结果，确认后生成报销单。',
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    cardType: 'fill-summary',
    cardData: {
      docTitle: '差旅报销单',
      items: summaryItems.value,
      allowance: { amount: '¥400.00', label: '国内餐费（100元/天 × 4天）' },
      total: fillTotal.value,
    },
    time: '刚刚',
  });
  void scrollBottom();
}

function handleFillSummaryConfirm() {
  const invoiceCount = selectedInvoices.value.length;
  billSubmitted.value = false;
  pushMsg({
    role: 'user',
    content: '费用汇总已确认，生成报销单',
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    content:
      '已为您生成差旅报销单，待办卡片如下，点击「立即处理」可查看完整单据内容并进行提交。',
    time: '刚刚',
  });
  pushMsg({
    role: 'agent',
    cardType: 'todo-card',
    cardTitle: `差旅报销单已生成 — ${billNo}`,
    cardDesc: `合计金额 ${fillTotal.value} · 发票${invoiceCount}张 · 费用明细${summaryItems.value.length}项 · 差旅补贴1项`,
    time: '刚刚',
  });
  message.success('差旅报销单已生成');
  void scrollBottom();
}

async function submitBill() {
  submitting.value = true;
  await new Promise((resolve) => setTimeout(resolve, 600));
  submitting.value = false;
  billSubmitted.value = true;
  drawerVisible.value = false;
  message.success('报销单已提交，可在「我的单据」中跟踪审批进度');
  pushMsg({
    role: 'agent',
    content: `报销单 ${billNo} 已提交成功，当前状态：审批中。你可以前往「我的单据」跟踪进度，或继续发起新的填报。`,
    time: '刚刚',
  });
  void scrollBottom();
}

function gotoMyBills() {
  void router.push('/app/mate/employee/fill-assistant/my-bills');
}

async function performAction(id: string) {
  if (id.startsWith('/')) {
    await router.push(id);
    return;
  }
  if (id === 'fill-report') {
    await restartFlow();
  }
}

async function send() {
  const content = draft.value.trim();
  if (!content) return;
  draft.value = '';
  if (
    content.includes('重新') ||
    content.includes('再填') ||
    content.includes('报销') ||
    content.includes('填报')
  ) {
    await restartFlow();
    return;
  }
  pushMsg({ role: 'user', content, time: '刚刚' });
  pushMsg({
    role: 'agent',
    content:
      '我可以帮你完成报销单填报：发票智能筛选 → 表头确认 → 费用汇总校验 → 生成报销单。试试「帮我填报7月份的差旅报销单」，或点击下方快捷指令重新开始。',
    time: '刚刚',
  });
  await scrollBottom();
}
</script>

<template>
  <section class="ai-chat">
    <aside class="ai-chat-history">
      <header>
        <h2>对话历史</h2>
        <Button shape="circle" type="text" aria-label="新建对话">
          <Icon icon="lucide:plus" />
        </Button>
      </header>
      <button
        v-for="item in chatHistory"
        :key="item.title"
        type="button"
        :class="{ 'is-active': item.active }"
      >
        <Icon :icon="item.icon" />
        <strong>{{ item.title }}</strong>
        <small>{{ item.time }}</small>
      </button>
    </aside>

    <main class="ai-chat-main">
      <header class="ai-chat-main__header">
        <div>
          <img :src="employee.avatar" :alt="employee.name" />
          <span><i></i></span>
          <h2>{{ employee.name }}</h2>
        </div>
        <div>
          <Button
            shape="circle"
            type="text"
            aria-label="我的单据"
            @click="gotoMyBills"
          >
            <Icon icon="lucide:file-check-2" />
          </Button>
          <Button shape="circle" type="text" aria-label="新建会话">
            <Icon icon="lucide:message-square-plus" />
          </Button>
        </div>
      </header>

      <div ref="scroller" class="ai-chat-main__messages">
        <section class="ai-chat-summary">
          <span>{{ employee.role }}</span>
          <h1>{{ employee.name }}</h1>
          <p>
            你好，我是填报助理。用一句话告诉我报销需求，我会自动筛选发票、推断表头、归类费用并完成合规校验——每一步都由你确认，AI
            不会自动提交。
          </p>
          <div>
            <button
              v-for="action in quickActions"
              :key="action[0]"
              type="button"
              @click="performAction(action[1])"
            >
              {{ action[0] }}
              <Icon icon="lucide:arrow-up-right" />
            </button>
          </div>
        </section>

        <template v-for="item in messages" :key="item.id">
          <div
            v-if="item.role === 'agent'"
            class="ai-chat-message is-assistant"
          >
            <img
              :src="employee.avatar"
              :alt="employee.name"
              class="chat-msg-avatar shadow-xs size-9 flex-none rounded-full border border-[#E8E8E8] object-cover"
            />
            <div class="ai-chat-message__bubble">
              <p v-if="item.content" class="whitespace-pre-line">
                {{ item.content }}
              </p>

              <!-- 填报方案卡 -->
              <FillPlanCard
                v-if="item.cardType === 'fill-plan'"
                v-bind="item.cardData"
                @confirm="handleFillPlanConfirm"
              />

              <!-- 发票智能筛选卡 -->
              <FillInvoiceCard
                v-else-if="item.cardType === 'fill-invoice'"
                v-bind="item.cardData"
                @confirm="handleFillInvoiceConfirm"
              />

              <!-- 表头确认卡 -->
              <HeaderCollectCard
                v-else-if="item.cardType === 'header-collect'"
                :initial-data="item.cardData"
                @confirm="handleFillHeaderConfirm"
              />

              <!-- 费用汇总与合规校验卡 -->
              <FillSummaryCard
                v-else-if="item.cardType === 'fill-summary'"
                v-bind="item.cardData"
                @confirm="handleFillSummaryConfirm"
              />

              <!-- 生成待办卡 -->
              <div
                v-else-if="item.cardType === 'todo-card'"
                class="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg shadow-violet-100/40"
              >
                <div
                  class="flex items-center justify-between bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white"
                    >
                      <Icon icon="lucide:file-check-2" class="size-3" />
                    </span>
                    <h4 class="m-0 text-sm font-bold text-white">报销单待办</h4>
                  </div>
                  <Tag v-if="billSubmitted" class="m-0" color="success">
                    已提交
                  </Tag>
                  <span
                    v-else
                    class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
                  >
                    待处理
                  </span>
                </div>
                <div class="space-y-3 p-4">
                  <div class="text-sm font-bold text-slate-800">
                    {{ item.cardTitle }}
                  </div>
                  <div class="text-xs text-slate-400">{{ item.cardDesc }}</div>
                  <div class="flex items-center justify-end gap-2">
                    <Button size="small" @click="gotoMyBills">
                      查看我的单据
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      class="rounded-lg bg-violet-600 font-bold hover:!bg-violet-700"
                      @click="drawerVisible = true"
                    >
                      <Icon icon="lucide:arrow-right" class="size-3.5" />
                      立即处理
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="ai-chat-message is-user">
            <div class="ai-chat-message__bubble">
              <p class="whitespace-pre-line">{{ item.content }}</p>
            </div>
            <div
              class="chat-msg-avatar shadow-xs flex size-9 flex-none items-center justify-center rounded-full border border-[#0D6853] bg-[#0D6853] text-sm font-bold text-white"
              title="韩立"
            >
              王
            </div>
          </div>
        </template>
      </div>

      <div class="composer-container border-t border-[#E6EEEB] bg-white">
        <div
          class="composer-preset-bar flex items-center gap-2 overflow-x-auto border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-2"
        >
          <span
            class="flex flex-none items-center gap-1 text-xs font-medium text-[#86909C]"
          >
            <Icon icon="lucide:sparkles" class="size-3.5 text-[#0D6853]" />
            快捷指令:
          </span>
          <button
            v-for="action in quickActions"
            :key="action[0]"
            type="button"
            class="preset-chip-btn shadow-xs flex flex-none cursor-pointer items-center gap-1 rounded-full border border-[#0D6853]/30 bg-white px-3 py-1 text-xs text-[#0D6853] transition-colors hover:bg-[#E8FFEA]"
            @click="performAction(action[1])"
          >
            <Icon icon="lucide:sparkles" class="size-3.5" />
            <span>{{ action[0] }}</span>
          </button>
        </div>

        <footer class="ai-chat-composer border-none">
          <Input.TextArea
            v-model:value="draft"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="输入消息，或点击上方快捷指令开始…"
            @press-enter.prevent="send"
          />
          <Button type="text" aria-label="添加附件">
            <Icon icon="lucide:paperclip" />
          </Button>
          <Button
            type="primary"
            shape="circle"
            :disabled="!draft.trim()"
            aria-label="发送消息"
            @click="send"
          >
            <Icon icon="lucide:arrow-up" />
          </Button>
        </footer>
      </div>
    </main>

    <!-- 报销单预览抽屉 -->
    <Drawer
      v-model:open="drawerVisible"
      :width="520"
      class="fill-bill-drawer"
      title="差旅报销单预览"
    >
      <div class="space-y-4">
        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3"
        >
          <div>
            <div class="text-xs text-slate-400">单据编号</div>
            <div class="text-sm font-bold text-violet-700">{{ billNo }}</div>
          </div>
          <Tag :color="billSubmitted ? 'success' : 'processing'">
            {{ billSubmitted ? '审批中' : '待提交' }}
          </Tag>
        </div>

        <div>
          <div class="mb-2 text-xs font-bold text-slate-600">单据表头</div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(label, key) in {
                company: '公司',
                budgetCategory: '预算科目',
                department: '部门',
                businessType: '业务类型',
                applicant: '申请人',
                currency: '币种',
                contact: '联系电话',
                description: '事由',
              }"
              :key="key"
              class="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
            >
              <div class="text-[10px] text-slate-400">{{ label }}</div>
              <div class="truncate text-xs font-bold text-slate-700">
                {{ (fillHeader as any)[key] || '—' }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-2 text-xs font-bold text-slate-600">费用明细</div>
          <div class="space-y-1.5">
            <div
              v-for="item in summaryItems"
              :key="item.category"
              class="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700">
                  {{ item.category }}
                  <span class="ml-1 text-[10px] font-normal text-slate-400">
                    {{ item.count }} 张
                  </span>
                </span>
                <span class="text-xs font-bold text-slate-800">
                  {{ item.amount }}
                </span>
              </div>
            </div>
            <div
              class="flex items-center justify-between rounded-lg border border-dashed border-violet-200 bg-violet-50/40 px-3 py-2"
            >
              <span class="text-xs font-bold text-violet-700">差旅补贴</span>
              <span class="text-xs font-bold text-violet-600">¥400.00</span>
            </div>
          </div>
        </div>

        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3"
        >
          <span class="text-sm font-bold text-slate-600">合计金额</span>
          <span class="text-lg font-black text-violet-700">
            {{ fillTotal }}
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button @click="drawerVisible = false">关闭</Button>
          <Button
            type="primary"
            :disabled="billSubmitted"
            :loading="submitting"
            class="rounded-lg bg-violet-600 font-bold hover:!bg-violet-700"
            @click="submitBill"
          >
            <Icon icon="lucide:check" class="size-4" />
            {{ billSubmitted ? '已提交' : '确认提交' }}
          </Button>
        </div>
      </template>
    </Drawer>
  </section>
</template>

<style scoped>
@media (max-width: 980px) {
  .ai-chat-history {
    display: none;
  }
}

.ai-chat {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d4e3de;
  border-radius: 28px;
  box-shadow: 0 22px 52px rgb(18 57 45 / 8%);
}

.ai-chat-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 308px;
  min-width: 308px;
  padding: 14px 12px;
  background: linear-gradient(180deg, #eef6f2, #f8fbf9);
  border-right: 1px solid #e1ebe8;
}

.ai-chat-history header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 0 7px;
}

.ai-chat-history h2 {
  margin: 0;
  font-size: 16px;
  color: #102e29;
}

.ai-chat-history > button {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  color: #557067;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 14px;
}

.ai-chat-history > button.is-active {
  color: #102e29;
  background: #fff;
  box-shadow: 0 4px 14px rgb(18 57 45 / 7%);
}

.ai-chat-history > button small {
  margin-left: auto;
  font-size: 11px;
  color: #7b948b;
}

.ai-chat-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.ai-chat-main__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid #e4eee9;
}

.ai-chat-main__header > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ai-chat-main__header img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.ai-chat-main__header h2 {
  margin: 0;
  font-size: 15px;
  color: #112d27;
}

.ai-chat-main__messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.ai-chat-summary {
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px dashed #dbe6e2;
}

.ai-chat-summary span {
  font-size: 11px;
  font-weight: 700;
  color: #0b806f;
}

.ai-chat-summary h1 {
  margin: 6px 0 10px;
  font-size: 26px;
  color: #102e29;
}

.ai-chat-summary p {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #557067;
}

.ai-chat-summary div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-chat-summary button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #f4faf7;
  border: 1px solid #cce0d9;
  border-radius: 999px;
}

.ai-chat-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.ai-chat-message.is-user {
  justify-content: flex-end;
}

.ai-chat-message__bubble {
  max-width: 80%;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.65;
  border-radius: 18px;
}

.ai-chat-message.is-assistant .ai-chat-message__bubble {
  color: #17362e;
  background: #f8fbf9;
  border: 1px solid #e1ece7;
}

.ai-chat-message.is-user .ai-chat-message__bubble {
  color: #fff;
  background: #0d6853;
}

.ai-chat-composer {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
}

.ai-chat-composer :deep(.ant-input) {
  font-size: 13px;
  border: 0;
  box-shadow: none;
}

.ai-chat-composer :deep(.ant-input:focus) {
  box-shadow: none;
}
</style>
