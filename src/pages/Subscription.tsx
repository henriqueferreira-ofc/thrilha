
import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
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

  // Verificar status da assinatura ao carregar a página ou quando sucesso=true na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true' || !subscription) {
      checkSubscriptionStatus();
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TaskSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="p-6 flex justify-between items-center border-b border-white/10">
            <h1 className="text-xl font-bold">Assinatura</h1>
          </header>
          
          <main className="flex-1 p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando informações de assinatura...</span>
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
