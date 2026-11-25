<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input } from 'ant-design-vue';

import { aiWorkApplications } from '#/api/mock-data-ai-work';
import {
  mockMateAvailableEmployees,
  mockMateEmployees,
} from '#/api/mock-data-mate';
import DemoStoryDrawer from '#/views/app/mate/ai-work/components/demo-story-drawer.vue';
import { mateMessages } from '#/views/app/mate/messages/message-state';

const route = useRoute();
const router = useRouter();
const collapsed = ref(false);
const storyOpen = ref(false);
const employeeViewMode = ref<'card' | 'list'>('card');
const messageSearch = ref('');
const pharmaLogo = `${import.meta.env.BASE_URL}mate/pharma-logo.png`;

const primaryItems = [
  {
    key: 'home',
    label: '工作台',
    icon: 'lucide:gauge',
    path: '/app/mate/home',
  },
  {
    key: 'employees',
    label: '数字员工',
    icon: 'lucide:bot',
    path: '/app/mate/employee/new-report-assistant/report-chat',
  },
  {
    key: 'apps',
    label: '应用',
    icon: 'lucide:layers-3',
    path: '/app/mate/apps/zhiji/home',
  },
  {
    key: 'files',
    label: '文件',
    icon: 'lucide:folder',
    path: '/app/mate/files',
  },
  {
    key: 'automation',
    label: '自动化',
    icon: 'lucide:zap',
    path: '/app/mate/automation',
  },
  {
    key: 'messages',
    label: '消息',
    icon: 'lucide:mail',
    path: '/app/mate/messages',
  },
];

const messageCategories = [
  { key: 'assistant', label: '助理', icon: 'lucide:bot' },
  { key: 'todo', label: '待办', icon: 'lucide:circle-check-big' },
  { key: 'application', label: '应用', icon: 'lucide:blocks' },
  { key: 'share', label: '分享', icon: 'lucide:share-2' },
  { key: 'other', label: '其他', icon: 'lucide:ellipsis' },
] as const;

const messageUnreadCount = computed(
  () => mateMessages.filter((item) => item.unread).length,
);
const messageReadCount = computed(
  () => mateMessages.length - messageUnreadCount.value,
);
const activeMessageStatus = computed(() => String(route.query.status || 'all'));
const activeMessageCategory = computed(() =>
  String(route.query.category || 'all'),
);

watch(
  () => route.query.q,
  (value) => {
    messageSearch.value = String(value || '');
  },
  { immediate: true },
);

const isGuidePage = computed(() => route.path === '/app/mate/help');

const activeKey = computed(() => {
  if (isGuidePage.value) return 'help';
  if (route.path.includes('/employee/')) return 'employees';
  if (route.path.includes('/apps/')) return 'apps';
  return (
    primaryItems.find((item) => route.path.startsWith(item.path))?.key || 'home'
  );
});

const activeEmployeeId = computed(() => String(route.params.employeeId || ''));
const activeEmployee = computed(() =>
  mockMateAvailableEmployees.find((item) => item.id === activeEmployeeId.value),
);
const sidebarEmployees = computed(() => mockMateEmployees);
const activeApplicationId = computed(
  () =>
    aiWorkApplications.find((item) =>
      route.path.startsWith(`/app/mate/apps/${item.id}`),
    )?.id || '',
);

function go(path: string) {
  void router.push(path);
}

function updateMessageQuery(key: 'category' | 'status', value: string) {
  void router.push({
    path: '/app/mate/messages',
    query: {
      ...route.query,
      [key]: value === 'all' ? undefined : value,
      messageId: undefined,
    },
  });
}

function searchMessages() {
  const keyword = messageSearch.value.trim();
  void router.push({
    path: '/app/mate/messages',
    query: { ...route.query, messageId: undefined, q: keyword || undefined },
  });
}

function clearMessageFilters() {
  messageSearch.value = '';
  void router.push('/app/mate/messages');
}

