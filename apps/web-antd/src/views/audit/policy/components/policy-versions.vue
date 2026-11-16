<script setup lang="ts">
import type { PolicyRelease } from '#/types/policy';

import { onMounted, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Tag,
  Timeline,
} from 'ant-design-vue';

import { createPolicyReleaseApi, getPolicyReleasesApi } from '#/api/policy';

const props = defineProps<{
  policyId: string;
}>();

const loading = ref(false);
const releases = ref<PolicyRelease[]>([]);
const modalVisible = ref(false);
const submitting = ref(false);

const formState = reactive({
  version: '',
  title: '',
  content: '',
});

const formRef = ref();

const rules = {
  version: [{ required: true, message: '请输入版本号' }],
  title: [{ required: true, message: '请输入版本名称' }],
  content: [{ required: true, message: '请输入更新内容' }],
};

async function fetchReleases() {
  if (!props.policyId) return;
  loading.value = true;
  try {
    const res = await getPolicyReleasesApi(props.policyId);
    releases.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handlePublish() {
  // Suggest next version based on latest
  let nextVersion = 'V1.0';
  if (releases.value.length > 0) {
    const lastVersion = releases.value[0].version;
    // Simple logic to increment version, can be improved
    const parts = lastVersion.replace('V', '').split('.');
    if (parts.length === 2) {
      const minor = Number.parseInt(parts[1]) + 1;
      nextVersion = `V${parts[0]}.${minor}`;
    }
  }

  formState.version = nextVersion;
  formState.title = '';
  formState.content = '';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    submitting.value = true;
    await createPolicyReleaseApi({
      policyId: props.policyId,
      ...formState,
    });
    message.success('发布成功');
    modalVisible.value = false;
    fetchReleases();
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.policyId,
  (val) => {
    if (val) fetchReleases();
  },
  { immediate: true },
);

onMounted(() => {
  fetchReleases();
});
</script>

<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-800">版本管理</h2>
      <Button type="primary" @click="handlePublish">
        <template #icon>
          <Icon icon="lucide:send" />
        </template>
        发布新版本
      </Button>
    </div>

    <div class="flex-1 overflow-y-auto pr-4">
      <Timeline mode="left">
        <Timeline.Item
          v-for="release in releases"
          :key="release.id"
          color="blue"
        >
          <template #dot>
            <div
              class="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-500"
            >
              <Icon icon="lucide:git-commit" class="size-4" />
            </div>
          </template>
          <div class="mb-8 ml-2 rounded-lg border bg-white p-4 shadow-sm">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Tag color="blue" class="text-base font-bold">
                  {{ release.version }}
                </Tag>
                <span class="text-lg font-bold text-gray-800">
                  {{ release.title }}
                </span>
              </div>
              <div class="text-xs text-gray-400">
                {{ release.publishDate }}
              </div>
            </div>

            <div class="mb-3 whitespace-pre-wrap text-sm text-gray-600">
              {{ release.content }}
            </div>

            <div class="flex items-center gap-2 text-xs text-gray-400">
              <Icon icon="lucide:user" class="size-3" />
              <span>发布人: {{ release.publisher }}</span>
            </div>
          </div>
        </Timeline.Item>
      </Timeline>
    </div>

    <Modal
      v-model:open="modalVisible"
      title="发布新版本"
      :confirm-loading="submitting"
      @ok="handleSubmit"
    >
      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        class="mt-4"
      >
        <Form.Item label="版本号" name="version">
          <Input v-model:value="formState.version" placeholder="如 V1.0" />
        </Form.Item>
        <Form.Item label="版本名称" name="title">
          <Input
            v-model:value="formState.title"
            placeholder="如 2025年度第一次修订"
          />
        </Form.Item>
        <Form.Item label="更新内容" name="content">
          <Input.TextArea
            v-model:value="formState.content"
            :rows="4"
            placeholder="请输入本次更新的主要内容..."
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
