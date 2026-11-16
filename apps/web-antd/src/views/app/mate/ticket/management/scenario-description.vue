<script setup lang="ts">
import { computed, inject, onUnmounted, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Upload } from 'ant-design-vue';

/** wizard 提供的 footer 接口（底部按钮通过它调用本页面方法） */
const footerApi = inject<{
  value: {
    canParse?: boolean;
    parseStatus?: string;
    saveDraft?: () => void;
    startParse?: () => void;
  };
}>('wizardFooterApi');

// ================================================================
// 类型定义
// ================================================================

/** 输入模式 */
type InputMode = 'paste' | 'upload';

/** 解析阶段键 */
type ParseStageKey =
  'dispatch' | 'fields' | 'flow' | 'sla' | 'summary' | 'understanding';

/** 解析阶段定义 */
interface ParseStageDef {
  key: ParseStageKey;
  title: string;
  desc: string;
}

/** 解析状态 */
type ParseStatus =
  'done' | 'error' | 'idle' | 'parsing' | 'partial' | 'uploaded';

/** 解析范围（四类） */
type ParseScope = 'dispatch' | 'fields' | 'flow' | 'sla';

/** 文件信息 */
interface RegFile {
  uid: string;
  name: string;
  size: number;
  uploadTime: string;
}

/** 解析摘要 */
interface ParseSummary {
  fields: number;
  flowStatuses: number;
  dispatchRules: number;
  slaItems: number;
  missing: ParseScope[];
}

// ================================================================
// 状态
// ================================================================

/** 本次解析实际采用的输入来源（点击开始解析时确定） */
const parseSource = ref<InputMode>('upload');

/** 粘贴的管理要求内容 */
const pasteContent = ref<string>('');

/** 上传的文件列表（支持多文件，默认为空） */
const files = ref<RegFile[]>([]);

/** 拖拽区域高亮 */
const dragOver = ref(false);

/** 解析状态 */
const parseStatus = ref<ParseStatus>('idle');

/** 当前正在执行的阶段 */
const currentStage = ref<null | ParseStageKey>(null);

/** 解析阶段完成集合 */
const doneStages = ref<Set<ParseStageKey>>(new Set());

/** 解析摘要结果 */
const parseSummary = ref<null | ParseSummary>(null);

/** 解析失败原因 */
const parseError = ref<string>('');

/** 解析进度百分比（爬升动画） */
const percent = ref(0);

/** 进度目标值（当前阶段完成时应到达的百分比） */
let percentTarget = 0;

/** 定时器 */
let parseTimer: number | undefined;
let percentTimer: number | undefined;

// ================================================================
// 计算属性
// ================================================================

const hasFiles = computed(() => files.value.length > 0);

const hasPasteContent = computed(() => pasteContent.value.trim().length >= 30);

const canParse = computed(
  () =>
    (hasFiles.value || hasPasteContent.value) &&
    parseStatus.value !== 'parsing' &&
    parseStatus.value !== 'done' &&
    parseStatus.value !== 'partial',
);

/** 任一输入变化时同步解析状态 */
watch([hasFiles, hasPasteContent], ([f, p]) => {
  if (parseStatus.value === 'parsing') return;
  parseStatus.value = f || p ? 'uploaded' : 'idle';
});

/** 是否显示两种输入方式卡片（开始解析后隐藏，失败时恢复以便修改） */
const showInputMethods = computed(
  () =>
    parseStatus.value === 'idle' ||
    parseStatus.value === 'uploaded' ||
    parseStatus.value === 'error',
);

const isDoneOrPartial = computed(
  () => parseStatus.value === 'done' || parseStatus.value === 'partial',
);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 解析阶段定义（6 阶段） */
const PARSE_STAGES: ParseStageDef[] = [
  {
    key: 'understanding',
    title: '正在分析业务要求',
    desc: '识别业务要求中的适用范围、管理职责和关键规则，为后续配置提供依据。',
  },
  {
    key: 'fields',
    title: '正在识别工单信息',
    desc: '提取工单需要填写的字段、必填要求和填写角色，后续在「工单信息」中确认。',
  },
  {
    key: 'flow',
    title: '正在识别处理流程',
    desc: '提取工单状态、处理角色和状态流转要求，后续在「状态流转」中确认。',
  },
  {
    key: 'dispatch',
    title: '正在识别派单规则',
    desc: '提取派单条件、处理对象和分配要求，后续在「派单规则」中确认。',
  },
  {
    key: 'sla',
    title: '正在识别时限要求',
    desc: '提取响应和处理时限、提醒方式及超时升级要求，后续在「时限提醒」中确认。',
  },
  {
    key: 'summary',
    title: '正在形成配置建议',
    desc: '整理各步骤的建议和待补充项，发布确认后新版本将立即生效。',
  },
];

