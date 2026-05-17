
import React, { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TaskSidebar } from '@/components/task-sidebar';
import { SubscriptionPlans } from '@/components/subscription/subscription-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { Loader2 } from 'lucide-react';

const SubscriptionPage = () => {
  const { 
    subscription, 
    loading, 
    checkingOut,
    isPro,
    upgradeToPro, 
    downgradeToFree,
    checkSubscriptionStatus,
    manageSubscription
  } = useSubscription();



  return (
    <SidebarProvider>
      <div className="page-wrapper mountain-pattern">
        <TaskSidebar hideDefaultTrigger />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="page-header backdrop-blur-sm bg-black/20">
            <div className="flex items-center gap-3 text-white min-w-0 flex-1">
              <SidebarTrigger className="md:hidden h-10 w-10 text-white/90 [&>svg]:h-6 [&>svg]:w-6" aria-label="Abrir menu" />
              <h1 className="text-xl font-bold purple-gradient-text truncate">Assinatura</h1>
            </div>
          </header>
          
          <main className="page-main">
            {loading ? (
              <div className="flex flex-col sm:flex-row justify-center items-center h-full gap-2 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Carregando informações de assinatura...</span>
              </div>
            ) : (
              <SubscriptionPlans 
                currentSubscription={subscription}
                onUpgradeToPro={upgradeToPro}
                onDowngradeToFree={downgradeToFree}
                onManageSubscription={manageSubscription}
                checkingOut={checkingOut}
              />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SubscriptionPage;
