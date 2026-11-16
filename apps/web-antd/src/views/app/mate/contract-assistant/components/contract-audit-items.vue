<script setup lang="ts">
import type { ContractArchiveManagement } from '#/types/contract-assistant';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';

const props = defineProps<{ state: ContractArchiveManagement }>();
const items = computed(() => {
  if (!['issues', 'passed'].includes(props.state.auditStatus)) return [];
  if (props.state.auditItems?.length) return props.state.auditItems;
  return props.state.auditNote
    .split(/[；。\n]+/)
    .filter((text) => text.trim())
    .map((title) => {
      let status: 'blocked' | 'passed' | 'warning';
      if (props.state.auditStatus === 'issues') status = 'blocked';
      else if (/待|尚未|需核对/.test(title)) status = 'warning';
      else status = 'passed';
      return { title, status, detail: '', evidence: '' };
    });
});
const presentation = {
  passed: { icon: 'lucide:check', label: '通过' },
  blocked: { icon: 'lucide:x', label: '阻断' },
  warning: { icon: 'lucide:triangle-alert', label: '警告' },
  unknown: { icon: 'lucide:circle-help', label: '无法判断' },
};
</script>
<template>
  <template
    v-for="group in [
      {
        key: 'issues',
        items: items.filter((item) => item.status !== 'passed'),
      },
      {
        key: 'passed',
        items: items.filter((item) => item.status === 'passed'),
      },
    ]"
    :key="group.key"
  >
    <component
      :is="group.key === 'passed' ? 'details' : 'div'"
      v-if="group.items.length > 0"
    >
      <summary v-if="group.key === 'passed'" class="audit-passed-summary">
        已通过 {{ group.items.length }} 项，展开查看
      </summary>
      <ul v-if="group.items.length > 0" class="contract-audit-items">
        <li
          v-for="(item, index) in group.items"
          :key="index"
          :class="item.status"
        >
          <Icon
            :icon="presentation[item.status].icon"
            :aria-label="presentation[item.status].label"
          />
          <div>
            <strong>{{ item.title }}</strong>
            <p v-if="item.detail">{{ item.detail }}</p>
            <p v-if="item.evidence" class="audit-evidence">
              依据：{{ item.evidence }}
            </p>
          </div>
          <span>{{ presentation[item.status].label }}</span>
        </li>
      </ul>
    </component>
  </template>
  <p
    v-if="items.length === 0 && state.auditStatus === 'pending'"
    class="audit-passed-summary"
  >
    信息调整后需重新审核，确认建档时会自动审核。
  </p>
</template>
<style scoped>
.audit-passed-summary {
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  margin-top: 12px;
}
.contract-audit-items {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 12px 0;
  list-style: none;
}

.contract-audit-items li {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.contract-audit-items li > svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.contract-audit-items li > div {
  flex: 1;
  min-width: 0;
}

.contract-audit-items strong {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.contract-audit-items p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.contract-audit-items li > span {
  flex-shrink: 0;
  font-size: 12px;
}

.passed {
  color: #16a34a;
}

.blocked {
  color: #dc2626;
}

.warning {
  color: #d97706;
}
.unknown {
  color: #64748b;
}
.audit-evidence {
  font-size: 11px;
  color: #8a9a93;
}
</style>
