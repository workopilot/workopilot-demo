<script setup lang="ts">
import type { AgentItem } from '#/types/agent';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Radio,
  Select,
  Upload,
} from 'ant-design-vue';

const props = defineProps<{
  agent?: AgentItem | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved', agent: AgentItem): void;
}>();

const isEdit = computed(() => !!props.agent);
const title = computed(() => (isEdit.value ? '编辑智能体' : '新增能力'));

// Logo type: icon or image
const logoType = ref<'icon' | 'image'>('icon');

// Form data
const formData = ref({
  name: '',
  code: '',
  logo: 'lucide:bot',
  logoImage: '', // Base64 or URL
  logoColor: '#3b82f6',
  logoBgColor: '#eff6ff',
  description: '',
  version: 'v1.0.0',
  status: 'development' as 'active' | 'development' | 'disabled',
  markdown: '',
  menus: [] as Array<{ icon: string; path: string; title: string }>,
});

// Popular icons for selection
const iconOptions = [
  'lucide:bot',
  'lucide:brain',
  'lucide:shield-check',
  'lucide:file-search',
  'lucide:scale',
  'lucide:chart-line',
  'lucide:database',
  'lucide:cpu',
  'lucide:zap',
  'lucide:sparkles',
  'lucide:rocket',
  'lucide:target',
  'lucide:wand-2',
  'lucide:workflow',
  'lucide:layers',
];

// Color presets
const colorPresets = [
  { color: '#3b82f6', bg: '#eff6ff' }, // Blue
  { color: '#10b981', bg: '#ecfdf5' }, // Green
  { color: '#f59e0b', bg: '#fffbeb' }, // Amber
  { color: '#ef4444', bg: '#fef2f2' }, // Red
  { color: '#8b5cf6', bg: '#f5f3ff' }, // Purple
  { color: '#ec4899', bg: '#fdf2f8' }, // Pink
  { color: '#0ea5e9', bg: '#f0f9ff' }, // Sky
  { color: '#14b8a6', bg: '#f0fdfa' }, // Teal
];

// Check if logo is an image URL
function isImageUrl(logo: string): boolean {
  return (
    logo.startsWith('data:') || logo.startsWith('http') || logo.startsWith('/')
  );
}

