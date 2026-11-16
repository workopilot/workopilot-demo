<script setup lang="ts">
import type { ArchiveFile, FileInfo } from '#/types/file-management';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Divider, Empty, Modal, Tabs, Tag } from 'ant-design-vue';

interface Props {
  open: boolean;
  file: FileInfo | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

// 当前选中的文件
const selectedFile = ref<ArchiveFile | null>(null);
// 当前激活的文件标签页
const activeFileTab = ref<string>('audio');
// 音频试听 mock 状态
const isPlaying = ref(false);

// 监听文件变化，默认选中第一个文件
watch(
  () => props.file,
  (newFile) => {
    if (newFile?.relatedFiles && newFile.relatedFiles.length > 0) {
      activeFileTab.value = 'audio'; // 默认显示音频标签
      isPlaying.value = false;
      // 延迟一帧确保标签已初始化
      setTimeout(() => {
        selectedFile.value = newFile.relatedFiles![0];
      }, 0);
    }
  },
  { immediate: true },
);

// 监听所选文件改变，停止正在播放的音频模拟
watch(selectedFile, () => {
  isPlaying.value = false;
});

// 是否是会议纪要类型
const isMeetingMinutes = computed(() => {
  return props.file?.category.code === 'MEETING_MINUTES';
});

// 当前选中文件的索引（预留给未来使用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _selectedIndex = computed(() => {
  const files = currentTabFiles.value;
  if (!files || !selectedFile.value) return -1;
  return files.findIndex((f) => f.id === selectedFile.value?.id);
});

// ==================== 汉化字段对照表 ====================
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _FIELD_LABELS: Record<string, string> = {
  reportYear: '报告年份',
  reportType: '报告类别',
  auditor: '审计服务机构',
  auditDate: '审计签署日期',
  contractNo: '电子合同编号',
  contractType: '合同法律类型',
  supplier: '乙方/供应商名录',
  contractAmount: '合同签署金额 (CNY)',
  signDate: '签约日期',
  expireDate: '合同到期日期',
  configVersion: '配置文件版本',
  environment: '部署运行环境',
  lastModified: '最后编辑修改时间',
  itemCount: '实体节点配置数',
  meetingDate: '会议召开日期',
  meetingTime: '标准会议时段',
  attendees: '参会与出席人员名单',
  meetingRoom: '物理/虚拟会议室',
  topics: '会议研讨核心议题',
  meetingTitle: '会议官方主题',
  meetingDuration: '标准持续时长',
  keyTopics: '核心议题决策项',
  invoiceType: '增值税专用发票类型',
  invoiceDate: '开票报销日期',
  totalAmount: '发票价税合计金额',
  taxAmount: '合计应缴税额',
  seller: '销货方全称',
  buyer: '购货方全称',
  approvalType: '审批流类型',
  applicantName: '经办申请人',
  position: '应聘入职目标岗位',
  department: '申请所属责任部门',
  applyDate: '提报申请日期',
  approver: '流程签核审批人',
  approvalStatus: '当前签核生效状态',
};

// ==================== 工具函数 ====================

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(type: ArchiveFile['type']): string {
  switch (type) {
    case 'audio': {
      return 'lucide:music';
    }
    case 'document': {
      return 'lucide:file-text';
    }
    case 'image': {
      return 'lucide:image';
    }
    case 'text': {
      return 'lucide:align-left';
    }
    case 'video': {
      return 'lucide:video';
    }
    default: {
      return 'lucide:file';
    }
  }
}

function getFileTypeLabel(type: ArchiveFile['type']): string {
  switch (type) {
    case 'audio': {
      return '语音录音';
    }
    case 'document': {
      return '正式文档';
    }
    case 'image': {
      return '图片素材';
    }
    case 'text': {
      return '结构文本';
    }
    case 'video': {
      return '视频剪辑';
    }
    default: {
      return '关联文件';
    }
  }
}

function getFileTypeColor(type: ArchiveFile['type']): string {
  switch (type) {
    case 'audio': {
      return 'purple';
    }
    case 'document': {
      return 'blue';
    }
    case 'image': {
      return 'emerald';
    }
    case 'text': {
      return 'orange';
    }
    case 'video': {
      return 'red';
    }
    default: {
      return 'default';
    }
  }
}

