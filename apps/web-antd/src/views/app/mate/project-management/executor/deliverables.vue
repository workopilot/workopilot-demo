<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Progress, Segmented, Tag } from 'ant-design-vue';

import { managedProjects } from '#/api/mock-project-management';
import { useProjectManagementDemoStore } from '#/store/project-management-demo';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

const router = useRouter();
const store = useProjectManagementDemoStore();
const filter = ref('全部');
const project = managedProjects[0]!;
const deliverables = computed(() =>
  project.objectives.flatMap((objective) =>
    objective.krs
      .filter((kr) => kr.kind === 'deliverable')
      .map((kr) => ({ ...kr, objective: `${objective.code} · ${objective.title}` })),
  ),
);

function generateChecklist() {
  store.generateArtifact('成果物验收清单');
  message.success('已按标准交付制度生成成果物验收清单');
}

function confirmLink() {
  store.confirmWeeklyLink();
  message.success('周报内容已关联到 KR2.1，提交后进入证据链');
}
</script>

<template>
  <AiWorkPage
    eyebrow="DELIVERABLES & EVIDENCE"
    title="成果物"
    description="用可交付成果和业务证据验证 KR，而不是手动勾选任务"
  >
    <template #actions>
      <Button @click="router.push('/app/mate/employee/report-copilot/current-report')">
        <Icon icon="lucide:external-link" /> 打开本周周报
      </Button>
      <Button type="primary" @click="generateChecklist">
        <Icon icon="lucide:list-checks" /> 生成验收清单
      </Button>
    </template>

    <div class="deliverables-page">
      <section class="evidence-confirm">
        <div class="evidence-confirm__icon"><Icon icon="lucide:wand-sparkles" /></div>
        <div>
          <span>AI 发现新的周报证据</span>
          <h2>“客户 B 接口联调延期”建议关联 KR2.1</h2>
          <p>命中项目、客户、接口联调和新承诺日期；置信度 92%。确认后项目健康度会引用该证据。</p>
        </div>
        <div class="evidence-confirm__actions">
          <Tag v-if="store.state.weeklyLinkConfirmed" color="green">已确认关联</Tag>
          <Button v-else type="primary" @click="confirmLink">确认关联</Button>
          <Button @click="router.push('/app/mate/employee/report-copilot/current-report')">查看原文</Button>
        </div>
      </section>

      <section class="deliverables-toolbar">
        <div>
          <h2>客户 B 集成交付项目</h2>
          <p>3 个 O · 4 项成果型 KR · 1 项需要关注</p>
        </div>
        <Segmented v-model:value="filter" :options="['全部', '待提交', '临期', '已验收']" />
      </section>

      <section class="deliverable-list">
        <article v-for="item in deliverables" :key="item.id">
          <div class="deliverable-status" :class="`is-${item.status}`">
            <Icon :icon="item.status === 'accepted' ? 'lucide:badge-check' : 'lucide:file-clock'" />
          </div>
          <div class="deliverable-copy">
            <div>
              <Tag>{{ item.objective }}</Tag>
              <Tag :color="item.status === 'accepted' ? 'green' : item.status === 'at-risk' ? 'orange' : undefined">
                {{ item.status === 'accepted' ? '已验收' : item.status === 'at-risk' ? '临期' : '待开始' }}
              </Tag>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.acceptance }}</p>
            <footer>
              <span><Icon icon="lucide:user-round" /> {{ item.owner }}</span>
              <span><Icon icon="lucide:calendar" /> {{ item.dueDate }}</span>
              <span v-if="item.weeklyEvidence"><Icon icon="lucide:notebook-tabs" /> {{ item.weeklyEvidence }}</span>
            </footer>
          </div>
          <div class="deliverable-file">
            <small>当前成果</small>
            <strong>{{ item.artifact }}</strong>
            <Progress
              v-if="item.status !== 'accepted'"
              :percent="item.id === 'kr-2-1' ? 35 : 0"
              size="small"
              stroke-color="#d18a2e"
            />
            <Button size="small" @click="item.id === 'kr-2-1' ? generateChecklist() : undefined">
              {{ item.status === 'accepted' ? '查看证据' : '开始完善' }}
            </Button>
          </div>
        </article>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.deliverables-page {
  display: grid;
  gap: 12px;
}

.evidence-confirm {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 13px;
  align-items: center;
  padding: 16px;
  background: linear-gradient(90deg, #edf8f4, #fff);
  border: 1px solid #bcded4;
  border-radius: 14px;
}

.evidence-confirm__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 19px;
  color: #0b806f;
  background: #fff;
  border: 1px solid #d2e7e0;
  border-radius: 12px;
}

.evidence-confirm span {
  font-size: 9px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.08em;
}

.evidence-confirm h2 {
  margin: 4px 0;
  font-size: 15px;
  color: #173b33;
}

.evidence-confirm p,
.deliverables-toolbar p,
.deliverable-copy p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #61776f;
}

.evidence-confirm__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.deliverables-toolbar {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 13px;
}

.deliverables-toolbar h2 {
  margin: 0 0 3px;
  font-size: 15px;
  color: #183b33;
}

.deliverable-list {
  display: grid;
  gap: 9px;
}

.deliverable-list article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(170px, 0.34fr);
  gap: 14px;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 14px;
}

.deliverable-status {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 19px;
  color: #70877e;
  background: #eff4f2;
  border-radius: 12px;
}

.deliverable-status.is-accepted {
  color: #0b806f;
  background: #e7f4ef;
}

.deliverable-status.is-at-risk {
  color: #c66e2c;
  background: #fff3e7;
}

.deliverable-copy > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.deliverable-copy h3 {
  margin: 8px 0 4px;
  font-size: 14px;
  color: #1a4037;
}

.deliverable-copy footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.deliverable-copy footer span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 10px;
  color: #70837c;
}

.deliverable-file {
  display: grid;
  gap: 8px;
  padding-left: 14px;
  border-left: 1px solid #e6eeeb;
}

.deliverable-file small {
  font-size: 9px;
  color: #80918b;
}

.deliverable-file strong {
  overflow: hidden;
  font-size: 11px;
  color: #264b42;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deliverables-page :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 840px) {
  .evidence-confirm,
  .deliverable-list article {
    grid-template-columns: 1fr;
  }

  .evidence-confirm__icon {
    display: none;
  }

  .evidence-confirm__actions {
    justify-content: flex-start;
  }

  .deliverable-file {
    padding: 12px 0 0;
    border-top: 1px solid #e6eeeb;
    border-left: 0;
  }
}
</style>

