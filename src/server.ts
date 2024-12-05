import express from 'express';
import { logger } from './services/logger';
import { BotContext } from './types';
import { Telegraf } from 'telegraf';

export class HealthServer {
  private app: express.Application;
  private bot: Telegraf<BotContext> | null = null;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  setBotInstance(bot: Telegraf<BotContext>) {
    this.bot = bot;
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      try {
        const status = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          botStatus: this.bot ? 'running' : 'initializing'
        };
        res.status(200).json(status);
      } catch (error) {
        logger.error('Health check failed:', { error });
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Error handling middleware
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Server error:', { error: err });
      res.status(500).json({
        status: 'error',
        message: err.message
      });
    });
  }

  start(port: number = 3000) {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(port, () => {
          logger.info(`Health check server listening on port ${port}`);
          resolve(server);
        });
      } catch (error) {
        logger.error('Failed to start health check server:', { error });
        reject(error);
      }
    });
  }
}