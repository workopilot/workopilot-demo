<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Progress, Tag } from 'ant-design-vue';

import { useProjectManagementDemoStore } from '#/store/project-management-demo';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import ProjectAiReasoning from '../components/project-ai-reasoning.vue';
import ProjectDemoStepper from '../components/project-demo-stepper.vue';

const router = useRouter();
const store = useProjectManagementDemoStore();

function handleAiAction(action: string) {
  if (action.includes('补救')) {
    store.generateArtifact('补救计划');
    message.success('补救计划草稿已生成');
  } else {
    void router.push('/app/mate/employee/project-assistant/project/customer-b-delivery');
  }
}

function generate(name: string) {
  store.generateArtifact(name);
  message.success(`${name}已生成，可继续编辑`);
}
</script>

<template>
  <AiWorkPage
    eyebrow="TODAY'S NEXT BEST ACTIONS"
    title="今日推进"
    description="不是待办数量，而是结合目标、成果物和依赖后的行动优先级"
  >
    <template #actions>
      <Button @click="generate('周报草稿')">
        <Icon icon="lucide:file-pen-line" /> 生成周报草稿
      </Button>
      <Button type="primary" @click="router.push('/app/mate/employee/project-assistant/project-chat')">
        <Icon icon="lucide:message-circle" /> 问项目助理
      </Button>
    </template>

    <div class="today-page">
      <ProjectDemoStepper />
      <ProjectAiReasoning role="executor" @action="handleAiAction" />

      <section class="today-grid">
        <div class="today-actions">
          <header>
            <div>
              <span>按影响与紧迫性排序</span>
              <h2>今天最值得完成的 3 件事</h2>
            </div>
            <Tag color="orange">1 项临期</Tag>
          </header>
          <article class="is-primary">
            <b>01</b>
            <div>
              <div class="action-title">
                <Tag color="orange">优先处理</Tag>
                <small>预计 45 分钟</small>
              </div>
              <h3>补齐接口联调测试报告</h3>
              <p>直接影响 O2 是否可以进入 UAT；AI 已准备成果物验收清单。</p>
              <footer>
                <Button type="primary" @click="router.push('/app/mate/employee/project-assistant/deliverables')">
                  开始处理
                </Button>
                <Button @click="generate('成果物验收清单')">生成验收清单</Button>
              </footer>
            </div>
          </article>
          <article>
            <b>02</b>
            <div>
              <div class="action-title"><Tag>依赖确认</Tag><small>今天 14:00 前</small></div>
              <h3>确认客户测试环境开通时间</h3>
              <p>当前最大阻塞来自客户侧白名单，建议与客户 IT 负责人形成书面承诺。</p>
            </div>
          </article>
          <article>
            <b>03</b>
            <div>
              <div class="action-title"><Tag color="green">可由 AI 协助</Tag><small>预计 10 分钟</small></div>
              <h3>更新本周 KR 进展到周报</h3>
              <p>已识别 3 条工作记录和 2 份附件，确认关联后可生成周报段落。</p>
            </div>
          </article>
        </div>

        <aside class="today-context">
          <header>
            <span>CURRENT OBJECTIVE</span>
            <h2>O2 · 完成接口联调并达到可验收状态</h2>
          </header>
          <div class="objective-progress">
            <Progress
              type="circle"
              :percent="store.activeStage.progress"
              :size="88"
              stroke-color="#0b806f"
            />
            <div>
              <strong>当前阶段：实施联调</strong>
              <p>2 个 KR · 1 项临期 · 1 个外部依赖</p>
            </div>
          </div>
          <div class="context-list">
            <div><Icon icon="lucide:target" /><span><b>KR2.1</b> 联调测试报告</span><Tag color="orange">临期</Tag></div>
            <div><Icon icon="lucide:gauge" /><span><b>KR2.2</b> 测试通过率</span><strong>68 / 95%</strong></div>
            <div><Icon icon="lucide:link-2" /><span><b>依赖</b> 客户测试环境</span><Tag color="red">未就绪</Tag></div>
          </div>
          <Button block @click="router.push('/app/mate/employee/project-assistant/project/customer-b-delivery')">
            查看完整项目 Context <Icon icon="lucide:arrow-right" />
          </Button>
        </aside>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.today-page {
  display: grid;
  gap: 12px;
}

.today-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.8fr);
  gap: 12px;
}

.today-actions,
.today-context {
  padding: 18px;
  background: #fff;
  border: 1px solid #d9e6e1;
  border-radius: 16px;
}

.today-actions > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.today-actions header span,
.today-context header span {
  font-size: 9px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.1em;
}

.today-actions h2,
.today-context h2 {
  margin: 4px 0 0;
  font-size: 16px;
  color: #183b33;
}

.today-actions > article {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid #e9f0ed;
}

.today-actions > article > b {
  flex: none;
  font-size: 11px;
  color: #8a9d96;
}

.today-actions article > div {
  flex: 1;
}

.today-actions article.is-primary {
  padding: 15px;
  background: #f6faf8;
  border: 1px solid #cfe2db;
  border-radius: 12px;
}

.action-title,
.today-actions footer {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-title small {
  font-size: 10px;
  color: #83938e;
}

.today-actions h3 {
  margin: 7px 0 4px;
  font-size: 14px;
  color: #1b4037;
}

.today-actions p,
.objective-progress p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #637970;
}

.today-actions footer {
  padding-top: 10px;
}

.objective-progress {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 18px 0;
}

.objective-progress strong {
  font-size: 12px;
  color: #23473e;
}

.context-list {
  display: grid;
  gap: 8px;
  padding: 12px 0 16px;
  border-top: 1px solid #e8efec;
}

.context-list > div {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  font-size: 11px;
  color: #5e756c;
}

.context-list > div > svg {
  flex: none;
  color: #0b806f;
}

.context-list > div > span {
  flex: 1;
}

.context-list b,
.context-list strong {
  color: #274b42;
}

.today-page :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 980px) {
  .today-grid {
    grid-template-columns: 1fr;
  }
}
</style>

