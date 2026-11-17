<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Select, Tag, message } from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type OpportunityType = '新签' | '续约' | '增购';
type SettlementStatus = '待复核' | '已确认' | '已结算';

interface CommissionRecord {
  amount: string;
  base: string;
  commission: string;
  customer: string;
  id: string;
  owner: string;
  sourceReward: string;
  status: SettlementStatus;
  type: OpportunityType;
}

const records = ref<CommissionRecord[]>([
  { id: 'p-001', customer: '西部交通投资集团', type: '新签', owner: '韩立', amount: '¥1,200,000', base: '¥1,200,000', commission: '¥60,000', sourceReward: '¥0', status: '待复核' },
  { id: 'p-002', customer: '华南医药连锁', type: '续约', owner: '陈晨', amount: '¥860,000', base: '¥860,000', commission: '¥25,800', sourceReward: '¥0', status: '已确认' },
  { id: 'p-003', customer: '华东能源装备集团', type: '增购', owner: '韩立', amount: '¥680,000', base: '¥680,000', commission: '¥34,000', sourceReward: '¥0', status: '已结算' },
  { id: 'p-004', customer: '云港物流科技', type: '新签', owner: '陈晨', amount: '¥150,000', base: '¥150,000', commission: '¥7,500', sourceReward: '¥1,500', status: '待复核' },
  { id: 'p-005', customer: '南方智造研究院', type: '续约', owner: '林晓', amount: '¥320,000', base: '¥320,000', commission: '¥9,600', sourceReward: '¥0', status: '已结算' },
]);

const period = ref('2026-09');
const typeFilter = ref<'全部' | OpportunityType>('全部');
const drawerOpen = ref(false);
const selected = ref<CommissionRecord | null>(null);

const visibleRecords = computed(() => records.value.filter((record) => typeFilter.value === '全部' || record.type === typeFilter.value));

function openRecord(record: CommissionRecord) {
  selected.value = record;
  drawerOpen.value = true;
}

function exportStatement() {
  message.success('已生成本月业绩与提成明细，可在对话中发送给财务复核');
}

function confirmRecord() {
  if (selected.value) {
    selected.value.status = '已确认';
    message.success('已确认该条业绩，等待月度结算');
  }
}
</script>

