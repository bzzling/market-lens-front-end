'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/auth-forms/button';

type PendingTrade = {
  id: string;
  ticker: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  commission: number;
  status: string;
  created_at: string;
};

export default function PendingTrades() {
  const [trades, setTrades] = useState<PendingTrade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingTrades = async () => {
    const supabase = createClientComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: trades } = await supabase
      .from('pending_trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (trades) {
      setTrades(trades);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    setLoading(true);
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('pending_trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;
      await fetchPendingTrades();
    } catch (error) {
      console.error('Error canceling trade:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTrades();
    const interval = setInterval(fetchPendingTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  if (trades.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 mt-6">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold">Pending Trades</h2>
      </div>
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="h-12 px-4 text-left align-middle font-medium">Symbol</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
              <th className="h-12 px-4 text-right align-middle font-medium">Quantity</th>
              <th className="h-12 px-4 text-right align-middle font-medium">Price</th>
              <th className="h-12 px-4 text-right align-middle font-medium">Total</th>
              <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-zinc-800">
                <td className="p-4">{trade.ticker}</td>
                <td className="p-4">
                  <span className={trade.transaction_type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                    {trade.transaction_type.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right">{trade.quantity}</td>
                <td className="p-4 text-right">${trade.price.toFixed(2)}</td>
                <td className="p-4 text-right">
                  ${((trade.quantity * trade.price) + trade.commission).toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-red-400 h-7 px-2 text-xs"
                    onClick={() => handleCancelTrade(trade.id)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 