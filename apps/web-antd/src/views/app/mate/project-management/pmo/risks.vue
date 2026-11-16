<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Tag } from 'ant-design-vue';

import { useProjectManagementDemoStore } from '#/store/project-management-demo';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import ProjectDemoStepper from '../components/project-demo-stepper.vue';

const router = useRouter();
const store = useProjectManagementDemoStore();
const reachedLevel = computed(() => (store.state.stage <= 2 ? 1 : store.state.stage <= 4 ? 2 : 3));

function confirmEscalation() {
  store.confirmEscalation();
  message.success('升级会议议程已生成；发送和预约仍等待你的最终确认');
}
</script>

<template>
  <AiWorkPage eyebrow="RISK & ESCALATION" title="风险升级" description="按制度主动暴露风险，并保留每次提醒、解释与决策证据">
    <template #actions><Button @click="router.push('/app/mate/employee/pmo-assistant/project/customer-b-delivery?tab=risk')"><Icon icon="lucide:git-branch" /> 查看完整 Context</Button></template>
    <div class="risks-page">
      <ProjectDemoStepper />
      <section class="risk-hero" :class="`is-${store.activeStage.health}`">
        <div><span>ACTIVE ESCALATION</span><h2>客户 B · 接口联调成果物</h2><p>{{ store.activeStage.headline }}</p></div>
        <div class="risk-probability"><strong>{{ store.activeStage.probability }}%</strong><span>按期概率</span></div>
      </section>
      <section class="escalation-layout">
        <div class="escalation-flow">
          <header><div><h2>三段升级处理</h2><p>动作是否自动执行由权限与影响范围决定。</p></div><Tag color="orange">当前第 {{ reachedLevel }} 段</Tag></header>
          <article :class="{ 'is-reached': reachedLevel >= 1 }">
            <div class="level-dot">1</div><div><span>临期提醒</span><h3>提醒成果物负责人补齐联调测试报告</h3><p>触发条件：成果物到期前 3 天仍无可验收版本。</p><footer><Tag color="green">可自动执行</Tag><span>已于 08/09 09:00 提醒张三</span></footer></div>
          </article>
          <article :class="{ 'is-reached': reachedLevel >= 2 }">
            <div class="level-dot">2</div><div><span>逾期解释与管理同步</span><h3>要求提交原因、影响与补救方案，并同步项目经理</h3><p>触发条件：成果物逾期或连续两周承诺未兑现。</p><footer><Tag :color="store.state.stage >= 4 ? 'green' : 'orange'">{{ store.state.stage >= 4 ? '已补充' : '等待回应' }}</Tag><span>项目经理李四已收到风险摘要</span></footer></div>
          </article>
          <article :class="{ 'is-reached': reachedLevel >= 3 }">
            <div class="level-dot">3</div><div><span>管理升级</span><h3>建议召开双方项目升级会</h3><p>触发条件：补救计划仍受关键外部依赖阻塞，新承诺日期再次临近。</p><footer><Tag :color="store.state.escalationConfirmed ? 'green' : 'red'">{{ store.state.escalationConfirmed ? '已生成草稿' : '需管理者确认' }}</Tag><Button v-if="!store.state.escalationConfirmed" type="primary" size="small" @click="confirmEscalation">确认生成会议议程</Button></footer></div>
          </article>
        </div>
        <aside>
          <section class="risk-reasons"><span>AI 判断依据</span><h2>为什么现在需要升级</h2><div><Icon icon="lucide:calendar-x" /><p><b>时间</b> 新承诺日期还有 2 天，客户环境仍未就绪。</p></div><div><Icon icon="lucide:notebook-tabs" /><p><b>证据</b> 连续两周周报存在未兑现承诺。</p></div><div><Icon icon="lucide:book-open-check" /><p><b>制度</b> 命中标准交付项目第三段升级规则。</p></div><div><Icon icon="lucide:shield-check" /><p><b>权限</b> 客户会议必须由项目经理确认后发起。</p></div></section>
          <section v-if="store.state.escalationConfirmed" class="agenda-draft"><header><Icon icon="lucide:file-check-2" /><div><span>AI 已生成</span><h3>客户 B 联调升级会议议程</h3></div></header><ol><li>确认客户测试环境就绪责任人与时间</li><li>评估延期对 UAT 和上线日期的影响</li><li>确定双方补救动作与每日同步机制</li><li>形成新的书面承诺和验收条件</li></ol><Button block type="primary">审阅并确认发送</Button></section>
        </aside>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.risks-page { display: grid; gap: 12px; }
