<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type {
  AttachmentGroup,
  GroupMode,
} from '#/types/attachment-classification';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Radio,
  Switch,
} from 'ant-design-vue';

import {
  createAttachmentGroupApi,
  deleteAttachmentGroupApi,
  updateAttachmentGroupApi,
} from '#/api/attachment-classification';

const props = defineProps<{
  group: AttachmentGroup | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const formRef = ref();
const saving = ref(false);

const formData = reactive({
  code: '',
  name: '',
  description: '',
  groupMode: 'page' as GroupMode,
  enabled: true,
});

const rules: Record<string, Rule[]> = {
  code: [
    { required: true, message: '请输入组编码' },
    { pattern: /^[A-Z_]+$/, message: '仅支持大写字母和下划线' },
  ],
  name: [{ required: true, message: '请输入组名称' }],
};

watch(
  () => props.group,
  (group) => {
    if (group) {
      Object.assign(formData, {
        code: group.code,
        name: group.name,
        description: group.description || '',
        groupMode: group.groupMode || 'page',
        enabled: group.enabled,
      });
    } else {
      Object.assign(formData, {
        code: '',
        name: '',
        description: '',
        groupMode: 'page',
        enabled: true,
      });
    }
  },
  { immediate: true },
);

const title = computed(() => (props.group ? '编辑附件组' : '新增附件组'));

async function handleDelete() {
  if (!props.group) return;
  try {
    saving.value = true;
    await deleteAttachmentGroupApi(props.group.id);
    message.success('删除成功');
    emit('success');
    handleClose();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    saving.value = true;

    if (props.group) {
      await updateAttachmentGroupApi(props.group.id, formData);
      message.success('更新成功');
    } else {
      await createAttachmentGroupApi(formData);
      message.success('创建成功');
    }

    emit('success');
    handleClose();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer :open="open" :title="title" :width="500" @close="handleClose">
    <Form
      ref="formRef"
      :label-col="{ span: 6 }"
      :model="formData"
      :rules="rules"
      :wrapper-col="{ span: 18 }"
    >
      <Form.Item label="组编码" name="code">
        <Input
          v-model:value="formData.code"
          :disabled="!!props.group"
          placeholder="请输入组编码(大写字母和下划线)"
        />
      </Form.Item>
      <Form.Item label="组名称" name="name">
        <Input v-model:value="formData.name" placeholder="请输入组名称" />
      </Form.Item>
      <Form.Item label="分类模式" name="groupMode">
        <Radio.Group v-model:value="formData.groupMode">
          <Radio.Button value="page">单页</Radio.Button>
          <Radio.Button value="document">文档</Radio.Button>
          <Radio.Button value="specified">指定编码</Radio.Button>
        </Radio.Group>
        <div class="mt-2 text-xs text-muted-foreground">
          <template v-if="formData.groupMode === 'page'">
            单页模式：对每页独立进行分类和字段提取
          </template>
          <template v-else-if="formData.groupMode === 'document'">
            文档模式：对整个文件进行整体分类和字段提取
          </template>
          <template v-else>
            指定编码模式：直接按预分类进行字段提取，无需再次分类
          </template>
        </div>
      </Form.Item>
      <Form.Item label="描述" name="description">
        <Input.TextArea
          v-model:value="formData.description"
          :rows="4"
          placeholder="请输入描述"
        />
      </Form.Item>
      <Form.Item label="是否启用" name="enabled">
        <Switch v-model:checked="formData.enabled" />
      </Form.Item>
    </Form>

    <template #footer>
      <div class="flex justify-between">
        <div>
          <Popconfirm
            v-if="props.group"
            cancel-text="取消"
            ok-text="确定"
            title="确定要删除此附件组吗？"
            @confirm="handleDelete"
          >
            <Button danger :loading="saving">删除</Button>
          </Popconfirm>
        </div>
        <div class="flex gap-2">
          <Button @click="handleClose">取消</Button>
          <Button :loading="saving" type="primary" @click="handleSubmit">
            确定
          </Button>
        </div>
      </div>
    </template>
  </Drawer>
</template>
