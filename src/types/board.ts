
export interface Board {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface CreateBoardData {
  name: string;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  user_id: string;
  plan_type: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}
