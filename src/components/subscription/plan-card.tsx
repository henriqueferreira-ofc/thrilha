
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanCardProps {
  title: string;
  price: string;
  description: string;
  features: PlanFeature[];
  isCurrentPlan: boolean;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PlanCard({
  title,
  price,
  description,
  features,
  isCurrentPlan,
  actionLabel,
  onAction,
  disabled = false,
  loading = false
}: PlanCardProps) {
  return (
    <Card className={`w-full ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {isCurrentPlan && (
            <span className="text-xs font-normal bg-primary/20 text-primary px-2 py-1 rounded">
              Plano atual
            </span>
          )}
        </CardTitle>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Grátis' && <span className="text-muted-foreground ml-1">/mês</span>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
              ) : (
                <X className="h-5 w-5 text-gray-300 mr-2 shrink-0" />
              )}
              <span className={!feature.included ? 'text-muted-foreground' : ''}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={disabled || (isCurrentPlan && title !== 'Pro')}
          onClick={onAction}
          variant={title === 'Pro' ? 'default' : 'outline'}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            actionLabel
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
