import { BotContext } from '../../../types';

interface ValidationError {
  message: string;
  markup: {
    reply_markup: {
      inline_keyboard: Array<Array<{
        text: string;
        callback_data: string;
      }>>;
    };
  };
}

export function validateSession(ctx: BotContext): ValidationError | null {
  // Initialize session if not exists
  if (!ctx.session) {
    ctx.session = {
      didVerified: false
    };
  }

  // Check if wallet exists
  if (!ctx.session.walletAddress) {
    return {
      message: '❌ No wallet found!\n\n' + 
               'Please create a wallet first using /start',
      markup: {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Start Over', callback_data: 'check_membership' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    };
  }

  // Check if already verified
  if (ctx.session.didVerified) {
    return {
      message: '✅ You are already verified!\n\n' +
               'What would you like to do next?',
      markup: {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 View Loans', callback_data: 'loans' }],
            [{ text: '💼 View Wallet', callback_data: 'wallet' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    };
  }

  return null;
}