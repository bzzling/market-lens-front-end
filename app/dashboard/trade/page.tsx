'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/auth-forms/card';
import StockSearch from '@/components/ui/trade/stock-search';
import { getStockPrice, isMarketOpen } from '../../lib/stock-utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TradePage() {
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [marketClosed, setMarketClosed] = useState(false);

  useEffect(() => {
    const checkMarketHours = () => {
      setMarketClosed(!isMarketOpen());
    };
    
    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000);
    return () => clearInterval(interval);
  }, []);

  const validateShares = async (shares: number) => {
    if (!price || !ticker) return false;
    
    const supabase = createClientComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      if (orderType === 'sell') {
        const { data: holding } = await supabase
          .from('portfolio_holdings')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('ticker', ticker)
          .single();

        if (!holding) return false;

        const { data: pendingSells } = await supabase
          .from('pending_trades')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('ticker', ticker)
          .eq('transaction_type', 'sell')
          .eq('status', 'pending');

        const totalPendingSells = pendingSells?.reduce((sum, trade) => sum + trade.quantity, 0) || 0;
        return shares <= (holding.quantity - totalPendingSells);
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('cash_balance')
          .eq('user_id', user.id)
          .single();

        if (!profile) return false;

        const { data: pendingBuys } = await supabase
          .from('pending_trades')
          .select('quantity, price, commission')
          .eq('user_id', user.id)
          .eq('transaction_type', 'buy')
          .eq('status', 'pending');

        const reservedFunds = pendingBuys?.reduce((sum, trade) => 
          sum + (trade.quantity * trade.price) + trade.commission, 0) || 0;

        const availableFunds = profile.cash_balance - reservedFunds;
        const commission = 19.99;
        const totalCost = (shares * price) + commission;
        
        return totalCost <= availableFunds;
      }
    } catch (error) {
      console.error('Error validating shares:', error);
      return false;
    }
  };

  const handleQuantityChange = async (value: string) => {
    setQuantity(value);
    if (value && price) {
      const isValid = await validateShares(Number(value));
      if (!isValid) {
        setError(orderType === 'sell' ? 'Insufficient shares for this trade' : 'Insufficient funds for this trade');
      } else {
        setError('');
      }
    }
  };

  const handleSymbolSelect = async (symbol: string) => {
    setTicker(symbol);
    setLoading(true);
    setError('');
    try {
      const stockPrice = await getStockPrice(symbol, false);
      setPrice(stockPrice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock price');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMax = async () => {
    // Validate ticker
    if (!ticker || ticker.trim() === '') {
      return { error: 'Please enter a valid ticker symbol first', maxQuantity: 0 };
    }

    // Validate price
    if (!price || isNaN(price) || price <= 0) {
      return { error: 'Unable to fetch current price or price is invalid', maxQuantity: 0 };
    }
    
    const supabase = createClientComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'Please sign in to continue', maxQuantity: 0 };
    }

    try {
      if (orderType === 'sell') {
        // For sell orders, check current holdings
        const { data: holding, error: holdingError } = await supabase
          .from('portfolio_holdings')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('ticker', ticker)
          .single();

        if (holdingError || !holding) {
          return { error: 'No shares available to sell', maxQuantity: 0 };
        }

        // Check pending sell orders
        const { data: pendingSells, error: pendingError } = await supabase
          .from('pending_trades')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('ticker', ticker)
          .eq('transaction_type', 'sell')
          .eq('status', 'pending');

        if (pendingError) {
          return { error: 'Unable to calculate available shares', maxQuantity: 0 };
        }

        const totalPendingSells = pendingSells?.reduce((sum, trade) => sum + trade.quantity, 0) || 0;
        const availableShares = Math.max(0, holding.quantity - totalPendingSells);
        
        if (availableShares === 0) {
          return { error: 'No shares available to sell after pending orders', maxQuantity: 0 };
        }
        
        return { error: '', maxQuantity: availableShares };

      } else {
        // For buy orders
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('cash_balance')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile || !profile.cash_balance) {
          return { error: 'Unable to fetch account balance', maxQuantity: 0 };
        }

        // Get pending buy orders to calculate reserved funds
        const { data: pendingBuys, error: pendingError } = await supabase
          .from('pending_trades')
          .select('quantity, price, commission')
          .eq('user_id', user.id)
          .eq('transaction_type', 'buy')
          .eq('status', 'pending');

        if (pendingError) {
          return { error: 'Unable to calculate available funds', maxQuantity: 0 };
        }

        const reservedFunds = pendingBuys?.reduce((sum, trade) => 
          sum + (trade.quantity * trade.price) + trade.commission, 0) || 0;

        const availableFunds = profile.cash_balance - reservedFunds;
        const commission = 19.99;
        
        if (availableFunds <= commission) {
          return { error: 'Insufficient funds for trading', maxQuantity: 0 };
        }

        const maxShares = Math.floor((availableFunds - commission) / price);
        
        if (maxShares === 0) {
          return { error: 'Insufficient funds to buy any shares', maxQuantity: 0 };
        }
        
        return { error: '', maxQuantity: maxShares };
      }
    } catch (error) {
      console.error('Error calculating max shares:', error);
      return { error: 'Failed to calculate maximum shares', maxQuantity: 0 };
    }
  };

  const handleSubmitOrder = async (order: {
    ticker: string;
    quantity: number;
    price: number;
    type: 'buy' | 'sell';
  }) => {
    const supabase = createClientComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('Please sign in to continue');
      return;
    }

    try {
      await supabase.from('pending_trades').insert({
        user_id: user.id,
        ticker: order.ticker,
        transaction_type: order.type,
        quantity: order.quantity,
        price: order.price,
        commission: 19.99,
        status: 'pending'
      });
      setSuccess('Order submitted successfully!');
      // Reset form
      setTicker('');
      setPrice(null);
      setQuantity('');
    } catch (error) {
      console.error('Error submitting order:', error);
      setError('Failed to submit order');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Trade Stocks</h1>
      
      {marketClosed && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg">
          Market is closed. Trading hours are 9:30 AM - 4:00 PM ET, Monday-Friday
        </div>
      )}
    
      
      <Card className="p-6">
        <div className="space-y-6">
          <StockSearch 
            onSelect={handleSymbolSelect}
            currentPrice={price}
            onShowMax={handleShowMax}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            action={orderType}
            onActionChange={(value) => setOrderType(value)}
            onSubmitOrder={handleSubmitOrder}
            isSearching={loading}
          />
        </div>
      </Card>
      {success && (
        <div className="mt-4 p-3 bg-green-500/10 text-green-500 rounded-lg">
          {success}
        </div>
      )}
    </div>
  );
}