/** 当前阶段定义 */
const currentStageDef = computed(() =>
  PARSE_STAGES.find((s) => s.key === currentStage.value),
);

/** 进度条宽度 */
const percentWidth = computed(() => `${Math.min(100, percent.value)}%`);

/** 进度显示数值 */
const percentDisplay = computed(() => Math.min(100, Math.floor(percent.value)));

// ================================================================
// 上传 / 移除
// ================================================================

function beforeUpload(f: File) {
  files.value.push({
    uid: String(Date.now()),
    name: f.name,
    size: f.size,
    uploadTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });
  parseStatus.value = 'uploaded';
  parseSummary.value = null;
  parseError.value = '';
  message.success(`已添加文件：${f.name}`);
  return false;
}

function removeFile(uid: string) {
  files.value = files.value.filter((f) => f.uid !== uid);
  if (parseStatus.value !== 'parsing') {
    parseSummary.value = null;
    parseStatus.value =
      files.value.length > 0 || hasPasteContent.value ? 'uploaded' : 'idle';
  }
}

// ================================================================
// 开始解析
// ================================================================

function startParse() {
  if (files.value.length === 0 && !hasPasteContent.value) {
    message.warning('请先上传制度/规范文件或粘贴管理要求');
    return;
  }

  // 两种方式都有内容时，优先解析上传的文件
  parseSource.value = files.value.length > 0 ? 'upload' : 'paste';

  parseStatus.value = 'parsing';
  doneStages.value = new Set();
  parseError.value = '';

  // 进度条爬升动画
  percent.value = 2;
  percentTarget = Math.round((1 / PARSE_STAGES.length) * 100);
  if (percentTimer) window.clearInterval(percentTimer);
  percentTimer = window.setInterval(() => {
    if (percent.value < percentTarget) {
      percent.value = Math.min(
        percentTarget,
        percent.value + 0.6 + Math.random() * 0.8,
      );
    }
  }, 120);

  // 6 阶段顺序执行
  const total = PARSE_STAGES.length;
  let idx = 0;

  function next() {
    const stage = PARSE_STAGES[idx]!;
    currentStage.value = stage.key;
    if (idx > 0) {
      doneStages.value = new Set([
        PARSE_STAGES[idx - 1]!.key,
        ...doneStages.value,
      ]);
    }
    idx++;
    percentTarget = Math.round((idx / total) * 100);

    if (idx < total) {
      parseTimer = window.setTimeout(next, 1500 + Math.random() * 600);
    } else {
      doneStages.value = new Set(PARSE_STAGES.map((s) => s.key));
      currentStage.value = null;
      percent.value = 100;
      if (percentTimer) window.clearInterval(percentTimer);
      finishParse();
    }
  }

  parseTimer = window.setTimeout(next, 900 + Math.random() * 400);
}

function finishParse() {
  // 简化：解析后总是识别到全部 4 类内容
  parseSummary.value = {
    fields: 8,
    flowStatuses: 5,
    dispatchRules: 4,
    slaItems: 3,
    missing: [],
  };

  parseStatus.value = 'done';
  message.success(
    parseSource.value === 'upload' ? '制度文件解析完成' : '管理要求解析完成',
  );
}

onUnmounted(() => {
  if (parseTimer) window.clearTimeout(parseTimer);
  if (percentTimer) window.clearInterval(percentTimer);
});

// 同步状态与方法到 wizard footer（底部操作栏调用）
watch(
  [canParse, parseStatus],
  () => {
    if (!footerApi) return;
    footerApi.value.canParse = canParse.value;
    footerApi.value.parseStatus = parseStatus.value;
    footerApi.value.startParse = startParse;
    footerApi.value.saveDraft = () => message.success('草稿已保存');
  },
  { immediate: true },
);
</script>