function openMessageNotificationSettings() {
  void router.push({
    path: '/app/mate/messages',
    query: {
      ...route.query,
      notificationSettings: 'open',
    },
  });
}

function backToAdmin() {
  void router.push('/workspace');
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}

function showHelp() {
  void router.push('/app/mate/help');
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <div class="mate-shell" :class="{ 'is-collapsed': collapsed }">
    <aside class="mate-rail">
      <button
        class="mate-brand"
        type="button"
        title="返回工作台"
        aria-label="返回工作台"
        @click="go('/app/mate/home')"
      >
        <img :src="pharmaLogo" alt="Pharma" />
      </button>

      <nav class="mate-primary-nav" aria-label="Mate 主导航">
        <button
          v-for="item in primaryItems"
          :key="item.key"
          class="mate-primary-item"
          :class="{ 'is-active': activeKey === item.key }"
          type="button"
          :title="item.label"
          @click="go(item.path)"
        >
          <Icon :icon="item.icon" />
          <span>{{ item.label }}</span>
          <i
            v-if="item.key === 'messages' && messageUnreadCount"
            class="mate-primary-badge"
            :aria-label="`${messageUnreadCount} 条未读消息`"
          >
            {{ messageUnreadCount > 9 ? '9+' : messageUnreadCount }}
          </i>
        </button>
      </nav>

      <div class="mate-rail-bottom">
        <button
          class="mate-icon-button mate-story-button"
          type="button"
          title="AI Work 演示流程"
          aria-label="AI Work 演示流程"
          @click="storyOpen = true"
        >
          <Icon icon="lucide:route" />
        </button>
        <button
          class="mate-icon-button"
          type="button"
          title="帮助"
          aria-label="帮助"
          :aria-current="isGuidePage ? 'page' : undefined"
          @click="showHelp"
        >
          <Icon icon="lucide:circle-help" />
        </button>
        <button
          class="mate-account"
          type="button"
          title="返回管理后台"
          @click="backToAdmin"
        >
          韩
        </button>
      </div>
    </aside>

    <aside
      v-if="route.path !== '/app/mate/home' && !isGuidePage"
      class="mate-secondary"
    >
      <div
        class="mate-secondary__head"
        :class="{ 'is-employee-head': activeKey === 'employees' }"
      >
        <div class="mate-secondary__title">
          <span class="mate-secondary__icon">
            <Icon
              :icon="
                activeKey === 'employees'
                  ? 'lucide:users-round'
                  : primaryItems.find((item) => item.key === activeKey)?.icon ||
                    'lucide:gauge'
              "
            />
          </span>
          <div v-if="!collapsed">
            <strong>
              {{ primaryItems.find((item) => item.key === activeKey)?.label }}
            </strong>
            <small v-if="activeKey === 'apps'">已启用的智能应用</small>
            <small v-else-if="activeKey !== 'employees'">Mate 智能工作台</small>
          </div>
        </div>
        <div
          v-if="activeKey === 'employees' && !collapsed"
          class="mate-employee-view-switch"
        >
          <button
            type="button"
            title="卡片视图"
            :class="{ 'is-active': employeeViewMode === 'card' }"
            @click="employeeViewMode = 'card'"
          >
            <Icon icon="lucide:layout-grid" />
          </button>
          <button
            type="button"
            title="列表视图"
            :class="{ 'is-active': employeeViewMode === 'list' }"
            @click="employeeViewMode = 'list'"
          >
            <Icon icon="lucide:list" />
          </button>
        </div>
        <button
          class="mate-collapse"
          type="button"
          :title="collapsed ? '展开侧栏' : '收起侧栏'"
          @click="toggleCollapsed"
        >
          <Icon
            :icon="collapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'"
          />
        </button>
      </div>

      <div
        v-if="activeKey === 'employees'"
        class="mate-secondary__body mate-employee-list"
      >
        <div v-if="!collapsed" class="mate-secondary__label">
          <Icon icon="lucide:clock-3" />
          最近联系
        </div>
        <button
          v-for="employee in sidebarEmployees"
          :key="employee.id"
          class="mate-employee-item"
          :class="{
            'is-active': activeEmployeeId === employee.id,
            'is-list-mode': employeeViewMode === 'list',
            'is-deprecated': employee.deprecated,
          }"
          type="button"
          :title="`${employee.name} · ${employee.role}`"
          @click="
            go(
              employee.menus[0]?.path ||
                '/app/mate/employee/new-report-assistant/report-chat',
            )
          "
        >
          <span class="mate-avatar" :style="{ background: employee.accent }">
            <img :src="employee.avatar" :alt="employee.name" />
            <i class="mate-avatar__online"></i>
          </span>
          <span v-if="!collapsed" class="mate-employee-copy">
            <strong>{{ employee.name }}</strong>
            <span v-if="employee.deprecated" class="mate-employee-deprecated">
              作废
            </span>
          </span>
        </button>
      </div>

      <div
        v-else-if="activeKey === 'apps'"
        class="mate-secondary__body mate-application-list"
      >
        <div v-if="!collapsed" class="mate-secondary__label">
          <Icon icon="lucide:blocks" />
          智能应用中心
        </div>
        <button
          v-for="application in aiWorkApplications"
          :key="application.id"
          class="mate-application-item"
          :class="{ 'is-active': activeApplicationId === application.id }"
          type="button"
          :title="application.name"
          @click="go(application.path)"
        >
          <img :src="application.icon" :alt="application.name" />
          <span v-if="!collapsed">
            <strong>{{ application.name }}</strong>
            <small>{{ application.badge }}</small>
          </span>
        </button>
        <button
          v-if="!collapsed"
          class="mate-app-help"
          type="button"
          @click="showHelp"
        >
          <Icon icon="lucide:circle-help" />
          查看应用说明
        </button>
      </div>

      <div
        v-else-if="activeKey === 'messages'"
        class="mate-secondary__body mate-message-filters"
      >
        <template v-if="!collapsed">
          <div class="mate-message-query-head">
            <span>
              <Icon icon="lucide:list-filter" />
              消息查询
            </span>
            <button
              type="button"
              title="通知设置"
              aria-label="打开通知设置"
              @click="openMessageNotificationSettings"
            >
              <Icon icon="lucide:settings-2" />
            </button>
          </div>

          <Input.Search
            v-model:value="messageSearch"
            allow-clear
            placeholder="搜索消息"
            aria-label="搜索消息"
            @search="searchMessages"
          />

          <div class="mate-message-filter-group">
            <div class="mate-secondary__label">邮箱</div>
            <button
              type="button"
              class="mate-message-filter"
              :class="{ 'is-active': activeMessageStatus === 'all' }"
              @click="updateMessageQuery('status', 'all')"
            >
              <span>
                <Icon icon="lucide:inbox" />
                全部消息
              </span>
              <b>{{ mateMessages.length }}</b>
            </button>
            <button
              type="button"
              class="mate-message-filter"
              :class="{ 'is-active': activeMessageStatus === 'unread' }"
              @click="updateMessageQuery('status', 'unread')"
            >
              <span>
                <Icon icon="lucide:mail" />
                未读
              </span>
              <b class="is-unread-count">{{ messageUnreadCount }}</b>
            </button>
            <button
              type="button"
              class="mate-message-filter"
              :class="{ 'is-active': activeMessageStatus === 'read' }"
              @click="updateMessageQuery('status', 'read')"
            >
              <span>
                <Icon icon="lucide:mail-open" />
                已读
              </span>
              <b>{{ messageReadCount }}</b>
            </button>
          </div>

          <div class="mate-message-filter-group">
            <div class="mate-secondary__label">分类</div>
            <button
              v-for="category in messageCategories"
              :key="category.key"
              type="button"
              class="mate-message-filter"
              :class="{
                'is-active': activeMessageCategory === category.key,
              }"
              @click="updateMessageQuery('category', category.key)"
            >
              <span>
                <Icon :icon="category.icon" />
                {{ category.label }}
              </span>
              <b>
                {{
                  mateMessages.filter((item) => item.category === category.key)
                    .length
                }}
              </b>
            </button>
          </div>

          <button
            v-if="
              activeMessageStatus !== 'all' ||
              activeMessageCategory !== 'all' ||
              messageSearch
            "
            type="button"
            class="mate-message-clear"
            @click="clearMessageFilters"
          >
            <Icon icon="lucide:rotate-ccw" />
            清除筛选
          </button>

          <div class="mate-secondary-note mate-message-note">
            <Icon icon="lucide:mouse-pointer-click" />
            <span>选择消息查看详情，点击“去处理”进入对应工作模块。</span>
          </div>
        </template>
        <template v-else>
          <button
            class="mate-message-filter-icon"
            type="button"
            title="通知设置"
            aria-label="打开通知设置"
            @click="openMessageNotificationSettings"
          >
            <Icon icon="lucide:settings-2" />
          </button>
          <button
            class="mate-message-filter-icon"
            type="button"
            title="全部消息"
            @click="updateMessageQuery('status', 'all')"
          >
            <Icon icon="lucide:inbox" />
          </button>
          <button
            class="mate-message-filter-icon"
            type="button"
            title="未读消息"
            @click="updateMessageQuery('status', 'unread')"
          >
            <Icon icon="lucide:mail" />
          </button>
          <button
            class="mate-message-filter-icon"
            type="button"
            title="已读消息"
            @click="updateMessageQuery('status', 'read')"
          >
            <Icon icon="lucide:mail-open" />
          </button>
        </template>
      </div>

      <div v-else class="mate-secondary__body mate-secondary__shortcuts">
        <button
          class="mate-shortcut"
          type="button"
          @click="go('/app/mate/employees')"
        >
          <span><Icon icon="lucide:bot" /></span>
          <b v-if="!collapsed">开始与员工对话</b>
        </button>
        <button
          class="mate-shortcut"
          type="button"
          @click="go('/app/mate/files')"
        >
          <span><Icon icon="lucide:upload-cloud" /></span>
          <b v-if="!collapsed">上传文件资产</b>
        </button>
        <button
          class="mate-shortcut"
          type="button"
          @click="go('/app/mate/automation')"
        >
          <span><Icon icon="lucide:plus" /></span>
          <b v-if="!collapsed">新建自动化任务</b>
        </button>
        <div v-if="!collapsed" class="mate-secondary-note">
          <Icon icon="lucide:shield-check" />
          <span>演示环境已开启，操作不会影响真实数据。</span>
        </div>
      </div>
    </aside>

    <main class="mate-main">
      <header
        v-if="!activeEmployee && activeKey !== 'apps' && !isGuidePage"
        class="mate-topbar"
      >
        <div>
          <span class="mate-topbar__eyebrow">MATE WORKSPACE</span>
          <strong>普通用户工作台</strong>
        </div>
        <div class="mate-topbar__actions">
          <span class="mate-online">
            <i></i>
            演示数据已同步
          </span>
          <Button type="text" size="small" @click="backToAdmin">
            <Icon icon="lucide:arrow-up-right" />
            管理后台
          </Button>
        </div>
      </header>
      <div
        class="mate-content"
        :class="{
          'is-guide-page': isGuidePage,
          'is-employee-workspace': activeEmployee,
          'is-app-workspace': activeKey === 'apps',
        }"
      >
        <RouterView />
      </div>
    </main>
    <DemoStoryDrawer v-model:open="storyOpen" />
  </div>
