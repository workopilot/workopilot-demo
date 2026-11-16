<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Form, Input, message } from 'ant-design-vue';

const router = useRouter();

/** 向导各步骤路径（查看相关配置跳转用） */
const STEP_PATHS = {
  fields: '/app/mate/apps/smart-ticket/wizard/field-review',
  flow: '/app/mate/apps/smart-ticket/wizard/custom-status',
  dispatch: '/app/mate/apps/smart-ticket/wizard/dispatch-rules',
  sla: '/app/mate/apps/smart-ticket/wizard/sla-config',
} as const;

// ==================== 发布检查 ====================

/** 发布前配置完整性检查项（Demo 默认全部通过） */
interface CheckItem {
  short: string;
  label: string;
  desc: string;
  done: boolean;
  stepPath?: string;
}

const checkItems = ref<CheckItem[]>([
  {
    short: '工单信息',
    label: '工单信息已配置',
    desc: '字段、必填规则与填写角色已确认',
    done: true,
    stepPath: STEP_PATHS.fields,
  },
  {
    short: '状态流转',
    label: '状态流转已配置',
    desc: '状态与状态流转已确认',
    done: true,
    stepPath: STEP_PATHS.flow,
  },
  {
    short: '派单规则',
    label: '派单规则已配置',
    desc: '派单条件、处理对象与分配方式已确认',
    done: true,
    stepPath: STEP_PATHS.dispatch,
  },
  {
    short: '时限提醒',
    label: '时限提醒已配置',
    desc: '响应/处理时限、提醒与超时升级已确认',
    done: true,
    stepPath: STEP_PATHS.sla,
  },
]);

/** 步骤摘要详情展开 */
const stepsExpanded = ref(false);

/** 信息提示项展开 */
const infoOpen = ref(false);

/** 问题影响程度：阻止发布 / 需要确认 / 信息提示 */
type IssueLevel = 'blocking' | 'confirm' | 'info';

/** 查看相关配置的跳转入口 */
interface RelatedLink {
  label: string;
  stepPath: string;
}

interface CheckIssue {
  id: string;
  level: IssueLevel;
  /** 所属依赖维度，如「字段 → 派单规则」 */
  dim: string;
  title: string;
  desc: string;
  links: RelatedLink[];
  /** 阻止发布项：是否已修复 */
  resolved?: boolean;
  /** 确认项：确认人与时间（确认后留痕） */
  confirmedBy?: string;
  confirmedAt?: string;
}

const issues = ref<CheckIssue[]>([
  {
    id: 'issue-1',
    level: 'blocking',
    dim: '字段 → 派单规则',
    title: '派单规则引用了无效选项',
    desc: '故障等级「中」在当前字段选项中不存在，规则「打印设备故障优先派单」无法执行。',
    links: [
      { label: '查看字段', stepPath: STEP_PATHS.fields },
      { label: '查看派单规则', stepPath: STEP_PATHS.dispatch },
    ],
  },
  {
    id: 'issue-2',
    level: 'confirm',
    dim: '状态 → SLA 计时',
    title: '新增状态默认全程计时',
    desc: '流程状态「现场中」为本次新增状态，SLA 在该状态下正常计时，请确认是否符合预期。',
    links: [
      { label: '查看流程', stepPath: STEP_PATHS.flow },
      { label: '查看 SLA', stepPath: STEP_PATHS.sla },
    ],
  },
  {
    id: 'issue-3',
    level: 'confirm',
    dim: '派单 → 流程',
    title: '存在无法命中派单规则的工单',
    desc: '设备类别「其他」且故障等级「低」的工单不命中任何派单规则，会进入人工待分配池，请确认是否符合预期。',
    links: [{ label: '查看派单规则', stepPath: STEP_PATHS.dispatch }],
  },
  {
    id: 'issue-4',
    level: 'info',
    dim: '变更影响',
    title: '本次版本影响',
    desc: '新增「区域分派」派单规则与状态流转「已升级/现场中」，调整「紧急工单」响应时限。',
    links: [],
  },
]);

/** 未修复的阻止发布项 */
const openBlocking = computed(() =>
  issues.value.filter((i) => i.level === 'blocking' && !i.resolved),
);

/** 未确认的需要确认项 */
const openConfirm = computed(() =>
  issues.value.filter((i) => i.level === 'confirm' && !i.confirmedBy),
);

