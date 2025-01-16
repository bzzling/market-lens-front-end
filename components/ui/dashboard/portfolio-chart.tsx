'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/auth-forms/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const timeRanges = [
  { label: '1W', value: '1week', days: 7 },
  { label: '1M', value: '1month', days: 30 },
  { label: '3M', value: '3months', days: 90 },
  { label: '6M', value: '6months', days: 180 },
  { label: '1Y', value: '1year', days: 365 },
];

export default function PortfolioChart() {
  const [selectedRange, setSelectedRange] = useState('1month');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioHistory = async () => {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const selectedTimeRange = timeRanges.find(r => r.value === selectedRange);
      if (!selectedTimeRange) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - selectedTimeRange.days);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('executed_at', startDate.toISOString())
        .order('executed_at', { ascending: true });

      if (!transactions || transactions.length === 0) {
        const dates = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - selectedTimeRange.days);
        
        for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d).toLocaleDateString());
        }
        
        setChartData(dates.map(date => ({
          date,
          value: 100000
        })));
        setLoading(false);
        return;
      }

      const tickers = [...new Set(transactions.map(t => t.ticker))];
      const priceHistoryPromises = tickers.map(ticker => 
        supabase
          .from('stock_price_history')
          .select('*')
          .eq('ticker', ticker)
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true })
      );

      const priceHistories = await Promise.all(priceHistoryPromises);
      
      const portfolioValues = new Map<string, number>();
      let currentHoldings = new Map<string, { quantity: number, avgPrice: number }>();

      transactions.forEach(transaction => {
        const date = new Date(transaction.executed_at).toLocaleDateString();
        const { ticker, quantity, price, type } = transaction;

        const holding = currentHoldings.get(ticker) || { quantity: 0, avgPrice: 0 };
        if (type === 'buy') {
          const newQuantity = holding.quantity + quantity;
          const newAvgPrice = ((holding.quantity * holding.avgPrice) + (quantity * price)) / newQuantity;
          currentHoldings.set(ticker, { quantity: newQuantity, avgPrice: newAvgPrice });
        } else {
          currentHoldings.set(ticker, { 
            quantity: holding.quantity - quantity, 
            avgPrice: holding.avgPrice 
          });
        }

        let totalValue = 0;
        currentHoldings.forEach((holding, ticker) => {
          const priceHistory = priceHistories.find(ph => 
            ph.data?.some(p => p.ticker === ticker)
          )?.data;
          
          if (priceHistory) {
            const latestPrice = priceHistory
              .filter(p => new Date(p.timestamp) <= new Date(transaction.executed_at))
              .pop()?.price || 0;
            
            totalValue += holding.quantity * latestPrice;
          }
        });

        portfolioValues.set(date, totalValue);
      });

      for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString();
        if (!portfolioValues.has(dateStr)) {
          const prevValue = [...portfolioValues.keys()]
            .filter(date => new Date(date) < d)
            .sort()
            .pop();
          portfolioValues.set(dateStr, prevValue ? portfolioValues.get(prevValue)! : 100000);
        }
      }

      const chartData = Array.from(portfolioValues.entries()).map(([date, value]) => ({
        date,
        value
      }));

      setChartData(chartData);
      setLoading(false);
    };

    fetchPortfolioHistory();
  }, [selectedRange]);

  if (loading) {
    return (
      <Card className="h-[400px] lg:h-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
          <div className="h-[300px] bg-zinc-800 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[400px] lg:h-[calc(100vh-20rem)] p-6">
      <div className="h-full flex flex-col">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <div className="flex gap-2 overflow-x-auto">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedRange(range.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedRange === range.value
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full h-[calc(100%-5rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                hide={true}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#666' }}
                tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                domain={[
                  (dataMin: number) => Math.floor(dataMin * 0.95),
                  (dataMax: number) => Math.ceil(dataMax * 1.05)
                ]}
                padding={{ top: 20, bottom: 20 }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000',
                  border: '1px solid #333',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: '#666' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}