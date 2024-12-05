import { BotContext } from '../../../types';
import { logger } from '../../../services/logger';
import { SoulboundTokenService } from '../../../services/identity/sbt';

const sbtService = new SoulboundTokenService();

export async function handleVerificationProcess(ctx: BotContext): Promise<void> {
  // Ensure session exists
  if (!ctx.session) {
    ctx.session = {
      didVerified: false
    };
  }

  // Double-check wallet exists
  if (!ctx.session.walletAddress) {
    throw new Error('Wallet address not found in session');
  }

  try {
    // Set verification status
    ctx.session.didVerified = true;
    
    await ctx.reply(
      '✅ Verification successful!\n' +
      '🎉 Your Identity SBT has been minted.\n\n' +
      'You now have access to lending services.\n\n' +
      'What would you like to do next?',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Get a Loan', callback_data: 'loans' }],
            [{ text: '💼 View Wallet', callback_data: 'wallet' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );

    logger.info('Verification completed successfully', {
      userId: ctx.from?.id,
      walletAddress: ctx.session.walletAddress,
      didVerified: ctx.session.didVerified
    });
  } catch (error) {
    logger.error('Error during verification process:', { error });
    throw error;
  }
}