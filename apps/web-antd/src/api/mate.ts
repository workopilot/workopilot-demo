import type {
  MateAutomationLog,
  MateAutomationTask,
  MateChatSession,
  MateFile,
  MateMessage,
  MateStats,
} from '#/types/mate';

import {
  mockDelay,
  mockMateAutomationTasks,
  mockMateChatSessions,
  mockMateEmployees,
  mockMateFiles,
  mockMateLogs,
  mockMateMessages,
} from './mock-data-mate';

const response = <T>(data: T) => ({ code: 0, data, message: 'success' });

export async function getMateEmployeesApi() {
  await mockDelay();
  return response(mockMateEmployees);
}

export async function getMateEmployeeMessagesApi(employeeId: string) {
  await mockDelay(120);
  return response(mockMateMessages[employeeId] || []);
}

export async function getMateChatSessionsApi(employeeId: string) {
  await mockDelay(120);
  return response(mockMateChatSessions[employeeId] || []);
}

export async function getMateSessionMessagesApi(
  employeeId: string,
  sessionId: string,
) {
  await mockDelay(100);
  const session = (mockMateChatSessions[employeeId] || []).find(
    (item) => item.id === sessionId,
  );
  return response(session?.messages || []);
}

export async function createMateChatSessionApi(employeeId: string) {
  await mockDelay(140);
  const session: MateChatSession = {
    id: `${employeeId}-session-${Date.now()}`,
    employeeId,
    title: '新对话',
    relativeTime: '刚刚',
    unread: 0,
    messages: [],
  };
  const sessions = (mockMateChatSessions[employeeId] ||= []);
  sessions.unshift(session);
  return response(session);
}

export async function deleteMateChatSessionApi(
  employeeId: string,
  sessionId: string,
) {
  await mockDelay(120);
  const sessions = mockMateChatSessions[employeeId] || [];
  const index = sessions.findIndex((item) => item.id === sessionId);
  if (index !== -1) sessions.splice(index, 1);
  return response(undefined);
}

export async function clearMateChatSessionsApi(employeeId: string) {
  await mockDelay(140);
  mockMateChatSessions[employeeId] = [];
  return response(undefined);
}

export async function sendMateMessageApi(
  employeeId: string,
  content: string,
  _sessionId?: string,
) {
  await mockDelay(500);
  const message: MateMessage = {
    id: `message-${Date.now()}`,
    role: 'assistant',
    content: `已收到你的需求（${content}）。我会结合 ${employeeId} 的业务资料，为你整理一份可执行的结果。`,
    time: '刚刚',
  };
  return response(message);
}

export async function getMateFilesApi() {
  await mockDelay();
  return response(mockMateFiles);
}

export async function createMateFileApi(file: Pick<MateFile, 'name' | 'size'>) {
  await mockDelay(300);
  const created: MateFile = {
    id: `file-${Date.now()}`,
    ...file,
    category: '待分类',
    owner: '当前用户',
    updatedAt: '刚刚',
    status: 'processing',
  };
  mockMateFiles.unshift(created);
  return response(created);
}

export async function deleteMateFileApi(id: string) {
  await mockDelay(180);
  const index = mockMateFiles.findIndex((item) => item.id === id);
  if (index !== -1) mockMateFiles.splice(index, 1);
  return response(undefined);
}

export async function getMateAutomationTasksApi() {
  await mockDelay();
  return response(mockMateAutomationTasks);
}

export async function saveMateAutomationTaskApi(
  data: Omit<MateAutomationTask, 'id'> & { id?: string },
) {
  await mockDelay(260);
  if (data.id) {
    const index = mockMateAutomationTasks.findIndex(
      (item) => item.id === data.id,
    );
    if (index !== -1) {
      const existing = mockMateAutomationTasks[index];
      if (!existing) return response(undefined);
      const updated: MateAutomationTask = {
        ...existing,
        ...data,
        id: data.id,
      };
      mockMateAutomationTasks[index] = updated;
      return response(updated);
    }
  }
  const created = {
    ...data,
    id: `automation-${Date.now()}`,
  } as MateAutomationTask;
  mockMateAutomationTasks.unshift(created);
  return response(created);
}

export async function deleteMateAutomationTaskApi(id: string) {
  await mockDelay(180);
  const index = mockMateAutomationTasks.findIndex((item) => item.id === id);
  if (index !== -1) mockMateAutomationTasks.splice(index, 1);
  return response(undefined);
}

export async function runMateAutomationTaskApi(task: MateAutomationTask) {
  await mockDelay(500);
  const index = mockMateAutomationTasks.findIndex(
    (item) => item.id === task.id,
  );
  if (index !== -1) {
    const existing = mockMateAutomationTasks[index];
    if (existing) {
      mockMateAutomationTasks[index] = {
        ...existing,
        status: 'running',
        lastRun: '刚刚',
      };
    }
  }
  const log: MateAutomationLog = {
    id: `log-${Date.now()}`,
    taskId: task.id,
    taskTitle: task.title,
    status: 'success',
    startedAt: '刚刚',
    duration: '36 秒',
    summary: '模拟执行完成，结果已写入工作台。',
  };
  mockMateLogs.unshift(log);
  return response(log);
}

export async function getMateAutomationLogsApi() {
  await mockDelay();
  return response(mockMateLogs);
}

export function getMateStats(): MateStats {
  return {
    employeeCount: mockMateEmployees.length,
    fileCount: mockMateFiles.length,
    automationCount: mockMateAutomationTasks.length,
    completedCount: mockMateLogs.filter((item) => item.status === 'success')
      .length,
  };
}
