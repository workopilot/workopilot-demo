<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { Icon } from '@iconify/vue';

const props = defineProps<{
  activePath: string;
  description: string;
  icon: string;
  menus: { icon: string; label: string; path: string }[];
  name: string;
}>();
const navigation = ref<HTMLElement>();
watch(
  () => props.activePath,
  async () => {
    await nextTick();
    const container = navigation.value;
    const selected = container?.querySelector<HTMLElement>('.is-active');
    if (!container || !selected) return;
    if (
      selected.offsetLeft < container.scrollLeft ||
      selected.offsetLeft + selected.offsetWidth >
        container.scrollLeft + container.clientWidth
    ) {
      container.scrollLeft =
        selected.offsetLeft -
        (container.clientWidth - selected.offsetWidth) / 2;
    }
  },
  { immediate: true },
);
function scrollMenus(event: WheelEvent) {
  const container = navigation.value;
  if (
    !container ||
    container.scrollWidth <= container.clientWidth ||
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
  )
    return;
  container.scrollLeft += event.deltaY;
  event.preventDefault();
}
</script>

<template>
  <header class="application-navigation">
    <div class="application-navigation__brand">
      <span class="application-navigation__logo">
        <Icon :icon="icon" aria-hidden="true" />
      </span>
      <div>
        <strong>{{ name }}</strong>
        <span>{{ description }}</span>
      </div>
    </div>
    <nav ref="navigation" :aria-label="`${name}管理菜单`" @wheel="scrollMenus">
      <RouterLink
        v-for="menu in menus"
        :key="menu.path"
        :to="menu.path"
        :class="{ 'is-active': activePath === menu.path }"
        :aria-current="activePath === menu.path ? 'page' : undefined"
      >
        <Icon :icon="menu.icon" aria-hidden="true" />
        <span>{{ menu.label }}</span>
      </RouterLink>
    </nav>
    <div class="application-navigation__actions"><slot /></div>
  </header>
</template>

<style scoped>
.application-navigation {
  --nav-primary: #126b5e;
  --nav-muted: #536e67;
  --nav-border: #dfe8e5;
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  height: 64px;
  padding: 8px 16px;
  color: #203c38;
  background: #fff;
  border: 1px solid var(--nav-border);
  border-radius: 14px;
  box-shadow: 0 2px 6px #203c3805;
}
.application-navigation__brand {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  padding-right: 20px;
  border-right: 1px solid var(--nav-border);
}
.application-navigation__logo {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 23px;
  color: var(--nav-primary);
  background: #e4f2ec;
  border-radius: 11px;
}
.application-navigation__brand strong {
  display: block;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}
.application-navigation__brand div > span {
  font-size: 12px;
  color: var(--nav-muted);
  white-space: nowrap;
}
.application-navigation__actions {
  display: flex;
  flex: none;
  align-items: center;
  white-space: nowrap;
}
.application-navigation nav {
  position: relative;
  display: flex;
  flex: 1;
  gap: 8px;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: #b7cfc6 transparent;
}
.application-navigation nav a {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 8px 16px;
  font-size: 14px;
  line-height: 24px;
  color: var(--nav-muted);
  white-space: nowrap;
  text-decoration: none;
  border-radius: 999px;
  transition:
    background-color 160ms,
    color 160ms;
}
.application-navigation nav a:hover {
  color: var(--nav-primary);
  background: #f0f7f4;
}
.application-navigation nav a.is-active {
  font-weight: 600;
  color: #fff;
  background: var(--nav-primary);
}
.application-navigation nav a:focus-visible {
  outline: 2px solid var(--nav-primary);
  outline-offset: -2px;
  box-shadow: inset 0 0 0 4px #fff;
}
.application-navigation nav svg {
  width: 17px;
  height: 17px;
}
@media (max-width: 1100px) {
  .application-navigation {
    gap: 12px;
    padding-inline: 12px;
  }
  .application-navigation__brand {
    padding-right: 12px;
  }
  .application-navigation__brand div > span {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .application-navigation nav a {
    transition: none;
  }
}
</style>
