<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tree,
} from 'ant-design-vue';

// ==================== 类型定义 ====================

interface Package {
  id: string;
  name: string;
  code: string;
  description: string;
  menuPermissions: string[];
  status: 'disabled' | 'enabled';
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MenuTreeNode {
  title: string;
  key: string;
  icon?: string;
  children?: MenuTreeNode[];
}

// ==================== Mock 数据 ====================

// 完整的菜单树结构
const menuTreeData: MenuTreeNode[] = [
  {
    title: '概览',
    key: 'overview',
    icon: 'lucide:layout-dashboard',
    children: [
      { title: '系统首页', key: 'dashboard-home', icon: 'lucide:home' },
      {
        title: '数据分析',
        key: 'dashboard-analytics',
        icon: 'lucide:bar-chart-3',
      },
    ],
  },
  {
    title: '审核管理',
    key: 'audit',
    icon: 'lucide:shield-check',
    children: [
      { title: '基础设置', key: 'audit-settings', icon: 'lucide:settings' },
      { title: '工具和数据源', key: 'audit-tools', icon: 'lucide:database' },
      { title: '规则配置', key: 'audit-rules', icon: 'lucide:scale' },
      { title: '审核方案', key: 'audit-schemes', icon: 'lucide:file-check-2' },
    ],
  },
  {
    title: '运营平台',
    key: 'platform',
    icon: 'lucide:settings-2',
    children: [
      {
        title: '模型管理',
        key: 'platform-model-management',
        icon: 'lucide:cpu',
      },
      { title: '产品服务', key: 'platform-products', icon: 'lucide:package' },
      {
        title: '租户套餐管理',
        key: 'platform-package-management',
        icon: 'lucide:layers',
      },
      {
        title: '租户管理',
        key: 'platform-tenant-management',
        icon: 'lucide:users',
      },
      {
        title: '租户订阅',
        key: 'platform-subscriptions',
        icon: 'lucide:user-check',
      },
      {
        title: '系统配置',
        key: 'platform-system-config',
        icon: 'lucide:settings',
      },
      {
        title: '自动化与集成',
        key: 'platform-automation',
        icon: 'lucide:workflow',
      },
      {
        title: '数据分析',
        key: 'platform-data-analysis',
        icon: 'lucide:pie-chart',
      },
      {
        title: '用量与计费',
        key: 'platform-billing',
        icon: 'lucide:credit-card',
      },
      { title: '用量监控', key: 'platform-usage', icon: 'lucide:activity' },
      {
        title: '服务调用日志',
        key: 'platform-service-logs',
        icon: 'lucide:file-text',
      },
      {
        title: '模型调用日志',
        key: 'platform-model-logs',
        icon: 'lucide:scroll-text',
      },
    ],
  },
];

const mockPackages: Package[] = [
  {
    id: '1',
    name: '基础版',
    code: 'basic',
    description: '适合小型企业的基础功能套餐，包含核心审核功能',
    menuPermissions: [
      'dashboard-home',
      'audit-settings',
      'audit-tools',
      'audit-rules',
    ],
    status: 'enabled',
    tenantCount: 5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: '标准版',
    code: 'standard',
    description: '适合中型企业的标准功能套餐，包含完整审核和基础运营功能',
    menuPermissions: [
      'dashboard-home',
      'dashboard-analytics',
      'audit-settings',
      'audit-tools',
      'audit-rules',
      'audit-schemes',
      'platform-model-management',
      'platform-products',
      'platform-tenant-management',
      'platform-subscriptions',
    ],
    status: 'enabled',
    tenantCount: 12,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
  },
  {
    id: '3',
    name: '企业版',
    code: 'enterprise',
    description: '适合大型企业的全功能套餐，包含所有功能模块',
    menuPermissions: [
      // 概览
      'dashboard-home',
      'dashboard-analytics',
      // 审核管理
      'audit-settings',
      'audit-tools',
      'audit-rules',
      'audit-schemes',
      // 运营平台
      'platform-model-management',
      'platform-products',
      'platform-package-management',
      'platform-tenant-management',
      'platform-subscriptions',
      'platform-system-config',
      'platform-automation',
      'platform-data-analysis',
      'platform-billing',
      'platform-usage',
      'platform-service-logs',
      'platform-model-logs',
    ],
    status: 'enabled',
    tenantCount: 8,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-03-10T09:15:00Z',
  },
];

// ==================== 状态管理 ====================

const packages = ref<Package[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const editingPackage = ref<null | Package>(null);
const formRef = ref();

const formState = ref({
  name: '',
  code: '',
  description: '',
  menuPermissions: [] as string[],
  status: 'enabled' as 'disabled' | 'enabled',
});

// ==================== 计算属性 ====================

const allMenuKeys = computed(() => {
  const keys: string[] = [];
  const traverse = (nodes: MenuTreeNode[]) => {
    nodes.forEach((node) => {
      if (node.children) {
        traverse(node.children);
      } else {
        keys.push(node.key);
      }
    });
  };
  traverse(menuTreeData);
  return keys;
});

// 菜单树的统计信息
const menuStats = computed(() => {
  let totalMenus = 0;
  let totalModules = 0;

  const traverse = (nodes: MenuTreeNode[]) => {
    nodes.forEach((node) => {
      if (node.children) {
        totalModules++;
        traverse(node.children);
      } else {
        totalMenus++;
      }
    });
  };

  traverse(menuTreeData);

  return { totalMenus, totalModules };
});

// ==================== 表格列定义 ====================

const columns = [
  {
    title: '套餐名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '套餐代码',
    dataIndex: 'code',
    key: 'code',
    width: 140,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '菜单权限',
    key: 'menuCount',
    width: 120,
    align: 'center' as const,
  },
  {
    title: '租户数',
    dataIndex: 'tenantCount',
    key: 'tenantCount',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    align: 'center' as const,
  },
];

// ==================== 数据加载 ====================

async function loadPackages() {
  loading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    packages.value = mockPackages;
  } catch {
    message.error('加载套餐列表失败');
  } finally {
    loading.value = false;
  }
}

// ==================== 套餐操作 ====================

function handleAdd() {
  editingPackage.value = null;
  formState.value = {
    name: '',
    code: '',
    description: '',
    menuPermissions: [],
    status: 'enabled',
  };
  modalVisible.value = true;
}

function handleEdit(record: Package) {
  editingPackage.value = record;
  formState.value = {
    name: record.name,
    code: record.code,
    description: record.description,
    menuPermissions: [...record.menuPermissions],
    status: record.status,
  };
  modalVisible.value = true;
}

function handleDelete(record: Package) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除套餐 "${record.name}" 吗？该套餐下还有 ${record.tenantCount} 个租户，删除后将影响这些租户的权限。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      const index = packages.value.findIndex((p) => p.id === record.id);
      if (index !== -1) {
        packages.value.splice(index, 1);
        message.success('删除成功');
      }
    },
  });
}

