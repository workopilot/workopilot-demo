<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal, Tag } from 'ant-design-vue';

import { aiWorkReportItems } from '#/api/mock-data-ai-work';
import { useAiWorkDemoStore } from '#/store/ai-work-demo';

import AiWorkPage from '../components/ai-work-page.vue';
import EvidenceChainDrawer from '../components/evidence-chain-drawer.vue';

const store = useAiWorkDemoStore();
const router = useRouter();
const evidenceOpen = ref(false);
const returnOpen = ref(false);
const returnReason = ref('请补充客户 B 联调的最新预计完成时间。');

function approve(markFocus = false) {
  store.approveReport(markFocus);
  message.success(markFocus ? '周报已通过并标记重点关注' : '周报已通过');
}

function confirmReturn() {
  if (!returnReason.value.trim()) {
    message.warning('请填写退回原因');
    return;
  }
  store.returnReport(returnReason.value.trim());
  returnOpen.value = false;
  message.success('已退回张三补充');
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="AI MANAGEMENT REVIEW"
    title="张三 · 第 32 周周报"
    description="产品研发部 · 提交于 08-07 17:26"
  >
    <template #actions>
      <Button @click="router.push('/app/mate/employee/weekly-review/pending')">
        <Icon icon="lucide:arrow-left" />
        返回列表
      </Button>
      <Tag color="blue">{{ store.reportStatusLabel }}</Tag>
    </template>

    <div class="review-detail">
      <main>
        <header>
          <div>
            <span>工作完整度</span>
            <strong>{{ store.state.completeness }}%</strong>
          </div>
          <div>
            <span>本周工作</span>
            <strong>5 项</strong>
          </div>
          <div>
            <span>关联项目</span>
            <strong>3 个</strong>
          </div>
          <div>
            <span>风险事项</span>
            <strong class="is-risk">1 项</strong>
          </div>
        </header>
        <section v-for="item in aiWorkReportItems" :key="item.id">
          <div>
            <h2>{{ item.title }}</h2>
            <Tag v-if="item.category === 'risk'" color="orange">风险</Tag>
          </div>
          <p>{{ item.content }}</p>
          <footer>
            <span v-if="item.customer">客户：{{ item.customer }}</span>
            <span v-if="item.project">项目：{{ item.project }}</span>
            <Button size="small" type="link" @click="evidenceOpen = true">
              查看 Evidence（{{ item.evidenceCount }}）
            </Button>
          </footer>
        </section>
      </main>

      <aside>
        <section class="management-summary">
          <header>
            <Icon icon="lucide:sparkles" />
            <strong>AI Management Review</strong>
          </header>
          <h3>本周摘要</h3>
          <p>
            张三本周主要推进报价平台 V2 与华达项目，报价模块按计划推进，但客户 B
            接口联调发生延期。
          </p>
        </section>
        <section class="management-risk">
          <div>
            <h3>客户 B 联调延期</h3>
            <Tag color="orange">中风险</Tag>
          </div>
          <p>上周承诺本周完成接口联调，本周仍未完成。</p>
          <blockquote>
            <strong>第 31 周</strong>
            计划本周完成客户 B 接口联调
            <strong>第 32 周</strong>
            因客户测试环境未准备完成延期
          </blockquote>
          <Button size="small" @click="evidenceOpen = true">
            <Icon icon="lucide:waypoints" />
            查看完整证据
          </Button>
        </section>
        <section>
          <h3>需要支持</h3>
          <p>客户环境持续未完成，可能需要项目负责人帮助推进。</p>
        </section>
        <section>
          <h3>建议追问</h3>
          <ol>
            <li>客户环境预计什么时候准备完成？</li>
            <li>当前是否存在新的明确完成时间？</li>
            <li>是否需要项目经理协助推进？</li>
          </ol>
        </section>
      </aside>

      <footer class="review-actions">
        <Button type="primary" @click="approve(false)">
          <Icon icon="lucide:check" />
          通过
        </Button>
        <Button @click="returnOpen = true">
          <Icon icon="lucide:undo-2" />
          退回补充
        </Button>
        <Button danger @click="approve(true)">
          <Icon icon="lucide:bookmark" />
          通过并标记重点关注
        </Button>
      </footer>
    </div>

    <Modal
      v-model:open="returnOpen"
      title="退回补充"
      ok-text="确认退回"
      cancel-text="取消"
      @ok="confirmReturn"
    >
      <p>请说明需要员工补充的信息。</p>
      <Input.TextArea v-model:value="returnReason" :rows="4" />
    </Modal>
    <EvidenceChainDrawer v-model:open="evidenceOpen" />
  </AiWorkPage>
</template>

<style scoped>
.review-detail {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 65fr) minmax(320px, 35fr);
  gap: 14px;
  padding-bottom: 68px;
}

.review-detail > main,
.review-detail > aside {
  display: grid;
  gap: 11px;
  align-content: start;
}

.review-detail > main > header,
.review-detail > main > section,
.review-detail > aside > section {
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.review-detail > main > header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.review-detail > main > header div {
  display: grid;
  gap: 3px;
  border-right: 1px solid #e5eeeb;
}

.review-detail > main > header span {
  font-size: 10px;
  color: #758a83;
}

.review-detail > main > header strong {
  font-size: 18px;
  color: #173e35;
}

.review-detail .is-risk {
  color: #dc5c45;
}

.review-detail main section > div,
.management-risk > div {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.review-detail h2,
.review-detail h3 {
  margin: 0;
  color: #173e35;
}

.review-detail h2 {
  font-size: 14px;
}

.review-detail h3 {
  font-size: 13px;
}

.review-detail p,
.review-detail li,
.review-detail blockquote {
  font-size: 12px;
  line-height: 1.75;
  color: #5d736b;
}

.review-detail main footer {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 10px;
  color: #71847e;
}

.management-summary header {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 14px;
  color: #0b806f;
}

.management-risk {
  border-left: 4px solid #e5a13b !important;
}

.management-risk blockquote {
  display: grid;
  gap: 3px;
  padding: 10px;
  margin: 10px 0;
  background: #fff7ea;
  border-radius: 10px;
}

.review-detail aside ol {
  padding-left: 18px;
  margin: 9px 0 0;
}

.review-actions {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 11px 14px;
  background: rgb(255 255 255 / 95%);
  border: 1px solid #d5e4df;
  border-radius: 15px;
  box-shadow: 0 -8px 24px rgb(18 57 45 / 7%);
}

@media (max-width: 1280px) {
  .review-detail {
    grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr);
  }
}
</style>
