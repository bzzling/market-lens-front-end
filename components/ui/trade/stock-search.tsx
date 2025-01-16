import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Input from '@/components/ui/auth-forms/input';
import { Button } from '@/components/ui/auth-forms/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type StockResult = {
  symbol: string;
  name: string;
  type: string;
  exchangeShortName: string;
};

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  currentPrice: number | null;
  onShowMax: () => Promise<{ error: string; maxQuantity: number }>;
  quantity: string;
  onQuantityChange: (value: string) => void;
  action: 'buy' | 'sell';
  onActionChange: (value: 'buy' | 'sell') => void;
  onSubmitOrder: (order: any) => void;
  isSearching: boolean;
}

const API_BASE_URL = 'http://3.142.98.113/api';

export default function StockSearch({ onSelect, currentPrice, onShowMax, quantity, onQuantityChange, action, onActionChange, onSubmitOrder, isSearching }: StockSearchProps) {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<StockResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const searchStocks = async () => {
      if (!value) {
        setResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(value)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setResults(data.slice(0, 4) || []); // Only show top 4 results
      } catch (error) {
        console.error('Error searching stocks:', error);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounce);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.search-container')) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleShowMax = async () => {
    if (!value) {
      setError('Please enter a ticker symbol first');
      return;
    }
    
    try {
      const result = await onShowMax();
      if (result.error) {
        setError(result.error);
        onQuantityChange('0');
      } else {
        setError('');
        onQuantityChange(String(result.maxQuantity));
      }
    } catch (error) {
      console.error('Error calculating max quantity:', error);
      setError('Error calculating maximum quantity');
      onQuantityChange('0');
    }
  };

  const handlePreviewOrder = async () => {
    if (!value) {
      setError('Please enter a ticker symbol');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (!currentPrice) {
      setError('Unable to fetch current price');
      return;
    }

    const totalCost = (Number(quantity) * currentPrice) + commission;

    try {
      if (action === 'buy') {
        const { maxQuantity } = await onShowMax();
        const maxAfterCommission = Math.floor(maxQuantity - (commission / currentPrice));
        
        if (Number(quantity) > maxAfterCommission) {
          setError('Insufficient funds for this purchase');
          return;
        }
      } else {
        const supabase = createClientComponentClient();
        const { data: holding } = await supabase
          .from('portfolio_holdings')
          .select('quantity')
          .eq('ticker', value)
          .single();

        if (!holding || Number(quantity) > holding.quantity) {
          setError('Insufficient shares for this sale');
          return;
        }
      }
      
      setError('');
      setShowPreview(true);
    } catch (error) {
      console.error('Error validating order:', error);
      setError('Error validating order');
    }
  };

  const handleSubmitOrder = async () => {
    if (!currentPrice || !value || !quantity) return;
    
    try {
      await onSubmitOrder({
        ticker: value,
        quantity: Number(quantity),
        price: currentPrice,
        type: action
      });
      setShowPreview(false);
      setValue('');
      onQuantityChange('');
    } catch (error) {
      setError('Failed to submit order');
    }
  };

  const commission = 19.99;
  const estimatedTotal = currentPrice ? (Number(quantity) * currentPrice) + commission : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        <div className="search-container relative">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Look up Symbol/Ticker"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setShowResults(true)}
              disabled={isSearching}
              className="pl-8 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
            {showResults && (results.length > 0 || searchLoading) && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
                {searchLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                ) : (
                  results.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => {
                        setValue(stock.symbol);
                        onSelect(stock.symbol);
                        setResults([]);
                        setShowResults(false);
                      }}
                      className="cursor-pointer p-2 text-sm hover:bg-accent"
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Action</label>
          <Select value={action} onValueChange={(value) => onActionChange(value as 'buy' | 'sell')}>
            <SelectTrigger>
              <SelectValue>{action === 'buy' ? 'Buy' : 'Sell'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Quantity</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              min="0"
              className="flex-1"
            />
            <Button variant="outline" onClick={handleShowMax}>Show Max</Button>
          </div>
        </div>
      </div>

      <div className="min-h-[20px] text-sm">
        {error && <p className="text-red-500">{error}</p>}
      </div>

      {!showPreview ? (
        <Button 
          onClick={handlePreviewOrder}
          className="w-full bg-white text-black hover:bg-gray-100"
        >
          Preview Order
        </Button>
      ) : (
        <div className="space-y-3 border border-zinc-800 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Estimated Price</span>
            <span>${currentPrice?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Quantity</span>
            <span>{quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Commission</span>
            <span>${commission.toFixed(2)}</span>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="flex justify-between font-medium">
            <span>Estimated Total</span>
            <span>${estimatedTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(false)}
              className="flex-1"
            >
              Modify
            </Button>
            <Button 
              onClick={handleSubmitOrder}
              className="flex-1 bg-white text-black hover:bg-gray-100"
            >
              Submit Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 