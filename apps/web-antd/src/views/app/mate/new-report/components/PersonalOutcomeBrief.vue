<script setup lang="ts">
import type { ReportMaterialSection, ReportSource } from '#/types/new-report';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
const props = defineProps<{
  readonly?: boolean;
  sections: ReportMaterialSection[];
}>();
const emit = defineEmits<{
  record: [record: ReportSource];
  navigate: [id: string];
}>();
const tasks = computed(
  () =>
    props.sections.find((s) => s.id === 'tasks' && s.enabled)?.records ?? [],
);
const complete = (r: ReportSource) => /状态：已完成/.test(r.detail);
const done = computed(() => tasks.value.filter(complete));
const outputs = computed(() =>
  props.sections
    .filter((s) => s.enabled)
    .flatMap((s) => s.records)
    .filter((r) => /交付物：|份成果：|已完成方案/.test(r.detail))
    .slice(0, 3),
);
</script>
<template>
  <section class="outcome-brief">
    <header>
      <div>
        <span class="eyebrow">01 / 成果与目标</span>
        <h2>本期交付了什么</h2>
      </div>
      <span class="brief-tag">{{
        readonly ? '已提交 · 只读' : 'AI 整理 · 待核实'
      }}</span>
    </header>
    <p class="brief-conclusion" v-if="tasks.length">
      来源标记 {{ done.length }} 项任务完成，{{
        tasks.length - done.length
      }}
      项仍需核对进展。{{
        done.length
          ? `已完成「${done[0]?.title}」。`
          : '尚无明确完成状态，需补充结果依据。'
      }}
    </p>
    <p class="brief-conclusion" v-else>
      本期目标尚无可核对的任务记录，请补充目标和完成结果。
    </p>
    <div class="brief-goals" v-if="tasks.length">
      <div v-for="task in tasks" :key="task.id">
        <span :class="['goal-state', { done: complete(task) }]"
          ><Icon
            :icon="complete(task) ? 'lucide:circle-check' : 'lucide:clock-3'"
          />{{ complete(task) ? '已完成' : '待核对' }}</span
        ><button @click="emit('record', task)">
          {{ task.title }}<Icon icon="lucide:arrow-up-right" />
        </button>
      </div>
    </div>
    <div class="brief-outputs">
      <h3>核心产出与依据</h3>
      <button
        v-for="output in outputs"
        :key="output.id"
        @click="emit('record', output)"
      >
        <Icon icon="lucide:file-check-2" /><span
          ><strong>{{ output.title }}</strong
          ><small>{{
            output.detail.match(/(?:交付物：|份成果：)([^。]+)/)?.[1] ??
            '方案入口与阅读布局已完成，后续交互仍需补齐。'
          }}</small></span
        ><Icon icon="lucide:arrow-up-right" />
      </button>
      <p v-if="!outputs.length">
        暂无可核对成果物，先补充交付名称、链接与验收结果。
      </p>
    </div>
    <footer>
      <span
        >以上仅按已采集记录核对，不代表全部工作量。成果入口为演示记录，正式链接待补充。</span
      ><button v-if="!readonly" @click="emit('navigate', 'supplement')">
        补充成果 <Icon icon="lucide:arrow-right" />
      </button>
    </footer>
  </section>
</template>
<style scoped>
.outcome-brief {
  padding: 22px;
  border: 1px solid #d9e6dc;
  border-radius: 14px;
  background: #fff;
  margin: 0 0 24px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.eyebrow {
  color: #60836d;
  font-size: 11px;
  letter-spacing: 1px;
}
h2 {
  font-size: 21px;
  margin: 5px 0 0;
  color: #244d36;
}
.brief-tag {
  font-size: 11px;
  color: #617668;
  background: #f0f6f1;
  border-radius: 6px;
  padding: 5px 8px;
}
.brief-conclusion {
  font-size: 15px;
  line-height: 1.85;
  margin: 18px 0;
  color: #344c3e;
}
.brief-goals {
  display: grid;
  gap: 10px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e9efeb;
}
.brief-goals > div {
  display: flex;
  align-items: center;
  gap: 12px;
}
.goal-state {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  color: #856a32;
  background: #fbf6e9;
  font-size: 11px;
  padding: 4px 7px;
  border-radius: 5px;
  white-space: nowrap;
}
.goal-state.done {
  color: #247d69;
  background: #e9f5ef;
}
button {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #345f47;
  text-align: left;
  font-size: 13px;
}
button:hover {
  color: #19805f;
}
button:focus-visible {
  outline: 2px solid #247d69;
  outline-offset: 3px;
}
.brief-outputs h3 {
  font-size: 13px;
  margin: 18px 0 12px;
}
.brief-outputs > button {
  padding: 10px 0;
  width: 100%;
}
.brief-outputs > button > svg {
  flex-shrink: 0;
}
.brief-outputs > button > span {
  flex: 1;
}
strong,
small {
  display: block;
}
strong {
  font-weight: 500;
}
small {
  color: #718176;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.7;
}
footer {
  border-top: 1px solid #e9efeb;
  margin-top: 12px;
  padding-top: 12px;
  display: flex;
  gap: 14px;
  align-items: center;
}
footer > span {
  flex: 1;
  font-size: 11px;
  line-height: 1.7;
  color: #718176;
}
footer button {
  white-space: nowrap;
}
</style>
