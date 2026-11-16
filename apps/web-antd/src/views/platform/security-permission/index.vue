<script setup lang="ts">
import type { Admin, PermissionTreeNode, Role } from '#/types/settings';

import { computed, onMounted, ref } from 'vue';

// 显式导入所有使用的 Ant Design 组件
import {
  Button,
  Card,
  message,
  Space,
  Spin,
  Tabs,
  Tag,
  Tree,
} from 'ant-design-vue';

import { getAdminsApi, getPermissionsApi, getRolesApi } from '#/api/settings';

// 当前激活的 Tab
const activeTab = ref('admins');

// 加载状态
const loading = ref(false);

// 管理员列表
const admins = ref<Admin[]>([]);

// 角色列表
const roles = ref<Role[]>([]);

// 权限树数据
const permissionsTree = ref<PermissionTreeNode[]>([]);

// 选中的权限 keys
const checkedPermissionKeys = ref<string[]>([]);

// 表格列定义 - 管理员
const adminColumns = computed(() => [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
  { title: '姓名', dataIndex: 'realName', key: 'realName', width: 120 },
  { title: '角色', dataIndex: 'roleName', key: 'roleName', width: 120 },
  {
    title: 'MFA状态',
    dataIndex: 'mfaEnabled',
    key: 'mfaEnabled',
    width: 100,
  },
  {
    title: '最后登录时间',
    dataIndex: 'lastLoginAt',
    key: 'lastLoginAt',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
  },
]);

