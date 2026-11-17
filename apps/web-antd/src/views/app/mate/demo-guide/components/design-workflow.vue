<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';

import { designSteps } from '../content';

const selected = ref(0);
const step = computed(() => designSteps[selected.value] ?? designSteps[0]);
</script>

<template>
  <div class="design-workflow">
    <div
      class="design-step-grid"
      role="group"
      aria-label="开发步骤，点击查看说明"
    >
      <button
        v-for="(item, index) in designSteps"
        :key="item.title"
        type="button"
        :aria-pressed="selected === index"
        :class="{ selected: selected === index }"
        @click="selected = index"
      >
        <small>0{{ index + 1 }}</small>
        <Icon :icon="item.icon" aria-hidden="true" />
        <strong>{{ item.title }}</strong>
        <Icon
          v-if="index < 7"
          class="step-arrow"
          icon="lucide:arrow-right"
          aria-hidden="true"
        />
      </button>
    </div>
    <div class="step-explanation" aria-live="polite">
      <div class="step-detail">
        <span class="eyebrow">STEP 0{{ selected + 1 }} / 08</span>
        <h3>{{ step.question }}</h3>
        <p>{{ step.description }}</p>
      </div>
      <div class="step-output">
        <small>这一阶段的产出</small>
        <strong>{{ step.deliverable }}</strong>
        <p>
          <span>以会议为例</span>
          {{ step.example }}
        </p>
      </div>
    </div>
  </div>
</template>
