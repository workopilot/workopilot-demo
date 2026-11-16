<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message } from 'ant-design-vue';

import { approvalStyleChanges, approvalStyleMarkdown } from './demo-state';

const editing = ref(false);
const draft = ref(approvalStyleMarkdown.value);
const selectedChangeId = ref(approvalStyleChanges.value[0]?.id || '');

const sections = computed(() => {
  const result: Array<{ level: number; lines: string[]; title: string }> = [];
  let current = { title: '说明', level: 2, lines: [] as string[] };
  for (const raw of approvalStyleMarkdown.value.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('# 我的审批风格')) continue;
    if (line.startsWith('## ')) {
      if (current.lines.length > 0) result.push(current);
      current = { title: line.slice(3), level: 2, lines: [] };
      continue;
    }
    if (line.startsWith('### ')) {
      current.lines.push(`§ ${line.slice(4)}`);
      continue;
    }
    current.lines.push(line.replace(/^[-*]\s+/, ''));
  }
  if (current.lines.length > 0) result.push(current);
  return result;
});

const selectedChange = computed(() =>
  approvalStyleChanges.value.find((item) => item.id === selectedChangeId.value),
);

function saveStyle() {
  if (!draft.value.trim()) {
    message.warning('审批风格 Markdown 不能为空');
    return;
  }
  approvalStyleMarkdown.value = draft.value;
  editing.value = false;
  message.success('我的审批风格已保存');
}

function resetDraft() {
  draft.value = approvalStyleMarkdown.value;
  editing.value = false;
}

function changeMeta(type: string) {
  return (
    {
      added: { label: '新增', icon: 'lucide:plus', className: 'added' },
      replaced: {
        label: '覆盖',
        icon: 'lucide:replace',
        className: 'replaced',
      },
      merged: { label: '合并', icon: 'lucide:git-merge', className: 'merged' },
      reinforced: {
        label: '强化',
        icon: 'lucide:trending-up',
        className: 'reinforced',
      },
    }[type] || { label: '更新', icon: 'lucide:refresh-cw', className: 'merged' }
  );
}
</script>

<template>
  <div class="style-page">
    <header class="style-header">
      <div>
        <span>PERSONAL REVIEW SKILL</span>
        <h1>我的审批风格</h1>
        <p>AI 根据你的真实审批与最终回复，持续更新个人 Markdown Skill。</p>
      </div>
      <div class="style-actions">
        <span>
          <Icon icon="lucide:lock-keyhole" />
          仅你与管理员可见
        </span>
        <Button v-if="!editing" class="edit-button" @click="editing = true">
          <Icon icon="lucide:pen-line" />
          编辑 Markdown
        </Button>
        <template v-else>
          <Button @click="resetDraft">取消</Button>
          <Button class="save-button" @click="saveStyle">
            <Icon icon="lucide:save" />
            保存
          </Button>
        </template>
      </div>
    </header>

    <section class="learning-banner">
      <span class="learning-icon"><Icon icon="lucide:brain-circuit" /></span>
      <div>
        <span>本周学习已完成</span>
        <h2>新增 1 项 · 覆盖 1 项 · 合并 1 项</h2>
        <p>基于本周 12 份审批、8 条最终回复和 4 次评分调整，已自动增量更新。</p>
      </div>
      <span class="match-rate">
        <strong>86%</strong>
        <small>AI 建议采用率</small>
      </span>
    </section>

    <div class="style-layout">
      <main class="markdown-skill">
        <header>
          <div>
            <span>
              <Icon icon="lucide:file-code-2" />
              approval-style.md
            </span>
            <small>版本 v6 · 今天 18:20 自动更新</small>
          </div>
          <span class="skill-state">
            <i></i>
            审批分析中已启用
          </span>
        </header>
        <Input.TextArea
          v-if="editing"
          v-model:value="draft"
          class="markdown-editor"
          :auto-size="{ minRows: 28, maxRows: 42 }"
          spellcheck="false"
        />
        <article v-else class="markdown-rendered">
          <div class="skill-title">
            <span>MY REVIEW STYLE</span>
            <h2>我的审批风格</h2>
            <p>岗位审核策略始终优先；本 Skill 用于补充个人判断与回复习惯。</p>
          </div>
          <section v-for="section in sections" :key="section.title">
            <h3>{{ section.title }}</h3>
            <template v-for="line in section.lines" :key="line">
              <h4 v-if="line.startsWith('§ ')" :id="line.slice(2)">
                {{ line.slice(2) }}
              </h4>
              <blockquote v-else-if="line.startsWith('> ')">
                {{ line.slice(2) }}
              </blockquote>
              <p v-else>
                <Icon icon="lucide:minus" />
                {{ line }}
              </p>
            </template>
          </section>
        </article>
      </main>

      <aside class="learning-panel">
        <header>
          <span>
            <Icon icon="lucide:history" />
            本周学习变化
          </span>
          <strong>{{ approvalStyleChanges.length }}</strong>
        </header>
        <div class="change-list">
          <button
            v-for="change in approvalStyleChanges"
            :key="change.id"
            type="button"
            :class="[
              { active: selectedChangeId === change.id },
              changeMeta(change.type).className,
            ]"
            @click="selectedChangeId = change.id"
          >
            <span>
              <Icon :icon="changeMeta(change.type).icon" />
              {{ changeMeta(change.type).label }}
            </span>
            <strong>{{ change.title }}</strong>
            <small>{{ change.evidence }}</small>
          </button>
        </div>
        <section v-if="selectedChange" class="change-detail">
          <header>
            <span>Markdown Diff</span>
            <small>W34 → v6</small>
          </header>
          <h3>{{ selectedChange.title }}</h3>
          <p>{{ selectedChange.detail }}</p>
          <div class="diff-block">
            <span>- 延期事项需要说明原因。</span>
            <strong>
              + 延期事项需说明原因、新完成时间、负责人和支持需求。
            </strong>
          </div>
          <footer>
            <Icon icon="lucide:files" />
            {{ selectedChange.evidence }}
          </footer>
        </section>
        <section class="learning-rules">
          <header>
            <Icon icon="lucide:refresh-cw" />
            <b>自动更新方式</b>
          </header>
          <p>
            新事项类型增量追加；相似内容自动合并；发生冲突时用最近稳定逻辑覆盖旧描述。
          </p>
          <span>
            <Icon icon="lucide:shield-check" />
            不会覆盖岗位审核策略
          </span>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.style-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #173f36;
  background: #eff5f2;
  border: 1px solid #d3e2dd;
  border-radius: 14px;
}

