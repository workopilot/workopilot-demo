import type {
  CollectionTask,
  DataPoolRecord,
} from './mock-data-data-collection';

import { createMockResponse, mockDelay } from './mock-data';
import {
  mockCollectionTasks,
  mockDataPoolRecords,
} from './mock-data-data-collection';

/**
 * 获取采集任务列表
 */
export async function getCollectionTasksApi() {
  await mockDelay();
  return createMockResponse<CollectionTask[]>(mockCollectionTasks);
}

/**
 * 获取数据池记录
 */
export async function getDataPoolRecordsApi() {
  await mockDelay();
  return createMockResponse<DataPoolRecord[]>(mockDataPoolRecords);
}
