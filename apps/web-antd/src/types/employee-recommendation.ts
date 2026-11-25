/** A recommendation prepares a conversation; it never executes a business action. */
export interface EmployeeRecommendationAction {
  id: string;
  title: string;
  prompt: string;
  icon?: string;
  query?: Record<string, string>;
}

export interface EmployeeRecommendation {
  /** Actual employee ID from mockMateAvailableEmployees, not a presentation-only key. */
  id: string;
  name: string;
  role: string;
  avatar?: string;
  path: string;
  reason: string;
  actions: EmployeeRecommendationAction[];
}

export interface EmployeeRecommendationContext {
  currentEmployeeId: string;
  source: string;
  businessId: string;
  title: string;
  summary: string;
  query?: Record<string, string>;
}

export interface EmployeeHandoff {
  employee: EmployeeRecommendation;
  action: EmployeeRecommendationAction;
  draft: string;
}
