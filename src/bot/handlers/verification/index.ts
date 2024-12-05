import { BotContext } from '../../../types';
import { logger } from '../../../services/logger';
import { handleVerificationUI } from './ui';
import { handleVerificationProcess } from './process';
import { validateSession } from './validation';

export async function handleVerificationRequest(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id.toString();
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Initialize session if not exists
    if (!ctx.session) {
      ctx.session = {
        didVerified: false
      };
    }

    // Validate session and wallet
    const validationError = validateSession(ctx);
    if (validationError) {
      await ctx.reply(validationError.message, validationError.markup);
      return;
    }

    logger.info('Starting verification process', {
      userId,
      walletAddress: ctx.session.walletAddress,
      isVerified: ctx.session.didVerified
    });

    // Always show verification UI first
    await handleVerificationUI(ctx);

  } catch (error) {
    logger.error('Verification handler error:', { error });
    await ctx.reply(
      '❌ Sorry, there was an error starting verification.\n\n' +
      'Please try again or contact support if the issue persists.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'verify' }],
            [{ text: '❌ Cancel', callback_data: 'cancel' }]
          ]
        }
      }
    );
  }
}

export async function handleVerificationComplete(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id.toString();
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Initialize session if not exists
    if (!ctx.session) {
      ctx.session = {
        didVerified: false
      };
    }

    // Validate session and wallet
    const validationError = validateSession(ctx);
    if (validationError) {
      await ctx.reply(validationError.message, validationError.markup);
      return;
    }

    logger.info('Completing verification process', {
      userId,
      walletAddress: ctx.session.walletAddress,
      isVerified: ctx.session.didVerified
    });

    // Simulate verification delay
    const loadingMsg = await ctx.reply('🔄 Verifying your identity...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

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
      userId,
      walletAddress: ctx.session.walletAddress,
      didVerified: ctx.session.didVerified
    });

  } catch (error) {
    logger.error('Verification completion error:', { error });
    await ctx.reply(
      '❌ Sorry, there was an error completing verification.\n\n' +
      'Please try again or contact support if the issue persists.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'verify' }],
            [{ text: '❌ Cancel', callback_data: 'cancel' }]
          ]
        }
      }
    );
  }
}