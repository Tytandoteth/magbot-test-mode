import { Context, MiddlewareFn } from 'telegraf';
import { Message, CallbackQuery } from 'telegraf/types';
import { BotContext } from '../../types';
import { logger } from '../../services/logger';

// Message deduplication middleware
const processedMessages = new Map<string, number>();
const MESSAGE_EXPIRY = 30000; // 30 seconds

export const deduplicationMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const messageId = ctx.message?.message_id || ctx.callbackQuery?.message?.message_id;
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  
  if (!messageId || !chatId || !userId) {
    logger.debug('Missing required message info, skipping deduplication');
    return next();
  }

  const key = `${userId}:${messageId}`;
  const now = Date.now();

  // Clean up expired entries
  for (const [storedKey, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_EXPIRY) {
      processedMessages.delete(storedKey);
    }
  }

  if (processedMessages.has(key)) {
    logger.debug('Duplicate message detected', { key });
    return;
  }

  processedMessages.set(key, now);
  return next();
};

// Logging middleware
export const loggingMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const startTime = Date.now();
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
  const callbackData = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  
  const update = {
    type: ctx.updateType,
    from: username,
    userId,
    text: messageText,
    callback: callbackData,
    sessionState: {
      walletAddress: ctx.session?.walletAddress,
      isVerified: ctx.session?.didVerified,
      step: ctx.session?.step
    }
  };
  
  logger.debug('Processing update:', update);
  
  try {
    await next();
    
    const duration = Date.now() - startTime;
    logger.debug('Update completed', { 
      ...update,
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error processing update', { 
      error,
      ...update,
      duration: `${duration}ms`
    });
    throw error;
  }
};

// Error handler middleware
export const errorHandlerMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;

    logger.error('Unhandled error in middleware', { 
      error,
      userId,
      username,
      updateType: ctx.updateType,
      sessionState: {
        walletAddress: ctx.session?.walletAddress,
        isVerified: ctx.session?.didVerified,
        step: ctx.session?.step
      }
    });
    
    try {
      await ctx.reply(
        '❌ An error occurred while processing your request.\n\n' +
        'Please try again later or contact support if the issue persists.'
      );
    } catch (replyError) {
      logger.error('Failed to send error message to user', { 
        error: replyError,
        userId,
        username
      });
    }
  }
};