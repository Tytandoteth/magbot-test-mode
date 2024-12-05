import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  userId: { type: Number, required: true, unique: true },
  username: String,
  walletAddress: String,
  verificationProvider: String,
  verifiedAt: Date,
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  totalLoans: { type: Number, default: 0 },
  totalBorrowed: { type: Number, default: 0 },
  totalRepaid: { type: Number, default: 0 },
  activeLoans: { type: Number, default: 0 },
  magTokensEarned: { type: Number, default: 0 },
  defaultedLoans: { type: Number, default: 0 }
});

export const LoanSchema = new Schema({
  loanId: { type: String, required: true, unique: true },
  userId: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  amount: { type: Number, required: true },
  term: { type: Number, required: true },
  apr: { type: Number, required: true },
  status: {
    type: String,
    enum: ['active', 'repaid', 'defaulted'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  repaidAt: Date,
  repaymentAmount: Number,
  magTokenReward: Number,
  remindersSet: { type: Boolean, default: false },
  remindersSent: { type: Number, default: 0 }
});

export const EventSchema = new Schema({
  userId: { type: Number, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'user_start',
      'wallet_created',
      'verification_started',
      'verification_completed',
      'loan_viewed',
      'loan_selected',
      'loan_confirmed',
      'loan_repaid',
      'loan_defaulted',
      'reminder_set',
      'reminder_sent'
    ]
  },
  timestamp: { type: Date, default: Date.now },
  metadata: Schema.Types.Mixed
});