</template>

<style scoped>
.mate-content.is-guide-page {
  padding: 0;
}
.mate-icon-button[aria-current='page'] {
  background: #27594c;
  color: #fff;
}
@media (max-width: 900px) {
  .mate-shell {
    --mate-rail-width: 56px;
    --mate-secondary-width: 64px;
  }

  .mate-rail {
    padding-right: 4px;
    padding-left: 4px;
  }

  .mate-primary-item {
    width: 44px;
  }

  .mate-primary-item span,
  .mate-secondary__title div,
  .mate-employee-copy,
  .mate-secondary-link,
  .mate-shortcut b,
  .mate-secondary-note {
    display: none;
  }

  .mate-secondary__head {
    justify-content: center;
    padding-right: 9px;
    padding-left: 9px;
  }

  .mate-secondary__body {
    align-items: center;
    padding-right: 9px;
    padding-left: 9px;
  }

  .mate-message-filters :deep(.ant-input-search),
  .mate-message-filters .mate-secondary__label,
  .mate-message-filters .mate-message-clear,
  .mate-message-filters .mate-message-note {
    display: none;
  }

  .mate-message-filter-group {
    gap: 8px;
  }

  .mate-message-filter {
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    font-size: 0;
    background: #fff;
    border-color: #d4e4de;
  }

  .mate-message-filter > span {
    gap: 0;
  }

  .mate-message-filter b {
    display: none;
  }

  .mate-shortcut {
    justify-content: center;
    width: 48px;
    padding: 7px;
  }

  .mate-topbar {
    padding-right: 15px;
    padding-left: 15px;
  }

  .mate-online {
    display: none;
  }

  .mate-content {
    padding: 16px;
  }
}

