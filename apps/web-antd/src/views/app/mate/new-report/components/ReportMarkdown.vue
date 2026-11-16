<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
const props = defineProps<{ text: string }>();
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
const rendered = computed(() => markdown.render(props.text || ''));
</script>
<template><div class="report-markdown" v-html="rendered" /></template>
<style scoped>
.report-markdown {
  color: #3e5548;
  font-size: 14px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}
.report-markdown :deep(p) {
  margin: 10px 0;
}
.report-markdown :deep(strong) {
  color: #254e39;
  font-weight: 600;
}
.report-markdown :deep(code) {
  background: #edf3ef;
  color: #426754;
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 12px;
  font-family: Consolas, 'SFMono-Regular', monospace;
}
.report-markdown :deep(pre) {
  overflow: auto;
  background: #f2f6f3;
  padding: 12px;
  border-radius: 8px;
}
.report-markdown :deep(ul),
.report-markdown :deep(ol) {
  padding-left: 22px;
  margin: 10px 0;
  list-style: revert;
}
.report-markdown :deep(a) {
  color: #247d69;
  text-decoration: underline;
}
.report-markdown :deep(h1),
.report-markdown :deep(h2),
.report-markdown :deep(h3) {
  font-size: 16px;
  margin: 16px 0 8px;
}
.report-markdown :deep(blockquote) {
  border-left: 3px solid #b9d4c3;
  padding: 8px 14px;
  margin: 14px 0;
  border-radius: 0 6px 6px 0;
  background: #f3f7f4;
  color: #536d5d;
}
.report-markdown :deep(blockquote p) {
  margin: 4px 0;
}
.report-markdown :deep(pre code) {
  padding: 0;
  background: transparent;
}
.report-markdown :deep(img) {
  max-width: 100%;
}
.report-markdown :deep(table) {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  margin: 10px 0 18px;
  border: 1px solid #e1e9e4;
  border-radius: 8px;
  overflow: hidden;
}
.report-markdown :deep(th) {
  padding: 9px 12px 5px;
  text-align: left;
  font-weight: 400;
  font-size: 13px;
  color: #657a6c;
  background: #f5f8f6;
  border-bottom: 1px solid #e1e9e4;
}
.report-markdown :deep(td) {
  padding: 6px 12px 12px;
  text-align: left;
  background: #f5f8f6;
  vertical-align: top;
}
.report-markdown :deep(td strong code) {
  font-weight: 700;
  font-size: 18px;
  color: #2b5c43;
  background: #e5efe8;
}
.report-markdown :deep(tbody tr + tr td) {
  border-top: 1px solid #e1e9e4;
}
.report-markdown :deep(th:not(:last-child)),
.report-markdown :deep(td:not(:last-child)) {
  border-right: 1px solid #e1e9e4;
}
</style>
