<!-- eslint-disable vue/html-closing-bracket-newline -->
<script setup lang="ts">
import type { GrantRequest, GrantTarget } from '#/types/file-management';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Drawer,
  Input,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import { grantFiles } from '#/api/file-management';
import { FilePermission, GrantTargetType } from '#/types/file-management';

interface Props {
  open: boolean;
  fileIds?: string[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

// 目标类型
const targetType = ref<'group' | 'user'>('user');

// 搜索关键词
const searchKeyword = ref('');

// 部门筛选
const filterDepartment = ref('');

// 部门列表
const departments = computed(() => {
  const deptSet = new Set<string>();
  mockUsers.forEach((user) => {
    if (user.department) deptSet.add(user.department);
  });
  return [...deptSet].toSorted();
});

// 选中的目标ID列表（中间状态）
const pendingTargetIds = ref<string[]>([]);

// 已授权列表
const grantedTargets = ref<
  Array<GrantTarget & { permissions: FilePermission[] }>
>([]);

// 已授权列表选中的行（用于批量移除）
const selectedGrantedRowKeys = ref<string[]>([]);

// 用户列表分页
const userPagination = ref({
  current: 1,
  pageSize: 8,
});

// 模拟数据
const mockUsers = [
  { id: 'u1', name: 'zhangsan', nickname: '张三', department: '技术部' },
  { id: 'u2', name: 'lisi', nickname: '李四', department: '财务部' },
  { id: 'u3', name: 'wangwu', nickname: '王五', department: '人事部' },
  { id: 'u4', name: 'zhaoliu', nickname: '赵六', department: '技术部' },
  { id: 'u5', name: 'qianqi', nickname: '钱七', department: '市场部' },
  { id: 'u6', name: 'sunba', nickname: '孙八', department: '运营部' },
  { id: 'u7', name: 'zhoujiu', nickname: '周九', department: '产品部' },
  { id: 'u8', name: 'wushi', nickname: '吴十', department: '设计部' },
  { id: 'u9', name: 'zhengyi', nickname: '郑一', department: '销售部' },
  { id: 'u10', name: 'chener', nickname: '陈二', department: '客服部' },
  { id: 'u11', name: 'lin', nickname: '林十一', department: '技术部' },
  { id: 'u12', name: 'huang', nickname: '黄十二', department: '财务部' },
  { id: 'u13', name: 'yang', nickname: '杨十三', department: '人事部' },
  { id: 'u14', name: 'zhu', nickname: '朱十四', department: '技术部' },
  { id: 'u15', name: 'qin', nickname: '秦十五', department: '市场部' },
  { id: 'u16', name: 'xu', nickname: '许十六', department: '运营部' },
  { id: 'u17', name: 'he', nickname: '何十七', department: '产品部' },
  { id: 'u18', name: 'lv', nickname: '吕十八', department: '设计部' },
  { id: 'u19', name: 'shi', nickname: '施十九', department: '销售部' },
  { id: 'u20', name: 'zhang', nickname: '张二十', department: '客服部' },
  { id: 'u21', name: 'lin2', nickname: '林二十一', department: '技术部' },
  { id: 'u22', name: 'huang2', nickname: '黄二十二', department: '财务部' },
  { id: 'u23', name: 'yang2', nickname: '杨二十三', department: '人事部' },
  { id: 'u24', name: 'zhu2', nickname: '朱二十四', department: '技术部' },
];

const mockGroups = [
  { id: 'g1', name: '财务审批组', description: '负责财务相关审批' },
  { id: 'g2', name: '技术审核组', description: '负责技术方案审核' },
  { id: 'g3', name: '管理员组', description: '系统管理员' },
  { id: 'g4', name: '合同审批组', description: '合同文件审批' },
  { id: 'g5', name: '风控审核组', description: '风险控制审核' },
  { id: 'g6', name: '项目协作组', description: '跨部门项目协作' },
];

// 当前可选列表（已过滤和搜索）
const availableList = computed(() => {
  const allList = targetType.value === 'user' ? mockUsers : mockGroups;

  // 过滤掉已授权的
  const filtered = allList.filter((item) => {
    const grantedIds = grantedTargets.value.map((t) => t.id);
    if (grantedIds.includes(item.id)) return false;

    // 搜索过滤（名称模糊查询）
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(keyword);
      if (!nameMatch) return false;
    }

    // 部门筛选（仅用户类型）
    if (
      targetType.value === 'user' &&
      filterDepartment.value &&
      (item as any).department !== filterDepartment.value
    )
      return false;

    return true;
  });

  return filtered;
});

// 分页后的用户列表
const paginatedUserList = computed(() => {
  if (targetType.value !== 'user') return [];
  const start =
    (userPagination.value.current - 1) * userPagination.value.pageSize;
  const end = start + userPagination.value.pageSize;
  return availableList.value.slice(start, end);
});

// 用户列表总数
const userTotal = computed(() => {
  if (targetType.value !== 'user') return 0;
  return availableList.value.length;
});

// 用户表格列定义
const userColumns = [
  { title: '', key: 'checkbox', width: 50, align: 'center' },
  { title: '用户账号', key: 'name', width: 120 },
  { title: '用户名称', key: 'nickname', width: 120 },
  { title: '所在部门', key: 'department', width: 120 },
];

// 快捷权限定义
const QUICK_PERMISSIONS = {
  MANAGE: [
    FilePermission.VIEW,
    FilePermission.DOWNLOAD,
    FilePermission.EDIT,
    FilePermission.DELETE,
    FilePermission.SHARE,
    FilePermission.MANAGE,
  ],
  VIEW: [FilePermission.VIEW],
};

// 切换目标选中状态
function toggleTarget(id: string) {
  const index = pendingTargetIds.value.indexOf(id);
  pendingTargetIds.value =
    index === -1
      ? [...pendingTargetIds.value, id]
      : pendingTargetIds.value.filter((i) => i !== id);
}

// 检查目标是否选中
function isTargetSelected(id: string): boolean {
  return pendingTargetIds.value.includes(id);
}

// 添加到授权列表
function addToGrantList(permissionType: 'MANAGE' | 'VIEW') {
  if (pendingTargetIds.value.length === 0) {
    message.warning('请选择授权目标');
    return;
  }

  const permissions = QUICK_PERMISSIONS[permissionType];

  // 添加到授权列表最上方
  const list = targetType.value === 'user' ? mockUsers : mockGroups;
  let addedCount = 0;
  pendingTargetIds.value.forEach((id) => {
    const item = list.find((i) => i.id === id);
    if (item && !grantedTargets.value.some((t) => t.id === id)) {
      grantedTargets.value.unshift({
        id: item.id,
        type:
          targetType.value === 'user'
            ? GrantTargetType.USER
            : GrantTargetType.GROUP,
        name: item.name,
        department: (item as any).department,
        permissions: [...permissions],
      });
      addedCount++;
    }
  });

  // 清空选择
  pendingTargetIds.value = [];

  if (addedCount > 0) {
    message.success(`已添加 ${addedCount} 个授权目标`);
  } else {
    message.warning('所选目标已在授权列表中');
  }
}

// 移除授权
function removeGrant(id: string) {
  grantedTargets.value = grantedTargets.value.filter((t) => t.id !== id);
}

// 批量移除授权
function batchRemoveGrants() {
  if (selectedGrantedRowKeys.value.length === 0) {
    message.warning('请选择要移除的授权');
    return;
  }
  const count = selectedGrantedRowKeys.value.length;
  grantedTargets.value = grantedTargets.value.filter(
    (t) => !selectedGrantedRowKeys.value.includes(t.id),
  );
  selectedGrantedRowKeys.value = [];
  message.success(`已移除 ${count} 条授权`);
}

// 表格列定义
const columns = [
  { title: '授权目标', key: 'target', width: 200 },
  { title: '类型', key: 'type', width: 80 },
  { title: '权限范围', key: 'permissions', width: 120 },
  { title: '操作', key: 'action', width: 90, align: 'center' },
];

// 标题
const drawerTitle = computed(() => {
  const count = props.fileIds?.length || 0;
  return count > 1 ? `批量授权 (${count} 个档案)` : '档案授权';
});

// 提交授权
async function handleSubmit() {
  if (grantedTargets.value.length === 0) {
    message.warning('请至少添加一个授权目标');
    return;
  }

  const requestData: GrantRequest = {
    fileIds: props.fileIds || [],
    targets: grantedTargets.value.map((t) => ({ id: t.id, type: t.type })),
    permissions: [],
    expiresAt: undefined,
    remark: '',
  };

  await grantFiles(requestData);
  message.success('授权成功');
  emit('success');
  internalOpen.value = false;
  resetForm();
}

// 重置表单
function resetForm() {
  targetType.value = 'user';
  searchKeyword.value = '';
  filterDepartment.value = '';
  pendingTargetIds.value = [];
  grantedTargets.value = [];
}

// 监听弹窗关闭
watch(internalOpen, (val) => {
  if (!val) {
    resetForm();
  }
});

// 监听类型切换清空选择
watch(targetType, () => {
  pendingTargetIds.value = [];
});
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline -->
  <Drawer
    v-model:open="internalOpen"
    :title="drawerTitle"
    width="1600"
    placement="right"
  >
    <div class="flex gap-6">
      <!-- 左侧：授权目标 -->
      <div class="w-[500px] space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">授权目标</span>
          <span class="text-sm text-slate-500"
            >已选 {{ pendingTargetIds.length }}</span
          >
        </div>

