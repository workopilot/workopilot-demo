<script setup lang="ts">
import type { EvidenceItem } from './demo-state';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal } from 'ant-design-vue';

import {
  addComment,
  comments,
  evidenceItems,
  generatedReportVersions,
  liked,
  reportArchive,
  toggleLike,
} from './demo-state';

/** 报告正文超链接 → 证据项 + 时间戳 的锚点映射 */
interface EvidenceAnchor {
  id: string;
  evidenceId: string;
  label: string;
  seconds: number;
  text: string;
}

const evidenceAnchors: EvidenceAnchor[] = [
  {
    id: 'anchor-aichat-meeting',
    evidenceId: 'ev-meeting',
    label: '18:12',
    seconds: 1092,
    text: '评审会议 18:12',
  },
  {
    id: 'anchor-demo-audio',
    evidenceId: 'ev-audio',
    label: '06:20',
    seconds: 380,
    text: '沟通录音 06:20',
  },
  {
    id: 'anchor-embed-audio',
    evidenceId: 'ev-audio',
    label: '08:45',
    seconds: 525,
    text: '沟通录音 08:45',
  },
];

const anchorMap = new Map(evidenceAnchors.map((a) => [a.id, a]));

/** 本周工作事项：合并研发 / 方案 / 线下，每项可标注出处视频 */
interface WeekItem {
  icon: string;
  title: string;
  desc: string;
  group: string;
  anchorId?: string;
}

const weekItems: WeekItem[] = [
  {
    icon: 'lucide:command',
    title: '指令功能模块',
    desc: '指令配置、模板管理、入口优化与数据模型',
    group: '研发',
    anchorId: 'anchor-aichat-meeting',
  },
  {
    icon: 'lucide:bot',
    title: 'AI 服务与嵌入端',
    desc: '外部 AI 接口、AI Chat 体验与嵌入端身份识别',
    group: '研发',
    anchorId: 'anchor-embed-audio',
  },
  {
    icon: 'lucide:brain-circuit',
    title: '记忆模块设计',
    desc: '共享记忆、知识库、权限隔离与向量检索',
    group: '方案',
  },
  {
    icon: 'lucide:clock-3',
    title: '定时任务方案',
    desc: '任务确认、独立调度、执行回写与幂等处理',
    group: '方案',
  },
  {
    icon: 'lucide:file-check-2',
    title: '配套技术文档',
    desc: '需求文档、接口草案与 MySQL 初始化脚本',
    group: '方案',
  },
  {
    icon: 'lucide:laptop-minimal',
    title: '客户端 Demo',
    desc: '完成喔壳客户端交互设计',
    group: '线下',
    anchorId: 'anchor-demo-audio',
  },
  {
    icon: 'lucide:presentation',
    title: '4 个主题 PPT',
    desc: '智能审核、填报与开发汇报',
    group: '线下',
  },
  {
    icon: 'lucide:blocks',
    title: '2 项附件技能',
    desc: '分类与审核技能编写完成',
    group: '线下',
  },
];

function anchorLabel(id: string) {
  return anchorMap.get(id)?.text ?? '';
}

const route = useRoute();
const router = useRouter();
const commentDraft = ref('');
const replyTo = ref('');
const reportId = computed(() =>
  String(route.params.reportId || route.query.reportId || '2026-w34'),
);
const report = computed(
  () =>
    reportArchive.find((item) => item.id === reportId.value) ||
    reportArchive[0]!,
);
const version = computed(() => generatedReportVersions.value[reportId.value]);
const reportEvidence = computed(
  () =>
    report.value.evidenceIds
      .map((id) => evidenceItems.find((item) => item.id === id))
      .filter(Boolean) as EvidenceItem[],
);
// 视频与录音（可播放）单独分组，区别于文档/图片附件
const mediaEvidence = computed(() =>
  reportEvidence.value.filter((e) => e.type === 'audio' || e.type === 'video'),
);
const docEvidence = computed(() =>
  reportEvidence.value.filter(
    (e) => e.type === 'document' || e.type === 'image',
  ),
);
const likedNames = computed(() => [
  '张三',
  '李四',
  '王五',
  '周小曼',
  ...(liked.value ? ['韩立'] : []),
]);

// 视频弹窗 + seek 状态
const previewOpen = ref(false);
const activeEvidenceId = ref('');
const pendingSeekSeconds = ref(0);
const pendingSeekLabel = ref('');
const videoRef = ref<HTMLVideoElement | null>(null);
const audioRef = ref<HTMLAudioElement | null>(null);
const activeEvidence = computed(() =>
  evidenceItems.find((e) => e.id === activeEvidenceId.value),
);