// 表格列定义 - 角色
const roleColumns = computed(() => [
  { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  {
    title: '权限数',
    dataIndex: 'permissionCount',
    key: 'permissionCount',
    width: 100,
  },
  {
    title: '管理员数',
    dataIndex: 'adminCount',
    key: 'adminCount',
    width: 100,
  },
  {
    title: '系统角色',
    dataIndex: 'isSystem',
    key: 'isSystem',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
  },
]);

// 格式化日期时间
function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 计算权限数量
function getPermissionCount(role: Role): number {
  let count = 0;
  const countPermissions = (permissions: typeof role.permissions) => {
    for (const perm of permissions) {
      count += 1;
      if (perm.children && perm.children.length > 0) {
        countPermissions(perm.children);
      }
    }
  };
  countPermissions(role.permissions);
  return count;
}

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    // 根据当前 Tab 加载对应数据
    switch (activeTab.value) {
      case 'admins': {
        const res = await getAdminsApi();
        admins.value = res.data;

        break;
      }
      case 'permissions': {
        const res = await getPermissionsApi();
        permissionsTree.value = res.data;

        break;
      }
      case 'roles': {
        const res = await getRolesApi();
        roles.value = res.data;

        break;
      }
      // No default
    }
  } catch (error) {
    message.error('加载数据失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// Tab 切换事件
function handleTabChange(key: string) {
  activeTab.value = key;
  loadData();
}

// 新增管理员
function handleAddAdmin() {
  message.info('新增管理员功能开发中');
}

// 编辑管理员
function handleEditAdmin(admin: Admin) {
  message.info(`编辑管理员: ${admin.realName}`);
}

// 删除管理员
function handleDeleteAdmin(admin: Admin) {
  message.info(`删除管理员: ${admin.realName}`);
}

// 启用/禁用管理员
function handleToggleAdminStatus(admin: Admin) {
  message.info(
    `${admin.status === 'active' ? '禁用' : '启用'}管理员: ${admin.realName}`,
  );
}

// 新增角色
function handleAddRole() {
  message.info('新增角色功能开发中');
}

// 编辑角色
function handleEditRole(role: Role) {
  message.info(`编辑角色: ${role.name}`);
}

// 删除角色
function handleDeleteRole(role: Role) {
  if (role.isSystem) {
    message.warning('系统角色不能删除');
    return;
  }
  message.info(`删除角色: ${role.name}`);
}

// 配置角色权限
function handleConfigureRolePermissions(role: Role) {
  message.info(`配置角色权限: ${role.name}`);
}

// 权限树选择变更
function handlePermissionCheck(checkedKeys: string[]) {
  checkedPermissionKeys.value = checkedKeys;
}

// 初始化
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="h-full w-full p-6">
    <Card title="安全与权限" class="h-full">
      <Tabs
        v-model:active-key="activeTab"
        class="h-full"
        @change="handleTabChange"
      >
        <!-- 管理员管理 -->
        <Tabs.TabPane key="admins" tab="管理员管理">
          <div class="mb-4 flex items-center justify-between">
            <div class="text-sm text-gray-500">
              共 {{ admins.length }} 个管理员
            </div>
            <Button type="primary" @click="handleAddAdmin"> 新增管理员 </Button>
          </div>

          <Spin :spinning="loading">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-200">
                <thead>
                  <tr class="bg-gray-50">
                    <th
                      v-for="column in adminColumns"
                      :key="column.key"
                      class="border border-gray-200 px-4 py-3 text-left text-sm font-semibold"
                      :style="{
                        width: column.width ? `${column.width}px` : 'auto',
                      }"
                    >
                      {{ column.title }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="admin in admins"
                    :key="admin.id"
                    class="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td class="border border-gray-200 px-4 py-3">
                      {{ admin.username }}
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      {{ admin.realName }}
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Tag color="blue">{{ admin.roleName }}</Tag>
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Tag
                        :color="
                          admin.mfaEnabled === 'enabled' ? 'success' : 'default'
                        "
                      >
                        {{
                          admin.mfaEnabled === 'enabled' ? '已启用' : '未启用'
                        }}
                      </Tag>
                    </td>
                    <td class="border border-gray-200 px-4 py-3 text-sm">
                      {{ formatDateTime(admin.lastLoginAt) }}
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Tag
                        :color="admin.status === 'active' ? 'success' : 'error'"
                      >
                        {{ admin.status === 'active' ? '启用' : '禁用' }}
                      </Tag>
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          @click="handleEditAdmin(admin)"
                        >
                          编辑
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          :danger="admin.status === 'active'"
                          @click="handleToggleAdminStatus(admin)"
                        >
                          {{ admin.status === 'active' ? '禁用' : '启用' }}
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          danger
                          @click="handleDeleteAdmin(admin)"
                        >
                          删除
                        </Button>
                      </Space>
                    </td>
                  </tr>
                  <tr v-if="admins.length === 0">
                    <td
                      :colspan="adminColumns.length"
                      class="border border-gray-200 px-4 py-8 text-center text-gray-500"
                    >
                      暂无数据
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Spin>
        </Tabs.TabPane>

        <!-- 角色管理 -->
        <Tabs.TabPane key="roles" tab="角色管理">
          <div class="mb-4 flex items-center justify-between">
            <div class="text-sm text-gray-500">
              共 {{ roles.length }} 个角色
            </div>
            <Button type="primary" @click="handleAddRole"> 新增角色 </Button>
          </div>

          <Spin :spinning="loading">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-200">
                <thead>
                  <tr class="bg-gray-50">
                    <th
                      v-for="column in roleColumns"
                      :key="column.key"
                      class="border border-gray-200 px-4 py-3 text-left text-sm font-semibold"
                      :style="{
                        width: column.width ? `${column.width}px` : 'auto',
                      }"
                    >
                      {{ column.title }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="role in roles"
                    :key="role.id"
                    class="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td class="border border-gray-200 px-4 py-3 font-medium">
                      {{ role.name }}
                    </td>
                    <td
                      class="border border-gray-200 px-4 py-3 text-sm text-gray-600"
                    >
                      {{ role.description || '-' }}
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Tag color="processing">
                        {{ getPermissionCount(role) }}
                      </Tag>
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Tag color="blue">{{ role.adminCount }}</Tag>
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Tag v-if="role.isSystem" color="orange">系统角色</Tag>
                      <Tag v-else color="default">自定义</Tag>
                    </td>
                    <td class="border border-gray-200 px-4 py-3">
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          @click="handleConfigureRolePermissions(role)"
                        >
                          配置权限
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          @click="handleEditRole(role)"
                        >
                          编辑
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          :disabled="role.isSystem"
                          danger
                          @click="handleDeleteRole(role)"
                        >
                          删除
                        </Button>
                      </Space>
                    </td>
                  </tr>
                  <tr v-if="roles.length === 0">
                    <td
                      :colspan="roleColumns.length"
                      class="border border-gray-200 px-4 py-8 text-center text-gray-500"
                    >
                      暂无数据
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Spin>
        </Tabs.TabPane>

        <!-- 权限配置 -->
        <Tabs.TabPane key="permissions" tab="权限配置">
          <div class="mb-4 flex items-center justify-between">
            <div class="text-sm text-gray-500">权限树形结构</div>
            <Button type="primary" @click="message.info('保存权限配置')">
              保存配置
            </Button>
          </div>

          <Spin :spinning="loading">
            <div
              class="overflow-auto rounded-lg border border-gray-200 p-4"
              style="max-height: 600px"
            >
              <Tree
                v-model:checked-keys="checkedPermissionKeys"
                checkable
                :field-names="{
                  key: 'key',
                  title: 'title',
                  children: 'children',
                }"
                :tree-data="permissionsTree"
                @check="handlePermissionCheck"
              >
                <template #title="{ title, type }">
                  <span class="flex items-center gap-2">
                    <span>{{ title }}</span>
                    <Tag v-if="type === 'module'" color="blue" class="text-xs">
                      模块
                    </Tag>
                    <Tag v-else color="green" class="text-xs"> 操作 </Tag>
                  </span>
                </template>
              </Tree>
            </div>
          </Spin>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
