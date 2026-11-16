<script setup lang="ts">
import type { Group } from '#/api/mock-authorization-groups';
import { ref, watch } from 'vue';
import {
  Button,
  Drawer,
  Input,
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import { groups } from '#/api/mock-authorization-groups';
import '../group-editor.css';

const props = defineProps<{ group?: Group; open: boolean }>();
const emit = defineEmits<{ close: [] }>();
const name = ref('');
const code = ref('');
const enabled = ref(true);
const note = ref('');
const nameError = ref('');
const codeError = ref('');
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const g = props.group;
    name.value = g?.name ?? '';
    code.value = g?.code ?? nextCode();
    note.value = g?.note ?? '';
    enabled.value = g?.enabled ?? true;
    nameError.value = '';
    codeError.value = '';
  },
);
function nextCode() {
  let number = groups.value.length + 1;
  let value: string;
  do {
    value = 'GRP-' + String(number++).padStart(3, '0');
  } while (groups.value.some((g) => g.code.toUpperCase() === value));
  return value;
}
function save() {
  const others = groups.value.filter((g) => g.id !== props.group?.id);
  const fields = {
    name: name.value.trim(),
    code: code.value.trim(),
    enabled: enabled.value,
    note: note.value.trim(),
  };
  nameError.value = !fields.name
    ? '请输入授权组名称'
    : others.some((g) => g.name === fields.name)
      ? '组名称已存在'
      : '';
  codeError.value = !fields.code
    ? '请输入授权组编号'
    : others.some((g) => g.code.toUpperCase() === fields.code.toUpperCase())
      ? '组编号已存在'
      : '';
  if (nameError.value || codeError.value) return;
  if (props.group) {
    groups.value = groups.value.map((g) =>
      g.id === props.group?.id ? { ...g, ...fields } : g,
    );
  } else {
    groups.value.unshift({
      id: crypto.randomUUID(),
      ...fields,
      users: [],
      departments: [],
      recursive: [],
      apps: [],
    });
  }
  message.success(props.group ? '基本信息已保存' : '已创建授权组');
  emit('close');
}
</script>
<template>
  <Drawer
    :open="open"
    width="min(480px,100vw)"
    :title="group ? '授权编辑' : '新建授权组'"
    @close="emit('close')"
  >
    <div class="group-editor-fields">
      <div>
        <label for="group-name">授权组名称</label
        ><Input
          id="group-name"
          v-model:value="name"
          :maxlength="32"
          placeholder="输入授权组名称"
          :status="nameError ? 'error' : undefined"
          @input="nameError = ''"
        /><small v-if="nameError" role="alert">{{ nameError }}</small>
      </div>
      <div>
        <label for="group-code">授权组编号</label
        ><Input
          id="group-code"
          v-model:value="code"
          :maxlength="48"
          placeholder="输入唯一编号"
          :status="codeError ? 'error' : undefined"
          @input="codeError = ''"
        /><small v-if="codeError" role="alert">{{ codeError }}</small>
      </div>
      <div>
        <label for="group-enabled">是否启用</label
        ><span
          ><Switch
            id="group-enabled"
            v-model:checked="enabled"
            checked-children="启用"
            un-checked-children="停用"
        /></span>
      </div>
      <div>
        <label for="group-note">备注</label
        ><Textarea
          id="group-note"
          v-model:value="note"
          :rows="4"
          :maxlength="200"
          show-count
          placeholder="填写该组的用途或说明（选填）"
        />
      </div>
    </div>
    <template #footer
      ><div class="auth-actions">
        <Button @click="emit('close')">取消</Button
        ><Button type="primary" @click="save">保存</Button>
      </div></template
    >
  </Drawer>
</template>
