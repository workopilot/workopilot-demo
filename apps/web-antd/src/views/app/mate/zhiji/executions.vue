<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Drawer, message } from 'ant-design-vue';

import { mockDelay } from '#/api/mock-data';
import { zhijiExecutions } from '#/api/mock-zhiji';

const status = ref('');
const selected = ref<(typeof zhijiExecutions)[number]>();
const open = ref(false);
const busy = ref('');
const rows = computed(() =>
  zhijiExecutions.filter((r) => !status.value || r.status === status.value),
);
async function retry(r: (typeof zhijiExecutions)[number]) {
  if (busy.value) return;
  busy.value = r.id;
  await mockDelay(650);
  r.attempts++;
  r.status = '成功';
  r.detail = '模拟重试已完成，巡检示例来源已恢复。历史报告没有被覆盖。';
  busy.value = '';
  message.success('模拟重试成功');
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 运行追踪</div>
        <h1>执行记录</h1>
        <p>查看生成与采集结果，定位异常并保留处理过程。</p>
      </div>
      <span class="zj-badge">北京时间</span>
    </header>
    <div class="zj-panel">
      <div class="zj-filterbar">
        <strong>最近执行</strong
        ><select v-model="status" aria-label="筛选执行状态">
          <option value="">全部状态</option>
          <option>成功</option>
          <option>失败</option></select
        ><span class="zj-muted">{{ rows.length }} 条记录</span>
      </div>
      <div class="zj-table-wrap">
        <table class="zj-table">
          <thead>
            <tr>
              <th>方案 / 执行编号</th>
              <th>动作</th>
              <th>时间</th>
              <th>结果</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td>
                <strong>{{ r.name }}</strong
                ><small>{{ r.id }}</small>
              </td>
              <td>{{ r.action }}</td>
              <td>{{ r.time }}</td>
              <td>
                <span
                  class="zj-badge"
                  :data-status="r.status === '成功' ? 'published' : 'failed'"
                  >{{ busy === r.id ? '重试中' : r.status }}</span
                >
              </td>
              <td>
                <div class="zj-row-actions">
                  <button
                    @click="
                      selected = r;
                      open = true;
                    "
                  >
                    详情</button
                  ><button
                    v-if="r.status === '失败'"
                    :disabled="!!busy"
                    @click="retry(r)"
                  >
                    {{ busy === r.id ? '重试中…' : '重试' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="rows.length === 0" class="zj-empty">
        <Icon icon="lucide:circle-check" />
        <h3>没有匹配的执行记录</h3>
        <p>当前筛选下暂无记录。</p>
      </div>
      <footer class="zj-table-foot">
        <Icon icon="lucide:flask-conical" />
        预置运行记录与模拟重试，不运行真实定时服务。
      </footer>
    </div>
    <Drawer v-model:open="open" title="执行详情" :width="440"
      ><div v-if="selected" class="zj-drawer-content">
        <span
          class="zj-badge"
          :data-status="selected.status === '成功' ? 'published' : 'failed'"
          >{{ selected.status }}</span
        >
        <h2>{{ selected.name }}</h2>
        <p>{{ selected.id }}</p>
        <dl class="zj-summary-details">
          <div>
            <dt>执行时间</dt>
            <dd>{{ selected.time }}</dd>
          </div>
          <div>
            <dt>执行次数</dt>
            <dd>{{ selected.attempts }}</dd>
          </div>
        </dl>
        <h3>执行结果</h3>
        <p>{{ selected.detail }}</p>
      </div></Drawer
    >
  </section>
</template>
