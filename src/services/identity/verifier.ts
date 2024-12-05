import { IdentityVerifier, VerificationResult } from '../../types';
import { logger } from '../logger';
import { WorldIDVerifier } from './providers/worldid';
import { config } from '../../config';
import { Contract, Wallet } from 'ethers';

export class IdentityVerifierService implements IdentityVerifier {
  private worldId: WorldIDVerifier;
  private wallet: Wallet | null = null;

  constructor() {
    this.worldId = new WorldIDVerifier();
    
    // Initialize wallet with private key for contract interactions
    if (!process.env.CONTRACT_PRIVATE_KEY) {
      logger.warn('No contract private key provided, using mock verification');
    } else {
      this.wallet = new Wallet(
        process.env.CONTRACT_PRIVATE_KEY,
        config.blockchain.provider
      );
    }
  }

  async verify(userId: string): Promise<VerificationResult> {
    try {
      logger.info('Starting WorldID verification', { userId });
      
      const result = await this.worldId.verify(userId);
      
      if (result.success && result.address) {
        // In development, skip actual contract interaction
        if (!process.env.CONTRACT_PRIVATE_KEY) {
          logger.info('Mock verification successful', {
            userId,
            address: result.address
          });
          return result;
        }

        try {
          await this.mintSoulboundToken(result.address, 'worldcoin');
          logger.info('WorldID verification successful', {
            userId,
            address: result.address
          });
        } catch (mintError) {
          logger.warn('Failed to mint token but verification succeeded', {
            error: mintError,
            userId,
            address: result.address
          });
          // Continue with successful verification even if minting fails
        }
      } else {
        logger.error('Verification failed', {
          userId,
          reason: result.error
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error in WorldID verification:', { error });
      return {
        success: false,
        provider: 'worldcoin',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async mintSoulboundToken(address: string, provider: string): Promise<string> {
    try {
      logger.info('Starting SBT minting process', { address, provider });

      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      const contract = new Contract(
        config.blockchain.contracts.identity,
        ['function mintSoulboundToken(address to, string provider) returns (uint256)'],
        this.wallet
      );

      const tx = await contract.mintSoulboundToken(address, provider);
      logger.info('SBT minting transaction submitted', { txHash: tx.hash });

      const receipt = await tx.wait();
      logger.info('SBT minting successful', { txHash: receipt.hash });
      
      return receipt.hash;
    } catch (error) {
      logger.error('Failed to mint Soulbound Token:', { error });
      throw new Error('Failed to mint Soulbound Token');
    }
  }
}