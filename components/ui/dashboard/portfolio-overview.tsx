'use client';

import { usePortfolioData } from '@/app/hooks/usePortfolioData';
import { Card } from '@/components/ui/auth-forms/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortfolioOverview() {
  const {
    loading,
    error,
    portfolioValue,
    cashBalance,
    totalValue,
    dailyChange,
    dailyChangePercent
  } = usePortfolioData();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-6 w-[120px]" />
          </Card>
        ))}
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

  const cards = [
    {
      title: 'Total Portfolio Value',
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: dailyChangePercent,
      changeValue: dailyChange
    },
    {
      title: 'Invested Value',
      value: `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Cash Balance',
      value: `$${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: "Today's Change",
      value: `$${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: dailyChangePercent,
      prefix: dailyChange >= 0 ? '+' : '-'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i} className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {card.title}
          </h3>
          <div className="text-2xl font-bold">
            {card.prefix}{card.value}
          </div>
          {card.change !== undefined && (
            <div className={`text-sm mt-1 ${card.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change).toFixed(2)}%
              {card.changeValue && (
                <span className="ml-1">
                  (${Math.abs(card.changeValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
} 