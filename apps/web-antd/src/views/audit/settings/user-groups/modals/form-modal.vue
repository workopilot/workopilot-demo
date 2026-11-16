<script setup lang="ts">
import type { UserGroup, UserGroupFormData } from '#/types/user-groups';

import { ref, watch } from 'vue';

import { Button, Form, Input, message, Modal, Tag } from 'ant-design-vue';

import { createGroup, updateGroup } from '#/api/user-groups';

// ==================== Props ====================

interface Props {
  open: boolean;
  group?: null | UserGroup;
}

const props = withDefaults(defineProps<Props>(), {
  group: null,
});

// ==================== Emits ====================

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

// ==================== 表单 ====================

const formRef = ref();
const loading = ref(false);

const formData = ref<UserGroupFormData>({
  name: '',
  code: '',
  description: '',
  tags: [],
});

const tagInput = ref('');
const tagOptions = ['协作', '项目管理', '研发', '产品', '运营', '市场', '财务'];

// ==================== 表单验证规则 ====================

const rules = {
  name: [
    { required: true, message: '请输入群组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '群组名称长度为 2-50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入群组编码', trigger: 'blur' },
    {
      pattern: /^[A-Z0-9_]+$/,
      message: '群组编码只能包含大写字母、数字和下划线',
      trigger: 'blur',
    },
  ],
};

// ==================== 方法 ====================

/** 重置表单 */
function resetForm() {
  formData.value = {
    name: '',
    code: '',
    description: '',
    tags: [],
  };
  tagInput.value = '';
  formRef.value?.clearValidate();
}

/** 打开弹窗时的处理 */
function handleOpen() {
  if (props.group) {
    // 编辑模式
    formData.value = {
      name: props.group.name,
      code: props.group.code,
      description: props.group.description,
      tags: props.group.tags || [],
    };
  } else {
    // 新增模式
    resetForm();
  }
}

/** 关闭弹窗 */
function handleCancel() {
  emit('cancel');
}

/** 提交表单 */
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const apiCall = props.group
      ? () => updateGroup(props.group.id, formData.value)
      : () => createGroup(formData.value);
    await apiCall();

    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
      console.warn('表单验证失败:', error);
    } else {
      message.error(props.group ? '更新失败' : '创建失败');
      console.error(error);
    }
  } finally {
    loading.value = false;
  }
}

/** 添加标签 */
function handleAddTag() {
  const value = tagInput.value.trim();
  if (value && !formData.value.tags?.includes(value)) {
    formData.value.tags = [...(formData.value.tags || []), value];
  }
  tagInput.value = '';
}

/** 移除标签 */
function handleRemoveTag(tag: string) {
  formData.value.tags = formData.value.tags?.filter((t) => t !== tag);
}

// ==================== 监听 ====================

watch(() => props.open, handleOpen);
</script>

<template>
  <Modal
    :open="open"
    :title="group ? '编辑群组' : '新建群组'"
    :width="600"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <!-- 群组名称 -->
      <Form.Item label="群组名称" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="请输入群组名称"
          :maxlength="50"
          show-count
        />
      </Form.Item>

      <!-- 群组编码 -->
      <Form.Item label="群组编码" name="code">
        <Input
          v-model:value="formData.code"
          placeholder="请输入群组编码（大写字母、数字、下划线）"
          :maxlength="50"
        />
      </Form.Item>

      <!-- 群组描述 -->
      <Form.Item label="群组描述" name="description">
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="请输入群组描述（可选）"
          :rows="3"
          :maxlength="200"
          show-count
        />
      </Form.Item>

      <!-- 标签 -->
      <Form.Item label="标签">
        <div class="space-y-2">
          <div
            v-if="formData.tags && formData.tags.length > 0"
            class="flex flex-wrap gap-2"
          >
            <Tag
              v-for="tag in formData.tags"
              :key="tag"
              closable
              @close="handleRemoveTag(tag)"
            >
              {{ tag }}
            </Tag>
          </div>
          <div class="flex gap-2">
            <Input
              v-model:value="tagInput"
              placeholder="输入标签后按回车添加"
              @press-enter="handleAddTag"
            />
            <Button @click="handleAddTag">添加</Button>
          </div>
          <div v-if="tagOptions.length > 0" class="flex flex-wrap gap-2">
            <span class="text-xs text-muted-foreground">常用标签：</span>
            <Tag
              v-for="tag in tagOptions"
              :key="tag"
              style="cursor: pointer"
              @click="
                () => {
                  if (!formData.tags?.includes(tag)) {
                    formData.tags = [...(formData.tags || []), tag];
                  }
                }
              "
            >
              {{ tag }}
            </Tag>
          </div>
        </div>
      </Form.Item>
    </Form>
  </Modal>
</template>
