<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { DatePicker, message, Table, Tag, Upload } from 'ant-design-vue';

import AiWorkPage from '../../ai-work/components/ai-work-page.vue';

const expensePeriod = ref<string>('');

const uploadedFiles = ref([
  {
    name: '2026年7月数据.xlsx',
    size: '128 KB',
    date: '2026-08-10',
    status: '已上传',
  },
]);
</script>

<template>
  <AiWorkPage
    eyebrow="DATA UPLOAD"
    title="数据上传"
    description="账扣核销单和请款单的数据采集"
  >
    <div class="upload-page">
      <!-- 费用期间选择 -->
      <section class="upload-section">
        <header>
          <Icon icon="lucide:calendar" />
          <span>
            <h3>选择费用期间</h3>
            <p>选择需要上传数据的账扣/请款月份</p>
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

      <!-- 上传区域 -->
      <section class="upload-section">
        <header>
          <Icon icon="lucide:file-up" />
          <span>
            <h3>上传数据文件</h3>
            <p>上传 Excel 数据文件，系统将异步处理并生成填报任务</p>
          </span>
        </header>
        <div class="upload-area">
          <Upload
            :multiple="true"
            :show-upload-list="false"
            :before-upload="
              (file: any) => {
                uploadedFiles.push({
                  name: file.name,
                  size: `${(file.size / 1024).toFixed(0)} KB`,
                  date: new Date().toISOString().slice(0, 10),
                  status: '已上传',
                });
                message.success(
                  '数据文件上传完成，数据文件处理任务已启动，请稍后在执行记录页面查看处理结果',
                );
                return false;
              }
            "
          >
            <div class="upload-dropzone">
              <Icon icon="lucide:cloud-upload" class="upload-icon" />
              <p class="upload-text">点击或拖拽文件到此区域上传</p>
              <p class="upload-hint">支持 Excel 格式</p>
            </div>
          </Upload>
        </div>
      </section>

      <!-- 已上传文件列表 -->
      <section class="upload-section">
        <header>
          <Icon icon="lucide:file-text" />
          <span>
            <h3>已上传文件（{{ uploadedFiles.length }}）</h3>
            <p>当前已上传的数据文件清单</p>
          </span>
        </header>
        <Table
          :data-source="uploadedFiles"
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

.upload-section header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.upload-section header svg {
  font-size: 20px;
  color: #0b806f;
}

.upload-section h3 {
  margin: 0;
  font-size: 14px;
  color: #173c34;
}

.upload-section p {
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

.upload-area {
  display: flex;
  justify-content: center;
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

.upload-table {
  margin-top: 4px;
}
</style>
