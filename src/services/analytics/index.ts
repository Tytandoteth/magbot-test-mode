import mongoose from 'mongoose';
import { logger } from '../logger';
import { config } from '../../config';
import { UserSchema, LoanSchema, EventSchema } from './schemas';
import { AnalyticsEvent, UserStats, LoanStats } from '../../types/analytics';

export class AnalyticsService {
  private User = mongoose.model('User', UserSchema);
  private Loan = mongoose.model('Loan', LoanSchema);
  private Event = mongoose.model('Event', EventSchema);

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await mongoose.connect(config.mongodb.uri);
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection error:', { error });
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.Event.create({
        ...event,
        timestamp: new Date()
      });

      logger.debug('Event tracked:', { event });
    } catch (error) {
      logger.error('Error tracking event:', { error, event });
    }
  }

  async updateUserStats(userId: number, update: Partial<UserStats>): Promise<void> {
    try {
      await this.User.findOneAndUpdate(
        { userId },
        { $set: update },
        { upsert: true }
      );

      logger.debug('User stats updated:', { userId, update });
    } catch (error) {
      logger.error('Error updating user stats:', { error, userId });
    }
  }

  async updateLoanStats(loanId: string, update: Partial<LoanStats>): Promise<void> {
    try {
      await this.Loan.findOneAndUpdate(
        { loanId },
        { $set: update },
        { upsert: true }
      );

      logger.debug('Loan stats updated:', { loanId, update });
    } catch (error) {
      logger.error('Error updating loan stats:', { error, loanId });
    }
  }

  async getUserStats(userId: number): Promise<UserStats | null> {
    try {
      return await this.User.findOne({ userId });
    } catch (error) {
      logger.error('Error getting user stats:', { error, userId });
      return null;
    }
  }

  async getLoanStats(loanId: string): Promise<LoanStats | null> {
    try {
      return await this.Loan.findOne({ loanId });
    } catch (error) {
      logger.error('Error getting loan stats:', { error, loanId });
      return null;
    }
  }

  async getAggregateStats(): Promise<{
    totalUsers: number;
    activeLoans: number;
    totalLoanVolume: number;
    avgLoanAmount: number;
    repaymentRate: number;
  }> {
    try {
      const [userCount, loanStats] = await Promise.all([
        this.User.countDocuments(),
        this.Loan.aggregate([
          {
            $group: {
              _id: null,
              activeLoans: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
              },
              totalVolume: { $sum: '$amount' },
              totalLoans: { $sum: 1 },
              repaidLoans: {
                $sum: { $cond: [{ $eq: ['$status', 'repaid'] }, 1, 0] }
              }
            }
          }
        ])
      ]);

      const stats = loanStats[0] || {
        activeLoans: 0,
        totalVolume: 0,
        totalLoans: 0,
        repaidLoans: 0
      };

      return {
        totalUsers: userCount,
        activeLoans: stats.activeLoans,
        totalLoanVolume: stats.totalVolume,
        avgLoanAmount: stats.totalLoans ? stats.totalVolume / stats.totalLoans : 0,
        repaymentRate: stats.totalLoans ? stats.repaidLoans / stats.totalLoans : 0
      };
    } catch (error) {
      logger.error('Error getting aggregate stats:', { error });
      return {
        totalUsers: 0,
        activeLoans: 0,
        totalLoanVolume: 0,
        avgLoanAmount: 0,
        repaymentRate: 0
      };
    }
  }
}