.risk-hero { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; color: #fff; background: linear-gradient(100deg,#9c4d43,#c86d4f); border-radius: 16px; }
.risk-hero.is-healthy { background: linear-gradient(100deg,#0d594d,#13806d); }
.risk-hero.is-watch { background: linear-gradient(100deg,#98601d,#cf8a2d); }
.risk-hero span { font-size: 9px; font-weight: 800; color: rgb(255 255 255 / 72%); letter-spacing: .1em; }
.risk-hero h2 { margin: 5px 0; font-size: 18px; }
.risk-hero p { margin: 0; font-size: 11px; color: rgb(255 255 255 / 80%); }
.risk-probability { display: grid; place-items: center; width: 76px; height: 76px; background: rgb(255 255 255 / 12%); border: 1px solid rgb(255 255 255 / 20%); border-radius: 50%; }
.risk-probability strong { font-size: 23px; }.risk-probability span { letter-spacing: 0; }
.escalation-layout { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(280px,.68fr); gap: 12px; }
.escalation-flow,.risk-reasons,.agenda-draft { padding: 18px; background: #fff; border: 1px solid #dce8e4; border-radius: 15px; }
.escalation-flow > header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #e8efec; }
.escalation-flow h2,.risk-reasons h2 { margin: 0 0 3px; font-size: 15px; color: #183c34; }
.escalation-flow header p { margin: 0; font-size: 10px; color: #71847d; }
.escalation-flow > article { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 13px; padding: 16px 0; opacity: .55; border-bottom: 1px solid #eaf0ee; }
.escalation-flow > article.is-reached { opacity: 1; }
.level-dot { display: grid; place-items: center; width: 34px; height: 34px; font-size: 11px; font-weight: 800; color: #70857d; background: #eef4f1; border-radius: 50%; }
.is-reached .level-dot { color: #fff; background: #0b806f; box-shadow: 0 0 0 5px #e6f3ef; }
.escalation-flow article span,.risk-reasons > span,.agenda-draft header span { font-size: 9px; font-weight: 800; color: #0b806f; letter-spacing: .07em; }
.escalation-flow h3 { margin: 5px 0; font-size: 13px; color: #24473f; }
.escalation-flow article p,.risk-reasons p { margin: 0; font-size: 10px; line-height: 1.55; color: #667c74; }
.escalation-flow article footer { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; }
.escalation-flow article footer > span { font-weight: 400; color: #768981; letter-spacing: 0; }
.escalation-layout > aside { display: grid; align-content: start; gap: 12px; }
.risk-reasons > div { display: flex; gap: 9px; align-items: flex-start; padding: 10px 0; border-top: 1px solid #edf2f0; }
.risk-reasons svg { flex: none; margin-top: 2px; color: #0b806f; }
.risk-reasons b { color: #294b43; }
.agenda-draft { border-color: #bcded4; box-shadow: 0 10px 24px rgb(18 57 45 / 7%); }
.agenda-draft header { display: flex; gap: 10px; align-items: center; }
.agenda-draft header > svg { font-size: 22px; color: #0b806f; }
.agenda-draft h3 { margin: 3px 0 0; font-size: 13px; color: #1c4037; }
.agenda-draft ol { padding-left: 20px; margin: 14px 0; font-size: 10px; line-height: 1.9; color: #5d746b; }
.risks-page :deep(.ant-btn-primary) { background: #0b6e65; border-color: #0b6e65; }
@media (max-width: 940px) { .escalation-layout { grid-template-columns: 1fr; } }
</style>