function handleViewMenus(record: Package) {
  const menus = getMenusByKeys(record.menuPermissions);

  Modal.info({
    title: `${record.name} - 菜单权限`,
    width: 600,
    content: h('div', { class: 'max-h-[400px] overflow-y-auto' }, [
      h('div', { class: 'mb-4' }, [
        h('div', { class: 'mb-2 flex items-center gap-4' }, [
          h('span', { class: 'text-sm text-gray-600' }, `套餐代码：`),
          h(Tag, { color: 'blue' }, record.code),
          h('span', { class: 'text-sm text-gray-600 ml-4' }, `权限数量：`),
          h(
            Tag,
            { color: 'green' },
            `${record.menuPermissions.length} / ${allMenuKeys.value.length}`,
          ),
          h('span', { class: 'text-sm text-gray-600 ml-4' }, `关联租户：`),
          h(Tag, { color: 'orange' }, `${record.tenantCount} 个租户`),
        ]),
      ]),
      h('div', { class: 'border-t pt-3' }, [
        h('div', { class: 'mb-3 font-semibold text-gray-700' }, '已授权菜单：'),
        h(
          'div',
          { class: 'flex flex-wrap gap-2' },
          menus.map((menu) =>
            h(
              Tag,
              { key: menu.key, color: 'blue', class: 'mb-1' },
              `${menu.module} / ${menu.title}`,
            ),
          ),
        ),
      ]),
    ]),
  });
}