<template>
  <AiWorkPage
    class="performance-page"
    eyebrow="SALES PERFORMANCE"
    icon="lucide:badge-dollar-sign"
    title="绩效提成"
    description="按新签、续约、增购区分业绩口径，展示计算依据、来源奖励和人工复核状态。"
  >
    <template #actions>
      <Select v-model:value="period" class="period" :options="[{ value: '2026-09', label: '2026 年 9 月' }, { value: '2026-08', label: '2026 年 8 月' }]" />
      <Button @click="exportStatement"><Icon icon="lucide:file-down" />导出明细</Button>
    </template>

    <section class="rule-banner"><span><Icon icon="lucide:calculator" /></span><div><strong>当前采用：销售提成规则 V0.3</strong><p>默认按实际回款额、不含税口径计算；新签与增购 5%，续约 3%。涉及市场来源奖励时，系统从销售端提成中拆分 1%。</p></div><Tag color="green">AI 可解释</Tag></section>

    <section class="summary-grid"><article><small>本月回款业绩</small><strong>¥2,148,000</strong><span><Icon icon="lucide:trending-up" />较上月 +18.6%</span></article><article><small>预计销售提成</small><strong>¥136,900</strong><span>5 条业绩记录</span></article><article><small>待人工复核</small><strong>2 条</strong><span class="warn">来源和合同待确认</span></article><article><small>市场来源奖励</small><strong>¥1,500</strong><span>已从销售提成拆分</span></article></section>

    <section class="toolbar"><div class="type-tabs"><button :class="{ active: typeFilter === '全部' }" @click="typeFilter = '全部'">全部 <em>5</em></button><button :class="{ active: typeFilter === '新签' }" @click="typeFilter = '新签'">新签 <em>2</em></button><button :class="{ active: typeFilter === '续约' }" @click="typeFilter = '续约'">续约 <em>2</em></button><button :class="{ active: typeFilter === '增购' }" @click="typeFilter = '增购'">增购 <em>1</em></button></div><span class="result-count">口径：实际回款额 · 不含税</span></section>

    <section class="statement-list"><header><span>客户 / 负责人</span><span>类型</span><span>回款金额</span><span>销售提成</span><span>来源奖励</span><span>状态</span><span></span></header><button v-for="record in visibleRecords" :key="record.id" class="statement-row" @click="openRecord(record)"><div class="customer"><strong>{{ record.customer }}</strong><span>{{ record.owner }} · {{ record.id }}</span></div><Tag :color="record.type === '续约' ? 'purple' : record.type === '增购' ? 'cyan' : 'blue'">{{ record.type }}</Tag><strong class="amount">{{ record.amount }}</strong><strong class="commission">{{ record.commission }}</strong><span class="source-reward">{{ record.sourceReward === '¥0' ? '—' : record.sourceReward }}</span><Tag :color="record.status === '已结算' ? 'green' : record.status === '已确认' ? 'blue' : 'orange'">{{ record.status }}</Tag><Icon class="row-arrow" icon="lucide:chevron-right" /></button></section>

    <section class="explain-grid"><article><header><Icon icon="lucide:split" /><strong>提成拆分示例</strong></header><div><span>公司级商机成交</span><strong>销售 5%</strong><em>其中 1% → 市场部</em></div><div><span>私人关系报备</span><strong>销售 5%</strong><em>来源人直接获得</em></div></article><article><header><Icon icon="lucide:info" /><strong>AI 在结算中的作用</strong></header><p>AI 从合同、回款和报备中提取计算依据，标出新签 / 续约 / 增购差异；金额异常、规则缺口和人工裁决不会自动结算。</p><Button type="link" @click="message.success('已在对话中打开结算规则解释')">询问 AI 解释规则 <Icon icon="lucide:arrow-up-right" /></Button></article></section>

    <Drawer v-model:open="drawerOpen" :width="520" title="业绩与提成明细" destroy-on-close>
      <template v-if="selected">
        <section class="drawer-title"><span><Icon icon="lucide:receipt-text" /></span><div><small>{{ selected.type }} · {{ selected.status }}</small><h2>{{ selected.customer }}</h2><p>{{ selected.owner }} · 回款 {{ selected.amount }}</p></div></section>
        <section class="calc-card"><header><strong>AI 计算结果</strong><Tag color="green">可解释</Tag></header><div class="calc-row"><span>业绩基数</span><strong>{{ selected.base }}</strong><small>实际回款额 · 不含税</small></div><div class="calc-row"><span>适用比例</span><strong>{{ selected.type === '续约' ? '3%' : '5%' }}</strong><small>{{ selected.type }}规则</small></div><div class="calc-row total"><span>销售提成</span><strong>{{ selected.commission }}</strong><small>由销售制度 V0.3 计算</small></div><div v-if="selected.sourceReward !== '¥0'" class="calc-row"><span>市场来源奖励</span><strong>{{ selected.sourceReward }}</strong><small>从销售端提成中拆分 1%</small></div></section>
        <section class="evidence"><header><strong>计算依据</strong><Tag color="blue">已关联 4 项材料</Tag></header><div><Icon icon="lucide:file-check-2" /><span>已签署合同 · 2026-09-12</span><Tag color="green">已核验</Tag></div><div><Icon icon="lucide:landmark" /><span>回款流水 · 2026-09-18</span><Tag color="green">已核验</Tag></div><div><Icon icon="lucide:clipboard-check" /><span>商机报备记录 · 2026-08-30</span><Tag color="green">已核验</Tag></div><div><Icon icon="lucide:route" /><span>{{ selected.type }}流程模板 V0.3</span><Tag color="blue">适用规则</Tag></div></section>
        <section class="ai-note"><Icon icon="lucide:sparkles" /><div><strong>需要人工确认的地方</strong><p>{{ selected.status === '待复核' ? '来源类型或合同回款信息仍有一项待确认，AI 不会直接将这条记录结算。' : '当前记录已通过人工复核，若合同发生退款或变更需重新计算。' }}</p></div></section>
      </template>
      <template #footer><div class="drawer-footer"><span><Icon icon="lucide:history" />规则版本 V0.3 · {{ period }}</span><Button @click="drawerOpen = false">关闭</Button><Button v-if="selected?.status === '待复核'" type="primary" @click="confirmRecord"><Icon icon="lucide:check" />确认复核</Button></div></template>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.performance-page { --green: #287461; }.period { width: 130px; }.rule-banner { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 12px; margin-bottom: 9px; background: #eef7f3; border: 1px solid #d3e7df; border-radius: 10px; }.rule-banner > span { display: grid; width: 36px; height: 36px; place-items: center; color: #fff; background: #287461; border-radius: 9px; }.rule-banner strong, .rule-banner p { display: block; }.rule-banner strong { font-size: 12px; color: #35584c; }.rule-banner p { margin: 3px 0 0; font-size: 12px; line-height: 1.45; color: #74867f; }.rule-banner :deep(.ant-tag) { margin: 0; font-size: 12px; white-space: nowrap; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 9px; }.summary-grid article { padding: 10px 11px; background: #fff; border: 1px solid #dce7e3; border-radius: 10px; }.summary-grid small, .summary-grid strong, .summary-grid span { display: block; }.summary-grid small, .summary-grid span { font-size: 12px; color: #889791; }.summary-grid strong { margin: 5px 0 3px; font-size: 18px; color: #3c564e; }.summary-grid span { display: flex; gap: 4px; align-items: center; }.summary-grid span :deep(svg) { color: #287461; }.summary-grid span.warn { color: #aa6640; }
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 6px; margin-bottom: 8px; background: #fff; border: 1px solid #dce7e3; border-radius: 10px; }.type-tabs { display: flex; gap: 2px; }.type-tabs button { padding: 6px 11px; font-size: 12px; color: #6d8078; cursor: pointer; background: transparent; border: 0; border-radius: 6px; }.type-tabs button.active { color: #225f50; background: #e9f4f0; }.type-tabs em { margin-left: 3px; font-size: 12px; font-style: normal; color: #91a09b; }.result-count { font-size: 12px; color: #83928d; }.statement-list { overflow: auto; background: #fff; border: 1px solid #dce7e3; border-radius: 11px; }.statement-list > header, .statement-row { display: grid; grid-template-columns: minmax(230px, 1.45fr) 70px 115px 105px 95px 80px 22px; gap: 9px; align-items: center; min-width: 900px; padding: 8px 11px; }.statement-list > header { position: sticky; top: 0; z-index: 1; font-size: 12px; font-weight: 700; color: #71837c; background: #f4f7f6; border-bottom: 1px solid #dfe8e5; }.statement-row { width: 100%; text-align: left; cursor: pointer; background: #fff; border: 0; border-bottom: 1px solid #edf1ef; }.statement-row:hover { background: #f4faf7; }.statement-row :deep(.ant-tag) { width: max-content; margin: 0; font-size: 12px; line-height: 18px; }.customer, .customer strong, .customer span { display: block; }.customer strong { overflow: hidden; font-size: 12px; color: #334e45; text-overflow: ellipsis; white-space: nowrap; }.customer span { margin-top: 2px; font-size: 12px; color: #899791; }.amount, .commission { font-size: 12px; }.amount { color: #536861; }.commission { color: #a35e38; }.source-reward { font-size: 12px; color: #687a73; }.row-arrow { color: #a3b0ab; }.explain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 9px; }.explain-grid article { padding: 11px; background: #fff; border: 1px solid #dce7e3; border-radius: 10px; }.explain-grid header { display: flex; gap: 7px; align-items: center; margin-bottom: 8px; color: #287461; }.explain-grid header strong { font-size: 12px; color: #425851; }.explain-grid article > div { display: grid; grid-template-columns: 1fr auto auto; gap: 7px; align-items: center; padding: 7px 0; border-top: 1px solid #edf1ef; }.explain-grid article > div span, .explain-grid article > div strong, .explain-grid article > div em { font-size: 12px; font-style: normal; }.explain-grid article > div span { color: #74867f; }.explain-grid article > div strong { color: #a35e38; }.explain-grid article > div em { color: #8f9d98; }.explain-grid p { margin: 0; font-size: 12px; line-height: 1.55; color: #72857d; }.explain-grid :deep(.ant-btn-link) { padding-inline: 0; font-size: 12px; }
.drawer-title { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 10px; align-items: center; padding: 13px; background: #eff7f4; border: 1px solid #d7ebe3; border-radius: 11px; }.drawer-title > span { display: grid; width: 40px; height: 40px; place-items: center; font-size: 18px; color: #fff; background: #287461; border-radius: 10px; }.drawer-title small, .drawer-title p { font-size: 12px; color: #7d9088; }.drawer-title h2 { margin: 3px 0; font-size: 16px; color: #355247; }.drawer-title p { margin: 0; }.calc-card, .evidence { margin-top: 12px; overflow: hidden; border: 1px solid #e0e8e5; border-radius: 10px; }.calc-card header, .evidence header { display: flex; align-items: center; justify-content: space-between; padding: 10px 11px; background: #f5f8f7; }.calc-card header strong, .evidence header strong { font-size: 12px; color: #425851; }.calc-card :deep(.ant-tag), .evidence :deep(.ant-tag) { margin: 0; font-size: 12px; }.calc-row { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; padding: 10px 11px; border-top: 1px solid #e8eeec; }.calc-row span, .calc-row strong, .calc-row small { display: block; }.calc-row span { font-size: 12px; color: #7d8e87; }.calc-row strong { font-size: 13px; color: #a35e38; }.calc-row small { grid-column: 1 / -1; font-size: 12px; color: #99a49f; }.calc-row.total { background: #fff8f1; }.calc-row.total span { color: #80644d; }.calc-row.total strong { font-size: 16px; }.evidence > div { display: grid; grid-template-columns: 20px 1fr auto; gap: 7px; align-items: center; padding: 9px 11px; border-top: 1px solid #e8eeec; }.evidence > div > svg { color: #287461; }.evidence > div span { font-size: 12px; color: #677b73; }.ai-note { display: flex; gap: 8px; padding: 10px; margin-top: 11px; color: #8c673e; background: #fff7ed; border-radius: 9px; }.ai-note strong, .ai-note p { display: block; }.ai-note strong { font-size: 12px; color: #75543b; }.ai-note p { margin: 3px 0 0; font-size: 12px; line-height: 1.45; color: #917b66; }.drawer-footer { display: flex; gap: 8px; align-items: center; padding-top: 12px; border-top: 1px solid #e1e9e6; }.drawer-footer > span { display: flex; flex: 1; gap: 5px; align-items: center; font-size: 12px; color: #899691; }
@media (max-width: 900px) { .summary-grid { grid-template-columns: repeat(2, 1fr); }.explain-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr; }.toolbar { flex-wrap: wrap; }.result-count { width: 100%; } }
</style>
