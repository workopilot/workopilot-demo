<!-- 事项侧滑详情抽屉（配色重构降噪版：遵循品牌主色 #0D6853 与收拢的状态语义色） -->
<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import type {
  AiWorkEntities,
  AiWorkMaterial,
  AiWorkTimelineLog,
  AiWorkWorkItem,
} from '#/types/ai-work';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Input,
  message,
  Radio,
  Tag,
  Upload,
} from 'ant-design-vue';

import EntityTags from './entity-tags.vue';
import MaterialList from './material-list.vue';

const props = defineProps<{
  item?: AiWorkWorkItem | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (
    e: 'pickEntity',
    payload: { name: string; type: keyof AiWorkEntities },
  ): void;
  (e: 'updateItem', item: AiWorkWorkItem): void;
}>();

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

// 规范统一的状态语义颜色映射 (未开始 | 进行中 | 已完成 | 已取消 | 暂停)
function getStatusTagStyle(status: string) {
  switch (status) {
    case '已取消': {
      return { bg: '#FFF0F0', color: '#D9363E', border: '#FFA39E' };
    }
    case '已完成': {
      return { bg: '#E8FFEA', color: '#165D25', border: '#B7EB8F' };
    }
    case '暂停': {
      return { bg: '#FFF7E6', color: '#D46B08', border: '#FFD591' };
    }
    case '未开始': {
      return { bg: '#F2F3F5', color: '#4E5969', border: '#E5E7EB' };
    }
    case '进行中': {
      return { bg: '#E8F3FF', color: '#1665D8', border: '#91CAFF' };
    }
    default: {
      return { bg: '#F2F3F5', color: '#4E5969', border: '#E5E7EB' };
    }
  }
}

// 补充进展表单状态
const showAddForm = ref(false);
const newProgressText = ref('');
const newStatus = ref('进行中');
const newFiles = ref<Array<{ name: string; size: string; type: string }>>([]);

const uploadProps: UploadProps = {
  beforeUpload: (file) => {
    let fileType: any = 'document';
    if (file.name.endsWith('.pdf')) {
      fileType = 'meeting';
    } else if (file.name.endsWith('.m4a') || file.name.endsWith('.mp3')) {
      fileType = 'audio';
    } else if (file.name.endsWith('.mp4') || file.name.endsWith('.mov')) {
      fileType = 'video';
    } else if (/\.(?:png|jpg|jpeg)$/i.test(file.name)) {
      fileType = 'image';
    }

    newFiles.value.push({
      name: file.name,
      type: fileType,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    });
    message.success(`已挂载新资料：${file.name}`);
    return false;
  },
  showUploadList: false,
};

function submitNewProgress() {
  if (!props.item) return;
  if (!newProgressText.value.trim() && newFiles.value.length === 0) {
    message.warning('请输入进展描述或上传补充资料');
    return;
  }

  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const addedMaterials: AiWorkMaterial[] = newFiles.value.map((f, idx) => {
    let duration: string | undefined;
    if (f.type === 'audio') {
      duration = '04:15';
    } else if (f.type === 'video') {
      duration = '03:10';
    }
    return {
      id: `mat-add-${Date.now()}-${idx}`,
      type: f.type as any,
      name: f.name,
      uploadedAt: dateStr,
      size: f.size,
      duration,
    };
  });

  const newLog: AiWorkTimelineLog = {
    id: `log-add-${Date.now()}`,
    weekLabel: '第 32 周 (最新补充)',
    date: dateStr,
    content:
      newProgressText.value ||
      `增加了 ${newFiles.value.length} 份阶段性补充资料。`,
    author: '张三 (当前用户)',
    statusTag: newStatus.value,
    materials: addedMaterials,
  };

  const updatedItem: AiWorkWorkItem = {
    ...props.item,
    status: newStatus.value,
    materials: [...(props.item.materials || []), ...addedMaterials],
    historyLogs: [newLog, ...(props.item.historyLogs || [])],
  };

  emit('updateItem', updatedItem);
  message.success('已成功补充进展与资料！');

  newProgressText.value = '';
  newFiles.value = [];
  showAddForm.value = false;
}

function onEntityPick(payload: { name: string; type: keyof AiWorkEntities }) {
  emit('pickEntity', payload);
}

watch(
  () => props.item,
  () => {
    showAddForm.value = false;
    newProgressText.value = '';
    newFiles.value = [];
  },
);
</script>

