import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Transaction, PortfolioHolding, UserProfile } from './definitions';

export async function executeTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'executed_at'>
) {
  const supabase = createClientComponentClient();
  const { user_id, ticker, type, quantity, price, total_amount } = transaction;

  // Start a Supabase transaction
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // 1. Get current portfolio holding
  const { data: holding } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', user_id)
    .eq('ticker', ticker)
    .single();

  // 2. Get user profile for cash balance
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (!profile) throw new Error('User profile not found');

  // Validate transaction
  if (type === 'buy') {
    if (profile.cash_balance < total_amount) {
      throw new Error('Insufficient funds');
    }
  } else if (type === 'sell') {
    if (!holding || holding.quantity < quantity) {
      throw new Error('Insufficient shares');
    }
  }

  // 3. Insert transaction record
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert([transaction]);

  if (transactionError) throw transactionError;

  // 4. Update portfolio holding
  if (holding) {
    const newQuantity = type === 'buy' 
      ? holding.quantity + quantity 
      : holding.quantity - quantity;
    
    const newAveragePrice = type === 'buy'
      ? ((holding.average_price * holding.quantity) + (price * quantity)) / (holding.quantity + quantity)
      : holding.average_price;

    if (newQuantity === 0) {
      await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('id', holding.id);
    } else {
      await supabase
        .from('portfolio_holdings')
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          last_updated: new Date().toISOString(),
        })
        .eq('id', holding.id);
    }
  } else if (type === 'buy') {
    await supabase
      .from('portfolio_holdings')
      .insert([{
        user_id,
        ticker,
        quantity,
        average_price: price,
      }]);
  }

  // 5. Update user's cash balance
  const newBalance = type === 'buy'
    ? profile.cash_balance - total_amount
    : profile.cash_balance + total_amount;

  await supabase
    .from('user_profiles')
    .update({ cash_balance: newBalance })
    .eq('user_id', user_id);

  return { success: true };
}

export async function getUserPortfolio(userId: string) {
  const supabase = createClientComponentClient();

  const { data: holdings } = await supabase
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', userId);

  return holdings || [];
}

export async function getUserTransactions(userId: string) {
  const supabase = createClientComponentClient();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('executed_at', { ascending: false });

  return transactions || [];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClientComponentClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return profile;
} 