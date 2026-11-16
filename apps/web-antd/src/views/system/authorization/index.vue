<script setup lang="ts">
import type { Group } from '#/api/mock-authorization-groups';
import { computed, ref } from 'vue';
import {
  ArrowRightLeft,
  BookOpenText,
  Inbox,
  InspectionPanel,
  LockKeyhole,
  Plus,
  Search,
  Settings,
  UserRoundPen,
} from '@vben/icons';
import { Button, Drawer, Empty, Input, Select } from 'ant-design-vue';
import {
  accessApps,
  applications,
  appIcon,
  deptName,
  groups,
  memberships,
  people,
  sources,
  transferLog,
  userName,
} from '#/api/mock-authorization-groups';
import PersonSearch from './components/person-search.vue';
import GroupPermissions from './modals/group-permissions.vue';
import GroupEditor from './modals/group-editor.vue';
import PersonTransfer from './modals/person-transfer.vue';
import './style.css';

const tab = ref<'groups' | 'people'>('groups');
const term = ref('');
const filter = ref<string>();
const person = ref('');
const personInfo = computed(() => people.find((p) => p.id === person.value));
const personGroups = computed(() => memberships(person.value));
const apps = computed(() => accessApps(person.value));
const transferable = computed(() =>
  personGroups.value.some((g) => g.users.includes(person.value)),
);
const filtered = computed(() =>
  groups.value.filter(
    (g) =>
      (g.name + g.code + g.note).includes(term.value.trim()) &&
      (!filter.value ||
        (filter.value === 'none'
          ? !g.apps.length
          : g.apps.includes(filter.value))),
  ),
);
const memberCount = computed(
  () => people.filter((p) => accessApps(p.id).length).length,
);
const appCount = computed(
  () => new Set(groups.value.flatMap((g) => g.apps)).size,
);
const deptCount = computed(
  () => new Set(groups.value.flatMap((g) => g.departments)).size,
);
const editor = ref(false);
const editing = ref<Group>();
const managing = ref<Group>();
const detail = ref<Group>();
const transfer = ref(false);
const log = ref(false);
const glyphs = [InspectionPanel, BookOpenText, Inbox, Settings];
function edit(g?: Group) {
  editing.value = g;
  detail.value = undefined;
  editor.value = true;
}
function lookup(id: string) {
  person.value = id;
  detail.value = undefined;
  tab.value = 'people';
}
</script>
<template>
  <main class="auth-page">
    <header class="auth-heading">
      <div>
        <h1>授权管理</h1>
        <p>按组管理应用访问权限，查询成员授权与人员交接。</p>
      </div>
      <div class="auth-actions">
        <Button @click="log = true"
          ><template #icon><BookOpenText :size="16" /></template
          >交接记录</Button
        ><Button class="auth-primary" type="primary" @click="edit()"
          ><template #icon><Plus :size="17" /></template>新建授权组</Button
        >
      </div>
    </header>
    <section class="auth-stats" aria-label="授权概览">
      <div class="metric featured">
        <div>
          <span>授权组总数</span><strong>{{ groups.length }}</strong
          ><small
            >其中
            {{ groups.filter((g) => !g.apps.length).length }}
            个待关联应用</small
          >
        </div>
        <div class="orbit" aria-hidden="true">
          <LockKeyhole :size="37" :stroke-width="1.4" />
        </div>
      </div>
      <div class="metric">
        <div>
          <span>已授权人员</span><strong>{{ memberCount }}</strong
          ><small>直接指定与部门授权合并去重</small>
        </div>
        <i><UserRoundPen :size="21" /></i>
      </div>
      <div class="metric">
        <div>
          <span>已关联应用</span><strong>{{ appCount }}</strong
          ><small>授权部门 {{ deptCount }} 个</small>
        </div>
        <i class="violet"><InspectionPanel :size="22" /></i>
      </div>
    </section>
    <section class="auth-panel">
      <nav class="auth-tabs" aria-label="授权管理视图">
        <button :aria-pressed="tab === 'groups'" @click="tab = 'groups'">
          <InspectionPanel :size="17" />授权组
        </button>
        <button :aria-pressed="tab === 'people'" @click="tab = 'people'">
          <UserRoundPen :size="17" />人员权限查询
        </button>
      </nav>
      <template v-if="tab === 'groups'">
        <div class="auth-toolbar">
          <h2>
            授权组列表 <small>{{ filtered.length }}</small>
          </h2>
          <div class="filters">
            <Input
              v-model:value="term"
              allow-clear
              placeholder="搜索组名、编号或备注"
              aria-label="搜索授权组"
              ><template #prefix><Search :size="15" /></template></Input
            ><Select
              v-model:value="filter"
              allow-clear
              aria-label="筛选关联应用"
              placeholder="全部应用"
              :options="[
                ...applications.map((a) => ({ value: a, label: a })),
                { value: 'none', label: '未关联应用' },
              ]"
            />
          </div>
        </div>
        <div class="auth-scroll" v-if="filtered.length">
          <table class="auth-table">
            <thead>
              <tr>
                <th>授权组名称</th>
                <th>状态</th>
                <th>成员配置</th>
                <th>关联应用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(g, i) in filtered" :key="g.id">
                <td>
                  <div class="group-name">
                    <i class="group-icon" :class="'tint-' + (i % 4)"
                      ><component :is="glyphs[i % 4]" :size="20"
                    /></i>
                    <div>
                      <button class="name-btn" @click="edit(g)">
                        {{ g.name }}</button
                      ><small>{{ g.code }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="group-state" :class="{ active: g.enabled }">{{
                    g.enabled ? '启用' : '停用'
                  }}</span>
                </td>
                <td>
                  <div class="members">
                    <span>{{ g.users.length }} 人</span><b>·</b
                    ><span>{{ g.departments.length }} 部门</span>
                  </div>
                </td>
                <td>
                  <div class="chips">
                    <span v-for="app in g.apps" :key="app"
                      ><img
                        class="auth-chip-icon"
                        :src="appIcon(app)"
                        width="16"
                        height="16"
                        alt=""
                      />{{ app }}</span
                    ><em v-if="!g.apps.length">未关联应用</em>
                  </div>
                </td>
                <td>
                  <div class="group-operations">
                    <button class="action-link" @click="edit(g)">
                      授权编辑</button
                    ><button class="action-link" @click="managing = g">
                      授权管理
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Empty v-else description="没有匹配的授权组" class="auth-empty"
          ><Button
            @click="
              term = '';
              filter = undefined;
            "
            >清除筛选</Button
          ></Empty
        >
      </template>
      <template v-else>
        <div class="auth-toolbar">
          <h2>人员权限查询</h2>
          <PersonSearch v-model="person" label="查询人员姓名或工号" />
        </div>
        <template v-if="personInfo"
          ><div class="person-info">
            <div class="avatar">{{ personInfo.name.slice(-1) }}</div>
            <div>
              <h3>{{ personInfo.name }}</h3>
              <p>{{ deptName(personInfo.dept) }} · 工号 {{ personInfo.id }}</p>
            </div>
            <Button :disabled="!transferable" @click="transfer = true"
              ><template #icon><ArrowRightLeft :size="15" /></template
              >替换人员</Button
            >
          </div>
          <div class="effective">
            <b
              >可访问应用 <small>{{ apps.length }}</small></b
            >
            <div class="chips">
              <span v-for="a in apps" :key="a"
                ><img
                  class="auth-chip-icon"
                  :src="appIcon(a)"
                  width="16"
                  height="16"
                  alt=""
                />{{ a }}</span
              ><em v-if="!apps.length">暂无可访问应用</em>
            </div>
          </div>
          <div v-if="personGroups.length" class="auth-scroll">
            <table class="auth-table">
              <thead>
                <tr>
                  <th>所在授权组</th>
                  <th>授权来源</th>
                  <th>关联应用</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in personGroups" :key="g.id">
                  <td>
                    <button class="name-btn" @click="detail = g">
                      {{ g.name }}
                    </button>
                  </td>
                  <td>
                    <div class="source-list">
                      <span v-for="s in sources(g, person)" :key="s">{{
                        s
                      }}</span>
                    </div>
                  </td>
                  <td>{{ g.apps.join('、') || '未关联应用' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Empty v-else class="auth-empty" description="该人员暂无生效的授权组"
        /></template>
      </template>
    </section>
    <Drawer
      :open="!!detail"
      :title="detail?.name"
      :width="'min(470px, 100vw)'"
      @close="detail = undefined"
    >
      <div v-if="detail" class="auth-form">
        <p v-if="detail.note">{{ detail.note }}</p>
        <section>
          <h3>直接指定人员 · {{ detail.users.length }}</h3>
          <div class="chips">
            <button v-for="id in detail.users" :key="id" @click="lookup(id)">
              {{ userName(id) }} ↗</button
            ><em v-if="!detail.users.length">暂无</em>
          </div>
        </section>
        <section>
          <h3>授权部门 · {{ detail.departments.length }}</h3>
          <p v-for="id in detail.departments" :key="id">
            {{ deptName(id) }} ·
            {{ detail.recursive.includes(id) ? '包含下级部门' : '仅本部门' }}
          </p>
          <p v-if="!detail.departments.length">暂无</p>
        </section>
        <section>
          <h3>关联应用 · {{ detail.apps.length }}</h3>
          <div class="chips">
            <span v-for="a in detail.apps" :key="a"
              ><img
                class="auth-chip-icon"
                :src="appIcon(a)"
                width="16"
                height="16"
                alt=""
              />{{ a }}</span
            ><em v-if="!detail.apps.length">未关联应用</em>
          </div>
        </section>
      </div>
      <template #footer
        ><Button type="primary" @click="edit(detail)"
          >编辑授权组</Button
        ></template
      >
    </Drawer>
    <Drawer
      :open="log"
      title="交接记录"
      :width="'min(460px,100vw)'"
      @close="log = false"
      ><Empty v-if="!transferLog.length" description="暂无人员交接记录" />
      <div v-else class="auth-form">
        <section v-for="(r, i) in transferLog" :key="i">
          <h3>{{ userName(r.from) }} → {{ userName(r.to) }}</h3>
          <p>{{ r.names.join('、') }}</p>
          <small>{{ r.operator }} · {{ r.time }}</small>
        </section>
      </div></Drawer
    >
    <GroupPermissions
      v-if="managing"
      :group="managing"
      @close="managing = undefined"
    />
    <GroupEditor :open="editor" :group="editing" @close="editor = false" />
    <PersonTransfer :open="transfer" :from="person" @close="transfer = false" />
  </main>
</template>
