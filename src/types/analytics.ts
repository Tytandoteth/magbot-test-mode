export interface UserStats {
  userId: number;
  username?: string;
  walletAddress?: string;
  verificationProvider?: string;
  verifiedAt?: Date;
  firstSeen: Date;
  lastSeen: Date;
  totalLoans: number;
  totalBorrowed: number;
  totalRepaid: number;
  activeLoans: number;
  magTokensEarned: number;
  defaultedLoans: number;
}

export interface LoanStats {
  loanId: string;
  userId: number;
  walletAddress: string;
  amount: number;
  term: number;
  apr: number;
  status: 'active' | 'repaid' | 'defaulted';
  createdAt: Date;
  dueDate: Date;
  repaidAt?: Date;
  repaymentAmount: number;
  magTokenReward: number;
  remindersSet: boolean;
  remindersSent: number;
}

export interface AnalyticsEvent {
  userId: number;
  type: 
    | 'user_start'
    | 'wallet_created'
    | 'verification_started'
    | 'verification_completed'
    | 'loan_viewed'
    | 'loan_selected'
    | 'loan_confirmed'
    | 'loan_repaid'
    | 'loan_defaulted'
    | 'reminder_set'
    | 'reminder_sent';
  metadata?: Record<string, any>;
}