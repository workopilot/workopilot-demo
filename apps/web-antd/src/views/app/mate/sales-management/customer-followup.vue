<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Input,
  Select,
  Tag,
  message,
} from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type Ownership = 'private' | 'public';
type FollowupHealth = 'healthy' | 'attention' | 'urgent';

interface FollowupEntry {
  date: string;
  channel: string;
  content: string;
  result: string;
}

interface CustomerFollowup {
  amount: string;
  company: string;
  contact: string;
  daysNoProgress: number;
  health: FollowupHealth;
  id: string;
  lastFollowup: string;
  nextAction: string;
  owner: string;
  ownership: Ownership;
  stage: string;
  timeline: FollowupEntry[];
}

const customers = ref<CustomerFollowup[]>([
  {
    id: 'c-001',
    company: '华东能源装备集团',
    contact: '李雪 · 信息化总监',
    owner: '韩立',
    ownership: 'private',
    stage: '方案验证',
    health: 'healthy',
    lastFollowup: '今天 09:35',
    daysNoProgress: 0,
    nextAction: '周四安排 POC 复盘，确认验收指标和上线范围。',
    amount: '¥680,000',
    timeline: [
      { date: '今天 09:35', channel: '电话', content: '确认 POC 验收指标，客户同意周四复盘。', result: '有效跟进' },
      { date: '09-18 16:20', channel: '会议', content: '完成方案演示，客户补充了 3 项权限要求。', result: '推进阶段' },
    ],
  },
  {
    id: 'c-002',
    company: '北辰连锁零售有限公司',
    contact: '周凯 · 采购负责人',
    owner: '陈晨',
    ownership: 'private',
    stage: '商务报价',
    health: 'attention',
    lastFollowup: '3 天前',
    daysNoProgress: 3,
    nextAction: '补发含税报价和交付排期，周五前确认采购窗口。',
    amount: '¥420,000',
    timeline: [
      { date: '09-17 14:00', channel: '邮件', content: '客户要求拆分软件与服务报价。', result: '待报价' },
      { date: '09-12 11:15', channel: '电话', content: '客户认可方案，等待采购部门确认。', result: '有效跟进' },
    ],
  },
  {
    id: 'c-003',
    company: '南方智造研究院',
    contact: '赵航 · 项目负责人',
    owner: '林晓',
    ownership: 'public',
    stage: '需求确认',
    health: 'urgent',
    lastFollowup: '16 天前',
    daysNoProgress: 16,
    nextAction: '无有效进展，3 天后进入公海回收流程。',
    amount: '¥260,000',
    timeline: [
      { date: '09-04 10:30', channel: '微信', content: '发送需求确认表，客户暂未回复。', result: '单向触达' },
      { date: '08-28 15:10', channel: '会议', content: '完成首次需求访谈，待客户提供现状数据。', result: '有效跟进' },
    ],
  },
  {
    id: 'c-004',
    company: '西部交通投资集团',
    contact: '高宁 · 数字化负责人',
    owner: '韩立',
    ownership: 'private',
    stage: '合同签订',
    health: 'healthy',
    lastFollowup: '昨天 17:40',
    daysNoProgress: 1,
    nextAction: '等待法务返回合同评审意见，跟进付款节点。',
    amount: '¥1,200,000',
    timeline: [
      { date: '昨天 17:40', channel: '会议', content: '双方确认交付边界，合同进入法务评审。', result: '有效跟进' },
      { date: '09-15 09:20', channel: '电话', content: '确认首付款比例与上线时间。', result: '商务确认' },
    ],
  },
  {
    id: 'c-005',
    company: '云港物流科技',
    contact: '孙妍 · 业务副总',
    owner: '陈晨',
    ownership: 'public',
    stage: '报备与归属',
    health: 'attention',
    lastFollowup: '5 天前',
    daysNoProgress: 5,
    nextAction: '补充集团客户关系和来源凭证，再申请转为私有保护。',
    amount: '¥150,000',
    timeline: [
      { date: '09-15 13:05', channel: '对话报备', content: 'AI 已完成客户主体查重，等待来源证明。', result: '待补充' },
    ],
  },
]);