function getFileTypeTextColor(type: ArchiveFile['type']): string {
  switch (type) {
    case 'audio': {
      return 'text-purple-600 dark:text-purple-400';
    }
    case 'document': {
      return 'text-blue-600 dark:text-blue-400';
    }
    case 'image': {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    case 'text': {
      return 'text-orange-600 dark:text-orange-400';
    }
    case 'video': {
      return 'text-red-600 dark:text-red-400';
    }
    default: {
      return 'text-slate-500 dark:text-slate-400';
    }
  }
}

// 会议纪要文件类型标签页
const meetingMinutesTabs = computed(() => {
  if (!props.file?.relatedFiles) return [];
  const tabs: Array<{ files: ArchiveFile[]; key: string; label: string }> = [];

  const audioFiles = props.file.relatedFiles.filter((f) => f.type === 'audio');
  if (audioFiles.length > 0) {
    tabs.push({
      key: 'audio',
      label: `会议录音 (${audioFiles.length})`,
      files: audioFiles,
    });
  }

  const textFiles = props.file.relatedFiles.filter((f) => f.type === 'text');
  if (textFiles.length > 0) {
    tabs.push({
      key: 'text',
      label: `转录文本 (${textFiles.length})`,
      files: textFiles,
    });
  }

  const docFiles = props.file.relatedFiles.filter((f) => f.type === 'document');
  if (docFiles.length > 0) {
    tabs.push({
      key: 'document',
      label: `纪要文档 (${docFiles.length})`,
      files: docFiles,
    });
  }

  const otherFiles = props.file.relatedFiles.filter(
    (f) => !['audio', 'document', 'text'].includes(f.type),
  );
  if (otherFiles.length > 0) {
    tabs.push({
      key: 'other',
      label: `其他附件 (${otherFiles.length})`,
      files: otherFiles,
    });
  }

  return tabs;
});

// 当前标签页的文件列表
const currentTabFiles = computed(() => {
  if (!isMeetingMinutes.value) return props.file?.relatedFiles || [];
  const activeTab = meetingMinutesTabs.value.find(
    (t) => t.key === activeFileTab.value,
  );
  return activeTab?.files || [];
});

// 监听标签页切换，更新选中文件
watch(activeFileTab, () => {
  const files = currentTabFiles.value;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
  }
});

// 选择文件
function handleSelectFile(fileItem: ArchiveFile) {
  selectedFile.value = fileItem;
}

