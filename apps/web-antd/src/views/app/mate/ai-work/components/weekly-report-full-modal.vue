<!-- 周报完整大弹窗 (WeeklyReportFullModal) -->
<!-- 界面与样式 1:1 参考【我的周报】页面预览样式：不可编辑、取消打分表单，仅保留点赞、嵌套讨论评语与发送评论功能 -->
<script setup lang="ts">
import type { EntityPick } from './entity-context-drawer.vue';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Input,
  message,
  Modal,
  Rate,
  Tag,
} from 'ant-design-vue';

import EntityContextDrawer from './entity-context-drawer.vue';
import EntityTags from './entity-tags.vue';
import MaterialList from './material-list.vue';
import WorkItemDetailDrawer from './work-item-detail-drawer.vue';

interface CommentReply {
  id: string;
  author: string;
  replyTo: string;
  role: string;
  time: string;
  content: string;
}

interface CommentItem {
  id: string;
  author: string;
  role: string;
  time: string;
  content: string;
  score?: number;
  replies?: CommentReply[];
}

const props = defineProps<{
  dateRange?: null | string;
  open: boolean;
  personName?: null | string;
  weekLabel?: null | string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

// 点赞状态
const liked = ref(false);
const likeCount = ref(3);

function toggleLike() {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
  message.success(liked.value ? '已点赞！' : '已取消点赞');
}

// 上周计划完成跟踪数据
const lastWeekPlan = ref([
  {
    id: 'plan-1',
    description: '完成报价模块接口开发与单元测试',
    note: '已按期完成核心接口开发与全链路自测',
    status: 'done',
  },
  {
    id: 'plan-2',
    description: '华达现场打印流程对接与需求确认',
    note: '已与客户完成验收口径确认，现场问题已排查完毕',
    status: 'done',
  },
  {
    id: 'plan-3',
    description: '完成客户 B 接口联调及环境部署',
    note: '客户测试环境未准备完成，预计延期至 下周三',
    status: 'delayed',
  },
]);

// 本周工作内容成果数据
const workItems = ref([
  {
    id: 'w-1',
    title: '报价平台 V2 接口开发',
    status: '进入联调',
    statusType: 'warning',
    content: '完成报价核心接口开发并进入联调，整体按本周计划推进。',
    materials: [
      {
        id: 'm-1',
        name: '报价模块接口设计文档.docx',
        type: 'document',
        size: '1.4 MB',
      },
      {
        id: 'm-2',
        name: '接口联调测试数据.png',
        type: 'image',
        size: '1.2 MB',
      },
      {
        id: 'm-3',
        name: '报价模块技术讨论录音.m4a',
        type: 'audio',
        duration: '08:15',
      },
    ],
    entities: {
      projects: ['报价平台 V2'],
      products: ['报价模块'],
    },
  },
  {
    id: 'w-2',
    title: '华达智能打印项目推进',
    status: '基本解决',
    statusType: 'success',
    content: '完成需求确认和现场出单，打印重发问题基本解决，进入观察期。',
    materials: [
      {
        id: 'm-4',
        name: '华达现场处理录音.m4a',
        type: 'audio',
        duration: '12:34',
      },
      { id: 'm-5', name: '现场照片.png', type: 'image', size: '3.6 MB' },
      {
        id: 'm-6',
        name: '华达现场观察录像.mp4',
        type: 'video',
        duration: '03:28',
      },
    ],
    entities: {
      projects: ['华达智能打印'],
      customers: ['华达'],
      people: ['王天霸'],
    },
  },
  {
    id: 'w-3',
    title: '客户 B 接口联调延期',
    status: '延期',
    statusType: 'error',
    content:
      '客户测试环境未准备完成，接口联调未能按预定计划完成，预计延期至下周三。',
    materials: [
      {
        id: 'm-7',
        name: '客户接口延期说明.docx',
        type: 'document',
        size: '620 KB',
      },
    ],
    entities: {
      projects: ['客户 B 集成'],
      customers: ['客户 B'],
    },
  },
  {
    id: 'w-4',
    title: '下周关键计划',
    status: '联动',
    statusType: 'info',
    content:
      '完成客户 B 接口联调，并持续跟踪华达打印效果，周五前同步联调结果。',
    materials: [],
  },
]);

// 下周工作计划承诺数据
const nextWeekPlans = ref([
  {
    code: '01',
    content: '推进报价平台 V2 联调与集成测试',
    entity: '报价平台 V2',
    dueDate: '8月19日 (周二)',
  },
  {
    code: '02',
    content: '完成客户 B 接口上线与验收演示',
    entity: '客户 B 集成',
    dueDate: '8月20日 (周三)',
  },
  {
    code: '03',
    content: '长鑫5期打印接口文档编写与交接',
    entity: '长鑫5期打印',
    dueDate: '8月21日 (周四)',
  },
]);

// 讨论与评语列表数据
const commentsList = ref<CommentItem[]>([
  {
    id: 'c-1',
    author: '李经理 (技术主管)',
    role: '主管',
    time: '2026-08-10 10:15',
    score: 5,
    content:
      '本周工作高效，华达现场响应迅速，报价平台按计划推进，客户 B 接口延期原因清晰，请下周三重点攻坚突破！',
    replies: [
      {
        id: 'r-1',
        author: '张三 (我)',
        replyTo: '李经理',
        role: '作者',
        time: '2026-08-10 10:30',
        content:
          '收到李经理！下周三联调环境准备就绪后，我会第一时间安排全链路验证。',
      },
    ],
  },
]);

// 回复目标与评论输入
const activeReplyTarget = ref<CommentItem | null>(null);
const newCommentText = ref('');

function replyToComment(comment: CommentItem) {
  activeReplyTarget.value = comment;
}

function cancelReply() {
  activeReplyTarget.value = null;
}

function postComment() {
  const text = newCommentText.value.trim();
  if (!text) {
    message.warning('评论内容不能为空');
    return;
  }

  if (activeReplyTarget.value) {
    if (!activeReplyTarget.value.replies) {
      activeReplyTarget.value.replies = [];
    }
    activeReplyTarget.value.replies.push({
      id: `r-${Date.now()}`,
      author: '当前审阅者',
      replyTo: activeReplyTarget.value.author,
      role: '审阅者',
      time: '刚刚',
      content: text,
    });
    message.success('回复发表成功');
    activeReplyTarget.value = null;
  } else {
    commentsList.value.push({
      id: `c-${Date.now()}`,
      author: '当前审阅者 (主管)',
      role: '主管',
      time: '刚刚',
      content: text,
    });
    message.success('评论提交成功');
  }

  newCommentText.value = '';
}

// 关联实体穿透控制
const entityDrawerOpen = ref(false);
const selectedEntity = ref<EntityPick | null>(null);

function handleEntityPick(payload: { name: string; type: EntityPick['type'] }) {
  selectedEntity.value = payload;
  entityDrawerOpen.value = true;
}

// 工作事项详情 Drawer
const detailDrawerOpen = ref(false);
const activeDetailItem = ref<any>(null);

function openWorkItemDetail(item: any) {
  activeDetailItem.value = item;
  detailDrawerOpen.value = true;
}
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    :width="960"
    centered
    class="weekly-report-full-modal"
  >
    <!-- 大白卡片 Canvas (16px 圆角 + 浮空阴影 + 80vh 顺畅纵向滚动) -->
    <div
      class="report-paper-card max-h-[82vh] space-y-6 overflow-y-auto rounded-2xl bg-white p-6 pr-2 text-[#111827]"
    >
      <!-- 头部：周报标题、提交人与进度标签 -->
      <header
        class="paper-header flex items-start justify-between border-b border-[#F1F5F9] pb-5"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <h1
              class="margin-none text-2xl font-black tracking-tight text-[#0F172A]"
            >
              {{ weekLabel || '2026-W33 周报' }}
            </h1>
            <Tag
              color="green"
              class="rounded-full border-none px-2.5 py-0.5 text-xs font-bold"
            >
              ● 已发布
            </Tag>
          </div>

          <p
            class="margin-none flex items-center gap-2 pt-1 text-xs text-[#64748B]"
          >
            <span>{{ dateRange || '2026-08-10 -- 2026-08-17' }}</span>
            <span>·</span>
            <span>
              提交人：
              <strong>{{ personName || '张三' }}</strong>
              (产研发起部)
            </span>
          </p>
        </div>

        <div
          class="flex items-center gap-2 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] px-3.5 py-1.5"
        >
          <span class="text-xs font-medium text-[#64748B]">按期完成:</span>
          <span class="font-mono text-xs font-bold text-[#059669]">2/3</span>
        </div>
      </header>

      <!-- 一、 上周计划完成跟踪 -->
      <section class="paper-section space-y-3">
        <h2
          class="margin-none text-base font-bold tracking-tight text-[#0F172A]"
        >
          一、 上周计划完成跟踪
        </h2>

        <div
          class="relative ml-1 space-y-4 border-l-2 border-[#E2E8F0] pl-5 pt-1"
        >
          <div
            v-for="plan in lastWeekPlan"
            :key="plan.id"
            class="group relative flex items-start justify-between gap-4"
          >
            <!-- Timeline 圆点 -->
            <span
              class="absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-white"
              :class="plan.status === 'done' ? 'bg-[#10B981]' : 'bg-[#EF4444]'"
            ></span>

            <div class="space-y-0.5">
              <div class="text-xs font-semibold text-[#0F172A]">
                {{ plan.description }}
              </div>
              <p class="m-0 text-xs leading-normal text-[#64748B]">
                {{ plan.note }}
              </p>
            </div>

            <!-- Status Indicator -->
            <span
              v-if="plan.status === 'done'"
              class="inline-flex flex-none items-center gap-1.5 text-xs font-medium text-[#059669]"
            >
              ● 按时完成
            </span>
            <span
              v-else
              class="inline-flex flex-none items-center gap-1.5 rounded bg-[#FEF2F2] px-2 py-0.5 text-xs font-medium text-[#DC2626]"
            >
              ● 延期
            </span>
          </div>
        </div>
      </section>

      <!-- 二、 本周工作内容成果 -->
      <section class="paper-section space-y-3">
        <div class="flex items-center justify-between">
          <h2
            class="margin-none text-base font-bold tracking-tight text-[#0F172A]"
          >
            二、 本周工作内容成果
          </h2>
          <span class="text-xs text-[#94A3B8]">由【我的工作】数据自动聚合</span>
        </div>

        <div class="space-y-3">
          <article
            v-for="item in workItems"
            :key="item.id"
            class="space-y-2.5 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-4 transition-all hover:border-[#E2E8F0]"
            :class="
              item.statusType === 'success'
                ? 'border-l-4 border-l-[#10B981]'
                : item.statusType === 'error'
                  ? 'border-l-4 border-l-[#EF4444]'
                  : 'border-l-4 border-l-[#F59E0B]'
            "
          >
            <!-- 事项 Header -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="margin-none text-sm font-bold text-[#0F172A]">
                  {{ item.title }}
                </h3>
                <span
                  class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  :class="
                    item.statusType === 'success'
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : item.statusType === 'error'
                        ? 'bg-[#FEF2F2] text-[#DC2626]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                  "
                >
                  {{ item.status }}
                </span>
              </div>

              <Button
                type="link"
                size="small"
                class="flex h-auto items-center gap-0.5 p-0 text-xs font-semibold text-[#059669] hover:text-[#047857]"
                @click="openWorkItemDetail(item)"
              >
                <Icon icon="lucide:panel-right-open" class="size-3.5" />
                <span>详情</span>
              </Button>
            </div>

            <!-- 正文描述 -->
            <p class="m-0 text-xs leading-relaxed text-[#334155]">
              {{ item.content }}
            </p>

            <!-- 关联资料与关联实体 -->
            <div
              class="flex w-full flex-wrap items-start justify-between gap-3 border-t border-[#E2E8F0]/60 pt-1.5"
            >
              <div
                class="flex min-w-[220px] flex-1 flex-wrap items-center gap-2 text-xs"
              >
                <span class="flex-none text-[11px] font-medium text-[#94A3B8]">
                  关联资料:
                </span>
                <MaterialList
                  :materials="item.materials"
                  :show-label="false"
                  variant="minimal"
                />
              </div>

              <div
                v-if="item.entities"
                class="ml-auto flex min-w-[220px] flex-1 flex-wrap items-center justify-end gap-2 text-xs"
              >
                <span class="flex-none text-[11px] font-medium text-[#94A3B8]">
                  关联实体:
                </span>
                <EntityTags
                  :entities="item.entities"
                  :show-group-title="false"
                  :clickable="true"
                  variant="minimal"
                  @pick="handleEntityPick"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- 三、 下周工作计划承诺 -->
      <section class="paper-section space-y-3">
        <h2
          class="margin-none text-base font-bold tracking-tight text-[#0F172A]"
        >
          三、 下周工作计划承诺
        </h2>

        <div class="space-y-2">
          <div
            v-for="plan in nextWeekPlans"
            :key="plan.code"
            class="flex items-center justify-between gap-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3 transition-colors hover:bg-[#F1F5F9]/70"
          >
            <div class="flex items-center gap-3">
              <span class="w-5 font-mono text-xs font-black text-[#059669]">
                {{ plan.code }}
              </span>
              <span class="text-xs font-semibold text-[#0F172A]">
                {{ plan.content }}
              </span>
            </div>

            <div class="flex items-center gap-3 text-xs">
              <span
                class="rounded bg-[#E2E8F0]/70 px-2 py-0.5 text-[11px] text-[#475569]"
              >
                {{ plan.entity }}
              </span>
              <span class="font-mono text-[11px] text-[#94A3B8]">
                {{ plan.dueDate }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 四、 点赞与讨论评语区 (只点赞与评论) -->
      <section class="paper-section space-y-4 border-t border-[#F1F5F9] pt-6">
        <!-- 互动点赞栏 -->
        <div
          class="flex items-center justify-between rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2.5"
        >
          <div class="flex items-center gap-3">
            <Button
              size="small"
              class="flex cursor-pointer items-center gap-1.5 rounded-lg border-[#E2E8F0] text-xs font-medium text-[#334155] hover:bg-[#F1F5F9]"
              @click="toggleLike"
            >
              <Icon
                icon="lucide:thumbs-up"
                class="size-3.5"
                :class="
                  liked ? 'fill-[#059669] text-[#059669]' : 'text-[#64748B]'
                "
              />
              <span>{{ liked ? '已点赞' : '赞' }}</span>
              <span class="font-bold text-[#0F172A]">({{ likeCount }})</span>
            </Button>

            <div class="ml-1 flex items-center -space-x-1">
              <Avatar
                class="size-5 border border-white bg-[#2563EB] text-[9px]"
              >
                李
              </Avatar>
              <Avatar
                class="size-5 border border-white bg-[#9333EA] text-[9px]"
              >
                王
              </Avatar>
              <Avatar
                class="size-5 border border-white bg-[#EA580C] text-[9px]"
              >
                刘
              </Avatar>
            </div>
            <span class="text-xs text-[#64748B]">
              李经理、王总等 {{ likeCount }} 人觉得赞
            </span>
          </div>

          <span class="text-xs text-[#94A3B8]">
            {{ commentsList.length }} 条讨论
          </span>
        </div>

        <!-- 评论与回复列表 -->
        <div class="comments-section space-y-3">
          <h3 class="margin-none text-xs font-bold text-[#0F172A]">
            讨论与评语反馈
          </h3>

          <div
            v-for="comment in commentsList"
            :key="comment.id"
            class="space-y-2.5 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3.5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-[#0F172A]">
                  {{ comment.author }}
                </span>
                <span
                  class="py-0.2 rounded px-1.5 text-[10px] font-medium"
                  :class="
                    comment.role === '主管'
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : 'bg-[#E2E8F0] text-[#475569]'
                  "
                >
                  {{ comment.role }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[10px] text-[#94A3B8]">
                  {{ comment.time }}
                </span>
                <Button
                  type="link"
                  size="small"
                  class="h-auto p-0 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
                  @click="replyToComment(comment)"
                >
                  回复
                </Button>
              </div>
            </div>

            <p class="m-0 text-xs leading-relaxed text-[#334155]">
              {{ comment.content }}
            </p>

            <div v-if="comment.score" class="flex items-center gap-1 pt-0.5">
              <span class="text-[10px] text-[#94A3B8]">综合评分:</span>
              <Rate :value="comment.score" disabled class="text-xs" />
            </div>

            <!-- 嵌套回复区域 -->
            <div
              v-if="comment.replies && comment.replies.length > 0"
              class="ml-1 mt-2.5 space-y-2 rounded-r-lg border-l-2 border-l-[#059669]/40 bg-[#F1F5F9]/60 p-2.5 pl-3"
            >
              <div
                v-for="reply in comment.replies"
                :key="reply.id"
                class="space-y-1"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-bold text-[#0F172A]">
                      {{ reply.author }}
                    </span>
                    <span class="text-[11px] text-[#64748B]">回复</span>
                    <span class="text-xs font-bold text-[#059669]">
                      @{{ reply.replyTo }}
                    </span>
                    <span
                      class="py-0.2 scale-90 rounded bg-[#E2E8F0] px-1 text-[10px] text-[#475569]"
                    >
                      {{ reply.role }}
                    </span>
                  </div>
                  <span class="text-[10px] text-[#94A3B8]">
                    {{ reply.time }}
                  </span>
                </div>

                <p class="m-0 pl-0.5 text-xs leading-relaxed text-[#334155]">
                  {{ reply.content }}
                </p>
              </div>
            </div>
          </div>

          <!-- 发表评论与发送输入框 -->
          <div class="space-y-2 pt-2">
            <div
              v-if="activeReplyTarget"
              class="flex items-center justify-between rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1 text-xs text-[#059669]"
            >
              <span>
                正在回复
                <strong>@{{ activeReplyTarget.author }}</strong>
              </span>
              <button
                type="button"
                class="text-[10px] text-[#64748B] hover:text-[#DC2626]"
                @click="cancelReply"
              >
                取消回复
              </button>
            </div>

            <div class="flex gap-2">
              <Input.TextArea
                v-model:value="newCommentText"
                placeholder="写下补充意见或评论..."
                :rows="2"
                class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-[#0F172A] focus:border-[#059669]"
              />
              <Button
                type="primary"
                class="h-auto self-end rounded-xl border-none bg-[#0F172A] px-5 py-2 text-xs font-bold hover:bg-[#1E293B]"
                @click="postComment"
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 关联实体穿透 Drawer -->
    <EntityContextDrawer
      v-model:open="entityDrawerOpen"
      :entity="selectedEntity"
    />

    <!-- 事项详情 Drawer -->
    <WorkItemDetailDrawer
      v-model:open="detailDrawerOpen"
      :item="activeDetailItem"
    />
  </Modal>
</template>

<style scoped>
.weekly-report-full-modal {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
