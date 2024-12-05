import express, { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { BotContext } from '../../types';
import { Telegraf } from 'telegraf';
import os from 'os';

const isDevelopment = process.env.NODE_ENV === 'development';

export interface HealthServerOptions {
  port?: number;
  memoryThreshold?: number;
}

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  percentUsed: number;
  total: number;
  free: number;
}

interface SystemStatus {
  memory: MemoryUsage;
  uptime: number;
  nodeVersion: string;
  platform: string;
  cpuUsage: number;
}

interface BotStatus {
  healthy: boolean;
  running: boolean;
  lastCheck: string;
  error?: string;
}

interface HealthStatus {
  healthy: boolean;
  timestamp: string;
  bot: BotStatus;
  system: SystemStatus;
}

export class HealthServer {
  private app: express.Application;
  private server: any;
  private bot: Telegraf<BotContext> | null = null;
  private readonly port: number;
  private readonly memoryThreshold: number;

  constructor(options: HealthServerOptions = {}) {
    this.port = options.port || 3000;
    this.memoryThreshold = options.memoryThreshold || 90;
    this.app = express();
    this.setupRoutes();
  }

  setBotInstance(bot: Telegraf<BotContext>) {
    this.bot = bot;
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const status = await this.getFullStatus();
        res.status(status.healthy ? 200 : 503).json(status);
      } catch (error) {
        logger.error('Health check failed:', { error });
        res.status(500).json({
          healthy: false,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Server error:', { error: err });
      res.status(500).json({
        status: 'error',
        message: err.message
      });
    });
  }

  private getMemoryUsage(): MemoryUsage {
    const used = process.memoryUsage();
    const total = os.totalmem();
    const free = os.freemem();
    const percentUsed = ((total - free) / total) * 100;

    return {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      rss: Math.round(used.rss / 1024 / 1024),
      percentUsed: Math.round(percentUsed),
      total: Math.round(total / 1024 / 1024),
      free: Math.round(free / 1024 / 1024)
    };
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => 
      acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0), 0);
    return Math.round(100 * (1 - totalIdle / totalTick));
  }

  private async checkBotStatus(): Promise<BotStatus> {
    try {
      if (!this.bot) {
        return {
          healthy: false,
          running: false,
          lastCheck: new Date().toISOString(),
          error: 'Bot not initialized'
        };
      }

      if (isDevelopment) {
        return {
          healthy: true,
          running: true,
          lastCheck: new Date().toISOString()
        };
      }

      // Check if bot can get webhook info as a basic connectivity test
      await this.bot.telegram.getWebhookInfo();

      return {
        healthy: true,
        running: true,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Bot status check failed:', { error });
      return {
        healthy: false,
        running: false,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getFullStatus(): Promise<HealthStatus> {
    const memoryUsage = this.getMemoryUsage();
    const botStatus = await this.checkBotStatus();
    
    const systemStatus: SystemStatus = {
      memory: memoryUsage,
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: this.getCpuUsage()
    };

    return {
      healthy: botStatus.healthy && memoryUsage.percentUsed < this.memoryThreshold,
      timestamp: new Date().toISOString(),
      bot: botStatus,
      system: systemStatus
    };
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          logger.info(`Health check server listening on port ${this.port}`);
          resolve();
        });
      } catch (error) {
        logger.error('Failed to start health check server:', { error });
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err?: Error) => {
        if (err) {
          logger.error('Error stopping health check server:', { error: err });
          reject(err);
          return;
        }
        logger.info('Health check server stopped');
        resolve();
      });
    });
  }
}