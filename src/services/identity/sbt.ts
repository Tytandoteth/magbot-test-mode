import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { logger } from '../logger';
import { config } from '../../config';
import { BasePaymasterService } from '../paymaster/base';
import { ethers } from 'ethers';

export class SoulboundTokenService {
    private sdk: ThirdwebSDK | null = null;
    private paymaster: BasePaymasterService;
    private contract: any;
    private initialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        this.paymaster = new BasePaymasterService();
    }

    private async initializeSDK() {
        if (this.initialized) return;
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = (async () => {
            try {
                logger.info('Initializing ThirdWeb SDK');

                // Initialize SDK with Base network
                this.sdk = new ThirdwebSDK(config.thirdweb.network, {
                    clientId: config.thirdweb.clientId,
                    secretKey: config.thirdweb.secretKey
                });

                // Get contract instance
                this.contract = await this.sdk.getContract(
                    config.blockchain.contracts.identity
                );

                this.initialized = true;
                logger.info('SBT service initialized successfully');
            } catch (error) {
                this.initialized = false;
                this.sdk = null;
                this.contract = null;
                logger.error('Failed to initialize SBT service:', { error });
                throw error;
            } finally {
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
    }

    async mintIdentityToken(address: string, provider: string): Promise<string> {
        try {
            await this.initializeSDK();
            
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            
            logger.info('Minting identity SBT', { address, provider });

            // Check if address already has a token
            const hasToken = await this.contract.call("hasIdentityToken", [address]);
            if (hasToken) {
                logger.info('Address already has an identity token', { address });
                return await this.getTokenId(address);
            }

            // Prepare mint transaction
            const tx = await this.contract.prepare("mintSoulboundToken", [
                address,
                provider
            ]);

            // Use paymaster to sponsor the transaction
            const sponsoredTx = await this.paymaster.sponsorTransaction(tx);
            
            // Wait for transaction confirmation
            const receipt = await sponsoredTx.wait();

            // Get transaction hash from receipt
            const txHash = receipt.transactionHash || 'unknown';

            logger.info('Identity SBT minted successfully', {
                txHash,
                address,
                provider
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to mint identity SBT:', { error });
            throw new Error('Failed to mint identity SBT');
        }
    }

    async getTokenId(address: string): Promise<string> {
        try {
            await this.initializeSDK();

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const hasToken = await this.contract.call("hasIdentityToken", [address]);
            if (!hasToken) {
                throw new Error('Address has no identity token');
            }

            const balance = await this.contract.erc721.balanceOf(address);
            if (balance === 0) {
                throw new Error('Address has no identity token');
            }

            const tokenId = await this.contract.erc721.getTokenId(address, 0);
            return tokenId.toString();
        } catch (error) {
            logger.error('Failed to get token ID:', { error });
            throw error;
        }
    }

    async verifyIdentityToken(address: string): Promise<boolean> {
        try {
            await this.initializeSDK();

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            return await this.contract.call("hasIdentityToken", [address]);
        } catch (error) {
            logger.error('Failed to verify identity token:', { error });
            return false;
        }
    }

    async getVerificationProvider(address: string): Promise<string> {
        try {
            await this.initializeSDK();

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            return await this.contract.call("getVerificationProvider", [address]);
        } catch (error) {
            logger.error('Failed to get verification provider:', { error });
            throw error;
        }
    }
}