        <!-- 类型切换 -->
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5">
          <button
            class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="
              targetType === 'user'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="
              targetType = 'user';
              pendingTargetIds = [];
              filterDepartment = '';
            "
          >
            用户
          </button>
          <button
            class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="
              targetType === 'group'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="
              targetType = 'group';
              pendingTargetIds = [];
            "
          >
            群组
          </button>
        </div>

        <!-- 搜索框 -->
        <Input
          v-model:value="searchKeyword"
          placeholder="按名称模糊搜索..."
          allow-clear
          size="large"
        >
          <template #prefix>
            <Icon icon="lucide:search" class="size-4 text-slate-400" />
          </template>
        </Input>

        <!-- 部门筛选框（仅用户类型显示） -->
        <Select
          v-if="targetType === 'user'"
          v-model:value="filterDepartment"
          placeholder="筛选部门..."
          allow-clear
          size="large"
          class="w-full"
        >
          <Select.Option value="">全部部门</Select.Option>
          <Select.Option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </Select.Option>
        </Select>

        <!-- 目标列表 -->
        <div class="space-y-4">
          <!-- 用户表格 -->
          <div v-if="targetType === 'user'">
            <Table
              :columns="userColumns"
              :data-source="paginatedUserList"
              :pagination="{
                current: userPagination.current,
                pageSize: userPagination.pageSize,
                total: userTotal,
                size: 'small',
                showTotal: (total) => `共 ${total} 条`,
              }"
              row-key="id"
              size="small"
              :locale="{
                emptyText:
                  searchKeyword || filterDepartment ? '无匹配结果' : '暂无用户',
              }"
              @change="
                (pagination) => {
                  userPagination.current = pagination.current || 1;
                }
              "
            >
              <template #bodyCell="{ column, record }">
                <!-- 复选框 -->
                <template v-if="column.key === 'checkbox'">
                  <Checkbox
                    :checked="isTargetSelected(record.id)"
                    @click.stop="toggleTarget(record.id)"
                  />
                </template>

                <!-- 用户账号 -->
                <template v-else-if="column.key === 'name'">
                  <span class="text-sm font-medium">{{ record.name }}</span>
                </template>

                <!-- 用户名称 -->
                <template v-else-if="column.key === 'nickname'">
                  <span class="text-sm text-slate-600">{{
                    record.nickname
                  }}</span>
                </template>

                <!-- 所在部门 -->
                <template v-else-if="column.key === 'department'">
                  <Tag size="small">{{ record.department }}</Tag>
                </template>
              </template>
            </Table>
          </div>

          <!-- 群组列表 -->
          <div
            v-else
            class="max-h-[calc(100vh-320px)] overflow-y-auto rounded-lg border border-slate-200"
          >
            <div
              v-for="item in availableList"
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-blue-50"
              :class="{ 'bg-blue-50': isTargetSelected(item.id) }"
              @click="toggleTarget(item.id)"
            >
              <Checkbox :checked="isTargetSelected(item.id)" :size="18" />
              <Avatar :size="36" class="bg-slate-100">
                <Icon icon="lucide:users" class="size-5 text-slate-500" />
              </Avatar>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">{{ item.name }}</div>
                <div class="text-xs text-slate-400">
                  {{ item.description || '' }}
                </div>
              </div>
            </div>
            <div
              v-if="availableList.length === 0"
              class="py-12 text-center text-sm text-slate-400"
            >
              <Icon icon="lucide:inbox" class="mx-auto mb-2 size-8" />
              <div>无匹配结果</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间区域：权限按钮 -->
      <div class="flex flex-col justify-center gap-4">
        <div class="text-center text-base font-semibold">权限类型</div>

        <!-- 权限按钮 -->
        <div class="flex flex-col gap-3">
          <Button
            type="default"
            size="large"
            class="h-16 px-6 text-base"
            :disabled="pendingTargetIds.length === 0"
            @click="addToGrantList('VIEW')"
          >
            <Icon icon="lucide:chevrons-right" class="mr-2 size-5" />
            <span>查看</span>
          </Button>
          <Button
            type="primary"
            danger
            size="large"
            class="h-16 px-6 text-base"
            :disabled="pendingTargetIds.length === 0"
            @click="addToGrantList('MANAGE')"
          >
            <Icon icon="lucide:chevrons-right" class="mr-2 size-5" />
            <span>管理</span>
          </Button>
        </div>
      </div>

      <!-- 垂直分隔线 -->
      <div class="w-px self-stretch border-l border-slate-200"></div>

      <!-- 右侧：已授权清单 -->
      <div class="flex-1 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">已授权清单</span>
          <div class="flex items-center gap-4">
            <span class="text-sm text-slate-500"
              >{{ grantedTargets.length }} 条</span
            >
            <Button
              v-if="selectedGrantedRowKeys.length > 0"
              danger
              size="small"
              @click="batchRemoveGrants"
            >
              <Icon icon="lucide:trash-2" class="mr-1 size-3" />
              批量移除 ({{ selectedGrantedRowKeys.length }})
            </Button>
          </div>
        </div>

        <!-- 授权表格 -->
        <Card class="flex-1">
          <Table
            :columns="columns"
            :data-source="grantedTargets"
            :pagination="false"
            row-key="id"
            size="middle"
            :row-selection="{
              selectedRowKeys: selectedGrantedRowKeys,
              onChange: (keys) => (selectedGrantedRowKeys = keys),
            }"
            :locale="{ emptyText: '暂无授权，请在左侧选择目标和权限后添加' }"
            :scroll="{ y: 'calc(100vh - 340px)' }"
          >
            <template #bodyCell="{ column, record }">
              <!-- 授权目标 -->
              <div
                v-if="column.key === 'target'"
                class="flex items-center gap-3"
              >
                <Avatar :size="36" class="bg-slate-100">
                  <Icon
                    :icon="
                      record.type === GrantTargetType.USER
                        ? 'lucide:user'
                        : 'lucide:users'
                    "
                    class="size-5 text-slate-500"
                  />
                </Avatar>
                <div class="min-w-0">
                  <div class="text-sm font-medium">{{ record.name }}</div>
                  <div v-if="record.department" class="text-xs text-slate-400">
                    {{ record.department }}
                  </div>
                </div>
              </div>

              <!-- 类型 -->
              <Tag
                v-else-if="column.key === 'type'"
                :color="record.type === GrantTargetType.USER ? 'blue' : 'green'"
              >
                {{ record.type === GrantTargetType.USER ? '用户' : '群组' }}
              </Tag>

              <!-- 权限范围 -->
              <Tag
                v-else-if="column.key === 'permissions'"
                :color="
                  record.permissions.includes(FilePermission.MANAGE)
                    ? 'gold'
                    : 'blue'
                "
              >
                {{
                  record.permissions.includes(FilePermission.MANAGE)
                    ? '管理'
                    : '查看'
                }}
              </Tag>

              <!-- 操作 -->
              <Button
                v-else-if="column.key === 'action'"
                type="link"
                size="small"
                danger
                @click="removeGrant(record.id)"
              >
                <Icon icon="lucide:trash-2" class="mr-1 size-3" />
                移除
              </Button>
            </template>
          </Table>
        </Card>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="internalOpen = false">取消</Button>
        <Button
          type="primary"
          :disabled="grantedTargets.length === 0"
          @click="handleSubmit"
        >
          确认授权
        </Button>
      </div>
    </template>
  </Drawer>
</template>