/** 发布条件：阻止发布的问题全部修复后才可发布 */
const publishReady = computed(() => openBlocking.value.length === 0);

/** 顶部发布结论：暂不能发布 / 可以发布 */
const verdict = computed(() => {
  const doneSteps = checkItems.value.filter((c) => c.done).length;
  if (!publishReady.value) {
    const parts: string[] = [];
    if (openBlocking.value.length > 0)
      parts.push(`${openBlocking.value.length} 项阻止发布`);
    if (openConfirm.value.length > 0)
      parts.push(`${openConfirm.value.length} 项需要确认`);
    return {
      tone: 'bad',
      icon: 'lucide:circle-x',
      title: '暂不能发布',
      desc: `${doneSteps} 个配置步骤已完成，关联检查发现 ${parts.join('、')}。`,
    };
  }
  return {
    tone: 'ok',
    icon: 'lucide:circle-check-big',
    title: '可以发布',
    desc:
      openConfirm.value.length > 0
        ? `配置和关联检查已通过，存在 ${openConfirm.value.length} 项待确认例外，确认记录将随版本存档。`
        : '配置和关联检查均已通过。',
  };
});

/** 需要处理区计数文案 */
const issueSummaryText = computed(() => {
  const b = openBlocking.value.length;
  const c = openConfirm.value.length;
  if (!b && !c) return '全部处理完毕';
  return [b ? `${b} 项阻止发布` : '', c ? `${c} 项需要确认` : '']
    .filter(Boolean)
    .join(' · ');
});

function levelMeta(level: IssueLevel) {
  switch (level) {
    case 'blocking': {
      return { text: '阻止发布', icon: 'lucide:circle-x' };
    }
    case 'confirm': {
      return { text: '需要确认', icon: 'lucide:alert-triangle' };
    }
    default: {
      return { text: '信息提示', icon: 'lucide:info' };
    }
  }
}

/** 是否已处理（排序与样式用；信息提示本身无需处理） */
function isHandled(issue: CheckIssue): boolean {
  if (issue.level === 'blocking') return Boolean(issue.resolved);
  if (issue.level === 'confirm') return Boolean(issue.confirmedBy);
  return false;
}

/** 未处理的排前面，同级按严重程度排序 */
const sortedIssues = computed(() => {
  const rank: Record<IssueLevel, number> = { blocking: 0, confirm: 1, info: 2 };
  const weight = (i: CheckIssue) => (isHandled(i) ? 10 : 0) + rank[i.level];
  return [...issues.value].toSorted((a, b) => weight(a) - weight(b));
});

function goLink(link: RelatedLink | undefined) {
  if (!link) return;
  router.push(link.stepPath);
}

/** Demo：模拟修复后重新检查通过 */
function markResolved(issue: CheckIssue) {
  issue.resolved = true;
  message.success('已标记修复并通过重新检查');
}

/** 负责人确认，留痕随版本存档 */
function confirmIssue(issue: CheckIssue) {
  issue.confirmedBy = '当前用户';
  issue.confirmedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  message.success('确认记录已保存，将随发布版本一同存档');
}

// ==================== 版本信息 ====================

const version = ref('v1.3.0');
const releaseNote = ref(
  '1. 新增「区域分派」派单规则；\n2. 新增「已升级/现场中」状态流转；\n3. 调整「紧急工单」响应时限。',
);

/** 受影响配置统计（仅类别与数量） */
const impactStats = [
  { label: '派单规则', count: 2 },
  { label: '状态流转', count: 1 },
  { label: 'SLA 规则', count: 1 },
];

// ==================== 底部操作 ====================

function saveDraft() {
  message.success('草稿已保存，可稍后继续配置');
}

function publishNow() {
  const confirmed = issues.value.filter(
    (i) => i.level === 'confirm' && i.confirmedBy,
  ).length;
  message.success(
    `版本 ${version.value} 已发布并立即成为生效版本${
      confirmed > 0 ? `，${confirmed} 项确认记录已随版本存档` : ''
    }`,
  );
}
</script>

