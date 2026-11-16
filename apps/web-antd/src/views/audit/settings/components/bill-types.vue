<script setup lang="ts">
import type { BillType, BillTypeTreeNode } from '#/types/settings';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Spin, Tree } from 'ant-design-vue';

import {
  deleteBillTypeApi,
  getBillTypeDetailApi,
  getBillTypesTreeApi,
} from '#/api/settings';

import BillTypeFormModal from '../modals/bill-type-form-modal.vue';
import BillTypeDetail from './bill-type-detail.vue';

const loading = ref(false);
const treeData = ref<BillTypeTreeNode[]>([]);
const selectedKeys = ref<string[]>([]);
const selectedBillType = ref<BillType | null>(null);
const detailLoading = ref(false);
const modalOpen = ref(false);
const editingBillType = ref<BillType | null>(null);

// 获取单据类型树
async function fetchTree() {
  loading.value = true;
  try {
    const response = await getBillTypesTreeApi();
    treeData.value = response.data || [];

    // 默认选中第一个单据类型
    if (treeData.value.length > 0) {
      const firstSystem = treeData.value[0];
      if (firstSystem.children && firstSystem.children.length > 0) {
        const firstBillType = firstSystem.children[0];
        selectedKeys.value = [firstBillType.key];
        await loadBillTypeDetail(firstBillType.billTypeId!);
      }
    }
  } catch (error) {
    message.error('获取单据类型列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 加载单据类型详情
async function loadBillTypeDetail(billTypeId: string) {
  detailLoading.value = true;
  try {
    const response = await getBillTypeDetailApi(billTypeId);
    selectedBillType.value = response.data;
  } catch (error) {
    message.error('获取单据类型详情失败');
    console.error(error);
  } finally {
    detailLoading.value = false;
  }
}

// 处理树节点选择
function handleSelect(keys: string[], info: any) {
  const node = info.node;

  // 只有单据类型节点可以选中
  if (node.type === 'billType') {
    selectedKeys.value = keys;
    if (node.billTypeId) {
      loadBillTypeDetail(node.billTypeId);
    }
  }
}

// 新增单据类型
function handleAdd() {
  editingBillType.value = null;
  modalOpen.value = true;
}

// 编辑单据类型
function handleEdit() {
  if (!selectedBillType.value) {
    message.warning('请先选择一个单据类型');
    return;
  }
  editingBillType.value = selectedBillType.value;
  modalOpen.value = true;
}

// 删除单据类型
async function handleDelete() {
  if (!selectedBillType.value) {
    message.warning('请先选择一个单据类型');
    return;
  }

  try {
    await deleteBillTypeApi(selectedBillType.value.id);
    message.success('删除成功');
    selectedBillType.value = null;
    selectedKeys.value = [];
    await fetchTree();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 保存成功回调
async function handleSaveSuccess() {
  modalOpen.value = false;
  await fetchTree();
  if (selectedBillType.value) {
    await loadBillTypeDetail(selectedBillType.value.id);
  }
}

onMounted(() => {
  fetchTree();
});
</script>

<template>
  <div class="flex h-full gap-4">
    <!-- 左侧树形结构 -->
    <div class="w-[280px] flex-shrink-0 rounded-lg border bg-card p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold">单据类型</h3>
        <Button type="text" size="small" @click="handleAdd">
          <Icon icon="lucide:plus" class="size-4" />
        </Button>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-10">
        <Spin size="small" />
      </div>

      <Tree
        v-else
        v-model:selected-keys="selectedKeys"
        :tree-data="treeData"
        :show-line="{ showLeafIcon: false }"
        :show-icon="true"
        class="bill-type-tree"
        @select="handleSelect"
      >
        <template #icon="{ type }">
          <Icon
            :icon="type === 'system' ? 'lucide:database' : 'lucide:file-text'"
            class="size-4"
          />
        </template>
      </Tree>
    </div>

    <!-- 右侧详情 -->
    <div class="flex-1 rounded-lg border bg-card">
      <div
        v-if="!selectedBillType"
        class="flex h-full items-center justify-center"
      >
        <div class="text-center">
          <Icon
            icon="lucide:file-text"
            class="mb-2 size-12 text-muted-foreground opacity-50"
          />
          <p class="text-sm text-muted-foreground">请选择一个单据类型</p>
        </div>
      </div>

      <div
        v-else-if="detailLoading"
        class="flex h-full items-center justify-center"
      >
        <Spin size="large" tip="加载中..." />
      </div>

      <BillTypeDetail
        v-else
        :bill-type="selectedBillType"
        @edit="handleEdit"
        @delete="handleDelete"
        @refresh="loadBillTypeDetail(selectedBillType.id)"
      />
    </div>

    <!-- 单据类型表单弹窗 -->
    <BillTypeFormModal
      v-model:open="modalOpen"
      :bill-type="editingBillType"
      @success="handleSaveSuccess"
    />
  </div>
</template>

<style scoped>
.bill-type-tree :deep(.ant-tree-node-content-wrapper) {
  @apply rounded-md px-2 py-1 transition-colors;
}

.bill-type-tree :deep(.ant-tree-node-content-wrapper:hover) {
  @apply bg-muted/60;
}

.bill-type-tree :deep(.ant-tree-node-selected .ant-tree-node-content-wrapper) {
  @apply bg-primary/10 text-primary;
}

.bill-type-tree :deep(.ant-tree-switcher) {
  @apply flex items-center justify-center;
}
</style>
