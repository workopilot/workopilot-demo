<script setup lang="ts">
import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Tag } from 'ant-design-vue';

import { comments } from './demo-state';

const followUps = computed(() =>
  comments.value.filter((item) => item.kind !== 'comment'),
);
</script>

<template>
  <section class="follow-page">
    <header>
      <div>
        <span>NEXT WEEK FOCUS</span>
        <h1>下周关注</h1>
        <p>来自汇报审阅的问题和行动建议；先要求回应，必要时再转为长期目标。</p>
      </div>
      <Button type="primary">
        <Icon icon="lucide:send" />
        提醒相关人员
      </Button>
    </header>
    <div class="summary-grid">
      <article>
        <strong>{{ followUps.length }}</strong>
        <span>待持续关注</span>
      </article>
      <article>
        <strong>1</strong>
        <span>等待员工回应</span>
      </article>
      <article>
        <strong>1</strong>
        <span>跨部门协同</span>
      </article>
    </div>
    <main>
      <article v-for="item in followUps" :key="item.id" class="follow-card">
        <div class="follow-icon" :class="item.kind">
          <Icon
            :icon="
              item.kind === 'question' ? 'lucide:circle-help' : 'lucide:route'
            "
          />
        </div>
        <div class="follow-copy">
          <div>
            <Tag :color="item.kind === 'question' ? 'orange' : 'blue'">
              {{ item.kind === 'question' ? '主管提问' : '行动建议' }}
            </Tag>
            <span>来源：王天豪 W32 汇报 · {{ item.section }}</span>
          </div>
          <h2>{{ item.content }}</h2>
          <p v-if="item.replies?.length">
            <strong>最新回应：</strong>
            {{ item.replies[0]?.content }}
          </p>
          <footer>
            <span>
              <Icon icon="lucide:user" />
              负责人：王天豪
            </span>
            <span>
              <Icon icon="lucide:calendar" />
              下周汇报自动检查
            </span>
            <Button size="small">查看原文</Button>
            <Button size="small" type="text">转为目标</Button>
          </footer>
        </div>
      </article>
    </main>
  </section>
</template>

<style scoped>
.follow-page {
  width: 100%;
  height: 100%;
  padding: 26px;
  overflow: auto;
  background: #f6f9f8;
  border: 1px solid #d7e4df;
  border-radius: 14px;
}

.follow-page > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.follow-page header span {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.follow-page h1 {
  margin: 5px 0;
  font-size: 25px;
}

.follow-page header p {
  margin: 0;
  color: #687f77;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 22px 0;
}

.summary-grid article {
  display: grid;
  padding: 17px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.summary-grid strong {
  font-size: 24px;
}

.summary-grid span {
  font-size: 11px;
  color: #7b8f88;
}

.follow-page main {
  display: grid;
  gap: 10px;
}

.follow-card {
  display: flex;
  gap: 14px;
  padding: 18px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.follow-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 42px;
  height: 42px;
  color: #b66b21;
  background: #fff1dd;
  border-radius: 9px;
}

.follow-icon.action {
  color: #276fa9;
  background: #e7f2fa;
}

.follow-copy {
  flex: 1;
  min-width: 0;
}

.follow-copy > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.follow-copy > div span {
  font-size: 10px;
  color: #81958e;
}

.follow-copy h2 {
  margin: 10px 0 8px;
  font-size: 15px;
}

.follow-copy p {
  padding: 9px;
  margin: 0;
  color: #4b655d;
  background: #f3f7f5;
  border-radius: 7px;
}

.follow-copy footer {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-top: 13px;
  font-size: 10px;
  color: #748a82;
}

.follow-copy footer span {
  display: flex;
  gap: 4px;
  align-items: center;
}

.follow-copy footer .ant-btn:first-of-type {
  margin-left: auto;
}

@media (max-width: 760px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .follow-page {
    padding: 16px;
  }

  .follow-page > header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .follow-copy footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
