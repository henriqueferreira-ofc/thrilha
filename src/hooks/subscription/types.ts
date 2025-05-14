
import { SubscriptionPlan } from '@/types/board';

export interface UseSubscriptionReturn {
  subscription: SubscriptionPlan | null;
  loading: boolean;
  checkingOut: boolean;
  isPro: boolean;
  upgradeToPro: () => Promise<boolean>;
  downgradeToFree: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<boolean>;
  manageSubscription: () => Promise<boolean>;
}
