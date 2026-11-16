<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Select } from 'ant-design-vue';

interface HeaderData {
  company: string;
  budgetCategory: string;
  project: string;
  description: string;
  applicant: string;
  department: string;
  businessType: string;
  currency: string;
  contact: string;
}

const props = defineProps<{
  initialData: HeaderData;
}>();

const emit = defineEmits<{
  confirm: [data: HeaderData];
}>();

const submitting = ref(false);
const form = reactive<HeaderData>({ ...props.initialData });

const companies = [
  { label: '上海家化联合股份有限公司', value: '上海家化联合股份有限公司' },
  { label: '上海家化销售有限公司', value: '上海家化销售有限公司' },
];

const budgetCategories = [
  { label: '全年预算', value: '全年预算' },
  { label: '项目预算', value: '项目预算' },
];

const projects: Record<string, { label: string; value: string }[]> = {
  全年预算: [{ label: '（无需选择）', value: '' }],
  项目预算: [
    { label: '华东区客户拓展项目', value: '华东区客户拓展项目' },
    { label: '数字化创新部AI升级项目', value: '数字化创新部AI升级项目' },
    { label: '供应链优化项目', value: '供应链优化项目' },
  ],
};

const currentProjects = computed(() => {
  return projects[form.budgetCategory] || projects['全年预算'];
});

const businessTypes = [
  { label: '管理-国内差旅', value: '管理-国内差旅' },
  { label: '管理-国外差旅', value: '管理-国外差旅' },
  { label: '业务招待费', value: '业务招待费' },
  { label: '办公用品', value: '办公用品' },
  { label: '通讯费', value: '通讯费' },
];

const departments = [
  { label: '数字化创新部', value: '数字化创新部' },
  { label: '销售部-华东大区', value: '销售部-华东大区' },
  { label: '市场部-品牌推广', value: '市场部-品牌推广' },
  { label: '供应链管理部', value: '供应链管理部' },
  { label: '财务部-费用核算', value: '财务部-费用核算' },
  { label: '人力资源部', value: '人力资源部' },
  { label: '研发中心-产品开发', value: '研发中心-产品开发' },
  { label: '风控合规部', value: '风控合规部' },
];

const currencies = [
  { label: 'RMB_人民币', value: 'RMB_人民币' },
  { label: 'USD_美元', value: 'USD_美元' },
  { label: 'EUR_欧元', value: 'EUR_欧元' },
];

function handleConfirm() {
  if (!form.description.trim()) {
    message.warning('请填写事项描述');
    return;
  }
  submitting.value = true;
  emit('confirm', { ...form });
  message.success('单头信息已确认');
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-lg shadow-teal-100/30"
  >
    <div
      class="flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs text-white"
        >
          <Icon icon="lucide:file-text" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">
          3. 单据表头采集 (Header)
        </h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待确认
      </span>
    </div>

    <div class="space-y-3 p-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            公司名称
          </label>
          <Select v-model:value="form.company" class="!w-full">
            <Select.Option
              v-for="c in companies"
              :key="c.value"
              :value="c.value"
            >
              {{ c.label }}
            </Select.Option>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            申请人
          </label>
          <Input
            v-model:value="form.applicant"
            class="!text-sm"
            placeholder="申请人"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            部门
          </label>
          <Select
            v-model:value="form.department"
            class="!w-full"
            placeholder="请选择部门"
          >
            <Select.Option
              v-for="d in departments"
              :key="d.value"
              :value="d.value"
            >
              {{ d.label }}
            </Select.Option>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            联系方式
          </label>
          <Input
            v-model:value="form.contact"
            class="!text-sm"
            placeholder="手机号"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            预算类别
          </label>
          <Select v-model:value="form.budgetCategory" class="!w-full">
            <Select.Option
              v-for="b in budgetCategories"
              :key="b.value"
              :value="b.value"
            >
              {{ b.label }}
            </Select.Option>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            项目
          </label>
          <Select
            v-model:value="form.project"
            class="!w-full"
            :disabled="form.budgetCategory === '全年预算'"
          >
            <Select.Option
              v-for="p in currentProjects"
              :key="p.value"
              :value="p.value"
            >
              {{ p.label }}
            </Select.Option>
          </Select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            业务大类
          </label>
          <Select v-model:value="form.businessType" class="!w-full">
            <Select.Option
              v-for="b in businessTypes"
              :key="b.value"
              :value="b.value"
            >
              {{ b.label }}
            </Select.Option>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-slate-500">
            币种
          </label>
          <Select v-model:value="form.currency" class="!w-full">
            <Select.Option
              v-for="c in currencies"
              :key="c.value"
              :value="c.value"
            >
              {{ c.label }}
            </Select.Option>
          </Select>
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-500">
          事项描述
        </label>
        <Input.TextArea
          v-model:value="form.description"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          class="!text-sm"
          placeholder="请填写出差事由"
        />
      </div>

      <div class="flex justify-end">
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 text-sm font-bold hover:!bg-teal-700"
          :disabled="submitting"
          @click="handleConfirm"
        >
          <Icon icon="lucide:check" class="size-4" />
          确认，进入下一步
        </Button>
      </div>
    </div>
  </div>
</template>
