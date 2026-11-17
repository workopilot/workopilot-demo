<script setup lang="ts">
import { computed } from 'vue';

import { Icon } from '@iconify/vue';

const props = defineProps<{ kind: 'application' | 'business' | 'chat' }>();
const isApplication = computed(() => props.kind === 'application');
const description = computed(
  () =>
    ({
      chat: '数字员工 → 汇报助理 → 对话',
      business: '数字员工 → 汇报助理 → 我的报告',
      application: '应用 → 知记 → 汇报方案',
    })[props.kind],
);
</script>

<template>
  <figure
    class="location-sketch"
    :aria-label="`${description}，红框标出当前入口，其他内容为骨架占位`"
  >
    <figcaption>
      <span class="sketch-dot"></span>
      <span>界面位置示意</span>
      <small>红框 = 当前入口</small>
    </figcaption>
    <div class="sketch-window" aria-hidden="true">
      <div class="sketch-rail">
        <span class="sketch-logo"></span>
        <i class="sketch-rail-placeholder"></i>
        <div v-if="!isApplication" class="sketch-rail-active">
          <Icon icon="lucide:bot" />
          <span>
            数字
            <br />
            员工
          </span>
        </div>
        <i v-else class="sketch-rail-placeholder"></i>
        <div v-if="isApplication" class="sketch-rail-active">
          <Icon icon="lucide:blocks" />
          <span>应用</span>
        </div>
        <i v-else class="sketch-rail-placeholder"></i>
        <i class="sketch-rail-placeholder"></i>
        <span class="sketch-account"></span>
      </div>
      <div class="sketch-sidebar">
        <span class="sketch-sidebar-label">
          {{ isApplication ? '应用' : '数字员工' }}
        </span>
        <div class="sketch-selected-object">
          <Icon :icon="isApplication ? 'lucide:blocks' : 'lucide:bot'" />
          <span>{{ isApplication ? '知记' : '汇报助理' }}</span>
        </div>
        <div v-for="n in 3" :key="n" class="sketch-placeholder-item">
          <i></i>
          <span></span>
        </div>
      </div>
      <div class="sketch-workspace">
        <div class="sketch-workspace-heading">
          <span>{{ isApplication ? '知记应用' : '汇报助理' }}</span>
          <i></i>
        </div>
        <div class="sketch-menu-strip">
          <template v-if="!isApplication">
            <span :class="{ 'sketch-highlight': kind === 'chat' }">
              对话
              <em v-if="kind === 'chat'">1</em>
            </span>
            <span :class="{ 'sketch-highlight': kind === 'business' }">
              我的报告
              <em v-if="kind === 'business'">2</em>
            </span>
          </template>
          <template v-else>
            <span class="sketch-highlight">
              汇报方案
              <em>3</em>
            </span>
          </template>
          <i class="sketch-menu-placeholder"></i>
        </div>
        <div v-if="kind === 'chat'" class="sketch-chat-area">
          <div class="sketch-bubble right"><i></i></div>
          <div class="sketch-bubble">
            <i></i>
            <i></i>
          </div>
          <div class="sketch-input">
            <i></i>
            <Icon icon="lucide:arrow-up" />
          </div>
        </div>
        <div v-else-if="kind === 'business'" class="sketch-table-area">
          <div class="sketch-table-tools">
            <i></i>
            <i></i>
          </div>
          <div class="sketch-table-head">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <div v-for="n in 3" :key="n" class="sketch-table-row">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
        <div v-else class="sketch-settings-area">
          <div v-for="n in 3" :key="n" class="sketch-field">
            <i></i>
            <span></span>
          </div>
          <div class="sketch-save"></div>
        </div>
      </div>
    </div>
    <p class="sketch-path">
      <Icon icon="lucide:corner-down-right" aria-hidden="true" />
      {{ description }}
    </p>
  </figure>
</template>

<style scoped>
.location-sketch {
  padding: 14px 12px 12px;
  margin: 0;
  background: #f6f8fc;
  border-bottom: 1px solid #dbe3ef;
}

figcaption {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 11px;
  color: #52647c;
}

figcaption small {
  margin-left: auto;
  font-size: 10px;
  color: #ab3340;
}

.sketch-dot {
  width: 6px;
  height: 6px;
  background: #e15c68;
  border-radius: 50%;
}

.sketch-window {
  display: grid;
  grid-template-columns: 34px 66px minmax(0, 1fr);
  min-height: 218px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #cfd9e7;
  border-radius: 8px;
}

.sketch-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 10px 2px;
  background: #e3e9f2;
}

.sketch-logo {
  width: 19px;
  height: 17px;
  background: #becbdf;
  border-radius: 5px;
}

.sketch-rail-placeholder {
  display: block;
  width: 12px;
  height: 12px;
  border: 2px solid #c2cddc;
  border-radius: 3px;
}

.sketch-rail-active {
  display: grid;
  gap: 3px;
  justify-items: center;
  width: 30px;
  padding: 5px 0;
  font-size: 9px;
  font-weight: 600;
  line-height: 1.15;
  color: #224d9c;
  background: #fff;
  border: 1px solid #bdcfee;
  border-radius: 5px;
}

.sketch-rail-active .iconify {
  font-size: 15px;
}

