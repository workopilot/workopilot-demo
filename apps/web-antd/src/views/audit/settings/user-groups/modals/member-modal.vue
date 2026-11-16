<script setup lang="ts">
import type { GroupMember, UserGroup } from '#/types/user-groups';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  addGroupMembers,
  getAvailableUsers,
  getGroupMembers,
  removeGroupMember,
} from '#/api/user-groups';

// ==================== Types ====================

interface SelectedUser {
  id: string;
  name: string;
  avatar?: string;
  department?: string;
}

// ==================== Props ====================

interface Props {
  open: boolean;
  group: null | UserGroup;
  permission?: {
    canAddMember: boolean;
    canChangeMemberRole: boolean;
    canRemoveMember: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  group: null,
  permission: () => ({
    canAddMember: false,
    canRemoveMember: false,
    canChangeMemberRole: false,
  }),
});

// ==================== Emits ====================

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'update-members'): void;
}>();

// ==================== 状态 ====================

const loading = ref(false);
const members = ref<GroupMember[]>([]);
const showAddPanel = ref(false);
const selectedUsers = ref<string[]>([]);
const availableUsers = ref<SelectedUser[]>([]);
const userSearchKeyword = ref('');

const columns = [
  {
    title: '成员信息',
    key: 'user',
    width: 250,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
  },
  {
    title: '加入时间',
    key: 'joinedAt',
    width: 160,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
  },
];

// ==================== 方法 ====================

/** 加载成员列表 */
async function loadMembers() {
  if (!props.group?.id) return;

  loading.value = true;
  try {
    const response = await getGroupMembers(props.group.id);
    members.value = response.data;
  } catch (error) {
    message.error('获取成员列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

/** 加载可选用户 */
async function loadAvailableUsers() {
  try {
    const response = await getAvailableUsers(userSearchKeyword.value);
    // 过滤掉已经是成员的用户
    const memberIds = new Set(members.value.map((m) => m.userId));
    availableUsers.value = response.data
      .filter((u) => !memberIds.has(u.id))
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        department: u.department,
      }));
  } catch (error) {
    console.error(error);
  }
}

/** 打开弹窗 */
function handleOpen() {
  if (props.group) {
    loadMembers();
  }
}

/** 关闭弹窗 */
function handleCancel() {
  showAddPanel.value = false;
  selectedUsers.value = [];
  userSearchKeyword.value = '';
  emit('cancel');
}

/** 打开添加面板 */
function handleOpenAddPanel() {
  showAddPanel.value = true;
  loadAvailableUsers();
}

/** 关闭添加面板 */
function handleCloseAddPanel() {
  showAddPanel.value = false;
  selectedUsers.value = [];
  userSearchKeyword.value = '';
}

/** 搜索用户 */
function handleSearchUsers() {
  loadAvailableUsers();
}

/** 添加成员 */
async function handleAddMembers() {
  if (selectedUsers.value.length === 0) {
    message.warning('请选择要添加的成员');
    return;
  }

  if (!props.group?.id) return;

  try {
    await addGroupMembers(props.group.id, {
      userIds: selectedUsers.value,
      role: 'member',
    });
    message.success('添加成功');
    selectedUsers.value = [];
    loadMembers();
    loadAvailableUsers();
    emit('update-members');
  } catch (error) {
    message.error('添加失败');
    console.error(error);
  }
}

