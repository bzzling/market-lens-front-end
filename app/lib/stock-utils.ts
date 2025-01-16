import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const API_BASE_URL = 'http://3.142.98.113/api';

async function cachePrice(supabase: any, ticker: string, price: number, source: string, isTransaction: boolean = false) {
  const now = new Date().toISOString();
  
  // Update current cache
  await supabase
    .from('stock_price_cache')
    .upsert(
      { 
        ticker, 
        price,
        timestamp: now,
        source,
        is_transaction: isTransaction
      },
      { onConflict: 'ticker' }
    );
  
  // Add to history
  await supabase
    .from('stock_price_history')
    .insert([{ 
      ticker, 
      price,
      timestamp: now,
      source,
      is_transaction: isTransaction
    }]);
}

async function getQuickPrice(ticker: string) {
  const response = await axios.get(`${API_BASE_URL}/twelve/price/${ticker}`);
  return Number(response.data.price);
}

async function getRealTimePrice(ticker: string) {
  const response = await axios.get(`${API_BASE_URL}/rapid/price/${ticker}`);
  return Number(response.data.price);
}

async function getHistoricalPrice(ticker: string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const response = await axios.get(
    `${API_BASE_URL}/polygon/${ticker}/${yesterday.toISOString().split('T')[0]}/${today.toISOString().split('T')[0]}`
  );
  return response.data.results?.[0]?.c || 0;
}

export async function getStockPrice(ticker: string, forTransaction: boolean = false) {
  const supabase = createClientComponentClient();
  const CACHE_DURATION = 300; // 5 minutes in seconds

  if (forTransaction) {
    const price = await getRealTimePrice(ticker);
    await cachePrice(supabase, ticker, price, 'rapid', true);
    return price;
  }

  const { data: cachedPrice } = await supabase
    .from('stock_price_cache')
    .select('price, timestamp')
    .eq('ticker', ticker)
    .single();

  if (cachedPrice) {
    const cacheAge = (Date.now() - new Date(cachedPrice.timestamp).getTime()) / 1000;
    if (cacheAge < CACHE_DURATION) {
      return cachedPrice.price;
    }
  }

  try {
    const price = await getQuickPrice(ticker);
    await cachePrice(supabase, ticker, price, 'twelve');
    return price;
  } catch (error) {
    const price = await getHistoricalPrice(ticker);
    await cachePrice(supabase, ticker, price, 'polygon');
    return price;
  }
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const currentTime = hour * 60 + minute;

  // Market is closed on weekends (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) return false;

  // Market is open 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;     // 4:00 PM

  return currentTime >= marketOpen && currentTime < marketClose;
} 