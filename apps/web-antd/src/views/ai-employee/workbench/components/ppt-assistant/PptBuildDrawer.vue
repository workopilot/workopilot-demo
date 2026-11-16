<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, Tag } from 'ant-design-vue';

interface GeneratedPptCopySection {
  label: string;
  items: string[];
}

interface PptStyleTemplate {
  color: string;
  desc: string;
  name: string;
}

const props = defineProps<{
  generatedPptCopy: GeneratedPptCopySection[];
  generatedPptCopyVersion: number;
  modelValue: boolean;
  pptKnowledgeRefs: string[];
  pptMatchedCases: string[];
  pptSchemeText: string;
  pptStyleTemplates: PptStyleTemplate[];
  selectedPptScheme: string;
  selectedPptStyle: string;
}>();

const emit = defineEmits<{
  'add-case-reference': [];
  'add-knowledge-reference': [];
  'regenerate-copy': [];
  'rematch-references': [];
  'remove-case': [index: number];
  'remove-knowledge': [index: number];
  'start-build': [];
  'update-copy-item': [sectionIndex: number, itemIndex: number, value: string];
  'update:modelValue': [value: boolean];
  'update:pptSchemeText': [value: string];
  'update:selectedPptStyle': [value: string];
}>();

function closeDrawer() {
  emit('update:modelValue', false);
}
</script>