/** 移除成员 */
async function handleRemoveMember(member: GroupMember) {
  if (!props.group?.id) return;

  // 不能移除拥有者
  if (member.role === 'owner') {
    message.warning('不能移除群组拥有者');
    return;
  }

  try {
    await removeGroupMember(props.group.id, member.id);
    message.success('移除成功');
    loadMembers();
    emit('update-members');
  } catch (error) {
    message.error('移除失败');
    console.error(error);
  }
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

// ==================== 监听 ====================

watch(() => props.open, handleOpen);
</script>

<template>
  <Modal
    :open="open"
    :title="`${group?.name || '群组'} - 成员管理`"
    :width="800"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="member-modal">
      <!-- 添加成员面板 -->
      <div
        v-if="showAddPanel"
        class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4"
      >
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-medium text-blue-700">添加成员</h3>
          <Button type="text" size="small" @click="handleCloseAddPanel">
            <Icon icon="lucide:x" class="size-4" />
          </Button>
        </div>

        <!-- 搜索用户 -->
        <div class="mb-3 flex gap-2">
          <Input
            v-model:value="userSearchKeyword"
            placeholder="搜索用户姓名"
            allow-clear
            @press-enter="handleSearchUsers"
          >
            <template #prefix>
              <Icon icon="lucide:search" class="size-4 text-muted-foreground" />
            </template>
          </Input>
          <Button @click="handleSearchUsers">搜索</Button>
        </div>

        <!-- 可选用户列表 -->
        <div
          v-if="availableUsers.length > 0"
          class="mb-3 max-h-40 overflow-y-auto"
        >
          <div
            v-for="user in availableUsers"
            :key="user.id"
            class="flex items-center gap-2 rounded border border-gray-200 bg-white p-2 hover:bg-gray-50"
          >
            <img
              v-if="user.avatar"
              :src="user.avatar"
              class="size-8 rounded-full"
            />
            <div
              v-else
              class="flex size-8 items-center justify-center rounded-full bg-muted text-xs"
            >
              {{ user.name.charAt(0) }}
            </div>
            <span class="flex-1 text-sm">{{ user.name }}</span>
            <span class="text-xs text-muted-foreground">{{
              user.department
            }}</span>
            <Button
              type="link"
              size="small"
              :disabled="selectedUsers.includes(user.id)"
              @click="selectedUsers.push(user.id)"
            >
              {{ selectedUsers.includes(user.id) ? '已选择' : '选择' }}
            </Button>
          </div>
        </div>
        <div
          v-else
          class="mb-3 rounded bg-white p-4 text-center text-sm text-muted-foreground"
        >
          {{
            userSearchKeyword ? '未找到匹配的用户' : '点击搜索按钮加载可选用户'
          }}
        </div>

        <!-- 已选用户 -->
        <div class="flex items-center gap-4">
          <div class="text-sm">
            已选:
            <span class="font-medium text-blue-600">{{
              selectedUsers.length
            }}</span>
            人
          </div>
          <div class="flex-1"></div>
          <Button
            type="primary"
            :disabled="selectedUsers.length === 0"
            @click="handleAddMembers"
          >
            确认添加
          </Button>
        </div>
      </div>

      <!-- 成员列表 -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>成员列表 ({{ members.length }}人)</span>
            <Button
              v-if="permission?.canAddMember"
              type="primary"
              size="small"
              @click="handleOpenAddPanel"
            >
              <Icon icon="lucide:user-plus" class="size-4" />
              添加成员
            </Button>
          </div>
        </template>

        <Table
          :columns="columns"
          :data-source="members"
          :loading="loading"
          :pagination="false"
          :row-key="(record) => record.id"
          size="small"
        >
          <template #emptyText>
            <Empty description="暂无成员" />
          </template>

          <template #bodyCell="{ column, record }">
            <!-- 成员信息 -->
            <template v-if="column.key === 'user'">
              <div class="flex items-center gap-2">
                <img
                  v-if="record.userAvatar"
                  :src="record.userAvatar"
                  class="size-8 rounded-full"
                />
                <div
                  v-else
                  class="flex size-8 items-center justify-center rounded-full bg-muted text-xs"
                >
                  {{ record.userName.charAt(0) }}
                </div>
                <div>
                  <div class="text-sm font-medium">{{ record.userName }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ record.userDepartment || '-' }}
                  </div>
                </div>
              </div>
            </template>

            <!-- 状态 -->
            <template v-else-if="column.key === 'status'">
              <Tag :color="record.status === 'active' ? 'green' : 'default'">
                {{ record.status === 'active' ? '正常' : '停用' }}
              </Tag>
            </template>

            <!-- 加入时间 -->
            <template v-else-if="column.key === 'joinedAt'">
              <span class="text-sm text-muted-foreground">
                {{ formatDate(record.joinedAt) }}
              </span>
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'actions'">
              <Space :size="4">
                <Tooltip v-if="record.role !== 'owner'" title="移除成员">
                  <Popconfirm
                    title="确定移除该成员吗？"
                    @confirm="handleRemoveMember(record)"
                  >
                    <Button
                      type="link"
                      size="small"
                      danger
                      :disabled="!permission?.canRemoveMember"
                    >
                      <Icon icon="lucide:user-minus" class="size-4" />
                    </Button>
                  </Popconfirm>
                </Tooltip>
                <Tooltip v-else title="拥有者不可移除">
                  <Button type="link" size="small" disabled>
                    <Icon icon="lucide:shield" class="size-4" />
                  </Button>
                </Tooltip>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <!-- 底部按钮 -->
      <div class="mt-4 flex justify-end">
        <Button @click="handleCancel">关闭</Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.member-modal :deep(.ant-card-body) {
  padding: 16px;
}
</style>
