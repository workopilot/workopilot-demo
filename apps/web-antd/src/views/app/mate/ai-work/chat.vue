<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { AiWorkCard, AiWorkChatMessage } from '#/types/ai-work';

import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message } from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';
import { useAiWorkDemoStore } from '#/store/ai-work-demo';

import AiMessageCard from './components/ai-message-card.vue';
import AssistWriteCard from './components/assist-write-card.vue';
import EvidenceChainDrawer from './components/evidence-chain-drawer.vue';
import WeeklyCollectCard from './components/weekly-collect-card.vue';

interface CustomChatMessage extends AiWorkChatMessage {
  hasCollectionCard?: boolean;
  hasAssistWriteCard?: boolean;
  files?: Array<{ name: string; size?: string; type: string }>;
}

const route = useRoute();
const router = useRouter();
const store = useAiWorkDemoStore();
const draft = ref('');
const evidenceOpen = ref(false);
const extraMessages = ref<CustomChatMessage[]>([]);
const scroller = ref<HTMLElement>();

const employeeId = computed(() =>
  String(route.params.employeeId || 'weekly-assistant'),
);
const employee = computed(
  () =>
    mockMateEmployees.find((item) => item.id === employeeId.value) ||
    mockMateEmployees[0]!,
);

const assistantCard = computed<AiWorkCard>(() => {
  if (!store.state.draftGenerated) {
    return {
      type: 'action',
      title: '生成本周周报',
      description: '我会根据 18 条工作记录形成 Draft，并检查遗漏与上周承诺。',
      meta: ['2026 年第 32 周', '18 条记录'],
      actions: [
        { id: 'generate', label: '生成周报', kind: 'primary' },
        {
          id: '/app/mate/employee/weekly-assistant/my-week',
          label: '回顾我的一周',
        },
      ],
    };
  }
  if (!store.state.missingWorkAdded) {
    return {
      type: 'action',
      title: '华达客户现场打印问题处理',
      description: '该工作未出现在当前周报，现场调整后问题已基本解决。',
      meta: ['8 月 5 日', '客户：华达', '项目：华达智能打印'],
      actions: [
        { id: 'add-missing', label: '加入周报', kind: 'primary' },
        {
          id: '/app/mate/employee/weekly-assistant/work-records',
          label: '查看记录',
        },
        { id: 'ignore', label: '忽略' },
      ],
    };
  }
  if (!store.state.delayExplained) {
    return {
      type: 'question',
      question: '上周计划完成客户 B 接口联调，本周是否已经完成？',
      options: ['已完成', '未完成', '延期', '补充说明'],
    };
  }
  return {
    type: 'deep-link',
    title: '本周周报已完善到 98%',
    description: '延期原因和新的完成日期已同步到风险与下周计划。',
    route: '/app/mate/employee/weekly-assistant/my-report',
    actionLabel: '查看本周周报',
  };
});

const roleCard = computed<AiWorkCard>(() => {
  if (employeeId.value === 'weekly-review') {
    return {
      type: 'insight',
      title: '张三 · 客户 B 接口联调',
      description:
        '上周承诺本周完成接口联调，本周仍未完成，建议优先确认新的完成时间。',
      level: 'high',
      object: '华达智能打印',
      duration: '连续延期 2 周',
      evidenceId: 'customer-b-delay',
    };
  }
  if (employeeId.value === 'weekly-analysis') {
    return {
      type: 'deep-link',
      title: '华达客户风险正在上升',
      description:
        '最近三周工作量持续增加，打印问题基本解决，但接口联调仍存在延期。',
      route: '/app/mate/employee/weekly-analysis/customer/huada',
      actionLabel: '打开华达客户 Context',
    };
  }
  return assistantCard.value;
});