<template>
  <div class="step-wrap">
    <!-- ====== 页面标题 ====== -->
    <header class="page-title">
      <h2 class="page-title__text">提供业务要求</h2>
      <p class="page-title__desc">
        上传制度/规范文件或粘贴管理要求，完成任意一种即可继续。
      </p>
    </header>

    <!-- ====== 两种输入方式（并排卡片） ====== -->
    <div v-if="showInputMethods" class="method-grid">
      <!-- 方式一：上传制度要求资料 -->
      <section
        class="method-card method-card--upload"
        :class="{
          'method-card--over': dragOver,
          'method-card--filled': hasFiles,
        }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="
          dragOver = false;
          const f = $event.dataTransfer?.files?.[0];
          if (f) beforeUpload(f);
        "
      >
        <span class="method-card__icon">
          <Icon icon="lucide:file-up" class="size-4" />
        </span>
        <span class="method-card__label">方式一</span>
        <h3 class="method-card__title">上传制度/规范文件</h3>
        <p class="method-card__desc">
          支持制度、管理办法、SOP、Word 或 PDF 等资料。
        </p>

        <Upload
          multiple
          :show-upload-list="false"
          :before-upload="beforeUpload"
          accept=".pdf,.doc,.docx"
        >
          <Button class="method-card__btn">
            <Icon icon="lucide:plus" class="size-3.5" />
            选择资料
          </Button>
        </Upload>

        <!-- 空态提示 -->
        <div v-if="!hasFiles" class="upload-empty">
          <Icon icon="lucide:inbox" class="upload-empty__icon" />
          <span>
            暂无资料，点击上方「选择资料」从本地上传，或将文件拖拽到卡片内
          </span>
        </div>

        <!-- 已添加文件列表（按钮下方） -->
        <div v-if="hasFiles" class="file-list">
          <div v-for="f in files" :key="f.uid" class="file-row">
            <div class="file-row__main">
              <span class="file-row__icon">
                <Icon
                  :icon="
                    f.name.toLowerCase().endsWith('.pdf')
                      ? 'lucide:file-text'
                      : 'lucide:file-edit'
                  "
                  class="size-4"
                />
              </span>
              <div class="file-row__meta">
                <div class="file-row__name">{{ f.name }}</div>
                <div class="file-row__sub">
                  <span>{{ formatSize(f.size) }}</span>
                  <span class="file-row__dot">·</span>
                  <span>{{ f.uploadTime }}</span>
                </div>
              </div>
            </div>
            <Button size="small" type="text" danger @click="removeFile(f.uid)">
              <Icon icon="lucide:trash-2" class="size-3.5" />
              移除
            </Button>
          </div>
        </div>
      </section>

      <!-- 方式二：粘贴管理要求 -->
      <section class="method-card method-card--paste">
        <span class="method-card__icon">
          <Icon icon="lucide:clipboard-paste" class="size-4" />
        </span>
        <span class="method-card__label">方式二</span>
        <h3 class="method-card__title">粘贴管理要求</h3>
        <p class="method-card__desc">
          适合制度还没成文，先把管理经验按执行要求表达出来。
        </p>

        <Input.TextArea
          v-model:value="pasteContent"
          :rows="7"
          placeholder="例如：设备故障报修工单按区域与技能派单，运维人员需在 30 分钟内响应，一般故障 4 小时内解决、重大故障 2 小时内升级；处理完成后需填回故障原因与更换备件，超时未处理自动升级至运维主管......"
          :show-count="true"
          :maxlength="8000"
          class="paste-textarea method-card__textarea"
        />

        <div
          class="method-card__valid"
          :class="{ 'method-card__valid--ok': hasPasteContent }"
        >
          <Icon
            :icon="hasPasteContent ? 'lucide:check-circle-2' : 'lucide:info'"
            class="size-3.5"
          />
          {{
            hasPasteContent
              ? '内容足够，可以开始解析'
              : '至少 30 字；与方式一完成任意一种即可'
          }}
        </div>
      </section>
    </div>

    <!-- ====== 解析中状态（进度卡 + 进度条 + 阶段卡片） ====== -->
    <div v-if="parseStatus === 'parsing'" class="parse-live">
      <div class="parse-live__hero">
        <span class="parse-live__icon">
          <Icon icon="lucide:loader-2" class="size-5 animate-spin" />
        </span>
        <div class="parse-live__hero-text">
          <span class="parse-live__eyebrow">AI 制度解析</span>
          <h3>{{ currentStageDef?.title }}</h3>
          <p>{{ currentStageDef?.desc }}</p>
        </div>
        <span class="parse-live__percent">
          {{ percentDisplay }}
          <small>%</small>
        </span>
      </div>

      <div class="parse-live__bar">
        <div
          class="parse-live__bar-fill"
          :style="{ width: percentWidth }"
        ></div>
      </div>

      <div class="parse-live__cards">
        <div
          v-for="stage in PARSE_STAGES"
          :key="stage.key"
          class="stage-card"
          :class="{
            'stage-card--active': currentStage === stage.key,
            'stage-card--done': doneStages.has(stage.key),
          }"
        >
          <span class="stage-card__icon">
            <Icon
              v-if="doneStages.has(stage.key)"
              icon="lucide:check"
              class="size-3"
            />
            <Icon
              v-else-if="currentStage === stage.key"
              icon="lucide:loader-2"
              class="size-3 animate-spin"
            />
          </span>
          <div class="stage-card__text">
            <strong>{{ stage.title }}</strong>
            <small>{{ stage.desc }}</small>
          </div>
        </div>
      </div>

      <div class="parse-live__hint">
        <Icon icon="lucide:sparkles" class="size-3.5" />
        <span>
          完成后将自动进入下一步，各类解析建议会在后续步骤中逐项确认。
        </span>
      </div>
    </div>

    <!-- ====== 解析成功 / 部分成功 ====== -->
    <section
      v-else-if="isDoneOrPartial && parseSummary"
      class="card card--result"
    >
      <div
        class="result-banner"
        :class="{ 'result-banner--partial': parseStatus === 'partial' }"
      >
        <Icon
          :icon="
            parseStatus === 'partial'
              ? 'lucide:alert-triangle'
              : 'lucide:circle-check-big'
          "
          class="size-6"
        />
        <div class="result-banner__text">
          <h3>{{ parseStatus === 'partial' ? '部分识别完成' : '解析完成' }}</h3>
          <p>
            {{
              parseStatus === 'partial'
                ? '以下类别未能从内容中识别，后续步骤可手动配置。'
                : 'AI 识别到以下配置建议，将带入后续步骤由你逐项确认。'
            }}
          </p>
        </div>
      </div>

      <div class="result-stats">
        <div class="result-stat">
          <span class="result-stat__num">{{ parseSummary.fields }}</span>
          <span class="result-stat__label">字段建议</span>
          <span class="result-stat__step">→ 第 2 步</span>
        </div>
        <div class="result-stat">
          <span class="result-stat__num">{{ parseSummary.flowStatuses }}</span>
          <span class="result-stat__label">流程状态</span>
          <span class="result-stat__step">→ 第 3 步</span>
        </div>
        <div class="result-stat">
          <span class="result-stat__num">{{ parseSummary.dispatchRules }}</span>
          <span class="result-stat__label">派单建议</span>
          <span class="result-stat__step">→ 第 4 步</span>
        </div>
        <div class="result-stat">
          <span class="result-stat__num">{{ parseSummary.slaItems }}</span>
          <span class="result-stat__label">时限要求</span>
          <span class="result-stat__step">→ 第 5 步</span>
        </div>
      </div>
    </section>

    <!-- ====== 解析失败 ====== -->
    <section v-else-if="parseStatus === 'error'" class="card card--result">
      <div class="result-banner result-banner--error">
        <Icon icon="lucide:file-warning" class="size-6" />
        <div class="result-banner__text">
          <h3>解析失败</h3>
          <p>
            {{
              parseError || '内容无法识别，请检查后重试或尝试另一种输入方式。'
            }}
          </p>
        </div>
      </div>
    </section>

    <!-- ====== 草稿提示条（置底，仅输入方式页面显示；解析中/完成后隐藏） ====== -->
    <div v-if="showInputMethods" class="draft-note">
      <Icon icon="lucide:sparkles" class="draft-note__icon" />
      <div class="draft-note__text">
        <strong>AI解析后会生成草稿，不会直接发布</strong>
        <p>工单信息、状态流转、派单规则、时限提醒需要在后续步骤中确认</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 1280px) {
  .parse-live__cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .parse-live__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .method-grid {
    grid-template-columns: 1fr;
  }
}

