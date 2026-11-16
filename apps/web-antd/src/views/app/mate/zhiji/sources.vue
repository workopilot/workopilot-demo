<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, message } from 'ant-design-vue';

import { mockDelay } from '#/api/mock-data';
import { zhijiSchemes, zhijiSources } from '#/api/mock-zhiji';

const selected = ref<(typeof zhijiSources)[number]>();
const open = ref(false);
const testing = ref('');
async function test(id: string) {
  testing.value = id;
  await mockDelay(500);
  const source = zhijiSources.find((s) => s.id === id)!;
  source.checked = '刚刚';
  testing.value = '';
  message[source.status === '可用' ? 'success' : 'warning'](
    source.status === '可用'
      ? `${source.name}：模拟连接测试通过`
      : 'Git 尚未授权，请在公司统一连接中配置；本页不收集凭证',
  );
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 数据连接</div>
        <h1>数据源</h1>
        <p>复用平台连接，让每一项成果都能回到原始依据。</p>
      </div>
      <span class="zj-badge">只读采集</span>
    </header>
    <div class="zj-inline-note">
      <Icon icon="lucide:shield-check" />
      <p>
        连接凭证由公司统一管理。报告可见权限不会自动开放源记录或附件的访问权限。
      </p>
    </div>
    <div class="zj-source-grid">
      <article
        v-for="source in zhijiSources"
        :key="source.id"
        class="zj-panel zj-source-card"
      >
        <div class="zj-card-top">
          <span class="zj-type-icon"><Icon :icon="source.icon" /></span
          ><span
            class="zj-badge"
            :data-status="source.status === '可用' ? 'published' : 'draft'"
            >{{ source.status }}</span
          >
        </div>
        <h2>{{ source.name }}</h2>
        <p>{{ source.description }}</p>
        <dl class="zj-summary-details">
          <div>
            <dt>来源系统</dt>
            <dd>{{ source.system }}</dd>
          </div>
          <div>
            <dt>使用方案</dt>
            <dd>
              {{
                zhijiSchemes.filter((s) => s.sources.includes(source.id))
                  .length
              }}
              个
            </dd>
          </div>
          <div>
            <dt>最近检查</dt>
            <dd>{{ source.checked }}</dd>
          </div>
        </dl>
        <div class="zj-card-actions">
          <Button
            :loading="testing === source.id"
            :disabled="!!testing"
            @click="test(source.id)"
            >测试连接</Button
          ><Button
            @click="
              selected = source;
              open = true;
            "
            >查看范围</Button
          >
        </div>
      </article>
    </div>
    <Drawer v-model:open="open" :title="selected?.name" :width="440"
      ><div v-if="selected" class="zj-drawer-content">
        <h3>采集范围</h3>
        <p>{{ selected.description }}，以报告对象和当前用户权限共同过滤。</p>
        <h3>关联方案</h3>
        <p
          v-for="s in zhijiSchemes.filter((s) =>
            s.sources.includes(selected!.id),
          )"
          :key="s.id"
        >
          {{ s.name }} · {{ s.scope }}
        </p>
        <div class="zj-inline-note">
          <Icon icon="lucide:flask-conical" />
          <p>当前连接状态与测试均为演示，不访问真实业务系统。</p>
        </div>
      </div></Drawer
    >
  </section>
</template>