.style-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 12px 22px;
  background: #fff;
  border-bottom: 1px solid #dbe7e3;
}

.style-header > div:first-child > span {
  font-size: 12px;
  font-weight: 800;
  color: #087565;
  letter-spacing: 0.13em;
}

.style-header h1 {
  display: inline;
  margin: 0 10px 0 0;
  font-size: 24px;
}

.style-header p {
  display: inline;
  margin: 0;
  font-size: 12px;
  color: #6d827b;
}

.style-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.style-actions > span {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-right: 4px;
  font-size: 12px;
  color: #6c817a;
}

.edit-button,
.save-button {
  height: 36px !important;
  font-size: 12px;
  font-weight: 700;
}

.edit-button {
  color: #0b6f62 !important;
  border-color: #9bc6ba !important;
}

.save-button {
  color: #fff !important;
  background: #087565 !important;
  border-color: #087565 !important;
}

.learning-banner {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 120px;
  gap: 13px;
  align-items: center;
  padding: 12px 15px;
  margin: 10px 12px 0;
  color: #fff;
  background: linear-gradient(110deg, #073f37, #0b6758 68%, #167b69);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(9 79 67 / 14%);
}

.learning-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #75dfc8;
  background: rgb(255 255 255 / 10%);
  border-radius: 10px;
}

.learning-icon svg {
  font-size: 21px;
}

.learning-banner > div > span {
  font-size: 12px;
  font-weight: 800;
  color: #83dfcb;
  letter-spacing: 0.05em;
}

.learning-banner h2 {
  margin: 2px 0;
  font-size: 16px;
}

.learning-banner p {
  margin: 0;
  font-size: 12px;
  color: #d1e8e2;
}

.match-rate {
  display: grid;
  padding-left: 16px;
  border-left: 1px solid rgb(255 255 255 / 20%);
}

.match-rate strong {
  font-size: 23px;
  color: #8de8d3;
}

.match-rate small {
  font-size: 12px;
  color: #d1e8e2;
}

.style-layout {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(520px, 1fr) 390px;
  gap: 10px;
  min-height: 0;
  padding: 10px 12px 12px;
}

.markdown-skill,
.learning-panel {
  min-height: 0;
  overflow: auto;
  background: #fff;
  border: 1px solid #d7e4df;
  border-radius: 10px;
}

.markdown-skill > header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 8px 14px;
  background: #f8fbfa;
  border-bottom: 1px solid #e0e9e6;
}

.markdown-skill > header > div {
  display: grid;
}

.markdown-skill > header span {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
}

.markdown-skill > header small {
  margin-top: 2px;
  font-size: 12px;
  color: #72867f;
}

.skill-state {
  font-weight: 600 !important;
  color: #28735f !important;
}

.skill-state i {
  width: 7px;
  height: 7px;
  background: #20a37e;
  border-radius: 50%;
  box-shadow: 0 0 0 3px #d8f0e9;
}

