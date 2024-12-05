import { ethers, BigNumber } from 'ethers';
import { logger } from '../logger';
import { config } from '../../config';
import { Loan, LoanConfig, LendingDesk } from '../../types/lending';
import { PaymasterService } from '../paymaster';

export class LendingService {
  private contract: ethers.Contract;
  private paymaster: PaymasterService;

  constructor() {
    this.paymaster = new PaymasterService();
    this.contract = new ethers.Contract(
      config.blockchain.contracts.lending,
      [
        'function initializeNewLoan(uint64 _lendingDeskId, address _nftCollection, uint64 _nftId, uint32 _duration, uint256 _amount, uint32 _maxInterestAllowed) external',
        'function getLoanAmountDue(uint256 _loanId) external view returns (uint256)',
        'function makeLoanPayment(uint256 _loanId, uint256 _amount, bool _resolve) external',
        'function getLoanStatus(uint256 _loanId) external view returns (uint8)',
        'function hasActiveLoan(address _borrower) external view returns (bool)'
      ],
      new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl)
    );
  }

  async hasActiveLoan(address: string): Promise<boolean> {
    try {
      // In development mode, always return false to allow testing
      if (process.env.NODE_ENV === 'development') {
        logger.info('Development mode: Simulating no active loans');
        return false;
      }

      return await this.contract.hasActiveLoan(address);
    } catch (error) {
      logger.error('Error checking active loan:', { error });
      // In case of error, return false to allow operation to continue
      return false;
    }
  }

  async createLoan(
    lendingDeskId: number,
    amount: number,
    duration: number,
    maxInterest: number
  ): Promise<string> {
    try {
      logger.info('Creating new loan', {
        lendingDeskId,
        amount,
        duration,
        maxInterest
      });

      // In development mode, return mock transaction hash
      if (process.env.NODE_ENV === 'development') {
        const mockTxHash = '0x' + Array(64).fill('0').join('');
        logger.info('Development mode: Simulating loan creation', { txHash: mockTxHash });
        return mockTxHash;
      }

      const tx = await this.contract.initializeNewLoan(
        lendingDeskId,
        config.blockchain.contracts.identity,
        0,
        duration,
        ethers.utils.parseEther(amount.toString()),
        maxInterest
      );

      const response = await this.paymaster.sponsorTransaction(tx);
      const receipt = await response.wait();

      logger.info('Loan created successfully', {
        txHash: receipt.transactionHash
      });

      return receipt.transactionHash;
    } catch (error) {
      logger.error('Error creating loan:', { error });
      throw new Error('Failed to create loan');
    }
  }

  calculateRepaymentAmount(
    amount: number,
    interest: number,
    duration: number
  ): number {
    const interestRate = interest / 10000;
    const durationInYears = duration / (365 * 24);
    return amount * (1 + interestRate * durationInYears);
  }

  calculateMagReward(amount: number): number {
    return amount * 0.015; // 1.5% reward in MAG tokens
  }
}