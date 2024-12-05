import { BotContext } from '../../types';
import { logger } from '../../services/logger';
import { LendingService } from '../../services/lending';

const lendingService = new LendingService();

const LOAN_OPTIONS = [
  { amount: 5, apr: '15.0', durations: [7, 14, 30, 45, 60] },
  { amount: 10, apr: '12.5', durations: [7, 14, 30, 45, 60] },
  { amount: 15, apr: '10.0', durations: [7, 14, 30, 45, 60] }
];

export async function handleGetLoan(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.session?.walletAddress) {
      await ctx.reply('You need to create a wallet first. Use /start to begin.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Start Over', callback_data: 'check_membership' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      });
      return;
    }

    if (!ctx.session.didVerified) {
      await ctx.reply('Please complete verification first using /verify', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Start Verification', callback_data: 'verify' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      });
      return;
    }

    // Check for active loan
    if (ctx.session.activeLoan) {
      await handleViewActiveLoan(ctx);
      return;
    }

    const loadingMsg = await ctx.reply('⚙️ Loading loan options...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    const keyboard = LOAN_OPTIONS.map(loan => [{
      text: `$${loan.amount} (${loan.apr}% APR)`,
      callback_data: `loan_select_${loan.amount}`
    }]);

    await ctx.reply(
      '💰 Available Loan Options\n\n' +
      'Choose your loan amount:\n\n' +
      '💫 Earn 1.5% back in $MAG Tokens when you repay your loan!',
      {
        reply_markup: {
          inline_keyboard: [
            ...keyboard,
            [{ text: '❌ Cancel', callback_data: 'cancel' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in loans handler:', { error });
    await ctx.reply('Sorry, there was an error showing loan options. Please try again.');
  }
}

export async function handleLoanSelect(ctx: BotContext): Promise<void> {
  try {
    if (ctx.session?.activeLoan) {
      await ctx.reply(
        '⚠️ You already have an active loan!\n\n' +
        'Please repay your current loan before applying for a new one.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📊 View Active Loan', callback_data: 'view_active_loan' }],
              [{ text: '💼 Back to Wallet', callback_data: 'wallet' }]
            ]
          }
        }
      );
      return;
    }

    const loadingMsg = await ctx.reply('💭 Processing your selection...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    const callbackData = (ctx.callbackQuery as any).data;
    const amount = parseInt(callbackData.split('_')[2], 10);
    const selectedLoan = LOAN_OPTIONS.find(l => l.amount === amount);
    
    if (!selectedLoan) {
      logger.warn('Invalid loan amount selected', { amount });
      await ctx.reply('Invalid loan amount. Please try again.');
      return;
    }

    const durationButtons = selectedLoan.durations.map(days => ({
      text: `${days} Days`,
      callback_data: `loan_confirm_${amount}_${days}`
    }));

    const rows = durationButtons.reduce((acc: any[][], button, i) => {
      if (i % 2 === 0) acc.push([button]);
      else acc[acc.length - 1].push(button);
      return acc;
    }, []);

    await ctx.reply(
      '📝 Select Loan Duration\n\n' +
      `Amount: $${selectedLoan.amount}\n` +
      `APR: ${selectedLoan.apr}%\n\n` +
      'Choose your preferred duration:',
      {
        reply_markup: {
          inline_keyboard: [
            ...rows,
            [{ text: '❌ Cancel', callback_data: 'cancel' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in loan selection handler:', { error });
    await ctx.reply('Sorry, there was an error processing your selection. Please try again.');
  }
}

export async function handleLoanConfirm(ctx: BotContext, amount: number, days: number): Promise<void> {
  try {
    if (ctx.session?.activeLoan) {
      await ctx.reply('You already have an active loan. Please repay it first.');
      return;
    }

    const loadingMsg = await ctx.reply('⚙️ Processing your loan request...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      loadingMsg.message_id,
      undefined,
      '💸 Transferring funds to your wallet...'
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    const selectedLoan = LOAN_OPTIONS.find(l => l.amount === amount);
    
    if (!selectedLoan) {
      logger.warn('Invalid loan amount in confirmation', { amount });
      await ctx.reply('Invalid loan amount. Please try again.');
      return;
    }

    const apr = parseFloat(selectedLoan.apr) / 100;
    const durationInHours = days * 24;
    const repaymentAmount = lendingService.calculateRepaymentAmount(amount, apr * 10000, durationInHours);
    const magReward = lendingService.calculateMagReward(amount);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    // Create loan on-chain
    const txHash = await lendingService.createLoan(
      1, // Default lending desk ID
      amount,
      durationInHours,
      Math.floor(apr * 10000) // Convert to basis points
    );

    // Store active loan in session
    ctx.session.activeLoan = {
      id: txHash,
      amount,
      dueDate: dueDate.toISOString(),
      repaymentAmount,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    logger.info('Loan confirmed', { 
      userId: ctx.from?.id,
      walletAddress: ctx.session?.walletAddress,
      loanDetails: {
        amount,
        apr: selectedLoan.apr,
        term: `${days} days`,
        days,
        lendingDeskId: 1,
        repaymentAmount,
        dueDate: dueDate.toLocaleDateString(),
        magTokenReward: magReward
      }
    });

    await ctx.reply(
      '🎉 Loan Approved!\n\n' +
      `Amount: $${amount}\n` +
      `Term: ${days} days\n` +
      `APR: ${selectedLoan.apr}%\n\n` +
      `Repayment Amount: $${repaymentAmount.toFixed(2)}\n` +
      `Due Date: ${dueDate.toLocaleDateString()}\n\n` +
      `💫 You'll receive ${magReward.toFixed(3)} $MAG Tokens upon repayment!\n\n` +
      '📱 Set up repayment reminders:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Add to Google Calendar', callback_data: `reminder_gcal_${dueDate.getTime()}` }],
            [{ text: '🔔 Set Telegram Reminders', callback_data: `reminder_tg_${dueDate.getTime()}` }],
            [{ text: '📊 View Loan Details', callback_data: 'view_active_loan' }],
            [{ text: '💼 Back to Wallet', callback_data: 'wallet' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in loan confirmation handler:', { error });
    await ctx.reply('Sorry, there was an error processing your loan. Please try again.');
  }
}

export async function handleViewActiveLoan(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.session?.walletAddress) {
      await ctx.reply('No wallet found. Please start over with /start');
      return;
    }

    if (!ctx.session.activeLoan) {
      await ctx.reply('No active loan found.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Get a Loan', callback_data: 'loans' }],
            [{ text: '💼 Back to Wallet', callback_data: 'wallet' }]
          ]
        }
      });
      return;
    }

    const loan = ctx.session.activeLoan;
    const dueDate = new Date(loan.dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const magReward = lendingService.calculateMagReward(loan.amount);

    await ctx.reply(
      '📊 Active Loan Details\n\n' +
      `Amount: $${loan.amount}\n` +
      `Due Date: ${dueDate.toLocaleDateString()}\n` +
      `Days Left: ${daysLeft}\n` +
      `Total Due: $${loan.repaymentAmount.toFixed(2)}\n\n` +
      `💫 Repay now to earn ${magReward.toFixed(3)} $MAG tokens!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Repay Loan', callback_data: 'repay_loan' }],
            [{ text: '🔔 Set Reminders', callback_data: `reminder_tg_${dueDate.getTime()}` }],
            [{ text: '💼 Back to Wallet', callback_data: 'wallet' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error viewing active loan:', { error });
    await ctx.reply('Sorry, there was an error viewing your loan details.');
  }
}

export async function handleRepayLoan(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.session?.activeLoan) {
      await ctx.reply('No active loan found to repay.');
      return;
    }

    const loan = ctx.session.activeLoan;
    const magReward = lendingService.calculateMagReward(loan.amount);

    await ctx.reply(
      '💰 Loan Repayment\n\n' +
      `Amount Due: $${loan.repaymentAmount.toFixed(2)}\n` +
      `MAG Token Reward: ${magReward.toFixed(3)} $MAG\n\n` +
      '✨ Benefits of repaying on time:\n' +
      '• Earn MAG tokens as rewards\n' +
      '• Build credit score for larger loans\n' +
      '• Maintain good borrower status\n\n' +
      'Choose your repayment method:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Pay with Card', callback_data: 'repay_card' }],
            [{ text: '🏦 Pay with Bank Transfer', callback_data: 'repay_bank' }],
            [{ text: '📱 Pay with Crypto', callback_data: 'repay_crypto' }],
            [{ text: '❌ Cancel', callback_data: 'view_active_loan' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error in repayment handler:', { error });
    await ctx.reply('Sorry, there was an error processing your repayment request.');
  }
}