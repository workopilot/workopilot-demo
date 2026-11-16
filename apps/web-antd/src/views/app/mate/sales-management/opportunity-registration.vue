<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Input,
  Progress,
  Select,
  Tag,
  message,
} from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type CheckStatus = 'attention' | 'passed' | 'pending';
type PageView = 'create' | 'records';
type RegistrationStep = 'input' | 'result' | 'review';

interface RuleCheck {
  action: string;
  detail: string;
  icon: string;
  id: string;
  rule: string;
  status: CheckStatus;
  title: string;
}

const pageView = ref<PageView>('create');
const currentStep = ref<RegistrationStep>('input');
const sourceText = ref(
  '张总介绍了苏州智造，他们准备采购设备运维系统，下周约信息部沟通。',
);
const analyzing = ref(false);
const analysisProgress = ref(0);
const analysisStage = ref('理解销售口述');
const isRecording = ref(false);
const selectedRule = ref<RuleCheck>();
const ruleDrawerOpen = ref(false);
const submitted = ref(false);
let analysisTimer: number | undefined;
let recordingTimer: number | undefined;

const form = ref({
  company: '',
  companyCode: '',
  companyGroup: '',
  contactName: '',
  contactPhone: '',
  contactRole: '',
  demand: '',
  expectedAmount: '',
  industry: '',
  opportunityType: '新签',
  productLine: '',
  purchaseDate: '',
  region: '',
  source: '',
  sourceContact: '',
});

const checks = ref<RuleCheck[]>([
  {
    id: 'company',
    title: '客户主体核验',
    icon: 'lucide:building-2',
    status: 'passed',
    detail: '已匹配“苏州智造科技有限公司”，企业状态正常。',
    rule: '报备成立条件 · 客户主体核验信息',
    action: 'AI 联网核验后，由销售确认主体是否准确。',
  },
  {
    id: 'duplicate',
    title: '客户与商机查重',
    icon: 'lucide:copy-check',
    status: 'attention',
    detail: '同集团“智造装备（上海）有限公司”存在进行中商机，本法人暂无重复报备。',
    rule: '重复报备与集团客户（待补充）',
    action: '规则未明确集团保护范围，当前只提示风险，不自动驳回。',
  },
  {
    id: 'scope',
    title: '销售范围匹配',
    icon: 'lucide:map-pinned',
    status: 'pending',
    detail: '同时命中“华东区域”和“制造行业”两名负责人，需要确认主责。',
    rule: '客户与销售范围（待确认）',
    action: '提交后进入归属确认，不自动分配负责人。',
  },
  {
    id: 'capacity',
    title: '跟进数量上限',
    icon: 'lucide:gauge',
    status: 'passed',
    detail: '当前有效商机 12 个，制度上限 20 个，可以继续报备。',
    rule: '跟进数量上限与公开招标',
    action: '规则程序按有效商机数进行确定性检查。',
  },
  {
    id: 'source',
    title: '来源权益识别',
    icon: 'lucide:handshake',
    status: 'pending',
    detail: '识别为私人关系介绍，需补充张总身份及有效来源证明。',
    rule: '商机来源证明 · 来源人与销售分配',
    action: '来源权益暂不生效，待市场部核验来源材料。',
  },
]);

const records = ref([
  {
    id: 'BA-20260918-008',
    company: '宁德新能源装备有限公司',
    type: '增购',
    source: '客户主动咨询',
    owner: '王安康',
    amount: '68 万元',
    status: '备案成功',
    updatedAt: '今天 09:32',
  },
  {
    id: 'BA-20260917-021',
    company: '华东智能制造集团',
    type: '新签',
    source: '市场活动',
    owner: '待确认',
    amount: '120 万元',
    status: '待归属确认',
    updatedAt: '昨天 16:20',
  },
  {
    id: 'BA-20260916-014',
    company: '昆山精密部件有限公司',
    type: '续约',
    source: '原客户续约',
    owner: '李伟',
    amount: '36 万元',
    status: '待补充',
    updatedAt: '09-16 14:08',
  },
]);

const stepIndex = computed(() =>
  ['input', 'review', 'result'].indexOf(currentStep.value),
);
const missingFields = computed(() => {
  const fields: string[] = [];
  if (!form.value.contactPhone) fields.push('联系人手机号');
  if (!form.value.purchaseDate) fields.push('预计采购时间');
  if (!form.value.expectedAmount) fields.push('预计金额');
  return fields;
});
const attentionCount = computed(
  () => checks.value.filter((item) => item.status !== 'passed').length,
);
const canSubmit = computed(
  () => currentStep.value === 'review' && missingFields.value.length === 0,
);