.step-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%; /* 内容少时也撑满滚动区，让提示条贴底 */
}

/* ============ 页面标题 ============ */
.page-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 2px 0;
}

.page-title__text {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c4a3f;
}

.page-title__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #5a756d;
}

/* ============ 卡片通用 ============ */
.card {
  padding: 16px 18px 14px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 16px;
}

.card__head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.card__head--compact {
  margin-bottom: 10px;
}

.card__head-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 10px;
}

.card__head-text h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.card__head-text p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #6d827b;
}

/* ============ 已添加文件列表 ============ */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.file-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.file-row__main {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.file-row__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 8px;
}

.file-row__meta {
  min-width: 0;
}

.file-row__name {
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

.file-row__sub {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 2px;
  font-size: 11px;
  color: #6d827b;
}

.file-row__dot {
  color: #c2d6cf;
}

/* ============ 解析范围 ============ */
.scope-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.scope-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
  transition:
    border-color 0.18s,
    background 0.18s;
}

.scope-item:hover {
  background: #f3f8f6;
  border-color: #bcd1c8;
}

.scope-item--checked {
  background: #eef8f4;
  border-color: #9cd0c1;
}

.scope-item__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #0b6e65;
  background: #e1f5ee;
  border-radius: 8px;
}

.scope-item__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.scope-item__label {
  font-size: 13px;
  font-weight: 700;
  color: #0c4a3f;
}

