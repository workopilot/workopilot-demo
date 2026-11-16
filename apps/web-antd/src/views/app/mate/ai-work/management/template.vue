<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button, message, Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const sections = [
  '本周主要工作',
  '本周成果',
  '问题与风险',
  '需要协助',
  '下周计划',
];
</script>
<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="REPORT TEMPLATE"
    title="周报模板"
    description="配置成员周报的内容结构与 AI 填写提示"
  >
    <template #actions>
      <Button type="primary" @click="message.success('模板已保存')">
        <Icon icon="lucide:save" />
        保存模板
      </Button>
    </template>
    <div class="template-layout">
      <main>
        <article v-for="(item, index) in sections" :key="item">
          <b>{{ index + 1 }}</b>
          <span>
            <strong>{{ item }}</strong>
            <small>AI 基于工作记录自动生成，成员可编辑</small>
          </span>
          <Tag color="green">启用</Tag>
          <Icon icon="lucide:grip-vertical" />
        </article>
      </main>
      <aside>
        <h3>模板预览</h3>
        <div v-for="item in sections" :key="item">
          <strong>{{ item }}</strong>
          <p>在这里展示 AI 自动生成的结构化周报内容……</p>
        </div>
      </aside>
    </div>
  </AiWorkPage>
</template>
<style scoped>
.template-layout {
  display: grid;
  grid-template-columns: 1fr 330px;
  gap: 14px;
}

.template-layout main,
.template-layout aside {
  display: grid;
  gap: 9px;
  align-content: start;
}

.template-layout article,
.template-layout aside {
  padding: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.template-layout article {
  display: grid;
  grid-template-columns: 30px 1fr auto 18px;
  gap: 10px;
  align-items: center;
}

.template-layout article b {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #0b796b;
  background: #e5f3ef;
  border-radius: 9px;
}

.template-layout article span {
  display: grid;
  gap: 3px;
}

.template-layout strong {
  font-size: 12px;
  color: #23483f;
}

.template-layout small,
.template-layout p {
  font-size: 10px;
  color: #7a8b85;
}

.template-layout aside h3 {
  margin: 0 0 4px;
  font-size: 14px;
  color: #173c34;
}

.template-layout aside div {
  padding: 10px;
  border: 1px solid #e7eeec;
  border-radius: 10px;
}

.template-layout aside p {
  margin: 6px 0 0;
}
</style>
