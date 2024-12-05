import { BotContext } from '../../types';
import { logger } from '../../services/logger';
import { createWallet } from './wallet';
import { GROUP_INFO } from './membership';

export async function handleStart(ctx: BotContext) {
  try {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;

    logger.info('Received /start command', { 
      userId, 
      username,
      existingWallet: ctx.session?.walletAddress,
      isVerified: ctx.session?.didVerified
    });

    // Initialize session if not exists
    if (!ctx.session) {
      ctx.session = {
        didVerified: false
      };
    }

    // If user already has a wallet, show main menu
    if (ctx.session.walletAddress) {
      await ctx.reply(
        '👋 Welcome to MagnifyCash!\n\n' +
        `Your wallet: \`${ctx.session.walletAddress}\`\n\n` +
        'Please choose an option:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Complete Verification', callback_data: 'verify' }],
              [{ text: '💰 Get a Loan', callback_data: 'loans' }],
              [{ text: '💼 View Wallet', callback_data: 'wallet' }],
              [{ text: '❓ Help', callback_data: 'help' }]
            ]
          }
        }
      );
      return;
    }

    // Show join community message first
    await ctx.reply(
      `👋 Welcome to MagnifyCash!\n\n` +
      `To get started, please join our community:\n` +
      `${GROUP_INFO.displayName}\n\n` +
      `After joining, click the button below:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Join Community', url: GROUP_INFO.inviteLink }],
            [{ text: '🔄 I\'ve Joined', callback_data: 'check_membership' }]
          ]
        }
      }
    );

  } catch (error) {
    logger.error('Error in start handler:', { error });
    await ctx.reply('Sorry, there was an error getting started. Please try again.');
  }
}