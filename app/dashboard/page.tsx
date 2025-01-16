import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DashboardCards from '@/components/ui/dashboard/cards';
import Greeting from '@/components/ui/dashboard/greeting';
import PortfolioChart from '@/components/ui/dashboard/portfolio-chart';
import PortfolioHoldings from '@/components/ui/dashboard/portfolio-holdings';

async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.preferred_name || user?.user_metadata?.name || 'Unknown Infiltrator';
  } catch (error) {
    console.error('Error fetching user:', error);
    return 'Unknown Infiltrator';
  }
}

export default async function Page() {
  const name = await getUser();

  return (
    <main className="flex-1">
      <div className="flex items-center justify-between space-y-2">
        <Greeting name={name} />
      </div>
      <div className="space-y-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 grid grid-cols-1 gap-4">
            <DashboardCards />
          </div>
          <div className="lg:col-span-8">
            <PortfolioChart />
          </div>
        </div>
        <div className="grid gap-4">
          <PortfolioHoldings />
        </div>
      </div>
    </main>
  );
}