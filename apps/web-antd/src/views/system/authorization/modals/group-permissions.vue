<script setup lang="ts">
import type { Group } from '#/api/mock-authorization-groups';
import { ref } from 'vue';
import {
  Button,
  Checkbox,
  Drawer,
  Tabs,
  TabPane,
  message,
} from 'ant-design-vue';
import { applications, appIcon, groups } from '#/api/mock-authorization-groups';
import GroupMembers from '../components/group-members.vue';

const props = defineProps<{ group: Group }>();
const emit = defineEmits<{ close: [] }>();
const activeTab = ref('members');
const draft = ref<Group>({
  ...props.group,
  users: [...props.group.users],
  departments: [...props.group.departments],
  recursive: [...props.group.recursive],
  apps: [...props.group.apps],
});
function save() {
  const { users, departments, recursive, apps } = draft.value;
  groups.value = groups.value.map((g) =>
    g.id === props.group.id ? { ...g, users, departments, recursive, apps } : g,
  );
  message.success('授权配置已保存');
  emit('close');
}
</script>
<template>
  <Drawer
    open
    width="min(1600px, 96vw)"
    root-class-name="group-editor-drawer"
    :title="'授权管理 · ' + group.name"
    @close="emit('close')"
  >
    <Tabs v-model:active-key="activeTab">
      <TabPane key="members" tab="授权内容"
        ><GroupMembers v-model="draft"
      /></TabPane>
      <TabPane key="apps" tab="关联应用">
        <section class="group-apps-panel">
          <header>
            <h3>已开通应用</h3>
            <span
              >已勾选 {{ draft.apps.length }} / {{ applications.length }}</span
            >
          </header>
          <Checkbox.Group v-model:value="draft.apps" class="group-app-options">
            <Checkbox
              v-for="app in applications"
              :key="app"
              :value="app"
              :class="{ selected: draft.apps.includes(app) }"
              ><span class="gm-app-title"
                ><img :src="appIcon(app)" width="36" height="36" alt="" />{{
                  app
                }}</span
              ></Checkbox
            >
          </Checkbox.Group>
        </section>
      </TabPane>
    </Tabs>
    <template #footer
      ><div class="auth-actions">
        <Button @click="emit('close')">取消</Button
        ><Button type="primary" @click="save">保存授权</Button>
      </div></template
    >
  </Drawer>
</template>
