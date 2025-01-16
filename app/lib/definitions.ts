export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  balance: number;
};

export type Stock = {
  ticker: string;
  price: number;
  change: number;
};

export type StockHistorical = {
  ticker: string;
  price: number;
  date: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  executed_at: string;
  created_at: string;
};

export type Balance = {
  id: string;
  quantity: number;
};

// Database types that match Supabase schema
export type UserProfile = {
  id: string;
  user_id: string;
  cash_balance: number;
  created_at: string;
  updated_at: string;
};

export type PortfolioHolding = {
  id: string;
  user_id: string;
  ticker: string;
  quantity: number;
  average_price: number;
  last_updated: string;
  created_at: string;
};