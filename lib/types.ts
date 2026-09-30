export type Member = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  share_percentage: number;
  avatar_url?: string | null;
};

export type Transaction = {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
  created_by: string;
};