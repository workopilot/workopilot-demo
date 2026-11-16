<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, List, ListItem, Spin } from 'ant-design-vue';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
// @ts-ignore
import markdownItTocDoneRight from 'markdown-it-toc-done-right';

import 'github-markdown-css/github-markdown.css';

interface DocFile {
  name: string;
  path: string;
  content: Promise<string>;
}

const tocHtml = ref<string>('');
const scrollContainer = ref<HTMLElement | null>(null);

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

md.use(markdownItAnchor, {
  permalink: markdownItAnchor.permalink.headerLink(),
  slugify: (s: string) =>
    encodeURIComponent(String(s).trim().toLowerCase().replaceAll(/\s+/g, '-')),
});

md.use(markdownItTocDoneRight, {
  level: [1, 2, 3],
  slugify: (s: string) =>
    encodeURIComponent(String(s).trim().toLowerCase().replaceAll(/\s+/g, '-')),
  callback: (html: string) => {
    tocHtml.value = html;
  },
});

const files = import.meta.glob('../../../assets/docs/api/*.md', {
  query: '?raw',
  import: 'default',
});

const docList = ref<DocFile[]>([]);
const currentDoc = ref<string>('');
const currentContent = ref<string>('');
const loading = ref<boolean>(false);

// Initialize document list
onMounted(async () => {
  const list: DocFile[] = [];
  for (const path in files) {
    const name = path.split('/').pop()?.replace('.md', '') || 'Unknown';
    list.push({
      name,
      path,
      content: files[path]() as Promise<string>,
    });
  }
  docList.value = list;

  if (list.length > 0) {
    await selectDoc(list[0]);
  }
});

const renderedContent = computed(() => {
  // Prepend [toc] to trigger the plugin
  return md.render(`[toc]\n\n${currentContent.value || ''}`);
});

async function selectDoc(doc: DocFile) {
  if (currentDoc.value === doc.name) return;

  loading.value = true;
  try {
    currentDoc.value = doc.name;
    currentContent.value = await doc.content;
    // Reset scroll position when switching documents
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
    }
  } finally {
    loading.value = false;
  }
}

// Handle TOC click for in-page navigation without changing URL hash/route
function handleTocClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
    e.preventDefault();
    const id = target.getAttribute('href')?.slice(1);
    if (id) {
      // Decode the ID because markdown-it-anchor/toc slugify might have encoded it
      // But we need to match the actual ID in the DOM.
      // The markdown-it-anchor slugify uses encodeURIComponent.
      // So the ID in DOM is encoded.
      // document.getElementById expects the exact string in the ID attribute.
      // So we should try to find it directly.
      // eslint-disable-next-line unicorn/prefer-query-selector
      const element = document.getElementById(id);
      if (element && scrollContainer.value) {
        // Calculate position relative to the scroll container
        // element.offsetTop is relative to offsetParent.
        // We might need to use getBoundingClientRect.
        const containerRect = scrollContainer.value.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset =
          elementRect.top -
          containerRect.top +
          scrollContainer.value.scrollTop -
          20; // 20px buffer

        scrollContainer.value.scrollTo({
          top: offset,
          behavior: 'smooth',
        });
      }
    }
  }
}
</script>

<template>
  <Page title="接口文档">
    <div class="flex h-[calc(100vh-160px)] gap-4 overflow-hidden">
      <!-- Left Sidebar: Document List -->
      <div class="flex h-full w-64 flex-shrink-0 flex-col">
        <Card
          title="文档列表"
          class="flex-1 overflow-y-auto"
          :body-style="{ padding: '0' }"
        >
          <List item-layout="horizontal" :data-source="docList">
            <template #renderItem="{ item }">
              <ListItem
                class="cursor-pointer px-4 hover:bg-gray-100 dark:hover:bg-gray-800"
                :class="{
                  'bg-blue-50 text-blue-600 dark:bg-blue-900/20':
                    currentDoc === item.name,
                }"
                @click="selectDoc(item)"
              >
                <div class="truncate font-medium">{{ item.name }}</div>
              </ListItem>
            </template>
          </List>
        </Card>
      </div>

      <!-- Center Area: Markdown Content -->
      <div class="h-full flex-1 overflow-y-auto" ref="scrollContainer">
        <Card class="min-h-full">
          <Spin :spinning="loading">
            <div class="min-h-[500px]">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <article class="markdown-body" v-html="renderedContent"></article>
            </div>
          </Spin>
        </Card>
      </div>

      <!-- Right Sidebar: TOC -->
      <div class="flex h-full w-64 flex-shrink-0 flex-col">
        <Card
          title="目录"
          class="flex-1 overflow-y-auto"
          :body-style="{ padding: '12px 0' }"
        >
          <div v-if="!tocHtml" class="px-4 text-gray-400">暂无目录</div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            v-else
            class="toc-container"
            v-html="tocHtml"
            @click="handleTocClick"
          ></div>
        </Card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}

.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  padding: 15px;
  margin: 0 auto;
}

/* Hide TOC inside the content area */
:deep(.markdown-body .table-of-contents) {
  display: none;
}

/* Style the TOC in the sidebar */
.toc-container {
  padding: 0 16px;
}

:deep(.toc-container .table-of-contents) {
  display: block;
}

:deep(.toc-container ul) {
  padding: 0;
  margin: 0;
  list-style: none;
}

:deep(.toc-container li) {
  padding: 4px 0;
  margin: 0;
  line-height: 1.4;
}

:deep(.toc-container ul ul) {
  padding-left: 16px;
}

:deep(.toc-container a) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: inherit;
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.2s;
}

:deep(.toc-container a:hover) {
  color: #1677ff; /* Ant Design Primary Color */
}
</style>
