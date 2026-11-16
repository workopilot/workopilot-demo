<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  DatePicker,
  message,
  Table,
  TabPane,
  Tabs,
  Tag,
  Upload,
} from 'ant-design-vue';

import AiWorkPage from '../../ai-work/components/ai-work-page.vue';

const expensePeriod = ref<string>('');
const activeTab = ref<'attachment' | 'batch' | 'invoice'>('batch');

interface UploadedFile {
  name: string;
  size: string;
  date: string;
  status: string;
  category: '发票' | '批量上传' | '附件';
}

const uploadedFiles = ref<UploadedFile[]>([
  {
    name: '2026年7月发票附件.zip',
    size: '2.1 MB',
    date: '2026-08-10',
    status: '已上传',
    category: '批量上传',
  },
  {
    name: '供应商发票凭证-汇总.pdf',
    size: '1.2 MB',
    date: '2026-08-12',
    status: '已上传',
    category: '发票',
  },
  {
    name: '发票清单截图.jpg',
    size: '5.4 MB',
    date: '2026-08-12',
    status: '已上传',
    category: '附件',
  },
]);

const categoryMap = {
  batch: '批量上传' as const,
  invoice: '发票' as const,
  attachment: '附件' as const,
};

const tabMeta = [
  {
    key: 'batch' as const,
    title: '批量上传发票和附件',
    icon: 'lucide:archive',
    desc: '上传zip格式的压缩文件',
    hint: '仅支持 .zip 格式',
  },
  {
    key: 'invoice' as const,
    title: '补充发票',
    icon: 'lucide:receipt',
    desc: '批量上传后补充发票',
    hint: '支持 PDF / OFD',
  },
  {
    key: 'attachment' as const,
    title: '补充附件',
    icon: 'lucide:paperclip',
    desc: '批量上传后补充附件',
    hint: '支持 PDF / 图片',
  },
];

const currentFiles = computed(() =>
  uploadedFiles.value.filter(
    (f) => f.category === categoryMap[activeTab.value],
  ),
);

function handleUpload(file: File) {
  uploadedFiles.value.push({
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    date: new Date().toISOString().slice(0, 10),
    status: '已上传',
    category: categoryMap[activeTab.value],
  });
  message.success(
    '文件上传完成，发票附件处理任务已启动，请稍后在发票附件上传记录页面查看处理结果',
  );
  return false;
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="INVOICE UPLOAD"
    title="发票附件上传"
    description="批量上传账扣核销单与请款单的发票和附件"
  >
    <div class="upload-page">
      <!-- 费用期间选择 -->
      <section class="upload-section">
        <header>
          <Icon icon="lucide:calendar" />
          <span>
            <h3>选择费用期间</h3>
            <p>选择需要上传发票和附件的账扣/请款月份</p>
          </span>
        </header>
        <div class="period-selector">
          <DatePicker
            v-model:value="expensePeriod"
            picker="month"
            placeholder="选择费用期间"
            style="width: 240px"
          />
        </div>
      </section>

      <!-- 三个 Tab 页 -->
      <section class="upload-section">
        <Tabs v-model:active-key="activeTab">
          <TabPane v-for="tab in tabMeta" :key="tab.key">
            <template #tab>
              <span class="tab-title">
                <Icon :icon="tab.icon" />
                {{ tab.title }}
              </span>
            </template>
            <div class="tab-content">
              <div class="tab-header">
                <span>
                  <h4>{{ tab.title }}</h4>
                  <p>{{ tab.desc }}</p>
                </span>
              </div>
              <Upload
                :multiple="true"
                :show-upload-list="false"
                :before-upload="(file: any) => handleUpload(file)"
              >
                <div class="upload-dropzone">
                  <Icon icon="lucide:cloud-upload" class="upload-icon" />
                  <p class="upload-text">点击或拖拽文件到此区域上传</p>
                  <p class="upload-hint">{{ tab.hint }}</p>
                </div>
              </Upload>
              <div class="tab-files">
                <div class="tab-files-header">
                  <h4>已上传文件（{{ currentFiles.length }}）</h4>
                </div>
                <Table
                  :data-source="currentFiles"
                  :pagination="{ pageSize: 10 }"
                  row-key="name"
                  class="upload-table"
                >
                  <Table.Column title="文件名称" data-index="name" />
                  <Table.Column title="大小" data-index="size" />
                  <Table.Column title="上传日期" data-index="date" />
                  <Table.Column title="状态">
                    <template #default="{ record }">
                      <Tag color="green">{{ record.status }}</Tag>
                    </template>
                  </Table.Column>
                </Table>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.upload-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.upload-section {
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.upload-section > header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.upload-section > header svg {
  font-size: 20px;
  color: #0b806f;
}

.upload-section h3 {
  margin: 0;
  font-size: 14px;
  color: #173c34;
}

.upload-section > header p {
  margin: 3px 0 0;
  font-size: 10px;
  color: #7a8b85;
}

.period-selector {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: #f7faf9;
  border: 1px solid #e2ebe8;
  border-radius: 12px;
}

.period-hint {
  font-size: 11px;
  color: #71867f;
}

.tab-title {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 4px;
}

.tab-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tab-header h4 {
  margin: 0;
  font-size: 13px;
  color: #173c34;
}

.tab-header p {
  margin: 3px 0 0;
  font-size: 10px;
  color: #7a8b85;
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 36px 20px;
  cursor: pointer;
  background: #f7faf9;
  border: 2px dashed #c9ded7;
  border-radius: 16px;
  transition: all 0.2s;
}

.upload-dropzone:hover {
  background: #edf6f3;
  border-color: #0b806f;
}

.upload-icon {
  font-size: 36px;
  color: #0b806f;
}

.upload-text {
  margin: 0;
  font-size: 13px;
  color: #2a4d44;
}

.upload-hint {
  margin: 0;
  font-size: 11px;
  color: #7a8b85;
}

.tab-files-header {
  margin-bottom: 8px;
}

.tab-files-header h4 {
  margin: 0;
  font-size: 13px;
  color: #173c34;
}

.upload-table {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2ebe8;
  border-radius: 12px;
}
</style>