const intro = computed(() => {
  if (employeeId.value === 'weekly-review') {
    return `本周团队共 12 人，已提交 10 人、未提交 2 人。当前有 ${store.attentionCount} 项建议重点关注。`;
  }
  if (employeeId.value === 'weekly-analysis') {
    return '本周产品研发部共 25 人、186 条工作记录和 25 份周报，我发现 8 项值得管理者关注的事项。';
  }
  return `你好，张三。我已经整理了你本周的 18 条工作记录，主要涉及华达智能打印、报价平台 V2 和客户 B 接口联调。当前周报状态：${store.reportStatusLabel}。`;
});

const quickActions = computed<Array<[string, string]>>(() => {
  if (employeeId.value === 'weekly-review') {
    return [
      ['开始审核', '/app/mate/employee/weekly-review/pending'],
      ['查看重点问题', '/app/mate/employee/weekly-review/focus'],
      ['谁还没有提交', 'unsubmitted'],
      ['查看延期事项', 'evidence'],
    ];
  }
  if (employeeId.value === 'weekly-analysis') {
    return [
      ['总结本周团队', '/app/mate/employee/weekly-analysis/team'],
      ['查看风险', '/app/mate/employee/weekly-analysis/risks'],
      ['分析重点项目', '/app/mate/employee/weekly-analysis/projects'],
      ['分析重点客户', '/app/mate/employee/weekly-analysis/customers'],
    ];
  }
  return [
    ['协助我写周报', 'assist-write'],
    ['帮我汇总周报', 'summarize-report'],
    ['帮我记工作', 'record-work'],
    ['帮我更新工作', 'update-work'],
    ['生成本周周报', 'generate'],
    ['回顾我的一周', '/app/mate/employee/weekly-assistant/my-week'],
  ];
});

async function performAction(id: string) {
  if (id.startsWith('/')) {
    await router.push(id);
    return;
  }

  // 1. 协助我写周报 (引导向导式交互)
  if (id === 'assist-write') {
    extraMessages.value.push(
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: '协助我写周报',
        time: '刚刚',
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '好的！我是你的周报撰写助手。我将按 [上周承诺追溯 ➔ 本周成果录入 ➔ 资料确认 ➔ 下周计划与提交] 4 个阶段协助你分步梳理：',
        time: '刚刚',
        hasAssistWriteCard: true,
      },
    );

    await nextTick();
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
    return;
  }

  // 2. 帮我汇总周报 (交互模拟 + 采集卡片)
  if (id === 'summarize-report') {
    extraMessages.value.push({
      id: `user-${Date.now()}`,
      role: 'user',
      content: '帮我汇总本周周报',
      time: '刚刚',
    });

    // 步骤 1：模拟执行操作过程
    const stepId = `assistant-step-${Date.now()}`;
    extraMessages.value.push({
      id: stepId,
      role: 'assistant',
      content:
        '⚡ AI 数字员工正协同系统数据：\n• 正在整理工作事项 (已扫描 18 条多源记录)...\n• 正在梳理周报结构与关键承诺关联...',
      time: '刚刚',
    });

    await nextTick();
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;

    // 步骤 2：AI 完成基本梳理并弹出信息采集卡片
    setTimeout(async () => {
      extraMessages.value.push({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '已梳理完基本周报内容，需要跟你确认几个问题，整体完整度 78%\n\n梳理的工作项如下：\n1. 报价平台 V2 核心接口开发与单元测试 (已完成)\n2. 长鑫5期打印接口需求分析与环境准备 (进行中)\n3. 建议的下周计划：推进报价平台 V2 联调与测试\n\n但是需要你补充下下面的资料，我已为你生成周报信息采集卡：',
        time: '刚刚',
        hasCollectionCard: true,
      });
      await nextTick();
      if (scroller.value)
        scroller.value.scrollTop = scroller.value.scrollHeight;
    }, 1000);
    return;
  }

  // 3. 一键补充资料
  if (id === 'collect-data') {
    extraMessages.value.push(
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: '一键补充周报资料',
        time: '刚刚',
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '已为你生成周报信息采集卡，请填写补充相关事项与进展：',
        time: '刚刚',
        hasCollectionCard: true,
      },
    );
    await nextTick();
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
    return;
  }

  if (id === 'record-work') {
    extraMessages.value.push(
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content:
          '今天要开发完成长鑫5期的打印接口，下面是一个接口需求文档.doc文件',
        files: [{ name: '接口需求文档.doc', type: 'document', size: '1.4 MB' }],
        time: '刚刚',
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '已帮你生成工作事项，关联上了你上传的资料，并已纳入本周周报。',
        time: '刚刚',
      },
    );
    await nextTick();
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
    return;
  }

  if (id === 'update-work') {
    extraMessages.value.push(
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content:
          '帮我更新下华达打印的工作，已经完成了，这是验收报告.pdf和系统截图.jpg',
        files: [
          { name: '验收报告.pdf', type: 'document', size: '2.4 MB' },
          { name: '系统截图.jpg', type: 'image', size: '850 KB' },
        ],
        time: '刚刚',
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '已更新工作事项，关联上了你上传的资料，并纳入了本周周报。',
        time: '刚刚',
      },
    );
    await nextTick();
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
    return;
  }

  if (id === 'generate') {
    store.generateDraft();
    message.success('已生成第 32 周周报草稿');
  } else if (id === 'add-missing' || id === 'missing') {
    store.addMissingWork();
    message.success('华达现场问题已加入本周周报');
  } else if (id.startsWith('answer:')) {
    const answer = id.slice(7);
    if (answer === '延期' || answer === '补充说明') {
      store.explainDelay();
      message.success('延期原因和下周计划已更新');
    } else {
      message.info(`已记录：${answer}`);
    }
  } else {
    switch (id) {
      case 'commitment':
      case 'evidence': {
        evidenceOpen.value = true;
        break;
      }
      case 'ignore': {
        message.info('已忽略该建议，本次 Demo 状态不变');
        break;
      }
      case 'review': {
        await router.push(
          '/app/mate/employee/weekly-review/report/zhang-san-w32',
        );
        break;
      }
      case 'unsubmitted': {
        message.info('未提交：陈晨、孙敏');
        break;
      }
    }
  }
}