// 格式化 JSON 显示
const formatJson = (data: any) => {
  if (!data) return '{}';
  return JSON.stringify(data, null, 2);
};
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline -->
  <Modal
    v-model:open="internalOpen"
    :title="null"
    width="1100px"
    :footer="null"
    class="modern-archive-detail-modal"
    :body-style="{ padding: 0, overflow: 'hidden' }"
  >
    <div
      v-if="file"
      class="flex flex-col overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950"
    >
      <!-- 头部 Banner：统一沉浸式渐变背景 -->
      <div
        class="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white shadow-md"
      >
        <div
          class="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"
        ></div>
        <div
          class="absolute right-[30%] top-[-20%] h-32 w-32 rounded-full bg-cyan-500/15 blur-2xl"
        ></div>

        <div class="relative flex items-start justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-inner backdrop-blur-md"
            >
              <Icon icon="lucide:archive" class="text-2xl text-cyan-300" />
            </div>
            <div class="min-w-0">
              <div class="mb-1 flex items-center gap-2">
                <Tag
                  class="m-0 rounded-md border-0 bg-indigo-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-200"
                >
                  {{ file.category.name }}
                </Tag>
                <code
                  class="rounded bg-slate-800/40 px-1.5 py-0.5 font-mono text-[11px] font-extrabold tracking-wider text-indigo-300 opacity-85"
                >
                  {{ file.archiveNo }}
                </code>
              </div>
              <h2
                class="m-0 max-w-[550px] truncate text-lg font-black leading-snug tracking-wide text-white"
                :title="file.title"
              >
                {{ file.title || '未命名档案' }}
              </h2>
            </div>
          </div>

          <!-- 快捷看板数据卡 -->
          <div
            class="flex shrink-0 items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-2 px-3 shadow-lg backdrop-blur-md"
          >
            <div class="border-r border-white/10 pr-4 text-center">
              <div class="mb-0.5 text-[10px] font-medium text-slate-400">
                关联资料项
              </div>
              <div class="font-mono text-base font-black text-cyan-400">
                {{ file.relatedFiles?.length || 0 }}
              </div>
            </div>
            <div class="text-center">
              <div class="mb-0.5 text-[10px] font-medium text-slate-400">
                经办人
              </div>
              <div
                class="max-w-[70px] truncate text-xs font-bold text-slate-200"
              >
                {{ file.uploaderName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统一双栏分屏布局 (统一占空：左 30% | 右 70%) -->
      <div class="flex h-[600px] overflow-hidden bg-white dark:bg-slate-900">
        <!-- ==================== 左侧侧边栏 (30%)：文件列表与基本属性 ==================== -->
        <div
          class="flex w-[30%] shrink-0 flex-col border-r border-slate-100/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/20"
        >
          <!-- 第一板块：当前选中文件的基本属性看板 -->
          <div
            class="border-b border-slate-100 bg-white/40 p-4 dark:border-slate-800 dark:bg-slate-900/30"
          >
            <div class="mb-3 flex items-center gap-2">
              <div class="h-3 w-0.5 rounded-full bg-blue-600"></div>
              <span
                class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"
                >选中项元数据</span
              >
            </div>
            <div class="flex flex-col gap-2 text-[12px]" v-if="selectedFile">
              <div class="flex justify-between">
                <span class="font-medium text-slate-400">关联项:</span
                ><span
                  class="max-w-[140px] truncate font-bold text-slate-700 dark:text-slate-200"
                  :title="selectedFile.name"
                  >{{ selectedFile.name }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-slate-400">占用大小:</span
                ><span class="font-bold text-slate-700 dark:text-slate-200">{{
                  formatFileSize(selectedFile.size)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-slate-400">格式分类:</span
                ><Tag
                  class="m-0 rounded border-0 px-1.5 py-0 text-[10px] font-extrabold"
                  :color="getFileTypeColor(selectedFile.type)"
                >
                  {{ getFileTypeLabel(selectedFile.type) }}
                </Tag>
              </div>
              <div class="flex justify-between">
                <span class="font-medium text-slate-400">归档时间:</span
                ><span class="font-mono font-bold text-slate-500">{{
                  formatDate(selectedFile.createdAt)
                }}</span>
              </div>
            </div>
          </div>

          <!-- 第二板块：文件目录列表导航 -->
          <div class="flex flex-1 flex-col overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-slate-100 bg-white/20 px-4 py-3 dark:border-slate-800"
            >
              <div
                class="flex items-center gap-1.5 text-xs font-black text-slate-500"
              >
                <Icon icon="lucide:layers" /> 档案附件清单
              </div>
              <span
                class="rounded bg-slate-200/50 px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-400 dark:bg-slate-800"
              >
                共 {{ file.relatedFiles?.length || 0 }} 项
              </span>
            </div>

            <div class="flex-1 overflow-y-auto py-2">
              <!-- 如果是多文件档案 -->
              <template
                v-if="file.relatedFiles && file.relatedFiles.length > 1"
              >
                <!-- 会议纪要定制分类页签 -->
                <div v-if="isMeetingMinutes && meetingMinutesTabs.length > 0">
                  <Tabs
                    v-model:active-key="activeFileTab"
                    size="small"
                    class="mini-side-tabs px-3"
                  >
                    <Tabs.TabPane
                      v-for="tab in meetingMinutesTabs"
                      :key="tab.key"
                      :tab="tab.label"
                    >
                      <div class="flex flex-col gap-1.5 pt-2">
                        <div
                          v-for="item in tab.files"
                          :key="item.id"
                          @click="handleSelectFile(item)"
                          class="group flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all"
                          :class="[
                            selectedFile?.id === item.id
                              ? 'shadow-xs border-blue-200/60 bg-blue-50/80 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
                              : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                          ]"
                        >
                          <div
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                          >
                            <Icon
                              :icon="getFileIcon(item.type)"
                              class="text-sm"
                              :class="getFileTypeTextColor(item.type)"
                            />
                          </div>
                          <div class="min-w-0 flex-1">
                            <h4
                              class="m-0 mb-0.5 truncate text-xs font-bold"
                              :class="
                                selectedFile?.id === item.id
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : ''
                              "
                            >
                              {{ item.name }}
                            </h4>
                            <span
                              class="font-mono text-[9px] font-medium text-slate-400"
                              >{{ formatFileSize(item.size) }}</span
                            >
                          </div>
                          <div
                            v-if="selectedFile?.id === item.id"
                            class="shadow-xs h-2 w-2 rounded-full bg-blue-600"
                          ></div>
                        </div>
                      </div>
                    </Tabs.TabPane>
                  </Tabs>
                </div>

                <!-- 通用扁平文件列表 -->
                <div v-else class="flex flex-col gap-1.5 px-3">
                  <div
                    v-for="item in file.relatedFiles"
                    :key="item.id"
                    @click="handleSelectFile(item)"
                    class="group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all"
                    :class="[
                      selectedFile?.id === item.id
                        ? 'shadow-xs border-blue-200/60 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
                        : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50',
                    ]"
                  >
                    <div
                      class="shadow-xs flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Icon
                        :icon="getFileIcon(item.type)"
                        class="text-sm"
                        :class="getFileTypeTextColor(item.type)"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4
                        class="m-0 mb-0.5 truncate text-xs font-bold"
                        :class="
                          selectedFile?.id === item.id
                            ? 'text-blue-700 dark:text-blue-300'
                            : ''
                        "
                      >
                        {{ item.name }}
                      </h4>
                      <div
                        class="flex items-center gap-1.5 text-[9px] font-medium text-slate-400"
                      >
                        <span>{{ formatFileSize(item.size) }}</span>
                        <span>•</span>
                        <span>{{ getFileTypeLabel(item.type) }}</span>
                      </div>
                    </div>
                    <div
                      v-if="selectedFile?.id === item.id"
                      class="shadow-xs h-2 w-2 rounded-full bg-blue-600"
                    ></div>
                  </div>
                </div>
              </template>

              <!-- 如果是单文件档案，以优雅的单独选中状态渲染，保持结构绝对一致 -->
              <template v-else>
                <div class="px-3 pt-2">
                  <div
                    class="shadow-xs flex items-center gap-3 rounded-xl border border-blue-200/60 bg-blue-50 p-3 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
                  >
                    <div
                      class="shadow-xs flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Icon
                        v-if="selectedFile"
                        :icon="getFileIcon(selectedFile.type)"
                        class="text-sm"
                        :class="getFileTypeTextColor(selectedFile.type)"
                      />
                    </div>
                    <div class="min-w-0 flex-1" v-if="selectedFile">
                      <h4
                        class="m-0 mb-0.5 truncate text-xs font-bold text-blue-700 dark:text-blue-300"
                      >
                        {{ selectedFile.name }}
                      </h4>
                      <div
                        class="flex items-center gap-1.5 text-[9px] font-medium text-slate-400"
                      >
                        <span>{{ formatFileSize(selectedFile.size) }}</span>
                        <span>•</span>
                        <span>核心电子单据</span>
                      </div>
                    </div>
                    <div
                      class="shadow-xs h-2 w-2 rounded-full bg-blue-600"
                    ></div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- ==================== 右侧主舞台区域 (70%)：多媒体预览 + 数据看板 ==================== -->
        <div
          class="flex flex-1 flex-col gap-6 overflow-y-auto bg-white p-6 dark:bg-slate-900"
        >
          <div v-if="selectedFile" class="flex flex-col gap-6">
            <!-- 新增板块：文件摘要与标签 -->
            <div class="flex flex-col gap-4">
              <!-- 文件摘要 -->
              <div v-if="file.fileSummary" class="w-full">
                <div class="mb-2 flex items-center gap-2">
                  <Icon
                    icon="lucide:sparkles"
                    class="text-sm text-purple-500"
                  />
                  <span
                    class="text-xs font-extrabold text-slate-700 dark:text-slate-300"
                    >AI 文件摘要</span
                  >
                </div>
                <div
                  class="rounded-lg border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 dark:border-purple-900 dark:from-purple-950/30 dark:to-indigo-950/30"
                >
                  <p
                    class="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    {{ file.fileSummary }}
                  </p>
                </div>
              </div>

              <!-- 文件标签 -->
              <div
                v-if="file.fileTags && file.fileTags.length > 0"
                class="w-full"
              >
                <div class="mb-2 flex items-center gap-2">
                  <Icon icon="lucide:tag" class="text-sm text-blue-500" />
                  <span
                    class="text-xs font-extrabold text-slate-700 dark:text-slate-300"
                    >文件标签</span
                  >
                </div>
                <div class="flex flex-wrap gap-2">
                  <Tag
                    v-for="tag in file.fileTags"
                    :key="tag.id"
                    :color="tag.color || 'blue'"
                    class="m-0 rounded-md px-2.5 py-1 text-xs font-bold"
                  >
                    {{ tag.name }}
                  </Tag>
                </div>
              </div>

              <!-- 用户描述 -->
              <div v-if="file.userDescription" class="w-full">
                <div class="mb-2 flex items-center gap-2">
                  <Icon
                    icon="lucide:sticky-note"
                    class="text-sm text-amber-500"
                  />
                  <span
                    class="text-xs font-extrabold text-slate-700 dark:text-slate-300"
                    >用户备注</span
                  >
                </div>
                <div
                  class="rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20"
                >
                  <p
                    class="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    {{ file.userDescription }}
                  </p>
                </div>
              </div>

              <Divider class="my-0" />
            </div>

            <!-- 第一板块：沉浸多媒体播放/预览器 -->
            <div class="w-full">
              <!-- 1. 音频渲染模块 -->
              <div
                v-if="selectedFile.type === 'audio'"
                class="relative flex w-full flex-col overflow-hidden rounded-2xl border border-indigo-950/50 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-md"
              >
                <div
                  class="pointer-events-none absolute bottom-[-20px] right-[-20px] text-indigo-500/5"
                >
                  <Icon icon="lucide:music" class="text-[110px]" />
                </div>
                <div class="relative flex items-center gap-4">
                  <button
                    @click="isPlaying = !isPlaying"
                    class="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-cyan-400 text-slate-950 shadow-lg transition hover:scale-105 hover:bg-cyan-300"
                  >
                    <Icon
                      :icon="isPlaying ? 'lucide:pause' : 'lucide:play'"
                      class="text-xl"
                    />
                  </button>
                  <div class="min-w-0 flex-1">
                    <div
                      class="mb-0.5 text-[9px] font-extrabold uppercase tracking-wider opacity-60"
                    >
                      AUDIO BROADCAST PLAYER
                    </div>
                    <div
                      class="truncate pr-4 text-sm font-black"
                      :title="selectedFile.name"
                    >
                      {{ selectedFile.name }}
                    </div>
                  </div>
                </div>

                <!-- 脉冲式音频声波 -->
                <div
                  class="my-2.5 flex h-8 items-end justify-center gap-[3px] px-2"
                >
                  <div
                    v-for="n in 46"
                    :key="n"
                    class="w-[3.5px] rounded-t bg-cyan-400/40 transition-all"
                    :class="[isPlaying ? 'animate-pulse duration-500' : '']"
                    :style="{
                      height: isPlaying
                        ? `${6 + Math.floor(Math.random() * 22)}px`
                        : '4px',
                    }"
                  ></div>
                </div>

                <div
                  class="flex justify-between font-mono text-[9px] opacity-50"
                >
                  <span>音频采集点</span>
                  <span>{{ formatFileSize(selectedFile.size) }}</span>
                </div>
              </div>

              <!-- 2. 文本转录摘要渲染 -->
              <div
                v-else-if="selectedFile.type === 'text'"
                class="shadow-xs flex w-full flex-col overflow-hidden rounded-xl border border-dashed border-amber-200/60 bg-amber-50/10 dark:border-amber-900 dark:bg-amber-950/5"
              >
                <div
                  class="flex items-center justify-between border-b border-amber-200/40 bg-amber-50/40 px-4 py-2.5 dark:border-amber-950"
                >
                  <span
                    class="flex items-center gap-1.5 text-[11px] font-black text-amber-800 dark:text-amber-400"
                  >
                    <Icon icon="lucide:align-left" /> 会议转录文稿摘录
                  </span>
                </div>
                <div
                  class="p-4.5 max-h-[180px] select-text overflow-y-auto bg-white font-sans text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
                >
                  {{
                    selectedFile.description ||
                    '未提取到本项的详细文本描述记录。'
                  }}
                </div>
              </div>

              <!-- 3. 静态图片素材 -->
              <div
                v-else-if="selectedFile.type === 'image'"
                class="group relative flex aspect-[21/9] max-h-[220px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-inner dark:border-slate-700"
              >
                <img
                  :src="selectedFile.url"
                  class="max-h-full max-w-full select-none object-contain"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <a
                    :href="selectedFile.url"
                    target="_blank"
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow transition hover:scale-110"
                  >
                    <Icon icon="lucide:maximize-2" class="text-sm" />
                  </a>
                </div>
              </div>

              <!-- 4. 通用归档文档卡片 (PDF/Word等) -->
              <div
                v-else
                class="shadow-xs flex w-full items-center gap-5 rounded-xl border border-blue-100 bg-blue-50/20 p-5 dark:border-blue-950 dark:bg-blue-950/10"
              >
                <div
                  class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                >
                  <Icon
                    :icon="getFileIcon(selectedFile.type)"
                    class="text-2xl"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <h4
                    class="mb-1 truncate text-sm font-extrabold text-slate-800 dark:text-slate-200"
                  >
                    {{ selectedFile.name }}
                  </h4>
                  <div class="mt-2 flex items-center justify-between gap-2">
                    <span class="text-[10px] font-bold text-slate-400"
                      >{{ formatFileSize(selectedFile.size) }} •
                      数字化正式存证件</span
                    >
                    <div class="flex items-center gap-2">
                      <Button
                        type="primary"
                        size="small"
                        class="h-6.5 flex items-center gap-1 rounded-md border-0 bg-blue-600 px-3 text-[11px] font-bold hover:bg-blue-700"
                      >
                        <Icon icon="lucide:book-open" /> 在线阅览
                      </Button>
                      <Button
                        size="small"
                        class="h-6.5 flex items-center gap-1 rounded-md border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <Icon icon="lucide:download" /> 下载原档
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 第二板块：AI 提取的结构化业务字段数据 (单一大卡片 JSON 渲染) -->
            <div
              class="flex min-h-[240px] flex-1 flex-col overflow-hidden border-t border-slate-100 pt-5 dark:border-slate-800"
            >
              <div class="mb-3 flex items-center gap-2">
                <Icon
                  icon="lucide:brain-circuit"
                  class="text-base text-cyan-500"
                />
                <span
                  class="text-xs font-extrabold tracking-wide text-slate-800 dark:text-slate-200"
                  >AI 识别档案内容提取</span
                >
              </div>

              <div
                v-if="
                  file.structuredData &&
                  Object.keys(file.structuredData).length > 0
                "
                class="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50/40 shadow-inner dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div
                  class="flex items-center justify-between border-b border-slate-100 bg-white/50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/30"
                >
                  <div
                    class="flex items-center gap-1.5 text-[10px] font-bold text-slate-400"
                  >
                    <div
                      class="h-2 w-2 animate-pulse rounded-full bg-cyan-500"
                    ></div>
                    核心结构化 JSON 数据
                  </div>
                  <div
                    class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] uppercase text-slate-400 dark:bg-slate-800"
                  >
                    JSON
                  </div>
                </div>
                <div
                  class="scrollbar-thin flex-1 overflow-auto bg-slate-50/10 p-4 dark:bg-slate-950/20"
                >
                  <pre
                    class="m-0 select-all whitespace-pre font-mono text-[11.5px] leading-relaxed text-slate-700 dark:text-cyan-300/90"
                    >{{ formatJson(file.structuredData) }}</pre
                  >
                </div>
              </div>

              <div
                v-else
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/10"
              >
                <Icon
                  icon="lucide:file-question"
                  class="mb-2 text-3xl text-slate-300"
                />
                <span class="text-xs font-bold text-slate-400"
                  >暂未识别到档案的结构化内容</span
                >
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex h-full flex-col items-center justify-center text-slate-400"
          >
            <Empty description="暂未选择查阅项" />
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style lang="less">
.modern-archive-detail-modal {
  .ant-modal-content {
    border-radius: 20px !important;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  }

  .mini-side-tabs {
    .ant-tabs-nav {
      margin-bottom: 8px !important;
    }
    .ant-tabs-tab {
      padding: 6px 4px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
    }
  }
}
</style>
