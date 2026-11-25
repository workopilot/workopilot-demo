import type {
  EmployeeRecommendation,
  EmployeeRecommendationAction,
  EmployeeRecommendationContext,
} from '#/types/employee-recommendation';

import { mockMateAvailableEmployees } from '#/api/mock-data-mate';

/** Keep recommendations within the supplied, permission-filtered business scope. */
export function availableRecommendations(
  employees: EmployeeRecommendation[],
  currentEmployeeId: string,
) {
  return employees.filter(
    (employee) =>
      employee.id !== currentEmployeeId &&
      employee.actions.length > 0 &&
      mockMateAvailableEmployees.some((item) => item.id === employee.id) &&
      employee.path.startsWith(`/app/mate/employee/${employee.id}/`),
  );
}

export function recommendationDraft(
  context: EmployeeRecommendationContext,
  action: EmployeeRecommendationAction,
) {
  return [
    `来源：${context.title}`,
    `业务编号：${context.businessId}`,
    context.summary,
    '',
    `当前需求：${action.prompt}`,
  ].join('\n');
}

export function recommendationEmployee(
  id: string,
  reason: string,
  actions: EmployeeRecommendationAction[],
): EmployeeRecommendation {
  const employee = mockMateAvailableEmployees.find((item) => item.id === id);
  return {
    id,
    name: employee?.name ?? '数字员工',
    role: employee?.role ?? '',
    avatar: employee?.avatar,
    path: employee?.menus[0]?.path ?? '',
    reason,
    actions,
  };
}
