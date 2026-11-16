<script setup lang="ts">
import { reactive, ref } from 'vue';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  RadioButton,
  RadioGroup,
} from 'ant-design-vue';

const emit = defineEmits<{
  create: [
    value: {
      code: string;
      description: string;
      name: string;
      uniqueKey: string;
    },
  ];
}>();
const open = defineModel<boolean>('open');
const mode = ref('标准模板');
const form = reactive({
  name: '设备',
  code: 'Device',
  uniqueKey: '设备编号',
  description: '统一设备身份、动态属性与业务变更历史',
});
const templates = [
  { name: '设备', code: 'Device', key: '设备编号', icon: '设备' },
  { name: '客户', code: 'Customer', key: '客户编号', icon: '客户' },
  { name: '供应商', code: 'Supplier', key: '供应商编号', icon: '供应商' },
  { name: '产品', code: 'Product', key: '产品编号', icon: '产品' },
];
function submit() {
  if (
    !form.name.trim() ||
    !form.uniqueKey.trim() ||
    !/^[A-Z]\w*$/i.test(form.code)
  ) {
    message.warning('请填写名称和业务唯一标识，实体标识须以英文字母开头');
    return;
  }
  emit('create', {
    ...form,
    name: form.name.trim(),
    uniqueKey: form.uniqueKey.trim(),
  });
}
</script>
<template>
  <Modal v-model:open="open" title="新建实体类型" :width="720" :footer="null">
    <p class="mb-5 text-gray-500">
      定义业务对象的模型与身份规则，具体来源字段将在数据映射中配置。
    </p>
    <RadioGroup v-model:value="mode" class="mb-5">
      <RadioButton value="标准模板">标准模板</RadioButton>
      <RadioButton value="自定义">自定义</RadioButton>
    </RadioGroup>
    <div v-if="mode === '标准模板'" class="mb-6 grid grid-cols-4 gap-3">
      <Button
        v-for="item in templates"
        :key="item.code"
        :type="form.code === item.code ? 'primary' : 'default'"
        class="!h-20"
        @click="
          Object.assign(form, {
            name: item.name,
            code: item.code,
            uniqueKey: item.key,
          })
        "
      >
        {{ item.name }}
        <br />
        {{ item.code }}
      </Button>
    </div>
    <Form layout="vertical">
      <div class="grid grid-cols-2 gap-4">
        <FormItem label="实体名称" required>
          <Input v-model:value="form.name" />
        </FormItem>
        <FormItem label="实体标识" required>
          <Input v-model:value="form.code" />
        </FormItem>
      </div>
      <FormItem label="业务说明">
        <Input.TextArea v-model:value="form.description" :rows="2" />
      </FormItem>
      <FormItem label="业务唯一标识" required>
        <Input v-model:value="form.uniqueKey" />
      </FormItem>
      <p class="rounded-lg bg-blue-50 p-3 text-blue-700">
        平台 Entity ID
        自动生成；业务唯一标识用于关联多个系统中的同一条实体记录。
      </p>
    </Form>
    <div class="mt-6 flex justify-end gap-3">
      <Button @click="open = false">取消</Button>
      <Button type="primary" @click="submit">创建并开始实施</Button>
    </div>
  </Modal>
</template>
