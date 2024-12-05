import { BotContext, LoanItem } from '../types';
import { logger } from '../services/logger';
import { GhostlogsService } from '../services/data/ghostlogs';
import { WalletManagerService } from '../services/wallet';

export const setupCommands = (bot: any) => {
  const ghostlogs = new GhostlogsService();
  const walletManager = new WalletManagerService();

  bot.command('start', async (ctx: BotContext) => {
    try {
      logger.info('Received /start command', {
        userId: ctx.from?.id,
        username: ctx.from?.username
      });

      // Create a new wallet for the user
      const wallet = await walletManager.createWallet();
      ctx.session = {
        walletAddress: wallet.address,
        didVerified: false
      };

      await ctx.reply(
        `Welcome to MagnifyCash Lending Bot! 🚀\n\n` +
        `✅ Your wallet has been created!\n` +
        `Address: ${wallet.address}\n\n` +
        `Next step: Use /verify to complete identity verification.`
      );

      logger.info('New user started bot', {
        userId: ctx.from?.id,
        walletAddress: wallet.address
      });
    } catch (error) {
      logger.error('Error in start command:', error);
      await ctx.reply('Sorry, there was an error creating your wallet. Please try again.');
    }
  });

  bot.command('loans', async (ctx: BotContext) => {
    try {
      if (!ctx.session?.walletAddress) {
        await ctx.reply('Please create a wallet first using /start');
        return;
      }

      if (!ctx.session.didVerified) {
        await ctx.reply('Please complete verification first using /verify');
        return;
      }

      const response = await ghostlogs.getUserLoans(ctx.session.walletAddress);
      await ctx.reply('Fetching your loans...');
      
      if (!response.data?.loans?.items || response.data.loans.items.length === 0) {
        await ctx.reply('You have no active loans.');
      } else {
        const loanList = response.data.loans.items
          .map((loan: LoanItem) => 
            `Loan #${loan.id}\nAmount: ${loan.amount}\nStatus: ${loan.status}`
          )
          .join('\n\n');
        await ctx.reply(`Your loans:\n\n${loanList}`);
      }
    } catch (error) {
      logger.error('Error in loans command:', error);
      await ctx.reply('Sorry, there was an error fetching your loans.');
    }
  });

  // Register commands with Telegram
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot and create a wallet' },
    { command: 'verify', description: 'Complete identity verification' },
    { command: 'loans', description: 'View your active loans' },
    { command: 'help', description: 'Show help message' }
  ]).catch((error: Error) => {
    logger.error('Failed to set commands:', error);
  });
};