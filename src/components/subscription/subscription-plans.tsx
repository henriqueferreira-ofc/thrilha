
import { useState } from 'react';
import { PlanCard } from './plan-card';
import { SubscriptionPlan } from '@/types/board';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubscriptionPlansProps {
  currentSubscription: SubscriptionPlan | null;
  onUpgradeToPro: () => Promise<boolean>;
  onDowngradeToFree: () => Promise<boolean>;
  onManageSubscription?: () => Promise<boolean>;
  checkingOut?: boolean;
}

export function SubscriptionPlans({
  currentSubscription,
  onUpgradeToPro,
  onDowngradeToFree,
  onManageSubscription,
  checkingOut = false
}: SubscriptionPlansProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isPro = currentSubscription?.plan_type === 'pro';

  const handleUpgrade = async () => {
    if (checkingOut || isLoading) return;
    
    setIsLoading(true);
    console.log("Iniciando processo de upgrade para plano Pro");
    
    try {
      const success = await onUpgradeToPro();
      
      if (!success) {
        console.error("Falha no processo de upgrade");
        toast.error('Não foi possível acessar o checkout. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Ocorreu um erro ao atualizar seu plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (checkingOut || isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await onDowngradeToFree();
      
      if (!success) {
        toast.error('Não foi possível acessar o portal de gerenciamento. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast.error('Ocorreu um erro ao alterar seu plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!onManageSubscription || checkingOut || isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await onManageSubscription();
      
      if (!success) {
        toast.error('Não foi possível acessar o gerenciamento da assinatura. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao gerenciar assinatura:', error);
      toast.error('Ocorreu um erro ao acessar o gerenciamento da assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
        <h3 className="text-yellow-800 font-medium">Informações sobre testes</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Para testes, você pode usar o número de cartão 4242 4242 4242 4242 com qualquer data futura 
          e qualquer CVV de 3 dígitos.
        </p>
      </div>

      {isPro && onManageSubscription && (
        <div className="flex justify-center mb-8">
          <Button 
            variant="outline" 
            onClick={handleManageSubscription}
            disabled={isLoading || checkingOut}
            className="w-full max-w-md"
          >
            {isLoading || checkingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Gerenciar Assinatura'
            )}
          </Button>
        </div>
      )}
      
      <div className="grid gap-8 md:grid-cols-2">
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
          disabled={isLoading || !isPro || checkingOut}
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
          actionLabel={isLoading || checkingOut ? "Processando..." : (isPro ? "Plano Atual" : "Fazer Upgrade")}
          onAction={handleUpgrade}
          disabled={isLoading || isPro || checkingOut}
          loading={isLoading || checkingOut}
        />
      </div>
    </div>
  );
}
