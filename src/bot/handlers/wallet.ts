import { BotContext } from '../../types';
import { logger } from '../../services/logger';
import { WalletManagerService } from '../../services/wallet';

const walletManager = new WalletManagerService();
const COINBASE_WALLET_URL = 'https://wallet.coinbase.com';

export async function createWallet(ctx: BotContext): Promise<void> {
  try {
    // Ensure session exists
    if (!ctx.session) {
      ctx.session = {
        didVerified: false
      };
    }

    const loadingMsg = await ctx.reply('⚙️ Initializing Coinbase Smart Wallet...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      loadingMsg.message_id,
      undefined,
      '🔐 Generating secure wallet credentials...'
    );
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const credentials = await walletManager.createWallet();
    
    // Update session with wallet address
    ctx.session.walletAddress = credentials.address;
    ctx.session.didVerified = false;
    
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    // Send credentials after delay
    const credentialsMsg = await ctx.reply(
      '✅ Your Coinbase Smart Wallet is ready!\n\n' +
      `Address: \`${credentials.address}\`\n` +
      `Private Key: \`${credentials.privateKey}\`\n` +
      `Recovery Phrase: \`${credentials.mnemonic}\`\n\n` +
      '⚠️ IMPORTANT: Save these credentials securely!\n' +
      '• Write down the recovery phrase on paper\n' +
      '• Never share your private key\n' +
      '• Delete this message after saving\n\n' +
      '💡 You can manage your wallet using the Coinbase Wallet app or web interface.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Open Coinbase Wallet', url: `${COINBASE_WALLET_URL}?address=${credentials.address}` }],
            [{ text: '✅ I\'ve Saved My Credentials', callback_data: 'credentials_saved' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );

    ctx.session.credentialsMsgId = credentialsMsg.message_id;

    logger.info('Coinbase wallet created successfully', {
      userId: ctx.from?.id,
      address: credentials.address,
      sessionUpdated: true
    });
  } catch (error) {
    logger.error('Error creating Coinbase wallet:', { error });
    await ctx.reply(
      '❌ Sorry, there was an error creating your wallet.\n' +
      'Please try again or contact support if the issue persists.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'check_membership' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );
  }
}

export async function handleWalletView(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.session?.walletAddress) {
      await ctx.reply(
        '❌ No wallet found!\n\n' +
        'Please create a wallet first using /start',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Start Over', callback_data: 'check_membership' }],
              [{ text: '❓ Help', callback_data: 'help' }]
            ]
          }
        }
      );
      return;
    }

    const loadingMsg = await ctx.reply('⚙️ Fetching wallet details...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const balance = await walletManager.getWalletBalance(ctx.session.walletAddress);

    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    await ctx.reply(
      '💼 Your Wallet\n\n' +
      `Address: \`${ctx.session.walletAddress}\`\n` +
      `Balance: ${balance} ETH\n\n` +
      `Status: ${ctx.session.didVerified ? '✅ Verified' : '❌ Not Verified'}\n\n` +
      'What would you like to do?',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Get a Loan', callback_data: 'loans' }],
            [{ text: '✅ Complete Verification', callback_data: 'verify' }],
            [{ text: '📱 Open in Coinbase Wallet', url: `${COINBASE_WALLET_URL}?address=${ctx.session.walletAddress}` }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );

    logger.info('Displayed wallet info', {
      userId: ctx.from?.id,
      address: ctx.session.walletAddress,
      balance
    });
  } catch (error) {
    logger.error('Error in wallet view handler:', { error });
    await ctx.reply('Sorry, there was an error viewing your wallet. Please try again.');
  }
}

export async function handleCredentialsSaved(ctx: BotContext): Promise<void> {
  try {
    // Start countdown
    const countdownMsg = await ctx.reply(
      '⚠️ SECURITY ALERT ⚠️\n\n' +
      'Your credentials will self-destruct in:\n\n' +
      '3...'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      countdownMsg.message_id,
      undefined,
      '⚠️ SECURITY ALERT ⚠️\n\n' +
      'Your credentials will self-destruct in:\n\n' +
      '2...'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      countdownMsg.message_id,
      undefined,
      '⚠️ SECURITY ALERT ⚠️\n\n' +
      'Your credentials will self-destruct in:\n\n' +
      '1...'
    );

    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      countdownMsg.message_id,
      undefined,
      '💥 BOOM! Credentials deleted securely.'
    );

    // Delete credentials message
    if (ctx.session?.credentialsMsgId) {
      await ctx.telegram.deleteMessage(ctx.chat!.id, ctx.session.credentialsMsgId);
      delete ctx.session.credentialsMsgId;
    }

    // Delete original countdown message after a short delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ctx.telegram.deleteMessage(ctx.chat!.id, countdownMsg.message_id);

    // Show next steps
    await ctx.reply(
      '✅ Great! Your wallet is ready to use.\n\n' +
      'Next step: Complete identity verification to access lending services.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Complete Verification', callback_data: 'verify' }],
            [{ text: '💼 View Wallet', callback_data: 'wallet' }],
            [{ text: '❓ Help', callback_data: 'help' }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error('Error handling credentials saved:', { error });
  }
}