const navItems = [
  { id: 'overview', label: '本周概览' },
  { id: 'plan', label: '上周计划' },
  { id: 'work', label: '本周工作' },
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
  void router.push('/app/mate/employee/report-copilot/report');
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

/** 正文超链接：带时间戳打开证据弹窗 */
function openAnchor(anchorId: string) {
  const anchor = anchorMap.get(anchorId);
  if (!anchor) return;
  activeEvidenceId.value = anchor.evidenceId;
  pendingSeekSeconds.value = anchor.seconds;
  pendingSeekLabel.value = anchor.label;
  previewOpen.value = true;
}

/** 右栏附件点击：从 0 开始播放 */
function openAttachment(item: EvidenceItem) {
  activeEvidenceId.value = item.id;
  pendingSeekSeconds.value = 0;
  pendingSeekLabel.value = '';
  previewOpen.value = true;
}

/** video/audio 元数据加载完成后 seek 到目标时间戳 */
function handleLoadedMetadata() {
  const el =
    activeEvidence.value?.type === 'video' ? videoRef.value : audioRef.value;
  if (!el) return;
  const target = pendingSeekSeconds.value;
  const duration = el.duration || 0;
  if (target > 0) {
    if (target > duration && duration > 0 && !Number.isNaN(duration)) {
      // 示例媒体时长不足，clamp 到末尾并提示
      el.currentTime = Math.max(0, duration - 0.5);
      message.info(
        `示例媒体时长约 ${Math.round(duration)} 秒，已跳转至最接近 ${pendingSeekLabel.value} 的位置`,
      );
    } else {
      el.currentTime = target;
    }
  }
  void el.play().catch(() => {
    /* 浏览器可能阻止自动播放，忽略 */
  });
}

// 切换证据源时重置 ref，确保新元素的 @loadedmetadata 使用最新 pendingSeekSeconds
watch(activeEvidenceId, () => {
  videoRef.value = null;
  audioRef.value = null;
});

function handleModalClose() {
  videoRef.value?.pause();
  audioRef.value?.pause();
  pendingSeekSeconds.value = 0;
  pendingSeekLabel.value = '';
}
</script>

<template>
  <div class="html-report-page">
    <header class="report-topbar">
      <div class="topbar-brand">
        <Button class="light-button" @click="backToReport">
          <Icon icon="lucide:arrow-left" />
          返回
        </Button>
        <i></i>
        <span>
          <b>喔壳智能汇报</b>
          <small>HTML 版本 · {{ report.weekLabel }}</small>
        </span>
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
                <b>韩立</b>
              </span>
              <span>产品研发部</span>
              <span>{{ report.range }}</span>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-number">
              <strong>12</strong>
              <span>本周重点产出</span>
            </div>
          </div>
        </section>

        <section id="work" class="content-section report-anchor">
          <header class="section-head">
            <span>01 / THIS WEEK</span>
            <h2>本周工作</h2>
            <p>研发、方案设计与线下工作汇总，部分事项标注出处视频。</p>
          </header>
          <div class="week-grid">
            <article
              v-for="item in weekItems"
              :key="item.title"
              class="week-card"
            >
              <div class="week-card-head">
                <Icon :icon="item.icon" />
                <span>{{ item.group }}</span>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
              <a
                v-if="item.anchorId"
                class="report-link week-source"
                role="button"
                @click.prevent="openAnchor(item.anchorId)"
              >
                <Icon icon="lucide:link" />
                出处：{{ anchorLabel(item.anchorId) }}
              </a>
            </article>
          </div>
        </section>

        <section id="next" class="next-section report-anchor">
          <header class="section-head inverse">
            <span>02 / NEXT WEEK</span>
            <h2>下周建议</h2>
          </header>
          <div>
            <article>
              <span>01</span>
              <h3>附件技能测试</h3>
              <p>补充测试用例并修正分类、审核技能问题，并确认联调时间。</p>
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
          <span><Icon icon="lucide:user-round" /></span>
          <div>
            <b>汇报互动</b>
            <small>材料与讨论</small>
          </div>
        </header>
        <section class="source-list">
          <header>
            <Icon icon="lucide:play-circle" />
            <b>视频与录音</b>
            <span>{{ mediaEvidence.length }}</span>
          </header>
          <div
            v-for="item in mediaEvidence"
            :key="item.id"
            class="source-entry is-media"
          >
            <button type="button" @click="openAttachment(item)">
              <span class="source-icon"><Icon :icon="item.icon" /></span>
              <span class="source-copy">
                <b>{{ item.name }}</b>
                <small>{{ item.meta }}</small>
              </span>
              <span class="source-action">
                播放
                <Icon icon="lucide:chevron-right" />
              </span>
            </button>
          </div>
        </section>
        <section class="source-list">
          <header>
            <Icon icon="lucide:paperclip" />
            <b>关联附件</b>
            <span>{{ docEvidence.length }}</span>
          </header>
          <div v-for="item in docEvidence" :key="item.id" class="source-entry">
            <button type="button" @click="openAttachment(item)">
              <span class="source-icon"><Icon :icon="item.icon" /></span>
              <span class="source-copy">
                <b>{{ item.name }}</b>
                <small>{{ item.meta }}</small>
              </span>
              <span class="source-action">
                预览
                <Icon icon="lucide:chevron-right" />
              </span>
            </button>
          </div>
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
      </aside>
    </div>

    <Modal
      v-model:open="previewOpen"
      :title="activeEvidence?.name"
      :footer="null"
      width="820px"
      wrap-class-name="mate-light-modal attachment-preview-modal"
      @cancel="handleModalClose"
    >
      <div v-if="activeEvidence" class="attachment-preview">
        <div v-if="pendingSeekLabel" class="seek-badge">
          <Icon icon="lucide:clock" />
          <span>定位至 {{ pendingSeekLabel }}</span>
        </div>
        <video
          v-if="activeEvidence.type === 'video'"
          ref="videoRef"
          :src="activeEvidence.previewUrl"
          controls
          autoplay
          playsinline
          @loadedmetadata="handleLoadedMetadata"
        >
          您的浏览器不支持视频播放。
        </video>
        <div
          v-else-if="activeEvidence.type === 'audio'"
          class="inline-audio-modal"
        >
          <audio
            ref="audioRef"
            :src="activeEvidence.previewUrl"
            controls
            autoplay
            @loadedmetadata="handleLoadedMetadata"
          >
            您的浏览器不支持音频播放。
          </audio>
        </div>
        <div
          v-else-if="activeEvidence.type === 'image'"
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
          <p>{{ activeEvidence.summary }}</p>
          <small>{{ activeEvidence.meta }}</small>
        </section>
      </div>
    </Modal>
  </div>
</template>

<style scoped src="./standalone-report.css"></style>
<style scoped src="./standalone-layout-fix.css"></style>
<style scoped src="./attachment-preview.css"></style>
<style scoped src="./sidebar-readable.css"></style>
<style scoped src="./standalone-minimum-readable.css"></style>
<style scoped>
@media (max-width: 860px) {
  .week-grid {
    grid-template-columns: 1fr;
  }
}

.report-link {
  padding: 0;
  font: inherit;
  color: #087565;
  text-decoration: underline;
  text-decoration-color: rgb(8 117 101 / 40%);
  text-underline-offset: 2px;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition:
    color 0.2s,
    text-decoration-color 0.2s;
}

.report-link:hover {
  color: #065a4d;
  text-decoration-color: #087565;
}

.report-link:focus-visible {
  outline: 2px solid #087565;
  outline-offset: 2px;
  border-radius: 3px;
}

.seek-badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 6px 11px;
  margin-bottom: 11px;
  font-size: 12px;
  font-weight: 600;
  color: #087565;
  background: #eaf6f2;
  border: 1px solid #b8dcd2;
  border-radius: 7px;
}

.seek-badge svg {
  width: 14px;
  height: 14px;
}

.inline-audio-modal audio {
  width: 100%;
  height: 40px;
}

/* 本周工作事项卡片网格 */
.week-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 28px;
}

.week-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid #e4e7e2;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgb(17 44 38 / 4%);
}

.week-card-head {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 2px;
}

.week-card-head svg {
  width: 20px;
  height: 20px;
  color: #087565;
}

.week-card-head span {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #087565;
  background: #eaf6f2;
  border-radius: 999px;
}

.week-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f3a33;
}

.week-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #6b7d75;
}

/* 事项出处视频链接 */
.week-source {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding-top: 6px;
  margin-top: auto;
  font-size: 12px;
}

.week-source svg {
  width: 13px;
  height: 13px;
}

/* 右栏：视频/录音条目高亮 */
.source-entry.is-media {
  background: #eef9f4;
  border: 1px solid #cfe8da;
}
</style>