const scope = ref<'mine' | 'team'>('mine');
const ownership = ref<'all' | Ownership>('all');
const health = ref<'all' | FollowupHealth>('all');
const keyword = ref('');
const drawerOpen = ref(false);
const selected = ref<CustomerFollowup | null>(null);
const followupText = ref('');
const activeTab = ref<'overview' | 'timeline' | 'rules'>('overview');

const visibleCustomers = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return customers.value.filter((customer) => {
    const matchScope = scope.value === 'team' || customer.owner === '韩立';
    const matchOwnership = ownership.value === 'all' || customer.ownership === ownership.value;
    const matchHealth = health.value === 'all' || customer.health === health.value;
    const matchKeyword = !q || `${customer.company}${customer.contact}${customer.owner}`.toLowerCase().includes(q);
    return matchScope && matchOwnership && matchHealth && matchKeyword;
  });
});

const healthLabel: Record<FollowupHealth, string> = {
  healthy: '推进正常',
  attention: '需要关注',
  urgent: '即将回收',
};

function openCustomer(customer: CustomerFollowup) {
  selected.value = customer;
  activeTab.value = 'overview';
  followupText.value = '';
  drawerOpen.value = true;
}

function saveFollowup() {
  if (!selected.value || !followupText.value.trim()) {
    message.warning('请先输入本次跟进事实');
    return;
  }
  selected.value.timeline.unshift({
    date: '刚刚',
    channel: '对话记录',
    content: followupText.value.trim(),
    result: '待 AI 识别',
  });
  selected.value.daysNoProgress = 0;
  selected.value.lastFollowup = '刚刚';
  selected.value.health = 'healthy';
  followupText.value = '';
  message.success('跟进已记录，AI 将更新阶段与周报素材');
}

function askAi() {
  message.success('已生成下一次沟通提纲，可在对话中继续执行');
}
</script>

