import type { AgentItem } from '#/types/agent';

import { ref } from 'vue';

import { defineStore } from 'pinia';

import { mockAgents } from '#/api/mock-agent-data';

export const useAgentStore = defineStore('agent', () => {
  const currentAgent = ref<AgentItem | null>(null);

  /**
   * Set current active agent by code (id)
   */
  function setCurrentAgent(code: string) {
    const agent = mockAgents.find((a) => a.code === code);
    if (agent) {
      currentAgent.value = agent;
    } else {
      console.warn(`Agent with code ${code} not found`);
      currentAgent.value = null;
    }
  }

  /**
   * Reset agent context
   */
  function clearAgent() {
    currentAgent.value = null;
  }

  return {
    currentAgent,
    setCurrentAgent,
    clearAgent,
  };
});
