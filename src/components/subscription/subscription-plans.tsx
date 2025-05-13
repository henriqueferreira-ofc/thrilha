
import { useState } from 'react';
import { PlanCard } from './plan-card';
import { SubscriptionPlan } from '@/types/board';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  currentSubscription: SubscriptionPlan | null;
  onUpgradeToPro: () => Promise<boolean>;
  onDowngradeToFree: () => Promise<boolean>;
}

export function SubscriptionPlans({
  currentSubscription,
  onUpgradeToPro,
  onDowngradeToFree
}: SubscriptionPlansProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isPro = currentSubscription?.plan_type === 'pro';

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgradeToPro();
    } catch (error) {
      toast.error('Ocorreu um erro ao atualizar seu plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsLoading(true);
    try {
      await onDowngradeToFree();
    } catch (error) {
      toast.error('Ocorreu um erro ao alterar seu plano');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 ">
      <PlanCard
        title="Gratuito"
        price="Grátis"
        description="Para uso pessoal e pequenos projetos"
        features={[
          { name: "Até 3 quadros", included: true },
          { name: "Tarefas ilimitadas por quadro", included: true },
          { name: "Acompanhamento de prazos", included: true },
          { name: "Colaboração básica", included: true },
          { name: "Quadros ilimitados", included: false },
          { name: "Prioridade no suporte", included: false }
        ]}
        isCurrentPlan={!isPro}
        actionLabel={isPro ? "Fazer Downgrade" : "Plano Atual"}
        onAction={handleDowngrade}
        disabled={isLoading || !isPro}
      />
      <PlanCard
        title="Pro"
        price="R$19,90"
        description="Para profissionais e equipes"
        features={[
          { name: "Quadros ilimitados", included: true },
          { name: "Tarefas ilimitadas por quadro", included: true },
          { name: "Acompanhamento de prazos", included: true },
          { name: "Colaboração avançada", included: true },
          { name: "Prioridade no suporte", included: true },
          { name: "Exportação de relatórios", included: true }
        ]}
        isCurrentPlan={isPro}
        actionLabel={isPro ? "Plano Atual" : "Fazer Upgrade"}
        onAction={handleUpgrade}
        disabled={isLoading || isPro}
      />
    </div>
  );
}
