<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, Pagination, Progress, Select, Tag, message } from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type DetailTab = 'followup' | 'overview' | 'rules' | 'stage';
type Health = 'attention' | 'blocked' | 'healthy';
type OpportunityType = '增购' | '新签' | '续约';
type Ownership = 'private' | 'public';
type Role = 'director' | 'sales';
type Scope = 'all' | 'mine' | 'public' | 'team';

interface Opportunity {
  aiNext: string;
  amount: number;
  company: string;
  contact: string;
  daysInStage: number;
  health: Health;
  id: string;
  lastFollowup: string;
  missingMaterials: string[];
  nextAction: string;
  owner: string;
  ownership: Ownership;
  poolDays: number;
  probability: number;
  product: string;
  source: string;
  stage: string;
  type: OpportunityType;
}

const router = useRouter();
const role = ref<Role>('director');
const scope = ref<Scope>('all');
const typeFilter = ref('全部类型');
const stageFilter = ref('全部阶段');
const healthFilter = ref('全部状态');
const keyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const drawerOpen = ref(false);
const detailTab = ref<DetailTab>('overview');
const selectedId = ref('opp-suzhou');

const stageTemplates: Record<OpportunityType, string[]> = {
  新签: ['报备与归属', '需求确认', '方案验证', '商务报价', '合同签订'],
  续约: ['续约识别', '服务复盘', '续约方案', '续约谈判', '续约签订'],
  增购: ['增购识别', '范围确认', '增购报价', '商务确认', '增购签订'],
};

const allStages = computed(() => [
  '全部阶段',
  ...new Set(Object.values(stageTemplates).flat()),
]);

const opportunities = ref<Opportunity[]>([
  {
    id: 'opp-suzhou', company: '苏州智造科技有限公司', product: '设备运维系统', type: '新签', stage: '报备与归属', amount: 80, probability: 15, owner: '待确认', ownership: 'private', source: '私人关系介绍', contact: '陈经理 · 信息部', lastFollowup: '今天 10:38', daysInStage: 0, poolDays: 15, health: 'attention', missingMaterials: ['商机来源证明', '销售范围主责确认'], nextAction: '补充张总身份，等待销售负责人确认主责', aiNext: '同集团存在进行中商机，且同时命中区域和行业负责人。建议先确认来源证明和主责，不要重复联系客户。',
  },
  {
    id: 'opp-ningde', company: '宁德新能源装备有限公司', product: '视觉检测扩容', type: '增购', stage: '范围确认', amount: 68, probability: 35, owner: '韩立', ownership: 'private', source: '客户主动咨询', contact: '林工 · 设备部', lastFollowup: '昨天 16:20', daysInStage: 4, poolDays: 11, health: 'healthy', missingMaterials: ['原范围差异表'], nextAction: '周五前确认新增相机数量和现场节拍', aiNext: '客户已明确新增产线，但尚未确认相机数量。建议携带原合同范围差异表完成需求确认。',
  },
  {
    id: 'opp-huadong', company: '华东智能制造集团', product: '工厂数字化平台', type: '新签', stage: '需求确认', amount: 120, probability: 30, owner: '公海待领取', ownership: 'public', source: '超期自动回收', contact: '赵总 · 信息中心', lastFollowup: '5 天前', daysInStage: 12, poolDays: 0, health: 'attention', missingMaterials: ['预算与采购计划', '客户决策链'], nextAction: '领取后 2 个工作日内联系客户并形成有效跟进', aiNext: '该客户因超过保护期未形成有效跟进进入公海。领取前请先检查所属区域和当前工作量。',
  },
  {
    id: 'opp-kunshan', company: '昆山精密部件有限公司', product: '运维服务续约', type: '续约', stage: '服务复盘', amount: 36, probability: 60, owner: '韩立', ownership: 'private', source: '原客户续约', contact: '周经理 · 生产部', lastFollowup: '今天 09:15', daysInStage: 6, poolDays: 14, health: 'healthy', missingMaterials: ['服务复盘材料'], nextAction: '准备年度服务成果和改进清单', aiNext: '客户表达了续约意愿，但对响应时效有异议。AI 已整理全年工单数据，建议在续约方案中加入服务改进承诺。',
  },
  {
    id: 'opp-wuxi', company: '无锡汽车电子有限公司', product: '质量检测系统', type: '新签', stage: '方案验证', amount: 95, probability: 55, owner: '陈立', ownership: 'private', source: '渠道推荐', contact: '孙工 · 质量部', lastFollowup: '3 天前', daysInStage: 18, poolDays: 6, health: 'blocked', missingMaterials: ['POC 验证记录', '售前投入审批'], nextAction: '确认客户测试数据，申请延长 POC 周期', aiNext: 'POC 因客户测试数据未提供而受阻，已超过阶段建议时限 3 天。建议生成延期申请并保留客户侧阻塞证据。',
  },
  {
    id: 'opp-shanghai', company: '上海智联物流有限公司', product: '仓储调度平台', type: '新签', stage: '商务报价', amount: 150, probability: 75, owner: '李伟', ownership: 'private', source: '销售自拓', contact: '徐总 · 运营中心', lastFollowup: '昨天 14:40', daysInStage: 5, poolDays: 12, health: 'attention', missingMaterials: ['折扣审批'], nextAction: '提交 12% 折扣特批', aiNext: '客户要求的折扣超出销售经理权限 4 个百分点。系统已准备审批材料，未经批准不能发送正式报价。',
  },
  {
    id: 'opp-changzhou', company: '常州动力科技有限公司', product: '设备数据平台', type: '增购', stage: '增购报价', amount: 42, probability: 80, owner: '韩立', ownership: 'private', source: '客户增购', contact: '高经理 · 数字化部', lastFollowup: '今天 11:05', daysInStage: 2, poolDays: 15, health: 'healthy', missingMaterials: [], nextAction: '发送已审批的增购报价', aiNext: '新增范围、价格权限和协作分配均已确认，可以发送正式报价并约定合同时间。',
  },
  {
    id: 'opp-hangzhou', company: '杭州智能装备股份有限公司', product: '智能审核平台', type: '新签', stage: '合同签订', amount: 210, probability: 90, owner: '韩立', ownership: 'private', source: '公司级商机', contact: '吴总 · 采购中心', lastFollowup: '今天 08:50', daysInStage: 7, poolDays: 15, health: 'attention', missingMaterials: ['非标付款条款审批', '销售转交清单'], nextAction: '完成非标账期审批并准备交付移交', aiNext: '合同已完成法务评审，但 90 天账期尚未获财务批准。建议今天完成特批，避免影响本周签署。',
  },
]);

