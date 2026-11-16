<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Progress, Tag } from 'ant-design-vue';

import { managedProjects } from '#/api/mock-project-management';
import { useProjectManagementDemoStore } from '#/store/project-management-demo';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import ProjectAiReasoning from '../components/project-ai-reasoning.vue';
import ProjectCreateWizard from '../components/project-create-wizard.vue';
import ProjectDemoStepper from '../components/project-demo-stepper.vue';

const router = useRouter();
const store = useProjectManagementDemoStore();
const wizardOpen = ref(false);

function handleAction(action: string) {
  if (action.includes('会议')) {
    store.confirmEscalation();
    message.success('升级会议议程草稿已生成，等待确认参会人和时间');
  } else {
    void router.push('/app/mate/employee/pmo-assistant/risks');
  }
}

function healthColor(health: string) {
  if (health === 'healthy') return 'green';
  if (health === 'at-risk' || health === 'blocked') return 'red';
  return 'orange';
}
</script>

<template>
  <AiWorkPage
    eyebrow="MANAGEMENT INTERVENTION COCKPIT"
    title="管理驾驶舱"
    description="先给出今天最值得介入的事项，再进入项目组合与指标"
  >
    <template #actions>
      <Button @click="wizardOpen = true">
        <Icon icon="lucide:sparkles" />
        AI 立项
      </Button>
      <Button
        type="primary"
        @click="router.push('/app/mate/employee/pmo-assistant/project-chat')"
      >
        <Icon icon="lucide:message-circle" />
        询问交付项目 PMO
      </Button>
    </template>

    <div class="cockpit-page">
      <ProjectDemoStepper />

      <section class="intervention-head">
        <div>
          <span>TODAY'S MANAGEMENT FOCUS</span>
          <h2>今天最应该介入的 3 件事</h2>
          <p>AI 按业务影响、时间紧迫性、证据充分度和你的决策权限排序。</p>
        </div>
        <div class="focus-count">
          <strong>3</strong>
          <span>建议介入</span>
        </div>
      </section>

      <section class="intervention-grid">
        <article class="is-critical">
          <div class="intervention-rank">01</div>
          <header>
            <Tag color="red">交付风险</Tag>
            <small>客户 B · 实施联调</small>
          </header>
          <h3>{{ store.activeStage.headline }}</h3>
          <p>{{ store.activeStage.explanation }}</p>
          <footer>
            <span>
              按期概率
              <b>{{ store.activeStage.probability }}%</b>
            </span>
            <Button
              type="primary"
              size="small"
              @click="
                router.push(
                  '/app/mate/employee/pmo-assistant/project/customer-b-delivery',
                )
              "
            >
              立即介入
            </Button>
          </footer>
        </article>
        <article>
          <div class="intervention-rank">02</div>
          <header>
            <Tag color="orange">效果观察</Tag>
            <small>华达 · 试运行</small>
          </header>
          <h3>打印卷曲问题已缓解，但缺少连续一周数据</h3>
          <p>
            建议要求交付负责人在周五前补充三次抽样记录，再决定是否进入验收。
          </p>
          <footer>
            <span>
              按期概率
              <b>74%</b>
            </span>
            <Button size="small">查看项目</Button>
          </footer>
        </article>
        <article>
          <div class="intervention-rank">03</div>
          <header>
            <Tag>资源确认</Tag>
            <small>报价平台 V2 · 测试</small>
          </header>
          <h3>回归测试量增加，当前测试资源可能不足</h3>
          <p>本周新增 18 个回归用例，建议确认测试负责人是否需要临时支持。</p>
          <footer>
            <span>
              按期概率
              <b>86%</b>
            </span>
            <Button size="small">查看项目</Button>
          </footer>
        </article>
      </section>

      <ProjectAiReasoning role="manager" compact @action="handleAction" />

      <section class="portfolio-snapshot">
        <div class="metric-strip">
          <article>
            <span>在管项目</span>
            <strong>12</strong>
            <small>本周新增 1</small>
          </article>
          <article>
            <span>预计按期</span>
            <strong>9</strong>
            <small>75% 项目可达</small>
          </article>
          <article>
            <span>需要介入</span>
            <strong class="is-warning">3</strong>
            <small>1 项已进入升级</small>
          </article>
          <article>
            <span>成果物待验收</span>
            <strong>7</strong>
            <small>本周到期 4</small>
          </article>
        </div>
        <div class="portfolio-list">
          <header>
            <h2>重点项目组合</h2>
            <Button
              type="link"
              @click="router.push('/app/mate/employee/pmo-assistant/portfolio')"
            >
              查看全部
            </Button>
          </header>
          <article v-for="project in managedProjects" :key="project.id">
            <div>
              <strong>{{ project.name }}</strong>
              <span>{{ project.stage }} · {{ project.manager }}</span>
            </div>
            <Progress
              :percent="project.progress"
              :show-info="false"
              stroke-color="#0b806f"
            />
            <span>
              按期
              {{
                project.id === 'customer-b-delivery'
                  ? store.activeStage.probability
                  : project.onTimeProbability
              }}%
            </span>
            <Tag
              :color="
                healthColor(
                  project.id === 'customer-b-delivery'
                    ? store.activeStage.health
                    : project.health,
                )
              "
            >
              {{
                project.id === 'customer-b-delivery'
                  ? store.activeStage.healthLabel
                  : project.healthLabel
              }}
            </Tag>
          </article>
        </div>
      </section>
    </div>
    <ProjectCreateWizard v-model:open="wizardOpen" />
  </AiWorkPage>