// 处理采集卡片提交
function onCardSubmit(payload: any) {
  extraMessages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content: `已提交周报补充资料：\n• 华达打印流程: ${payload.q1Status}\n• 华达接口开发: ${payload.q2Status}\n• 下周交付计划: ${payload.q3Note}`,
    time: '刚刚',
  });

  store.state.completeness = 95;
  store.state.missingWorkAdded = true;
  store.state.delayExplained = true;

  extraMessages.value.push({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content:
      '已成功收到您的补充资料！上周承诺与下周交付节点已自动同步合并至周报草稿。周报完整度已从 78% 提升至 95%！',
    time: '刚刚',
  });

  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
  });
}

function onAssistWriteComplete(summary: string) {
  extraMessages.value.push({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: `🎉 ${summary}\n周报已成功提交至主管 (李经理) 审阅！全链证据与完整度分析同步完成。`,
    time: '刚刚',
  });
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
  });
}

async function send() {
  const content = draft.value.trim();
  if (!content) return;

  if (
    content.includes('协助') ||
    content.includes('引导') ||
    content.includes('写周报')
  ) {
    draft.value = '';
    await performAction('assist-write');
    return;
  }
  if (content.includes('汇总') && content.includes('周报')) {
    draft.value = '';
    await performAction('summarize-report');
    return;
  }
  if (
    content.includes('采集') ||
    content.includes('卡片') ||
    content.includes('补充')
  ) {
    draft.value = '';
    await performAction('collect-data');
    return;
  }
  if (content.includes('长鑫') || content.includes('需求文档')) {
    draft.value = '';
    await performAction('record-work');
    return;
  }
  if (content.includes('更新下华达') || content.includes('验收报告')) {
    draft.value = '';
    await performAction('update-work');
    return;
  }

  extraMessages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    time: '刚刚',
  });
  draft.value = '';
  let reply =
    '这是前端 Demo。我可以继续帮你查看本周工作、周报、审核和客户风险。';
  if (content.includes('生成') && content.includes('周报')) {
    store.generateDraft();
    reply = '本周周报 Draft 已生成，同时发现 3 项可能遗漏工作。';
  } else if (content.includes('延期') || content.includes('客户 B')) {
    store.explainDelay();
    reply = '已记录客户测试环境未准备完成，新的计划时间为下周三。';
  } else if (content.includes('华达')) {
    reply = '华达最近三周工作量持续增加，当前主要风险来自接口联调延期。';
  } else if (content.includes('风险')) {
    evidenceOpen.value = true;
    reply = '已为你打开客户 B 接口联调的 Evidence Chain。';
  }
  extraMessages.value.push({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: reply,
    time: '刚刚',
  });
  await nextTick();
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
}

