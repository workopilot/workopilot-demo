<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, message } from 'ant-design-vue';

import { zhijiSchemes, zhijiTemplates } from '#/api/mock-zhiji';

const selected = ref<(typeof zhijiTemplates)[number]>();
const open = ref(false);
const prompt = ref('');
function edit(t: (typeof zhijiTemplates)[number]) {
  selected.value = t;
  prompt.value = t.prompt;
  open.value = true;
}
function save() {
  if (!prompt.value.trim()) {
    message.warning('请填写生成要求');
    return;
  }
  if (selected.value) selected.value.prompt = prompt.value.trim();
  open.value = false;
  message.success('模板要求已保存；已有方案配置不被覆盖');
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 内容设计</div>
        <h1>内容与模板</h1>
        <p>让不同业务场景，用合适的结构呈现成果。</p>
      </div>
    </header>
    <div class="zj-template-grid">
      <article
        v-for="(t, index) in zhijiTemplates"
        :key="t.id"
        class="zj-panel zj-template-card"
      >
        <div class="zj-paper-preview" :data-variant="index">
          <div class="zj-paper">
            <span class="zj-paper-kicker">{{
              ['WORK OUTCOMES', 'PROJECT PROGRESS', 'CUSTOMER SERVICE'][index]
            }}</span>
            <h3>{{ t.name }}</h3>
            <div class="zj-paper-line long"></div>
            <div class="zj-paper-line"></div>
            <div class="zj-paper-blocks">
              <span></span><span></span><span></span>
            </div>
            <div
              v-for="s in t.sections.slice(0, 3)"
              :key="s"
              class="zj-paper-section"
            >
              <strong>{{ s }}</strong>
              <div class="zj-paper-line long"></div>
            </div>
          </div>
        </div>
        <div class="zj-template-info">
          <h2>{{ t.name }}</h2>
          <p>{{ t.description }}</p>
          <span class="zj-muted"
            >{{
              zhijiSchemes.filter((s) => s.template === t.id).length
            }}
            个方案使用</span
          ><Button block @click="edit(t)"
            >预览与编辑要求 <Icon icon="lucide:arrow-up-right"
          /></Button>
        </div>
      </article>
    </div>
    <div class="zj-inline-note">
      <Icon icon="lucide:sparkles" />
      <p>
        系统提示词由管理员维护。方案采用模板时复制生成要求，修改模板不追溯覆盖已发布方案。
      </p>
    </div>
    <Drawer v-model:open="open" :title="selected?.name" :width="520"
      ><div v-if="selected" class="zj-drawer-content">
        <h3>推荐章节</h3>
        <ol class="zj-preview-sections">
          <li v-for="s in selected.sections" :key="s">{{ s }}</li>
        </ol>
        <label class="zj-field"
          ><span>默认 AI 生成要求</span
          ><Input.TextArea v-model:value="prompt" :rows="7"
        /></label>
        <div class="zj-inline-note">
          <Icon icon="lucide:info" />
          <p>实际内容由业务来源和人工补充构成，这里展示结构示意。</p>
        </div>
        <Button type="primary" @click="save">保存模板要求</Button>
      </div></Drawer
    >
  </section>
</template>
