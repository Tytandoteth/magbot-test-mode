import { BotContext } from '../../types';
import { logger } from '../../services/logger';
import { CallbackQuery } from 'telegraf/types';
import { handleTelegramReminder, handleGoogleCalendarReminder } from './reminders';
import { handleLoanSelect, handleLoanConfirm, handleViewActiveLoan, handleRepayLoan } from './loans';
import { handleWalletView, handleCredentialsSaved } from './wallet';
import { handleVerificationRequest, handleVerificationComplete } from './verification';
import { handleMembership } from './membership';
import { handleHelp } from './help';

export async function handleCallback(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.callbackQuery) {
      logger.warn('No callback query found');
      return;
    }

    const query = ctx.callbackQuery as CallbackQuery.DataQuery;

    // Handle calendar reminder
    if (query.data.startsWith('reminder_gcal_')) {
      const timestamp = parseInt(query.data.split('_')[2], 10);
      await handleGoogleCalendarReminder(ctx, timestamp);
      return;
    }

    // Handle Telegram reminder
    if (query.data.startsWith('reminder_tg_')) {
      const timestamp = parseInt(query.data.split('_')[2], 10);
      await handleTelegramReminder(ctx, timestamp);
      return;
    }

    // Handle loan selection
    if (query.data.startsWith('loan_select_')) {
      await handleLoanSelect(ctx);
      return;
    }

    // Handle loan confirmation
    if (query.data.startsWith('loan_confirm_')) {
      const [_, __, amount, days] = query.data.split('_');
      await handleLoanConfirm(ctx, parseInt(amount, 10), parseInt(days, 10));
      return;
    }

    // Handle view active loan
    if (query.data === 'view_active_loan') {
      await handleViewActiveLoan(ctx);
      return;
    }

    // Handle loan repayment
    if (query.data === 'repay_loan') {
      await handleRepayLoan(ctx);
      return;
    }

    // Handle repayment methods
    if (query.data.startsWith('repay_')) {
      const method = query.data.split('_')[1];
      await ctx.reply(
        '🚧 Payment Method Coming Soon!\n\n' +
        'This payment method will be available shortly.\n' +
        'Please check back later or try another method.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Try Another Method', callback_data: 'repay_loan' }],
              [{ text: '📊 View Loan Details', callback_data: 'view_active_loan' }],
              [{ text: '❌ Cancel', callback_data: 'cancel' }]
            ]
          }
        }
      );
      return;
    }

    // Handle wallet view
    if (query.data === 'wallet') {
      await handleWalletView(ctx);
      return;
    }

    // Handle verification
    if (query.data === 'verify') {
      await handleVerificationRequest(ctx);
      return;
    }

    // Handle verification methods
    if (query.data === 'verify_worldid' || query.data === 'verify_complete') {
      await handleVerificationComplete(ctx);
      return;
    }

    // Handle verification provider coming soon
    if (query.data === 'verify_coinbase_soon' || query.data === 'verify_civic_soon') {
      await ctx.reply(
        '🔄 Coming Soon!\n\n' +
        'This verification method will be available soon.\n' +
        'Please use World ID verification for now.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌍 Verify with World ID', callback_data: 'verify_worldid' }],
              [{ text: '❌ Cancel', callback_data: 'cancel' }]
            ]
          }
        }
      );
      return;
    }

    // Handle membership check
    if (query.data === 'check_membership') {
      await handleMembership(ctx);
      return;
    }

    // Handle credentials saved
    if (query.data === 'credentials_saved') {
      await handleCredentialsSaved(ctx);
      return;
    }

    // Handle help
    if (query.data === 'help') {
      await handleHelp(ctx);
      return;
    }

    // Handle loans menu
    if (query.data === 'loans') {
      const loadingMsg = await ctx.reply('⚙️ Loading loan options...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      await ctx.reply(
        '💰 Available Loan Options\n\n' +
        'Choose your loan amount:\n\n' +
        '💫 Earn 1.5% back in $MAG Tokens when you repay your loan!',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '$5 (15.0% APR)', callback_data: 'loan_select_5' }],
              [{ text: '$10 (12.5% APR)', callback_data: 'loan_select_10' }],
              [{ text: '$15 (10.0% APR)', callback_data: 'loan_select_15' }],
              [{ text: '❌ Cancel', callback_data: 'cancel' }],
              [{ text: '❓ Help', callback_data: 'help' }]
            ]
          }
        }
      );
      return;
    }

    // Handle cancel
    if (query.data === 'cancel') {
      await ctx.reply('Operation cancelled. What would you like to do?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💼 View Wallet', callback_data: 'wallet' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      });
      return;
    }

    logger.warn('Unknown callback query:', { data: query.data });
    await ctx.reply('Sorry, I don\'t understand that command.');

  } catch (error) {
    logger.error('Error in callback handler:', { error });
    await ctx.reply('Sorry, there was an error processing your request.');
  }
}