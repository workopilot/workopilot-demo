<script setup lang="ts">
import type { Policy } from '#/types/policy';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Tag,
} from 'ant-design-vue';

import { createPolicyApi, getPoliciesApi } from '#/api/policy';

const router = useRouter();
const policies = ref<Policy[]>([]);
const loading = ref(false);

// Create Modal State
const createModalVisible = ref(false);
const createFormRef = ref();
const createFormState = reactive<Partial<Policy> & { initMode: string }>({
  name: '',
  code: '',
  category: 'travel',
  initMode: 'manual', // manual | upload
});
const creating = ref(false);

const categoryIcons: Record<string, string> = {
  travel: 'lucide:plane',
  purchase: 'lucide:shopping-cart',
  finance: 'lucide:banknote',
  hr: 'lucide:users',
  other: 'lucide:file-text',
};

const categoryLabels: Record<string, string> = {
  travel: '差旅',
  purchase: '采购',
  finance: '财务',
  hr: '人事',
  other: '其他',
};

async function fetchPolicies() {
  loading.value = true;
  try {
    const res = await getPoliciesApi();
    policies.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleOpenCreate() {
  createFormState.name = '';
  createFormState.code = '';
  createFormState.category = 'travel';
  createFormState.initMode = 'manual';
  createModalVisible.value = true;
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate();
    creating.value = true;
    const res = await createPolicyApi(createFormState);
    message.success('创建成功');
    createModalVisible.value = false;

    // Determine target view based on initMode
    if (createFormState.initMode === 'upload') {
      router.push({
        name: 'PolicyWorkbench',
        params: { id: res.data.id },
        query: { tab: 'init' }, // We'll handle this in workbench
      });
    } else {
      router.push({
        name: 'PolicyWorkbench',
        params: { id: res.data.id },
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    creating.value = false;
  }
}

function handleCardClick(id: string) {
  router.push({
    name: 'PolicyWorkbench',
    params: { id },
  });
}

onMounted(() => {
  fetchPolicies();
});
</script>

<template>
  <Page title="制度库" description="集中管理企业各类审核依据与规章制度">
    <template #extra>
      <Button type="primary" @click="handleOpenCreate">
        <template #icon><Icon icon="lucide:plus" /></template>
        新建制度
      </Button>
    </template>

    <div class="p-4">
      <div
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <Card
          v-for="policy in policies"
          :key="policy.id"
          hoverable
          class="cursor-pointer transition-shadow hover:shadow-md"
          @click="handleCardClick(policy.id)"
        >
          <div class="mb-4 flex items-start justify-between">
            <div
              class="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
            >
              <Icon
                :icon="categoryIcons[policy.category] || 'lucide:file-text'"
                class="size-6"
              />
            </div>
            <Tag :color="policy.status === 'active' ? 'green' : 'default'">
              {{ policy.status === 'active' ? '启用中' : '已停用' }}
            </Tag>
          </div>

          <h3 class="mb-2 line-clamp-2 min-h-[3rem] text-lg font-bold">
            {{ policy.name }}
          </h3>

          <div class="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <Tag>{{ categoryLabels[policy.category] }}</Tag>
            <Tag color="blue">{{ policy.version }}</Tag>
          </div>

          <div class="text-xs text-gray-400">
            <div class="line-clamp-2 min-h-[2.5em]">
              {{ policy.description }}
            </div>
            <div class="mt-2 flex items-center gap-1">
              <Icon icon="lucide:calendar" class="size-3" />
              {{ policy.updatedAt }}
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Create Modal -->
    <Modal
      v-model:open="createModalVisible"
      title="新建制度"
      @ok="handleCreate"
      :confirm-loading="creating"
    >
      <Form
        ref="createFormRef"
        :model="createFormState"
        layout="vertical"
        class="mt-4"
      >
        <Form.Item
          label="制度名称"
          name="name"
          :rules="[{ required: true, message: '请输入制度名称' }]"
        >
          <Input
            v-model:value="createFormState.name"
            placeholder="如：集团差旅管理规定"
          />
        </Form.Item>
        <Form.Item
          label="制度编码"
          name="code"
          :rules="[{ required: true, message: '请输入制度编码' }]"
        >
          <Input
            v-model:value="createFormState.code"
            placeholder="如：POL_TRAVEL_001"
          />
        </Form.Item>
        <Form.Item label="分类" name="category" required>
          <Select v-model:value="createFormState.category">
            <Select.Option value="travel">差旅</Select.Option>
            <Select.Option value="purchase">采购</Select.Option>
            <Select.Option value="finance">财务</Select.Option>
            <Select.Option value="hr">人事</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="初始化方式" name="initMode" required>
          <Radio.Group v-model:value="createFormState.initMode">
            <Radio value="manual">手动录入</Radio>
            <Radio value="upload">文件上传</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