</template>

<style scoped>
.cockpit-page {
  display: grid;
  gap: 12px;
}

.intervention-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: linear-gradient(90deg, #123f38, #0b5e52);
  border-radius: 16px;
}

.intervention-head span {
  font-size: 9px;
  font-weight: 800;
  color: #8de0c9;
  letter-spacing: 0.11em;
}

.intervention-head h2 {
  margin: 5px 0 3px;
  font-size: 19px;
  color: #fff;
}

.intervention-head p {
  margin: 0;
  font-size: 11px;
  color: #c5dcd5;
}

.focus-count {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 50%;
}

.focus-count strong {
  font-size: 25px;
  color: #fff;
}

.focus-count span {
  font-size: 9px;
  letter-spacing: 0;
}

.intervention-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.intervention-grid article {
  position: relative;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  min-height: 218px;
  padding: 17px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 15px;
}

.intervention-grid article.is-critical {
  border-color: #edc5bf;
  box-shadow: 0 10px 26px rgb(191 71 59 / 8%);
}

.intervention-rank {
  position: absolute;
  top: 10px;
  right: 13px;
  font-size: 27px;
  font-weight: 800;
  color: #e8efec;
}

.intervention-grid header {
  display: flex;
  gap: 7px;
  align-items: center;
  padding-right: 42px;
}

.intervention-grid header small {
  font-size: 9px;
  color: #80918b;
}

.intervention-grid h3 {
  margin: 12px 0 6px;
  font-size: 14px;
  line-height: 1.45;
  color: #183c34;
}

.intervention-grid p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #627970;
}

.intervention-grid footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #e9f0ed;
}

.intervention-grid footer span {
  font-size: 10px;
  color: #71847d;
}

.intervention-grid footer b {
  color: #244c42;
}

.portfolio-snapshot {
  display: grid;
  grid-template-columns: minmax(0, 0.65fr) minmax(0, 1fr);
  gap: 12px;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.metric-strip article {
  display: grid;
  gap: 4px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 13px;
}

.metric-strip span,
.metric-strip small {
  font-size: 9px;
  color: #778a83;
}

.metric-strip strong {
  font-size: 22px;
  color: #173b33;
}

.metric-strip strong.is-warning {
  color: #c66e2c;
}

.portfolio-list {
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 14px;
}

.portfolio-list > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.portfolio-list h2 {
  margin: 0;
  font-size: 14px;
  color: #183b33;
}

.portfolio-list > article {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) minmax(120px, 0.7fr) 74px 70px;
  gap: 12px;
  align-items: center;
  min-height: 54px;
  border-top: 1px solid #eaf0ee;
}

.portfolio-list article > div {
  display: grid;
  gap: 2px;
}

.portfolio-list article strong {
  font-size: 11px;
  color: #264a42;
}

.portfolio-list article span {
  font-size: 9px;
  color: #71847d;
}

.cockpit-page :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 1050px) {
  .intervention-grid {
    grid-template-columns: 1fr;
  }

  .portfolio-snapshot {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .metric-strip {
    grid-template-columns: 1fr 1fr;
  }

  .portfolio-list > article {
    grid-template-columns: 1fr auto;
    padding: 10px 0;
  }

  .portfolio-list :deep(.ant-progress) {
    display: none;
  }

  .portfolio-list article > span {
    display: none;
  }
}
</style>
