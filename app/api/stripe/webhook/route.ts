import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update transaction status
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            payment_reference: paymentIntent.id,
            metadata: paymentIntent.metadata
          })
          .eq('payment_reference', paymentIntent.id);

        if (error) {
          console.error('Error updating transaction:', error);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update transaction status
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'failed',
            failed_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
            metadata: paymentIntent.metadata
          })
          .eq('payment_reference', paymentIntent.id);

        if (error) {
          console.error('Error updating failed transaction:', error);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update user VIP status based on subscription
        if (subscription.metadata?.user_id) {
          const { error } = await supabase
            .from('users')
            .update({
              is_vip: subscription.status === 'active',
              vip_expiry_date: subscription.status === 'active' 
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null
            })
            .eq('id', subscription.metadata.user_id);

          if (error) {
            console.error('Error updating VIP status:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 }
    );
  }
}