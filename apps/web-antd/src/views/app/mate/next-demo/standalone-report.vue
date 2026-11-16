<script setup lang="ts">
import type { EvidenceItem } from './demo-state';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal, Rate } from 'ant-design-vue';

import {
  addComment,
  comments,
  evidenceItems,
  generatedReportVersions,
  liked,
  mockPendingApprovals,
  reportArchive,
  toggleLike,
} from './demo-state';
import SuggestedCollaboration from './suggested-collaboration.vue';

type ApprovalEntry = {
  avatar: string;
  comment: string;
  name: string;
  role: string;
  score: null | number;
  status: 'pending' | 'reviewed';
  time: string;
};

const route = useRoute();
const router = useRouter();
const commentDraft = ref('');
const replyTo = ref('');
const managerScore = ref(4.5);
const managerReviewDraft = ref(
  '本周成果整体清晰，上周计划承接完整。请补充两项附件技能的测试负责人、完成时间和验收标准，并说明指令功能的首个业务落地场景。',
);
const approvers = ref<ApprovalEntry[]>([
  {
    name: '杨经理',
    role: '产品负责人',
    avatar: '产品经理.jpg',
    score: 4.3,
    status: 'reviewed',
    comment: '成果结构清楚，建议补充附件技能的测试闭环及业务价值。',
    time: '今天 09:12',
  },
  {
    name: '刘经理',
    role: '研发负责人',
    avatar: '技术员.jpg',
    score: 4.5,
    status: 'reviewed',
    comment: '研发产出较完整，下一步应明确测试验收时间。',
    time: '今天 09:30',
  },
  {
    name: '王经理',
    role: '直属主管',
    avatar: '咨询人员.jpg',
    score: null,
    status: 'pending',
    comment: '',
    time: '',
  },
]);
const expandedAudioId = ref('');
const previewOpen = ref(false);
const previewItem = ref<EvidenceItem>();
const aiAnalysisOpen = ref(true);
const employeeMenuOpen = ref(false);
const entityOpen = ref(false);
const selectedEntityId = ref('');
const reportId = computed(() =>
  String(route.params.reportId || route.query.reportId || '2026-w34'),
);
const report = computed(
  () =>
    reportArchive.find((item) => item.id === reportId.value) ||
    reportArchive[0]!,
);
const version = computed(() => generatedReportVersions.value[reportId.value]);
const reportEvidence = computed(() =>
  report.value.evidenceIds
    .map((id) => evidenceItems.find((item) => item.id === id))
    .filter(Boolean),
);
const likedNames = computed(() => [
  '张三',
  '李四',
  '王五',
  '周小曼',
  ...(liked.value ? ['王安康'] : []),
]);
const reviewMode = computed(() => route.query.review === '1');
const reviewedApproverCount = computed(
  () => approvers.value.filter((item) => item.status === 'reviewed').length,
);
const currentApproval = computed(() =>
  approvers.value.find((item) => item.name === '王经理')!,
);
const employeeId = computed(() => String(route.query.employee || 'wang'));
const employees = [
  {
    value: 'wang',
    name: '王安康',
    dept: '产品研发部',
    avatar: '咨询人员.jpg',
    status: 'pending',
  },
  {
    value: 'zhao',
    name: '赵琳',
    dept: '销售部',
    avatar: '商务分析助手.jpg',
    status: 'pending',
  },
  {
    value: 'zhou',
    name: '周小曼',
    dept: '交付部',
    avatar: '项目经理.jpg',
    status: 'approved',
  },
  {
    value: 'li',
    name: '李想',
    dept: '产品部',
    avatar: '产品经理.jpg',
    status: 'pending',
  },
  {
    value: 'sun',
    name: '孙悦',
    dept: '测试部',
    avatar: '数据分析师.jpg',
    status: 'approved',
  },
];
const currentEmployee = computed(
  () =>
    employees.find((item) => item.value === employeeId.value) || employees[0]!,
);
const avatarUrl = (name: string) =>
  `${import.meta.env.BASE_URL}images/ai-employee/${name}`;
const isEmployeeReviewed = (employee: (typeof employees)[number]) =>
  employee.value === 'wang'
    ? currentApproval.value.status === 'reviewed'
    : employee.status === 'approved';