watch(employeeId, () => {
  extraMessages.value = [];
});
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <section class="ai-chat">
    <aside class="ai-chat-history">
      <header>
        <h2>对话历史</h2>
        <Button shape="circle" type="text" aria-label="新建对话">
          <Icon icon="lucide:plus" />
        </Button>
      </header>
      <button class="is-active" type="button">
        <Icon icon="lucide:check" />
        <strong>2026 年第 32 周</strong>
        <small>本周</small>
      </button>
      <button type="button">
        <Icon icon="lucide:plus" />
        <strong>最近一次分析</strong>
        <small>上周</small>
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
          <Button shape="circle" type="text" aria-label="历史文件">
            <Icon icon="lucide:folder-open" />
          </Button>
          <Button shape="circle" type="text" aria-label="新建会话">
            <Icon icon="lucide:message-square-plus" />
          </Button>
        </div>
      </header>

      <div ref="scroller" class="ai-chat-main__messages">
        <section class="ai-chat-summary">
          <span>2026 年第 32 周 · 8 月 3 日—8 月 9 日</span>
          <h1>
            {{
              employeeId === 'weekly-assistant' ? '你好，张三' : employee.name
            }}
          </h1>
          <p>{{ intro }}</p>
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

        <!-- AI 引导卡片消息 (左侧头像 + 气泡) -->
        <div class="ai-chat-message is-assistant">
          <img
            :src="employee.avatar"
            :alt="employee.name"
            class="chat-msg-avatar shadow-xs size-9 flex-none rounded-full border border-[#E8E8E8] object-cover"
          />
          <div class="ai-chat-message__bubble">
            <p>{{ intro }}</p>
            <AiMessageCard :card="roleCard" @action="performAction" />
          </div>
        </div>

        <!-- 动态消息列表 -->
        <template v-for="item in extraMessages" :key="item.id">
          <!-- AI 消息 (左侧头像 + 气泡 + 采集/向导卡片) -->
          <div
            v-if="item.role === 'assistant'"
            class="ai-chat-message is-assistant"
          >
            <img
              :src="employee.avatar"
              :alt="employee.name"
              class="chat-msg-avatar shadow-xs size-9 flex-none rounded-full border border-[#E8E8E8] object-cover"
            />
            <div class="ai-chat-message__bubble">
              <p class="whitespace-pre-line">{{ item.content }}</p>
              <!-- 渲染信息采集卡片 -->
              <WeeklyCollectCard
                v-if="item.hasCollectionCard"
                @submit="onCardSubmit"
              />
              <!-- 渲染协助写周报向导卡片 -->
              <AssistWriteCard
                v-if="item.hasAssistWriteCard"
                @complete="onAssistWriteComplete"
              />
            </div>
          </div>

          <!-- 用户消息 (气泡 + 右侧头像，整体靠最右侧对齐) -->
          <div v-else class="ai-chat-message is-user">
            <div class="ai-chat-message__bubble">
              <p class="whitespace-pre-line">{{ item.content }}</p>

              <!-- 附加文件/资料展示 -->
              <div
                v-if="item.files && item.files.length > 0"
                class="mt-2 flex flex-wrap gap-2 border-t border-white/20 pt-2"
              >
                <div
                  v-for="(f, fIdx) in item.files"
                  :key="fIdx"
                  class="inline-flex items-center gap-1.5 rounded bg-white/20 px-2.5 py-1 text-xs font-medium text-white"
                >
                  <Icon
                    :icon="
                      f.type === 'image' ? 'lucide:image' : 'lucide:file-text'
                    "
                    class="size-3.5 flex-none"
                  />
                  <span>{{ f.name }}</span>
                  <span v-if="f.size > 0" class="text-[10px] opacity-75">
                    ({{ f.size }})
                  </span>
                </div>
              </div>
            </div>

            <!-- 右侧用户头像 -->
            <div
              class="chat-msg-avatar shadow-xs flex size-9 flex-none items-center justify-center rounded-full border border-[#0D6853] bg-[#0D6853] text-sm font-bold text-white"
              title="张三"
            >
              张
            </div>
          </div>
        </template>
      </div>

      <!-- 底部输入框与上方快捷按钮栏 -->
      <div class="composer-container border-t border-[#E6EEEB] bg-white">
        <div
          v-if="employeeId === 'weekly-assistant'"
          class="composer-preset-bar flex items-center gap-2 overflow-x-auto border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-2"
        >
          <span
            class="flex flex-none items-center gap-1 text-xs font-medium text-[#86909C]"
          >
            <Icon icon="lucide:sparkles" class="size-3.5 text-[#0D6853]" />
            快捷指令:
          </span>
          <button
            type="button"
            class="preset-chip-btn shadow-2xs flex flex-none cursor-pointer items-center gap-1 rounded-full border border-[#059669]/40 bg-[#F0FDF4] px-3 py-1 text-xs font-semibold text-[#047857] transition-colors hover:bg-[#DCFCE7]"
            @click="performAction('assist-write')"
          >
            <Icon icon="lucide:wand2" class="size-3.5 text-[#059669]" />
            <span>协助我写周报</span>
          </button>
          <button
            type="button"
            class="preset-chip-btn shadow-xs flex flex-none cursor-pointer items-center gap-1 rounded-full border border-[#0D6853]/30 bg-white px-3 py-1 text-xs text-[#0D6853] transition-colors hover:bg-[#E8FFEA]"
            @click="performAction('summarize-report')"
          >
            <Icon icon="lucide:sparkles" class="size-3.5 text-[#0D6853]" />
            <span>帮我汇总周报</span>
          </button>
          <button
            type="button"
            class="preset-chip-btn shadow-xs flex flex-none cursor-pointer items-center gap-1 rounded-full border border-[#0D6853]/30 bg-white px-2.5 py-1 text-xs text-[#0D6853] transition-colors hover:bg-[#E8FFEA]"
            @click="performAction('record-work')"
          >
            <Icon icon="lucide:file-plus" class="size-3.5" />
            <span>帮我记工作</span>
          </button>
          <button
            type="button"
            class="preset-chip-btn shadow-xs flex flex-none cursor-pointer items-center gap-1 rounded-full border border-[#0D6853]/30 bg-white px-2.5 py-1 text-xs text-[#0D6853] transition-colors hover:bg-[#E8FFEA]"
            @click="performAction('update-work')"
          >
            <Icon icon="lucide:refresh-cw" class="size-3.5" />
            <span>帮我更新工作</span>
          </button>
        </div>

        <footer class="ai-chat-composer border-none">
          <Input.TextArea
            v-model:value="draft"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="输入消息，试试点击“协助我写周报”、“帮我汇总周报”..."
            @press-enter.prevent="send"
          />
          <Button type="text" aria-label="添加附件">
            <Icon icon="lucide:paperclip" />
          </Button>
          <Button type="text" aria-label="语音输入">
            <Icon icon="lucide:mic" />
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
    <EvidenceChainDrawer v-model:open="evidenceOpen" />
  </section>
</template>

<style scoped>
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