<template>
  <div class="step-wrap">
    <!-- ====== ① 发布检查（步骤确认 + 关联问题合并区） ====== -->
    <section class="step-card">
      <!-- 发布结论状态栏 -->
      <div class="verdict" :class="`verdict--${verdict.tone}`">
        <span class="verdict__icon">
          <Icon :icon="verdict.icon" class="size-4" />
        </span>
        <div class="verdict__text">
          <strong>{{ verdict.title }}</strong>
          <p>{{ verdict.desc }}</p>
        </div>
      </div>

      <!-- 配置步骤摘要（紧凑一行，可展开） -->
      <div class="steps-summary">
        <div class="steps-summary__chips">
          <span
            v-for="item in checkItems"
            :key="item.label"
            class="step-chip"
            :class="{ 'step-chip--warn': !item.done }"
          >
            <Icon
              :icon="item.done ? 'lucide:check' : 'lucide:alert-triangle'"
              class="size-3"
            />
            {{ item.short }}
          </span>
          <button
            type="button"
            class="steps-summary__toggle"
            @click="stepsExpanded = !stepsExpanded"
          >
            {{ stepsExpanded ? '收起' : '展开详情' }}
            <Icon
              :icon="
                stepsExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'
              "
              class="size-3"
            />
          </button>
        </div>
        <div v-if="stepsExpanded" class="check-list">
          <div
            v-for="item in checkItems"
            :key="item.label"
            class="check-item"
            :class="{ 'check-item--warn': !item.done }"
          >
            <span class="check-item__icon">
              <Icon
                :icon="item.done ? 'lucide:check' : 'lucide:alert-triangle'"
                class="size-3.5"
              />
            </span>
            <div class="check-item__text">
              <strong>{{ item.label }}</strong>
              <small>{{ item.desc }}</small>
            </div>
            <span class="check-item__ok">已确认</span>
          </div>
        </div>
      </div>

      <!-- 需要处理：关联问题列表 -->
      <div class="issues-head">
        <h4>需要处理</h4>
        <span
          class="issues-head__count"
          :class="{
            'issues-head__count--clear':
              publishReady && openConfirm.length === 0,
          }"
        >
          {{ issueSummaryText }}
        </span>
      </div>

      <div class="issue-list">
        <div
          v-for="issue in sortedIssues"
          :key="issue.id"
          class="issue-item"
          :class="[
            `issue-item--${issue.level}`,
            { 'issue-item--handled': isHandled(issue) },
          ]"
        >
          <span class="issue-item__bar"></span>
          <div
            class="issue-item__main"
            :class="{ 'issue-item__main--toggle': issue.level === 'info' }"
            @click="issue.level === 'info' && (infoOpen = !infoOpen)"
          >
            <div class="issue-item__head">
              <span class="issue-item__level">
                <Icon :icon="levelMeta(issue.level).icon" class="size-3" />
                {{ levelMeta(issue.level).text }}
              </span>
              <strong class="issue-item__title">{{ issue.title }}</strong>
              <span class="issue-item__dim">{{ issue.dim }}</span>
              <Icon
                v-if="issue.level === 'info'"
                :icon="infoOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                class="issue-item__chevron size-3"
              />
            </div>
            <template v-if="issue.level !== 'info' || infoOpen">
              <p class="issue-item__desc">{{ issue.desc }}</p>
              <div v-if="issue.links.length > 0" class="issue-item__links">
                <button
                  v-for="link in issue.links"
                  :key="link.label"
                  type="button"
                  class="issue-link"
                  @click.stop="goLink(link)"
                >
                  <Icon icon="lucide:arrow-right" class="size-3" />
                  {{ link.label }}
                </button>
              </div>
            </template>
          </div>
          <div v-if="issue.level !== 'info'" class="issue-item__ops">
            <!-- 阻止发布：修复后才可发布 -->
            <template v-if="issue.level === 'blocking'">
              <template v-if="!issue.resolved">
                <Button
                  size="small"
                  type="primary"
                  @click="goLink(issue.links[0])"
                >
                  去修复
                </Button>
                <Button
                  size="small"
                  type="text"
                  class="ops-demo"
                  @click="markResolved(issue)"
                >
                  标记已修复
                </Button>
              </template>
              <span v-else class="issue-item__done">
                <Icon icon="lucide:check" class="size-3" />
                已修复
              </span>
            </template>

            <!-- 需要确认：负责人确认并留痕 -->
            <template v-else>
              <span v-if="issue.confirmedBy" class="issue-item__done">
                <Icon icon="lucide:check" class="size-3" />
                已确认 · {{ issue.confirmedBy }} {{ issue.confirmedAt }}
              </span>
              <Button v-else size="small" @click="confirmIssue(issue)">
                确认
              </Button>
            </template>
          </div>
        </div>
      </div>

      <p class="issue-footnote">
        阻止发布的问题修复后才可发布；需要确认的问题由负责人确认并留下记录，处理结果将随当前发布版本存档，方便追溯。
      </p>
    </section>

    <!-- ====== ② 版本信息（生效范围仅在此处说明） ====== -->
    <section class="step-card">
      <header>
        <div>
          <Icon icon="lucide:git-branch" />
          <span>
            <h3>版本信息</h3>
            <p>发布后本版本立即成为生效版本</p>
          </span>
        </div>
      </header>

      <Form layout="vertical" class="mb-0">
        <Form.Item label="版本号">
          <Input v-model:value="version">
            <template #prefix>
              <Icon icon="lucide:tag" class="size-3.5 text-[#729088]" />
            </template>
          </Input>
        </Form.Item>
        <Form.Item label="版本说明" class="!mb-3">
          <Input.TextArea v-model:value="releaseNote" :rows="4" />
        </Form.Item>
      </Form>

      <div class="version-meta">
        <div class="impact-stats">
          <div v-for="s in impactStats" :key="s.label" class="impact-stat">
            <strong>{{ s.count }}</strong>
            <span>{{ s.label }}</span>
          </div>
        </div>
        <p class="version-scope">
          <Icon icon="lucide:zap" class="size-3.5" />
          生效范围：新工单使用 {{ version }}，存量工单沿用原版本
          v1.2.0，运行中的工单不受影响
        </p>
      </div>
    </section>

    <!-- ====== ③ 底部固定操作条 ====== -->
    <div class="publish-bar">
      <p
        class="publish-bar__note"
        :class="
          publishReady ? 'publish-bar__note--ok' : 'publish-bar__note--bad'
        "
      >
        <Icon
          :icon="publishReady ? 'lucide:circle-check-big' : 'lucide:circle-x'"
          class="size-3.5"
        />
        {{
          publishReady
            ? '配置检查通过，可以发布'
            : `存在 ${openBlocking.length} 项阻止发布的问题，修复后才能发布`
        }}
      </p>
      <div class="publish-bar__actions">
        <Button @click="saveDraft">保存为草稿</Button>
        <Button type="primary" :disabled="!publishReady" @click="publishNow">
          <Icon icon="lucide:rocket" class="mr-1 size-3.5" />
          发布并立即生效
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 720px) {
  .publish-bar__actions {
    justify-content: flex-end;
    width: 100%;
  }
}

