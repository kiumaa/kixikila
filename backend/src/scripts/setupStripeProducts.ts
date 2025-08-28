import Stripe from 'stripe';
import { config } from '../config/index.js';
import { logger } from '../utils/logger';

interface ProductConfig {
  name: string;
  description: string;
  prices: {
    currency: string;
    amount: number;
    interval?: 'month' | 'year';
    intervalCount?: number;
  }[];
  metadata?: Record<string, string>;
}

class StripeProductSetup {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Setup KIXIKILA products and pricing
   */
  async setupProducts(): Promise<void> {
    try {
      logger.info('🚀 Starting Stripe products setup...');

      const products: ProductConfig[] = [
        {
          name: 'KIXIKILA Premium',
          description: 'Plano premium do KIXIKILA com recursos avançados para gestão de grupos e transações',
          metadata: {
            type: 'subscription',
            features: 'unlimited_groups,advanced_analytics,priority_support,export_data'
          },
          prices: [
            {
              currency: 'usd',
              amount: 999, // $9.99/month
              interval: 'month'
            },
            {
              currency: 'usd',
              amount: 9999, // $99.99/year (2 months free)
              interval: 'year'
            }
          ]
        },
        {
          name: 'KIXIKILA Pro',
          description: 'Plano profissional para pequenas empresas e organizações',
          metadata: {
            type: 'subscription',
            features: 'unlimited_groups,team_management,advanced_reports,api_access'
          },
          prices: [
            {
              currency: 'usd',
              amount: 2999, // $29.99/month
              interval: 'month'
            },
            {
              currency: 'usd',
              amount: 29999, // $299.99/year (2 months free)
              interval: 'year'
            }
          ]
        },
        {
          name: 'KIXIKILA Enterprise',
          description: 'Solução empresarial com recursos completos e suporte dedicado',
          metadata: {
            type: 'subscription',
            features: 'unlimited_everything,dedicated_support,custom_integrations,white_label'
          },
          prices: [
            {
              currency: 'usd',
              amount: 9999, // $99.99/month
              interval: 'month'
            },
            {
              currency: 'usd',
              amount: 99999, // $999.99/year (2 months free)
              interval: 'year'
            }
          ]
        },
        {
          name: 'Transação Premium',
          description: 'Taxa para transações premium com recursos avançados',
          metadata: {
            type: 'one_time',
            features: 'priority_processing,detailed_tracking,instant_notifications'
          },
          prices: [
            {
              currency: 'usd',
              amount: 199 // $1.99 per transaction
            }
          ]
        }
      ];

      for (const productConfig of products) {
        await this.createProductWithPrices(productConfig);
      }

      logger.info('✅ Stripe products setup completed successfully!');
    } catch (error) {
      logger.error('❌ Failed to setup Stripe products:', error);
      throw error;
    }
  }

  /**
   * Create product with associated prices
   */
  private async createProductWithPrices(productConfig: ProductConfig): Promise<void> {
    try {
      // Check if product already exists
      const existingProducts = await this.stripe.products.list({
        limit: 100
      });

      const existingProduct = existingProducts.data.find(
        product => product.name === productConfig.name
      );

      let product: Stripe.Product;

      if (existingProduct) {
        logger.info(`📦 Product "${productConfig.name}" already exists, updating...`);
        product = await this.stripe.products.update(existingProduct.id, {
          description: productConfig.description,
          metadata: productConfig.metadata || {}
        });
      } else {
        logger.info(`📦 Creating product: ${productConfig.name}`);
        product = await this.stripe.products.create({
          name: productConfig.name,
          description: productConfig.description,
          metadata: productConfig.metadata || {}
        });
      }

      // Create prices for the product
      for (const priceConfig of productConfig.prices) {
        await this.createPrice(product.id, priceConfig);
      }

      logger.info(`✅ Product "${productConfig.name}" setup completed`);
    } catch (error) {
      logger.error(`❌ Failed to create product "${productConfig.name}":`, error);
      throw error;
    }
  }

  /**
   * Create price for a product
   */
  private async createPrice(
    productId: string, 
    priceConfig: ProductConfig['prices'][0]
  ): Promise<void> {
    try {
      const priceData: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency
      };

      if (priceConfig.interval) {
        priceData.recurring = {
          interval: priceConfig.interval,
          interval_count: priceConfig.intervalCount || 1
        };
      }

      // Check if price already exists
      const existingPrices = await this.stripe.prices.list({
        product: productId,
        limit: 100
      });

      const existingPrice = existingPrices.data.find(price => 
        price.unit_amount === priceConfig.amount &&
        price.currency === priceConfig.currency &&
        (price.recurring?.interval === priceConfig.interval || (!price.recurring && !priceConfig.interval))
      );

      if (existingPrice) {
        logger.info(`💰 Price ${priceConfig.amount/100} ${priceConfig.currency.toUpperCase()}${priceConfig.interval ? `/${priceConfig.interval}` : ''} already exists`);
        return;
      }

      const price = await this.stripe.prices.create(priceData);
      logger.info(`💰 Created price: ${price.unit_amount!/100} ${price.currency.toUpperCase()}${price.recurring ? `/${price.recurring.interval}` : ''}`);
    } catch (error) {
      logger.error('❌ Failed to create price:', error);
      throw error;
    }
  }

  /**
   * List all products and prices
   */
  async listProducts(): Promise<void> {
    try {
      const products = await this.stripe.products.list({
        limit: 100,
        expand: ['data.default_price']
      });

      logger.info('📋 Current Stripe Products:');
      for (const product of products.data) {
        logger.info(`  📦 ${product.name} (${product.id})`);
        
        const prices = await this.stripe.prices.list({
          product: product.id,
          limit: 100
        });

        for (const price of prices.data) {
          const amount = price.unit_amount! / 100;
          const currency = price.currency.toUpperCase();
          const interval = price.recurring ? `/${price.recurring.interval}` : '';
          logger.info(`    💰 ${amount} ${currency}${interval} (${price.id})`);
        }
      }
    } catch (error) {
      logger.error('❌ Failed to list products:', error);
      throw error;
    }
  }
}

// Script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new StripeProductSetup();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setup.setupProducts()
        .then(() => {
          logger.info('🎉 Setup completed successfully!');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('💥 Setup failed:', error);
          process.exit(1);
        });
      break;
      
    case 'list':
      setup.listProducts()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          logger.error('💥 List failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      logger.info('Usage: npm run stripe:setup [setup|list]');
      process.exit(1);
  }
}

export { StripeProductSetup };