:global(body) {
  background: #eef5f2;
}

.mate-shell {
  --mate-rail-width: 64px;
  --mate-secondary-width: 256px;
  --mate-primary: #0b6e65;
  --mate-primary-dark: #062b26;
  --mate-mint: #e8f2ee;
  --mate-border: #d7e5df;

  display: flex;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  font-family:
    'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #102e29;
  color-scheme: light;
  background: #edf5f2;
}

.mate-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  width: var(--mate-rail-width);
  padding: 16px 8px;
  color: #fff;
  background: var(--mate-primary-dark);
}

.mate-brand {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  margin-bottom: 24px;
  overflow: hidden;
  cursor: pointer;
  background: #0867b2;
  border: 0;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgb(0 0 0 / 20%);
}

.mate-brand img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mate-primary-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.mate-primary-item,
.mate-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8fa8a1;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
  transition: 0.18s ease;
}

.mate-primary-item {
  position: relative;
  flex: none;
  flex-direction: column;
  gap: 3px;
  width: 48px;
  height: 48px;
  padding: 4px 2px;
  font-size: 10px;
  font-weight: 700;
}

.mate-primary-item:hover,
.mate-icon-button:hover {
  color: #fff;
  background: rgb(255 255 255 / 9%);
}

.mate-primary-item.is-active {
  color: #fff;
  background: linear-gradient(135deg, #0c8777, #0b675e);
  box-shadow: 0 9px 20px rgb(0 0 0 / 18%);
}

.mate-primary-item.is-active::before {
  position: absolute;
  left: -8px;
  width: 4px;
  height: 30px;
  content: '';
  background: #4ce0bd;
  border-radius: 0 4px 4px 0;
}

.mate-primary-item :deep(svg) {
  font-size: 18px;
}

.mate-primary-badge {
  position: absolute;
  top: 2px;
  right: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 9px;
  font-style: normal;
  line-height: 1;
  color: #fff;
  background: #ef626b;
  border: 2px solid var(--mate-primary-dark);
  border-radius: 999px;
}

.mate-rail-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.mate-icon-button {
  width: 38px;
  height: 38px;
  font-size: 18px;
}

.mate-story-button {
  color: #4ce0bd;
  background: rgb(76 224 189 / 12%);
  border: 1px solid rgb(76 224 189 / 35%);
}

.mate-account {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #0d8879, #116554);
  border: 2px solid rgb(73 221 188 / 55%);
  border-radius: 50%;
}

.mate-secondary {
  flex: none;
  width: var(--mate-secondary-width);
  overflow: hidden;
  background: #f5faf8;
  border-right: 1px solid var(--mate-border);
}

.mate-secondary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 13px 15px;
  border-bottom: 1px solid var(--mate-border);
}