const filteredOpportunities = computed(() => {
  const search = keyword.value.trim().toLowerCase();
  return opportunities.value.filter((item) => {
    if (role.value === 'sales' && item.ownership === 'private' && item.owner !== '韩立' && item.owner !== '待确认') return false;
    if (scope.value === 'mine' && (item.ownership !== 'private' || (item.owner !== '韩立' && item.owner !== '待确认'))) return false;
    if (scope.value === 'team' && (item.ownership !== 'private' || !['韩立', '李伟', '待确认'].includes(item.owner))) return false;
    if (scope.value === 'public' && item.ownership !== 'public') return false;
    if (typeFilter.value !== '全部类型' && item.type !== typeFilter.value) return false;
    if (stageFilter.value !== '全部阶段' && item.stage !== stageFilter.value) return false;
    if (healthFilter.value !== '全部状态' && item.health !== healthFilter.value) return false;
    return !search || `${item.company}${item.product}${item.owner}`.toLowerCase().includes(search);
  });
});
const paginatedOpportunities = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredOpportunities.value.slice(start, start + pageSize.value);
});
const selectedOpportunity = computed(() =>
  opportunities.value.find((item) => item.id === selectedId.value),
);
const currentStages = computed(() =>
  selectedOpportunity.value ? stageTemplates[selectedOpportunity.value.type] : [],
);
const healthLabel = (health: Health) => {
  if (health === 'healthy') return '正常';
  if (health === 'blocked') return '受阻';
  return '需关注';
};
const healthColor = (health: Health) => {
  if (health === 'healthy') return 'green';
  if (health === 'blocked') return 'red';
  return 'orange';
};

function openOpportunity(id: string) {
  selectedId.value = id;
  detailTab.value = 'overview';
  drawerOpen.value = true;
}

function changeRole(nextRole: Role) {
  role.value = nextRole;
  scope.value = nextRole === 'director' ? 'all' : 'mine';
  currentPage.value = 1;
}

function changeScope(nextScope: Scope) {
  scope.value = nextScope;
  currentPage.value = 1;
}

function askAi() {
  drawerOpen.value = false;
  void router.push('/app/mate/employee/sales-assistant/sales-chat');
  message.success('已带上当前商机上下文进入对话');
}
</script>

