<!-- 实体关联标签（Context Layer：极简 Pill 风格，无炫彩粗框） -->
<script setup lang="ts">
import type { AiWorkEntities } from '#/types/ai-work';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';

const props = withDefaults(
  defineProps<{
    /** 是否可点击穿透（默认 true） */
    clickable?: boolean;
    entities?: AiWorkEntities;
    /** 是否显示分组标题（默认显示）；紧凑场景可关闭 */
    showGroupTitle?: boolean;
    /** 风格模式：minimal (极简灰色轻巧 Pill) vs default (包含边框) */
    variant?: 'default' | 'minimal';
  }>(),
  {
    clickable: true,
    entities: undefined,
    showGroupTitle: true,
    variant: 'minimal',
  },
);

const emit = defineEmits<{
  (e: 'pick', payload: { name: string; type: keyof AiWorkEntities }): void;
}>();

interface EntityGroup {
  key: keyof AiWorkEntities;
  icon: string;
  label: string;
  color: string;
  values: string[];
}

const groups = computed<EntityGroup[]>(() => {
  const e = props.entities ?? {};
  return (
    [
      {
        key: 'projects',
        icon: 'lucide:briefcase-business',
        label: '项目',
        color: '#722ED1',
        values: e.projects ?? [],
      },
      {
        key: 'customers',
        icon: 'lucide:building-2',
        label: '客户',
        color: '#1677FF',
        values: e.customers ?? [],
      },
      {
        key: 'products',
        icon: 'lucide:layers',
        label: '产品',
        color: '#16A34A',
        values: e.products ?? [],
      },
      {
        key: 'people',
        icon: 'lucide:user-round',
        label: '人员',
        color: '#EA580C',
        values: e.people ?? [],
      },
    ] as EntityGroup[]
  ).filter((g) => g.values.length > 0);
});

const isClickable = computed(() => props.clickable !== false);

// 紧凑模式扁平化标签列表
interface CompactTag {
  key: string;
  value: string;
  icon: string;
  color: string;
  group: EntityGroup;
}

const compactTags = computed<CompactTag[]>(() => {
  const result: CompactTag[] = [];
  for (const group of groups.value) {
    for (const value of group.values) {
      result.push({
        key: `${group.label}-${value}`,
        value,
        icon: group.icon,
        color: group.color,
        group,
      });
    }
  }
  return result;
});

function onClick(event: MouseEvent, group: EntityGroup, value: string) {
  if (!isClickable.value) return;
  event.stopPropagation();
  emit('pick', { type: group.key, name: value });
}
</script>

<template>
  <div
    v-if="groups.length > 0"
    class="entity-tags"
    :class="{ 'entity-tags--inline': !showGroupTitle }"
  >
    <!-- 分组模式 -->
    <template v-if="showGroupTitle">
      <div v-for="group in groups" :key="group.label" class="entity-group">
        <span class="entity-group__title" :style="{ color: group.color }">
          <Icon :icon="group.icon" />
          {{ group.label }}
        </span>
        <div class="entity-group__values">
          <template v-if="isClickable">
            <button
              v-for="value in group.values"
              :key="`${group.label}-${value}`"
              type="button"
              class="entity-tag entity-tag--clickable"
              :class="variant === 'minimal' ? 'entity-tag--minimal' : ''"
              @click.stop="onClick($event, group, value)"
            >
              <Icon
                :icon="group.icon"
                class="entity-icon"
                :style="{ color: group.color }"
              />
              {{ value }}
              <Icon icon="lucide:arrow-up-right" class="entity-tag__arrow" />
            </button>
          </template>
          <template v-else>
            <span
              v-for="value in group.values"
              :key="`${group.label}-${value}`"
              class="entity-tag"
              :class="variant === 'minimal' ? 'entity-tag--minimal' : ''"
            >
              <Icon
                :icon="group.icon"
                class="entity-icon"
                :style="{ color: group.color }"
              />
              {{ value }}
            </span>
          </template>
        </div>
      </div>
    </template>

    <!-- 紧凑/轻量模式：只保留高级灰底 Pill 标签，无强烈炫彩框 -->
    <template v-else>
      <template v-if="isClickable">
        <button
          v-for="tag in compactTags"
          :key="tag.key"
          type="button"
          class="entity-tag entity-tag--clickable"
          :class="variant === 'minimal' ? 'entity-tag--minimal' : ''"
          @click.stop="onClick($event, tag.group, tag.value)"
        >
          <Icon
            :icon="tag.icon"
            class="entity-icon"
            :style="{ color: tag.color }"
          />
          {{ tag.value }}
        </button>
      </template>
      <template v-else>
        <span
          v-for="tag in compactTags"
          :key="tag.key"
          class="entity-tag"
          :class="variant === 'minimal' ? 'entity-tag--minimal' : ''"
        >
          <Icon
            :icon="tag.icon"
            class="entity-icon"
            :style="{ color: tag.color }"
          />
          {{ tag.value }}
        </span>
      </template>
    </template>
  </div>
</template>

<style scoped>
.entity-tags {
  display: grid;
  gap: 6px;
}

/* 分组模式 */
.entity-group {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 8px;
  align-items: start;
}

.entity-group__title {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding-top: 2px;
  font-size: 11px;
  font-weight: 600;
}

.entity-group__title svg {
  width: 12px;
  height: 12px;
}

.entity-group__values {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* 标签共用基础 */
.entity-tags--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.entity-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 7px;
  font-size: 11px;
  border-radius: 6px;
  transition: all 0.15s;
}

/* 极简高级 Pill 样式 */
.entity-tag--minimal {
  color: #374151;
  background: #f3f4f6;
  border: 1px solid transparent;
}

button.entity-tag {
  font-family: inherit;
  cursor: pointer;
}

.entity-icon {
  flex: none;
  width: 12px;
  height: 12px;
}

.entity-tag--clickable:hover {
  color: #111827;
  background: #e5e7eb;
}

.entity-tag__arrow {
  width: 10px !important;
  height: 10px !important;
  color: #9ca3af;
}
</style>
