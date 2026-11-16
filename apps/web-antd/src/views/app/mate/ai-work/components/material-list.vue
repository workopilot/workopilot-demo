<!-- 关联资料列表（文件/录音/图片/视频/文字），支持标准与极简无框模式 -->
<script setup lang="ts">
import type { AiWorkMaterial, AiWorkMaterialType } from '#/types/ai-work';

import { Icon } from '@iconify/vue';
import { message } from 'ant-design-vue';

withDefaults(
  defineProps<{
    materials?: AiWorkMaterial[];
    showLabel?: boolean;
    variant?: 'default' | 'minimal';
  }>(),
  {
    materials: () => [],
    showLabel: true,
    variant: 'minimal',
  },
);

const labelMap: Record<AiWorkMaterialType, string> = {
  audio: '录音',
  document: '文档',
  image: '截图/图片',
  meeting: '会议纪要',
  text: '文字',
  video: '录像',
};

// 根据文件拓展名/类型精准匹配 Icon 与色彩
function getMaterialStyle(material: AiWorkMaterial): {
  color: string;
  icon: string;
} {
  const name = (material.name || '').toLowerCase();

  if (
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    (material.type === 'document' && !name.includes('.'))
  ) {
    return { icon: 'lucide:file-text', color: '#2563EB' }; // Word 蓝色
  }
  if (name.endsWith('.pdf')) {
    return { icon: 'lucide:file-text', color: '#DC2626' }; // PDF 红色
  }
  if (
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.csv')
  ) {
    return { icon: 'lucide:file-spreadsheet', color: '#16A34A' }; // Excel 绿色
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return { icon: 'lucide:presentation', color: '#EA580C' }; // PPT 橙色
  }
  if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) {
    return { icon: 'lucide:archive', color: '#D97706' }; // 压缩包 琥珀色
  }
  if (
    material.type === 'image' ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.gif')
  ) {
    return { icon: 'lucide:image', color: '#9333EA' }; // 图片 紫色
  }
  if (
    material.type === 'video' ||
    name.endsWith('.mp4') ||
    name.endsWith('.mov')
  ) {
    return { icon: 'lucide:video', color: '#4F46E5' }; // 视频 靛蓝
  }
  if (
    material.type === 'audio' ||
    name.endsWith('.mp3') ||
    name.endsWith('.wav')
  ) {
    return { icon: 'lucide:audio-lines', color: '#059669' }; // 录音 绿色
  }
  if (material.type === 'meeting') {
    return { icon: 'lucide:notebook-pen', color: '#0891B2' }; // 会议 蓝绿
  }

  return { icon: 'lucide:file', color: '#6B7280' }; // 未知 灰色
}

function preview(material: AiWorkMaterial) {
  message.info(`预览资料：${material.name}（Demo 演示）`);
}
</script>

<template>
  <div v-if="materials && materials.length > 0" class="material-list">
    <span v-if="showLabel" class="material-list__label">
      📎 关联资料 ({{ materials.length }})
    </span>
    <div class="material-list__items">
      <button
        v-for="material in materials"
        :key="material.id"
        type="button"
        class="material-chip"
        :class="
          variant === 'minimal'
            ? 'material-chip--minimal'
            : 'material-chip--default'
        "
        @click="preview(material)"
      >
        <Icon
          :icon="getMaterialStyle(material).icon"
          class="material-chip__icon"
          :style="{ color: getMaterialStyle(material).color }"
        />
        <span class="material-chip__name">{{ material.name }}</span>
        <span v-if="material.duration" class="material-chip__meta">
          {{ material.duration }}
        </span>
        <span v-else-if="material.size > 0" class="material-chip__meta">
          {{ material.size }}
        </span>
        <span v-if="variant !== 'minimal'" class="material-chip__type">
          {{ labelMap[material.type] }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.material-list {
  display: grid;
  gap: 6px;
}

.material-list__label {
  font-size: 11px;
  color: #6b7280;
}

.material-list__items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.material-chip {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 3px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}

/* 极简高级模式：无重框线，灰色质感底 */
.material-chip--minimal {
  color: #374151;
  background: #f3f4f6;
  border: 1px solid transparent;
}

.material-chip--minimal:hover {
  color: #111827;
  background: #e5e7eb;
}

/* 默认模式 */
.material-chip--default {
  color: #4b5563;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.material-chip--default:hover {
  color: #0d6853;
  border-color: #0d6853;
}

.material-chip__icon {
  flex: none;
  width: 13px;
  height: 13px;
}

.material-chip__name {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  white-space: nowrap;
}

.material-chip__meta {
  font-size: 10px;
  color: #9ca3af;
}

.material-chip__type {
  padding: 0 4px;
  font-size: 10px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 4px;
}
</style>