const statusColor = (status: string) => {
  if (status === '备案成功') return 'green';
  if (status === '待归属确认') return 'orange';
  return 'red';
};

function fillSample(kind: 'duplicate' | 'normal' | 'tender') {
  const samples = {
    normal:
      '张总介绍了苏州智造，他们准备采购设备运维系统，下周约信息部沟通。',
    duplicate:
      '上海智造装备集团的采购经理联系我，想采购视觉检测系统，预算大约80万。',
    tender:
      '江苏某汽车零部件工厂发布了公开招标，计划采购三套质量检测设备，月底截标。',
  };
  sourceText.value = samples[kind];
}

function toggleRecording() {
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    message.info('正在模拟语音识别，请开始描述商机');
    recordingTimer = window.setTimeout(() => {
      sourceText.value =
        '张总介绍了苏州智造，他们准备采购设备运维系统，下周约信息部沟通。';
      isRecording.value = false;
      message.success('语音已转成文字');
    }, 1600);
  } else if (recordingTimer) {
    window.clearTimeout(recordingTimer);
  }
}

function startAnalysis() {
  if (!sourceText.value.trim()) {
    message.warning('请先描述商机信息');
    return;
  }
  analyzing.value = true;
  currentStep.value = 'review';
  analysisProgress.value = 6;
  analysisStage.value = '理解销售口述';
  analysisTimer = window.setInterval(() => {
    analysisProgress.value = Math.min(100, analysisProgress.value + 9);
    if (analysisProgress.value >= 30) analysisStage.value = '提取客户、来源和需求';
    if (analysisProgress.value >= 55) analysisStage.value = '核验企业主体与集团关系';
    if (analysisProgress.value >= 76) analysisStage.value = '调用已确认的销售制度';
    if (analysisProgress.value >= 92) analysisStage.value = '生成报备检查结果';
    if (analysisProgress.value >= 100) {
      if (analysisTimer) window.clearInterval(analysisTimer);
      analyzing.value = false;
      form.value = {
        company: '苏州智造科技有限公司',
        companyCode: '91320594MA2X7K8P6Q',
        companyGroup: '智造装备集团',
        contactName: '待补充',
        contactPhone: '',
        contactRole: '信息部负责人',
        demand: '采购设备运维系统，改善设备故障响应与保养管理',
        expectedAmount: '',
        industry: '智能制造',
        opportunityType: '新签',
        productLine: '设备运维系统',
        purchaseDate: '',
        region: '华东 / 江苏',
        source: '私人关系介绍',
        sourceContact: '张总（身份待核验）',
      };
      currentStep.value = 'review';
    }
  }, 120);
}

function fillMissingExample() {
  form.value.contactName = '陈经理';
  form.value.contactPhone = '138 0000 6821';
  form.value.purchaseDate = '2026 年 11 月';
  form.value.expectedAmount = '80 万元';
  message.success('已补齐 Demo 示例信息');
}

function openRule(check: RuleCheck) {
  selectedRule.value = check;
  ruleDrawerOpen.value = true;
}

function submitRegistration() {
  if (!canSubmit.value) {
    message.warning(`还需补充：${missingFields.value.join('、')}`);
    return;
  }
  submitted.value = true;
  currentStep.value = 'result';
  records.value.unshift({
    id: 'BA-20260918-023',
    company: form.value.company,
    type: form.value.opportunityType,
    source: form.value.source,
    owner: '待确认',
    amount: form.value.expectedAmount,
    status: '待归属确认',
    updatedAt: '刚刚',
  });
  message.success('报备已提交，等待销售负责人确认归属');
}

function resetRegistration() {
  currentStep.value = 'input';
  submitted.value = false;
  analysisProgress.value = 0;
  sourceText.value = '';
}

onBeforeUnmount(() => {
  if (analysisTimer) window.clearInterval(analysisTimer);
  if (recordingTimer) window.clearTimeout(recordingTimer);
});
</script>

