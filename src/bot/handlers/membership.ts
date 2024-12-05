import { BotContext } from '../../types';
import { logger } from '../../services/logger';
import { createWallet } from './wallet';

// Store group info
export const GROUP_INFO = {
  username: 'MagnifyCommunity',
  inviteLink: 'https://t.me/MagnifyCommunity',
  displayName: '@MagnifyCommunity'
};

export async function handleMembership(ctx: BotContext): Promise<void> {
  try {
    const userId = ctx.from?.id;
    
    if (!userId) {
      logger.error('No user ID found in membership check');
      await ctx.reply('An error occurred. Please try again.');
      return;
    }

    // Initialize session if not exists
    if (!ctx.session) {
      ctx.session = {
        didVerified: false
      };
    }

    logger.info('Processing membership verification', { userId });
    
    // In development mode, auto-verify and create wallet
    if (process.env.NODE_ENV === 'development') {
      logger.info('Development mode: Auto-verifying membership', { userId });
      await createWallet(ctx);
      return;
    }

    // In production, verify actual membership
    try {
      // For development testing, always succeed
      if (process.env.NODE_ENV === 'development') {
        await createWallet(ctx);
        return;
      }

      const chatMember = await ctx.telegram.getChatMember(GROUP_INFO.username, userId);
      
      if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
        await createWallet(ctx);
      } else {
        await ctx.reply(
          `❌ Please join ${GROUP_INFO.displayName} first!\n\n` +
          'Click the button below to join:',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Join Community', url: GROUP_INFO.inviteLink }],
                [{ text: '🔄 I\'ve Joined', callback_data: 'check_membership' }]
              ]
            }
          }
        );
      }
    } catch (error) {
      logger.error('Error verifying membership:', { error });
      await ctx.reply(
        `❌ Couldn't verify your membership.\n\n` +
        `Please make sure you've joined ${GROUP_INFO.displayName} and try again.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 Join Community', url: GROUP_INFO.inviteLink }],
              [{ text: '🔄 Try Again', callback_data: 'check_membership' }]
            ]
          }
        }
      );
    }
  } catch (error) {
    logger.error('Error in membership verification:', { error });
    await ctx.reply(
      `❌ Couldn't verify your membership.\n\n` +
      `Please make sure you've joined ${GROUP_INFO.displayName} and try again.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Join Community', url: GROUP_INFO.inviteLink }],
            [{ text: '🔄 Try Again', callback_data: 'check_membership' }]
          ]
        }
      }
    );
  }
}