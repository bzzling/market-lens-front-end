import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getStockPrice } from '../lib/stock-utils';
import { getUserProfile, getUserPortfolio } from '../lib/supabase-utils';

export function usePortfolioData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [dailyChangePercent, setDailyChangePercent] = useState(0);
  const [annualReturn, setAnnualReturn] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Not authenticated');
          return;
        }

        // Get user profile for cash balance
        const profile = await getUserProfile(user.id);
        if (!profile) {
          setError('Profile not found');
          return;
        }
        setCashBalance(profile.cash_balance);

        // Get holdings and calculate total value
        const holdings = await getUserPortfolio(user.id);
        let totalPortfolioValue = 0;
        let previousDayValue = 0;

        for (const holding of holdings) {
          const currentPrice = await getStockPrice(holding.ticker);
          totalPortfolioValue += currentPrice * holding.quantity;
          
          // Get yesterday's closing price from price history
          const { data: yesterdayPrice } = await supabase
            .from('stock_price_history')
            .select('price')
            .eq('ticker', holding.ticker)
            .order('timestamp', { ascending: false })
            .limit(1);
            
          if (yesterdayPrice?.[0]) {
            previousDayValue += yesterdayPrice[0].price * holding.quantity;
          }
        }

        setPortfolioValue(totalPortfolioValue);
        setTotalValue(totalPortfolioValue + profile.cash_balance);
        
        const change = totalPortfolioValue - previousDayValue;
        setDailyChange(change);
        setDailyChangePercent((change / previousDayValue) * 100);

        // Calculate annualized return
        const { data: firstTransaction } = await supabase
          .from('transactions')
          .select('executed_at')
          .eq('user_id', user.id)
          .order('executed_at', { ascending: true })
          .limit(1);

        if (firstTransaction?.[0]) {
          const daysSinceStart = (new Date().getTime() - new Date(firstTransaction[0].executed_at).getTime()) / (1000 * 60 * 60 * 24);
          const totalReturn = ((totalValue - 100000) / 100000) * 100;
          // Annualize the return: (1 + r)^(365/days) - 1
          const annualizedReturn = (Math.pow(1 + (totalReturn / 100), 365 / daysSinceStart) - 1) * 100;
          setAnnualReturn(annualizedReturn);
        } else {
          setAnnualReturn(0); // No transactions yet means no return
        }

      } catch (err) {
        setError('Failed to fetch portfolio data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return {
    loading,
    error,
    portfolioValue,
    cashBalance,
    totalValue,
    dailyChange,
    dailyChangePercent,
    annualReturn
  };
} 