<template>
  <AiWorkPage
    class="followup-page"
    eyebrow="SALES EXECUTION"
    icon="lucide:users-round"
    title="客户跟进"
    description="销售只记录事实，AI 负责整理进度、识别缺口并提醒公海回收。"
  >
    <template #actions>
      <Tag color="green"><Icon icon="lucide:sparkles" /> AI 跟进助手已启用</Tag>
      <Button type="primary" @click="askAi"><Icon icon="lucide:wand-sparkles" />生成今日跟进建议</Button>
    </template>

    <section class="permission-bar">
      <span class="permission-icon"><Icon icon="lucide:shield-check" /></span>
      <div><strong>当前查看范围</strong><span>{{ scope === 'mine' ? '我的客户与商机' : '销售团队全部客户' }} · 销售总监可查看全部私有与公海客户</span></div>
      <div class="scope-switch"><button :class="{ active: scope === 'mine' }" @click="scope = 'mine'">我的</button><button :class="{ active: scope === 'team' }" @click="scope = 'team'">团队</button></div>
    </section>

    <section class="toolbar">
      <Input v-model:value="keyword" class="search" allow-clear placeholder="搜索客户、联系人或负责人"><template #prefix><Icon icon="lucide:search" /></template></Input>
      <Select v-model:value="ownership" class="select" :options="[{ value: 'all', label: '全部归属' }, { value: 'private', label: '私有客户' }, { value: 'public', label: '公海客户' }]" />
      <Select v-model:value="health" class="select" :options="[{ value: 'all', label: '全部状态' }, { value: 'healthy', label: '推进正常' }, { value: 'attention', label: '需要关注' }, { value: 'urgent', label: '即将回收' }]" />
      <span class="result-count">共 {{ visibleCustomers.length }} 个客户</span>
    </section>

    <section class="followup-list">
      <header><span>客户 / 联系人</span><span>归属</span><span>当前阶段</span><span>最近跟进</span><span>下一步</span><span>负责人</span><span></span></header>
      <button v-for="customer in visibleCustomers" :key="customer.id" class="followup-row" @click="openCustomer(customer)">
        <div class="customer-cell"><strong>{{ customer.company }}</strong><span>{{ customer.contact }} · {{ customer.amount }}</span></div>
        <Tag :color="customer.ownership === 'private' ? 'green' : 'gold'"><Icon :icon="customer.ownership === 'private' ? 'lucide:lock-keyhole' : 'lucide:globe-2'" />{{ customer.ownership === 'private' ? '私有' : '公海' }}</Tag>
        <Tag color="blue">{{ customer.stage }}</Tag>
        <div class="last-cell" :class="{ urgent: customer.health === 'urgent' }"><strong>{{ customer.lastFollowup }}</strong><span>{{ customer.daysNoProgress ? `${customer.daysNoProgress} 天无有效进展` : '已更新保护期' }}</span></div>
        <div class="next-cell"><Icon icon="lucide:corner-down-right" /><span>{{ customer.nextAction }}</span></div>
        <span class="owner">{{ customer.owner }}</span>
        <Icon class="row-arrow" icon="lucide:chevron-right" />
      </button>
      <div v-if="!visibleCustomers.length" class="empty"><Icon icon="lucide:search-x" /><strong>没有匹配的客户</strong><span>调整筛选条件后再试</span></div>
    </section>

    <Drawer v-model:open="drawerOpen" :width="620" title="客户跟进详情" destroy-on-close>
      <template v-if="selected">
        <section class="drawer-hero"><span class="hero-icon"><Icon icon="lucide:building-2" /></span><div><small>{{ selected.stage }} · {{ selected.owner }}</small><h2>{{ selected.company }}</h2><p>{{ selected.contact }} · {{ selected.amount }}</p></div><Tag :color="selected.ownership === 'private' ? 'green' : 'gold'">{{ selected.ownership === 'private' ? '私有客户' : '公海客户' }}</Tag></section>
        <section class="ai-card"><span><Icon icon="lucide:sparkles" /></span><div><small>AI 判断</small><strong>{{ healthLabel[selected.health] }}</strong><p>{{ selected.nextAction }}</p></div><Button size="small" @click="askAi">生成提纲</Button></section>
        <div class="detail-tabs"><button :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">跟进概况</button><button :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">沟通时间线</button><button :class="{ active: activeTab === 'rules' }" @click="activeTab = 'rules'">制度检查</button></div>

        <section v-if="activeTab === 'overview'" class="overview-tab">
          <div class="info-grid"><article><small>最近跟进</small><strong>{{ selected.lastFollowup }}</strong><span>{{ selected.daysNoProgress ? `${selected.daysNoProgress} 天未推进` : '保护期已更新' }}</span></article><article><small>当前阶段</small><strong>{{ selected.stage }}</strong><span>阶段资料 3 / 4</span></article><article><small>负责人</small><strong>{{ selected.owner }}</strong><span>销售范围匹配</span></article></div>
          <div class="record-box"><header><div><small>补充本次跟进事实</small><strong>记录后 AI 会更新阶段、周报和公海计时</strong></div><Tag>无需写巡访报告</Tag></header><Input.TextArea v-model:value="followupText" :rows="4" placeholder="例如：客户确认预算 80 万，周四安排采购评审，需补充付款节点说明" /><footer><span>建议包含：客户反馈 · 下一步动作 · 约定时间</span><Button type="primary" @click="saveFollowup"><Icon icon="lucide:send" />记录跟进</Button></footer></div>
        </section>
        <section v-else-if="activeTab === 'timeline'" class="timeline-tab"><article v-for="entry in selected.timeline" :key="`${entry.date}-${entry.content}`"><span class="timeline-dot"></span><div><header><strong>{{ entry.date }}</strong><Tag>{{ entry.channel }}</Tag><Tag color="green">{{ entry.result }}</Tag></header><p>{{ entry.content }}</p></div></article></section>
        <section v-else class="rules-tab"><article><Icon icon="lucide:timer-reset" /><div><strong>有效跟进规则</strong><p>有客户反馈、下一步动作和约定时间才会重置保护期。</p></div><Tag color="green">已满足</Tag></article><article><Icon icon="lucide:route" /><div><strong>阶段资料要求</strong><p>当前阶段还缺 1 项预算与采购计划，AI 会在推进前提醒。</p></div><Tag color="orange">缺 1 项</Tag></article><article><Icon icon="lucide:scale" /><div><strong>公海回收规则</strong><p>连续 15 天无有效进展将进入回收，回收前 3 天通知负责人。</p></div><Tag color="blue">自动检查</Tag></article></section>
      </template>
      <template #footer><div class="drawer-footer"><span><Icon icon="lucide:database" />来源：对话报备、跟进记录、阶段资料</span><Button @click="drawerOpen = false">关闭</Button><Button type="primary" @click="askAi"><Icon icon="lucide:bot" />让 AI 协助推进</Button></div></template>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.followup-page { --green: #287461; --ink: #304d45; }
