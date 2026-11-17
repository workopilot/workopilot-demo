import type { ProjectDemoState } from '#/types/project-management';

import { computed, reactive, watch } from 'vue';

import { defineStore } from 'pinia';

import {
  initialProjectDiscussions,
  projectStoryStages,
} from '#/api/mock-project-management';

const STORAGE_KEY = 'mate-project-management-demo-v1';

function initialState(): ProjectDemoState {
  return {
    stage: 2,
    generatedArtifacts: [],
    weeklyLinkConfirmed: false,
    escalationConfirmed: false,
    discussions: structuredClone(initialProjectDiscussions),
  };
}

function loadState(): ProjectDemoState {
  if (typeof window === 'undefined') return initialState();
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    return saved
      ? { ...initialState(), ...(JSON.parse(saved) as ProjectDemoState) }
      : initialState();
  } catch {
    return initialState();
  }
}

export const useProjectManagementDemoStore = defineStore(
  'mate-project-management-demo',
  () => {
    const state = reactive<ProjectDemoState>(loadState());
    const activeStage = computed(
      () => projectStoryStages.find((item) => item.id === state.stage)!,
    );

    watch(
      state,
      (value) => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        }
      },
      { deep: true },
    );

    function setStage(stage: number) {
      state.stage = Math.min(5, Math.max(1, stage));
    }

    function generateArtifact(name: string) {
      if (!state.generatedArtifacts.includes(name)) {
        state.generatedArtifacts.push(name);
      }
      if (name === '补救计划') setStage(4);
    }

    function confirmWeeklyLink() {
      state.weeklyLinkConfirmed = true;
    }

    function confirmEscalation() {
      state.escalationConfirmed = true;
      generateArtifact('升级会议议程');
      setStage(5);
    }

    function addDiscussion(content: string) {
      state.discussions.unshift({
        id: `discussion-${Date.now()}`,
        objectLabel: 'KR2.1 · 联调测试报告',
        author: '韩立',
        role: '当前用户',
        time: '刚刚',
        content,
        aiSummary: '新讨论已纳入项目上下文，AI 将在下一次健康度判断中引用。',
      });
    }

    function resetDemo() {
      Object.assign(state, initialState());
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    return {
      activeStage,
      addDiscussion,
      confirmEscalation,
      confirmWeeklyLink,
      generateArtifact,
      resetDemo,
      setStage,
      state,
    };
  },
);