<template>
  <AiWorkPage
    class="opportunity-page"
    icon="lucide:list-filter"
    title="商机"
    description="面向大量客户的商机查询列表，按权限查看私有商机和公海客户，并根据不同商机类型执行各自流程。"
  >
    <template #actions>
      <Button @click="router.push('/app/mate/employee/sales-assistant/sales-chat')"><Icon icon="lucide:message-circle" />对话报备</Button>
      <Button type="primary" @click="message.info('已生成当前视图的销售进度汇报')"><Icon icon="lucide:file-chart-column" />生成进度汇报</Button>
    </template>

    <section class="permission-bar">
      <div class="role-icon"><Icon :icon="role === 'director' ? 'lucide:shield-check' : 'lucide:user-round'" /></div>
      <div><strong>{{ role === 'director' ? '销售总监视角' : '销售人员 · 韩立' }}</strong><span>{{ role === 'director' ? '可查看全公司私有商机与公海客户' : '可查看本人私有商机与公海客户' }}</span></div>
      <div class="role-switch"><button :class="{ active: role === 'sales' }" @click="changeRole('sales')">销售人员</button><button :class="{ active: role === 'director' }" @click="changeRole('director')">销售总监</button></div>
    </section>

    <section class="toolbar">
      <div class="scope-switch">
        <button :class="{ active: scope === 'mine' }" @click="changeScope('mine')"><Icon icon="lucide:user" />我的私有</button>
        <button v-if="role === 'director'" :class="{ active: scope === 'team' }" @click="changeScope('team')"><Icon icon="lucide:users" />本团队</button>
        <button v-if="role === 'director'" :class="{ active: scope === 'all' }" @click="changeScope('all')"><Icon icon="lucide:building-2" />全部商机</button>
        <button :class="{ active: scope === 'public' }" @click="changeScope('public')"><Icon icon="lucide:land-plot" />公海客户</button>
      </div>
      <Input.Search v-model:value="keyword" allow-clear placeholder="搜索客户、产品或负责人" class="search-box" />
      <Select v-model:value="typeFilter" :options="['全部类型','新签','续约','增购'].map((value) => ({ value }))" class="filter-select" />
      <Select v-model:value="stageFilter" :options="allStages.map((value) => ({ value }))" class="stage-select" />
      <Select v-model:value="healthFilter" :options="[{ value:'全部状态',label:'全部状态' },{ value:'healthy',label:'正常' },{ value:'attention',label:'需关注' },{ value:'blocked',label:'受阻' }]" class="filter-select" />
    </section>

    <section class="opportunity-list">
      <div class="list-summary"><div><Icon icon="lucide:list" /><strong>商机列表</strong><span>共 {{ filteredOpportunities.length }} 个</span></div><p>点击任意一行查看资料、跟进和制度依据</p></div>
      <header><span>客户与商机</span><span>归属</span><span>类型／流程</span><span>当前阶段</span><span>金额／概率</span><span>负责人</span><span>最近有效跟进</span><span>状态</span><span></span></header>
      <article v-for="item in paginatedOpportunities" :key="item.id" @click="openOpportunity(item.id)">
        <div class="customer-cell"><strong>{{ item.company }}</strong><span>{{ item.product }} · {{ item.id }}</span></div>
        <div><Tag :color="item.ownership === 'public' ? 'gold' : 'green'"><Icon :icon="item.ownership === 'public' ? 'lucide:land-plot' : 'lucide:lock-keyhole'" />{{ item.ownership === 'public' ? '公海' : '私有' }}</Tag></div>
        <div><Tag :color="item.type === '新签' ? 'blue' : item.type === '续约' ? 'purple' : 'cyan'">{{ item.type }}</Tag></div>
        <div class="stage-cell"><strong>{{ item.stage }}</strong><span>{{ item.daysInStage }} 天</span></div>
        <div class="amount-cell"><strong>{{ item.amount }} 万</strong><span>{{ item.probability }}%</span></div>
        <div class="owner-cell"><strong>{{ item.owner }}</strong><span>{{ item.source }}</span></div>
        <div class="followup-cell"><strong>{{ item.lastFollowup }}</strong><span :class="{ urgent: item.ownership === 'private' && item.poolDays <= 3 }">{{ item.ownership === 'private' ? `${item.poolDays} 天后回收` : '公海待领取' }}</span></div>
        <div class="status-cell"><Tag :color="healthColor(item.health)">{{ healthLabel(item.health) }}</Tag><span v-if="item.missingMaterials.length">缺 {{ item.missingMaterials.length }} 项</span></div>
        <Button type="text" size="small"><Icon icon="lucide:chevron-right" /></Button>
      </article>
      <div v-if="!paginatedOpportunities.length" class="list-empty"><Icon icon="lucide:search-x" /><strong>没有符合条件的商机</strong><span>请调整归属、类型或阶段筛选条件</span></div>
      <footer class="list-pagination"><span>每页 10 条，支持数百个客户分页查询</span><Pagination v-model:current="currentPage" v-model:page-size="pageSize" :total="filteredOpportunities.length" :show-size-changer="false" size="small" /></footer>
    </section>

    <Drawer v-model:open="drawerOpen" title="商机详情" :width="820" placement="right">
      <div v-if="selectedOpportunity" class="opportunity-drawer">
        <header class="drawer-hero">
          <div class="hero-icon"><Icon icon="lucide:building-2" /></div>
          <div><small>{{ selectedOpportunity.id }} · {{ selectedOpportunity.type }} · {{ selectedOpportunity.ownership === 'public' ? '公海客户' : '私有客户' }}</small><h2>{{ selectedOpportunity.company }}</h2><p>{{ selectedOpportunity.product }} · {{ selectedOpportunity.source }}</p></div>
          <div class="hero-amount"><small>预计金额</small><strong>{{ selectedOpportunity.amount }} 万</strong><Tag :color="healthColor(selectedOpportunity.health)">{{ healthLabel(selectedOpportunity.health) }}</Tag></div>
        </header>

        <section class="ai-next-card"><span><Icon icon="lucide:bot" /></span><div><small>AI 建议的下一步</small><h3>{{ selectedOpportunity.nextAction }}</h3><p>{{ selectedOpportunity.aiNext }}</p></div><Button type="primary" @click="askAi">在对话中处理</Button></section>

        <nav class="detail-tabs"><button v-for="tab in [{key:'overview',label:'概览'},{key:'stage',label:'阶段与资料'},{key:'followup',label:'跟进记录'},{key:'rules',label:'制度依据'}]" :key="tab.key" :class="{ active: detailTab === tab.key }" @click="detailTab = tab.key as DetailTab">{{ tab.label }}</button></nav>

        <section v-if="detailTab === 'overview'" class="overview-tab">
          <div class="info-grid"><article><small>当前阶段</small><strong>{{ selectedOpportunity.stage }}</strong><p>{{ selectedOpportunity.type }}流程 · 已进入 {{ selectedOpportunity.daysInStage }} 天</p></article><article><small>成交概率</small><strong>{{ selectedOpportunity.probability }}%</strong><Progress :percent="selectedOpportunity.probability" :show-info="false" size="small" /></article><article><small>客户归属</small><strong>{{ selectedOpportunity.ownership === 'public' ? '公海客户' : selectedOpportunity.owner }}</strong><p>{{ selectedOpportunity.ownership === 'public' ? '当前没有私有负责人' : '私有保护中' }}</p></article><article :class="{ urgent: selectedOpportunity.ownership === 'private' && selectedOpportunity.poolDays <= 3 }"><small>{{ selectedOpportunity.ownership === 'public' ? '领取规则' : '公海提醒' }}</small><strong>{{ selectedOpportunity.ownership === 'public' ? '符合范围可领取' : `${selectedOpportunity.poolDays} 天后` }}</strong><p>{{ selectedOpportunity.ownership === 'public' ? '领取后转为私有客户' : '有效跟进可重置计时' }}</p></article></div>
          <section class="business-context"><h3>业务信息</h3><div><span>商机来源</span><strong>{{ selectedOpportunity.source }}</strong></div><div><span>联系人</span><strong>{{ selectedOpportunity.contact }}</strong></div><div><span>最近跟进</span><strong>{{ selectedOpportunity.lastFollowup }}</strong></div><div><span>当前下一步</span><strong>{{ selectedOpportunity.nextAction }}</strong></div></section>
        </section>

        <section v-else-if="detailTab === 'stage'" class="stage-tab">
          <div class="process-note"><Icon icon="lucide:git-branch" /><div><strong>{{ selectedOpportunity.type }}商机专属流程</strong><p>不同商机类型使用不同阶段和资料要求，本页不会把它们放在同一个看板中比较。</p></div></div>
          <div class="stage-timeline"><div v-for="(stage,index) in currentStages" :key="stage" :class="{ done:index < currentStages.indexOf(selectedOpportunity.stage), active:stage === selectedOpportunity.stage }"><span><Icon v-if="index < currentStages.indexOf(selectedOpportunity.stage)" icon="lucide:check" /><template v-else>{{ index + 1 }}</template></span><strong>{{ stage }}</strong></div></div>
          <section class="material-panel"><header><div><small>当前阶段资料</small><h3>{{ selectedOpportunity.stage }} · 完成条件</h3></div><Tag :color="selectedOpportunity.missingMaterials.length ? 'orange' : 'green'">{{ selectedOpportunity.missingMaterials.length ? `缺 ${selectedOpportunity.missingMaterials.length} 项` : '资料完整' }}</Tag></header><div class="material-row complete"><Icon icon="lucide:file-check-2" /><span><strong>客户基础信息与联系人</strong><small>AI 已从报备和跟进记录中核验</small></span><Tag color="green">已完成</Tag></div><div v-for="material in selectedOpportunity.missingMaterials" :key="material" class="material-row"><Icon icon="lucide:file-warning" /><span><strong>{{ material }}</strong><small>需要销售补充并由对应责任人验证</small></span><Button size="small">去补充</Button></div></section>
        </section>

        <section v-else-if="detailTab === 'followup'" class="followup-tab">
          <header><div><small>最近一次有效跟进</small><h3>{{ selectedOpportunity.lastFollowup }}</h3></div><Button type="primary" @click="askAi"><Icon icon="lucide:message-square-plus" />通过对话记录跟进</Button></header>
          <article><span><Icon icon="lucide:phone-call" /></span><div><small>{{ selectedOpportunity.lastFollowup }} · 电话沟通</small><h4>客户反馈与当前进展</h4><p>{{ selectedOpportunity.aiNext }}</p><div><Tag color="green">有效跟进</Tag><Tag>已写入周报素材</Tag><Tag>公海计时已更新</Tag></div></div></article>
          <div class="followup-rule"><Icon icon="lucide:timer-reset" /><div><strong>有效跟进规则</strong><p>记录必须包含客户明确反馈、下一步动作和约定时间；单向发送资料不会重置公海计时。</p></div></div>
        </section>

        <section v-else class="rules-tab">
          <article><span><Icon icon="lucide:route" /></span><div><small>流程模板</small><h3>{{ selectedOpportunity.type }}销售流程 V0.3</h3><p>独立决定该类型商机的阶段、进入条件、必备资料和完成标准。</p></div><Tag color="blue">执行中</Tag></article>
          <article><span><Icon icon="lucide:lock-keyhole" /></span><div><small>客户归属与权限</small><h3>{{ selectedOpportunity.ownership === 'public' ? '公海领取制度' : '私有客户保护制度' }}</h3><p>{{ selectedOpportunity.ownership === 'public' ? '销售可按范围和容量规则领取，领取后建立私有保护期。' : '销售本人可维护；销售总监可查看全部并处理转移、回收和争议。' }}</p></div><Tag :color="selectedOpportunity.ownership === 'public' ? 'gold' : 'green'">{{ selectedOpportunity.ownership === 'public' ? '待领取' : '保护中' }}</Tag></article>
          <article><span><Icon icon="lucide:clock-3" /></span><div><small>销售推进与跟进</small><h3>有效跟进与保护期</h3><p>计算无进展提醒、公海回收时间，并判断跟进是否有效。</p></div><Tag color="green">已确认</Tag></article>
          <article><span><Icon icon="lucide:file-warning" /></span><div><small>阶段资料</small><h3>{{ selectedOpportunity.stage }}资料要求</h3><p>必备资料未齐全时，AI 不会建议进入下一阶段。</p></div><Tag color="green">已确认</Tag></article>
          <article v-if="selectedOpportunity.health !== 'healthy'"><span><Icon icon="lucide:scale" /></span><div><small>异常与争议</small><h3>人工确认边界</h3><p>AI 汇总证据和制度依据，归属、特批和例外放行由人决定。</p></div><Tag color="orange">人工确认</Tag></article>
        </section>

        <footer class="drawer-footer"><span><Icon icon="lucide:database" />数据来自报备、跟进、阶段资料和制度检查</span><Button @click="drawerOpen = false">关闭</Button><Button v-if="selectedOpportunity.ownership === 'public'" @click="message.success('已提交领取申请，等待范围与容量规则校验')"><Icon icon="lucide:hand" />申请领取</Button><Button type="primary" @click="askAi"><Icon icon="lucide:bot" />让 AI 协助推进</Button></footer>
      </div>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.opportunity-page { --green:#276f5e; --orange:#a85931; --ink:#2a4039; }
.permission-bar { display:grid; grid-template-columns:30px minmax(0,1fr) auto; gap:8px; align-items:center; padding:6px 8px; margin-bottom:8px; background:#eef6f3; border:1px solid #d4e7e0; border-radius:10px; }.role-icon { display:grid; width:28px; height:28px; place-items:center; font-size:15px; color:#fff; background:#2e7160; border-radius:8px; }.permission-bar > div:nth-child(2) { display:flex; gap:8px; align-items:center; min-width:0; }.permission-bar strong { flex:none; font-size:12px; color:#34564c; }.permission-bar span { overflow:hidden; font-size:12px; color:#72857e; text-overflow:ellipsis; white-space:nowrap; }.role-switch { display:flex; gap:2px; padding:2px; background:#dfece7; border-radius:7px; }.role-switch button { padding:4px 8px; font-size:12px; color:#62776f; cursor:pointer; background:transparent; border:0; border-radius:5px; }.role-switch button.active { color:#225f50; background:#fff; box-shadow:0 2px 7px rgb(37 75 64 / 8%); }
.toolbar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; padding:6px; margin-bottom:8px; background:#fff; border:1px solid #dce7e3; border-radius:10px; }.scope-switch { display:flex; gap:2px; padding:2px; background:#f0f5f3; border-radius:7px; }.scope-switch button { display:flex; gap:4px; align-items:center; padding:5px 8px; font-size:12px; color:#6b7e77; cursor:pointer; background:transparent; border:0; border-radius:5px; }.scope-switch button.active { color:#225f50; background:#fff; box-shadow:0 2px 7px rgb(37 75 64 / 8%); }.search-box { flex:1; min-width:200px; max-width:260px; margin-left:auto; }.filter-select { width:110px; }.stage-select { width:130px; }
.kanban-board { display:grid; grid-template-columns:repeat(5,minmax(230px,1fr)); gap:10px; min-width:1160px; padding-bottom:8px; }.opportunity-page :deep(.ai-work-page__body) { overflow:auto; }.stage-column { overflow:hidden; background:#f2f6f4; border:1px solid #dce6e2; border-radius:13px; }.stage-column > header { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:3px 8px; align-items:center; padding:10px; background:#fff; border-top:3px solid var(--stage-color); border-bottom:1px solid #dde7e3; }.stage-column > header > div { display:flex; gap:7px; align-items:center; }.stage-column > header > div span { display:grid; width:25px; height:25px; place-items:center; color:#fff; background:var(--stage-color); border-radius:7px; }.stage-column > header strong { font-size:12px; color:#425851; }.stage-column > header em { display:grid; width:20px; height:20px; place-items:center; font-size:12px; font-style:normal; color:#657971; background:#eef3f1; border-radius:50%; }.stage-column > header small { grid-column:1 / -1; padding-left:32px; font-size:12px; color:#91a09b; }.column-cards { display:grid; gap:8px; padding:8px; }.opportunity-card { width:100%; padding:11px; text-align:left; cursor:pointer; background:#fff; border:1px solid #dce6e2; border-radius:10px; box-shadow:0 4px 10px rgb(36 71 61 / 4%); transition:.2s; }.opportunity-card:hover { border-color:#b9d1c9; box-shadow:0 8px 18px rgb(36 71 61 / 9%); transform:translateY(-1px); }.card-top { display:flex; justify-content:space-between; }.card-top :deep(.ant-tag) { width:auto; margin:0; font-size:12px; line-height:18px; white-space:nowrap; }.opportunity-card h3 { margin:9px 0 2px; overflow:hidden; font-size:12px; color:#384f48; text-overflow:ellipsis; white-space:nowrap; }.opportunity-card > p { margin:0; font-size:12px; color:#85938e; }.amount-row { display:flex; align-items:center; justify-content:space-between; margin-top:9px; }.amount-row strong { font-size:13px; color:#a85931; }.amount-row span { font-size:12px; color:#84938e; }.opportunity-card :deep(.ant-progress) { margin:0; }.card-meta { display:flex; justify-content:space-between; margin-top:5px; }.card-meta span { display:flex; gap:3px; align-items:center; font-size:12px; color:#87958f; }.material-warning { display:flex; gap:5px; align-items:center; padding:5px 6px; margin-top:7px; font-size:12px; color:#a75d32; background:#fff5eb; border-radius:6px; }.next-action { padding:7px; margin-top:7px; background:#f5f8f7; border-radius:6px; }.next-action small { font-size:12px; font-weight:800; color:#28715f; }.next-action p { display:-webkit-box; margin:2px 0 0; overflow:hidden; font-size:12px; line-height:1.45; color:#5b6f68; -webkit-box-orient:vertical; -webkit-line-clamp:2; }.opportunity-card footer { display:flex; align-items:center; justify-content:space-between; padding-top:7px; margin-top:7px; color:#7c8c86; border-top:1px solid #e9eeec; }.opportunity-card footer.urgent { color:#bc4e42; }.opportunity-card footer span { display:flex; gap:4px; align-items:center; font-size:12px; }.empty-column { display:flex; flex-direction:column; gap:5px; align-items:center; padding:30px; font-size:12px; color:#9ca7a3; }
.opportunity-list { overflow:auto; background:#fff; border:1px solid #dce7e3; border-radius:11px; }.list-summary { position:sticky; left:0; display:flex; align-items:center; justify-content:space-between; min-width:1120px; padding:7px 11px; border-bottom:1px solid #e4ebe8; }.list-summary div { display:flex; gap:6px; align-items:center; }.list-summary div > svg { color:#2b6d5c; }.list-summary strong { font-size:14px; color:#2b6d5c; }.list-summary span,.list-summary p { margin:0; font-size:12px; color:#81918b; }.opportunity-list > header,.opportunity-list > article { display:grid; grid-template-columns:minmax(180px,1fr) 72px 68px 105px 90px 110px 120px 105px 34px; gap:8px; align-items:center; min-width:1120px; padding:6px 11px; }.opportunity-list > header { position:sticky; top:0; z-index:2; min-height:32px; font-size:12px; font-weight:700; color:#71837c; background:#f4f7f6; border-bottom:1px solid #dfe8e5; }.opportunity-list > article { min-height:48px; cursor:pointer; border-top:1px solid #edf1ef; }.opportunity-list > article:first-of-type { border-top:0; }.opportunity-list > article:hover { background:#f4faf7; }.opportunity-list article > div { min-width:0; }.opportunity-list article strong,.opportunity-list article span { display:block; overflow:hidden; margin:0; font-size:12px; line-height:1.3; color:#455b54; text-overflow:ellipsis; white-space:nowrap; }.opportunity-list article span { margin-top:2px; color:#87958f; }.customer-cell strong { font-weight:700; color:#304d45; }.customer-cell span { color:#87958f; }.stage-cell,.amount-cell,.status-cell { display:flex; gap:5px; align-items:center; }.stage-cell span,.amount-cell span,.status-cell span { flex:none; margin:0; color:#87958f; }.amount-cell strong { color:#9a5a34; }.owner-cell span,.followup-cell span { color:#8a9893; }.followup-cell span.urgent { color:#b44f43; }.opportunity-list article :deep(.ant-tag) { width:max-content; margin:0; padding-inline:5px; font-size:12px; line-height:18px; white-space:nowrap; }.opportunity-list article :deep(.ant-tag svg) { margin-right:3px; }.list-empty { display:flex; flex-direction:column; gap:5px; align-items:center; justify-content:center; min-width:1120px; padding:36px; color:#91a09b; }.list-empty svg { font-size:24px; }.list-empty strong { font-size:12px; color:#61766e; }.list-empty span { font-size:12px; }.list-pagination { position:sticky; left:0; display:flex; align-items:center; justify-content:space-between; min-width:1120px; padding:7px 11px; border-top:1px solid #e4ebe8; }.list-pagination > span { font-size:12px; color:#84938e; }
.drawer-hero { display:grid; grid-template-columns:48px minmax(0,1fr) auto; gap:12px; align-items:center; padding:15px; color:#fff; background:linear-gradient(125deg,#315f53,#234b42); border-radius:13px; }.hero-icon { display:grid; width:46px; height:46px; place-items:center; font-size:20px; color:#315f53; background:#d6eee6; border-radius:12px; }.drawer-hero small { font-size:12px; color:#b3dfd4; }.drawer-hero h2 { margin:3px 0; font-size:16px; color:#fff; }.drawer-hero p { margin:0; font-size:12px; color:#d2e3de; }.hero-amount { text-align:right; }.hero-amount strong { display:block; margin:3px 0; font-size:17px; }.hero-amount :deep(.ant-tag) { width:auto; margin:0; white-space:nowrap; }
.ai-next-card { display:grid; grid-template-columns:40px minmax(0,1fr) auto; gap:11px; align-items:center; padding:13px; margin-top:12px; background:#edf7f3; border:1px solid #d3e9e1; border-radius:11px; }.ai-next-card > span { display:grid; width:38px; height:38px; place-items:center; font-size:18px; color:#fff; background:#287461; border-radius:10px; }.ai-next-card small { font-size:12px; font-weight:800; color:#29705e; }.ai-next-card h3 { margin:2px 0; font-size:12px; color:#3e554e; }.ai-next-card p { margin:0; font-size:12px; line-height:1.45; color:#71827b; }
.detail-tabs { display:flex; gap:5px; padding:4px; margin:13px 0; background:#f0f5f3; border-radius:9px; }.detail-tabs button { padding:7px 12px; font-size:12px; color:#6e8079; cursor:pointer; background:transparent; border:0; border-radius:7px; }.detail-tabs button.active { color:#215f50; background:#fff; box-shadow:0 3px 8px rgb(35 75 64 / 7%); }
.info-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }.info-grid article { padding:11px; background:#f7faf9; border:1px solid #e1e9e6; border-radius:9px; }.info-grid article.urgent { background:#fff2ef; border-color:#f0d6d1; }.info-grid small,.info-grid strong,.info-grid p { display:block; margin:0; }.info-grid small { font-size:12px; color:#8d9a96; }.info-grid strong { margin:4px 0; font-size:12px; color:#3e554e; }.info-grid p { font-size:12px; color:#8b9894; }.business-context { margin-top:11px; overflow:hidden; border:1px solid #e0e8e5; border-radius:10px; }.business-context h3 { padding:9px 11px; margin:0; font-size:12px; color:#425851; background:#f5f8f7; }.business-context div { display:grid; grid-template-columns:120px 1fr; padding:9px 11px; border-top:1px solid #e8eeec; }.business-context span { font-size:12px; color:#8b9894; }.business-context strong { font-size:12px; color:#536861; }
.process-note { display:flex; gap:9px; padding:10px; color:#2c6f5e; background:#eef7f3; border-radius:9px; }.process-note > svg { flex:none; margin-top:2px; }.process-note strong { display:block; font-size:12px; color:#3c5b52; }.process-note p { margin:2px 0 0; font-size:12px; color:#74877f; }.stage-timeline { display:grid; grid-template-columns:repeat(5,1fr); padding:12px 0; }.stage-timeline > div { position:relative; display:flex; flex-direction:column; align-items:center; }.stage-timeline > div::after { position:absolute; top:13px; left:60%; width:80%; height:2px; content:''; background:#dfe7e4; }.stage-timeline > div:last-child::after { display:none; }.stage-timeline span { z-index:1; display:grid; width:27px; height:27px; place-items:center; font-size:12px; color:#84918d; background:#edf1ef; border-radius:50%; }.stage-timeline .done span { color:#fff; background:#287461; }.stage-timeline .active span { color:#fff; background:#a85931; }.stage-timeline strong { margin-top:5px; font-size:12px; color:#536861; }.material-panel { margin-top:12px; overflow:hidden; border:1px solid #dfe8e5; border-radius:10px; }.material-panel > header { display:flex; align-items:center; justify-content:space-between; padding:11px; background:#f5f8f7; }.material-panel header small { font-size:12px; color:#87958f; }.material-panel header h3 { margin:2px 0 0; font-size:12px; color:#40564f; }.material-row { display:grid; grid-template-columns:25px minmax(0,1fr) auto; gap:9px; align-items:center; padding:10px 12px; color:#b16337; border-top:1px solid #e8eeec; }.material-row.complete { color:#287461; }.material-row strong,.material-row small { display:block; }.material-row strong { font-size:12px; color:#485e57; }.material-row small { margin-top:2px; font-size:12px; color:#8c9995; }
.followup-tab > header { display:flex; align-items:center; justify-content:space-between; padding:11px; background:#f5f8f7; border-radius:9px; }.followup-tab header small { font-size:12px; color:#8a9893; }.followup-tab header h3 { margin:2px 0 0; font-size:12px; color:#425851; }.followup-tab > article { display:flex; gap:10px; padding:14px; margin-top:10px; border:1px solid #e0e8e5; border-radius:10px; }.followup-tab > article > span { display:grid; flex:none; width:34px; height:34px; place-items:center; color:#287461; background:#e6f2ee; border-radius:9px; }.followup-tab article small { font-size:12px; color:#8b9894; }.followup-tab article h4 { margin:3px 0; font-size:12px; color:#435a53; }.followup-tab article p { margin:0 0 7px; font-size:12px; line-height:1.55; color:#6e8079; }.followup-tab article :deep(.ant-tag) { font-size:12px; }.followup-rule { display:flex; gap:9px; padding:11px; margin-top:10px; color:#9f633b; background:#fff5ec; border-radius:9px; }.followup-rule strong { display:block; font-size:12px; color:#654f42; }.followup-rule p { margin:3px 0 0; font-size:12px; color:#8e7668; }
.rules-tab { display:grid; gap:8px; }.rules-tab article { display:grid; grid-template-columns:34px minmax(0,1fr) auto; gap:10px; align-items:center; padding:11px; border:1px solid #e0e8e5; border-radius:9px; }.rules-tab article > span { display:grid; width:32px; height:32px; place-items:center; color:#287461; background:#e7f2ee; border-radius:8px; }.rules-tab small { font-size:12px; color:#8a9893; }.rules-tab h3 { margin:2px 0; font-size:12px; color:#425851; }.rules-tab p { margin:0; font-size:12px; color:#7c8c86; }.rules-tab :deep(.ant-tag) { width:auto; margin:0; white-space:nowrap; }
.drawer-footer { display:flex; gap:8px; align-items:center; padding-top:13px; margin-top:14px; border-top:1px solid #e1e9e6; }.drawer-footer > span { display:flex; flex:1; gap:5px; align-items:center; font-size:12px; color:#899691; }
@media (max-width:1100px) { .toolbar { flex-wrap:wrap; }.search-box { max-width:none; margin-left:0; }.info-grid { grid-template-columns:repeat(2,1fr); } }
</style>