.permission-bar { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 7px 9px; margin-bottom: 8px; background: #eef7f3; border: 1px solid #d3e7df; border-radius: 10px; }
.permission-icon { display: grid; width: 28px; height: 28px; place-items: center; color: #fff; background: #287461; border-radius: 8px; }
.permission-bar > div:nth-child(2) { display: flex; gap: 8px; align-items: center; min-width: 0; }.permission-bar strong { font-size: 12px; color: #3c5b52; }.permission-bar span { overflow: hidden; font-size: 12px; color: #70827b; text-overflow: ellipsis; white-space: nowrap; }
.scope-switch { display: flex; gap: 2px; padding: 2px; background: #dfece7; border-radius: 7px; }.scope-switch button { padding: 5px 9px; font-size: 12px; color: #667a72; cursor: pointer; background: transparent; border: 0; border-radius: 5px; }.scope-switch button.active { color: #225f50; background: #fff; box-shadow: 0 2px 7px rgb(37 75 64 / 8%); }
.toolbar { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; padding: 7px; margin-bottom: 8px; background: #fff; border: 1px solid #dce7e3; border-radius: 10px; }.search { flex: 1; min-width: 240px; max-width: 380px; }.select { width: 120px; }.result-count { margin-left: auto; font-size: 12px; color: #83928d; }
.followup-list { overflow: auto; background: #fff; border: 1px solid #dce7e3; border-radius: 11px; }.followup-list > header, .followup-row { display: grid; grid-template-columns: minmax(210px, 1.35fr) 90px 108px 122px minmax(210px, 1.4fr) 70px 22px; gap: 9px; align-items: center; min-width: 1080px; padding: 7px 11px; }.followup-list > header { position: sticky; top: 0; z-index: 1; font-size: 12px; font-weight: 700; color: #71837c; background: #f4f7f6; border-bottom: 1px solid #dfe8e5; }.followup-row { width: 100%; text-align: left; cursor: pointer; background: #fff; border: 0; border-bottom: 1px solid #edf1ef; }.followup-row:hover { background: #f4faf7; }.customer-cell, .last-cell, .next-cell { min-width: 0; }.customer-cell strong, .customer-cell span, .last-cell strong, .last-cell span, .next-cell span, .owner { display: block; overflow: hidden; font-size: 12px; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }.customer-cell strong { color: #304d45; }.customer-cell span, .last-cell span, .owner { margin-top: 2px; color: #889791; }.last-cell.urgent strong, .last-cell.urgent span { color: #b34f43; }.next-cell { display: flex; gap: 5px; align-items: center; }.next-cell svg { flex: none; color: #287461; }.next-cell span { color: #5e716a; }.row-arrow { color: #a3b0ab; }.followup-row :deep(.ant-tag) { width: max-content; margin: 0; font-size: 12px; line-height: 18px; white-space: nowrap; }.empty { display: flex; flex-direction: column; gap: 5px; align-items: center; padding: 46px; color: #91a09b; }.empty strong { font-size: 12px; color: #61766e; }.empty span { font-size: 12px; }
.drawer-hero { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 11px; align-items: center; padding: 14px; color: #fff; background: linear-gradient(125deg, #315f53, #234b42); border-radius: 12px; }.hero-icon { display: grid; width: 44px; height: 44px; place-items: center; font-size: 20px; color: #315f53; background: #d6eee6; border-radius: 11px; }.drawer-hero small { font-size: 12px; color: #b3dfd4; }.drawer-hero h2 { margin: 3px 0; font-size: 17px; color: #fff; }.drawer-hero p { margin: 0; font-size: 12px; color: #d2e3de; }.drawer-hero :deep(.ant-tag) { margin: 0; font-size: 12px; white-space: nowrap; }
.ai-card { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 11px; margin-top: 11px; background: #edf7f3; border: 1px solid #d3e9e1; border-radius: 10px; }.ai-card > span { display: grid; width: 36px; height: 36px; place-items: center; color: #fff; background: #287461; border-radius: 9px; }.ai-card small, .ai-card strong, .ai-card p { display: block; }.ai-card small { font-size: 12px; color: #287461; }.ai-card strong { margin-top: 2px; font-size: 12px; color: #3e554e; }.ai-card p { margin: 2px 0 0; font-size: 12px; line-height: 1.45; color: #71827b; }
.detail-tabs { display: flex; gap: 5px; padding: 4px; margin: 13px 0; background: #f0f5f3; border-radius: 9px; }.detail-tabs button { padding: 7px 12px; font-size: 12px; color: #6e8079; cursor: pointer; background: transparent; border: 0; border-radius: 7px; }.detail-tabs button.active { color: #215f50; background: #fff; box-shadow: 0 3px 8px rgb(35 75 64 / 7%); }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }.info-grid article { padding: 10px; background: #f7faf9; border: 1px solid #e1e9e6; border-radius: 9px; }.info-grid small, .info-grid strong, .info-grid span { display: block; }.info-grid small, .info-grid span { font-size: 12px; color: #8d9a96; }.info-grid strong { margin: 4px 0; font-size: 13px; color: #3e554e; }.record-box { padding: 11px; margin-top: 11px; border: 1px solid #dfe8e5; border-radius: 10px; }.record-box header, .record-box footer { display: flex; gap: 10px; align-items: center; justify-content: space-between; }.record-box header { margin-bottom: 8px; }.record-box header small, .record-box header strong { display: block; }.record-box header small { font-size: 12px; color: #8a9893; }.record-box header strong { margin-top: 2px; font-size: 12px; color: #425851; }.record-box footer { margin-top: 8px; }.record-box footer span { font-size: 12px; color: #8c9995; }.record-box :deep(textarea) { font-size: 12px; }.timeline-tab { display: grid; gap: 0; }.timeline-tab article { position: relative; display: grid; grid-template-columns: 18px 1fr; gap: 9px; padding-bottom: 16px; }.timeline-tab article:not(:last-child)::after { position: absolute; top: 16px; left: 6px; width: 1px; height: calc(100% - 7px); content: ''; background: #dce8e3; }.timeline-dot { z-index: 1; width: 13px; height: 13px; margin-top: 2px; background: #287461; border: 3px solid #d9efe8; border-radius: 50%; }.timeline-tab header { display: flex; gap: 6px; align-items: center; }.timeline-tab header strong { font-size: 12px; color: #536861; }.timeline-tab :deep(.ant-tag) { margin: 0; font-size: 12px; line-height: 18px; }.timeline-tab p { margin: 5px 0 0; font-size: 12px; line-height: 1.5; color: #71827b; }.rules-tab { display: grid; gap: 8px; }.rules-tab article { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; gap: 9px; align-items: center; padding: 11px; border: 1px solid #e0e8e5; border-radius: 9px; }.rules-tab article > svg { color: #287461; }.rules-tab strong, .rules-tab p { display: block; }.rules-tab strong { font-size: 12px; color: #425851; }.rules-tab p { margin: 3px 0 0; font-size: 12px; color: #7c8c86; }.rules-tab :deep(.ant-tag) { margin: 0; font-size: 12px; }.drawer-footer { display: flex; gap: 8px; align-items: center; padding-top: 12px; border-top: 1px solid #e1e9e6; }.drawer-footer > span { display: flex; flex: 1; gap: 5px; align-items: center; font-size: 12px; color: #899691; }
@media (max-width: 900px) { .permission-bar { grid-template-columns: 30px minmax(0, 1fr); }.scope-switch { grid-column: 2; width: max-content; }.result-count { width: 100%; margin-left: 0; } }
</style>
