<script setup lang="ts">
import type { Role } from '#/types/settings';

import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tree,
} from 'ant-design-vue';

import { deleteRoleApi, getRolesApi, updateRoleApi } from '#/api/settings';

// ==================== 角色列表 ====================
const roles = ref<Role[]>([]);
const loading = ref(false);

// 查询条件
const searchForm = reactive({
  roleName: '',
  permissionKey: '',
  status: '',
  createTime: [] as any[],
});

// 加载角色数据
const loadRoles = async () => {
  loading.value = true;
  try {
    const response = await getRolesApi(searchForm);
    roles.value = response.data;
  } catch {
    message.error('加载角色失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => loadRoles();

const handleReset = () => {
  Object.assign(searchForm, {
    roleName: '',
    permissionKey: '',
    status: '',
    createTime: [],
  });
  loadRoles();
};

const handleAddRole = () => {
  message.info('新增角色功能开发中');
};

const handleEditRole = (role: Role) => {
  message.info(`编辑角色: ${role.name}`);
};

const handleDeleteRole = async (id: string) => {
  try {
    await deleteRoleApi(id);
    message.success('删除成功');
    loadRoles();
  } catch {
    message.error('删除失败');
  }
};

const handleStatusChange = async (checked: boolean, id: string) => {
  try {
    await updateRoleApi(id, { status: checked ? 'enabled' : 'disabled' });
    message.success('状态更新成功');
    loadRoles();
  } catch {
    message.error('状态更新失败');
  }
};

const handleAssignUser = (role: Role) => {
  message.info(`分配用户: ${role.name}`);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== 权限配置弹窗 ====================
const permissionModal = reactive({
  visible: false,
  loading: false,
  currentRole: null as null | Role,
  activeTab: 'admin-menu',
});

// ---- 后台管理菜单树 ----
interface MenuTreeNode {
  key: string;
  title: string;
  icon?: string;
  children?: MenuTreeNode[];
}

const adminMenuTree: MenuTreeNode[] = [
  {
    key: 'workbench',
    title: '工作台',
    icon: 'lucide:layout-dashboard',
    children: [
      { key: 'workbench-home', title: '首页' },
      { key: 'workbench-bill', title: '数字员工账单' },
    ],
  },
  {
    key: 'digital-employee',
    title: '数字员工中心',
    icon: 'lucide:bot-message-square',
    children: [
      { key: 'agent-config', title: '数字员工配置' },
      { key: 'agent-workbench', title: '数字员工工作台' },
      {
        key: 'agent-performance',
        title: '数字员工绩效',
        children: [
          { key: 'performance-dashboard', title: '查看绩效看板' },
          { key: 'performance-read', title: '查看员工绩效详情' },
          { key: 'performance-config', title: '配置维度' },
          { key: 'performance-target', title: '管理目标' },
          { key: 'performance-adjust', title: '补录与冲正' },
          { key: 'performance-settle', title: '结算与重开' },
        ],
      },
    ],
  },
  {
    key: 'audit',
    title: '审核管理',
    icon: 'lucide:shield-check',
    children: [
      { key: 'audit-list', title: '审核列表' },
      { key: 'audit-history', title: '审核历史' },
      {
        key: 'audit-settings',
        title: '基础设置',
        children: [
          { key: 'source-system', title: '业务系统' },
          { key: 'bill-type', title: '单据类型' },
          { key: 'expense-category', title: '费用科目' },
          { key: 'role', title: '角色与权限' },
        ],
      },
    ],
  },
  {
    key: 'platform',
    title: '平台管理',
    icon: 'lucide:settings',
    children: [
      { key: 'admin', title: '管理员管理' },
      { key: 'role-manage', title: '角色管理' },
      { key: 'permission', title: '权限配置' },
    ],
  },
  {
    key: 'system-monitor',
    title: '系统监控',
    icon: 'lucide:activity',
    children: [
      { key: 'logs', title: '查看日志' },
      { key: 'metrics', title: '查看指标' },
    ],
  },
];

const checkedMenuKeys = ref<string[]>([]);

// ---- 数字员工权限 ----
interface DigitalEmployee {
  id: string;
  name: string;
  code: string;
  avatar: string;
  description: string;
  menus: string[];
}

const digitalEmployees: DigitalEmployee[] = [
  {
    id: 'emp-1',
    name: '工单助手',
    code: 'ticket-assistant',
    avatar:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20robot%20assistant%20avatar%20blue&image_size=square',
    description: '智能工单处理与跟进',
    menus: ['对话', '创建工单', '工单查询', '工单处理', '现场打卡'],
  },
  {
    id: 'emp-2',
    name: '报销助手',
    code: 'expense-assistant',
    avatar:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20robot%20assistant%20avatar%20green&image_size=square',
    description: '费用报销与审批',
    menus: ['对话', '费用申请', '报销审批', '预算查询', '发票识别'],
  },
  {
    id: 'emp-3',
    name: '报表助手',
    code: 'report-assistant',
    avatar:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20robot%20assistant%20avatar%20purple&image_size=square',
    description: '数据报表与分析',
    menus: ['对话', '生成报表', '数据统计', '趋势分析', '导出数据'],
  },
  {
    id: 'emp-4',
    name: '客服助手',
    code: 'cs-assistant',
    avatar:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20robot%20assistant%20avatar%20orange&image_size=square',
    description: '智能客服与问答',
    menus: ['对话', '客户咨询', '工单创建', '知识库查询', '满意度评价'],
  },
];

const employeeSearchText = ref('');
const checkedEmployeeIds = ref<string[]>([]);
const currentEmployeeId = ref<string>('');

const filteredEmployees = computed(() => {
  if (!employeeSearchText.value) return digitalEmployees;
  const kw = employeeSearchText.value.toLowerCase();
  return digitalEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(kw) || e.code.toLowerCase().includes(kw),
  );
});

const currentEmployee = computed(() =>
  digitalEmployees.find((e) => e.id === currentEmployeeId.value),
);

// 当前数字员工的菜单列表（对话固定在顶部）
const currentEmployeeMenus = computed(() => {
  if (!currentEmployee.value) return [];
  const menus = [...currentEmployee.value.menus];
  const chatIdx = menus.indexOf('对话');
  if (chatIdx > 0) {
    menus.splice(chatIdx, 1);
    menus.unshift('对话');
  }
  return menus;
});

// 生成菜单 key
const getMenuKey = (empId: string, menu: string) => `${empId}__${menu}`;

// 已勾选的菜单 key 集合
const checkedEmployeeMenuKeys = ref<string[]>([]);

// 判断数字员工是否全选
const isEmployeeAllChecked = (emp: DigitalEmployee) => {
  return emp.menus.every((m) =>
    checkedEmployeeMenuKeys.value.includes(getMenuKey(emp.id, m)),
  );
};

// 判断数字员工是否半选
const isEmployeeIndeterminate = (emp: DigitalEmployee) => {
  const checkedCount = emp.menus.filter((m) =>
    checkedEmployeeMenuKeys.value.includes(getMenuKey(emp.id, m)),
  ).length;
  return checkedCount > 0 && checkedCount < emp.menus.length;
};

// 勾选数字员工 -> 联动勾选其下所有菜单
const handleEmployeeCheck = (emp: DigitalEmployee, checked: boolean) => {
  const keys = emp.menus.map((m) => getMenuKey(emp.id, m));
  if (checked) {
    checkedEmployeeIds.value = [
      ...new Set([emp.id, ...checkedEmployeeIds.value]),
    ];
    keys.forEach((k) => {
      if (!checkedEmployeeMenuKeys.value.includes(k)) {
        checkedEmployeeMenuKeys.value.push(k);
      }
    });
  } else {
    checkedEmployeeIds.value = checkedEmployeeIds.value.filter(
      (id) => id !== emp.id,
    );
    checkedEmployeeMenuKeys.value = checkedEmployeeMenuKeys.value.filter(
      (k) => !keys.includes(k),
    );
  }
};

// 勾选单个菜单
const handleEmployeeMenuCheck = (menu: string, checked: boolean) => {
  if (!currentEmployee.value) return;
  const key = getMenuKey(currentEmployee.value.id, menu);
  if (checked) {
    if (!checkedEmployeeMenuKeys.value.includes(key)) {
      checkedEmployeeMenuKeys.value.push(key);
    }
  } else {
    checkedEmployeeMenuKeys.value = checkedEmployeeMenuKeys.value.filter(
      (k) => k !== key,
    );
  }
  // 同步数字员工选中状态
  if (isEmployeeAllChecked(currentEmployee.value)) {
    if (!checkedEmployeeIds.value.includes(currentEmployee.value.id)) {
      checkedEmployeeIds.value.push(currentEmployee.value.id);
    }
  } else {
    checkedEmployeeIds.value = checkedEmployeeIds.value.filter(
      (id) => id !== currentEmployee.value.id,
    );
  }
};

// 当前数字员工ID（用于模板中避免非空断言）
const currentEmployeeIdForMenu = computed(
  () => currentEmployee.value?.id || '',
);

// 切换当前查看的数字员工
const handleSelectEmployee = (emp: DigitalEmployee) => {
  currentEmployeeId.value = emp.id;
};

// ---- 应用及菜单权限 ----
interface BusinessApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  tag?: string;
  tagColor?: string;
  menus: { key: string; name: string }[];
}

const businessApps: BusinessApp[] = [
  {
    id: 'app-crm',
    name: 'CRM 客户管理',
    description: '客户信息、商机跟进、合同管理',
    icon: 'lucide:users',
    menus: [
      { key: 'crm-customer-list', name: '客户列表' },
      { key: 'crm-opportunity', name: '商机管理' },
      { key: 'crm-contract', name: '合同审批' },
      { key: 'crm-stats', name: '数据统计' },
    ],
  },
  {
    id: 'app-pm',
    name: '项目管理系统',
    description: '项目进度、任务分配、资源管理',
    icon: 'lucide:folder-kanban',
    tag: '定制化',
    tagColor: 'blue',
    menus: [
      { key: 'pm-project', name: '项目列表' },
      { key: 'pm-task', name: '任务管理' },
      { key: 'pm-member', name: '成员管理' },
      { key: 'pm-report', name: '项目报表' },
    ],
  },
  {
    id: 'app-expense',
    name: '费控报销系统',
    description: '费用申请、报销审批、预算控制',
    icon: 'lucide:receipt',
    tag: '三方',
    tagColor: 'orange',
    menus: [
      { key: 'expense-apply', name: '费用申请' },
      { key: 'expense-approve', name: '报销审批' },
      { key: 'expense-budget', name: '预算管理' },
      { key: 'expense-report', name: '费用报表' },
    ],
  },
];

const appSearchText = ref('');
const checkedAppIds = ref<string[]>([]);
const currentAppId = ref<string>('');

const filteredApps = computed(() => {
  if (!appSearchText.value) return businessApps;
  const kw = appSearchText.value.toLowerCase();
  return businessApps.filter((a) => a.name.toLowerCase().includes(kw));
});

const currentApp = computed(() =>
  businessApps.find((a) => a.id === currentAppId.value),
);

const checkedAppMenuKeys = ref<string[]>([]);

const isAppAllChecked = (app: BusinessApp) => {
  return app.menus.every((m) => checkedAppMenuKeys.value.includes(m.key));
};

const isAppIndeterminate = (app: BusinessApp) => {
  const checkedCount = app.menus.filter((m) =>
    checkedAppMenuKeys.value.includes(m.key),
  ).length;
  return checkedCount > 0 && checkedCount < app.menus.length;
};

const handleAppCheck = (app: BusinessApp, checked: boolean) => {
  if (checked) {
    checkedAppIds.value = [...new Set([app.id, ...checkedAppIds.value])];
    app.menus.forEach((m) => {
      if (!checkedAppMenuKeys.value.includes(m.key)) {
        checkedAppMenuKeys.value.push(m.key);
      }
    });
  } else {
    checkedAppIds.value = checkedAppIds.value.filter((id) => id !== app.id);
    checkedAppMenuKeys.value = checkedAppMenuKeys.value.filter(
      (k) => !app.menus.some((m) => m.key === k),
    );
  }
};

const handleAppMenuCheck = (menuKey: string, checked: boolean) => {
  if (checked) {
    if (!checkedAppMenuKeys.value.includes(menuKey)) {
      checkedAppMenuKeys.value.push(menuKey);
    }
  } else {
    checkedAppMenuKeys.value = checkedAppMenuKeys.value.filter(
      (k) => k !== menuKey,
    );
  }
  if (currentApp.value) {
    if (isAppAllChecked(currentApp.value)) {
      if (!checkedAppIds.value.includes(currentApp.value.id)) {
        checkedAppIds.value.push(currentApp.value.id);
      }
    } else {
      checkedAppIds.value = checkedAppIds.value.filter(
        (id) => id !== currentApp.value.id,
      );
    }
  }
};

const handleSelectApp = (app: BusinessApp) => {
  currentAppId.value = app.id;
};

// ---- 打开/关闭权限配置弹窗 ----
const openPermissionModal = (role: Role) => {
  permissionModal.currentRole = role;
  permissionModal.activeTab = 'admin-menu';
  checkedMenuKeys.value = [];
  checkedEmployeeIds.value = [];
  checkedEmployeeMenuKeys.value = [];
  currentEmployeeId.value = digitalEmployees[0]?.id || '';
  checkedAppIds.value = [];
  checkedAppMenuKeys.value = [];
  currentAppId.value = businessApps[0]?.id || '';
  permissionModal.visible = true;
};

const closePermissionModal = () => {
  permissionModal.visible = false;
  permissionModal.currentRole = null;
};

const savePermissionConfig = () => {
  message.success('权限配置保存成功');
  closePermissionModal();
};

loadRoles();
</script>

<template>
  <div class="h-full space-y-4 overflow-y-auto p-6">
    <!-- 查询表单 -->
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">角色名称</label>
          <Input
            v-model:value="searchForm.roleName"
            placeholder="请输入角色名称"
            class="flex-1"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">权限字符</label>
          <Input
            v-model:value="searchForm.permissionKey"
            placeholder="请输入权限字符"
            class="flex-1"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">状态</label>
          <Select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            class="flex-1"
            allow-clear
          >
            <Select.Option value="enabled">启用</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
        </div>
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">创建时间</label>
          <DatePicker.RangePicker
            v-model:value="searchForm.createTime"
            class="flex-1"
          />
        </div>
      </div>
      <div class="flex items-center justify-end gap-2">
        <Button @click="handleReset">重置</Button>
        <Button type="primary" @click="handleSearch">
          <Icon icon="lucide:search" class="mr-1 size-4" />
          查询
        </Button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="rounded-lg border bg-card shadow-sm">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h3 class="text-lg font-semibold">角色列表</h3>
        <Button type="primary" @click="handleAddRole">
          <Icon icon="lucide:plus" class="mr-1 size-4" />
          新增
        </Button>
      </div>

      <table class="w-full">
        <thead class="bg-muted/50">
          <tr>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              角色名称
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              权限字符
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              排序
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              状态
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              创建时间
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="role in roles"
            :key="role.id"
            class="border-b transition-colors hover:bg-muted/50"
          >
            <td class="px-4 py-3">
              <div class="font-medium">{{ role.name }}</div>
              <div class="text-xs text-muted-foreground">
                {{ role.description }}
              </div>
            </td>
            <td class="px-4 py-3">
              <Tag>{{ role.permissionKey }}</Tag>
            </td>
            <td class="px-4 py-3 text-sm">{{ role.sort }}</td>
            <td class="px-4 py-3">
              <Switch
                :checked="role.status === 'enabled'"
                @change="(checked) => handleStatusChange(checked, role.id)"
              />
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(role.createdAt) }}</td>
            <td class="px-4 py-3">
              <Space size="small">
                <Button type="link" size="small" @click="handleEditRole(role)">
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="openPermissionModal(role)"
                >
                  <Icon icon="lucide:shield-check" class="mr-1 size-3" />
                  权限配置
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="handleAssignUser(role)"
                >
                  <Icon icon="lucide:user-plus" class="mr-1 size-3" />
                  分配用户
                </Button>
                <Popconfirm
                  title="确定要删除这个角色吗？"
                  @confirm="() => handleDeleteRole(role.id)"
                >
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </Space>
            </td>
          </tr>
          <tr v-if="roles.length === 0">
            <td
              :colspan="6"
              class="px-4 py-8 text-center text-muted-foreground"
            >
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 调整说明卡片 -->
    <div class="rounded-lg border bg-card p-5 shadow-sm">
      <div class="mb-3 flex items-center gap-2">
        <Icon icon="lucide:file-text" class="size-5 text-primary" />
        <h3 class="text-base font-semibold">本次调整说明</h3>
      </div>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex items-start gap-2">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          ></span>
          <span>
            <span class="font-medium text-foreground">【编辑】</span>
            操作，调整为编辑角色基本信息。
          </span>
        </li>
        <li class="flex items-start gap-2">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          ></span>
          <span>
            去掉
            <span class="font-medium text-foreground">【权限】</span>
            操作及展示。
          </span>
        </li>
        <li class="flex items-start gap-2">
          <span
            class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          ></span>
          <span>
            <span class="font-medium text-foreground">【数字员工】</span>
            扩展为
            <span class="font-medium text-foreground">【权限配置】</span>
            操作按钮，包含后台菜单权限管理、数字员工菜单权限管理、应用权限管理。
          </span>
        </li>
      </ul>
    </div>

    <!-- 权限配置弹窗 -->
    <Modal
      v-model:open="permissionModal.visible"
      title="权限配置"
      :width="960"
      :footer="null"
      @cancel="closePermissionModal"
    >
      <div class="mb-3 text-sm text-muted-foreground">
        角色：{{ permissionModal.currentRole?.name }}
      </div>

      <Tabs v-model:active-key="permissionModal.activeTab">
        <!-- 后台管理菜单 -->
        <Tabs.TabPane key="admin-menu" tab="后台管理菜单">
          <div class="max-h-[520px] overflow-auto rounded-lg border p-4">
            <Tree
              v-model:checked-keys="checkedMenuKeys"
              checkable
              :field-names="{
                key: 'key',
                title: 'title',
                children: 'children',
              }"
              :tree-data="adminMenuTree"
            >
              <template #title="{ title, icon }">
                <span class="flex items-center gap-2">
                  <Icon v-if="icon" :icon="icon" class="size-4" />
                  <span>{{ title }}</span>
                </span>
              </template>
            </Tree>
          </div>
        </Tabs.TabPane>

        <!-- 数字员工权限 -->
        <Tabs.TabPane key="employee-perm" tab="数字员工权限">
          <div
            class="mb-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700"
          >
            <Icon icon="lucide:info" class="mt-0.5 size-4 shrink-0" />
            <span>
              备注：数字员工的对话权限与该数字员工是否启用聊天窗口有关，若未开启，勾选后也无权限进行对话。
            </span>
          </div>
          <div class="grid grid-cols-[300px_1fr] gap-4">
            <!-- 左侧：数字员工列表 -->
            <div class="rounded-lg border">
              <div class="border-b p-3">
                <Input
                  v-model:value="employeeSearchText"
                  placeholder="搜索数字员工"
                  size="small"
                >
                  <template #prefix>
                    <Icon icon="lucide:search" />
                  </template>
                </Input>
              </div>
              <div class="max-h-[440px] overflow-auto">
                <div
                  v-for="emp in filteredEmployees"
                  :key="emp.id"
                  class="flex cursor-pointer items-center gap-3 border-b px-3 py-3 transition-colors hover:bg-muted/50"
                  :class="{
                    'bg-blue-50': currentEmployeeId === emp.id,
                  }"
                  @click="handleSelectEmployee(emp)"
                >
                  <Checkbox
                    :checked="isEmployeeAllChecked(emp)"
                    :indeterminate="isEmployeeIndeterminate(emp)"
                    @click.stop
                    @change="
                      (e: { target: { checked: boolean } }) =>
                        handleEmployeeCheck(emp, e.target.checked)
                    "
                  />
                  <img
                    :src="emp.avatar"
                    :alt="emp.name"
                    class="h-10 w-10 rounded-full"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">
                      {{ emp.name }}
                    </div>
                    <div class="truncate text-xs text-muted-foreground">
                      {{ emp.description }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="filteredEmployees.length === 0"
                  class="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  暂无数据
                </div>
              </div>
            </div>

            <!-- 右侧：菜单列表 -->
            <div class="rounded-lg border">
              <div v-if="currentEmployee" class="border-b px-4 py-3">
                <div class="flex items-center gap-2">
                  <img
                    :src="currentEmployee.avatar"
                    class="h-8 w-8 rounded-full"
                  />
                  <span class="font-medium">
                    {{ currentEmployee.name }} · 菜单权限
                  </span>
                </div>
              </div>
              <div class="max-h-[440px] overflow-auto p-4">
                <div
                  v-for="menu in currentEmployeeMenus"
                  :key="menu"
                  class="mb-2 flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                  :class="{
                    'border-blue-300 bg-blue-50': menu === '对话',
                  }"
                >
                  <Checkbox
                    :checked="
                      checkedEmployeeMenuKeys.includes(
                        getMenuKey(currentEmployeeIdForMenu, menu),
                      )
                    "
                    @change="
                      (e: { target: { checked: boolean } }) =>
                        handleEmployeeMenuCheck(menu, e.target.checked)
                    "
                  />
                  <Icon
                    v-if="menu === '对话'"
                    icon="lucide:message-circle"
                    class="size-4 text-blue-500"
                  />
                  <Icon
                    v-else
                    icon="lucide:menu"
                    class="size-4 text-muted-foreground"
                  />
                  <span class="text-sm">{{ menu }}</span>
                  <Tag v-if="menu === '对话'" color="blue" class="ml-auto">
                    固定
                  </Tag>
                </div>
                <div
                  v-if="!currentEmployee"
                  class="py-12 text-center text-sm text-muted-foreground"
                >
                  请选择左侧的数字员工
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- 应用及菜单权限 -->
        <Tabs.TabPane key="app-perm" tab="应用及菜单权限">
          <div
            class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
          >
            <Icon icon="lucide:alert-triangle" class="mr-1 size-4" />
            管理应用及菜单权限范围，三方应用菜单权限由应用方自行控制，平台仅可配置应用入口。
          </div>
          <div class="grid grid-cols-[300px_1fr] gap-4">
            <!-- 左侧：应用列表 -->
            <div class="rounded-lg border">
              <div class="border-b p-3">
                <Input
                  v-model:value="appSearchText"
                  placeholder="搜索业务应用"
                  size="small"
                >
                  <template #prefix>
                    <Icon icon="lucide:search" />
                  </template>
                </Input>
              </div>
              <div class="max-h-[420px] overflow-auto">
                <div
                  v-for="app in filteredApps"
                  :key="app.id"
                  class="flex cursor-pointer items-center gap-3 border-b px-3 py-3 transition-colors hover:bg-muted/50"
                  :class="{ 'bg-blue-50': currentAppId === app.id }"
                  @click="handleSelectApp(app)"
                >
                  <Checkbox
                    :checked="isAppAllChecked(app)"
                    :indeterminate="isAppIndeterminate(app)"
                    @click.stop
                    @change="
                      (e: { target: { checked: boolean } }) =>
                        handleAppCheck(app, e.target.checked)
                    "
                  />
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    <Icon :icon="app.icon" class="size-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="truncate text-sm font-medium">
                        {{ app.name }}
                      </span>
                      <Tag v-if="app.tag" :color="app.tagColor" class="text-xs">
                        {{ app.tag }}
                      </Tag>
                    </div>
                    <div class="truncate text-xs text-muted-foreground">
                      {{ app.description }}
                    </div>
                  </div>
                </div>
                <div
                  v-if="filteredApps.length === 0"
                  class="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  暂无数据
                </div>
              </div>
            </div>

            <!-- 右侧：菜单权限列表 -->
            <div class="rounded-lg border">
              <div v-if="currentApp" class="border-b px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    <Icon :icon="currentApp.icon" class="size-4" />
                  </div>
                  <span class="font-medium">
                    {{ currentApp.name }} · 菜单权限
                  </span>
                </div>
              </div>
              <div class="max-h-[420px] overflow-auto p-4">
                <div
                  v-for="menu in currentApp?.menus"
                  :key="menu.key"
                  class="mb-2 flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    :checked="checkedAppMenuKeys.includes(menu.key)"
                    @change="
                      (e: { target: { checked: boolean } }) =>
                        handleAppMenuCheck(menu.key, e.target.checked)
                    "
                  />
                  <Icon
                    icon="lucide:menu"
                    class="size-4 text-muted-foreground"
                  />
                  <span class="text-sm">{{ menu.name }}</span>
                </div>
                <div
                  v-if="!currentApp"
                  class="py-12 text-center text-sm text-muted-foreground"
                >
                  请选择左侧的应用
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>

      <div class="mt-6 flex justify-end gap-2 border-t pt-4">
        <Button @click="closePermissionModal">取消</Button>
        <Button type="primary" @click="savePermissionConfig">保存配置</Button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
:deep(.ant-modal-body) {
  padding-top: 8px;
}
</style>
