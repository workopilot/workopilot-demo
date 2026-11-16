<script setup lang="ts">
import type { ZhijiScheme } from '#/types/zhiji';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal } from 'ant-design-vue';

import {
  cloneZhijiScheme,
  newZhijiScheme,
  syncReporterScheme,
  zhijiCycleText,
  zhijiSchemes,
  zhijiTypes,
} from '#/api/mock-zhiji';

const router = useRouter();
const search = ref('');
const type = ref('');
const mode = ref('');
const status = ref('');
const filtered = computed(() =>
  zhijiSchemes.filter(
    (s) =>
      `${s.name}${s.description}${s.scope}`.includes(search.value.trim()) &&
      (!type.value || s.type === type.value) &&
      (!mode.value || s.mode === mode.value) &&
      (!status.value || s.status === status.value),
  ),
);
const counts = computed(() => ({
  published: zhijiSchemes.filter((s) => s.status === 'published').length,
  selectable: zhijiSchemes.filter((s) => s.mode === 'selectable').length,
  draft: zhijiSchemes.filter((s) => s.status === 'draft').length,
}));
function edit(id: string) {
  router.push(`/app/mate/apps/zhiji/schemes/${id}`);
}
function duplicate(s: ZhijiScheme) {
  const copy = {
    ...cloneZhijiScheme(s),
    id: newZhijiScheme().id,
    name: `${s.name}（副本）`,
    status: 'draft' as const,
    version: 0,
    updated: '刚刚',
  };
  zhijiSchemes.unshift(copy);
  edit(copy.id);
}
function disable(s: ZhijiScheme) {
  Modal.confirm({
    title: `停用“${s.name}”？`,
    content: '汇报者将不能选择此方案生成新报告，已有报告和历史版本保留。',
    okText: '停用方案',
    cancelText: '取消',
    onOk() {
      s.status = 'disabled';
      syncReporterScheme(s);
      message.success('方案已停用，历史报告保留');
    },
  });
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 配置中心</div>
        <h1>汇报方案</h1>
        <p>让每一次汇报，都有清晰的内容与节奏。</p>
      </div>
      <Button type="primary" size="large" @click="edit('new')"
        ><Icon icon="lucide:plus" /> 新建汇报方案</Button
      >
    </header>
    <div class="zj-overview">
      <div>
        <span class="zj-overview-icon"><Icon icon="lucide:workflow" /></span>
        <div>
          <strong>从规则到汇报，一处配置</strong>
          <p>选择业务类型，设定周期与内容，发布后由汇报者使用。</p>
        </div>
      </div>
      <dl>
        <div>
          <dt>已发布</dt>
          <dd>{{ counts.published }}</dd>
        </div>
        <div>
          <dt>自选周期</dt>
          <dd>{{ counts.selectable }}</dd>
        </div>
        <div>
          <dt>草稿</dt>
          <dd>{{ counts.draft }}</dd>
        </div>
      </dl>
    </div>
    <div class="zj-panel">
      <div class="zj-filterbar">
        <Input
          v-model:value="search"
          placeholder="搜索方案名称或适用范围"
          aria-label="搜索汇报方案"
          allow-clear
          class="zj-search"
          ><template #prefix><Icon icon="lucide:search" /></template></Input
        ><select v-model="type" aria-label="筛选报告类型">
          <option value="">全部类型</option>
          <option v-for="t in zhijiTypes" :key="t.id" :value="t.id">
            {{ t.name }}
          </option></select
        ><select v-model="mode" aria-label="筛选周期模式">
          <option value="">全部周期模式</option>
          <option value="fixed">固定周期</option>
          <option value="selectable">汇报者自选</option></select
        ><select v-model="status" aria-label="筛选方案状态">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="disabled">已停用</option></select
        ><span class="zj-muted">{{ filtered.length }} 个方案</span>
      </div>
      <div class="zj-table-wrap">
        <table class="zj-table">
          <thead>
            <tr>
              <th>方案名称</th>
              <th>周期规则</th>
              <th>适用范围</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filtered" :key="s.id">
              <td>
                <div class="zj-name-cell">
                  <span class="zj-type-icon" :data-type="s.type"
                    ><Icon
                      :icon="
                        zhijiTypes.find((t) => t.id === s.type)?.icon ||
                        'lucide:file-text'
                      "
                  /></span>
                  <div>
                    <button
                      class="zj-text-button zj-title-button"
                      @click="edit(s.id)"
                    >
                      {{ s.name }}</button
                    ><small
                      >{{ zhijiTypes.find((t) => t.id === s.type)?.name }}
                      <span class="zj-dot">·</span>
                      {{ s.version ? `V${s.version}` : '未发布' }}</small
                    >
                  </div>
                </div>
              </td>
              <td>
                <span class="zj-cycle-label"
                  ><Icon
                    :icon="
                      s.mode === 'fixed'
                        ? 'lucide:calendar-check-2'
                        : 'lucide:sliders-horizontal'
                    "
                  />{{ s.mode === 'fixed' ? '固定周期' : '汇报者自选' }}</span
                ><small>{{ zhijiCycleText(s).split(' · ')[1] }}</small>
              </td>
              <td>
                {{ s.scope
                }}<small>{{
                  s.scopeMode === 'all'
                    ? '全体成员可见'
                    : s.scopeMode === 'departments'
                      ? '所选部门全员可见'
                      : '所选人员可见'
                }}</small>
              </td>
              <td>
                <span class="zj-badge" :data-status="s.status">{{
                  { published: '已发布', draft: '草稿', disabled: '已停用' }[
                    s.status
                  ]
                }}</span>
              </td>
              <td>
                <div class="zj-row-actions">
                  <button @click="edit(s.id)">配置</button
                  ><button @click="duplicate(s)">复制</button
                  ><button
                    v-if="s.status === 'published'"
                    @click="disable(s)"
                  >
                    停用</button
                  ><button v-else @click="edit(s.id)">去发布</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length === 0" class="zj-empty">
        <Icon icon="lucide:search-x" />
        <h3>没有匹配的方案</h3>
        <p>调整筛选条件，或创建新的汇报方案。</p>
        <Button
          @click="
            search = '';
            type = '';
            mode = '';
            status = '';
          "
          >清除筛选</Button
        >
      </div>
      <footer class="zj-table-foot">
        <Icon icon="lucide:info" />
        方案配置按版本保存。修改方案不会改变已经提报的历史报告。
      </footer>
    </div>
    <div class="zj-guide-row">
      <div>
        <Icon icon="lucide:calendar-check-2" /><strong>固定周期</strong>
        <p>统一节奏，例如每周、每双周、每季度。汇报者只选具体哪一期。</p>
      </div>
      <div>
        <Icon icon="lucide:sliders-horizontal" /><strong>汇报者自选</strong>
        <p>开放多个周期，由汇报者根据业务节奏选择周报、月报或季报。</p>
      </div>
    </div>
  </section>
</template>
