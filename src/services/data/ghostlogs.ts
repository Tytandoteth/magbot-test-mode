import { logger } from '../logger';
import { QueryConfig, GhostLogsResponse } from '../../types';

export class GhostlogsService {
  private readonly api: string;
  private readonly graphshare: string;
  private readonly apiKey: string;

  constructor() {
    this.api = "https://api.ghostlogs.xyz/gg/pub/8bf67182-75f2-41e8-ae10-bd4d26d9c91e/ghostgraph";
    this.graphshare = "f9605a19-329b-46fb-aee6-dbabade74956";
    this.apiKey = process.env.GHOST_KEY || '';
  }

  async getUserLoans(address: string): Promise<GhostLogsResponse> {
    try {
      logger.info('Fetching user loans', {
        walletAddress: address,
        operation: 'get_user_loans',
        component: 'ghostlogs_service'
      });

      // In development mode, return mock data
      if (process.env.NODE_ENV === 'development') {
        return {
          data: {
            loans: {
              items: []
            }
          }
        };
      }

      const query = `
        query GetUserLoans($address: String!) {
          loans(where: { borrower: $address }) {
            items {
              id
              amount
              status
              dueDate
              totalDue
            }
          }
        }
      `;

      const result = await this.queryWithCache(
        query,
        { address },
        {
          cacheDuration: 300000,
          retryAttempts: 3,
          timeout: 5000,
        }
      );

      logger.info('Successfully retrieved user loans', {
        walletAddress: address,
        operation: 'get_user_loans',
        component: 'ghostlogs_service',
        additionalData: { 
          loanCount: result.data?.loans?.items?.length || 0
        }
      });

      return result;
    } catch (error) {
      logger.error('Error fetching user loans:', { error });
      // Return empty result in case of error
      return {
        data: {
          loans: {
            items: []
          }
        }
      };
    }
  }

  private async queryWithCache(
    query: string,
    variables: Record<string, unknown>,
    config: QueryConfig
  ): Promise<GhostLogsResponse> {
    try {
      logger.info('Executing Ghostlogs query', {
        operation: 'ghostlogs_query',
        component: 'ghostlogs_service',
        additionalData: {
          query,
          variables,
          config
        }
      });

      const response = await fetch(this.api, {
        method: 'POST',
        headers: {
          'X-GHOST-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ghostlogs API error: ${response.statusText}`);
      }

      const data = await response.json() as GhostLogsResponse;
      
      if (data.errors) {
        logger.error('GraphQL errors in response', {
          operation: 'ghostlogs_query',
          component: 'ghostlogs_service',
          additionalData: { errors: data.errors }
        });
      }

      return data;
    } catch (error) {
      logger.error('Error in Ghostlogs query:', { error });
      throw error;
    }
  }
}