<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';

import { scenarios } from '../content';

const selected = ref(0);
const scenario = computed(() => scenarios[selected.value] ?? scenarios[0]);
</script>

<template>
  <div class="relationship-map">
    <div class="diagram-toolbar">
      <span class="diagram-label">
        <Icon icon="lucide:network" aria-hidden="true" />
        一个应用，可以支持多个数字员工
      </span>
      <div class="scenario-switch" role="group" aria-label="切换业务示例">
        <button
          v-for="(item, index) in scenarios"
          :key="item.id"
          type="button"
          :aria-pressed="selected === index"
          :class="{ selected: selected === index }"
          @click="selected = index"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
    <div class="ecosystem" aria-live="polite">
      <div class="ecosystem-app">
        <div class="ecosystem-app-heading">
          <span class="ecosystem-icon">
            <Icon icon="lucide:blocks" aria-hidden="true" />
          </span>
          <div>
            <small>应用 / 管理员配置</small>
            <h3>{{ scenario.app }}</h3>
          </div>
          <span class="app-multiplicity">
            1 个应用 · {{ scenario.employees.length }} 个助理
          </span>
        </div>
        <div class="app-settings">
          <span v-for="setting in scenario.settings" :key="setting">
            <Icon icon="lucide:sliders-horizontal" aria-hidden="true" />
            {{ setting }}
          </span>
        </div>
      </div>
      <div class="ecosystem-distribution">
        <span>共享业务能力、配置与权限</span>
        <div :class="{ single: scenario.employees.length === 1 }">
          <i v-for="employee in scenario.employees" :key="employee.name">↓</i>
        </div>
      </div>
      <div
        class="assistant-lanes"
        :class="{ single: scenario.employees.length === 1 }"
      >
        <article
          v-for="employee in scenario.employees"
          :key="employee.name"
          class="assistant-card"
          :class="employee.tone"
        >
          <header>
            <span class="ecosystem-icon">
              <Icon :icon="employee.icon" aria-hidden="true" />
            </span>
            <div>
              <small>数字员工 / {{ employee.audience }}</small>
              <h3>{{ employee.name }}</h3>
            </div>
            <span class="role-label">
              {{ employee.tone === 'coral' ? '审阅 & 决策' : '发起 & 办理' }}
            </span>
          </header>
          <div class="assistant-card-body">
            <p>{{ employee.role }}</p>
            <div class="assistant-chat">
              <strong>
                <Icon icon="lucide:messages-square" aria-hidden="true" />
                对话
                <small>首菜单 · 默认进入</small>
              </strong>
              <p>“{{ employee.prompt }}”</p>
            </div>
            <div class="assistant-menu-label">↕ 对话与业务页面互通</div>
            <div class="assistant-menus">
              <span v-for="menu in employee.menus" :key="menu">
                <Icon icon="lucide:panel-top" aria-hidden="true" />
                {{ menu }}
              </span>
            </div>
          </div>
        </article>
      </div>
      <div class="collaboration-bridge">
        <Icon icon="lucide:arrow-left-right" aria-hidden="true" />
        <strong>{{ scenario.handoff }}</strong>
        <span>按职责协作，不重复创建业务数据</span>
      </div>
      <div class="ecosystem-data">
        <span class="ecosystem-icon">
          <Icon icon="lucide:database" aria-hidden="true" />
        </span>
        <div>
          <small>共享数据 / 统一业务方法</small>
          <h3>{{ scenario.record }}</h3>
        </div>
        <span>{{ scenario.action }}</span>
      </div>
    </div>
    <p class="diagram-footnote">
      <Icon icon="lucide:info" aria-hidden="true" />
      按业务角色拆分助理，按业务能力组织应用。关系图用于说明业务设计，具体能力以当前
      Demo 页面为准。
    </p>
  </div>
</template>
