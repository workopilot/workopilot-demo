<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ConfigProvider, theme } from 'ant-design-vue';
import ReportList from './report-list.vue';
import BusinessApprovalList from './components/BusinessApprovalList.vue';
import { businessApprovals } from '#/api/mock-business-approvals';
import { reviewWorkItems, reviewWorkState } from '#/api/mock-review-workspace';
const route = useRoute();
const router = useRouter();
const category = computed(() =>
  ['project', 'ticket'].includes(String(route.query.category))
    ? String(route.query.category)
    : 'report',
);
const tabs = computed(() => [
  {
    key: 'report',
    label: '汇报',
    count: reviewWorkItems.value.filter(
      (item) => reviewWorkState(item) === 'pending',
    ).length,
  },
  {
    key: 'project',
    label: '立项',
    count: businessApprovals.filter(
      (item) => item.kind === 'project' && item.status === 'pending',
    ).length,
  },
  {
    key: 'ticket',
    label: '工单',
    count: businessApprovals.filter(
      (item) => item.kind === 'ticket' && item.status === 'pending',
    ).length,
  },
]);
function switchCategory(key: string) {
  void router.replace({ query: { ...route.query, category: key } });
}
</script>
<template>
  <ConfigProvider
    :theme="{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#247d69',
        colorText: '#2b4738',
        colorBorder: '#d8e3dc',
      },
    }"
  >
    <section class="approval-center">
      <header class="center-header">
        <h1>审核中心</h1>
        <nav aria-label="审核业务类型">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="{ active: category === tab.key }"
            :aria-pressed="category === tab.key"
            @click="switchCategory(tab.key)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              aria-hidden="true"
            >
              <template v-if="tab.key === 'report'">
                <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" />
              </template>
              <template v-else-if="tab.key === 'project'">
                <path d="M3 7h7l2-3h9v16H3zM7 11h10M7 15h6" />
              </template>
              <template v-else>
                <path
                  d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4zM15 8v2m0 4v2"
                />
              </template>
            </svg>
            {{ tab.label
            }}<span :aria-label="`${tab.count}项待审批`">{{ tab.count }}</span>
          </button>
        </nav>
      </header>
      <div v-show="category === 'report'" class="center-content">
        <ReportList />
      </div>
      <BusinessApprovalList
        v-show="category === 'project'"
        kind="project"
        class="center-content"
      />
      <BusinessApprovalList
        v-show="category === 'ticket'"
        kind="ticket"
        class="center-content"
      />
    </section>
  </ConfigProvider>
</template>
<style scoped>
.approval-center {
  display: flex;
  flex: 1;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f5f7f5;
  border: 1px solid #e1e9e3;
  border-radius: 12px;
}
.center-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
  flex: none;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #dfe7e1;
}
.center-header h1 {
  margin: 0;
  color: #244932;
  font-size: 20px;
  font-weight: 650;
}
.center-header nav {
  display: flex;
  gap: 8px;
}
.center-header button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 16px;
  font-size: 14px;
  color: #4f6c5b;
  background: #eef4f0;
  border: 1px solid #dce7df;
  border-radius: 7px;
  cursor: pointer;
}
.center-header button.active {
  color: #fff;
  background: #24664e;
  border-color: #24664e;
  font-weight: 650;
}
.center-header button:not(.active):hover {
  background: #e2ece5;
}
.center-header button:focus-visible {
  outline: 2px solid #468b65;
  outline-offset: -2px;
}
.center-header svg {
  width: 18px;
  height: 18px;
}
.center-header button span {
  min-width: 22px;
  padding: 1px 6px;
  border-radius: 6px;
  background: #eef2ef;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.center-header button.active span {
  color: #fff;
  background: #ffffff24;
}
.center-content {
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  min-height: 0;
  border: 0;
  border-radius: 0;
}
.center-content :deep(.review-triage) {
  border: 0;
  border-radius: 0;
}
@media (max-width: 767px) {
  .center-header {
    padding: 12px;
    gap: 12px;
  }
  .center-header nav {
    gap: 6px;
  }
  .center-header button {
    padding-inline: 10px;
  }
}
</style>
