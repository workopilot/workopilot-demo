<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Modal, Select } from 'ant-design-vue';

const props = defineProps<{
  autoHtml?: boolean;
  open: boolean;
  reportKind: '日报' | '周报';
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  submitted: [approverIds: string[]];
}>();

const approverOptions = [
  { label: '李建国（产品研发部）', value: 'li-jianguo' },
  { label: '王天豪（研发部）', value: 'wang-tianhao' },
  { label: '周小曼（交付部）', value: 'zhou-xiaoman' },
  { label: '赵琳（销售部）', value: 'zhao-lin' },
];
const selectedIds = ref<string[]>(['li-jianguo']);
const submitting = ref(false);
const internalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

watch(
  () => props.open,
  (open) => {
    if (open) selectedIds.value = ['li-jianguo'];
  },
);

function handleSubmit() {
  if (!selectedIds.value.length) {
    message.warning('请选择至少一位审阅人');
    return;
  }
  submitting.value = true;
  window.setTimeout(() => {
    submitting.value = false;
    internalOpen.value = false;
    emit('submitted', [...selectedIds.value]);
    message.success(
      props.autoHtml
        ? `${props.reportKind}已提交，系统将自动生成 HTML 版本`
        : `${props.reportKind}已提交，等待审阅`,
    );
  }, 320);
}
</script>

<template>
  <Modal v-model:open="internalOpen" :title="`提交${reportKind}`" :footer="null" destroy-on-close>
    <div class="submit-panel">
      <p class="submit-hint">
        {{ autoHtml ? '当前还没有 HTML，确认后会先生成 HTML，再进入审阅流程。' : '提交后审阅人可以查看报告并给出评分和意见。' }}
      </p>
      <label>提交给谁</label>
      <Select
        v-model:value="selectedIds"
        mode="multiple"
        show-search
        :options="approverOptions"
        placeholder="选择审阅人"
        :filter-option="(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())"
      />
      <small>已默认带出直属领导，可自行增减。</small>
      <div class="submit-actions">
        <Button @click="internalOpen = false">取消</Button>
        <Button type="primary" :loading="submitting" @click="handleSubmit">
          <Icon v-if="!submitting" icon="lucide:send" />
          {{ submitting ? '提交中…' : '确认提交' }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.submit-panel { display: grid; gap: 10px; }
.submit-hint { padding: 10px 12px; margin: 0; color: #17483d; background: #eaf3f0; border-radius: 8px; line-height: 1.6; }
.submit-panel > label { font-weight: 600; color: #17483d; }
.submit-panel > small { color: #71867f; }
.submit-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 6px; }
</style>
