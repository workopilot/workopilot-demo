import type {
  ContractChatSession,
  ContractRelatedItem,
  ContractReminderRecord,
} from '#/types/contract-assistant';

import { mockContractRelatedItems } from './mock-data';

export const contractArchives = new Map<string, ContractChatSession>();
export const contractChatSessions = new Map<string, ContractChatSession>();
export const contractReminderRecords = new Map<
  string,
  ContractReminderRecord[]
>();
export const relatedContractItems = new Map<string, ContractRelatedItem[]>(
  Object.entries(structuredClone(mockContractRelatedItems)),
);
export const contractNow = () =>
  new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
export const contractToday = () => contractNow().slice(0, 10);
export function rawContract(id: string) {
  const item = contractArchives.get(id);
  if (!item) throw new Error('合同不存在或已移除');
  return item;
}