.mate-secondary__head.is-employee-head {
  min-height: 64px;
  padding: 10px 9px 10px 15px;
}

.mate-secondary__title {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.mate-secondary__title strong,
.mate-secondary__title small {
  display: block;
  white-space: nowrap;
}

.mate-secondary__title strong {
  font-size: 14px;
}

.mate-secondary__title small {
  margin-top: 3px;
  font-size: 10px;
  color: #759087;
}

.mate-secondary__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--mate-primary);
  background: #e0efea;
  border-radius: 9px;
}

.mate-collapse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  color: #718982;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--mate-border);
  border-radius: 50%;
}

.mate-employee-view-switch {
  display: flex;
  flex: none;
  padding: 2px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #cfdfda;
  border-radius: 8px;
}

.mate-employee-view-switch button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #829991;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.mate-employee-view-switch button.is-active {
  color: #fff;
  background: #0b6e65;
}

.mate-secondary__body {
  display: flex;
  flex-direction: column;
  gap: 7px;
  height: calc(100% - 78px);
  padding: 15px 11px;
  overflow: auto;
}

.mate-secondary__label {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 0 8px 4px;
  font-size: 10px;
  font-weight: 800;
  color: #78918a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mate-employee-list {
  gap: 0;
  height: calc(100% - 64px);
  padding: 12px 8px;
}

