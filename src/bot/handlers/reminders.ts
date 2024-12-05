import { BotContext } from '../../types';
import { logger } from '../../services/logger';

export async function handleTelegramReminder(ctx: BotContext, timestamp: number) {
  try {
    const dueDate = new Date(timestamp);
    const now = new Date();
    
    // Calculate reminder dates
    const sevenDayReminder = new Date(timestamp);
    sevenDayReminder.setDate(sevenDayReminder.getDate() - 7);
    
    const threeDayReminder = new Date(timestamp);
    threeDayReminder.setDate(threeDayReminder.getDate() - 3);
    
    const oneDayReminder = new Date(timestamp);
    oneDayReminder.setDate(oneDayReminder.getDate() - 1);

    const loadingMsg = await ctx.reply('⚙️ Setting up reminders...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    await ctx.reply(
      '⏰ Reminder Settings\n\n' +
      'You will receive reminders:\n' +
      '• 7 days before due date\n' +
      '• 3 days before due date\n' +
      '• 24 hours before due date\n\n' +
      `Due Date: ${dueDate.toLocaleDateString()}\n\n` +
      '✅ Reminders have been set!',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Add to Google Calendar', callback_data: `reminder_gcal_${dueDate.getTime()}` }],
            [{ text: '📊 View Loan Details', callback_data: 'view_active_loan' }],
            [{ text: '❌ Cancel Reminders', callback_data: 'cancel_reminders' }]
          ]
        }
      }
    );

    // Store reminder settings in session
    ctx.session.reminders = {
      loanDueDate: timestamp,
      reminderDates: [
        sevenDayReminder.getTime(),
        threeDayReminder.getTime(),
        oneDayReminder.getTime()
      ]
    };

    logger.info('Reminders set for loan repayment', {
      userId: ctx.from?.id,
      dueDate: dueDate.toISOString(),
      reminders: ctx.session.reminders
    });

  } catch (error) {
    logger.error('Error setting reminders:', { error });
    await ctx.reply('Sorry, there was an error setting your reminders. Please try again.');
  }
}

export async function handleGoogleCalendarReminder(ctx: BotContext, timestamp: number) {
  try {
    const dueDate = new Date(timestamp);
    const loan = ctx.session?.activeLoan;
    
    if (!loan) {
      await ctx.reply('No active loan found.');
      return;
    }

    const loadingMsg = await ctx.reply('📅 Creating calendar event...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    // Get last 4 characters of loan ID for the event title
    const loanRef = loan.id.slice(-4);
    const eventTitle = `MagnifyCash Loan #${loanRef} Repayment`;
    const eventDescription = 
      `💰 Loan Amount: $${loan.amount}\n` +
      `💵 Repayment Amount: $${loan.repaymentAmount.toFixed(2)}\n` +
      `💫 MAG Token Reward: ${(loan.amount * 0.015).toFixed(3)} $MAG\n\n` +
      `Click here to repay: https://t.me/MagnifyLendingBot\n\n` +
      `Need help? Join our community: https://t.me/MagnifyCommunity`;

    // Format date for Google Calendar URL
    const formattedDate = dueDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(eventTitle)}` +
      `&dates=${formattedDate}/${formattedDate}` +
      `&details=${encodeURIComponent(eventDescription)}`;

    await ctx.reply(
      '📅 Add to Google Calendar\n\n' +
      'Click the link below to add this repayment reminder to your Google Calendar:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Add to Calendar', url: calendarUrl }],
            [{ text: '🔔 Set Telegram Reminders', callback_data: `reminder_tg_${dueDate.getTime()}` }],
            [{ text: '📊 View Loan Details', callback_data: 'view_active_loan' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error creating calendar event:', { error });
    await ctx.reply('Sorry, there was an error creating the calendar event. Please try again.');
  }
}