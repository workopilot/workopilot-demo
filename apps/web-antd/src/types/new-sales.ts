export type SalesKind =
  | "leads"
  | "customers"
  | "contacts"
  | "deals"
  | "quotes"
  | "tasks"
  | "activities"
  | "products"
  | "files"
  | "plans";
export interface SalesRecord {
  id: string;
  name: string;
  status: string;
  owner: string;
  customerId?: string;
  customerName?: string;
  dealId?: string;
  contact?: string;
  phone?: string;
  email?: string;
  industry?: string;
  region?: string;
  source?: string;
  amount?: number;
  date?: string;
  note?: string;
  occurredAt?: string;
  stageEnteredAt?: string;
  historyMigrated?: boolean;
  attachments?: { name: string; size: number; type: string }[];
  role?: string;
  version?: number;
  category?: string;
  tracking?: boolean;
  profile?: string;
  lines?: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}
export interface SalesTracking {
  id: string;
  kind: SalesKind;
  recordId: string;
  name: string;
  condition: string;
  active: boolean;
  lastRun: string;
}
