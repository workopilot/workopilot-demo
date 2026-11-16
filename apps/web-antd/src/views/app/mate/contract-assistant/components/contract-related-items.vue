<script setup lang="ts">
import type { ContractRelatedItem } from '#/types/contract-assistant';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Empty, Tag } from 'ant-design-vue';

const props = defineProps<{ items: ContractRelatedItem[] }>();
const definitions: {
  icon: string;
  name: string;
  source: string;
  type: ContractRelatedItem['type'];
}[] = [
  {
    type: 'project',
    name: '项目立项',
    source: '项目管理',
    icon: 'lucide:folder-kanban',
  },
  {
    type: 'invoice',
    name: '开票事项',
    source: '开票管理',
    icon: 'lucide:receipt-text',
  },
  {
    type: 'collection',
    name: '收款事项',
    source: '应收管理',
    icon: 'lucide:wallet',
  },
  {
    type: 'inspection',
    name: '巡检计划',
    source: '巡检管理',
    icon: 'lucide:clipboard-check',
  },
];
const executedItems = computed(() =>
  props.items.filter((item) => item.status !== 'pending'),
);
const stats = computed(() => [
  { label: '关联总数', value: executedItems.value.length, tone: '' },
  {
    label: '进行中',
    value: executedItems.value.filter((item) => item.status === 'in-progress')
      .length,
    tone: 'blue',
  },
  {
    label: '已完成',
    value: executedItems.value.filter((item) => item.status === 'completed')
      .length,
    tone: 'green',
  },
  {
    label: '已逾期',
    value: executedItems.value.filter((item) => item.status === 'overdue')
      .length,
    tone: 'amber',
  },
]);
const groups = computed(() =>
  definitions
    .map((group) => {
      const items = executedItems.value
        .filter((item) => item.type === group.type)
        .toSorted((a, b) => a.plannedDate.localeCompare(b.plannedDate));
      const completed =
        group.type === 'inspection'
          ? items.reduce(
              (sum, item) =>
                sum +
                (item.completedCount ?? (item.status === 'completed' ? 1 : 0)),
              0,
            )
          : items.filter((item) => item.status === 'completed').length;
      const totalCount =
        group.type === 'inspection'
          ? items.reduce((sum, item) => sum + (item.plannedCount ?? 1), 0)
          : items.length;
      const totalAmount = items.reduce(
        (sum, item) => sum + (item.amount || 0),
        0,
      );
      const completedAmount = items.reduce(
        (sum, item) => sum + (item.completedAmount || 0),
        0,
      );
      let percent: number;
      if (totalAmount)
        percent = Math.min(
          100,
          Math.round((completedAmount / totalAmount) * 100),
        );
      else if (totalCount) percent = Math.round((completed / totalCount) * 100);
      else percent = 0;
      return {
        ...group,
        items,
        completed,
        totalCount,
        totalAmount,
        completedAmount,
        percent,
        updatedAt: items
          .map((item) => item.updatedAt)
          .toSorted()
          .at(-1),
        nextDate: items.find((item) => item.status !== 'completed')
          ?.plannedDate,
      };
    })
    .filter((group) => group.items.length > 0),
);
const money = (value: number) =>
  `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function status(item: ContractRelatedItem) {
  if (item.status === 'overdue') return { label: '已逾期', color: 'orange' };
  if (item.status === 'in-progress') return { label: '进行中', color: 'blue' };
  if (item.status === 'completed')
    return {
      label: {
        project: '已立项',
        invoice: '已开票',
        collection: '已收款',
        inspection: '已完成',
      }[item.type],
      color: 'green',
    };
  return {
    label: {
      project: '待立项',
      invoice: '待开票',
      collection: '待收款',
      inspection: '待执行',
    }[item.type],
    color: 'default',
  };
}
</script>
<template>
  <div class="related-items">
    <Empty
      v-if="executedItems.length === 0"
      :image="Empty.PRESENTED_IMAGE_SIMPLE"
      description="暂无业务执行进展"
    />
    <div v-else class="progress-stats">
      <div v-for="stat in stats" :key="stat.label" :class="stat.tone">
        <span>{{ stat.label }}</span>
        <strong>
          {{ stat.value }}
          <small>项</small>
        </strong>
      </div>
    </div>
    <section v-for="group in groups" :key="group.type" class="related-group">
      <header class="group-heading">
        <span class="group-icon"><Icon :icon="group.icon" /></span>
        <h3>
          {{ group.name }}
          <small>{{ group.items.length }} 项</small>
        </h3>
        <span class="source">{{ group.source }}</span>
      </header>
      <template v-if="group.items.length > 0">
        <div class="group-summary">
          <div class="summary-line">
            <strong>
              {{
                group.type === 'invoice'
                  ? `已开票 ${money(group.completedAmount)} / ${money(group.totalAmount)}`
                  : group.type === 'collection'
                    ? `已到账 ${money(group.completedAmount)} / ${money(group.totalAmount)}`
                    : `已完成 ${group.completed} / ${group.totalCount} ${group.type === 'inspection' ? '次' : '项'}`
              }}
            </strong>
            <span>{{ group.percent }}%</span>
          </div>
          <div
            class="progress-track"
            role="progressbar"
            :aria-label="`${group.name}完成进度`"
            :aria-valuenow="group.percent"
            :aria-valuemin="0"
            :aria-valuemax="100"
          >
            <span :style="{ width: `${group.percent}%` }"></span>
          </div>
          <p v-if="group.type === 'collection'">
            剩余应收
            {{ money(Math.max(0, group.totalAmount - group.completedAmount)) }}
          </p>
          <p v-if="group.type === 'inspection' && group.nextDate">
            下次巡检日期 {{ group.nextDate }}
          </p>
        </div>
        <details class="group-details">
          <summary>
            <Icon icon="lucide:chevron-right" />
            <span>展开事项明细</span>
            <small>{{ group.items.length }} 项</small>
          </summary>
          <div class="item-list">
            <article
              v-for="item in group.items"
              :key="item.id"
              class="related-item"
            >
              <div class="item-heading">
                <h4>{{ item.name }}</h4>
                <Tag v-if="item.needsReview" color="orange">合同变更待核对</Tag>
                <Tag :color="status(item).color">{{ status(item).label }}</Tag>
              </div>
              <div class="item-meta">
                <span>
                  负责人
                  <strong>{{ item.owner || '待指定' }}</strong>
                </span>
                <span>
                  {{ item.type === 'collection' ? '应收日期' : '计划日期' }}
                  <strong>{{ item.plannedDate || '待确定' }}</strong>
                </span>
              </div>
              <div v-if="item.amount !== undefined" class="amount-details">
                <span>
                  {{ item.type === 'invoice' ? '计划开票' : '应收金额' }}
                  <strong>{{ money(item.amount) }}</strong>
                </span>
                <span>
                  {{ item.type === 'invoice' ? '已开票' : '已到账' }}
                  <strong>{{ money(item.completedAmount || 0) }}</strong>
                </span>
                <span v-if="item.type === 'collection'">
                  剩余金额
                  <strong>
                    {{
                      money(
                        Math.max(0, item.amount - (item.completedAmount || 0)),
                      )
                    }}
                  </strong>
                </span>
              </div>
              <p class="item-progress">{{ item.progress }}</p>
              <p v-if="item.reviewReason" class="item-progress">
                {{ item.reviewReason }}
              </p>
              <p class="item-updated">更新于 {{ item.updatedAt }}</p>
            </article>
          </div>
        </details>
        <footer>最近更新 {{ group.updatedAt }}</footer>
      </template>
      <div v-else class="group-empty">暂无关联事项</div>
    </section>
  </div>
</template>
<style scoped>
.related-items {
  display: grid;
  gap: 14px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 12px 0;
  background: #f8fbf9;
  border: 1px solid #e0eae4;
  border-radius: 10px;
}

.progress-stats > div {
  padding: 0 16px;
  border-right: 1px solid #e4ece7;
}

.progress-stats > div:last-child {
  border: 0;
}

.progress-stats span {
  display: block;
  font-size: 11px;
  color: #8b9c92;
}

.progress-stats strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 600;
  color: #3d5d4b;
}

.progress-stats small {
  margin-left: 5px;
  font-size: 10px;
  font-weight: 400;
  color: #9aa99f;
}

.progress-stats .blue strong {
  color: #5484ac;
}

.progress-stats .green strong {
  color: #418365;
}

.progress-stats .amber strong {
  color: #bb8b3e;
}

.related-group {
  overflow: hidden;
  border: 1px solid #e0eae4;
  border-radius: 12px;
}

.group-heading {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 13px 16px;
  background: #f7faf8;
  border-bottom: 1px solid #eaf0ec;
}

.group-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 17px;
  color: #508168;
  background: #e9f2ec;
  border-radius: 8px;
}

.group-heading h3 {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #3a5a47;
}

.group-heading h3 small {
  margin-left: 9px;
  font-size: 10px;
  font-weight: 400;
  color: #92a398;
}

.source {
  font-size: 10px;
  color: #94a49a;
}

.group-summary {
  padding: 16px 18px 4px;
}

.summary-line {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #789082;
}

.summary-line strong {
  font-size: 12px;
  font-weight: 500;
  color: #4b6b57;
}

.progress-track {
  height: 5px;
  margin-top: 10px;
  overflow: hidden;
  background: #edf3ef;
  border-radius: 4px;
}

.progress-track > span {
  display: block;
  height: 100%;
  background: #71a78b;
  border-radius: 4px;
}

.group-summary > p {
  margin-top: 10px;
  font-size: 11px;
  color: #8c9e92;
}

.group-details {
  margin: 10px 18px 0;
}

.group-details > summary {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 8px 0;
  font-size: 11px;
  color: #698875;
  cursor: pointer;
  list-style: none;
}

.group-details > summary::-webkit-details-marker {
  display: none;
}

.group-details > summary > svg {
  transition: transform 0.15s;
}

.group-details[open] > summary > svg {
  transform: rotate(90deg);
}

.group-details summary small {
  margin-left: auto;
  color: #9caaa1;
}

.group-details > summary:focus-visible {
  outline: 2px solid #78a28b;
  outline-offset: 2px;
  border-radius: 4px;
}

.item-list {
  display: grid;
  gap: 10px;
  padding: 4px 0;
}

.related-item {
  padding: 13px 14px;
  background: #fcfefc;
  border: 1px solid #e7eee9;
  border-radius: 9px;
}

.item-heading {
  display: flex;
  gap: 10px;
  align-items: center;
}

.item-heading h4 {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #466550;
  overflow-wrap: anywhere;
}

.item-heading :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.item-meta,
.amount-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 10px;
  font-size: 11px;
  color: #94a398;
}

.item-meta strong,
.amount-details strong {
  margin-left: 5px;
  font-weight: 400;
  color: #627e6b;
}

.item-progress {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.8;
  color: #718878;
}

.item-updated {
  margin-top: 7px;
  font-size: 10px;
  color: #a0ada4;
}

.related-group footer {
  padding: 10px 18px 12px;
  font-size: 10px;
  color: #a0ada4;
}

.group-empty {
  padding: 20px 18px;
  font-size: 12px;
  color: #a0ada4;
}

@media (max-width: 680px) {
  .progress-stats > div {
    padding: 0 10px;
  }

  .summary-line {
    flex-wrap: wrap;
  }

  .source {
    display: none;
  }
}
</style>
