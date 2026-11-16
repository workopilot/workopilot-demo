<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { UserGroup } from '#/types/user-groups';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Empty,
  Input,
  message,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  deleteGroup,
  getGroupPermission,
  getUserGroups,
  toggleGroupStatus,
} from '#/api/user-groups';

import FormModal from './modals/form-modal.vue';
import MemberModal from './modals/member-modal.vue';

// ==================== 常量定义 ====================

const GROUP_STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

// ==================== 列表数据 ====================

const tableData = ref<UserGroup[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

// ==================== 筛选条件 ====================

const keyword = ref('');
const statusFilter = ref<string | undefined>();

// ==================== 弹窗状态 ====================

const formModalOpen = ref(false);
const editingGroup = ref<null | UserGroup>(null);
const groupPermissions = ref<Record<string, any>>({});
const memberModalOpen = ref(false);
const currentGroup = ref<null | UserGroup>(null);

// ==================== 获取数据 ====================

async function fetchGroupList() {
  loading.value = true;
  try {
    const response = await getUserGroups({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value as any,
    });
    tableData.value = response.data.items;
    total.value = response.data.total;

    // 获取权限信息
    for (const group of response.data.items) {
      const perm = await getGroupPermission(group.id);
      groupPermissions.value[group.id] = perm.data;
    }
  } catch (error) {
    message.error('获取群组列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// ==================== 操作处理 ====================

/** 打开新增弹窗 */
function handleAdd() {
  editingGroup.value = null;
  formModalOpen.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(group: UserGroup) {
  const permission = groupPermissions.value[group.id];
  if (!permission?.canEdit) {
    message.warning('您没有编辑此群组的权限');
    return;
  }
  editingGroup.value = group;
  formModalOpen.value = true;
}

/** 表单提交成功 */
function handleFormSuccess() {
  formModalOpen.value = false;
  message.success('操作成功');
  fetchGroupList();
}

/** 切换状态 */
async function handleToggleStatus(group: UserGroup) {
  const permission = groupPermissions.value[group.id];
  if (!permission?.canEdit) {
    message.warning('您没有修改此群组的权限');
    return;
  }

  try {
    await toggleGroupStatus(group.id);
    message.success('状态更新成功');
    fetchGroupList();
  } catch (error) {
    message.error('状态更新失败');
    console.error(error);
  }
}

/** 删除群组 */
async function handleDelete(id: string) {
  const permission = groupPermissions.value[id];
  if (!permission?.canDelete) {
    message.warning('您没有删除此群组的权限');
    return;
  }

  try {
    await deleteGroup(id);
    message.success('删除成功');
    fetchGroupList();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

/** 查看成员 */
function handleViewMembers(group: UserGroup) {
  currentGroup.value = group;
  memberModalOpen.value = true;
}

/** 成员更新后刷新列表 */
function handleMembersUpdated() {
  memberModalOpen.value = false;
  fetchGroupList();
}

/** 重置筛选 */
function handleResetFilters() {
  keyword.value = '';
  statusFilter.value = undefined;
  currentPage.value = 1;
  fetchGroupList();
}

// ==================== 表格列定义 ====================

const columns: TableColumnsType<UserGroup> = [
  {
    title: '群组名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '群组编码',
    dataIndex: 'code',
    key: 'code',
    width: 140,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
    width: 180,
  },
  {
    title: '标签',
    key: 'tags',
    width: 150,
  },
  {
    title: '成员数',
    dataIndex: 'memberCount',
    key: 'memberCount',
    width: 90,
    align: 'center',
  },
  {
    title: '拥有者',
    dataIndex: 'ownerName',
    key: 'ownerName',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    align: 'center',
    fixed: 'right',
  },
];

// ==================== 生命周期 ====================

onMounted(() => {
  fetchGroupList();
});
</script>

<template>
  <div class="user-groups-page">
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold">用户群组</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        为用户进行分组管理，租户管理员可管理租户级用户组，个人可查看不能修改；个人可管理个人名下的用户组。
      </p>
    </div>

    <!-- 筛选条件栏 -->
    <Card class="mb-4">
      <div
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-muted-foreground"
          >关键词</label>
          <Input
            v-model:value="keyword"
            placeholder="群组名称/编码"
            allow-clear
            @press-enter="fetchGroupList"
          >
            <template #prefix>
              <Icon icon="lucide:search" class="size-4 text-muted-foreground" />
            </template>
          </Input>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-muted-foreground">状态</label>
          <Select
            v-model:value="statusFilter"
            placeholder="选择状态"
            allow-clear
            :options="GROUP_STATUS_OPTIONS"
          />
        </div>

        <div class="flex items-end gap-2">
          <Button type="primary" @click="fetchGroupList">
            <Icon icon="lucide:search" class="size-4" />
            搜索
          </Button>
          <Button @click="handleResetFilters">重置</Button>
        </div>

        <div class="flex items-end justify-end">
          <Button type="primary" @click="handleAdd">
            <Icon icon="lucide:plus" class="size-4" />
            新建群组
          </Button>
        </div>
      </div>
    </Card>

    <!-- 数据表格 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :row-key="(record) => record.id"
        :scroll="{ x: 1200 }"
      >
        <template #emptyText>
          <Empty description="暂无群组数据" />
        </template>

        <!-- 群组名称 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <span class="font-medium">{{ record.name }}</span>
          </template>

          <!-- 群组编码 -->
          <template v-else-if="column.key === 'code'">
            <code class="rounded bg-muted px-1.5 py-0.5 text-xs">
              {{ record.code }}
            </code>
          </template>

          <!-- 描述 -->
          <template v-else-if="column.key === 'description'">
            <span class="text-muted-foreground">
              {{ record.description || '-' }}
            </span>
          </template>

          <!-- 标签 -->
          <template v-else-if="column.key === 'tags'">
            <div
              v-if="record.tags && record.tags.length > 0"
              class="flex flex-wrap gap-1"
            >
              <Tag v-for="tag in record.tags" :key="tag" size="small">
                {{ tag }}
              </Tag>
            </div>
            <span v-else class="text-muted-foreground">-</span>
          </template>

          <!-- 成员数 -->
          <template v-else-if="column.key === 'memberCount'">
            <span class="text-muted-foreground"
            >{{ record.memberCount }} 人</span>
          </template>

          <!-- 状态 -->
          <template v-else-if="column.key === 'status'">
            <Switch
              :checked="record.status === 'active'"
              :disabled="!groupPermissions[record.id]?.canEdit"
              @change="handleToggleStatus(record)"
            />
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'actions'">
            <Space :size="4">
              <Tooltip title="查看成员">
                <Button
                  type="link"
                  size="small"
                  @click="handleViewMembers(record)"
                >
                  <Icon icon="lucide:users" class="size-4" />
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button
                  type="link"
                  size="small"
                  :disabled="!groupPermissions[record.id]?.canEdit"
                  @click="handleEdit(record)"
                >
                  <Icon icon="lucide:pencil" class="size-4" />
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定删除此群组吗？"
                @confirm="handleDelete(record.id)"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  :disabled="!groupPermissions[record.id]?.canDelete"
                >
                  <Icon icon="lucide:trash-2" class="size-4" />
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>

      <!-- 分页 -->
      <div v-if="total > 0" class="mt-4 flex items-center justify-end">
        <Pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :show-size-changer="true"
          :page-size-options="['10', '20', '50', '100']"
          show-total
          @change="fetchGroupList"
        />
      </div>
    </Card>

    <!-- 表单弹窗 -->
    <FormModal
      v-if="formModalOpen"
      :open="formModalOpen"
      :group="editingGroup"
      @success="handleFormSuccess"
      @cancel="formModalOpen = false"
    />

    <!-- 成员管理弹窗 -->
    <MemberModal
      :open="memberModalOpen"
      :group="currentGroup"
      :permission="currentGroup ? groupPermissions[currentGroup.id] : undefined"
      @cancel="memberModalOpen = false"
      @update-members="handleMembersUpdated"
    />
  </div>
</template>

<style scoped>
.user-groups-page {
  padding: 0;
}
</style>
