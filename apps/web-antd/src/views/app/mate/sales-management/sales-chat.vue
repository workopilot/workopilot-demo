<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, Select, Tag, message } from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type ChatRole = 'assistant' | 'user';
type ChatType = 'card' | 'text';
type CheckStatus = 'attention' | 'passed' | 'pending';

interface ChatMessage {
  content: string;
  id: string;
  role: ChatRole;
  time: string;
  type: ChatType;
}

interface RuleCheck {
  action: string;
  detail: string;
  id: string;
  rule: string;
  status: CheckStatus;
  title: string;
}

const chatScroll = ref<HTMLElement>();
const composer = ref('');
const sending = ref(false);
const isRecording = ref(false);
const drawerOpen = ref(false);
const submitted = ref(false);
const selectedCheckId = ref('duplicate');
let replyTimer: number | undefined;
let recordingTimer: number | undefined;

const messages = ref<ChatMessage[]>([
  {
    id: 'welcome',
    role: 'assistant',
    type: 'text',
    content:
      '你好，我是 AI 销售助理。你可以直接告诉我新客户、联系人和需求，我会整理商机信息，并按销售制度完成核验、查重和归属检查。',
    time: '10:36',
  },
  {
    id: 'sample-user',
    role: 'user',
    type: 'text',
    content:
      '张总介绍了苏州智造，他们准备采购设备运维系统，下周约信息部沟通。',
    time: '10:38',
  },
  {
    id: 'sample-card',
    role: 'assistant',
    type: 'card',
    content:
      '我已识别出一个新签商机，并完成客户核验和制度检查。还有 3 项信息需要补充，同时存在集团客户与销售范围提示。',
    time: '10:38',
  },
]);

const form = ref({
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
});

const checks = ref<RuleCheck[]>([
  {
    id: 'company',
    title: '客户主体核验',
    status: 'passed',
    detail: '已匹配“苏州智造科技有限公司”，企业状态正常。',
    rule: '报备成立条件 · 客户主体核验信息',
    action: 'AI 已完成企业核验，正式提交前由销售确认主体是否准确。',
  },
  {
    id: 'duplicate',
    title: '客户与商机查重',
    status: 'attention',
    detail: '同集团“智造装备（上海）有限公司”存在进行中商机，本法人暂无重复报备。',
    rule: '重复报备与集团客户（待补充）',
    action: '制度未明确集团保护范围，因此只提示风险，不自动驳回。',
  },
  {
    id: 'scope',
    title: '销售范围匹配',
    status: 'pending',
    detail: '同时命中“华东区域”和“制造行业”负责人，需要确认主责。',
    rule: '客户与销售范围（待确认）',
    action: '提交后进入人工归属确认，AI 不自动分配负责人。',
  },
  {
    id: 'capacity',
    title: '跟进数量上限',
    status: 'passed',
    detail: '当前有效商机 12 个，制度上限 20 个，可以继续报备。',
    rule: '跟进数量上限与公开招标',
    action: '规则程序按照有效商机数量进行确定性检查。',
  },
  {
    id: 'source',
    title: '来源权益识别',
    status: 'pending',
    detail: '识别为私人关系介绍，需要补充张总身份及来源证明。',
    rule: '商机来源证明 · 来源人与销售分配',
    action: '市场部核验来源材料后，来源权益才会生效。',
  },
]);

const missingFields = computed(() => {
  const fields: string[] = [];
  if (!form.value.contactPhone) fields.push('联系人手机号');
  if (!form.value.expectedAmount) fields.push('预计金额');
  if (!form.value.purchaseDate) fields.push('预计采购时间');
  return fields;
});
const selectedCheck = computed(() =>
  checks.value.find((item) => item.id === selectedCheckId.value),
);
const cardStatus = computed(() => (submitted.value ? '待归属确认' : '待补充'));

const statusColor = (status: CheckStatus) => {
  if (status === 'passed') return 'green';
  if (status === 'attention') return 'red';
  return 'orange';
};

function openOpportunity() {
  drawerOpen.value = true;
}

function fillMissingExample() {
  form.value.contactName = '陈经理';
  form.value.contactPhone = '138 0000 6821';
  form.value.expectedAmount = '80 万元';
  form.value.purchaseDate = '2026 年 11 月';
  message.success('已补齐 Demo 示例信息');
}

