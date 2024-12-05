import { logger } from '../logger';
import { WalletCredentials, IWalletService } from '../../types';
import { CoinbaseWalletService } from './coinbase';

export class WalletManagerService implements IWalletService {
  private coinbaseService: CoinbaseWalletService;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.coinbaseService = new CoinbaseWalletService();
    logger.info('Wallet manager service initialized');
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        await this.coinbaseService.initialize();
        this.initialized = true;
        logger.info('Wallet manager service ready');
      } catch (error) {
        this.initialized = false;
        logger.error('Failed to initialize wallet manager:', { error });
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  async createWallet(): Promise<WalletCredentials> {
    try {
      await this.ensureInitialized();
      logger.info('Creating new wallet using Coinbase service');
      return await this.coinbaseService.createWallet();
    } catch (error) {
      logger.error('Error creating wallet:', { error });
      throw new Error('Failed to create wallet');
    }
  }

  async getWalletBalance(address: string): Promise<string> {
    try {
      // In development mode, return mock balance
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Development mode: Using mock balance');
        return '0.0000';
      }

      await this.ensureInitialized();
      logger.debug('Fetching wallet balance', { address });
      return await this.coinbaseService.getWalletBalance(address);
    } catch (error) {
      logger.error('Error getting wallet balance:', { error });
      return '0.0000'; // Return zero balance on error
    }
  }
}