<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { mockMateEmployees } from "#/api/mock-data-mate";
import type { SalesRecord } from "#/types/new-sales";
const props = defineProps<{
  selected?: SalesRecord;
  scope?: string;
  person?: string;
  prompt?: string;
  creating?: boolean;
  draftContext?: string;
  embedded?: boolean;
}>();
const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const employee = mockMateEmployees.find((e) => e.id === "new-sales-assistant")!;
const page = ref(0);
const suggestions = computed(() => {
  const name =
    props.selected?.customerName || props.selected?.name || "这个客户";
  const sets = props.creating
    ? [
        ["帮我整理新客户资料", "检查客户建档还缺哪些信息"],
        ["根据公司名称梳理客户背景", "帮我准备首次沟通话术"],
      ]
    : [
        [`帮我挖掘${name}的客户画像`, "帮我整理下一步跟进计划"],
        ["分析客户需求与潜在商机", "帮我起草客户沟通话术"],
      ];
  const items = [...sets[page.value % sets.length]!];
  if (props.prompt && page.value === 0) items[0] = props.prompt;
  return items;
});
function open(text = "") {
  const context =
    props.draftContext ||
    (props.selected
      ? `客户：${props.selected.customerName || props.selected.name}；联系人：${props.person || props.selected.contact || "待完善"}`
      : `当前视图：${props.scope || "客户中心"}`);
  void router.push({
    path: "/app/mate/employee/new-sales-assistant/sales/chat",
    query: {
      prompt: text ? `${text}\n${context}` : "",
      context: props.creating ? "new" : props.selected?.id || "general",
      fresh: "1",
    },
  });
}
</script>
<template>
  <aside
    class="sales-suggestions"
    :class="{ 'is-embedded': embedded }"
    aria-label="AI建议"
  >
    <header class="suggestions-heading">
      <div>
        <small>AI COPILOT</small>
        <h2>AI建议</h2>
      </div>
      <button aria-label="换一组建议" title="换一组" @click="page++">
        <Icon icon="lucide:refresh-cw" />
      </button>
      <button v-if="!embedded" aria-label="收起AI建议" @click="emit('close')">
        <Icon icon="lucide:panel-right-close" />
      </button>
    </header>
    <p class="suggestions-caption">选择推荐话术，交给数字员工</p>
    <section class="suggestions-employee">
      <button
        class="suggestions-profile"
        aria-label="进入销售助理"
        @click="open()"
      >
        <img :src="employee.avatar" alt="销售助理" />
        <span
          ><strong>销售助理</strong
          ><small>{{
            creating
              ? "整理客户资料，辅助快速建档"
              : "洞察客户需求，推进销售跟进"
          }}</small></span
        >
        <Icon icon="lucide:arrow-up-right" />
      </button>
      <button
        v-for="(text, index) in suggestions"
        :key="text"
        class="suggestion-action"
        :class="{ primary: index === 0 }"
        @click="open(text)"
      >
        <Icon icon="lucide:lightbulb" /><span>{{ text }}</span
        ><Icon icon="lucide:chevron-right" />
      </button>
    </section>
  </aside>
</template>
<style scoped>
.sales-suggestions {
  position: relative;
  align-self: flex-start;
  flex: none;
  width: 29%;
  min-width: 280px;
  max-width: 370px;
  margin: 16px 16px 16px 0;
  padding: 24px 16px 16px;
  border: 1px solid #dce9e3;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 6px 24px #204e3910;
  overflow: hidden;
  color: #15354a;
}
.sales-suggestions::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: linear-gradient(90deg, #105d49, #2ac997);
}
.suggestions-heading {
  display: flex;
  align-items: center;
  gap: 6px;
}
.suggestions-heading > div {
  flex: 1;
}
.suggestions-heading small {
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 700;
  color: #147568;
}
.suggestions-heading h2 {
  margin: 3px 0 0;
  font-size: 23px;
  font-weight: 750;
}
.suggestions-heading > button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid #dcebe4;
  border-radius: 50%;
  background: white;
  color: #116c56;
  cursor: pointer;
}
.suggestions-caption {
  font-size: 12px;
  color: #748a9b;
  margin: 9px 0 32px;
}
.suggestions-employee {
  border: 1px solid #cbe4d8;
  border-radius: 16px;
  padding: 0 12px 12px;
  background: linear-gradient(180deg, #e5f2eb, #fff);
}
.suggestions-profile {
  display: flex;
  width: 100%;
  align-items: center;
  text-align: left;
  gap: 10px;
  border: 0;
  background: none;
  padding: 0 0 15px;
  cursor: pointer;
  color: inherit;
}
.suggestions-profile img {
  width: 52px;
  height: 56px;
  object-fit: cover;
  border: 4px solid white;
  border-radius: 16px;
  margin-top: -14px;
  box-shadow: 0 5px 14px #25583b15;
}
.suggestions-profile span {
  flex: 1;
  padding-top: 12px;
}
.suggestions-profile strong {
  font-size: 16px;
  display: block;
}
.suggestions-profile small {
  display: block;
  font-size: 11px;
  color: #6d8595;
  margin-top: 4px;
  line-height: 1.6;
}
.suggestion-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 11px;
  min-height: 50px;
  margin-top: 9px;
  background: white;
  border: 1px solid #dfe6ec;
  border-radius: 12px;
  color: #183d52;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  line-height: 1.6;
  transition:
    background 0.18s,
    box-shadow 0.18s;
}
.suggestion-action span {
  flex: 1;
}
.suggestion-action svg {
  flex: none;
  color: #14836b;
}
.suggestion-action.primary {
  background: #106955;
  border-color: #106955;
  color: white;
  font-weight: 600;
}
.suggestion-action.primary svg {
  color: #ffe29a;
}
.suggestion-action:hover {
  box-shadow: 0 3px 12px #1b654022;
}
.suggestion-action:not(.primary):hover {
  background: #f0f8f3;
}
button:focus-visible {
  outline: 2px solid #14836b;
  outline-offset: 3px;
}
.sales-suggestions.is-embedded {
  width: 100%;
  max-width: none;
  min-width: 0;
  margin: 20px 0 0;
  padding: 18px 14px 14px;
}
.is-embedded .suggestions-caption {
  margin-bottom: 28px;
}
.is-embedded .suggestions-heading h2 {
  font-size: 18px;
}
@media (max-width: 900px) {
  .sales-suggestions {
    width: 100%;
    max-width: none;
    margin: 0;
    min-width: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .suggestion-action {
    transition: none;
  }
}
</style>
