<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ChevronsRight, Inbox, Search } from '@vben/icons';
import {
  Button,
  Checkbox,
  Input,
  Segmented,
  Select,
  Tag,
} from 'ant-design-vue';
import {
  departments,
  deptName,
  people,
  type Group,
} from '#/api/mock-authorization-groups';

import MemberPagination from './member-pagination.vue';

const group = defineModel<Group>({ required: true });
const kind = ref<'users' | 'departments'>('users');
const query = ref('');
const department = ref('');
const page = ref(1);
const pageSize = ref(20);
const list = ref<HTMLElement>();
const memberPage = ref(1);
const memberPageSize = ref(20);
const memberList = ref<HTMLElement>();
const pending = ref<string[]>([]);
const marked = ref<string[]>([]);
const directory = [
  ...people.map((p) => ({
    key: 'user-' + p.id,
    id: p.id,
    kind: 'users' as const,
    name: p.name,
    dept: p.dept,
    note: deptName(p.dept),
    hasChildren: false,
  })),
  ...departments.map((d) => ({
    key: 'dept-' + d.id,
    id: d.id,
    kind: 'departments' as const,
    name: d.name,
    dept: d.id,
    note: d.parent ? deptName(d.parent) + ' / ' + d.name : '直属部门',
    hasChildren: departments.some((child) => child.parent === d.id),
  })),
];
const members = computed(() =>
  directory.filter((item) => group.value[item.kind].includes(item.id)),
);
const included = computed(() => new Set(members.value.map((item) => item.key)));
const matches = computed(() =>
  directory.filter(
    (item) =>
      item.kind === kind.value &&
      (kind.value !== 'users' ||
        !department.value ||
        item.dept === department.value) &&
      (item.name + item.note + item.id).includes(query.value.trim()),
  ),
);
const visible = computed(() =>
  matches.value.slice(
    (page.value - 1) * pageSize.value,
    page.value * pageSize.value,
  ),
);
const visibleMembers = computed(() =>
  members.value.slice(
    (memberPage.value - 1) * memberPageSize.value,
    memberPage.value * memberPageSize.value,
  ),
);
watch(memberPageSize, () => {
  memberPage.value = 1;
});
watch(
  () => members.value.length,
  (length) => {
    const last = Math.max(1, Math.ceil(length / memberPageSize.value));
    memberPage.value = Math.min(memberPage.value, last);
  },
);
watch([memberPage, memberPageSize], () => {
  marked.value = [];
  memberList.value?.scrollTo({ top: 0 });
});
watch(visibleMembers, (rows) => {
  const keys = new Set(rows.map((row) => row.key));
  marked.value = marked.value.filter((key) => keys.has(key));
});
watch([query, department, kind, pageSize], () => {
  page.value = 1;
});
watch([query, department, kind, page, pageSize], () => {
  pending.value = [];
  list.value?.scrollTo({ top: 0 });
});
function toggle(keys: string[], id: string) {
  return keys.includes(id) ? keys.filter((k) => k !== id) : [...keys, id];
}
function addMembers() {
  for (const item of directory) {
    if (pending.value.includes(item.key) && !included.value.has(item.key)) {
      group.value[item.kind].push(item.id);
    }
  }
  pending.value = [];
}
function removeMembers(keys: string[]) {
  for (const item of members.value) {
    if (!keys.includes(item.key)) continue;
    group.value[item.kind] = group.value[item.kind].filter(
      (id) => id !== item.id,
    );
    if (item.kind === 'departments')
      group.value.recursive = group.value.recursive.filter(
        (id) => id !== item.id,
      );
  }
  marked.value = marked.value.filter((k) => !keys.includes(k));
}
function setScope(id: string, descendants: boolean) {
  group.value.recursive = group.value.recursive.filter((key) => key !== id);
  if (descendants) group.value.recursive.push(id);
}
</script>
<template>
  <div class="gm-workspace">
    <section class="gm-picker">
      <header>
        <h3>选择授权目标</h3>
        <span aria-live="polite">已选 {{ pending.length }}</span>
      </header>
      <Segmented
        v-model:value="kind"
        :options="[
          { label: '人员', value: 'users' },
          { label: '部门', value: 'departments' },
        ]"
        @change="query = ''"
      />
      <Input
        v-model:value="query"
        allow-clear
        size="large"
        aria-label="搜索授权目标"
        :placeholder="
          kind === 'users' ? '搜索姓名、工号或部门' : '搜索部门名称'
        "
        ><template #prefix><Search :size="16" /></template
      ></Input>
      <label v-if="kind === 'users'" class="gm-dept-filter"
        >部门筛选
        <select v-model="department">
          <option value="">全部部门</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">
            {{ d.name }}
          </option>
        </select>
      </label>
      <div ref="list" class="gm-list">
        <label
          v-for="item in visible"
          :key="item.key"
          class="gm-row"
          :class="{
            'gm-person-row': item.kind === 'users',
            picked: pending.includes(item.key),
            assigned: included.has(item.key),
          }"
        >
          <input
            type="checkbox"
            :aria-label="'选择' + item.name"
            :disabled="included.has(item.key)"
            :checked="pending.includes(item.key)"
            @change="pending = toggle(pending, item.key)"
          />
          <span
            v-if="item.kind === 'departments'"
            class="gm-avatar"
            :class="{ department: item.kind === 'departments' }"
            >{{ item.name.slice(0, 1) }}</span
          >
          <span class="gm-identity"
            ><b>{{ item.name }}</b
            ><small>{{ item.note }}</small></span
          ><small v-if="included.has(item.key)" class="gm-assigned"
            >已加入</small
          >
        </label>
        <div v-if="!visible.length" class="gm-empty">
          没有匹配的{{ kind === 'users' ? '人员' : '部门' }}
        </div>
      </div>
      <MemberPagination
        v-model:page="page"
        v-model:page-size="pageSize"
        label="授权目标"
        :total="matches.length"
        :unit="kind === 'users' ? '人' : '个部门'"
      />
    </section>
    <div class="gm-transfer">
      <Button
        size="large"
        type="primary"
        :disabled="!pending.length"
        @click="addMembers"
        ><template #icon><ChevronsRight :size="17" /></template>加入清单</Button
      >
    </div>
    <section class="gm-members">
      <header>
        <h3>组成员清单</h3>
        <div class="gm-count">
          <Button
            v-if="marked.length"
            size="small"
            danger
            @click="removeMembers(marked)"
            >批量移除 ({{ marked.length }})</Button
          ><span aria-live="polite">{{ members.length }} 条</span>
        </div>
      </header>
      <div class="gm-card">
        <div ref="memberList" class="gm-table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <Checkbox
                    aria-label="全选本页清单成员"
                    :checked="
                      !!members.length &&
                      marked.length === visibleMembers.length
                    "
                    :disabled="!members.length"
                    :indeterminate="
                      !!marked.length && marked.length < visibleMembers.length
                    "
                    @change="
                      marked =
                        marked.length === visibleMembers.length
                          ? []
                          : visibleMembers.map((m) => m.key)
                    "
                  />
                </th>
                <th>授权目标</th>
                <th>类型</th>
                <th>生效范围</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in visibleMembers" :key="item.key">
                <td>
                  <Checkbox
                    :aria-label="'选中清单中的' + item.name"
                    :checked="marked.includes(item.key)"
                    @change="marked = toggle(marked, item.key)"
                  />
                </td>
                <td>
                  <span
                    class="gm-identity"
                    :class="{ 'gm-person-identity': item.kind === 'users' }"
                    ><b>{{ item.name }}</b
                    ><small>{{ item.note }}</small></span
                  >
                </td>
                <td>
                  <Tag :color="item.kind === 'users' ? 'blue' : 'green'">{{
                    item.kind === 'users' ? '人员' : '部门'
                  }}</Tag>
                </td>
                <td>
                  <label
                    v-if="item.hasChildren"
                    class="sr-only"
                    :for="'scope-' + item.id"
                    >{{ item.name }}生效范围</label
                  >
                  <Select
                    v-if="item.hasChildren"
                    :id="'scope-' + item.id"
                    size="small"
                    :value="group.recursive.includes(item.id) ? 'all' : 'self'"
                    :options="[
                      { value: 'self', label: '仅本部门' },
                      { value: 'all', label: '含下级部门' },
                    ]"
                    @change="(v) => setScope(item.id, v === 'all')"
                  /><span v-else>{{
                    item.kind === 'users' ? '本人' : '仅本部门'
                  }}</span>
                </td>
                <td>
                  <Button
                    danger
                    type="link"
                    size="small"
                    :aria-label="'移除' + item.name"
                    @click="removeMembers([item.key])"
                    >移除</Button
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!members.length" class="gm-empty">
          <Inbox :size="28" /><b>暂无组成员</b
          ><span>勾选人员或部门后，点击「加入清单」。</span>
        </div>
      </div>
      <MemberPagination
        v-model:page="memberPage"
        v-model:page-size="memberPageSize"
        label="组成员清单"
        :total="members.length"
        unit="条"
      />
    </section>
  </div>
</template>