async function scrollToBottom() {
  await nextTick();
  if (chatScroll.value) chatScroll.value.scrollTop = chatScroll.value.scrollHeight;
}

function sendMessage() {
  const content = composer.value.trim();
  if (!content || sending.value) return;
  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    type: 'text',
    content,
    time: '刚刚',
  });
  composer.value = '';
  sending.value = true;
  void scrollToBottom();
  replyTimer = window.setTimeout(() => {
    messages.value.push({
      id: `card-${Date.now()}`,
      role: 'assistant',
      type: 'card',
      content:
        '我已经把描述整理成商机报备卡，并完成客户核验、查重和销售范围检查。请打开卡片确认信息。',
      time: '刚刚',
    });
    sending.value = false;
    void scrollToBottom();
  }, 900);
}

function usePrompt(text: string) {
  composer.value = text;
}

function toggleRecording() {
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    message.info('正在模拟语音识别');
    recordingTimer = window.setTimeout(() => {
      composer.value =
        '张总介绍了苏州智造，他们准备采购设备运维系统，下周约信息部沟通。';
      isRecording.value = false;
      message.success('语音已转成文字');
    }, 1500);
  } else if (recordingTimer) {
    window.clearTimeout(recordingTimer);
  }
}

function submitRegistration() {
  if (missingFields.value.length) {
    message.warning(`还需补充：${missingFields.value.join('、')}`);
    return;
  }
  submitted.value = true;
  drawerOpen.value = false;
  messages.value.push({
    id: `submitted-${Date.now()}`,
    role: 'assistant',
    type: 'text',
    content:
      '商机报备 BA-20260918-023 已提交。客户核验和查重已完成，目前进入“待归属确认”，预计 1 个工作日内由销售负责人处理。',
    time: '刚刚',
  });
  message.success('商机报备已提交');
  void scrollToBottom();
}

onBeforeUnmount(() => {
  if (replyTimer) window.clearTimeout(replyTimer);
  if (recordingTimer) window.clearTimeout(recordingTimer);
});
</script>