// Watch for agent prop changes
watch(
  () => props.agent,
  (agent) => {
    if (agent) {
      const isImg = isImageUrl(agent.logo || '');
      logoType.value = isImg ? 'image' : 'icon';
      formData.value = {
        name: agent.name,
        code: agent.code,
        logo: isImg ? 'lucide:bot' : agent.logo || 'lucide:bot',
        logoImage: isImg ? agent.logo : '',
        logoColor: agent.logoColor || '#3b82f6',
        logoBgColor: agent.logoBgColor || '#eff6ff',
        description: agent.description,
        version: agent.version,
        status: agent.status,
        markdown: '',
        menus: [],
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function resetForm() {
  logoType.value = 'icon';
  formData.value = {
    name: '',
    code: '',
    logo: 'lucide:bot',
    logoImage: '',
    logoColor: '#3b82f6',
    logoBgColor: '#eff6ff',
    description: '',
    version: 'v1.0.0',
    status: 'development',
    markdown: '',
    menus: [],
  };
}

function handleClose() {
  emit('update:open', false);
  resetForm();
}

function addMenu() {
  formData.value.menus.push({
    title: '',
    path: '',
    icon: 'lucide:file',
  });
}

function removeMenu(index: number) {
  formData.value.menus.splice(index, 1);
}

// Handle image upload
function handleImageUpload(file: File): boolean {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB');
    return false;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.addEventListener('load', (e) => {
    formData.value.logoImage = e.target?.result as string;
  });
  reader.readAsDataURL(file);

  return false; // Prevent default upload
}

function handleSave() {
  // Validation
  if (!formData.value.name) {
    message.error('请输入智能体名称');
    return;
  }
  if (!formData.value.code) {
    message.error('请输入智能体编码');
    return;
  }
  if (!/^[a-z_]+$/.test(formData.value.code)) {
    message.error('编码只能包含小写字母和下划线');
    return;
  }

  // Determine final logo value
  const finalLogo =
    logoType.value === 'image' && formData.value.logoImage
      ? formData.value.logoImage
      : formData.value.logo;

  // Create agent object
  const agent: AgentItem = {
    id: props.agent?.id || String(Date.now()),
    name: formData.value.name,
    code: formData.value.code,
    logo: finalLogo,
    logoColor: formData.value.logoColor,
    logoBgColor: formData.value.logoBgColor,
    description: formData.value.description,
    version: formData.value.version,
    status: formData.value.status,
    tags: [],
  };

  emit('saved', agent);
  message.success(isEdit.value ? '智能体已更新' : '智能体已创建');
  handleClose();
}

function selectColorPreset(preset: { bg: string; color: string }) {
  formData.value.logoColor = preset.color;
  formData.value.logoBgColor = preset.bg;
}

// Get current logo for preview
const previewLogo = computed(() => {
  if (logoType.value === 'image' && formData.value.logoImage) {
    return formData.value.logoImage;
  }
  return null;
});
</script>

<template>
  <Drawer :open="props.open" :title="title" width="600" @close="handleClose">
    <Form layout="vertical" class="space-y-4">
      <!-- Basic Info -->
      <div class="grid grid-cols-2 gap-4">
        <Form.Item label="智能体名称" required>
          <Input v-model:value="formData.name" placeholder="例如：智能审核" />
        </Form.Item>
        <Form.Item label="编码" required>
          <Input
            v-model:value="formData.code"
            placeholder="例如：smart_audit"
            :disabled="isEdit"
          />
          <div class="mt-1 text-xs text-gray-400">只能包含小写字母和下划线</div>
        </Form.Item>
      </div>

      <!-- Logo Type Selection -->
      <Form.Item label="Logo">
        <div class="space-y-4">
          <!-- Logo Preview -->
          <div class="flex items-start gap-4">
            <div
              class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-md"
              :style="{ backgroundColor: formData.logoBgColor }"
            >
              <img
                v-if="previewLogo"
                :src="previewLogo"
                class="h-full w-full object-cover"
                alt="Logo"
              />
              <Icon
                v-else
                :icon="formData.logo"
                class="size-10"
                :style="{ color: formData.logoColor }"
              />
            </div>

            <!-- Type Toggle -->
            <div class="min-w-0 flex-1">
              <Radio.Group v-model:value="logoType" class="mb-3">
                <Radio.Button
                  value="icon"
                  style="min-width: 70px; text-align: center"
                >
                  图标
                </Radio.Button>
                <Radio.Button
                  value="image"
                  style="min-width: 70px; text-align: center"
                >
                  图片
                </Radio.Button>
              </Radio.Group>

              <!-- Icon Selection -->
              <div v-if="logoType === 'icon'" class="flex flex-wrap gap-2">
                <button
                  v-for="icon in iconOptions"
                  :key="icon"
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border transition-all"
                  :class="
                    formData.logo === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  "
                  @click="formData.logo = icon"
                >
                  <Icon :icon="icon" class="size-4" />
                </button>
              </div>

              <!-- Image Upload -->
              <div v-else class="space-y-2">
                <Upload
                  :show-upload-list="false"
                  :before-upload="handleImageUpload"
                  accept="image/*"
                >
                  <Button>
                    <Icon icon="lucide:upload" class="mr-1 size-4" />
                    上传图片
                  </Button>
                </Upload>
                <div class="text-xs text-gray-400">
                  支持 JPG、PNG、SVG，最大 2MB
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form.Item>

      <!-- Color Selection -->
      <Form.Item label="颜色主题">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(preset, index) in colorPresets"
            :key="index"
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all"
            :class="
              formData.logoColor === preset.color
                ? 'border-gray-800'
                : 'border-transparent'
            "
            :style="{ backgroundColor: preset.bg }"
            @click="selectColorPreset(preset)"
          >
            <div
              class="h-4 w-4 rounded-full"
              :style="{ backgroundColor: preset.color }"
            ></div>
          </button>
        </div>
      </Form.Item>

      <Form.Item label="描述">
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="简要描述智能体的功能"
          :rows="2"
        />
      </Form.Item>

      <div class="grid grid-cols-2 gap-4">
        <Form.Item label="版本号">
          <Input v-model:value="formData.version" placeholder="v1.0.0" />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formData.status">
            <Select.Option value="development">开发中</Select.Option>
            <Select.Option value="active">运行中</Select.Option>
            <Select.Option value="disabled">已停用</Select.Option>
          </Select>
        </Form.Item>
      </div>

      <Divider>介绍文档 (Markdown)</Divider>

      <Form.Item>
        <Input.TextArea
          v-model:value="formData.markdown"
          placeholder="使用 Markdown 格式编写智能体说明文档..."
          :rows="6"
        />
      </Form.Item>

      <Divider>子菜单配置</Divider>

      <div class="space-y-3">
        <div
          v-for="(menu, index) in formData.menus"
          :key="index"
          class="flex items-center gap-2 rounded-lg bg-gray-50 p-3"
        >
          <Input
            v-model:value="menu.title"
            placeholder="菜单名称"
            class="w-28"
          />
          <Input
            v-model:value="menu.path"
            placeholder="路由路径"
            class="flex-1"
          >
            <template #addonBefore>
              <!-- prettier-ignore -->
              <span class="text-xs text-gray-400">/agent/{{ formData.code }}/</span>
            </template>
          </Input>
          <Input v-model:value="menu.icon" placeholder="图标" class="w-32" />
          <Popconfirm title="确定删除该菜单?" @confirm="removeMenu(index)">
            <Button type="text" danger size="small">
              <Icon icon="lucide:trash-2" class="size-4" />
            </Button>
          </Popconfirm>
        </div>

        <Button type="dashed" block @click="addMenu">
          <Icon icon="lucide:plus" class="mr-1 size-4" />
          添加子菜单
        </Button>
      </div>
    </Form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button @click="handleClose">取消</Button>
        <Button type="primary" @click="handleSave">
          {{ isEdit ? '保存' : '创建' }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>
