<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Switch } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const rules = ref([
  {
    title: '工作完整度低于 80%',
    desc: '提醒成员补充工作结果与来源证据',
    on: true,
  },
  {
    title: '上周承诺未兑现',
    desc: '必须说明原因、影响与新的完成时间',
    on: true,
  },
  {
    title: '高风险事项需主管确认',
    desc: '审核时展示风险证据链并要求明确结论',
    on: true,
  },
  {
    title: '自动通过低风险周报',
    desc: '完整度高于 95% 且无风险时自动通过',
    on: false,
  },
]);
</script>
<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="REVIEW RULES"
    title="审核规则"
    description="统一周报质量检查与主管审核口径"
  >
    <template #actions>
      <Button type="primary" @click="message.success('审核规则已保存')">
        <Icon icon="lucide:save" />
        保存规则
      </Button>
    </template>
    <div class="rules">
      <article v-for="rule in rules" :key="rule.title">
        <div><Icon icon="lucide:shield-check" /></div>
        <span>
          <strong>{{ rule.title }}</strong>
          <small>{{ rule.desc }}</small>
        </span>
        <Switch v-model:checked="rule.on" />
      </article>
    </div>
  </AiWorkPage>
</template>
<style scoped>
.rules {
  display: grid;
  gap: 10px;
}

.rules article {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.rules article > div {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  color: #0b7b6d;
  background: #e5f4ef;
  border-radius: 12px;
}

.rules span {
  display: grid;
  gap: 4px;
}

.rules strong {
  font-size: 13px;
  color: #24483f;
}

.rules small {
  font-size: 10px;
  color: #788a84;
}
</style>
