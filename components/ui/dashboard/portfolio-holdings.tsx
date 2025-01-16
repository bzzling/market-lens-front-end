'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getStockPrice } from '../../../app/lib/stock-utils';
import { PortfolioHolding } from '../../../app/lib/definitions';
import { getUserPortfolio } from '../../../app/lib/supabase-utils';
import PendingTrades from './pending-trades';

type EnhancedHolding = PortfolioHolding & {
  currentPrice: number;
  todaysChange: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  name?: string;
};

export default function PortfolioHoldings() {
  const [holdings, setHoldings] = useState<EnhancedHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('User not authenticated');
          return;
        }

        // Get base holdings data
        const portfolioHoldings = await getUserPortfolio(user.id);
        
        // Enhance holdings with current prices and calculations
        const enhancedHoldings = await Promise.all(
          portfolioHoldings.map(async (holding) => {
            const currentPrice = await getStockPrice(holding.ticker);
            const totalValue = currentPrice * holding.quantity;
            const totalGainLoss = totalValue - (holding.average_price * holding.quantity);
            const totalGainLossPercent = ((currentPrice - holding.average_price) / holding.average_price) * 100;

            return {
              ...holding,
              currentPrice,
              todaysChange: 0, // TODO: need to implement this with historical data
              totalValue,
              totalGainLoss,
              totalGainLossPercent
            };
          })
        );

        setHoldings(enhancedHoldings);
      } catch (err) {
        console.error('Error fetching holdings:', err);
        setError('Failed to fetch portfolio holdings');
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
    
    const interval = setInterval(fetchHoldings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-zinc-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-zinc-800">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold">Portfolio Holdings</h2>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="h-12 px-4 text-left align-middle font-medium">Symbol</th>
                <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">Name</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Current Price</th>
                <th className="h-12 px-4 text-right align-middle font-medium hidden sm:table-cell">Today's Change</th>
                <th className="h-12 px-4 text-right align-middle font-medium hidden lg:table-cell">Avg Price</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Quantity</th>
                <th className="h-12 px-4 text-right align-middle font-medium hidden sm:table-cell">Market Value</th>
                <th className="h-12 px-4 text-right align-middle font-medium hidden md:table-cell">Total Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-400">
                    You have no stock holdings yet
                  </td>
                </tr>
              ) : (
                holdings.map((holding) => (
                  <tr key={holding.ticker} className="border-b border-zinc-800">
                    <td className="p-4">{holding.ticker}</td>
                    <td className="p-4 hidden md:table-cell">{holding.name || '-'}</td>
                    <td className="p-4 text-right">${holding.currentPrice.toFixed(2)}</td>
                    <td className={`p-4 text-right hidden sm:table-cell ${holding.todaysChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {holding.todaysChange >= 0 ? '+' : ''}{holding.todaysChange.toFixed(2)}%
                    </td>
                    <td className="p-4 text-right hidden lg:table-cell">${holding.average_price.toFixed(2)}</td>
                    <td className="p-4 text-right">{holding.quantity}</td>
                    <td className="p-4 text-right hidden sm:table-cell">${holding.totalValue.toFixed(2)}</td>
                    <td className="p-4 text-right hidden md:table-cell">
                      <div className={`${holding.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${Math.abs(holding.totalGainLoss).toFixed(2)}
                        <span className="ml-1">
                          ({holding.totalGainLoss >= 0 ? '+' : ''}{holding.totalGainLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <PendingTrades />
    </>
  );
}