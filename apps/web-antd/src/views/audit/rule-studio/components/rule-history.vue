<script setup lang="ts">
import { Button, Card, Drawer, Tag, Timeline } from 'ant-design-vue';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits(['update:open']);

const history = [
  {
    version: 'V1.2',
    author: '王五',
    date: '2024-03-15',
    desc: '优化了住宿费限额逻辑',
    type: 'success',
  },
  {
    version: 'V1.1',
    author: '李四',
    date: '2024-02-10',
    desc: '增加附件校验',
    type: 'primary',
  },
  {
    version: 'V1.0',
    author: '张三',
    date: '2024-01-01',
    desc: '初始创建',
    type: 'primary',
  },
];

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer :open="open" title="版本历史" @close="handleClose" width="400">
    <Timeline>
      <Timeline.Item v-for="h in history" :key="h.version" color="green">
        <Card size="small" :title="`${h.version} - ${h.date}`">
          <template #extra>
            <Tag>{{ h.author }}</Tag>
          </template>
          <p class="mb-2 text-gray-600">{{ h.desc }}</p>
          <div class="flex gap-2">
            <Button size="small">查看Diff</Button>
            <Button size="small" danger>回滚</Button>
          </div>
        </Card>
      </Timeline.Item>
    </Timeline>
  </Drawer>
</template>
