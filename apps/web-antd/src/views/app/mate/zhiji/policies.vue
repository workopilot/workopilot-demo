<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { Select, Table, message } from 'ant-design-vue';
import { zhijiTypes } from '#/api/mock-zhiji';
import {
  reportApprovalPolicies,
  reportApprovalRuleOptions,
} from '#/api/mock-report-approval-policies';
import type { ReportApprovalRule } from '#/api/mock-report-approval-policies';
import type { ReportKind } from '#/types/zhiji';
const rows = computed(() => zhijiTypes.filter((type) => type.enabled));
const columns = [
  { title: '报告类型', key: 'type', width: 200 },
  { title: '多人审批通过策略', key: 'rule', width: 230 },
  { title: '规则说明', key: 'description' },
];
function update(kind: ReportKind, rule: ReportApprovalRule) {
  reportApprovalPolicies[kind] = rule;
  message.success('审批策略已更新，用于后续提交的报告');
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 管理策略</div>
        <h1>策略设置</h1>
        <p>统一配置各报告类型的多人审批规则，个人仅选择查看人员和审批人。</p>
      </div>
    </header>
    <section class="zj-panel approval-policy-panel">
      <h2><Icon icon="lucide:git-pull-request" />多人审批策略</h2>
      <Table
        :columns="columns"
        :data-source="rows"
        row-key="id"
        :pagination="false"
        :scroll="{ x: 760 }"
        ><template #bodyCell="{ column, record }"
          ><template v-if="column.key === 'type'"
            ><span class="policy-type"
              ><Icon :icon="record.icon" />{{ record.name }}</span
            ></template
          ><template v-else-if="column.key === 'rule'"
            ><Select
              :value="reportApprovalPolicies[record.id as ReportKind]"
              :options="reportApprovalRuleOptions"
              style="width: 180px"
              :aria-label="`${record.name}多人审批策略`"
              @change="
                (value) => update(record.id, value as ReportApprovalRule)
              " /></template
          ><template v-else-if="column.key === 'description'"
            ><span>{{
              reportApprovalPolicies[record.id as ReportKind] === 'all'
                ? '所有指定审批人均同意后通过。'
                : reportApprovalPolicies[record.id as ReportKind] === 'any'
                  ? '任一指定审批人同意即可通过。'
                  : '同意人数严格超过审批人总数的一半才通过。'
            }}</span
            ><small v-if="record.id === 'customer'"
              >客户报告仍必须经过运维负责人审批，才能对外分享。</small
            ></template
          ></template
        ></Table
      >
      <p class="policy-explanation">
        修改后自动保存，提交时记录策略快照；已提交报告不随策略修改而变化。审批人仍需评分并反馈。
      </p>
    </section>
  </section>
</template>
<style scoped>
.approval-policy-panel {
  padding: 22px;
}
.approval-policy-panel h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  margin: 0 0 20px;
}
.policy-type {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #4f745e;
}
.approval-policy-panel :deep(th) {
  background: #f3f8f5;
  color: #7a9183;
  font-size: 12px;
}
.approval-policy-panel :deep(td) {
  font-size: 13px;
  padding: 20px 16px;
}
small {
  display: block;
  color: #9a9e8e;
  font-size: 11px;
  margin-top: 6px;
}
.policy-explanation {
  color: #8b9b8f;
  font-size: 12px;
  margin: 18px 0 0;
  line-height: 1.8;
}
</style>
