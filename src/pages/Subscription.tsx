
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { SubscriptionPlans } from '@/components/subscription/subscription-plans';
import { useSubscription } from '@/hooks/use-subscription';

const SubscriptionPage = () => {
  const { subscription, upgradeToPro, downgradeToFree } = useSubscription();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Assinatura</h1>
          </header>
          
          <main className="flex-1 p-6">
            <SubscriptionPlans 
              currentSubscription={subscription}
              onUpgradeToPro={upgradeToPro}
              onDowngradeToFree={downgradeToFree}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SubscriptionPage;
