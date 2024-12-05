import { BotContext } from '../../types';
import { logger } from '../../services/logger';

export async function handleViewTransaction(ctx: BotContext) {
  const userId = ctx.from?.id;
  
  logger.debug('Handling view transaction', { userId });

  try {
    if (!ctx.session?.loanAmount) {
      logger.warn('No active loan found', { userId });
      await ctx.reply('No active loan transaction found.');
      return;
    }

    const txHash = generateMockTxHash();
    const explorerUrl = `https://basescan.org/tx/${txHash}`;

    await ctx.reply(
      '📱 Transaction Details\n\n' +
      `Amount: $${ctx.session.loanAmount}\n` +
      `Status: ✅ Confirmed\n` +
      `Transaction Hash: \`${txHash}\`\n\n` +
      'View on Explorer:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔍 View on BaseScan', url: explorerUrl }],
            [{ text: '💼 Back to Wallet', callback_data: 'wallet' }]
          ]
        }
      }
    );

    logger.info('Displayed transaction details', {
      userId,
      amount: ctx.session.loanAmount,
      txHash
    });
  } catch (error) {
    logger.error('Error in view transaction handler:', { error, userId });
    await ctx.reply('Sorry, there was an error viewing the transaction. Please try again.');
  }
}

function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}