.markdown-editor {
  width: calc(100% - 24px);
  margin: 12px;
  font-family: Consolas, SFMono-Regular, monospace !important;
  font-size: 13px !important;
  line-height: 1.75 !important;
}

.markdown-rendered {
  max-width: 860px;
  padding: 22px 28px 40px;
  margin: 0 auto;
}

.skill-title {
  padding-bottom: 18px;
  border-bottom: 1px solid #dce7e3;
}

.skill-title > span {
  font-size: 12px;
  font-weight: 800;
  color: #087565;
  letter-spacing: 0.12em;
}

.skill-title h2 {
  margin: 5px 0;
  font-size: 26px;
}

.skill-title p {
  margin: 0;
  font-size: 13px;
  color: #687e76;
}

.markdown-rendered section {
  padding-top: 18px;
}

.markdown-rendered h3 {
  margin: 0 0 9px;
  font-size: 17px;
  color: #123f34;
}

.markdown-rendered h4 {
  padding: 6px 9px;
  margin: 12px 0 7px;
  font-size: 13px;
  color: #0b6f62;
  background: #e9f4f0;
  border-left: 3px solid #0b806f;
}

.markdown-rendered p {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.7;
  color: #35584e;
}

.markdown-rendered p svg {
  flex: none;
  margin-top: 7px;
  font-size: 10px;
  color: #0b806f;
}

.markdown-rendered blockquote {
  padding: 9px 12px;
  margin: 7px 0;
  font-size: 13px;
  color: #5f756e;
  background: #f4f8f6;
  border-left: 3px solid #aaccc2;
}

.learning-panel {
  padding: 12px;
}

.learning-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 2px 10px;
}

.learning-panel > header span {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 800;
}

.learning-panel > header strong {
  display: grid;
  place-items: center;
  width: 24px;
  height: 22px;
  font-size: 12px;
  color: #fff;
  background: #087565;
  border-radius: 999px;
}

.change-list {
  display: grid;
  gap: 6px;
}

.change-list button {
  display: grid;
  gap: 4px;
  padding: 10px;
  font-size: 12px;
  color: #416159;
  text-align: left;
  cursor: pointer;
  background: #f7faf9;
  border: 1px solid #dbe6e2;
  border-radius: 8px;
  transition: 160ms ease;
}

.change-list button:hover {
  border-color: #a8cbbf;
}

.change-list button.active {
  background: #edf7f3;
  border-color: #72ad9d;
  box-shadow: inset 3px 0 #087565;
}

.change-list button > span {
  display: flex;
  gap: 5px;
  align-items: center;
  width: max-content;
  padding: 3px 6px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 4px;
}

.change-list button.added > span {
  color: #147253;
  background: #dff2e9;
}

.change-list button.replaced > span {
  color: #a15a22;
  background: #fff0e3;
}

.change-list button.merged > span {
  color: #326b9a;
  background: #e9f2f9;
}

.change-list button strong {
  font-size: 13px;
}

.change-list button small {
  font-size: 12px;
  color: #778a84;
}

.change-detail {
  padding: 12px;
  margin-top: 10px;
  background: #fff;
  border: 1px solid #d8e4e0;
  border-radius: 9px;
}

.change-detail > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #71857e;
}

.change-detail > header span {
  font-weight: 800;
  color: #31564c;
}

.change-detail h3 {
  margin: 10px 0 5px;
  font-size: 14px;
}

.change-detail p {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #577169;
}

.diff-block {
  display: grid;
  gap: 5px;
  padding: 9px;
  margin-top: 9px;
  font-family: Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  background: #132e29;
  border-radius: 7px;
}

.diff-block span {
  color: #f2a7a7;
}

.diff-block strong {
  color: #8ee1bf;
}

.change-detail footer {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #72867f;
}

.learning-rules {
  padding: 11px;
  margin-top: 10px;
  background: #edf5f2;
  border-radius: 8px;
}

.learning-rules header {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #31564c;
}

.learning-rules p {
  margin: 6px 0;
  font-size: 12px;
  line-height: 1.6;
  color: #5d756e;
}

.learning-rules > span {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #087565;
}

@media (max-width: 1050px) {
  .style-layout {
    grid-template-columns: 1fr;
  }

  .learning-panel {
    display: none;
  }
}

@media (max-width: 760px) {
  .style-header {
    flex-direction: column;
    gap: 9px;
    align-items: flex-start;
  }

  .learning-banner {
    grid-template-columns: 42px 1fr;
  }

  .match-rate {
    display: none;
  }

  .style-layout {
    padding: 8px;
  }

  .markdown-rendered {
    padding: 18px;
  }
}
</style>