<template>
  <Drawer
    v-model:open="open"
    :width="540"
    placement="right"
    :title="null"
    class="work-detail-drawer"
  >
    <div v-if="item" class="drawer-container">
      <!-- 1. 顶部 Header 区块 -->
      <header class="detail-header">
        <div class="header-top-tags">
          <span class="date-chip">
            <Icon icon="lucide:calendar" class="size-3.5 text-[#86909C]" />
            {{ item.date }} ({{ item.weekday }})
          </span>
          <span v-if="item.isCommitment" class="commitment-badge">
            <Icon icon="lucide:flag" class="size-3" />
            上周承诺{{ item.delayWeeks ? ` (延期${item.delayWeeks}周)` : '' }}
          </span>

          <span
            class="status-semantic-tag"
            :style="{
              backgroundColor: getStatusTagStyle(item.status).bg,
              color: getStatusTagStyle(item.status).color,
              borderColor: getStatusTagStyle(item.status).border,
            }"
          >
            {{ item.status }}
          </span>
        </div>

        <h2 class="item-title">{{ item.title }}</h2>
      </header>

      <!-- 2. 基础属性与时间列表 -->
      <section class="info-section">
        <div
          class="grid grid-cols-2 gap-3 rounded-lg border border-[#E8E8E8] bg-[#F7F8FA] p-3 text-xs text-[#4E5969]"
        >
          <div>
            <span class="text-[#86909C]">创建时间:</span>
            <span class="ml-1 font-medium text-[#1D2129]">
              2026-07-30 (上周四)
            </span>
          </div>
          <div>
            <span class="text-[#86909C]">最近更新:</span>
            <span class="ml-1 font-medium text-[#1D2129]">
              2026-08-06 16:30 (本周)
            </span>
          </div>
          <div>
            <span class="text-[#86909C]">当前状态:</span>
            <span
              class="ml-1 font-semibold"
              :style="{ color: getStatusTagStyle(item.status).color }"
            >
              {{ item.status }}
            </span>
          </div>
          <div>
            <span class="text-[#86909C]">周报状态:</span>
            <span
              class="ml-1 font-medium"
              :class="item.inReport ? 'text-[#0D6853]' : 'text-[#D46B08]'"
            >
              {{ item.inReport ? '已纳入本周周报' : '未纳入周报' }}
            </span>
          </div>
        </div>

        <!-- 关联实体 -->
        <div v-if="item.entities" class="mt-3">
          <span class="mb-1.5 block text-xs font-medium text-[#86909C]">
            关联实体 (点击可穿透查看):
          </span>
          <EntityTags
            :entities="item.entities"
            :show-group-title="true"
            :clickable="true"
            @pick="onEntityPick"
          />
        </div>

        <!-- 事项概要描述 -->
        <div class="mt-3">
          <span class="mb-1 block text-xs font-medium text-[#86909C]">
            事项概要描述:
          </span>
          <div
            class="shadow-xs rounded-lg border border-[#E8E8E8] bg-white p-3 text-xs leading-relaxed text-[#4E5969]"
          >
            {{ item.summary }}
          </div>
        </div>
      </section>

      <!-- 3. 补充进展与上传资料按钮区 -->
      <section class="action-section my-2">
        <div class="flex items-center justify-between">
          <h3
            class="flex items-center gap-1.5 text-sm font-semibold text-[#1D2129]"
          >
            <Icon icon="lucide:history" class="size-4 text-[#0D6853]" />
            每周进展与资料演进 ({{ item.historyLogs?.length || 1 }} 周期)
          </h3>
          <Button
            size="small"
            type="primary"
            class="primary-brand-btn"
            @click="showAddForm = !showAddForm"
          >
            <Icon
              :icon="showAddForm ? 'lucide:x' : 'lucide:plus-circle'"
              class="mr-1 size-3.5"
            />
            {{ showAddForm ? '取消补充' : '补充本周进展/资料' }}
          </Button>
        </div>

        <!-- 补充进展表单 -->
        <div
          v-if="showAddForm"
          class="add-form-box mt-3 space-y-3 rounded-lg border border-[#0D6853]/30 bg-[#F7F8FA] p-3"
        >
          <div
            class="flex items-center gap-1 text-xs font-semibold text-[#1D2129]"
          >
            <Icon icon="lucide:sparkles" class="size-3.5 text-[#0D6853]" />
            追加本周进展说明与媒体资料
          </div>

          <div>
            <label class="mb-1 block text-xs text-[#4E5969]">
              更新进展描述:
            </label>
            <Input.TextArea
              v-model:value="newProgressText"
              :rows="3"
              placeholder="请输入本周最新进展..."
            />
          </div>

          <div>
            <label class="mb-1 block text-xs text-[#4E5969]">
              调整当前状态:
            </label>
            <Radio.Group
              v-model:value="newStatus"
              size="small"
              button-style="solid"
              class="flex flex-wrap gap-1"
            >
              <Radio.Button value="未开始">未开始</Radio.Button>
              <Radio.Button value="进行中">进行中</Radio.Button>
              <Radio.Button value="已完成">已完成</Radio.Button>
              <Radio.Button value="暂停">暂停</Radio.Button>
              <Radio.Button value="已取消">已取消</Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <label class="mb-1 block text-xs text-[#4E5969]">
              上传补充资料 (PDF会议纪要 / 录音 / 录屏 / 截图):
            </label>
            <Upload v-bind="uploadProps" class="w-full">
              <div
                class="cursor-pointer rounded-lg border border-dashed border-[#E8E8E8] bg-white p-2.5 text-center text-xs text-[#4E5969] hover:border-[#0D6853]"
              >
                <Icon
                  icon="lucide:cloud-upload"
                  class="mr-1 inline size-4 text-[#0D6853]"
                />
                点击挂载补充文件
              </div>
            </Upload>
            <div v-if="newFiles.length > 0" class="mt-1.5 flex flex-wrap gap-1">
              <Tag
                v-for="(f, i) in newFiles"
                :key="i"
                closable
                @close="newFiles.splice(i, 1)"
              >
                📎 {{ f.name }} ({{ f.size }})
              </Tag>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <Button size="small" @click="showAddForm = false">取消</Button>
            <Button
              size="small"
              type="primary"
              class="primary-brand-btn"
              @click="submitNewProgress"
            >
              保存并更新事项
            </Button>
          </div>
        </div>
      </section>

      <!-- 4. 历次更新时间轴 -->
      <section class="timeline-section mt-3">
        <div
          class="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-[#E8E8E8]"
        >
          <template v-if="item.historyLogs && item.historyLogs.length > 0">
            <div
              v-for="log in item.historyLogs"
              :key="log.id"
              class="shadow-xs relative flex flex-col gap-1.5 rounded-lg border border-[#E8E8E8] bg-white p-3"
            >
              <div
                class="absolute -left-5 top-3.5 size-2.5 rounded-full bg-[#0D6853] ring-4 ring-[#E8FFEA]"
              ></div>

              <div class="flex items-center justify-between">
                <span
                  class="flex items-center gap-1.5 text-xs font-semibold text-[#1D2129]"
                >
                  {{ log.weekLabel }}
                  <span class="font-normal text-[#86909C]">
                    ({{ log.date }})
                  </span>
                </span>
                <span
                  class="status-semantic-tag text-xs"
                  :style="{
                    backgroundColor: getStatusTagStyle(
                      log.statusTag || '进行中',
                    ).bg,
                    color: getStatusTagStyle(log.statusTag || '进行中').color,
                    borderColor: getStatusTagStyle(log.statusTag || '进行中')
                      .border,
                  }"
                >
                  {{ log.statusTag || '进展跟进' }}
                </span>
              </div>

              <p class="text-xs leading-relaxed text-[#4E5969]">
                {{ log.content }}
              </p>

              <div
                v-if="log.materials && log.materials.length > 0"
                class="mt-1 border-t border-[#F2F3F5] pt-1.5"
              >
                <span class="mb-1 block text-xs text-[#86909C]">
                  本阶段挂载资料:
                </span>
                <MaterialList :materials="log.materials" />
              </div>
            </div>
          </template>

          <template v-else>
            <div
              class="shadow-xs relative flex flex-col gap-1.5 rounded-lg border border-[#E8E8E8] bg-white p-3"
            >
              <div
                class="absolute -left-5 top-3.5 size-2.5 rounded-full bg-[#0D6853] ring-4 ring-[#E8FFEA]"
              ></div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-[#1D2129]">
                  初始采集创建 ({{ item.date }} {{ item.weekday }})
                </span>
                <span
                  class="status-semantic-tag"
                  style="
                    color: #165d25;
                    background-color: #e8ffea;
                    border-color: #b7eb8f;
                  "
                >
                  初始创建
                </span>
              </div>
              <p class="text-xs leading-relaxed text-[#4E5969]">
                {{ item.summary }}
              </p>
              <div
                v-if="item.materials && item.materials.length > 0"
                class="mt-1 border-t border-[#F2F3F5] pt-1.5"
              >
                <span class="mb-1 block text-xs text-[#86909C]">关联资料:</span>
                <MaterialList :materials="item.materials" />
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.drawer-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.primary-brand-btn {
  color: #fff !important;
  background-color: #0d6853 !important;
  border-color: #0d6853 !important;
}

.primary-brand-btn:hover {
  background-color: #095040 !important;
  border-color: #095040 !important;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f2f3f5;
}

.header-top-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.date-chip {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 500;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
}

.commitment-badge {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 500;
  color: #d46b08;
  background: #fff7e6;
  border-radius: 4px;
}

.new-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  font-size: 11px;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
}

.neutral-info-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-size: 11px;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
}

.status-semantic-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.item-title {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: #1d2129;
}
</style>
