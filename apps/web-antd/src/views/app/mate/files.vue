<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
/* eslint-disable unicorn/no-await-expression-member */
import type { MateFile } from '#/types/mate';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Empty, Input, message, Select, Tag } from 'ant-design-vue';

import {
  createMateFileApi,
  deleteMateFileApi,
  getMateFilesApi,
} from '#/api/mate';

const files = ref<MateFile[]>([]);
const keyword = ref('');
const category = ref('all');
const dateRange = ref('all');
const loading = ref(true);
const categories = computed(() => [
  ...new Set(files.value.map((file) => file.category)),
]);
const filteredFiles = computed(() =>
  files.value.filter((file) => {
    const matchesKeyword = `${file.name}${file.owner}${file.category}`
      .toLowerCase()
      .includes(keyword.value.trim().toLowerCase());
    return (
      matchesKeyword &&
      (category.value === 'all' || file.category === category.value)
    );
  }),
);

async function loadFiles() {
  loading.value = true;
  files.value = (await getMateFilesApi()).data;
  loading.value = false;
}
async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const created = (
    await createMateFileApi({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    })
  ).data;
  files.value.unshift(created);
  message.success('文件已加入 Mock 资产库');
  target.value = '';
}
async function removeFile(file: MateFile) {
  await deleteMateFileApi(file.id);
  files.value = files.value.filter((item) => item.id !== file.id);
  message.success('文件已删除');
}
function previewFile(file: MateFile) {
  if (file.status !== 'ready') {
    message.warning('文件尚未就绪，暂不能预览');
    return;
  }
  message.info(`Demo 预览：${file.name}`);
}
function downloadFile(file: MateFile) {
  message.info(`Demo 下载：${file.name}`);
}

onMounted(loadFiles);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <div class="mate-page">
    <div class="mate-page-head">
      <div>
        <span class="mate-kicker">FILE ASSETS</span>
        <h1>文件资产</h1>
        <p>把工作资料集中到一个可检索、可协同的知识空间。</p>
      </div>
      <div class="files-head-actions">
        <label class="upload-button">
          <Icon icon="lucide:upload" />
          上传文件
          <input type="file" hidden @change="handleUpload" />
        </label>
        <Button type="default" @click="loadFiles">
          <Icon icon="lucide:refresh-cw" />
          刷新
        </Button>
      </div>
    </div>
    <div class="files-toolbar">
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="搜索文件名称、分类或上传人"
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </Input>
      <Select
        v-model:value="category"
        class="files-select"
        :options="[
          { label: '全部分类', value: 'all' },
          ...categories.map((item) => ({ label: item, value: item })),
        ]"
      />
      <Select
        v-model:value="dateRange"
        class="files-select"
        :options="[
          { label: '全部时间', value: 'all' },
          { label: '最近 7 天', value: '7d' },
          { label: '最近 30 天', value: '30d' },
        ]"
      />
    </div>
    <div class="files-summary">
      <span>
        共
        <b>{{ filteredFiles.length }}</b>
        个文件
      </span>
      <span>
        <i class="files-summary__dot"></i>
        数据仅保存在本次 Demo 会话
      </span>
    </div>
    <div v-if="!loading && filteredFiles.length > 0" class="file-list">
      <div v-for="file in filteredFiles" :key="file.id" class="file-row">
        <span class="file-row__icon"><Icon icon="lucide:file-text" /></span>
        <div class="file-row__main">
          <strong>{{ file.name }}</strong>
          <span>{{ file.category }} · {{ file.size }} · {{ file.owner }}</span>
        </div>
        <div class="file-row__updated">
          <span>{{ file.updatedAt }}</span>
          <Tag
            :color="
              file.status === 'ready'
                ? 'green'
                : file.status === 'processing'
                  ? 'blue'
                  : 'red'
            "
          >
            {{
              file.status === 'ready'
                ? '已就绪'
                : file.status === 'processing'
                  ? '处理中'
                  : '解析失败'
            }}
          </Tag>
        </div>
        <div class="file-row__actions">
          <Button
            type="text"
            size="small"
            title="预览"
            @click="previewFile(file)"
          >
            <Icon icon="lucide:eye" />
          </Button>
          <Button
            type="text"
            size="small"
            title="下载"
            @click="downloadFile(file)"
          >
            <Icon icon="lucide:download" />
          </Button>
          <Button
            type="text"
            danger
            size="small"
            title="删除"
            @click="removeFile(file)"
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>
      </div>
    </div>
    <Empty v-else-if="!loading" description="暂无匹配文件" />
    <div v-else class="files-loading">
      <Icon icon="lucide:loader-circle" />
      正在加载文件...
    </div>
  </div>
</template>

<style scoped>
.mate-page {
  max-width: 1420px;
  margin: 0 auto;
}

.mate-page-head {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}

.mate-kicker {
  font-size: 10px;
  font-weight: 800;
  color: #0c9177;
  letter-spacing: 0.14em;
}

.mate-page-head h1 {
  margin: 8px 0 4px;
  font-size: 27px;
  color: #143a30;
}

.mate-page-head p {
  margin: 0;
  font-size: 12px;
  color: #748e86;
}

.files-head-actions {
  display: flex;
  gap: 9px;
  align-items: center;
}

.upload-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  background: #0b766b;
  border: 1px solid #0b766b;
  border-radius: 7px;
}

.upload-button:hover {
  background: #095d55;
}

.files-toolbar {
  display: flex;
  gap: 10px;
  padding: 11px;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 12px;
}

.files-toolbar > .ant-input-affix-wrapper {
  max-width: 440px;
}

.files-select {
  width: 150px;
}

.files-summary {
  display: flex;
  justify-content: space-between;
  margin: 14px 3px 10px;
  font-size: 11px;
  color: #8a9f98;
}

.files-summary b {
  font-size: 14px;
  color: #0b806d;
}

.files-summary__dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  background: #25b787;
  border-radius: 50%;
}

.file-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 14px;
}

.file-row {
  display: flex;
  gap: 13px;
  align-items: center;
  min-height: 73px;
  padding: 11px 15px;
  border-bottom: 1px solid #edf3f0;
}

.file-row:last-child {
  border-bottom: 0;
}

.file-row:hover {
  background: #f8fcfa;
}

.file-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  font-size: 18px;
  color: #0b806d;
  background: #e6f2ee;
  border-radius: 11px;
}

.file-row__main {
  flex: 1;
  min-width: 0;
}

.file-row__main strong,
.file-row__main span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-row__main strong {
  font-size: 12px;
  color: #24483e;
}

.file-row__main span {
  margin-top: 5px;
  font-size: 10px;
  color: #8aa099;
}

.file-row__updated {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 155px;
  font-size: 10px;
  color: #8aa099;
}

.file-row__updated :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.file-row__actions {
  display: flex;
  gap: 2px;
}

.files-loading {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  font-size: 12px;
  color: #75918a;
}

@media (max-width: 750px) {
  .mate-page-head {
    align-items: flex-start;
  }

  .files-head-actions {
    flex: none;
  }

  .files-toolbar {
    flex-wrap: wrap;
  }

  .files-toolbar > .ant-input-affix-wrapper {
    flex: 1 1 100%;
    max-width: none;
  }

  .file-row__updated {
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
    width: auto;
  }

  .file-row__actions {
    flex: none;
  }

  .file-row__actions :deep(.ant-btn:nth-child(2)) {
    display: none;
  }
}
</style>
