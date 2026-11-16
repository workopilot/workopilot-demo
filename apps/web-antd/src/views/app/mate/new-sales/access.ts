import { ref } from "vue";
import { salesDb as db } from "#/api/mock-new-sales";
import type { SalesRecord } from "#/types/new-sales";

// Demo-only shared identity. Production APIs must enforce the same scope.
export const salesRole = ref("sales");
export const currentSales = "王安康";
export function canManageCustomer(c?: SalesRecord) {
  return !!c && (salesRole.value === "director" || c.owner === currentSales);
}
export function canManageDeal(d: SalesRecord) {
  return canManageCustomer(db.customers.find((c) => c.id === d.customerId));
}
export function transferCustomer(c: SalesRecord, owner: string) {
  if (salesRole.value !== "director" && (c.owner || owner !== currentSales))
    return;
  c.owner = owner;
  db.deals
    .filter((d) => d.customerId === c.id)
    .forEach((d) => {
      d.owner = owner;
    });
  db.contacts
    .filter((p) => p.customerId === c.id)
    .forEach((p) => {
      p.owner = owner;
    });
}
