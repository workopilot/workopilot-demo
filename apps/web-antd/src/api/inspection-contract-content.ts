import {
  createMockResponse,
  mockDelay,
  mockInspectionContractDraft,
} from './mock-data';
/** 模拟用户提供一份合同，统一返回从该合同内容收集的字段。 */
export async function provideDemoInspectionContractApi() {
  await mockDelay(150);
  return createMockResponse(structuredClone(mockInspectionContractDraft));
}
