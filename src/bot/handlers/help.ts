import { BotContext } from '../../types';
import { logger } from '../../services/logger';

export async function handleHelp(ctx: BotContext): Promise<void> {
  try {
    await ctx.reply(
      'Here\'s how MagnifyCash works:\n\n' +
      '1️⃣ Verify Identity: Multiple verification options\n' +
      '   • World ID biometric verification\n' +
      '   • Coinbase KYC (Coming Soon)\n' +
      '   • Civic (Coming Soon)\n\n' +
      '2️⃣ Create Wallet: Automated setup with no gas fees\n' +
      '3️⃣ Get a Loan: Choose amount and duration\n' +
      '4️⃣ Receive Funds: Quick transfer to your wallet\n' +
      '5️⃣ Repay: Easy repayment through the bot\n\n' +
      '💫 Earn 1.5% back in $MAG Tokens on loan repayment!\n\n' +
      'Available commands:\n' +
      '/start - Create wallet and begin\n' +
      '/verify - Complete verification\n' +
      '/wallet - View wallet details\n' +
      '/loans - Get a Loan\n' +
      '/help - Show this message'
    );
  } catch (error) {
    logger.error('Error in help handler:', { error });
    await ctx.reply('Sorry, there was an error showing help. Please try again.');
  }
}