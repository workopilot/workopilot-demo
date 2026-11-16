<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Drawer } from 'ant-design-vue';

import { aiWorkEvidence } from '#/api/mock-data-ai-work';

defineProps<{ open: boolean }>();

const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const router = useRouter();

function openSource(route?: string) {
  if (route) void router.push(route);
  emit('update:open', false);
}
</script>

<template>
  <Drawer
    :open="open"
    title="Evidence Chain"
    placement="right"
    width="520"
    @close="emit('update:open', false)"
  >
    <div class="evidence-intro">
      <Icon icon="lucide:waypoints" />
      <div>
        <strong>客户 B 接口联调连续延期</strong>
        <p>从历史承诺到管理洞察的完整证据链。</p>
      </div>
    </div>
    <ol class="evidence-chain">
      <li v-for="node in aiWorkEvidence" :key="node.id">
        <span><Icon :icon="node.icon" /></span>
        <article>
          <header>
            <strong>{{ node.title }}</strong>
            <time>{{ node.time }}</time>
          </header>
          <small>{{ node.source }}</small>
          <p>{{ node.excerpt }}</p>
          <Button
            v-if="node.route"
            size="small"
            type="link"
            @click="openSource(node.route)"
          >
            打开来源
            <Icon icon="lucide:arrow-up-right" />
          </Button>
        </article>
      </li>
    </ol>
  </Drawer>
</template>

<style scoped>
.evidence-intro {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  margin-bottom: 22px;
  color: #0b6e65;
  background: #eef8f4;
  border: 1px solid #cbe2da;
  border-radius: 16px;
}

.evidence-intro > svg {
  flex: none;
  font-size: 24px;
}

.evidence-intro p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #607a72;
}

.evidence-chain {
  display: grid;
  gap: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.evidence-chain li {
  position: relative;
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 12px;
  padding-bottom: 18px;
}

.evidence-chain li:not(:last-child)::before {
  position: absolute;
  top: 34px;
  bottom: 0;
  left: 17px;
  width: 1px;
  content: '';
  background: #cfe1db;
}

.evidence-chain li > span {
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #0b7b6c;
  background: #fff;
  border: 1px solid #cfe1db;
  border-radius: 50%;
}

.evidence-chain article {
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e0e9e6;
  border-radius: 14px;
}

.evidence-chain header {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.evidence-chain time,
.evidence-chain small {
  font-size: 10px;
  color: #82958f;
}

.evidence-chain p {
  margin: 9px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #475f58;
}
</style>