.step-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-card {
  padding: 16px 18px 14px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 18px;
}

.step-card > header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-card > header > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.step-card > header > div > svg,
.step-card > header > div > span :deep(.iconify) {
  display: block;
  width: 20px;
  height: 20px;
  padding: 10px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 12px;
}

.step-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.step-card > header p {
  margin: 3px 0 0;
  font-size: 11px;
  color: #6d827b;
}

/* ====== 发布结论状态栏 ====== */
.verdict {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px 16px;
  margin-bottom: 14px;
  border-radius: 12px;
}

.verdict--bad {
  background: #fdf0ee;
  border: 1px solid #f4c3bd;
}

.verdict--ok {
  background: #eef8f4;
  border: 1px solid #b9ddcf;
}

.verdict__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #fff;
  background: #d95c4f;
  border-radius: 50%;
}

.verdict--ok .verdict__icon {
  background: #32c8a5;
}

.verdict__text strong {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #b53b2e;
}

.verdict--ok .verdict__text strong {
  color: #0b4a44;
}

.verdict__text p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #5a756d;
}

/* ====== 配置步骤摘要 ====== */
.steps-summary {
  margin-bottom: 14px;
}

.steps-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: #f9fcfb;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.step-chip {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: #0b8a73;
  background: #eef8f4;
  border: 1px solid #cde8dc;
  border-radius: 999px;
}

.step-chip .iconify {
  color: #32c8a5;
}

.step-chip--warn {
  color: #9a6e10;
  background: #fff9ec;
  border-color: #f0d9a0;
}

