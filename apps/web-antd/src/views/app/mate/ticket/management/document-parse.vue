<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { DocumentParseResult, TicketPriority } from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Modal, Tag, Upload } from 'ant-design-vue';

import {
  mockDocumentParseResults,
  ticketPriorityLabel,
} from '#/api/mock-data-ticket';
import {
  reviewDocumentParseApi,
  uploadDocumentForParseApi,
} from '#/api/ticket';

const docs = ref<DocumentParseResult[]>([...mockDocumentParseResults]);
const uploading = ref(false);
const expandedId = ref<null | string>(null);

const stats = computed(() => ({
  total: docs.value.length,
  draft: docs.value.filter((d) => d.status === 'draft').length,
  confirmed: docs.value.filter((d) => d.status === 'confirmed').length,
  rejected: docs.value.filter((d) => d.status === 'rejected').length,
}));

function statusTag(status: string) {
  switch (status) {
    case 'confirmed': {
      return { color: 'green', text: '已确认' };
    }
    case 'draft': {
      return { color: 'orange', text: '待复核' };
    }
    case 'rejected': {
      return { color: 'red', text: '已驳回' };
    }
    default: {
      return { color: 'default', text: '未知' };
    }
  }
}

function priorityColor(priority: TicketPriority) {
  switch (priority) {
    case 'high': {
      return 'orange';
    }
    case 'medium': {
      return 'blue';
    }
    case 'urgent': {
      return 'red';
    }
    default: {
      return 'default';
    }
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

/** 模拟上传制度文件并自动解析 */
async function handleUpload(file: File) {
  uploading.value = true;
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toUpperCase() || '未知';
  try {
    const res = await uploadDocumentForParseApi(fileName, ext);
    docs.value.unshift(res.data!);
    message.success(`文件「${fileName}」已上传并解析完成，请人工复核`);
  } catch {
    message.error('上传失败，请重试');
  }
  uploading.value = false;
  return false;
}

/** 复核确认 */
const reviewModal = ref({
  open: false,
  doc: null as DocumentParseResult | null,
  approved: false,
  note: '',
});

function openReview(doc: DocumentParseResult, approved: boolean) {
  reviewModal.value = {
    open: true,
    doc,
    approved,
    note: '',
  };
}

async function confirmReview() {
  if (!reviewModal.value.doc) return;
  const { doc, approved, note } = reviewModal.value;
  const res = await reviewDocumentParseApi(doc.id, approved, note);
  if (res.data) {
    const idx = docs.value.findIndex((d) => d.id === doc.id);
    if (idx !== -1) {
      docs.value[idx] = res.data;
    }
    message.success(
      approved ? '已确认生效，规则与 SLA 已合并到正式配置' : '已驳回',
    );
  }
  reviewModal.value.open = false;
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden p-4">
    <!-- 页头 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:file-search" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">售后制度文件解析</h2>
      </div>
      <Upload
        :before-upload="handleUpload"
        :show-upload-list="false"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
      >
        <Button type="primary" :loading="uploading">
          <Icon icon="lucide:upload" class="size-4" />
          上传制度文件
        </Button>
      </Upload>
    </div>

    <!-- 统计卡片 -->
    <div class="mb-4 grid grid-cols-4 gap-3">
      <div class="rounded-lg bg-white p-3 shadow-sm">
        <div class="text-sm text-gray-500">总文件数</div>
        <div class="text-2xl font-bold">{{ stats.total }}</div>
      </div>
      <div class="rounded-lg bg-white p-3 shadow-sm">
        <div class="text-sm text-gray-500">待复核</div>
        <div class="text-2xl font-bold text-orange-500">
          {{ stats.draft }}
        </div>
      </div>
      <div class="rounded-lg bg-white p-3 shadow-sm">
        <div class="text-sm text-gray-500">已确认</div>
        <div class="text-2xl font-bold text-green-500">
          {{ stats.confirmed }}
        </div>
      </div>
      <div class="rounded-lg bg-white p-3 shadow-sm">
        <div class="text-sm text-gray-500">已驳回</div>
        <div class="text-2xl font-bold text-red-500">
          {{ stats.rejected }}
        </div>
      </div>
    </div>

    <!-- 解析结果列表 -->
    <div class="flex-1 overflow-auto">
      <div
        v-for="doc in docs"
        :key="doc.id"
        class="mb-3 rounded-lg bg-white shadow-sm"
      >
        <!-- 文件头部 -->
        <div
          class="flex cursor-pointer items-center justify-between p-4"
          @click="toggleExpand(doc.id)"
        >
          <div class="flex items-center gap-3">
            <Icon
              :icon="
                expandedId === doc.id
                  ? 'lucide:chevron-down'
                  : 'lucide:chevron-right'
              "
              class="size-4 text-gray-400"
            />
            <Icon icon="lucide:file-text" class="size-5 text-blue-500" />
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ doc.fileName }}</span>
                <Tag>{{ doc.fileType }}</Tag>
                <Tag :color="statusTag(doc.status).color">
                  {{ statusTag(doc.status).text }}
                </Tag>
              </div>
              <div class="mt-1 text-xs text-gray-400">
                上传时间：{{ doc.uploadedAt }} · 解析出
                {{ doc.ruleCount }} 条规则、{{ doc.slaCount }} 条 SLA
                <span v-if="doc.reviewedBy">
                  · 复核人：{{ doc.reviewedBy }}（{{ doc.reviewedAt }}）
                </span>
              </div>
            </div>
          </div>
          <div v-if="doc.status === 'draft'" class="flex gap-2">
            <Button
              size="small"
              type="primary"
              @click.stop="openReview(doc, true)"
            >
              <Icon icon="lucide:check" class="size-3.5" />
              确认生效
            </Button>
            <Button size="small" danger @click.stop="openReview(doc, false)">
              <Icon icon="lucide:x" class="size-3.5" />
              驳回
            </Button>
          </div>
        </div>

        <!-- 展开内容 -->
        <div v-if="expandedId === doc.id" class="border-t border-gray-100 p-4">
          <!-- 解析出的派单规则 -->
          <div class="mb-4">
            <h4 class="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Icon icon="lucide:list-checks" class="size-4" />
              派单规则（{{ doc.parsedRules.length }} 条）
            </h4>
            <div class="overflow-hidden rounded border border-gray-200">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left">条件</th>
                    <th class="px-3 py-2 text-left">派单目标</th>
                    <th class="px-3 py-2 text-left">优先级</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="rule in doc.parsedRules"
                    :key="rule.id"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2">{{ rule.condition }}</td>
                    <td class="px-3 py-2">{{ rule.target }}</td>
                    <td class="px-3 py-2">
                      <Tag :color="priorityColor(rule.priority)">
                        {{ ticketPriorityLabel(rule.priority) }}
                      </Tag>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 解析出的 SLA 配置 -->
          <div class="mb-4">
            <h4 class="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Icon icon="lucide:clock" class="size-4" />
              SLA 配置（{{ doc.parsedSlas.length }} 条）
            </h4>
            <div class="overflow-hidden rounded border border-gray-200">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left">名称</th>
                    <th class="px-3 py-2 text-left">优先级</th>
                    <th class="px-3 py-2 text-left">响应时效(h)</th>
                    <th class="px-3 py-2 text-left">解决时效(h)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="sla in doc.parsedSlas"
                    :key="sla.id"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2">{{ sla.name }}</td>
                    <td class="px-3 py-2">
                      <Tag :color="priorityColor(sla.priority)">
                        {{ ticketPriorityLabel(sla.priority) }}
                      </Tag>
                    </td>
                    <td class="px-3 py-2">{{ sla.responseHours }}</td>
                    <td class="px-3 py-2">{{ sla.resolveHours }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 复核备注 -->
          <div v-if="doc.reviewNote" class="text-sm text-gray-500">
            <Icon icon="lucide:message-square" class="size-4" />
            复核备注：{{ doc.reviewNote }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="docs.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-400"
      >
        <Icon icon="lucide:file-search" class="mb-2 size-12" />
        <p>暂无解析记录，请上传售后制度文件</p>
      </div>
    </div>

    <!-- 复核确认弹窗 -->
    <Modal
      v-model:open="reviewModal.open"
      :title="reviewModal.approved ? '确认生效' : '驳回解析结果'"
      @ok="confirmReview"
    >
      <div class="py-4">
        <p class="mb-2">文件：{{ reviewModal.doc?.fileName }}</p>
        <p class="mb-4 text-sm text-gray-500">
          {{
            reviewModal.approved
              ? '确认后将把解析出的派单规则与 SLA 配置合并到正式配置中，立即生效。'
              : '驳回后解析结果将标记为已驳回，不会影响正式配置。'
          }}
        </p>
        <textarea
          v-model="reviewModal.note"
          class="w-full rounded border border-gray-300 p-2 text-sm"
          rows="3"
          placeholder="请输入复核备注（可选）"
        ></textarea>
      </div>
    </Modal>
  </div>
</template>