const relatedEntities = [
  {
    id: 'workopilot',
    type: '产品',
    icon: 'lucide:box',
    name: '喔壳智能体平台',
    code: 'PRODUCT-001',
    owner: '产品研发部',
    relation: '本周 7 项研发工作、3 项方案设计均归属于该产品。',
    summary:
      'AI 判断产品研发节奏正常，指令与嵌入端能力已形成阶段成果；附件技能尚未完成验证，是下周主要闭环项。',
    risk: '中风险',
    riskDetail: '测试验证滞后于功能开发，若下周未完成会影响指令能力正式发布。',
  },
  {
    id: 'huada',
    type: '项目',
    icon: 'lucide:briefcase-business',
    name: '华达智能打印项目',
    code: 'PRJ-2026-018',
    owner: '周小曼',
    relation: '周报中出现 4 次，关联现场处理录音、照片与客户 B 接口联调。',
    summary:
      'AI 根据最近三周周报判断：现场打印问题已恢复，但客户测试环境未开放导致接口联调连续延期。',
    risk: '高风险',
    riskDetail:
      '项目里程碑存在延期可能，建议项目负责人重新确认客户环境开放日期，并由销售协同推动。',
  },
  {
    id: 'customer-b',
    type: '客户',
    icon: 'lucide:building-2',
    name: '客户 B',
    code: 'CUS-0096',
    owner: '赵琳',
    relation: '与华达项目、批量导入需求及接口联调三条工作线关联。',
    summary:
      'AI 识别到销售承诺与研发排期尚未完全对齐，客户环境准备不足持续影响交付。',
    risk: '高风险',
    riskDetail: '需要销售、研发、交付三方确认批量导入范围和新的联调时间。',
  },
];
const selectedEntity = computed(() =>
  relatedEntities.find((item) => item.id === selectedEntityId.value),
);

const navItems = [
  { id: 'overview', label: '本周概览' },
  { id: 'plan', label: '上周计划' },
  { id: 'development', label: '研发工作' },
  { id: 'design', label: '方案文档' },
  { id: 'offline', label: '线下补充' },
  { id: 'status', label: '产出状态' },
  { id: 'next', label: '下周建议' },
];

const statusRows = [
  ['指令功能模块', '主要功能已完成', '90%'],
  ['外部 AI 服务接口', '接口及服务层已完成', '100%'],
  ['嵌入端身份与语言识别', '修复完成', '100%'],
  ['记忆模块设计方案初审', '已完成', '100%'],
  ['附件分类、附件审核技能', '已编写，尚未测试', '75%'],
];

