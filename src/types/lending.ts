import { BigNumber } from 'ethers';

export enum LoanStatus {
  Active = 'Active',
  Resolved = 'Resolved',
  Defaulted = 'Defaulted'
}

export interface LoanConfig {
  nftCollection: string;
  nftCollectionIsErc1155: boolean;
  minAmount: BigNumber;
  maxAmount: BigNumber;
  minInterest: number;
  maxInterest: number;
  minDuration: number;
  maxDuration: number;
}

export interface Loan {
  id: string;
  amount: BigNumber;
  amountPaidBack: BigNumber;
  startTime: number;
  duration: number;
  interest: number;
  status: LoanStatus;
  dueDate: number;
  repaymentAmount: BigNumber;
}

export interface LendingDesk {
  id: string;
  erc20: string;
  balance: BigNumber;
  status: 'Active' | 'Frozen';
  loanConfigs: LoanConfig[];
}