<template>
  <AiWorkPage
    class="registration-page"
    icon="lucide:clipboard-pen-line"
    title="商机报备"
    description="描述客户和机会，AI 自动补全信息、核验客户并按销售制度检查报备。"
  >
    <template #actions>
      <Button @click="pageView = 'records'">
        <Icon icon="lucide:history" />报备记录
      </Button>
      <Button type="primary" @click="pageView = 'create'; resetRegistration()">
        <Icon icon="lucide:plus" />新建报备
      </Button>
    </template>

    <nav class="view-tabs">
      <button :class="{ active: pageView === 'create' }" @click="pageView = 'create'">
        <Icon icon="lucide:sparkles" />AI 快速报备
      </button>
      <button :class="{ active: pageView === 'records' }" @click="pageView = 'records'">
        <Icon icon="lucide:rows-3" />报备记录
        <span>3</span>
      </button>
    </nav>

    <template v-if="pageView === 'create'">
      <section class="step-bar">
        <div
          v-for="(step, index) in [
            ['描述商机', 'AI 提取基础信息'],
            ['制度检查', '核验、查重与归属'],
            ['提交结果', '形成正式备案状态'],
          ]"
          :key="index"
          :class="{ active: stepIndex === index, complete: stepIndex > index }"
        >
          <span><Icon v-if="stepIndex > index" icon="lucide:check" /><template v-else>{{ index + 1 }}</template></span>
          <div><strong>{{ step[0] }}</strong><small>{{ step[1] }}</small></div>
        </div>
      </section>

      <section v-if="currentStep === 'input'" class="input-workbench">
        <main>
          <header class="section-heading">
            <span>STEP 01</span>
            <h2>像告诉销售助理一样描述商机</h2>
            <p>不需要先填写完整表单，AI 会从口述中提取信息，再让你确认关键事实。</p>
          </header>

          <div class="opportunity-input">
            <Input.TextArea
              v-model:value="sourceText"
              :rows="7"
              placeholder="例如：谁介绍了哪家客户、客户想解决什么问题、下一步准备做什么……"
            />
            <div class="input-actions">
              <button
                type="button"
                :class="{ recording: isRecording }"
                @click="toggleRecording"
              >
                <Icon :icon="isRecording ? 'lucide:square' : 'lucide:mic'" />
                {{ isRecording ? '结束录音' : '语音输入' }}
              </button>
              <span>支持一句话报备，关键信息稍后确认</span>
              <Button type="primary" size="large" @click="startAnalysis">
                <Icon icon="lucide:wand-sparkles" />AI 识别并检查
              </Button>
            </div>
          </div>

          <div class="sample-prompts">
            <span>试试这些场景</span>
            <button type="button" @click="fillSample('normal')">普通新签</button>
            <button type="button" @click="fillSample('duplicate')">集团客户冲突</button>
            <button type="button" @click="fillSample('tender')">公开招标</button>
          </div>
        </main>

        <aside class="ai-explain">
          <header><span><Icon icon="lucide:bot" /></span><div><small>AI 将完成</small><h3>一次输入，五类检查</h3></div></header>
          <ol>
            <li><span>1</span><div><strong>提取商机事实</strong><p>客户、来源、联系人、需求和下一步。</p></div></li>
            <li><span>2</span><div><strong>核验客户主体</strong><p>企业身份、集团关系和经营状态。</p></div></li>
            <li><span>3</span><div><strong>检查重复报备</strong><p>客户、同集团法人和相似需求。</p></div></li>
            <li><span>4</span><div><strong>匹配销售制度</strong><p>销售范围、数量上限和来源权益。</p></div></li>
            <li><span>5</span><div><strong>给出下一步</strong><p>补资料、成功备案或进入人工确认。</p></div></li>
          </ol>
          <div class="boundary-note"><Icon icon="lucide:shield-check" /><p>AI 不会凭空补全联系人、金额和采购时间，也不会自动裁决归属争议。</p></div>
        </aside>
      </section>

      <section v-else-if="analyzing" class="analysis-state">
        <span><Icon icon="lucide:loader-circle" /></span>
        <small>AI 正在分析商机</small>
        <h2>{{ analysisStage }}</h2>
        <p>保留销售原话，并将每个判断关联到具体制度规则。</p>
        <Progress :percent="analysisProgress" stroke-color="#a85931" />
      </section>

      <section v-else-if="currentStep === 'review'" class="review-workbench">
        <main class="extracted-form">
          <header class="section-heading form-head">
            <div><span>STEP 02</span><h2>确认 AI 提取的信息</h2><p>橙色提示项需要补充或人工确认。</p></div>
            <Button @click="fillMissingExample"><Icon icon="lucide:flask-conical" />补齐 Demo 信息</Button>
          </header>

          <section class="form-section">
            <header><Icon icon="lucide:building-2" /><div><strong>客户主体</strong><small>企业核验结果需要销售确认</small></div><Tag color="green">已核验</Tag></header>
            <div class="form-grid">
              <label><span>客户企业全称</span><Input v-model:value="form.company" /></label>
              <label><span>统一社会信用代码</span><Input v-model:value="form.companyCode" /></label>
              <label><span>所属集团</span><Input v-model:value="form.companyGroup" /></label>
              <label><span>区域</span><Select v-model:value="form.region" :options="[{ value: '华东 / 江苏' }, { value: '华东 / 上海' }, { value: '华南 / 广东' }]" /></label>
              <label><span>行业</span><Select v-model:value="form.industry" :options="[{ value: '智能制造' }, { value: '汽车零部件' }, { value: '新能源' }]" /></label>
            </div>
          </section>

          <section class="form-section">
            <header><Icon icon="lucide:user-round" /><div><strong>联系人与来源</strong><small>来源权益需有可验证信息</small></div><Tag color="orange">需补充</Tag></header>
            <div class="form-grid">
              <label><span>联系人</span><Input v-model:value="form.contactName" /></label>
              <label :class="{ missing: !form.contactPhone }"><span>联系人手机号 *</span><Input v-model:value="form.contactPhone" placeholder="待补充" /></label>
              <label><span>联系人角色</span><Input v-model:value="form.contactRole" /></label>
              <label><span>商机来源</span><Select v-model:value="form.source" :options="[{ value: '私人关系介绍' }, { value: '市场活动' }, { value: '渠道推荐' }, { value: '销售自拓' }]" /></label>
              <label><span>来源联系人</span><Input v-model:value="form.sourceContact" /></label>
            </div>
          </section>

          <section class="form-section">
            <header><Icon icon="lucide:briefcase-business" /><div><strong>商机信息</strong><small>用于选择流程模板和判断销售范围</small></div><Tag color="orange">2 项待补充</Tag></header>
            <div class="form-grid">
              <label><span>商机类型</span><Select v-model:value="form.opportunityType" :options="[{ value: '新签' }, { value: '续约' }, { value: '增购' }]" /></label>
              <label><span>产品线</span><Input v-model:value="form.productLine" /></label>
              <label :class="{ missing: !form.expectedAmount }"><span>预计金额 *</span><Input v-model:value="form.expectedAmount" placeholder="待补充" /></label>
              <label :class="{ missing: !form.purchaseDate }"><span>预计采购时间 *</span><Input v-model:value="form.purchaseDate" placeholder="待补充" /></label>
              <label class="span-2"><span>初步需求</span><Input.TextArea v-model:value="form.demand" :rows="3" /></label>
            </div>
          </section>
        </main>

        <aside class="rule-check-panel">
          <header><div><small>制度检查结果</small><h3>{{ checks.length }} 项检查，{{ attentionCount }} 项需处理</h3></div><Tag color="orange">待归属确认</Tag></header>
          <div class="check-list">
            <button
              v-for="check in checks"
              :key="check.id"
              type="button"
              :class="check.status"
              @click="openRule(check)"
            >
              <span><Icon :icon="check.icon" /></span>
              <div><div><strong>{{ check.title }}</strong><Tag :color="check.status === 'passed' ? 'green' : check.status === 'attention' ? 'red' : 'orange'">{{ check.status === 'passed' ? '通过' : check.status === 'attention' ? '有风险' : '待确认' }}</Tag></div><p>{{ check.detail }}</p><small><Icon icon="lucide:book-open" />{{ check.rule }}</small></div>
              <Icon icon="lucide:chevron-right" />
            </button>
          </div>

          <section class="submission-status">
            <header><Icon :icon="missingFields.length ? 'lucide:circle-alert' : 'lucide:circle-check-big'" /><div><strong>{{ missingFields.length ? `还缺 ${missingFields.length} 项必填信息` : '必填信息已完整' }}</strong><p>{{ missingFields.length ? missingFields.join('、') : '可以提交报备并进入归属确认。' }}</p></div></header>
            <Button block size="large" type="primary" :disabled="!canSubmit" @click="submitRegistration">提交商机报备</Button>
            <small>提交不代表归属已确认。存在跨范围或集团冲突时，将进入人工确认。</small>
          </section>
        </aside>
      </section>

      <section v-else class="result-page">
        <div class="result-icon"><Icon icon="lucide:clipboard-check" /></div>
        <Tag color="orange">待归属确认</Tag>
        <h2>商机报备已提交</h2>
        <p>基础信息和客户核验已经完成。由于同时命中区域和行业负责人，需要销售负责人确认主责。</p>
        <div class="result-number"><small>报备编号</small><strong>BA-20260918-023</strong></div>
        <div class="result-timeline">
          <div class="done"><span><Icon icon="lucide:check" /></span><strong>提交报备</strong><small>刚刚</small></div>
          <div class="done"><span><Icon icon="lucide:check" /></span><strong>客户核验与查重</strong><small>已完成</small></div>
          <div class="active"><span>3</span><strong>归属确认</strong><small>预计 1 个工作日</small></div>
          <div><span>4</span><strong>备案成功</strong><small>确认后进入新签流程</small></div>
        </div>
        <div class="result-actions"><Button @click="resetRegistration">继续报备</Button><Button @click="pageView = 'records'">查看报备记录</Button><Button type="primary" @click="message.info('商机详情将在下一阶段 Demo 中实现')">查看商机</Button></div>
      </section>
    </template>

    <section v-else class="records-page">
      <header class="records-head"><div><span>报备记录</span><h2>查看报备状态与待处理事项</h2><p>记录每次报备使用的制度版本、检查结果和人工确认过程。</p></div><Input.Search placeholder="搜索客户或报备编号" style="width: 260px" /></header>
      <div class="record-summary"><article><span><Icon icon="lucide:clipboard-list" /></span><div><small>本月报备</small><strong>23</strong></div></article><article><span><Icon icon="lucide:circle-check-big" /></span><div><small>备案成功</small><strong>17</strong></div></article><article><span><Icon icon="lucide:user-round-check" /></span><div><small>待归属确认</small><strong>3</strong></div></article><article><span><Icon icon="lucide:circle-alert" /></span><div><small>待补充</small><strong>3</strong></div></article></div>
      <div class="record-list">
        <article v-for="record in records" :key="record.id">
          <span class="record-company-icon"><Icon icon="lucide:building-2" /></span>
          <div class="record-main"><small>{{ record.id }}</small><h3>{{ record.company }}</h3><p>{{ record.type }} · {{ record.source }} · 预计 {{ record.amount }}</p></div>
          <div><small>负责人</small><strong>{{ record.owner }}</strong></div>
          <div><small>最近更新</small><strong>{{ record.updatedAt }}</strong></div>
          <Tag :color="statusColor(record.status)">{{ record.status }}</Tag>
          <Button>查看详情</Button>
        </article>
      </div>
    </section>

    <Drawer v-model:open="ruleDrawerOpen" title="制度检查依据" :width="480" placement="right">
      <div v-if="selectedRule" class="rule-detail-drawer">
        <header :class="selectedRule.status"><span><Icon :icon="selectedRule.icon" /></span><div><small>检查项目</small><h2>{{ selectedRule.title }}</h2></div></header>
        <section><small>本次检查结果</small><p>{{ selectedRule.detail }}</p></section>
        <section><small>引用的制度规则</small><strong>{{ selectedRule.rule }}</strong><p>制度版本：销售管理制度草稿 V0.3</p></section>
        <section><small>系统与 AI 如何处理</small><p>{{ selectedRule.action }}</p></section>
        <div class="rule-boundary"><Icon icon="lucide:scale" /><p>待确认或待补充规则只生成提示，不会自动驳回报备、改变归属或影响提成。</p></div>
        <Button block @click="ruleDrawerOpen = false">我知道了</Button>
      </div>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.registration-page { --accent:#a85931; --green:#216f5e; --ink:#263b35; }
.view-tabs { display:flex; gap:7px; padding:5px; margin-bottom:14px; background:#edf4f1; border:1px solid #dbe8e3; border-radius:13px; }
.view-tabs button { display:flex; gap:7px; align-items:center; padding:9px 14px; font-size:12px; font-weight:700; color:#687b75; cursor:pointer; background:transparent; border:0; border-radius:9px; }
.view-tabs button.active { color:#175c4e; background:#fff; box-shadow:0 4px 12px rgb(31 74 62 / 8%); }
.view-tabs button > span { padding:1px 6px; font-size:12px; color:#fff; background:#a85931; border-radius:8px; }
.step-bar { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:7px; margin-bottom:14px; background:#fff; border:1px solid #dce8e4; border-radius:14px; }
.step-bar > div { display:flex; gap:9px; align-items:center; padding:9px 12px; color:#91a09b; border-radius:10px; }
.step-bar > div.active { color:#814523; background:#fcf3ed; }
.step-bar > div.complete { color:#23715f; background:#edf7f3; }
.step-bar > div > span { display:grid; width:29px; height:29px; place-items:center; font-size:13px; color:#fff; background:#aeb9b5; border-radius:9px; }
.step-bar > div.active > span { background:#a85931; }
.step-bar > div.complete > span { background:#247663; }
.step-bar strong,.step-bar small { display:block; }
.step-bar strong { font-size:12px; }
.step-bar small { margin-top:2px; font-size:12px; font-weight:400; }
.input-workbench { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:16px; }
.input-workbench > main,.ai-explain,.extracted-form,.rule-check-panel,.records-page { background:#fff; border:1px solid #dce7e3; border-radius:17px; }
.input-workbench > main { padding:24px; }
.section-heading > span,.records-head span { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.12em; }
.section-heading h2,.records-head h2 { margin:5px 0; font-size:20px; color:var(--ink); }
.section-heading p,.records-head p { margin:0; font-size:12px; color:#7a8a84; }
.opportunity-input { margin-top:20px; overflow:hidden; border:1px solid #d5e2dd; border-radius:13px; box-shadow:0 8px 24px rgb(35 73 62 / 5%); }
.opportunity-input :deep(textarea) { padding:16px; font-size:14px; line-height:1.8; border:0; box-shadow:none; resize:none; }
.input-actions { display:flex; gap:10px; align-items:center; padding:10px 12px; background:#f7faf9; border-top:1px solid #e2ebe8; }
.input-actions > button { display:flex; gap:6px; align-items:center; padding:7px 10px; font-size:12px; color:#5c736c; cursor:pointer; background:#fff; border:1px solid #d8e3df; border-radius:8px; }
.input-actions > button.recording { color:#fff; background:#b34f43; border-color:#b34f43; }
.input-actions > span { flex:1; font-size:12px; color:#94a09c; }
.sample-prompts { display:flex; gap:7px; align-items:center; margin-top:13px; }
.sample-prompts > span { margin-right:3px; font-size:12px; color:#8a9893; }
.sample-prompts button { padding:6px 9px; font-size:12px; color:#537068; cursor:pointer; background:#f3f7f5; border:1px solid #e0e9e6; border-radius:8px; }
.ai-explain { padding:18px; background:linear-gradient(155deg,#f5faf8,#fff9f5); }
.ai-explain > header { display:flex; gap:10px; align-items:center; padding-bottom:13px; border-bottom:1px solid #dfe9e5; }
.ai-explain > header > span { display:grid; width:40px; height:40px; place-items:center; font-size:19px; color:#fff; background:#28715f; border-radius:11px; }
.ai-explain header small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.1em; }
.ai-explain header h3 { margin:2px 0 0; font-size:14px; color:#304941; }
.ai-explain ol { display:grid; gap:10px; padding:0; margin:15px 0; list-style:none; }
.ai-explain li { display:flex; gap:9px; }
.ai-explain li > span { display:grid; flex:none; width:23px; height:23px; place-items:center; font-size:12px; font-weight:800; color:#26715f; background:#e3f1ec; border-radius:7px; }
.ai-explain li strong { display:block; font-size:12px; color:#3d554e; }
.ai-explain li p { margin:2px 0 0; font-size:12px; color:#7d8c87; }
.boundary-note { display:flex; gap:8px; padding:10px; color:#9a603b; background:#fff3ea; border:1px solid #efddcf; border-radius:9px; }
.boundary-note svg { flex:none; margin-top:2px; }
.boundary-note p { margin:0; font-size:12px; line-height:1.5; }
.analysis-state { max-width:580px; padding:70px 20px; margin:auto; text-align:center; }
.analysis-state > span { display:grid; width:62px; height:62px; margin:0 auto 15px; place-items:center; font-size:28px; color:#fff; background:linear-gradient(145deg,#b86b41,#8d4728); border-radius:18px; box-shadow:0 14px 28px rgb(153 78 39 / 22%); }
.analysis-state > span svg { animation:spin 1.1s linear infinite; }
.analysis-state small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.12em; }
.analysis-state h2 { margin:6px 0; font-size:20px; color:var(--ink); }
.analysis-state p { margin:0 0 18px; font-size:12px; color:#7a8984; }
.review-workbench { display:grid; grid-template-columns:minmax(0,1fr) 390px; gap:14px; align-items:start; }
.extracted-form { padding:20px; }
.form-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
.form-section { margin-top:14px; overflow:hidden; border:1px solid #e0e9e6; border-radius:12px; }
.form-section > header { display:flex; gap:9px; align-items:center; padding:10px 12px; background:#f5f8f7; }
.form-section > header > svg { color:#287461; }
.form-section > header > div { flex:1; }
.form-section > header strong,.form-section > header small { display:block; }
.form-section > header strong { font-size:12px; color:#3e554e; }
.form-section > header small { margin-top:2px; font-size:12px; color:#87958f; }
.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; padding:13px; }
.form-grid label > span { display:block; margin-bottom:5px; font-size:12px; font-weight:700; color:#5a6f68; }
.form-grid label.missing > span { color:#b75341; }
.form-grid label.missing :deep(.ant-input) { background:#fff9f7; border-color:#e5a99e; }
.form-grid .span-2 { grid-column:1 / -1; }
.form-grid :deep(.ant-select) { width:100%; }
.rule-check-panel { position:sticky; top:0; overflow:hidden; }
.rule-check-panel > header { display:flex; align-items:flex-start; justify-content:space-between; padding:15px; background:linear-gradient(135deg,#315e52,#244d44); }
.rule-check-panel > header small { font-size:12px; font-weight:800; color:#aee0d3; letter-spacing:.1em; }
.rule-check-panel > header h3 { margin:3px 0 0; font-size:14px; color:#fff; }
.check-list { padding:8px; }
.check-list > button { display:grid; grid-template-columns:32px minmax(0,1fr) 15px; gap:9px; align-items:start; width:100%; padding:10px 8px; text-align:left; cursor:pointer; background:transparent; border:0; border-bottom:1px solid #edf1ef; }
.check-list > button > span { display:grid; width:30px; height:30px; place-items:center; color:#26735f; background:#e8f4f0; border-radius:9px; }
.check-list > button.attention > span { color:#b64f42; background:#fff0ed; }
.check-list > button.pending > span { color:#b87532; background:#fff6e9; }
.check-list > button > div > div { display:flex; gap:6px; align-items:center; }
.check-list strong { font-size:12px; color:#3c534c; }
.check-list p { margin:4px 0; font-size:12px; line-height:1.45; color:#74847f; }
.check-list small { display:flex; gap:4px; align-items:center; font-size:12px; color:#9a6960; }
.check-list > button > svg { margin-top:8px; color:#a9b4b0; }
.check-list :deep(.ant-tag) { margin:0; font-size:12px; line-height:18px; }
.submission-status { padding:13px; background:#f6f9f8; border-top:1px solid #e0e9e6; }
.submission-status > header { display:flex; gap:9px; align-items:flex-start; margin-bottom:10px; color:#bc6934; }
.submission-status strong { display:block; font-size:12px; color:#455b54; }
.submission-status p { margin:2px 0 0; font-size:12px; color:#84938e; }
.submission-status > small { display:block; margin-top:8px; font-size:12px; line-height:1.45; color:#8b9894; text-align:center; }
.result-page { max-width:720px; padding:38px; margin:auto; text-align:center; background:#fff; border:1px solid #dce7e3; border-radius:18px; }
.result-icon { display:grid; width:64px; height:64px; margin:0 auto 12px; place-items:center; font-size:29px; color:#fff; background:#287461; border-radius:18px; box-shadow:0 13px 25px rgb(31 106 87 / 20%); }
.result-page h2 { margin:8px 0; font-size:22px; color:var(--ink); }
.result-page > p { max-width:530px; margin:0 auto; font-size:12px; line-height:1.6; color:#72837d; }
.result-number { display:inline-flex; gap:10px; align-items:center; padding:8px 12px; margin:16px 0; background:#f4f7f6; border-radius:8px; }
.result-number small { font-size:12px; color:#84938e; }
.result-number strong { font-size:12px; color:#3d554e; }
.result-timeline { display:grid; grid-template-columns:repeat(4,1fr); margin:10px 0 22px; }
.result-timeline > div { position:relative; display:flex; flex-direction:column; align-items:center; }
.result-timeline > div::after { position:absolute; top:14px; left:60%; z-index:0; width:80%; height:2px; content:''; background:#e0e8e5; }
.result-timeline > div:last-child::after { display:none; }
.result-timeline span { z-index:1; display:grid; width:28px; height:28px; place-items:center; font-size:12px; color:#83918c; background:#eef2f0; border-radius:50%; }
.result-timeline .done span { color:#fff; background:#287461; }
.result-timeline .active span { color:#fff; background:#a85931; }
.result-timeline strong { margin-top:6px; font-size:12px; color:#455b54; }
.result-timeline small { margin-top:2px; font-size:12px; color:#909d98; }
.result-actions { display:flex; gap:8px; justify-content:center; }
.records-page { padding:22px; }
.records-head { display:flex; align-items:flex-start; justify-content:space-between; }
.record-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:18px 0; }
.record-summary article { display:flex; gap:10px; align-items:center; padding:13px; background:#f6f9f8; border:1px solid #e2eae7; border-radius:11px; }
.record-summary article > span { display:grid; width:35px; height:35px; place-items:center; color:#287461; background:#e5f1ed; border-radius:9px; }
.record-summary small,.record-summary strong { display:block; }
.record-summary small { font-size:12px; color:#85938e; }
.record-summary strong { margin-top:2px; font-size:17px; color:#354c45; }
.record-list { display:grid; gap:8px; }
.record-list article { display:grid; grid-template-columns:40px minmax(220px,1fr) 100px 100px auto auto; gap:12px; align-items:center; padding:12px; border:1px solid #e0e9e6; border-radius:11px; }
.record-company-icon { display:grid; width:38px; height:38px; place-items:center; color:#a85931; background:#faeee7; border-radius:10px; }
.record-main small { font-size:12px; color:#96a29e; }
.record-main h3 { margin:2px 0; font-size:12px; color:#3a514a; }
.record-main p { margin:0; font-size:12px; color:#84938e; }
.record-list article > div:not(.record-main) small,.record-list article > div:not(.record-main) strong { display:block; }
.record-list article > div:not(.record-main) small { font-size:12px; color:#94a09c; }
.record-list article > div:not(.record-main) strong { margin-top:3px; font-size:12px; color:#536861; }
.rule-detail-drawer > header { display:flex; gap:11px; align-items:center; padding:14px; background:#eef7f4; border-radius:11px; }
.rule-detail-drawer > header.attention { background:#fff1ee; }
.rule-detail-drawer > header.pending { background:#fff6e9; }
.rule-detail-drawer > header > span { display:grid; width:42px; height:42px; place-items:center; font-size:19px; color:#287461; background:#fff; border-radius:10px; }
.rule-detail-drawer header small { font-size:12px; font-weight:800; color:#8a9893; }
.rule-detail-drawer header h2 { margin:3px 0 0; font-size:15px; color:#344c45; }
.rule-detail-drawer section { padding:14px 2px; border-bottom:1px solid #e7edeb; }
.rule-detail-drawer section small { display:block; margin-bottom:5px; font-size:12px; font-weight:800; color:#9a603b; }
.rule-detail-drawer section strong { font-size:12px; color:#3c534c; }
.rule-detail-drawer section p { margin:3px 0 0; font-size:12px; line-height:1.6; color:#6f817a; }
.rule-boundary { display:flex; gap:8px; padding:11px; margin:14px 0; color:#93623f; background:#fff6ed; border-radius:9px; }
.rule-boundary svg { flex:none; margin-top:2px; }
.rule-boundary p { margin:0; font-size:12px; line-height:1.5; }
@keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:1100px) { .input-workbench,.review-workbench { grid-template-columns:1fr; } .rule-check-panel { position:static; } .record-list article { grid-template-columns:40px 1fr auto; } .record-list article > div:not(.record-main) { display:none; } }
@media (max-width:720px) { .form-grid,.record-summary,.result-timeline { grid-template-columns:1fr; } .step-bar { grid-template-columns:1fr; } .result-timeline > div::after { display:none; } }
</style>
