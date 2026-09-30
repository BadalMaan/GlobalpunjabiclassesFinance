import type { Member, Transaction } from "./types";

export const demoMembers: Member[] = [
  { id: "badal", name: "Badal Maan", email: "badal@example.com", mobile: "", share_percentage: 25 },
  { id: "jasnoor", name: "Jasnoor", email: "jasnoor@example.com", mobile: "", share_percentage: 25 },
  { id: "ranjot", name: "Ranjot Singh", email: "ranjot@example.com", mobile: "", share_percentage: 50 },
];

export const demoTransactions: Transaction[] = [
  { id: "1", type: "income", description: "Jessica fee received", amount: 1562.35, date: "2026-10-02", created_by: "Ranjot Singh" },
  { id: "2", type: "income", description: "Monthly fee received", amount: 234.43, date: "2026-10-04", created_by: "Badal Maan" },
  { id: "3", type: "expense", description: "Zoom Subscription", amount: 2000, date: "2026-10-05", created_by: "Jasnoor" },
  { id: "4", type: "expense", description: "Marketing", amount: 3000, date: "2026-10-07", created_by: "Ranjot Singh" },
];