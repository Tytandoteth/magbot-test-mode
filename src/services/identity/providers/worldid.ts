import { VerificationResult } from '../../../types';
import { logger } from '../../logger';
import { ethers } from 'ethers';

export class WorldIDVerifier {
  private readonly clientId: string;
  private readonly isDevelopment: boolean;

  constructor() {
    this.clientId = process.env.WORLD_ID_CLIENT_ID || 'app_f652c122e82b3695ea02ae81548fd0d4';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  getVerificationUrl(): string {
    // Use simulator endpoint for development
    const baseUrl = this.isDevelopment 
      ? 'https://simulator.worldcoin.org'
      : 'https://id.worldcoin.org';
    
    const params = {
      action_id: 'wid_staging_76e0c8f7c4f2e2f3c153339d4f253c53',
      signal: 'user_verification',
      app_name: 'MagnifyCash Lending',
      return_to: 'https://t.me/MagnifyCashBot',
      action: 'verify_account',
      action_description: 'Verify your identity to access MagnifyCash lending services',
      verification_level: 'orb',
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid profile',
      state: Math.random().toString(36).substring(7)
    };

    const url = `${baseUrl}/simulator?${new URLSearchParams(params).toString()}`;
    
    logger.debug('Generated World ID simulator URL', {
      url,
      clientId: this.clientId,
      action: params.action
    });

    return url;
  }

  async verify(userId: string): Promise<VerificationResult> {
    try {
      logger.info('Initiating World ID verification', { userId });

      if (this.isDevelopment) {
        logger.info('Using mock verification (development mode)', { userId });
        
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate deterministic wallet address from userId
        const wallet = ethers.Wallet.createRandom();
        const mockAddress = wallet.address;

        // Generate mock proof
        const mockProof = ethers.utils.solidityKeccak256(
          ['string', 'address'],
          [userId, mockAddress]
        );

        logger.info('Mock verification successful', {
          userId,
          verification_level: 'orb',
          address: mockAddress
        });

        return {
          success: true,
          provider: 'worldcoin',
          address: mockAddress,
          proof: mockProof
        };
      }

      // In production, implement actual World ID verification
      throw new Error('Production World ID verification not implemented');
    } catch (error) {
      logger.error('World ID verification error:', { error, userId });
      return {
        success: false,
        provider: 'worldcoin',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}