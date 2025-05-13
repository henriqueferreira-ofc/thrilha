
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionPlans } from "@/components/subscription/subscription-plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskSidebar } from "@/components/task-sidebar";
import { RequireAuth } from "@/components/RequireAuth";

export function SubscriptionPage() {
  const { subscription, loading, isPro, upgradeToPro, downgradeToFree } = useSubscription();

  return (
    <RequireAuth>
      <div className="flex h-screen overflow-hidden">
        <TaskSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Planos e Assinaturas</h1>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Seu plano atual</CardTitle>
                <CardDescription>
                  Visualize seu plano atual e os benefícios disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold">
                      {isPro ? 'Plano Pro' : 'Plano Gratuito'}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {isPro 
                        ? 'Você tem acesso a todos os recursos, incluindo quadros ilimitados e colaboração avançada.'
                        : 'Você tem direito a até 3 quadros ativos. Faça upgrade para o plano Pro para criar quadros ilimitados.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Nossos Planos</h2>
            <p className="text-muted-foreground mb-6">
              Escolha o plano que melhor atende às suas necessidades
            </p>

            {loading ? (
              <div className="grid gap-8 md:grid-cols-2">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : (
              <SubscriptionPlans 
                currentSubscription={subscription}
                onUpgradeToPro={upgradeToPro}
                onDowngradeToFree={downgradeToFree}
              />
            )}
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