function scrollToSection(id: string) {
  document
    .querySelector(`#${id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function copyLink() {
  void navigator.clipboard?.writeText(window.location.href);
  message.success('分享链接已复制');
}
function printReport() {
  window.print();
}
function backToReport() {
  void router.push(
    reviewMode.value
      ? '/app/mate/employee/review-copilot/review'
      : '/app/mate/employee/report-copilot/report',
  );
}
function switchEmployee(value: string) {
  employeeMenuOpen.value = false;
  void router.replace({ query: { ...route.query, employee: value } });
}
function openEntity(id: string) {
  selectedEntityId.value = id;
  entityOpen.value = true;
}
function startReply(author: string) {
  replyTo.value = author;
  commentDraft.value = `回复 ${author}：`;
}
function submitComment() {
  const content = commentDraft.value.trim();
  if (!content) return;
  addComment(content);
  commentDraft.value = '';
  replyTo.value = '';
  message.success('评论已发布');
}
function confirmApproval() {
  if (!managerReviewDraft.value.trim()) {
    message.warning('请填写审核评价');
    return;
  }
  currentApproval.value.score = managerScore.value;
  currentApproval.value.comment = managerReviewDraft.value.trim();
  currentApproval.value.status = 'reviewed';
  const pending = mockPendingApprovals.value.find(
    (item) => item.id === String(route.query.employee ?? ''),
  );
  if (pending) {
    pending.status = 'approved';
    pending.score = managerScore.value;
  }
  currentApproval.value.time = '刚刚';
  message.success('批复已确认，员工周报已标记为已审核');
}
function openAttachment(item: EvidenceItem) {
  if (item.type === 'audio') {
    expandedAudioId.value = expandedAudioId.value === item.id ? '' : item.id;
    return;
  }
  previewItem.value = item;
  previewOpen.value = true;
}
</script>

<template>
  <div class="html-report-page">
    <header class="report-topbar">
      <div class="topbar-brand">
        <Button class="light-button" @click="backToReport">
          <Icon icon="lucide:arrow-left" />
          {{ reviewMode ? '返回审阅中心' : '返回' }}
        </Button>
        <i></i>
        <span>
          <b>喔壳智能汇报</b>
          <small>
            {{ reviewMode ? '审核模式' : 'HTML 版本' }} · {{ report.weekLabel }}
          </small>
        </span>
        <div v-if="reviewMode" class="employee-switch">
          <button
            type="button"
            class="employee-switch-trigger"
            @click="employeeMenuOpen = !employeeMenuOpen"
          >
            <img
              :src="avatarUrl(currentEmployee.avatar)"
              :alt="currentEmployee.name"
            />
            <span>
              <b>{{ currentEmployee.name }}</b>
              <small>
                {{ isEmployeeReviewed(currentEmployee) ? '已审核' : '待审核' }}
              </small>
            </span>
            <Icon icon="lucide:chevron-down" />
          </button>
          <div v-if="employeeMenuOpen" class="employee-review-menu">
            <button
              v-for="employee in employees"
              :key="employee.value"
              type="button"
              :class="{ active: employee.value === employeeId }"
              @click="switchEmployee(employee.value)"
            >
              <img :src="avatarUrl(employee.avatar)" :alt="employee.name" />
              <span>
                <b>{{ employee.name }}</b>
                <small>{{ employee.dept }}</small>
              </span>
              <em
                :class="isEmployeeReviewed(employee) ? 'approved' : 'pending'"
              >
                {{ isEmployeeReviewed(employee) ? '已审核' : '待审核' }}
              </em>
            </button>
          </div>
        </div>
      </div>
      <div class="topbar-actions">
        <Button class="light-button" @click="copyLink">
          <Icon icon="lucide:share-2" />
          分享
        </Button>
        <Button class="primary-button" @click="printReport">
          <Icon icon="lucide:printer" />
          打印
        </Button>
      </div>
    </header>

    <div class="report-layout">
      <main class="report-canvas">
        <nav class="document-nav" aria-label="汇报内容导航">
          <span>
            <Icon icon="lucide:list-tree" />
            本页目录
          </span>
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            @click="scrollToSection(item.id)"
          >
            {{ item.label }}
          </button>
        </nav>
        <section id="overview" class="hero-section report-anchor">
          <div class="hero-copy">
            <span class="eyebrow">WEEKLY ENGINEERING REPORT · 2026</span>
            <h1>
              喔壳智能体平台
              <br />
              <em>研发周报</em>
            </h1>
            <p>
              本周围绕指令功能、AI 服务和嵌入端能力建设，同时完成客户端
              Demo、汇报材料、方案设计及技能编写等线下工作。
            </p>
            <div class="author-line">
              <span>
                汇报人
                <b>{{ currentEmployee.name }}</b>
              </span>
              <span>{{ currentEmployee.dept }}</span>
              <span>{{ report.range }}</span>
            </div>
          </div>
          <div class="hero-visual">
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div class="hero-number">
              <strong>12</strong>
              <span>本周重点产出</span>
            </div>
            <div class="floating-chip chip-a">
              <Icon icon="lucide:terminal-square" />
              指令模块
            </div>
            <div class="floating-chip chip-b">
              <Icon icon="lucide:brain-circuit" />
              AI 服务
            </div>
            <div class="floating-chip chip-c">
              <Icon icon="lucide:panels-top-left" />
              客户端 Demo
            </div>
          </div>
        </section>

        <section class="metric-strip">
          <div>
            <Icon icon="lucide:git-commit-horizontal" />
            <span>研发模块</span>
            <strong>3</strong>
          </div>
          <div>
            <Icon icon="lucide:file-check-2" />
            <span>方案与文档</span>
            <strong>3</strong>
          </div>
          <div>
            <Icon icon="lucide:presentation" />
            <span>汇报 PPT</span>
            <strong>4</strong>
          </div>
          <div>
            <Icon icon="lucide:gauge" />
            <span>整体完成度</span>
            <strong>91%</strong>
          </div>
        </section>

        <section id="plan" class="content-section report-anchor">
          <header class="section-head">
            <span>01 / LAST WEEK</span>
            <h2>上周计划及完成度</h2>
            <p>三项计划均已完成主体工作，附件技能进入验证阶段。</p>
          </header>
          <div class="progress-grid">
            <article>
              <div>
                <Icon icon="lucide:files" />
                <span>技能</span>
              </div>
              <h3>附件分类技能</h3>
              <strong>100%</strong>
              <div class="progress-bar"><i style="width: 100%"></i></div>
              <p>编写完成 · 待测试验证</p>
            </article>
            <article>
              <div>
                <Icon icon="lucide:shield-check" />
                <span>技能</span>
              </div>
              <h3>附件审核技能</h3>
              <strong>100%</strong>
              <div class="progress-bar"><i style="width: 100%"></i></div>
              <p>编写完成 · 待测试验证</p>
            </article>
            <article class="accent">
              <div>
                <Icon icon="lucide:clock-3" />
                <span>设计</span>
              </div>
              <h3>定时任务设计</h3>
              <strong>100%</strong>
              <div class="progress-bar"><i style="width: 100%"></i></div>
              <p>方案、接口草案及脚本完成</p>
            </article>
          </div>
        </section>

        <section id="development" class="dark-section report-anchor">
          <header class="section-head inverse">
            <span>02 / DEVELOPMENT</span>
            <h2>研发工作</h2>
            <p>围绕平台指令能力与 AI 服务基础设施，完成两条主线建设。</p>
          </header>
          <div class="development-columns">
            <article>
              <span class="module-index">01</span>
              <Icon icon="lucide:command" />
              <h3>指令功能模块</h3>
              <ul>
                <li>
                  <b>指令配置与调用</b>
                  <small>模型、模板、解析及执行服务</small>
                </li>
                <li>
                  <b>指令模板管理</b>
                  <small>查询、保存、删除与导入</small>
                </li>
                <li>
                  <b>指令入口优化</b>
                  <small>快捷操作与工作台展示</small>
                </li>
                <li>
                  <b>指令数据模型</b>
                  <small>数据库迁移与前后端模型</small>
                </li>
              </ul>
            </article>
            <article>
              <span class="module-index">02</span>
              <Icon icon="lucide:bot" />
              <h3>AI 服务与嵌入端</h3>
              <ul>
                <li>
                  <b>外部 AI 服务接口</b>
                  <small>服务信息与已启用路由</small>
                </li>
                <li>
                  <b>AI Chat 体验优化</b>
                  <small>指令入口与历史会话分页</small>
                </li>
                <li>
                  <b>嵌入端身份识别</b>
                  <small>身份、语言与鉴权兼容</small>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="design" class="content-section report-anchor">
          <header class="section-head">
            <span>03 / DESIGN & DOCS</span>
            <h2>方案设计与文档</h2>
          </header>
          <div class="timeline">
            <article>
              <i></i>
              <span>设计初审</span>
              <h3>记忆模块</h3>
              <p>共享记忆、知识库、权限隔离、向量检索和文件溯源。</p>
            </article>
            <article>
              <i></i>
              <span>规则明确</span>
              <h3>定时任务方案</h3>
              <p>任务确认、独立调度、执行回写、幂等与失败处理。</p>
            </article>
            <article>
              <i></i>
              <span>交付完成</span>
              <h3>配套技术文档</h3>
              <p>需求文档、接口草案及 MySQL 初始化脚本。</p>
            </article>
          </div>
        </section>

        <section id="offline" class="feature-band report-anchor">
          <div>
            <span>04 / OFFLINE WORK</span>
            <h2>线下工作补充</h2>
            <p>把研发之外的重要产出也纳入同一份工作记录。</p>
          </div>
          <div class="feature-cards">
            <article>
              <Icon icon="lucide:laptop-minimal" />
              <b>客户端 Demo</b>
              <span>完成喔壳客户端交互设计</span>
            </article>
            <article>
              <Icon icon="lucide:presentation" />
              <b>4 个主题 PPT</b>
              <span>智能审核、填报与开发汇报</span>
            </article>
            <article>
              <Icon icon="lucide:blocks" />
              <b>2 项附件技能</b>
              <span>分类与审核技能编写完成</span>
            </article>
          </div>
        </section>

        <section id="status" class="content-section report-anchor">
          <header class="section-head">
            <span>05 / DELIVERABLES</span>
            <h2>本周产出与状态</h2>
          </header>
          <div class="status-dashboard">
            <div class="donut-card">
              <div class="donut">
                <span>
                  <b>91</b>
                  %
                </span>
              </div>
              <h3>本周综合完成度</h3>
              <p>主体研发与方案设计已完成，验证类工作延续至下周。</p>
            </div>
            <div class="status-table">
              <div v-for="row in statusRows" :key="row[0]" class="status-row">
                <span>{{ row[0] }}</span>
                <small>{{ row[1] }}</small>
                <b>{{ row[2] }}</b>
              </div>
            </div>
          </div>
        </section>

        <section id="next" class="next-section report-anchor">
          <header class="section-head inverse">
            <span>06 / NEXT WEEK</span>
            <h2>下周建议</h2>
          </header>
          <div>
            <article>
              <span>01</span>
              <h3>附件技能测试</h3>
              <p>补充测试用例并修正分类、审核技能问题。</p>
            </article>
            <article>
              <span>02</span>
              <h3>功能联调回归</h3>
              <p>验证指令、嵌入端和 AI Chat 相关改动。</p>
            </article>
            <article>
              <span>03</span>
              <h3>记忆方案完善</h3>
              <p>根据初审意见明确实施边界与落地排期。</p>
            </article>
          </div>
        </section>
        <footer class="report-footer">
          <b>WORKOPILOT</b>
          <span>
            由 Markdown 与系统周报模板生成 · {{ version?.generatedAt }}
          </span>
        </footer>
      </main>

      <aside class="social-sidebar">
        <header class="sidebar-role-head">
          <span>
            <Icon
              :icon="reviewMode ? 'lucide:shield-check' : 'lucide:user-round'"
            />
          </span>
          <div>
            <b>{{ reviewMode ? '审核工作台' : '汇报互动' }}</b>
            <small>
              {{ reviewMode ? 'AI 建议、评分与证据核验' : '实体、材料与讨论' }}
            </small>
          </div>
        </header>
        <section v-if="reviewMode" class="applied-review-style">
          <header>
            <span>
              <Icon icon="lucide:brain-circuit" />
              <b>已应用“我的审批风格”</b>
            </span>
            <em>命中 3 项</em>
          </header>
          <p>
            <span>延期事项</span>
            缺少新的完成时间和支持需求
          </p>
          <p>
            <span>协作请求</span>
            被提及人员尚未确认是否收到
          </p>
          <p>
            <span>技术成果</span>
            缺少首个业务场景和量化收益
          </p>
          <button
            type="button"
            @click="
              router.push('/app/mate/employee/review-copilot/approval-style')
            "
          >
            查看审批风格
            <Icon icon="lucide:arrow-right" />
          </button>
        </section>
        <section v-if="!reviewMode" class="personal-ai-suggestions">
          <header>
            <span>
              <Icon icon="lucide:sparkles" />
              <b>AI 完善建议</b>
            </span>
            <em>提交前</em>
          </header>
          <div class="personal-completeness">
            <div>
              <span>周报完整度</span>
              <strong>90%</strong>
            </div>
            <i><span style="width: 90%"></span></i>
            <p>
              <Icon icon="lucide:badge-check" />
              整体评价：优秀
            </p>
          </div>
          <article>
            <span>建议补充</span>
            <h3>下周计划需要进一步明确</h3>
            <p>
              当前周报提出了三项下周建议，但缺少具体负责人、完成时间和可验证的完成标准。
            </p>
          </article>
          <article>
            <span>表达优化</span>
            <h3>补充业务收益会更有说服力</h3>
            <p>
              建议说明指令功能预计提升的效率、调用量或交付周期，方便主管快速理解成果价值。
            </p>
          </article>
          <div class="personal-ai-action">
            <b>提交前建议</b>
            <p>补充下周计划的时间和验收标准后，完整度预计可提升至 96%。</p>
          </div>
        </section>
        <section v-if="reviewMode" class="ai-audit-suggestions">
          <header>
            <span>
              <Icon icon="lucide:brain-circuit" />
              <b>AI 总结分析</b>
            </span>
            <em>核心</em>
          </header>
          <div class="audit-overview">
            <span>建议评分</span>
            <strong>4.3 / 5.0</strong>
            <small>信息完整度 92% · 跨周承接正常</small>
          </div>
          <article class="audit-summary">
            <span>整体评价</span>
            <h3>成果清晰，计划承接完整</h3>
            <p>
              本周研发、方案和线下产出覆盖完整，上周三项计划均有承接；但附件技能仍缺少测试证据，部分技术成果与业务收益的关联不够具体。
            </p>
          </article>
          <article class="audit-high">
            <span>需要关注</span>
            <h3>附件技能尚未完成测试验证</h3>
            <p>
              两项技能虽已完成编写，但没有测试记录、负责人和验收时间。建议在评价中提醒员工明确本周闭环计划。
            </p>
          </article>
          <article class="audit-risk">
            <span>风险</span>
            <h3>验证工作滞后可能影响后续发布</h3>
            <p>
              若附件分类与审核技能继续延后验证，可能阻塞指令能力联调和正式发布，当前风险等级为中等。
            </p>
          </article>
          <div class="audit-questions">
            <b>需要追问</b>
            <p>1. 附件技能由谁负责测试，最晚何时完成？</p>
            <p>2. 指令功能首先在哪个业务场景产生可量化收益？</p>
            <p>3. 记忆模块的实施边界和排期是什么？</p>
          </div>
          <div class="audit-reply">
            <b>建议回复</b>
            <p>
              本周成果整体清晰。建议补充两项附件技能的测试负责人、完成时间和验收标准，并说明指令功能的首个业务落地场景。
            </p>
          </div>
          <SuggestedCollaboration
            :report-id="reportId"
            :reporter-name="currentEmployee.name"
            :period-label="`${report.weekLabel}周报`"
            source="review-copilot"
          />
        </section>
        <section
          v-if="reviewMode"
          class="ai-review-analysis"
          :class="{ collapsed: !aiAnalysisOpen }"
        >
          <button type="button" @click="aiAnalysisOpen = !aiAnalysisOpen">
            <span>
              <Icon icon="lucide:brain-circuit" />
              <b>AI 深度分析</b>
              <em>建议优先阅读</em>
            </span>
            <Icon
              :icon="
                aiAnalysisOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'
              "
            />
          </button>
          <div v-if="aiAnalysisOpen" class="analysis-content">
            <div class="analysis-score">
              <span>综合评价</span>
              <strong>良好</strong>
              <small>信息完整度 92%</small>
            </div>
            <article>
              <span class="risk high">高关注</span>
              <h3>附件技能缺少验证闭环</h3>
              <p>
                上周计划中的附件分类、附件审核技能均标记为完成编写，但连续缺少测试记录。建议明确测试负责人和本周截止时间。
              </p>
            </article>
            <article>
              <span class="risk medium">需确认</span>
              <h3>研发产出与业务价值关联较弱</h3>
              <p>
                指令模块完成多项技术建设，但尚未说明对用户效率、调用量或交付周期的具体改善，建议补充可衡量结果。
              </p>
            </article>
            <article>
              <span class="risk info">跨周对比</span>
              <h3>计划承接整体正常</h3>
              <p>
                上周 3
                项承诺均在本周内容中得到回应，定时任务形成完整方案；附件技能进入下一周期验证，存在合理延续。
              </p>
            </article>
            <div class="ai-questions">
              <strong>建议主管追问</strong>
              <p>1. 两项附件技能由谁负责测试，最晚何时完成？</p>
              <p>2. 指令功能预计在哪个业务场景首先产生可量化收益？</p>
              <p>3. 记忆模块初审后的实施边界和排期是什么？</p>
            </div>
          </div>
        </section>
        <section v-if="reviewMode" class="approval-progress">
          <header>
            <div>
              <span>多人审核进度</span>
              <b>{{ reviewedApproverCount }} / {{ approvers.length }} 已审核</b>
            </div>
            <em
              :class="{ complete: reviewedApproverCount === approvers.length }"
            >
              {{
                reviewedApproverCount === approvers.length
                  ? '全部完成'
                  : '审核中'
              }}
            </em>
          </header>
          <div class="approval-progress-bar">
            <i
              :style="{
                width: `${(reviewedApproverCount / approvers.length) * 100}%`,
              }"
            ></i>
          </div>
          <article
            v-for="approver in approvers"
            :key="approver.name"
            :class="approver.status"
          >
            <img :src="avatarUrl(approver.avatar)" :alt="approver.name" />
            <div class="approver-info">
              <span>
                <b>{{ approver.name }}</b>
                <small>{{ approver.role }}</small>
              </span>
              <p v-if="approver.status === 'reviewed'">
                {{ approver.comment }}
              </p>
              <p v-else>等待审核与批复</p>
            </div>
            <div class="approver-result">
              <template v-if="approver.status === 'reviewed'">
                <strong>{{ approver.score?.toFixed(1) }}</strong>
                <small>{{ approver.time }}</small>
              </template>
              <em v-else>未审核</em>
            </div>
          </article>
        </section>
        <section
          v-if="reviewMode"
          class="current-approval"
          :class="{ confirmed: currentApproval.status === 'reviewed' }"
        >
          <header>
            <div>
              <Icon
                :icon="
                  currentApproval.status === 'reviewed'
                    ? 'lucide:badge-check'
                    : 'lucide:stamp'
                "
              />
              <span>
                <b>
                  {{
                    currentApproval.status === 'reviewed'
                      ? '我的批复'
                      : '评分与批复'
                  }}
                </b>
                <small>当前审核人：王经理</small>
              </span>
            </div>
            <em>
              {{ currentApproval.status === 'reviewed' ? '已审核' : '待确认' }}
            </em>
          </header>
          <div class="approval-score-row">
            <div>
              <span>本次评分</span>
              <strong>{{ managerScore.toFixed(1) }}</strong>
              <small>/ 5.0</small>
            </div>
            <Rate
              v-model:value="managerScore"
              :disabled="currentApproval.status === 'reviewed'"
              allow-half
            />
          </div>
          <label for="manager-review-note">审核评价</label>
          <Input.TextArea
            id="manager-review-note"
            v-model:value="managerReviewDraft"
            :disabled="currentApproval.status === 'reviewed'"
            :rows="4"
          />
          <div
            v-if="currentApproval.status === 'pending'"
            class="ai-prefill-note"
          >
            <Icon icon="lucide:sparkles" />
            <span>已根据 AI 建议生成初稿，你可以修改后确认。</span>
          </div>
          <Button
            class="confirm-approval-button"
            block
            :disabled="currentApproval.status === 'reviewed'"
            @click="confirmApproval"
          >
            <Icon
              :icon="
                currentApproval.status === 'reviewed'
                  ? 'lucide:check'
                  : 'lucide:stamp'
              "
            />
            {{
              currentApproval.status === 'reviewed' ? '已确认批复' : '确认批复'
            }}
          </Button>
        </section>
        <section class="like-stream">
          <button
            type="button"
            :class="{ 'is-active': liked }"
            @click="toggleLike"
          >
            <Icon icon="lucide:thumbs-up" />
            {{ liked ? '已点赞' : '点赞' }}
          </button>
          <div>
            <Icon icon="lucide:thumbs-up" />
            <p>
              <b v-for="(name, index) in likedNames" :key="name">
                {{ name }}
                <span v-if="index < likedNames.length - 1">、</span>
              </b>
            </p>
          </div>
        </section>
        <section class="sidebar-divider">
          <span>公开评论 · {{ comments.length }} 条</span>
          <i></i>
        </section>
        <section class="comment-feed">
          <article v-for="item in comments" :key="item.id">
            <span class="avatar">{{ item.avatar }}</span>
            <div>
              <header>
                <b>{{ item.author }}</b>
                <small>{{ item.createdAt }}</small>
              </header>
              <p>{{ item.content }}</p>
              <button type="button" @click="startReply(item.author)">
                回复
              </button>
              <div
                v-for="reply in item.replies"
                :key="reply.createdAt"
                class="nested-reply"
              >
                <b>{{ reply.author }}</b>
                回复
                <b>{{ item.author }}</b>
                ：{{ reply.content }}
              </div>
            </div>
          </article>
        </section>
        <section class="comment-compose">
          <div v-if="replyTo" class="replying">
            <span>正在回复 {{ replyTo }}</span>
            <button
              type="button"
              @click="
                replyTo = '';
                commentDraft = '';
              "
            >
              取消
            </button>
          </div>
          <Input.TextArea
            v-model:value="commentDraft"
            :rows="4"
            placeholder="评论这份周报…"
          />
          <Button class="publish-button" block @click="submitComment">
            {{ replyTo ? `回复 ${replyTo}` : '发表评论' }}
          </Button>
        </section>
        <section class="source-list">
          <header>
            <Icon icon="lucide:paperclip" />
            <b>关联材料</b>
            <span>{{ reportEvidence.length }}</span>
          </header>
          <div
            v-for="item in reportEvidence"
            :key="item?.id"
            class="source-entry"
          >
            <button type="button" @click="item && openAttachment(item)">
              <span class="source-icon">
                <Icon :icon="item?.icon || 'lucide:file'" />
              </span>
              <span class="source-copy">
                <b>{{ item?.name }}</b>
                <small>{{ item?.meta }}</small>
              </span>
              <span class="source-action">
                {{
                  item?.type === 'audio'
                    ? expandedAudioId === item.id
                      ? '收起'
                      : '播放'
                    : item?.type === 'video'
                      ? '播放'
                      : '预览'
                }}
                <Icon
                  :icon="
                    item?.type === 'audio' && expandedAudioId === item.id
                      ? 'lucide:chevron-up'
                      : 'lucide:chevron-right'
                  "
                />
              </span>
            </button>
            <div
              v-if="item?.type === 'audio' && expandedAudioId === item.id"
              class="inline-audio"
            >
              <audio :src="item.previewUrl" controls preload="metadata">
                您的浏览器不支持音频播放。
              </audio>
              <p>
                <Icon icon="lucide:sparkles" />
                AI 摘要：{{ item.summary }}
              </p>
            </div>
          </div>
        </section>
        <section class="related-entities">
          <header>
            <Icon icon="lucide:scan-search" />
            <b>AI 关联实体</b>
            <span>{{ relatedEntities.length }}</span>
          </header>
          <p>根据本周内容与系统项目、客户和产品自动匹配</p>
          <button
            v-for="entity in relatedEntities"
            :key="entity.id"
            type="button"
            @click="openEntity(entity.id)"
          >
            <span><Icon :icon="entity.icon" /></span>
            <div>
              <b>{{ entity.name }}</b>
              <small>{{ entity.type }} · {{ entity.risk }}</small>
            </div>
            <Icon icon="lucide:chevron-right" />
          </button>
        </section>
      </aside>
    </div>
    <Modal
      v-model:open="previewOpen"
      :title="previewItem?.name"
      :footer="null"
      width="820px"
      wrap-class-name="mate-light-modal attachment-preview-modal"
    >
      <div v-if="previewItem" class="attachment-preview">
        <video
          v-if="previewItem.type === 'video'"
          :src="previewItem.previewUrl"
          controls
          autoplay
          playsinline
        >
          您的浏览器不支持视频播放。
        </video>
        <div
          v-else-if="previewItem.type === 'image'"
          class="image-preview-mock"
        >
          <Icon icon="lucide:image" />
          <div>
            <span>华达客户现场</span>
            <strong>打印测试结果照片</strong>
          </div>
        </div>
        <div v-else class="document-preview-mock">
          <div class="document-paper">
            <span>WORKOPILOT · INTERFACE SPEC</span>
            <h2>报价模块接口设计文档</h2>
            <p>01 接口范围与调用说明</p>
            <i></i>
            <i></i>
            <i></i>
            <p>02 验收口径与测试清单</p>
            <i></i>
            <i></i>
          </div>
        </div>
        <section class="preview-summary">
          <span>
            <Icon icon="lucide:sparkles" />
            AI 摘要
          </span>
          <p>{{ previewItem.summary }}</p>
          <small>{{ previewItem.meta }}</small>
        </section>
      </div>
    </Modal>
    <Modal
      v-model:open="entityOpen"
      :footer="null"
      width="680px"
      wrap-class-name="mate-light-modal entity-detail-modal"
    >
      <div v-if="selectedEntity" class="entity-detail">
        <header>
          <span><Icon :icon="selectedEntity.icon" /></span>
          <div>
            <small>{{ selectedEntity.type }}实体 · AI 自动关联</small>
            <h2>{{ selectedEntity.name }}</h2>
            <p>{{ selectedEntity.code }} · 负责人 {{ selectedEntity.owner }}</p>
          </div>
          <em>{{ selectedEntity.risk }}</em>
        </header>
        <section>
          <span>关联信息</span>
          <p>{{ selectedEntity.relation }}</p>
        </section>
        <section class="entity-ai-summary">
          <span>
            <Icon icon="lucide:sparkles" />
            AI 近期总结
          </span>
          <p>{{ selectedEntity.summary }}</p>
        </section>
        <section class="entity-risk">
          <span>风险与评估</span>
          <p>{{ selectedEntity.riskDetail }}</p>
        </section>
      </div>
    </Modal>
  </div>
</template>

<style scoped src="./standalone-report.css"></style>
<style scoped src="./standalone-layout-fix.css"></style>
<style scoped src="./attachment-preview.css"></style>
<style scoped src="./review-permission.css"></style>
<style scoped src="./entity-relations.css"></style>
<style src="./sidebar-information-architecture.css"></style>
<style src="./audit-wording-fix.css"></style>
<style src="./sidebar-readable.css"></style>
<style src="./standalone-minimum-readable.css"></style>
<style src="./multi-approver-review.css"></style>
<style scoped>
.applied-review-style {
  padding: 12px;
  margin: 10px;
  background: #edf6f3;
  border: 1px solid #b7d6cd;
  border-radius: 8px;
}

.applied-review-style header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.applied-review-style header span {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #17483d;
}

.applied-review-style header svg {
  color: #087565;
}

.applied-review-style header em {
  padding: 3px 6px;
  font-size: 12px;
  font-style: normal;
  color: #087565;
  background: #d8eee7;
  border-radius: 999px;
}

.applied-review-style p {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px;
  padding: 6px 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #536d65;
  border-bottom: 1px solid #d9e8e3;
}

.applied-review-style p span {
  font-weight: 800;
  color: #284f45;
}

.applied-review-style button {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #087565;
  cursor: pointer;
  background: #fff;
  border: 1px solid #b8d4cc;
  border-radius: 6px;
}

.applied-review-style button:hover {
  background: #e3f2ed;
  border-color: #86b9aa;
}
</style>