<template>
  <AiWorkPage class="sales-chat-page" icon="lucide:message-circle" title="对话">
    <template #actions>
      <Button @click="message.info('新的对话会保留当前商机报备记录')">
        <Icon icon="lucide:plus" />新对话
      </Button>
    </template>

    <div class="chat-layout">
      <main class="chat-main">
        <div ref="chatScroll" class="message-stream">
          <div class="conversation-date"><span>今天</span></div>
          <article
            v-for="item in messages"
            :key="item.id"
            class="message-row"
            :class="item.role"
          >
            <span v-if="item.role === 'assistant'" class="assistant-avatar">
              <Icon icon="lucide:bot" />
            </span>
            <div class="message-content">
              <small>{{ item.role === 'assistant' ? 'AI 销售助理' : '我' }} · {{ item.time }}</small>
              <div class="message-bubble"><p>{{ item.content }}</p></div>

              <button
                v-if="item.type === 'card'"
                class="opportunity-card"
                type="button"
                @click="openOpportunity"
              >
                <header>
                  <span><Icon icon="lucide:building-2" /></span>
                  <div><small>AI 识别的商机</small><h3>苏州智造 · 设备运维系统</h3></div>
                  <Tag :color="submitted ? 'orange' : 'red'">{{ cardStatus }}</Tag>
                </header>
                <div class="card-facts">
                  <span><small>商机类型</small><strong>新签</strong></span>
                  <span><small>来源</small><strong>私人关系介绍</strong></span>
                  <span><small>预计金额</small><strong>{{ form.expectedAmount || '待补充' }}</strong></span>
                </div>
                <section class="card-checks">
                  <div class="passed"><Icon icon="lucide:circle-check-big" /><span><strong>2 项检查通过</strong><small>客户主体、跟进数量</small></span></div>
                  <div class="warning"><Icon icon="lucide:triangle-alert" /><span><strong>{{ submitted ? '2 项待人工确认' : '3 项信息待补充' }}</strong><small>{{ submitted ? '集团客户、销售范围' : '手机号、金额、采购时间' }}</small></span></div>
                </section>
                <footer><span><Icon icon="lucide:book-open-check" />已引用 5 条销售制度规则</span><strong>查看并确认 <Icon icon="lucide:arrow-right" /></strong></footer>
              </button>
            </div>
          </article>

          <article v-if="sending" class="message-row assistant">
            <span class="assistant-avatar"><Icon icon="lucide:bot" /></span>
            <div class="typing"><i></i><i></i><i></i><span>正在整理商机并检查制度……</span></div>
          </article>
        </div>

        <div class="composer-area">
          <div class="quick-prompts">
            <button type="button" @click="usePrompt('帮我报备一个新客户')">帮我报备新客户</button>
            <button type="button" @click="usePrompt('这个客户是否已经有人报备？')">检查重复报备</button>
            <button type="button" @click="usePrompt('为什么这个商机需要人工确认？')">解释制度判断</button>
          </div>
          <div class="composer">
            <Input.TextArea
              v-model:value="composer"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              placeholder="描述新客户、跟进情况，或询问销售制度……"
              @keydown.ctrl.enter.prevent="sendMessage"
            />
            <footer>
              <button
                type="button"
                :class="{ recording: isRecording }"
                @click="toggleRecording"
              ><Icon :icon="isRecording ? 'lucide:square' : 'lucide:mic'" />{{ isRecording ? '结束录音' : '语音输入' }}</button>
              <span>Ctrl + Enter 发送</span>
              <Button type="primary" :loading="sending" @click="sendMessage"><Icon icon="lucide:send" />发送</Button>
            </footer>
          </div>
        </div>
      </main>

      <aside class="context-panel">
        <header><Icon icon="lucide:sparkles" /><div><small>当前能力</small><h3>一句话完成商机报备</h3></div></header>
        <div class="ability-list">
          <span><Icon icon="lucide:scan-text" />提取客户、来源和需求</span>
          <span><Icon icon="lucide:building-2" />核验企业主体与集团关系</span>
          <span><Icon icon="lucide:copy-check" />检查重复报备和销售范围</span>
          <span><Icon icon="lucide:book-open-check" />引用已确认的制度规则</span>
        </div>
        <section><small>AI 执行边界</small><p>AI 可以整理信息、检查规则和提出建议。归属争议、例外审批和制度缺口仍由人确认。</p></section>
        <button type="button" @click="openOpportunity"><span><Icon icon="lucide:clipboard-pen-line" /></span><div><strong>当前商机报备</strong><small>苏州智造 · {{ cardStatus }}</small></div><Icon icon="lucide:chevron-right" /></button>
      </aside>
    </div>

    <Drawer
      v-model:open="drawerOpen"
      title="确认商机报备"
      :width="780"
      placement="right"
      :mask-closable="false"
    >
      <div class="registration-drawer">
        <header class="drawer-summary">
          <span><Icon icon="lucide:building-2" /></span>
          <div><small>AI 识别的商机</small><h2>{{ form.company }}</h2><p>{{ form.opportunityType }} · {{ form.productLine }} · {{ form.source }}</p></div>
          <Tag :color="submitted ? 'orange' : 'red'">{{ cardStatus }}</Tag>
        </header>

        <div v-if="!submitted" class="missing-banner" :class="{ complete: !missingFields.length }">
          <Icon :icon="missingFields.length ? 'lucide:circle-alert' : 'lucide:circle-check-big'" />
          <div><strong>{{ missingFields.length ? `还需补充 ${missingFields.length} 项信息` : '必填信息已经完整' }}</strong><p>{{ missingFields.length ? missingFields.join('、') : '可以提交报备并进入归属确认。' }}</p></div>
          <Button v-if="missingFields.length" size="small" @click="fillMissingExample">补齐 Demo 信息</Button>
        </div>

        <nav class="drawer-anchor"><a href="#basic">商机信息</a><a href="#checks">制度检查</a><a href="#process">后续流程</a></nav>

        <section id="basic" class="drawer-section">
          <header><div><small>01</small><h3>商机信息</h3></div><span>由销售确认业务事实</span></header>
          <div class="form-grid">
            <label><span>客户企业全称</span><Input v-model:value="form.company" /></label>
            <label><span>统一社会信用代码</span><Input v-model:value="form.companyCode" /></label>
            <label><span>所属集团</span><Input v-model:value="form.companyGroup" /></label>
            <label><span>商机类型</span><Select v-model:value="form.opportunityType" :options="[{ value: '新签' }, { value: '续约' }, { value: '增购' }]" /></label>
            <label><span>联系人</span><Input v-model:value="form.contactName" /></label>
            <label :class="{ missing: !form.contactPhone }"><span>联系人手机号 *</span><Input v-model:value="form.contactPhone" placeholder="待补充" /></label>
            <label><span>联系人角色</span><Input v-model:value="form.contactRole" /></label>
            <label><span>来源联系人</span><Input v-model:value="form.sourceContact" /></label>
            <label><span>区域</span><Select v-model:value="form.region" :options="[{ value: '华东 / 江苏' }, { value: '华东 / 上海' }, { value: '华南 / 广东' }]" /></label>
            <label><span>行业</span><Input v-model:value="form.industry" /></label>
            <label><span>产品线</span><Input v-model:value="form.productLine" /></label>
            <label :class="{ missing: !form.expectedAmount }"><span>预计金额 *</span><Input v-model:value="form.expectedAmount" placeholder="待补充" /></label>
            <label :class="{ missing: !form.purchaseDate }"><span>预计采购时间 *</span><Input v-model:value="form.purchaseDate" placeholder="待补充" /></label>
            <label class="span-2"><span>初步需求</span><Input.TextArea v-model:value="form.demand" :rows="3" /></label>
          </div>
        </section>

        <section id="checks" class="drawer-section">
          <header><div><small>02</small><h3>制度检查</h3></div><span>点击查看判断依据</span></header>
          <div class="checks-layout">
            <div class="check-nav">
              <button v-for="check in checks" :key="check.id" type="button" :class="{ active: selectedCheckId === check.id }" @click="selectedCheckId = check.id"><Icon :icon="check.status === 'passed' ? 'lucide:circle-check-big' : check.status === 'attention' ? 'lucide:triangle-alert' : 'lucide:clock-3'" /><span><strong>{{ check.title }}</strong><small>{{ check.status === 'passed' ? '检查通过' : check.status === 'attention' ? '发现风险' : '待人工确认' }}</small></span><Tag :color="statusColor(check.status)">{{ check.status === 'passed' ? '通过' : check.status === 'attention' ? '风险' : '待确认' }}</Tag></button>
            </div>
            <article v-if="selectedCheck" class="check-detail">
              <small>检查结果</small><h4>{{ selectedCheck.detail }}</h4>
              <div><span>制度依据</span><strong>{{ selectedCheck.rule }}</strong></div>
              <div><span>处理方式</span><strong>{{ selectedCheck.action }}</strong></div>
              <p><Icon icon="lucide:shield-check" />待确认规则只生成提示，不会自动驳回报备或改变商机归属。</p>
            </article>
          </div>
        </section>

        <section id="process" class="drawer-section">
          <header><div><small>03</small><h3>提交后的处理流程</h3></div><span>预计 1 个工作日</span></header>
          <div class="process-flow"><div class="done"><span><Icon icon="lucide:check" /></span><strong>AI 提取信息</strong></div><div class="done"><span><Icon icon="lucide:check" /></span><strong>企业核验与查重</strong></div><div class="active"><span>3</span><strong>归属人工确认</strong></div><div><span>4</span><strong>备案成功</strong></div></div>
        </section>

        <footer class="drawer-footer">
          <span><Icon icon="lucide:info" />提交不代表归属已确认，冲突商机将进入人工处理。</span>
          <Button @click="drawerOpen = false">取消</Button>
          <Button v-if="!submitted" type="primary" :disabled="missingFields.length > 0" @click="submitRegistration">提交商机报备</Button>
          <Button v-else type="primary" @click="drawerOpen = false">完成</Button>
        </footer>
      </div>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.sales-chat-page { --accent:#a85931; --green:#246f5e; --ink:#283e37; }
.chat-layout { display:grid; grid-template-columns:minmax(0,1fr) 285px; gap:14px; height:100%; min-height:620px; }
.chat-main { display:flex; min-width:0; min-height:0; flex-direction:column; overflow:hidden; background:#fff; border:1px solid #dce7e3; border-radius:17px; }
.message-stream { flex:1; min-height:0; padding:20px 28px; overflow:auto; background:linear-gradient(180deg,#fbfdfc,#f7faf9); }
.conversation-date { display:flex; align-items:center; margin-bottom:18px; font-size:12px; color:#9aa6a2; }
.conversation-date::before,.conversation-date::after { flex:1; height:1px; content:''; background:#e5ece9; }
.conversation-date span { padding:0 10px; }
.message-row { display:flex; gap:10px; max-width:780px; margin-bottom:18px; }
.message-row.user { justify-content:flex-end; margin-left:auto; }
.assistant-avatar { display:grid; flex:none; width:34px; height:34px; place-items:center; color:#fff; background:#27705e; border-radius:10px; }
.message-content { min-width:0; max-width:680px; }
.message-content > small { display:block; margin:0 0 5px; font-size:12px; color:#93a09b; }
.message-row.user .message-content > small { text-align:right; }
.message-bubble { display:inline-block; padding:10px 13px; color:#40554f; background:#fff; border:1px solid #dfe8e5; border-radius:4px 13px 13px; box-shadow:0 5px 14px rgb(39 74 64 / 5%); }
.message-row.user .message-bubble { color:#fff; background:#2b7462; border-color:#2b7462; border-radius:13px 4px 13px 13px; }
.message-bubble p { margin:0; font-size:12px; line-height:1.65; }
.opportunity-card { display:block; width:min(100%,560px); padding:0; margin-top:8px; overflow:hidden; text-align:left; cursor:pointer; background:#fff; border:1px solid #d9e5e1; border-radius:14px; box-shadow:0 10px 26px rgb(34 72 61 / 9%); transition:.2s; }
.opportunity-card:hover { border-color:#bcd2cb; box-shadow:0 14px 30px rgb(34 72 61 / 14%); transform:translateY(-1px); }
.opportunity-card > header { display:grid; grid-template-columns:38px minmax(0,1fr) auto; gap:10px; align-items:center; padding:13px; background:linear-gradient(120deg,#f1f8f5,#fff9f5); border-bottom:1px solid #e4ece9; }
.opportunity-card > header > span { display:grid; width:36px; height:36px; place-items:center; color:#fff; background:#a85931; border-radius:10px; }
.opportunity-card header small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.08em; }
.opportunity-card header h3 { margin:2px 0 0; font-size:12px; color:#334b44; }
.opportunity-card :deep(.ant-tag) { width:auto; min-width:max-content; margin:0; white-space:nowrap; }
.card-facts { display:grid; grid-template-columns:repeat(3,1fr); padding:12px 14px; }
.card-facts span { padding:0 10px; border-right:1px solid #e8eeec; }
.card-facts span:first-child { padding-left:0; }
.card-facts span:last-child { border-right:0; }
.card-facts small,.card-facts strong { display:block; }
.card-facts small { font-size:12px; color:#94a09c; }
.card-facts strong { margin-top:3px; font-size:12px; color:#455b54; }
.card-checks { display:grid; grid-template-columns:1fr 1fr; gap:7px; padding:0 14px 12px; }
.card-checks > div { display:flex; gap:7px; align-items:center; padding:8px; color:#287260; background:#edf7f3; border-radius:8px; }
.card-checks > div.warning { color:#b36635; background:#fff5ea; }
.card-checks strong,.card-checks small { display:block; }
.card-checks strong { font-size:12px; color:#425851; }
.card-checks small { margin-top:2px; font-size:12px; color:#85938e; }
.opportunity-card > footer { display:flex; align-items:center; justify-content:space-between; padding:9px 13px; color:#788983; background:#f7faf9; border-top:1px solid #e8eeec; }
.opportunity-card > footer span,.opportunity-card > footer strong { display:flex; gap:5px; align-items:center; font-size:12px; }
.opportunity-card > footer strong { color:#a85931; }
.typing { display:flex; gap:4px; align-items:center; padding:10px 12px; background:#fff; border:1px solid #dfe8e5; border-radius:4px 12px 12px; }
.typing i { width:5px; height:5px; background:#7e948d; border-radius:50%; animation:pulse 1s infinite; }
.typing i:nth-child(2) { animation-delay:.15s; }.typing i:nth-child(3) { animation-delay:.3s; }
.typing span { margin-left:4px; font-size:12px; color:#8a9893; }
.composer-area { flex:none; padding:10px 14px 14px; background:#fff; border-top:1px solid #e1eae7; }
.quick-prompts { display:flex; gap:6px; margin-bottom:8px; }
.quick-prompts button { padding:5px 8px; font-size:12px; color:#5a726a; cursor:pointer; background:#f3f7f5; border:1px solid #e0e8e5; border-radius:7px; }
.composer { overflow:hidden; border:1px solid #ccdcd7; border-radius:12px; box-shadow:0 5px 15px rgb(37 74 64 / 5%); }
.composer :deep(textarea) { padding:10px 12px; font-size:12px; border:0; box-shadow:none; resize:none; }
.composer footer { display:flex; gap:9px; align-items:center; padding:7px 9px; background:#f8faf9; border-top:1px solid #e4ebe9; }
.composer footer > button { display:flex; gap:5px; align-items:center; padding:5px 7px; font-size:12px; color:#60766f; cursor:pointer; background:transparent; border:0; }
.composer footer > button.recording { color:#b4473d; }
.composer footer > span { flex:1; font-size:12px; color:#9aa5a1; }
.context-panel { align-self:start; padding:16px; background:linear-gradient(155deg,#f5faf8,#fff9f5); border:1px solid #dce7e3; border-radius:16px; }
.context-panel > header { display:flex; gap:9px; align-items:center; padding-bottom:12px; border-bottom:1px solid #dee8e4; }
.context-panel > header > svg { font-size:19px; color:#a85931; }
.context-panel header small { font-size:12px; font-weight:800; color:#a85931; }
.context-panel header h3 { margin:2px 0 0; font-size:12px; color:#365049; }
.ability-list { display:grid; gap:8px; padding:13px 0; }
.ability-list span { display:flex; gap:7px; align-items:center; font-size:12px; color:#536a63; }
.ability-list svg { color:#2a7764; }
.context-panel section { padding:10px; color:#8d6044; background:#fff5ec; border-radius:9px; }
.context-panel section small { font-size:12px; font-weight:800; }
.context-panel section p { margin:4px 0 0; font-size:12px; line-height:1.55; }
.context-panel > button { display:grid; grid-template-columns:32px minmax(0,1fr) 15px; gap:8px; align-items:center; width:100%; padding:10px; margin-top:12px; text-align:left; cursor:pointer; background:#fff; border:1px solid #dbe6e2; border-radius:10px; }
.context-panel > button > span { display:grid; width:30px; height:30px; place-items:center; color:#fff; background:#a85931; border-radius:8px; }
.context-panel > button strong,.context-panel > button small { display:block; }
.context-panel > button strong { font-size:12px; color:#40564f; }.context-panel > button small { margin-top:2px; font-size:12px; color:#8a9893; }
.drawer-summary { display:grid; grid-template-columns:48px minmax(0,1fr) auto; gap:12px; align-items:center; padding:15px; color:#fff; background:linear-gradient(125deg,#315f53,#244c43); border-radius:13px; }
.drawer-summary > span { display:grid; width:46px; height:46px; place-items:center; font-size:21px; color:#315f53; background:#d8eee7; border-radius:12px; }
.drawer-summary small { font-size:12px; font-weight:800; color:#afe1d4; letter-spacing:.08em; }
.drawer-summary h2 { margin:3px 0; font-size:16px; color:#fff; }.drawer-summary p { margin:0; font-size:12px; color:#d0e3dd; }
.drawer-summary :deep(.ant-tag) { width:auto; min-width:max-content; margin:0; white-space:nowrap; }
.missing-banner { display:flex; gap:9px; align-items:center; padding:11px; margin-top:12px; color:#b26434; background:#fff5ea; border:1px solid #efddca; border-radius:10px; }
.missing-banner.complete { color:#26725f; background:#edf7f3; border-color:#d3e9e1; }.missing-banner > div { flex:1; }
.missing-banner strong { display:block; font-size:12px; color:#4b5f58; }.missing-banner p { margin:2px 0 0; font-size:12px; color:#84918d; }
.drawer-anchor { display:flex; gap:6px; margin:13px 0; }.drawer-anchor a { padding:6px 9px; font-size:12px; color:#587069; background:#f2f6f4; border-radius:7px; }
.drawer-section { margin-top:12px; overflow:hidden; border:1px solid #dfe8e5; border-radius:11px; }
.drawer-section > header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f5f8f7; }
.drawer-section > header > div { display:flex; gap:7px; align-items:center; }.drawer-section > header small { font-size:12px; font-weight:800; color:#a85931; }.drawer-section > header h3 { margin:0; font-size:12px; color:#40564f; }.drawer-section > header > span { font-size:12px; color:#8a9893; }
.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; padding:12px; }.form-grid label > span { display:block; margin-bottom:4px; font-size:12px; font-weight:700; color:#596e67; }.form-grid label.missing > span { color:#b54f42; }.form-grid label.missing :deep(.ant-input) { background:#fff8f6; border-color:#e6aaa0; }.form-grid .span-2 { grid-column:1 / -1; }.form-grid :deep(.ant-select) { width:100%; }
.checks-layout { display:grid; grid-template-columns:250px minmax(0,1fr); min-height:260px; }.check-nav { padding:7px; background:#f7faf9; border-right:1px solid #e0e8e5; }.check-nav button { display:grid; grid-template-columns:18px minmax(0,1fr) auto; gap:7px; align-items:center; width:100%; padding:8px; margin-bottom:3px; text-align:left; cursor:pointer; background:transparent; border:1px solid transparent; border-radius:8px; }.check-nav button.active { background:#fff; border-color:#d8e4df; }.check-nav button > svg { color:#b16a38; }.check-nav strong,.check-nav small { display:block; }.check-nav strong { font-size:12px; color:#435a53; }.check-nav small { margin-top:2px; font-size:12px; color:#8a9893; }.check-nav :deep(.ant-tag) { width:auto; min-width:max-content; margin:0; font-size:12px; line-height:18px; }
.check-detail { padding:16px; }.check-detail > small { font-size:12px; font-weight:800; color:#a85931; }.check-detail h4 { margin:4px 0 14px; font-size:12px; line-height:1.55; color:#3e554e; }.check-detail > div { padding:9px 0; border-top:1px solid #e6ecea; }.check-detail > div span,.check-detail > div strong { display:block; }.check-detail > div span { font-size:12px; color:#929e9a; }.check-detail > div strong { margin-top:3px; font-size:12px; color:#596e67; }.check-detail > p { display:flex; gap:6px; padding:8px; margin-top:9px; font-size:12px; line-height:1.5; color:#8e6044; background:#fff5ec; border-radius:8px; }
.process-flow { display:grid; grid-template-columns:repeat(4,1fr); padding:15px; }.process-flow > div { position:relative; display:flex; flex-direction:column; align-items:center; }.process-flow > div::after { position:absolute; top:13px; left:60%; width:80%; height:2px; content:''; background:#e0e8e5; }.process-flow > div:last-child::after { display:none; }.process-flow span { z-index:1; display:grid; width:26px; height:26px; place-items:center; font-size:12px; color:#82908b; background:#edf1ef; border-radius:50%; }.process-flow .done span { color:#fff; background:#287461; }.process-flow .active span { color:#fff; background:#a85931; }.process-flow strong { margin-top:6px; font-size:12px; color:#536861; }
.drawer-footer { display:flex; gap:8px; align-items:center; padding-top:14px; margin-top:14px; border-top:1px solid #e1e9e6; }.drawer-footer > span { display:flex; flex:1; gap:5px; align-items:center; font-size:12px; color:#899691; }
@keyframes pulse { 50% { opacity:.25; transform:translateY(-2px); } }
@media (max-width:1000px) { .chat-layout { grid-template-columns:1fr; }.context-panel { display:none; } }
@media (max-width:720px) { .message-stream { padding:15px; }.checks-layout,.form-grid,.card-facts,.card-checks,.process-flow { grid-template-columns:1fr; }.check-nav { border-right:0; border-bottom:1px solid #e0e8e5; } }
</style>