<template>
  <Drawer
    :open="modelValue"
    title="PPT制作配置"
    placement="right"
    :width="720"
    @close="closeDrawer"
    @update:open="emit('update:modelValue', $event)"
  >
    <div class="space-y-5 pb-20">
      <section
        class="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"
      >
        <div
          class="mb-3 flex items-center gap-2 text-sm font-black text-emerald-900"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full bg-emerald-950 text-white"
          >
            1
          </span>
          确认方案模板
        </div>
        <div class="rounded-2xl bg-white p-4 shadow-sm">
          <div class="mb-3 text-base font-black text-slate-900">
            {{ selectedPptScheme }}
          </div>
          <Input.TextArea
            :value="pptSchemeText"
            :auto-size="{ minRows: 7, maxRows: 12 }"
            class="!rounded-2xl !border-slate-200 !bg-slate-50/70 !p-4 text-sm leading-7"
            placeholder="请补充或修改当前方案模板文案"
            @update:value="emit('update:pptSchemeText', $event)"
          />
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="mb-0 text-xs font-medium leading-5 text-slate-500">
              先确认方案结构和提示词，AI 将据此匹配历史案例与知识库资料。
            </p>
            <Button
              size="small"
              class="!rounded-xl"
              @click="emit('rematch-references')"
            >
              重新匹配引用资料
            </Button>
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        <div
          class="mb-4 flex items-center gap-2 text-sm font-black text-slate-900"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full bg-slate-900 text-white"
          >
            2
          </span>
          匹配案例库与知识库
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <div class="mb-2 text-xs font-black text-slate-500">
              AI 匹配历史案例
            </div>
            <div class="space-y-2">
              <div
                v-for="(item, index) in pptMatchedCases"
                :key="item"
                class="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-slate-700"
              >
                <span>{{ item }}</span>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  class="shrink-0 text-slate-400 hover:text-red-500"
                  @click="emit('remove-case', index)"
                >
                  <Icon icon="lucide:x" class="size-3.5" />
                </Button>
              </div>
            </div>
            <Button
              block
              class="mt-3 !rounded-2xl"
              @click="emit('add-case-reference')"
            >
              添加案例引用
            </Button>
          </div>
          <div>
            <div class="mb-2 text-xs font-black text-slate-500">
              AI 调取知识库
            </div>
            <div class="space-y-2">
              <div
                v-for="(item, index) in pptKnowledgeRefs"
                :key="item"
                class="flex items-center justify-between gap-2 rounded-2xl bg-cyan-50 p-3 text-xs font-bold leading-5 text-slate-700"
              >
                <span>{{ item }}</span>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  class="shrink-0 text-slate-400 hover:text-red-500"
                  @click="emit('remove-knowledge', index)"
                >
                  <Icon icon="lucide:x" class="size-3.5" />
                </Button>
              </div>
            </div>
            <Button
              block
              class="mt-3 !rounded-2xl"
              @click="emit('add-knowledge-reference')"
            >
              添加知识库引用
            </Button>
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <div
            class="flex items-center gap-2 text-sm font-black text-slate-900"
          >
            <span
              class="flex size-7 items-center justify-center rounded-full bg-slate-900 text-white"
            >
              3
            </span>
            生成 PPT 文案
          </div>
          <Button
            size="small"
            class="!rounded-xl"
            @click="emit('regenerate-copy')"
          >
            重新生成 PPT 文案
          </Button>
        </div>
        <div class="mb-4 flex items-center justify-between">
          <div>
            <div class="text-sm font-black text-slate-900">
              AI 生成 PPT 文案
            </div>
            <div class="mt-1 text-xs font-medium text-slate-500">
              AI 已结合方案模板、历史案例和知识库内容生成以下 PPT
              文案，可直接修改。
            </div>
          </div>
          <Tag color="cyan" class="!m-0 !rounded-full">
            V{{ generatedPptCopyVersion }}
          </Tag>
        </div>

        <div class="rounded-2xl bg-white/80 p-4 shadow-inner">
          <div
            v-for="(section, sectionIndex) in generatedPptCopy"
            :key="section.label"
            class="relative grid grid-cols-[64px_1fr] gap-4 pb-5 last:pb-0"
          >
            <div class="relative flex justify-center">
              <div
                class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-500"
              >
                {{ section.label }}
              </div>
              <div
                class="absolute left-1/2 top-8 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-slate-200 last:hidden"
              ></div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(item, itemIndex) in section.items"
                :key="`${section.label}-${itemIndex}`"
                class="relative pl-5"
              >
                <span
                  class="absolute left-0 top-4 size-2 rounded-full bg-slate-300"
                ></span>
                <Input.TextArea
                  :value="item"
                  :auto-size="{ minRows: 1, maxRows: 4 }"
                  class="!rounded-xl !border-slate-100 !bg-white/80 text-sm leading-7"
                  :class="
                    itemIndex === 0
                      ? '!font-black !text-slate-900'
                      : '!font-semibold !text-slate-700'
                  "
                  @update:value="
                    emit('update-copy-item', sectionIndex, itemIndex, $event)
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        <div
          class="mb-4 flex items-center gap-2 text-sm font-black text-slate-900"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full bg-slate-900 text-white"
          >
            4
          </span>
          选择 PPT 风格模板
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <button
            v-for="style in pptStyleTemplates"
            :key="style.name"
            class="overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            :class="[
              selectedPptStyle === style.name
                ? 'border-emerald-400 ring-2 ring-emerald-100'
                : 'border-slate-100',
            ]"
            @click="emit('update:selectedPptStyle', style.name)"
          >
            <div :class="`h-16 bg-gradient-to-br ${style.color}`"></div>
            <div class="p-3">
              <div
                class="mb-1 flex items-center justify-between text-sm font-black text-slate-900"
              >
                {{ style.name }}
                <Icon
                  v-if="selectedPptStyle === style.name"
                  icon="lucide:check-circle-2"
                  class="size-4 text-emerald-600"
                />
              </div>
              <p class="m-0 text-xs leading-5 text-slate-500">
                {{ style.desc }}
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs font-medium text-slate-500">
          已选择：{{ selectedPptScheme }} / {{ selectedPptStyle }}
        </div>
        <Button
          type="primary"
          size="large"
          class="!rounded-2xl !bg-emerald-950 px-8"
          @click="emit('start-build')"
        >
          开始制作 PPT
        </Button>
      </div>
    </template>
  </Drawer>
</template>
