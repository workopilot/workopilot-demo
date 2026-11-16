<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const risks = [
  {
    title: '客户 B 接口联调延期',
    object: '客户 B 集成',
    level: '高',
    cause: '客户测试环境未准备完成',
    action: '下周三前完成联调',
  },
  {
    title: '华达打印效果待稳定验证',
    object: '华达智能打印',
    level: '高',
    cause: '现场问题刚完成处理',
    action: '连续观察一周并形成结论',
  },
  {
    title: '报价平台联调缺陷',
    object: '报价平台 V2',
    level: '中',
    cause: '两项边界场景待修复',
    action: '周五前完成回归',
  },
];
</script>
<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="RISK INTELLIGENCE"
    title="风险洞察"
    description="识别跨周未兑现承诺、外部依赖和重复问题"
  >
    <div class="risk-list">
      <article v-for="item in risks" :key="item.title">
        <div><Icon icon="lucide:triangle-alert" /></div>
        <main>
          <header>
            <h3>{{ item.title }}</h3>
            <Tag :color="item.level === '高' ? 'red' : 'orange'">
              {{ item.level }}风险
            </Tag>
          </header>
          <p>{{ item.cause }}</p>
          <footer>
            <span>对象：{{ item.object }}</span>
            <strong>建议：{{ item.action }}</strong>
          </footer>
        </main>
      </article>
    </div>
  </AiWorkPage>
</template>
<style scoped>
.risk-list {
  display: grid;
  gap: 10px;
}

.risk-list article {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.risk-list article > div {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 19px;
  color: #d95249;
  background: #fff0ed;
  border-radius: 13px;
}

.risk-list header,
.risk-list footer {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.risk-list h3 {
  margin: 0;
  font-size: 14px;
  color: #173c34;
}

.risk-list p {
  margin: 7px 0 10px;
  font-size: 12px;
  color: #60746d;
}

.risk-list footer {
  font-size: 10px;
  color: #748780;
}

.risk-list footer strong {
  color: #0b796b;
}
</style>