.sketch-account {
  width: 15px;
  height: 15px;
  margin-top: auto;
  background: #c1cedd;
  border-radius: 50%;
}

.sketch-sidebar {
  padding: 12px 5px;
  background: #f0f3f8;
  border-right: 1px solid #e1e6ef;
}

.sketch-sidebar-label {
  display: block;
  margin-bottom: 13px;
  font-size: 9px;
  font-weight: 600;
  color: #66738a;
  text-align: center;
}

.sketch-selected-object {
  display: flex;
  gap: 3px;
  align-items: center;
  justify-content: center;
  padding: 8px 1px;
  font-size: 9px;
  color: #38588d;
  white-space: nowrap;
  background: #e1eafb;
  border: 1px solid #c5d5f0;
  border-radius: 4px;
}

.sketch-placeholder-item {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 16px 3px 0;
}

.sketch-placeholder-item i {
  width: 10px;
  height: 10px;
  background: #dce3ed;
  border-radius: 3px;
}

.sketch-placeholder-item span {
  flex: 1;
  height: 4px;
  background: #dce3ed;
  border-radius: 2px;
}

.sketch-workspace {
  min-width: 0;
}

.sketch-workspace-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 10px;
  font-size: 9px;
  color: #68778e;
  border-bottom: 1px solid #edf0f6;
}

.sketch-workspace-heading i {
  width: 10px;
  height: 10px;
  background: #e8edf3;
  border-radius: 50%;
}

.sketch-menu-strip {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 9px 7px;
  border-bottom: 1px solid #e8edf4;
}

.sketch-menu-strip > span {
  position: relative;
  padding: 5px 6px;
  font-size: 9px;
  color: #718198;
  white-space: nowrap;
  border: 2px solid transparent;
  border-radius: 4px;
}

.sketch-menu-strip > .sketch-highlight {
  font-weight: 700;
  color: #a32d3b;
  background: #fff0f0;
  border-color: #e24959;
  box-shadow: 0 0 0 2px #fff;
}

.sketch-highlight em {
  position: absolute;
  top: -9px;
  right: -6px;
  box-sizing: content-box;
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  font: normal 9px monospace;
  color: #fff;
  background: #d23549;
  border: 2px solid #fff;
  border-radius: 50%;
}

.sketch-menu-placeholder {
  flex: 1;
  max-width: 24px;
  height: 5px;
  background: #e5eaf2;
  border-radius: 3px;
}

.sketch-chat-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 10px 10px;
}

.sketch-bubble {
  display: grid;
  gap: 5px;
  width: 75%;
  padding: 9px;
  background: #f0f3f8;
  border-radius: 6px;
}

.sketch-bubble.right {
  align-self: flex-end;
  width: 56%;
  background: #e9eef8;
}

.sketch-bubble i {
  height: 4px;
  background: #d5deea;
  border-radius: 3px;
}

.sketch-bubble i:last-child {
  width: 70%;
}

.sketch-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px;
  margin-top: 5px;
  color: #a6b4c9;
  border: 1px solid #d8e1ed;
  border-radius: 5px;
}

.sketch-input i {
  width: 60%;
  height: 4px;
  background: #e4eaf2;
}

.sketch-table-area,
.sketch-settings-area {
  padding: 14px 10px;
}

.sketch-table-tools {
  display: flex;
  justify-content: space-between;
  margin-bottom: 13px;
}

.sketch-table-tools i {
  width: 45%;
  height: 11px;
  background: #e9eef6;
  border-radius: 3px;
}

.sketch-table-tools i:last-child {
  width: 20%;
}

.sketch-table-head,
.sketch-table-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.7fr;
  gap: 10px;
  padding: 9px 5px;
  border-bottom: 1px solid #edf0f5;
}

.sketch-table-head {
  background: #f0f3f8;
}

.sketch-table-head i,
.sketch-table-row i {
  height: 4px;
  background: #dce4ef;
  border-radius: 2px;
}

.sketch-field {
  display: grid;
  grid-template-columns: 28% 1fr;
  gap: 9px;
  align-items: center;
  margin-bottom: 11px;
}

.sketch-field i {
  height: 5px;
  background: #dce4ee;
  border-radius: 2px;
}

.sketch-field span {
  height: 19px;
  background: #f7f9fc;
  border: 1px solid #e0e6ef;
  border-radius: 3px;
}

.sketch-save {
  width: 30px;
  height: 12px;
  margin-left: auto;
  background: #d7e2f0;
  border-radius: 3px;
}

.sketch-path {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
  font-size: 10px;
  color: #536987;
}

@media (min-width: 761px) and (max-width: 1100px) {
  .sketch-window {
    grid-template-columns: 30px 48px minmax(0, 1fr);
  }

  .sketch-menu-strip {
    gap: 1px;
    padding-right: 3px;
    padding-left: 3px;
  }

  .sketch-menu-strip > span {
    padding-right: 2px;
    padding-left: 2px;
  }

  .sketch-selected-object .iconify {
    display: none;
  }
}

@media (max-width: 420px) {
  .sketch-window {
    grid-template-columns: 30px 55px minmax(0, 1fr);
  }

  .sketch-menu-strip {
    padding-right: 3px;
    padding-left: 4px;
  }

  .sketch-menu-strip > span {
    padding-right: 3px;
    padding-left: 3px;
  }
}
</style>
