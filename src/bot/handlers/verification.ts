import { BotContext } from '../../types';
import { logger } from '../../services/logger';

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

    // Check if already verified
    if (ctx.session.didVerified) {
      await ctx.reply(
        '✅ You are already verified!\n\n' +
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
      return;
    }

    // Check if wallet exists
    if (!ctx.session.walletAddress) {
      await ctx.reply(
        '❌ No wallet found!\n\n' +
        'Please create a wallet first using /start',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Start Over', callback_data: 'check_membership' }],
              [{ text: '❓ Help', callback_data: 'help' }]
            ]
          }
        }
      );
      return;
    }

    const loadingMsg = await ctx.reply('🔄 Loading verification options...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    // Show verification options
    await ctx.reply(
      '🔐 Identity Verification\n\n' +
      'Please choose a verification method:\n\n' +
      '1️⃣ World ID - Verify with biometric proof\n' +
      '2️⃣ Coinbase KYC - Coming soon!\n' +
      '3️⃣ Civic - Coming soon!\n\n' +
      '🎮 This is a demo environment - verification will auto-complete.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ 
              text: '🌍 Verify with World ID',
              callback_data: 'verify_worldid'
            }],
            [{ 
              text: '🔄 Coinbase KYC (Coming Soon)',
              callback_data: 'verify_coinbase_soon'
            }],
            [{ 
              text: '🆔 Civic (Coming Soon)',
              callback_data: 'verify_civic_soon'
            }],
            [{ text: '❌ Cancel', callback_data: 'cancel' }]
          ]
        }
      }
    );

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

    // Check if wallet exists
    if (!ctx.session.walletAddress) {
      await ctx.reply(
        '❌ No wallet found!\n\n' +
        'Please create a wallet first using /start',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Start Over', callback_data: 'check_membership' }],
              [{ text: '❓ Help', callback_data: 'help' }]
            ]
          }
        }
      );
      return;
    }

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