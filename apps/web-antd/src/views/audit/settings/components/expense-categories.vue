<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { ExpenseCategory } from '#/types/settings';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Popconfirm, Space, Table, Tag } from 'ant-design-vue';

import {
  deleteExpenseCategoryApi,
  getExpenseCategoriesApi,
} from '#/api/settings';

import CategoryFormModal from '../modals/category-form-modal.vue';

const loading = ref(false);
const categories = ref<ExpenseCategory[]>([]);
const modalOpen = ref(false);
const editingCategory = ref<ExpenseCategory | null>(null);

// 获取费用科目列表(扁平化为单级)
async function fetchCategories() {
  loading.value = true;
  try {
    const response = await getExpenseCategoriesApi();
    // 将树形数据扁平化为单级列表
    const flatCategories: ExpenseCategory[] = [];

    function flatten(items: ExpenseCategory[]) {
      for (const item of items) {
        const { children, ...rest } = item;
        flatCategories.push(rest as ExpenseCategory);
        if (children && children.length > 0) {
          flatten(children);
        }
      }
    }

    flatten(response.data || []);
    categories.value = flatCategories;
  } catch (error) {
    message.error('获取费用科目列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 新增科目
function handleAdd() {
  editingCategory.value = null;
  modalOpen.value = true;
}

// 编辑科目
function handleEdit(category: ExpenseCategory) {
  editingCategory.value = category;
  modalOpen.value = true;
}

// 删除科目
async function handleDelete(id: string) {
  try {
    await deleteExpenseCategoryApi(id);
    message.success('删除成功');
    await fetchCategories();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 保存成功回调
async function handleSaveSuccess() {
  modalOpen.value = false;
  await fetchCategories();
}

// 导出功能
function handleExport() {
  try {
    const data = categories.value.map((item) => ({
      科目编码: item.code,
      科目名称: item.name,
      所属系统: item.system || '',
      AI别名: item.aliases?.join(',') || '',
    }));

    // 转换为CSV
    const headers = Object.keys(data[0]);
    const csvContent = `${headers.join(',')}\n${data
      .map((row) => Object.values(row).join(','))
      .join('\n')}`;

    // 下载文件
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `费用科目_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error(error);
  }
}

// 导入功能
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx';
  input.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      message.info('导入功能开发中');
      // TODO: 实现CSV/Excel解析和导入
    }
  });
  input.click();
}

// 表格列定义
const columns: TableColumnsType<ExpenseCategory> = [
  {
    title: '科目编码',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '科目名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '所属系统',
    dataIndex: 'system',
    key: 'system',
    width: 150,
    customRender: ({ text }) => text || '-',
  },
  {
    title: 'AI别名',
    dataIndex: 'aliases',
    key: 'aliases',
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
  },
];

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">费用科目</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          管理费用科目和AI识别别名
        </p>
      </div>
      <Space>
        <Button @click="handleImport">
          <Icon icon="lucide:upload" class="mr-1 size-4" />
          导入
        </Button>
        <Button @click="handleExport">
          <Icon icon="lucide:download" class="mr-1 size-4" />
          导出
        </Button>
        <Button type="primary" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1 size-4" />
          新增科目
        </Button>
      </Space>
    </div>

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="categories"
      :loading="loading"
      :pagination="{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
      }"
      row-key="id"
      :scroll="{ x: 1000 }"
      bordered
    >
      <!-- 别名列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'aliases'">
          <Space v-if="record.aliases && record.aliases.length > 0" wrap>
            <Tag v-for="alias in record.aliases" :key="alias" color="blue">
              {{ alias }}
            </Tag>
          </Space>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button size="small" @click="handleEdit(record)">编辑</Button>
            <Popconfirm
              title="确定要删除此科目吗?"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record.id)"
            >
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 科目表单弹窗 -->
    <CategoryFormModal
      v-model:open="modalOpen"
      :category="editingCategory"
      @success="handleSaveSuccess"
    />
  </div>
</template>
