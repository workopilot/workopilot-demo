<script setup lang="ts">
import type { ZhijiType } from '#/types/zhiji';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Input,
  message,
  Modal,
  Switch,
} from 'ant-design-vue';

import {
  syncReporterScheme,
  zhijiSchemes,
  zhijiSources,
  zhijiTypes,
} from '#/api/mock-zhiji';

const selected = ref<ZhijiType>();
const open = ref(false);
const description = ref('');
const associated = computed(() =>
  zhijiSchemes.filter((s) => s.type === selected.value?.id),
);
function inspect(t: ZhijiType) {
  selected.value = t;
  description.value = t.description;
  open.value = true;
}
function toggle(t: ZhijiType) {
  Modal.confirm({
    title: `${t.enabled ? '停用' : '启用'}${t.name}？`,
    content: t.enabled
      ? '相关方案将暂时从汇报者的新建入口隐藏，历史报告保留。'
      : '相关已发布方案将重新在汇报者端可用。',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      t.enabled = !t.enabled;
      zhijiSchemes
        .filter((s) => s.type === t.id)
        .forEach((s) => syncReporterScheme(s));
      message.success('报告类型状态已更新');
    },
  });
}
function save() {
  if (!description.value.trim()) {
    message.warning('请填写类型说明');
    return;
  }
  if (selected.value) selected.value.description = description.value.trim();
  open.value = false;
  message.success('类型说明已保存');
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 业务定义</div>
        <h1>报告类型</h1>
        <p>定义业务对象和取数边界，周期由汇报方案单独配置。</p>
      </div>
      <span class="zj-badge">4 类内置业务类型</span>
    </header>
    <div class="zj-type-grid">
      <article
        v-for="t in zhijiTypes"
        :key="t.id"
        class="zj-panel zj-type-card"
      >
        <div class="zj-card-top">
          <span class="zj-type-icon" :data-type="t.id"
            ><Icon :icon="t.icon" /></span
          ><Switch
            :checked="t.enabled"
            :aria-label="`${t.name}启用状态`"
            @change="toggle(t)"
          />
        </div>
        <h2>{{ t.name }}</h2>
        <p>{{ t.description }}</p>
        <dl>
          <div>
            <dt>汇报对象</dt>
            <dd>{{ t.object }}</dd>
          </div>
          <div>
            <dt>默认责任人</dt>
            <dd>{{ t.owner }}</dd>
          </div>
          <div>
            <dt>关联方案</dt>
            <dd>
              {{ zhijiSchemes.filter((s) => s.type === t.id).length }} 个
            </dd>
          </div>
        </dl>
        <div class="zj-tag-list">
          <span v-for="source in t.sources.slice(0, 4)" :key="source">{{
            zhijiSources.find((s) => s.id === source)?.name
          }}</span>
        </div>
        <Button block @click="inspect(t)"
          >查看类型定义 <Icon icon="lucide:arrow-up-right"
        /></Button>
      </article>
    </div>
    <div class="zj-inline-note">
      <Icon icon="lucide:info" />
      <div>
        <strong>报告类型 ≠ 汇报周期</strong>
        <p>
          个人周报和个人月报同属个人报告。新业务类型需要定义取数规则与权限，不能仅新增名称。
        </p>
      </div>
    </div>
    <Drawer v-model:open="open" :title="selected?.name" :width="480"
      ><div v-if="selected" class="zj-drawer-content">
        <label class="zj-field"
          ><span>类型说明</span
          ><Input.TextArea v-model:value="description" :rows="3"
        /></label>
        <dl class="zj-summary-details">
          <div>
            <dt>对象</dt>
            <dd>{{ selected.object }}</dd>
          </div>
          <div>
            <dt>责任人</dt>
            <dd>{{ selected.owner }}</dd>
          </div>
          <div>
            <dt>权限边界</dt>
            <dd>当前对象内有权访问的数据</dd>
          </div>
        </dl>
        <h3>默认报告结构</h3>
        <ol class="zj-preview-sections">
          <li v-for="s in selected.sections" :key="s">{{ s }}</li>
        </ol>
        <h3>关联方案</h3>
        <p v-for="s in associated" :key="s.id">
          {{ s.name }} ·
          {{
            s.status === 'published'
              ? '已发布'
              : s.status === 'draft'
                ? '草稿'
                : '已停用'
          }}
        </p>
        <Button type="primary" @click="save">保存说明</Button>
      </div></Drawer
    >
  </section>
</template>
