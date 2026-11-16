<script setup lang="ts">
import type {
  AdjustmentStat,
  AttachmentCategory,
  AttachmentFile,
} from '#/api/mock-data-adjustment';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Card,
  Dropdown,
  Menu,
  message,
  Segmented,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  getAdjustmentCategoriesApi,
  getAdjustmentFilesApi,
  getAdjustmentStatsApi,
  updateFileClassificationApi,
} from '#/api/mock-data-adjustment';

// State
const loading = ref(false);
const stats = ref<AdjustmentStat[]>([]);
const files = ref<AttachmentFile[]>([]);
const categories = ref<AttachmentCategory[]>([]);
const viewMode = ref<'classification' | 'sequence'>('classification');

// Drag State
const draggedFile = ref<AttachmentFile | null>(null);

// Collapsed State
const collapsedGroups = ref<Set<string>>(new Set());

// Fetch Data
async function fetchData() {
  loading.value = true;
  try {
    const [statsRes, filesRes, catsRes] = await Promise.all([
      getAdjustmentStatsApi(),
      getAdjustmentFilesApi(),
      getAdjustmentCategoriesApi(),
    ]);
    stats.value = statsRes.data;
    files.value = filesRes.data;
    categories.value = catsRes.data;
  } catch (error) {
    message.error('加载数据失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);

// Computed
const groupedFiles = computed(() => {
  const groups = categories.value.map((cat) => ({
    ...cat,
    files: files.value
      .filter((f) => f.classificationId === cat.id)
      .toSorted((a, b) => a.pageIndex - b.pageIndex),
  }));
  return groups;
});

const sortedFiles = computed(() => {
  return files.value.toSorted((a, b) => a.pageIndex - b.pageIndex);
});

// Methods
function getCategoryColor(catId: string) {
  const cat = categories.value.find((c) => c.id === catId);
  return cat?.color || 'default';
}

async function handleCategoryChange(file: AttachmentFile, newCatId: string) {
  try {
    // Optimistic update
    // const oldCatId = file.classificationId;
    // const oldCatName = file.classificationName;
    const newCat = categories.value.find((c) => c.id === newCatId);

    if (!newCat) return;

    file.classificationId = newCat.id;
    file.classificationName = newCat.name;

    await updateFileClassificationApi(file.id, newCat.id);
    message.success(`已移动到 ${newCat.name}`);

    // Refresh stats if needed (omitted for mock)
  } catch {
    // Revert
    // file.classificationId = oldCatId; // Need proper state management for revert
    message.error('移动失败');
  }
}

// Drag & Drop Handlers
function onDragStart(event: DragEvent, file: AttachmentFile) {
  if (viewMode.value !== 'classification') return;
  draggedFile.value = file;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', file.id);
  }
}

function onDragOver(event: DragEvent) {
  if (viewMode.value !== 'classification') return;
  event.preventDefault(); // Allow drop
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function onDrop(event: DragEvent, targetCatId: string) {
  if (viewMode.value !== 'classification') return;
  event.preventDefault();
  const fileId = event.dataTransfer?.getData('text/plain');

  if (
    fileId &&
    draggedFile.value &&
    draggedFile.value.id === fileId &&
    draggedFile.value.classificationId !== targetCatId
  ) {
    handleCategoryChange(draggedFile.value, targetCatId);
  }
  draggedFile.value = null;
}

// Grouping logic for contract view
function getContractGroups(catFiles: AttachmentFile[]) {
  // Group files by contractGroupId if available, otherwise single
  const groups: { files: AttachmentFile[]; id: string; isGroup: boolean }[] =
    [];

  let currentGroup: AttachmentFile[] = [];
  let currentGroupId: string | undefined;

  catFiles.forEach((file) => {
    if (file.contractGroupId) {
      if (currentGroupId !== file.contractGroupId) {
        // Push previous group
        if (currentGroup.length > 0) {
          groups.push({
            id: currentGroupId || `single-${currentGroup[0].id}`,
            files: [...currentGroup],
            isGroup: !!currentGroupId,
          });
          currentGroup = [];
        }
        currentGroupId = file.contractGroupId;
      }
      currentGroup.push(file);
    } else {
      // Flush previous group
      if (currentGroup.length > 0) {
        groups.push({
          id: currentGroupId || `single-${currentGroup[0].id}`,
          files: [...currentGroup],
          isGroup: !!currentGroupId,
        });
        currentGroup = [];
        currentGroupId = undefined;
      }
      groups.push({ id: file.id, files: [file], isGroup: false });
    }
  });

  if (currentGroup.length > 0) {
    groups.push({
      id: currentGroupId || `single-${currentGroup[0].id}`,
      files: [...currentGroup],
      isGroup: !!currentGroupId,
    });
  }

  return groups;
}

function toggleGroup(groupId: string) {
  if (collapsedGroups.value.has(groupId)) {
    collapsedGroups.value.delete(groupId);
  } else {
    collapsedGroups.value.add(groupId);
  }
}
</script>

<template>
  <div class="flex h-full flex-col gap-4 overflow-hidden bg-gray-50 p-4">
    <!-- Header Stats -->
    <div class="grid flex-shrink-0 grid-cols-2 gap-4 md:grid-cols-4">
      <Card
        v-for="stat in stats"
        :key="stat.label"
        size="small"
        :bordered="false"
        class="shadow-sm"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex items-center justify-center rounded-full bg-gray-100 p-3"
          >
            <Icon :icon="stat.icon" class="size-6" :class="stat.color" />
          </div>
          <div>
            <div class="text-sm text-gray-500">{{ stat.label }}</div>
            <div class="text-2xl font-bold">{{ stat.value }}</div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Toolbar -->
    <div
      class="flex flex-shrink-0 items-center justify-between rounded-lg bg-white p-3 shadow-sm"
    >
      <div class="flex items-center gap-2 text-lg font-medium">
        <Icon icon="lucide:arrow-left-right" class="size-5" />
        附件分类调整
      </div>
      <Segmented
        v-model:value="viewMode"
        :options="[
          {
            label: '按分类视图',
            value: 'classification',
            icon: 'lucide:layout-grid',
          },
          {
            label: '按文件顺序',
            value: 'sequence',
            icon: 'lucide:list-ordered',
          },
        ]"
      >
        <template #label="{ label, icon }">
          <span class="flex items-center gap-2 px-2">
            <Icon :icon="icon" />
            {{ label }}
          </span>
        </template>
      </Segmented>
    </div>

    <!-- Content Area -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <Spin :spinning="loading">
        <!-- Classification View -->
        <div v-if="viewMode === 'classification'" class="space-y-6 pb-4">
          <div
            v-for="group in groupedFiles"
            :key="group.id"
            class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
            @dragover="onDragOver"
            @drop="(e) => onDrop(e, group.id)"
          >
            <!-- Group Header -->
            <div
              class="flex cursor-pointer select-none items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
              @click="toggleGroup(group.id)"
            >
              <div class="flex items-center gap-2">
                <Icon
                  icon="lucide:chevron-down"
                  class="size-5 text-gray-500 transition-transform duration-200"
                  :class="{ '-rotate-90': collapsedGroups.has(group.id) }"
                />
                <Tag :color="group.color" class="m-0 px-2 py-0.5 text-base">
                  {{ group.name }}
                </Tag>
                <span class="text-sm text-gray-500">
                  ({{ group.files.length }})
                </span>
              </div>
              <Icon icon="lucide:grip-horizontal" class="text-gray-300" />
            </div>

            <!-- Group Content -->
            <div
              v-show="!collapsedGroups.has(group.id)"
              class="min-h-[120px] bg-slate-50/30 p-4"
            >
              <div class="flex flex-wrap gap-4">
                <template
                  v-for="subGroup in getContractGroups(group.files)"
                  :key="subGroup.id"
                >
                  <!-- Contract Group (Grouped Cards) -->
                  <div
                    v-if="subGroup.isGroup"
                    class="relative flex gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-2"
                  >
                    <div
                      class="absolute -top-3 left-3 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600"
                    >
                      合同组
                    </div>
                    <div
                      v-for="file in subGroup.files"
                      :key="file.id"
                      draggable="true"
                      @dragstart="(e) => onDragStart(e, file)"
                      class="group relative flex w-32 cursor-grab flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md active:cursor-grabbing"
                    >
                      <!-- Card Image -->
                      <div
                        class="relative aspect-[3/4] overflow-hidden bg-gray-100"
                      >
                        <img
                          :src="file.url"
                          class="h-full w-full object-cover"
                          alt="preview"
                        />
                        <div
                          class="absolute left-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white"
                        >
                          P{{ file.pageIndex }}
                        </div>
                      </div>
                      <!-- Card Footer -->
                      <div class="border-t border-gray-100 p-2 text-xs">
                        <Dropdown :trigger="['click']">
                          <div
                            class="-m-1 flex cursor-pointer items-center justify-between rounded p-1 hover:bg-gray-50"
                          >
                            <span class="truncate font-medium text-gray-700">{{
                              file.classificationName
                            }}</span>
                            <Icon
                              icon="lucide:chevron-down"
                              class="size-3 text-gray-400"
                            />
                          </div>
                          <template #overlay>
                            <Menu>
                              <Menu.Item
                                v-for="cat in categories"
                                :key="cat.id"
                                @click="handleCategoryChange(file, cat.id)"
                                :disabled="cat.id === file.classificationId"
                              >
                                <div class="flex items-center gap-2">
                                  <span
                                    class="h-2 w-2 rounded-full"
                                    :style="{
                                      backgroundColor: cat.color || '#ccc',
                                    }"
                                  ></span>
                                  {{ cat.name }}
                                </div>
                              </Menu.Item>
                            </Menu>
                          </template>
                        </Dropdown>
                      </div>
                    </div>
                  </div>

                  <!-- Single File -->
                  <div
                    v-else
                    v-for="file in subGroup.files"
                    :key="file.id"
                    draggable="true"
                    @dragstart="(e) => onDragStart(e, file)"
                    class="group relative flex w-32 cursor-grab flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md active:cursor-grabbing"
                  >
                    <!-- Card Image -->
                    <div
                      class="relative aspect-[3/4] overflow-hidden bg-gray-100"
                    >
                      <img
                        :src="file.url"
                        class="h-full w-full object-cover"
                        alt="preview"
                      />
                      <div
                        class="absolute left-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white"
                      >
                        P{{ file.pageIndex }}
                      </div>
                    </div>
                    <!-- Card Footer -->
                    <div class="border-t border-gray-100 p-2 text-xs">
                      <Dropdown :trigger="['click']">
                        <div
                          class="-m-1 flex cursor-pointer items-center justify-between rounded p-1 hover:bg-gray-50"
                        >
                          <span class="truncate font-medium text-gray-700">{{
                            file.classificationName
                          }}</span>
                          <Icon
                            icon="lucide:chevron-down"
                            class="size-3 text-gray-400"
                          />
                        </div>
                        <template #overlay>
                          <Menu>
                            <Menu.Item
                              v-for="cat in categories"
                              :key="cat.id"
                              @click="handleCategoryChange(file, cat.id)"
                              :disabled="cat.id === file.classificationId"
                            >
                              <div class="flex items-center gap-2">
                                <span
                                  class="h-2 w-2 rounded-full"
                                  :style="{
                                    backgroundColor: cat.color || '#ccc',
                                  }"
                                ></span>
                                {{ cat.name }}
                              </div>
                            </Menu.Item>
                          </Menu>
                        </template>
                      </Dropdown>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Sequence View -->
        <div
          v-else
          class="grid grid-cols-2 gap-4 pb-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
        >
          <div
            v-for="file in sortedFiles"
            :key="file.id"
            class="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <!-- Card Image -->
            <div
              class="group relative aspect-[3/4] overflow-hidden bg-gray-100"
            >
              <img
                :src="file.url"
                class="h-full w-full object-cover"
                alt="preview"
              />
              <div
                class="absolute left-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white"
              >
                P{{ file.pageIndex }}
              </div>
            </div>
            <!-- Card Footer -->
            <div class="border-t border-gray-100 p-2 text-xs">
              <Dropdown :trigger="['click']">
                <div
                  class="-m-1 flex cursor-pointer items-center justify-between rounded p-1 hover:bg-gray-50"
                >
                  <div class="flex items-center gap-1.5 overflow-hidden">
                    <span
                      class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      :style="{
                        backgroundColor:
                          getCategoryColor(file.classificationId) || '#ccc',
                      }"
                    ></span>
                    <span class="truncate font-medium text-gray-700">{{
                      file.classificationName
                    }}</span>
                  </div>
                  <Icon
                    icon="lucide:chevron-down"
                    class="size-3 text-gray-400"
                  />
                </div>
                <template #overlay>
                  <Menu>
                    <Menu.Item
                      v-for="cat in categories"
                      :key="cat.id"
                      @click="handleCategoryChange(file, cat.id)"
                      :disabled="cat.id === file.classificationId"
                    >
                      <div class="flex items-center gap-2">
                        <span
                          class="h-2 w-2 rounded-full"
                          :style="{ backgroundColor: cat.color || '#ccc' }"
                        ></span>
                        {{ cat.name }}
                      </div>
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  </div>
</template>

<style scoped>
/* Optional: specific styles for drag over visual feedback */
</style>
