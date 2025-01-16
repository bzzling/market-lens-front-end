'use client';

import { usePortfolioData } from '@/app/hooks/usePortfolioData';
import { Card } from '@/components/ui/auth-forms/card';
import { iconMap } from './icon-map';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardCards() {
  const {
    loading,
    error,
    cashBalance,
    totalValue,
    dailyChange,
    dailyChangePercent,
    annualReturn
  } = usePortfolioData();

  if (loading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 min-w-[200px]">
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-6 w-[120px]" />
          </Card>
        ))}
      </>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const data = {
    accountValue: { 
      label: 'Account Value', 
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      subtext: 'Total Portfolio Value' 
    },
    todaysChange: { 
      label: "Today's Change", 
      value: `${dailyChange >= 0 ? '+' : '-'}$${Math.abs(dailyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      subtext: `${dailyChange >= 0 ? '+' : ''}${dailyChangePercent.toFixed(2)}%`,
      isPositive: dailyChange >= 0
    },
    annualReturn: annualReturn !== null ? { 
      label: 'Annual Return', 
      value: `${annualReturn >= 0 ? '+' : '-'}${Math.abs(annualReturn).toFixed(2)}%`, 
      subtext: 'Year to Date',
      isPositive: annualReturn >= 0
    } : null,
    cash: { 
      label: 'Cash', 
      value: `$${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      subtext: `${((cashBalance / totalValue) * 100).toFixed(2)}% of Account` 
    },
  };

  return (
    <>
      {Object.entries(data).map(([key, data]) => 
        data && (
          <Card key={key} className="p-4 min-w-[200px]">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 min-w-0">
                {(() => {
                  const Icon = iconMap[key as keyof typeof iconMap];
                  return <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />;
                })()}
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium leading-none text-muted-foreground truncate">
                    {data.label}
                  </p>
                  <h3 className={`mt-2 font-bold text-xl truncate ${
                    'isPositive' in data 
                      ? data.isPositive 
                        ? 'text-green-500' 
                        : 'text-red-500'
                      : ''
                  }`}>
                    {data.value}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {data.subtext}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )
      )}
    </>
  );
}
