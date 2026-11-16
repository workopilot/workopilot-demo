import type { AgentTool, DataPlugin } from '#/types/tools-data';

import {
  createMockResponse,
  mockAgentTools,
  mockDataPlugins,
  mockDelay,
} from './mock-data-tools';

// Agent Tools APIs
export async function getAgentToolsApi() {
  await mockDelay();
  return createMockResponse(mockAgentTools);
}

export async function createAgentToolApi(data: Partial<AgentTool>) {
  await mockDelay();
  const newTool: AgentTool = {
    id: String(Date.now()),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  } as AgentTool;
  mockAgentTools.push(newTool);
  return createMockResponse(newTool);
}

export async function updateAgentToolApi(id: string, data: Partial<AgentTool>) {
  await mockDelay();
  const index = mockAgentTools.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockAgentTools[index] = {
      ...mockAgentTools[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockAgentTools[index]);
  }
  throw new Error('Tool not found');
}

export async function deleteAgentToolApi(id: string) {
  await mockDelay();
  const index = mockAgentTools.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockAgentTools.splice(index, 1);
  }
  return createMockResponse(null);
}

// Data Plugins APIs
export async function getDataPluginsApi() {
  await mockDelay();
  return createMockResponse(mockDataPlugins);
}

export async function createDataPluginApi(data: Partial<DataPlugin>) {
  await mockDelay();
  const newPlugin: DataPlugin = {
    id: String(Date.now()),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  } as DataPlugin;
  mockDataPlugins.push(newPlugin);
  return createMockResponse(newPlugin);
}

export async function updateDataPluginApi(
  id: string,
  data: Partial<DataPlugin>,
) {
  await mockDelay();
  const index = mockDataPlugins.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockDataPlugins[index] = {
      ...mockDataPlugins[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return createMockResponse(mockDataPlugins[index]);
  }
  throw new Error('Plugin not found');
}

export async function deleteDataPluginApi(id: string) {
  await mockDelay();
  const index = mockDataPlugins.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockDataPlugins.splice(index, 1);
  }
  return createMockResponse(null);
}