.mate-application-list {
  gap: 8px;
  height: calc(100% - 78px);
  padding: 12px 10px;
}

.mate-application-item {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  min-height: 58px;
  padding: 8px 10px;
  color: #173d35;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 62%);
  border: 1px solid transparent;
  border-radius: 16px;
}

.mate-application-item:hover {
  background: #fff;
  border-color: #b7d9cf;
}

.mate-application-item.is-active {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
  box-shadow: 0 8px 18px rgb(11 110 101 / 20%);
}

.mate-application-item img {
  flex: none;
  width: 36px;
  height: 36px;
  object-fit: cover;
  border: 1px solid rgb(11 110 101 / 12%);
  border-radius: 11px;
}

.mate-application-item > span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.mate-application-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  white-space: nowrap;
}

.mate-application-item small {
  width: max-content;
  padding: 1px 7px;
  font-size: 9px;
  color: #087162;
  background: #d6efe7;
  border-radius: 999px;
}

.mate-application-item.is-active small {
  color: #fff;
  background: rgb(255 255 255 / 20%);
}

.mate-app-help {
  display: flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 42px;
  margin-top: auto;
  font-size: 11px;
  color: #0b6e65;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d3e2dd;
  border-radius: 12px;
}

.mate-message-filters {
  gap: 18px;
  padding: 14px 12px;
}

.mate-message-filters :deep(.ant-input-affix-wrapper) {
  height: 38px;
  border-radius: 10px;
}

.mate-message-query-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
}

.mate-message-query-head > span {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #294f45;
}

.mate-message-query-head > span svg {
  width: 15px;
  height: 15px;
  color: #66847b;
}

.mate-message-query-head > button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #0b6e65;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 10px;
  transition:
    color 180ms ease,
    background 180ms ease;
}

.mate-message-query-head > button:hover {
  color: #075b54;
  background: #e3f0ec;
}

.mate-message-query-head > button:focus-visible {
  outline: 3px solid rgb(76 224 189 / 45%);
  outline-offset: 1px;
}

.mate-message-filter-group {
  display: grid;
  gap: 4px;
}

.mate-message-filter-group .mate-secondary__label {
  padding-bottom: 3px;
}

