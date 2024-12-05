import { BotContext } from '../../../types';
import { logger } from '../../../services/logger';

export async function handleVerificationUI(ctx: BotContext): Promise<void> {
  // Ensure session exists
  if (!ctx.session) {
    ctx.session = {
      didVerified: false
    };
  }

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

  logger.info('Sent verification options', { 
    userId: ctx.from?.id,
    walletAddress: ctx.session.walletAddress,
    didVerified: ctx.session.didVerified
  });
}