function handleSubmit() {
  formRef.value?.validate().then(() => {
    if (formState.value.menuPermissions.length === 0) {
      message.warning('请至少选择一个菜单权限');
      return;
    }

    if (editingPackage.value) {
      // 编辑
      const index = packages.value.findIndex(
        (p) => p.id === editingPackage.value!.id,
      );
      if (index !== -1) {
        packages.value[index] = {
          ...packages.value[index],
          ...formState.value,
          updatedAt: new Date().toISOString(),
        };
      }
      message.success('更新成功');
    } else {
      // 新增
      const newPackage: Package = {
        id: String(Date.now()),
        ...formState.value,
        tenantCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      packages.value.push(newPackage);
      message.success('添加成功');
    }
    modalVisible.value = false;
  });
}

function handleCancel() {
  modalVisible.value = false;
  formRef.value?.resetFields();
}

// 全选/取消全选菜单
function handleSelectAllMenus() {
  formState.value.menuPermissions = [...allMenuKeys.value];
}

function handleDeselectAllMenus() {
  formState.value.menuPermissions = [];
}

// ==================== 辅助函数 ====================

// 根据选中的key获取菜单信息
function getMenusByKeys(keys: string[]) {
  const menus: { key: string; module: string; title: string }[] = [];

  const traverse = (nodes: MenuTreeNode[], moduleName: string) => {
    nodes.forEach((node) => {
      if (node.children) {
        traverse(node.children, node.title);
      } else if (keys.includes(node.key)) {
        menus.push({
          key: node.key,
          title: node.title,
          module: moduleName,
        });
      }
    });
  };

  menuTreeData.forEach((node) => {
    if (node.children) {
      traverse(node.children, node.title);
    }
  });

  return menus;
}

onMounted(() => {
  loadPackages();
});
</script>

<template>
  <div class="p-4">
    <Card title="租户套餐管理" :bordered="false">
      <template #title>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:layers" class="size-5 text-primary" />
          <span>租户套餐管理</span>
        </div>
      </template>

      <template #extra>
        <div class="flex items-center gap-3">
          <div class="text-sm text-gray-500">
            共 {{ menuStats.totalModules }} 个模块，{{ menuStats.totalMenus }}
            个菜单
          </div>
          <Button type="primary" @click="handleAdd">
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            添加套餐
          </Button>
        </div>
      </template>

      <Table
        :columns="columns"
        :data-source="packages"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'menuCount'">
            <div class="flex items-center justify-center gap-1">
              <Tag color="blue">
                {{ record.menuPermissions.length }} / {{ allMenuKeys.length }}
              </Tag>
              <Button
                type="link"
                size="small"
                class="!p-0"
                @click="handleViewMenus(record)"
              >
                查看详情
              </Button>
            </div>
          </template>

          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'enabled' ? 'success' : 'default'">
              {{ record.status === 'enabled' ? '已启用' : '已禁用' }}
            </Tag>
          </template>

          <template v-if="column.key === 'action'">
            <Space size="small">
              <Button type="link" size="small" @click="handleEdit(record)">
                <Icon icon="lucide:edit-2" class="size-3" />
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
              >
                <Icon icon="lucide:trash-2" class="size-3" />
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div v-if="packages.length === 0 && !loading" class="py-16">
        <Empty description="暂无套餐数据，请点击右上角添加套餐" />
      </div>
    </Card>

    <!-- 新增/编辑弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="editingPackage ? '编辑套餐' : '添加套餐'"
      width="700px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <Form
        ref="formRef"
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
      >
        <Form.Item
          label="套餐名称"
          name="name"
          required
          :rules="[{ required: true, message: '请输入套餐名称' }]"
        >
          <Input
            v-model:value="formState.name"
            placeholder="例如：基础版、标准版、企业版"
          />
        </Form.Item>

        <Form.Item
          label="套餐代码"
          name="code"
          required
          :rules="[
            { required: true, message: '请输入套餐代码' },
            {
              pattern: /^[a-z0-9-]+$/,
              message: '只能包含小写字母、数字和横线',
            },
          ]"
        >
          <Input
            v-model:value="formState.code"
            placeholder="例如：basic、standard、enterprise"
          />
        </Form.Item>

        <Form.Item label="套餐描述" name="description">
          <Input.TextArea
            v-model:value="formState.description"
            :rows="2"
            placeholder="请输入套餐描述，说明该套餐的适用场景"
          />
        </Form.Item>

        <Form.Item label="状态" name="status" required>
          <Select v-model:value="formState.status">
            <Select.Option value="enabled">启用</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="菜单权限" required>
          <div class="rounded-lg border border-gray-200 p-3">
            <div class="mb-3 flex items-center justify-between border-b pb-2">
              <div>
                <div class="text-sm font-medium text-gray-700">
                  已选择 {{ formState.menuPermissions.length }} /
                  {{ allMenuKeys.length }} 个菜单
                </div>
                <div class="text-xs text-gray-500">
                  请勾选该套餐可访问的功能模块和菜单
                </div>
              </div>
              <Space>
                <Button size="small" @click="handleSelectAllMenus">
                  全选
                </Button>
                <Button size="small" @click="handleDeselectAllMenus">
                  清空
                </Button>
              </Space>
            </div>

            <div
              class="max-h-[300px] overflow-y-auto rounded-md bg-gray-50 p-2"
            >
              <Tree
                v-model:checked-keys="formState.menuPermissions"
                checkable
                :tree-data="menuTreeData"
                :default-expand-all="true"
                :show-line="true"
                class="bg-transparent"
              >
                <template #title="{ title }">
                  <span class="text-sm">{{ title }}</span>
                </template>
              </Tree>

              <div
                v-if="formState.menuPermissions.length === 0"
                class="flex h-32 items-center justify-center text-sm text-gray-400"
              >
                请选择菜单权限
              </div>
            </div>

            <div
              v-if="formState.menuPermissions.length > 0"
              class="mt-3 border-t pt-2"
            >
              <div class="mb-2 text-xs font-medium text-gray-600">
                已选菜单：
              </div>
              <div class="flex max-h-[100px] flex-wrap gap-2 overflow-y-auto">
                <Tag
                  v-for="menu in getMenusByKeys(formState.menuPermissions)"
                  :key="menu.key"
                  closable
                  @close="
                    formState.menuPermissions =
                      formState.menuPermissions.filter((k) => k !== menu.key)
                  "
                >
                  {{ menu.module }} / {{ menu.title }}
                </Tag>
              </div>
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