.mate-message-filter,
.mate-message-clear,
.mate-message-filter-icon {
  cursor: pointer;
  transition: 180ms ease;
}

.mate-message-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 38px;
  padding: 7px 10px;
  font-size: 12px;
  color: #34564e;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
}

.mate-message-filter > span {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.mate-message-filter svg {
  width: 16px;
  height: 16px;
  color: #66847b;
}

.mate-message-filter b {
  min-width: 20px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  color: #718c84;
  text-align: center;
  background: #e5efeb;
  border-radius: 999px;
}

.mate-message-filter:hover {
  color: #0b6e65;
  background: #fff;
  border-color: #d5e4df;
}

.mate-message-filter.is-active {
  font-weight: 700;
  color: #075c54;
  background: #dfeee9;
  border-color: #bad7ce;
}

.mate-message-filter.is-active svg {
  color: #0b6e65;
}

.mate-message-filter b.is-unread-count {
  color: #fff;
  background: #d94d58;
}

.mate-message-clear {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  font-size: 11px;
  color: #55736a;
  background: #fff;
  border: 1px solid #d6e4df;
  border-radius: 9px;
}

.mate-message-clear:hover {
  color: #0b6e65;
  border-color: #9cc9bd;
}

.mate-message-note {
  margin-top: auto;
}

.mate-message-filter-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 17px;
  color: #2b685d;
  background: #fff;
  border: 1px solid #d4e4de;
  border-radius: 11px;
}

.mate-message-filter-icon:hover {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.mate-primary-item:focus-visible,
.mate-message-filter:focus-visible,
.mate-message-clear:focus-visible,
.mate-message-filter-icon:focus-visible {
  outline: 3px solid rgb(76 224 189 / 45%);
  outline-offset: 2px;
}

.mate-employee-item {
  position: relative;
  display: flex;
  gap: 9px;
  align-items: center;
  width: 100%;
  min-height: 54px;
  padding: 8px 10px;
  margin-bottom: 5px;
  color: #1b4038;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 66%);
  border: 1px solid rgb(131 190 177 / 22%);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgb(11 110 101 / 7%);
}

.mate-employee-item:hover {
  background: #fff;
  border-color: rgb(11 110 101 / 28%);
  box-shadow: 0 3px 10px rgb(11 110 101 / 10%);
}

.mate-employee-item.is-active {
  color: #175e52;
  background: #dff0ea;
  border-color: #9ecabd;
  box-shadow: 0 4px 12px rgb(41 107 90 / 12%);
}

.mate-employee-item.is-list-mode {
  min-height: 40px;
  padding: 5px 9px;
  margin-bottom: 3px;
  border-radius: 10px;
}

.mate-employee-item.is-deprecated:not(.is-active) {
  background: rgb(244 244 242 / 76%);
}

.mate-employee-item.is-list-mode .mate-avatar {
  width: 28px;
  height: 28px;
}

.mate-avatar {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  overflow: visible;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  border: 0;
  border-radius: 50%;
}

.mate-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.mate-avatar__online {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 9px;
  height: 9px;
  background: #10b981;
  border: 2px solid #edf5f2;
  border-radius: 50%;
}

.is-active .mate-avatar__online {
  border-color: #dff0ea;
}

.mate-employee-copy {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.mate-employee-copy strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  color: inherit;
  white-space: nowrap;
}

.mate-employee-deprecated {
  flex: none;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 750;
  line-height: 1.4;
  color: #786154;
  background: #eee7e1;
  border: 1px solid #d9c9bd;
  border-radius: 999px;
}

.mate-employee-item.is-active .mate-employee-deprecated {
  color: #5e3c2d;
  background: #fff1e6;
  border-color: #f1c6a8;
}

.mate-unread {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  font-style: normal;
  color: #fff;
  background: #ef626b;
  border-radius: 9px;
}

.mate-secondary-link {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  justify-content: center;
  padding: 11px 4px;
  font-size: 12px;
  color: var(--mate-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.mate-secondary__shortcuts {
  gap: 9px;
}

.mate-shortcut {
  display: flex;
  gap: 9px;
  align-items: center;
  min-height: 52px;
  padding: 8px 10px;
  color: #1c453c;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--mate-border);
  border-radius: 10px;
}

.mate-shortcut:hover {
  border-color: #9acabe;
  box-shadow: 0 6px 16px rgb(11 110 101 / 8%);
}

.mate-shortcut span {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--mate-primary);
  background: #e4f2ed;
  border-radius: 8px;
}

.mate-shortcut b {
  font-size: 12px;
}

.mate-secondary-note {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 10px;
  margin-top: auto;
  font-size: 11px;
  line-height: 1.5;
  color: #668078;
  background: #e4f1ec;
  border-radius: 10px;
}

.mate-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #edf5f2;
}

.mate-topbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 12px 26px;
  background: rgb(255 255 255 / 82%);
  border-bottom: 1px solid var(--mate-border);
}