.scope-item__hint {
  font-size: 11px;
  color: #6d827b;
}

/* ============ 解析中：进度卡 + 阶段卡片 ============ */
.parse-live {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 16px;
}

.parse-live__hero {
  display: flex;
  gap: 14px;
  align-items: center;
}

.parse-live__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 50%;
}

.parse-live__hero-text {
  flex: 1;
  min-width: 0;
}

.parse-live__eyebrow {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #0b8a73;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.parse-live__hero-text h3 {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 800;
  color: #0c4a3f;
}

.parse-live__hero-text p {
  margin: 3px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: #6d827b;
}

.parse-live__percent {
  flex: none;
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #0b6e65;
  letter-spacing: -0.02em;
}

.parse-live__percent small {
  margin-left: 1px;
  font-size: 13px;
  font-weight: 700;
  color: #8fc1b4;
}

.parse-live__bar {
  height: 6px;
  overflow: hidden;
  background: #e4edea;
  border-radius: 999px;
}

.parse-live__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0b6e65, #14a08d);
  border-radius: 999px;
  transition: width 0.25s ease-out;
}

.parse-live__cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 2px;
}

.stage-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 12px;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

.stage-card--active {
  background: #fff;
  border: 1.5px solid #0b6e65;
  box-shadow: 0 4px 14px rgb(11 110 101 / 12%);
}

.stage-card--done {
  background: #f4faf7;
  border-color: #cde1d9;
}

.stage-card__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #fff;
  background: #c2d6cf;
  border-radius: 50%;
  transition: background 0.2s;
}

.stage-card--active .stage-card__icon {
  background: #0b6e65;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 14%);
}

.stage-card--done .stage-card__icon {
  background: #32c8a5;
}

.stage-card__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stage-card__text strong {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: #0c4a3f;
}

.stage-card__text small {
  font-size: 10px;
  line-height: 1.55;
  color: #6d827b;
}

.stage-card--active .stage-card__text strong {
  color: #0b6e65;
}

.stage-card--done .stage-card__text strong {
  color: #3d7a6d;
}

.parse-live__hint {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  font-size: 11px;
  color: #6d827b;
  background: #f9fcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.parse-live__hint .iconify {
  color: #14a08d;
}

