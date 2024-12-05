import { Context } from 'telegraf';
import { Message } from 'telegraf/types';
import { BigNumber, providers } from 'ethers';

export interface ActiveLoan {
  id: string;
  amount: number;
  dueDate: string;
  repaymentAmount: number;
  status: 'active' | 'repaid' | 'defaulted';
  createdAt: string;
}

export interface SessionData {
  walletAddress?: string;
  didVerified: boolean;
  step?: 'start' | 'verify' | 'verify_complete' | 'wallet' | 'loan';
  loanAmount?: number;
  credentialsMsgId?: number;
  countdownMsgId?: number;
  activeLoan?: ActiveLoan;
  reminders?: {
    loanDueDate: number;
    reminderDates: number[];
  };
}

export interface BotContext extends Context {
  session: SessionData;
}

export interface VerificationResult {
  success: boolean;
  provider: 'worldcoin' | 'coinbase' | 'civic' | 'polygonid';
  error?: string;
  address?: string;
  proof?: string;
}

export interface WalletCredentials {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export interface IWalletService {
  createWallet(): Promise<WalletCredentials>;
  getWalletBalance(address: string): Promise<string>;
}

export interface ICoinbaseWalletService extends IWalletService {
  initialize(): Promise<void>;
}

export interface QueryConfig {
  cacheDuration: number;
  retryAttempts: number;
  timeout: number;
}

export interface IdentityVerifier {
  verify(userId: string): Promise<VerificationResult>;
}

export interface ThirdwebConfig {
  clientId: string;
  secretKey: string;
  network: string;
}

export interface LoanItem {
  id: string;
  amount: number;
  status: 'active' | 'repaid' | 'defaulted';
  dueDate: string;
  totalDue: number;
}

export interface GhostLogsResponse {
  data: {
    loans?: {
      items: LoanItem[];
    };
  };
  errors?: Array<{
    message: string;
    locations: Array<{
      line: number;
      column: number;
    }>;
  }>;
}