.steps-summary__toggle {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 0;
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: none;
  border: none;
}

.steps-summary__toggle:hover {
  text-decoration: underline;
}

/* ====== 步骤详情（展开） ====== */
.check-list {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.check-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #f9fcfb;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.check-item__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: #32c8a5;
  border-radius: 50%;
}

.check-item__text {
  flex: 1;
  min-width: 0;
}

.check-item__text strong {
  font-size: 12px;
  font-weight: 600;
  color: #0c4a3f;
}

.check-item__text small {
  display: block;
  font-size: 11px;
  color: #6d827b;
}

.check-item__ok {
  font-size: 11px;
  color: #0b8a73;
}

/* ====== 需要处理 ====== */
.issues-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.issues-head h4 {
  margin: 0;
  font-size: 12.5px;
  font-weight: 700;
  color: #0c4a3f;
}

.issues-head__count {
  font-size: 11px;
  font-weight: 600;
  color: #b53b2e;
}

.issues-head__count--clear {
  color: #0b8a73;
}

.issue-list {
  display: grid;
  gap: 8px;
}

.issue-item {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 11px 14px 11px 17px;
  overflow: hidden;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.issue-item__bar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
}

.issue-item--blocking {
  background: #fffbfa;
  border-color: #f4c3bd;
}

.issue-item--blocking .issue-item__bar {
  background: #d95c4f;
}

.issue-item--confirm {
  background: #fffdf6;
  border-color: #f0d9a0;
}

.issue-item--confirm .issue-item__bar {
  background: #e0a63a;
}

.issue-item--info {
  background: #fafcff;
  border-color: #cfe3f8;
}

.issue-item--info .issue-item__bar {
  background: #4a8fd9;
}

/* 已处理：统一转为通过状态 */
.issue-item--handled {
  background: #f7fcfa;
  border-color: #cde8dc;
}

.issue-item--handled .issue-item__bar {
  background: #32c8a5;
}

.issue-item__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.issue-item__main--toggle {
  cursor: pointer;
}

.issue-item__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.issue-item__level {
  display: inline-flex;
  flex: none;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
}

.issue-item--blocking .issue-item__level {
  color: #b53b2e;
  background: #fdeae7;
}

.issue-item--confirm .issue-item__level {
  color: #9a6e10;
  background: #fdf3d7;
}

.issue-item--info .issue-item__level {
  color: #2563eb;
  background: #e8f1fc;
}

.issue-item--handled .issue-item__level {
  color: #0b8a73;
  background: #e5f5ee;
}

.issue-item__title {
  font-size: 12.5px;
  font-weight: 700;
  color: #0c4a3f;
}

.issue-item__dim {
  font-size: 10px;
  color: #8ba8a1;
}

.issue-item__chevron {
  color: #8ba8a1;
}

.issue-item__desc {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: #5a756d;
}

.issue-item__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 1px;
}

.issue-link {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: none;
  border: none;
}

.issue-link:hover {
  color: #0b8a73;
  text-decoration: underline;
}

.issue-item__ops {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.ops-demo {
  font-size: 11px;
  color: #8ba8a1;
}

.issue-item__done {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #0b8a73;
  text-align: right;
}

.issue-footnote {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.7;
  color: #8ba8a1;
}

/* ====== 版本信息 ====== */
.version-meta {
  padding-top: 2px;
}

.impact-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.impact-stat {
  padding: 8px;
  text-align: center;
  background: #f9fcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.impact-stat strong {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: #0b6e65;
}

.impact-stat span {
  font-size: 11px;
  color: #6d827b;
}

.version-scope {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: #5a756d;
}

.version-scope .iconify {
  flex: none;
  margin-top: 1px;
  color: #0b6e65;
}

/* ====== 底部固定操作条 ====== */
.publish-bar {
  position: sticky;
  bottom: 12px;
  z-index: 6;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgb(255 255 255 / 96%);
  border: 1px solid #dbe8e3;
  border-radius: 14px;
  box-shadow: 0 -6px 20px rgb(18 57 45 / 8%);
  backdrop-filter: blur(6px);
}

.publish-bar__note {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 11.5px;
  font-weight: 600;
}

.publish-bar__note--bad {
  color: #b53b2e;
}

.publish-bar__note--ok {
  color: #0b8a73;
}

.publish-bar__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
