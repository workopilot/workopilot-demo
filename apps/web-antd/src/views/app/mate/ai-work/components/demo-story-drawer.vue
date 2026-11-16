<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Modal } from 'ant-design-vue';

import { useAiWorkDemoStore } from '#/store/ai-work-demo';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const router = useRouter();
const store = useAiWorkDemoStore();

const scenes = [
  ['周报助理', '/app/mate/employee/weekly-assistant/chat'],
  ['生成 Draft', '/app/mate/employee/weekly-assistant/my-report'],
  ['加入遗漏工作', '/app/mate/employee/weekly-assistant/my-week'],
  ['补充延期原因', '/app/mate/employee/weekly-assistant/chat'],
  ['提交周报', '/app/mate/employee/weekly-assistant/my-report'],
  ['主管审核', '/app/mate/employee/weekly-review/report/zhang-san-w32'],
  ['团队洞察', '/app/mate/employee/weekly-analysis/team'],
  ['华达客户 Context', '/app/mate/employee/weekly-analysis/customer/huada'],
] as const;

function goScene(index: number) {
  store.setScene(index + 1);
  void router.push(scenes[index]?.[1] || scenes[0][1]);
  emit('update:open', false);
}

function reset() {
  Modal.confirm({
    title: '重置 AI Work 演示？',
    content: '周报、审核和洞察状态将恢复到 Scene 01。',
    okText: '确认重置',
    cancelText: '取消',
    onOk: () => {
      store.resetDemo();
      void router.push(scenes[0][1]);
      emit('update:open', false);
    },
  });
}
</script>

<template>
  <Drawer
    :open="open"
    title="AI Work 演示流程"
    placement="left"
    width="420"
    @close="emit('update:open', false)"
  >
    <div class="story-progress">
      <span>当前进度</span>
      <strong>Scene {{ store.state.scene }} / 8</strong>
      <i><b :style="{ width: `${store.state.scene * 12.5}%` }"></b></i>
    </div>
    <ol class="story-scenes">
      <li
        v-for="(scene, index) in scenes"
        :key="scene[0]"
        :class="{
          'is-active': store.state.scene === index + 1,
          'is-complete': store.state.scene > index + 1,
        }"
      >
        <button type="button" @click="goScene(index)">
          <span>{{ index + 1 }}</span>
          <div>
            <strong>{{ scene[0] }}</strong>
            <small>
              {{ store.state.scene > index + 1 ? '已演示' : '点击跳转' }}
            </small>
          </div>
          <Icon icon="lucide:chevron-right" />
        </button>
      </li>
    </ol>
    <Button danger block @click="reset">
      <Icon icon="lucide:rotate-ccw" />
      重置演示
    </Button>
  </Drawer>
</template>

<style scoped>
.story-progress {
  display: grid;
  gap: 7px;
  padding: 14px;
  margin-bottom: 18px;
  background: #eef7f4;
  border-radius: 16px;
}

.story-progress span,
.story-progress small {
  font-size: 11px;
  color: #758a83;
}

.story-progress i {
  display: block;
  height: 6px;
  overflow: hidden;
  background: #d8e8e3;
  border-radius: 3px;
}

.story-progress b {
  display: block;
  height: 100%;
  background: #0b7c6d;
  border-radius: inherit;
}

.story-scenes {
  display: grid;
  gap: 7px;
  padding: 0;
  margin: 0 0 18px;
  list-style: none;
}

.story-scenes button {
  display: grid;
  grid-template-columns: 34px 1fr 18px;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px;
  color: #28483f;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e0e9e6;
  border-radius: 13px;
}

.story-scenes button > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #789088;
  background: #edf3f1;
  border-radius: 50%;
}

.story-scenes div {
  display: grid;
}

.story-scenes small {
  color: #84968f;
}

.story-scenes .is-active button {
  background: #eef8f4;
  border-color: #8fc7b9;
}

.story-scenes .is-active button > span,
.story-scenes .is-complete button > span {
  color: #fff;
  background: #0b7c6d;
}
</style>
