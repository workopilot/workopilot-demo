<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Drawer, Input, message } from 'ant-design-vue';

import { zhijiObligations } from '#/api/mock-zhiji';

const filter = ref('all');
const search = ref('');
const selected = ref<(typeof zhijiObligations)[number]>();
const open = ref(false);
const filtered = computed(() =>
  zhijiObligations.filter(
    (r) =>
      `${r.name}${r.person}${r.scope}`.includes(search.value) &&
      (filter.value === 'all' ||
        (filter.value === 'overdue' && r.status === '已逾期') ||
        (filter.value === 'feedback' && r.feedback === '待反馈')),
  ),
);
function remind(r: (typeof zhijiObligations)[number]) {
  r.reminders++;
  message.success(
    `已记录对${r.feedback === '待反馈' ? r.reviewer : r.person}的演示催办，未发送真实消息`,
  );
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 汇报协作</div>
        <h1>提报与反馈</h1>
        <p>跟进应交事项与指定反馈，让协作及时闭环。</p>
      </div>
      <span class="zj-badge">2026 年 10 月 · 示例</span>
    </header>
    <div class="zj-panel">
      <div class="zj-filterbar">
        <div class="zj-tabs">
          <button
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >
            全部汇报 <b>{{ zhijiObligations.length }}</b></button
          ><button
            :class="{ active: filter === 'overdue' }"
            @click="filter = 'overdue'"
          >
            逾期待交
            <b>{{
              zhijiObligations.filter((r) => r.status === '已逾期').length
            }}</b></button
          ><button
            :class="{ active: filter === 'feedback' }"
            @click="filter = 'feedback'"
          >
            待反馈
            <b>{{
              zhijiObligations.filter((r) => r.feedback === '待反馈').length
            }}</b>
          </button>
        </div>
        <Input
          v-model:value="search"
          placeholder="搜索方案或汇报者"
          aria-label="搜索提报记录"
          allow-clear
          class="zj-search"
        />
      </div>
      <div class="zj-table-wrap">
        <table class="zj-table">
          <thead>
            <tr>
              <th>汇报 / 汇报者</th>
              <th>覆盖周期</th>
              <th>提交状态</th>
              <th>指定反馈</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id">
              <td>
                <strong>{{ r.name }}</strong
                ><small>{{ r.person }} · {{ r.scope }}</small>
              </td>
              <td>
                {{ r.period }}<small>截止：{{ r.deadline }}</small>
              </td>
              <td>
                <span
                  class="zj-badge"
                  :data-status="
                    r.status === '已提报'
                      ? 'published'
                      : r.status === '已逾期'
                        ? 'failed'
                        : 'draft'
                  "
                  >{{ r.status }}</span
                >
              </td>
              <td>
                {{ r.feedback }}<small>{{ r.reviewer }}</small>
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
                    v-if="r.status === '已逾期' || r.feedback === '待反馈'"
                    :disabled="r.reminders > 0"
                    @click="remind(r)"
                  >
                    {{ r.reminders ? '已催办' : '催办' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length === 0" class="zj-empty">
        <Icon icon="lucide:inbox" />
        <p>没有符合条件的汇报记录</p>
      </div>
      <footer class="zj-table-foot">
        <Icon icon="lucide:info" />
        仅对逾期未交或指定反馈未完成的对象催办，普通分享接收者无需反馈。
      </footer>
    </div>
    <Drawer v-model:open="open" title="提报与反馈详情" :width="440"
      ><div v-if="selected" class="zj-drawer-content">
        <h2>{{ selected.name }}</h2>
        <p>{{ selected.person }} · {{ selected.period }}</p>
        <dl class="zj-summary-details">
          <div>
            <dt>提交状态</dt>
            <dd>{{ selected.status }}</dd>
          </div>
          <div>
            <dt>截止时间</dt>
            <dd>{{ selected.deadline }}</dd>
          </div>
          <div>
            <dt>指定反馈人</dt>
            <dd>{{ selected.reviewer }}</dd>
          </div>
          <div>
            <dt>反馈状态</dt>
            <dd>{{ selected.feedback }}</dd>
          </div>
          <div>
            <dt>本次催办</dt>
            <dd>{{ selected.reminders }} 次</dd>
          </div>
        </dl>
        <div class="zj-inline-note">
          <Icon icon="lucide:message-square-text" />
          <p>
            指定反馈必须同时填写评分与意见。该记录仅展示协作状态，未连接真实报告与通知服务。
          </p>
        </div>
      </div></Drawer
    >
  </section>
</template>