.mate-topbar__eyebrow {
  display: block;
  font-size: 9px;
  font-weight: 800;
  color: #8ba39d;
  letter-spacing: 0.14em;
}

.mate-topbar strong {
  display: block;
  margin-top: 5px;
  font-size: 16px;
  color: #14382f;
}

.mate-topbar__actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.mate-online {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #648078;
}

.mate-online i {
  width: 7px;
  height: 7px;
  background: #20b486;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #dff4eb;
}

.mate-topbar :deep(.ant-btn) {
  font-size: 12px;
  color: var(--mate-primary);
}

.mate-content {
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow: auto;
  background: #edf5f2;
}

.mate-content.is-employee-workspace {
  padding: 16px;
  overflow: hidden;
}

.mate-content.is-app-workspace {
  padding: 8px 16px 16px;
  overflow: hidden;
}

.mate-shell :deep(.ant-card) {
  color: #173d32;
  background: #fff;
  border-color: #dce9e4;
}

.mate-shell :deep(.ant-card-head) {
  color: #1a4338;
  background: #fff;
  border-bottom-color: #edf3f0;
}

.is-collapsed {
  --mate-secondary-width: 64px;
}

.is-collapsed .mate-secondary__head {
  justify-content: center;
  padding-right: 9px;
  padding-left: 9px;
}

.is-collapsed .mate-secondary__body {
  align-items: center;
  padding-right: 9px;
  padding-left: 9px;
}

.is-collapsed .mate-employee-item {
  justify-content: center;
  width: 48px;
  min-height: 48px;
  padding: 4px;
}

.is-collapsed .mate-application-item {
  justify-content: center;
  min-height: 48px;
  padding: 5px;
}

.is-collapsed .mate-application-item img {
  width: 34px;
  height: 34px;
}

.is-collapsed .mate-shortcut {
  justify-content: center;
  width: 48px;
  padding: 7px;
}

/* Mate 是独立的浅色用户端，不跟随管理后台的深色组件 token。 */
.mate-shell {
  color-scheme: light;
}

.mate-shell :deep(.ant-input),
.mate-shell :deep(.ant-input-affix-wrapper),
.mate-shell :deep(.ant-select-selector),
.mate-shell :deep(.ant-picker),
.mate-shell :deep(.ant-input-number) {
  color: #294b43 !important;
  background: #fff !important;
  border-color: #d6e4df !important;
}

.mate-shell :deep(.ant-input::placeholder),
.mate-shell :deep(textarea::placeholder),
.mate-shell :deep(.ant-select-selection-placeholder) {
  color: #99aaa4 !important;
}

.mate-shell :deep(.ant-select-selection-item),
.mate-shell :deep(.ant-select-arrow),
.mate-shell :deep(.ant-input-prefix),
.mate-shell :deep(.ant-input-suffix) {
  color: #567068 !important;
}

.mate-shell :deep(.ant-switch-checked) {
  background: #0b806f !important;
}
</style>
