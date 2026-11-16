<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button } from 'ant-design-vue';

import { projectStoryStages } from '#/api/mock-project-management';
import { useProjectManagementDemoStore } from '#/store/project-management-demo';

const store = useProjectManagementDemoStore();
</script>

<template>
  <section class="demo-stepper" aria-label="项目管理演示状态">
    <div class="demo-stepper__intro">
      <span><Icon icon="lucide:route" /> 演示状态</span>
      <p>切换同一项目的时间状态，观察 AI 判断、建议和升级动作如何变化。</p>
    </div>
    <div class="demo-stepper__steps" role="list">
      <button
        v-for="item in projectStoryStages"
        :key="item.id"
        type="button"
        :class="{ 'is-active': store.state.stage === item.id }"
        :aria-current="store.state.stage === item.id ? 'step' : undefined"
        @click="store.setStage(item.id)"
      >
        <b>{{ item.id }}</b>
        <span>{{ item.shortLabel }}</span>
      </button>
    </div>
    <Button size="small" type="text" @click="store.resetDemo">
      <Icon icon="lucide:rotate-ccw" /> 重置
    </Button>
  </section>
</template>

<style scoped>
.demo-stepper {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(90deg, #f0f7f4 0%, #fff 54%, #f7faf9 100%);
  border: 1px solid #d5e4df;
  border-radius: 14px;
}

.demo-stepper__intro {
  min-width: 220px;
}

.demo-stepper__intro > span {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #0f4b42;
}

.demo-stepper__intro p {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: #617970;
}

.demo-stepper__steps {
  display: flex;
  flex: 1;
  gap: 6px;
  min-width: 0;
}

.demo-stepper__steps button {
  display: inline-flex;
  flex: 1;
  gap: 7px;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  min-height: 44px;
  padding: 7px 10px;
  color: #5c746c;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 10px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.demo-stepper__steps button:hover,
.demo-stepper__steps button:focus-visible {
  color: #0a6658;
  border-color: #77b4a5;
}

.demo-stepper__steps button:focus-visible {
  outline: 3px solid rgb(11 128 111 / 20%);
  outline-offset: 2px;
}

.demo-stepper__steps button.is-active {
  color: #fff;
  background: #0f4b42;
  border-color: #0f4b42;
  box-shadow: 0 8px 18px rgb(15 75 66 / 16%);
}

.demo-stepper__steps b {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: 10px;
  background: rgb(15 75 66 / 8%);
  border-radius: 50%;
}

.demo-stepper__steps .is-active b {
  color: #0f4b42;
  background: #fff;
}

.demo-stepper__steps span {
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .demo-stepper {
    align-items: flex-start;
  }

  .demo-stepper__intro {
    display: none;
  }

  .demo-stepper__steps {
    overflow-x: auto;
  }

  .demo-stepper__steps button {
    flex: none;
    min-width: 82px;
  }
}

@media (max-width: 640px) {
  .demo-stepper {
    gap: 8px;
    padding: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-stepper__steps button {
    transition: none;
  }
}
</style>