/* ============ 结果卡片 ============ */
.result-banner {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 16px;
  margin-bottom: 14px;
  color: #0b6e65;
  background: #eef8f4;
  border: 1px solid #b9ddcf;
  border-radius: 12px;
}

.result-banner__text h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.result-banner__text p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #5a756d;
}

.result-banner--partial {
  color: #9a6e10;
  background: #fff9ec;
  border-color: #f0d9a0;
}

.result-banner--partial .result-banner__text h3 {
  color: #7a560e;
}

.result-banner--error {
  color: #b53b2e;
  background: #fdf0ee;
  border-color: #f4c3bd;
}

/* ============ 结果统计 ============ */
.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  text-align: center;
  background: #f9fcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.result-stat__num {
  font-size: 22px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: -0.02em;
}

.result-stat__label {
  font-size: 12px;
  font-weight: 600;
  color: #0c4a3f;
}

.result-stat__step {
  font-size: 10px;
  color: #8ba8a1;
}

/* ============ 方式卡片 ============ */
.method-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.method-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 16px;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

/* 方式一：已选择资料 —— 浅绿色背景 */
.method-card--filled {
  background: #f0f9f5;
  border-color: #cde8dc;
}

/* 方式二：光标进入管理要求文本框 —— 浅绿色背景 */
.method-card--paste:focus-within {
  background: #f0f9f5;
  border-color: #cde8dc;
}

/* 拖拽悬停（优先级最高） */
.method-card--over {
  background: #eef8f4 !important;
  border-color: #0b6e65;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 10%);
}

/* 空态提示 */
.upload-empty {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  margin-top: 12px;
  background: #fafcfb;
  border: 1.5px dashed #cfe1db;
  border-radius: 12px;
}

.upload-empty__icon {
  flex: none;
  font-size: 18px;
  color: #9cc8bc;
}

.upload-empty span {
  font-size: 11px;
  line-height: 1.6;
  color: #8ba8a1;
}

.method-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-bottom: 8px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 10px;
}

.method-card__label {
  font-size: 11px;
  color: #8ba8a1;
}

.method-card__title {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: #0c4a3f;
}

.method-card__desc {
  margin: 0 0 12px;
  font-size: 11px;
  line-height: 1.6;
  color: #6d827b;
}

.method-card__btn {
  color: #24483f;
  background: #fff;
  border-color: #cfdfd9;
  box-shadow: none !important;
}

.method-card__btn:hover,
.method-card__btn:focus-visible {
  color: #0b6e65;
  background: #f1f8f5;
  border-color: #8fc1b4;
}

.method-card__textarea {
  width: 100%;
}

.method-card__valid {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-top: 6px;
  font-size: 11px;
  color: #9a7b1f;
}

.method-card__valid--ok {
  color: #0b6e65;
}

/* ============ 草稿提示条（置底） ============ */
.draft-note {
  position: sticky;
  bottom: 84px; /* 滚动时悬浮在固定 footer 上方（footer 高约 68px） */
  z-index: 5;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px 16px;
  margin-top: auto; /* flex 布局推到容器底部 */
  background: #eef8f4;
  border: 1px solid #b9ddcf;
  border-radius: 12px;
  box-shadow: 0 -6px 16px rgb(11 110 101 / 6%); /* 悬浮于滚动内容上方 */
}

.draft-note__icon {
  flex: none;
  margin-top: 2px;
  font-size: 18px;
  color: #0b6e65;
}

.draft-note__text strong {
  font-size: 12px;
  color: #0b4a44;
}

.draft-note__text p {
  margin: 3px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: #5a756d;
}

/* ============ 粘贴文本框 ============ */
.paste-textarea {
  padding: 12px 14px !important;
  font-size: 13px !important;
  line-height: 1.7 !important;
  color: #1f3b34 !important;
  resize: vertical;
  background: #fafcfb !important;
  border: 1.5px solid #e4edea !important;
  border-radius: 12px !important;
  transition:
    border-color 0.18s,
    box-shadow 0.18s;
}

.paste-textarea:hover {
  border-color: #bcd1c8 !important;
}

.paste-textarea:focus,
.paste-textarea:focus-within {
  border-color: #0b6e65 !important;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 10%);
}
</style>
