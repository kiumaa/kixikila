import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Process different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        const userId = session.metadata?.user_id;
        const purpose = session.metadata?.purpose || "deposit";
        const amount = (session.amount_total || 0) / 100;

        if (userId) {
          // Create payment record
          await supabaseClient.from("payments").insert({
            stripe_event_id: event.id,
            user_id: userId,
            amount,
            currency: session.currency?.toUpperCase() || 'EUR',
            status: "succeeded",
            purpose,
            metadata: session,
          });

          // Create transaction record
          await supabaseClient.from("transactions").insert({
            user_id: userId,
            type: purpose === 'vip' ? 'payment' : 'deposit',
            amount: amount,
            description: purpose === 'vip' ? 'Pagamento VIP' : 'Depósito via Stripe',
            status: 'completed',
            currency: session.currency?.toUpperCase() || 'EUR',
            payment_method: 'stripe',
            payment_reference: session.payment_intent as string,
            metadata: {
              stripe_session_id: session.id,
              stripe_event_id: event.id,
              purpose
            }
          });

          logStep("Payment and transaction recorded", { userId, amount, purpose });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.succeeded", { piId: paymentIntent.id });

        const userId = paymentIntent.metadata?.user_id;
        const purpose = paymentIntent.metadata?.purpose || "deposit";
        const amount = (paymentIntent.amount_received || 0) / 100;

        if (userId) {
          await supabaseClient.from("payments").insert({
            stripe_event_id: event.id,
            user_id: userId,
            amount,
            currency: paymentIntent.currency?.toUpperCase() || 'EUR',
            status: "succeeded",
            purpose,
            metadata: paymentIntent,
          });

          logStep("Payment intent recorded", { userId, amount });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.payment_failed", { piId: paymentIntent.id });

        const userId = paymentIntent.metadata?.user_id;
        const purpose = paymentIntent.metadata?.purpose || "deposit";
        const amount = (paymentIntent.amount || 0) / 100;

        if (userId) {
          await supabaseClient.from("payments").insert({
            stripe_event_id: event.id,
            user_id: userId,
            amount,
            currency: paymentIntent.currency?.toUpperCase() || 'EUR',
            status: "failed",
            purpose,
            metadata: paymentIntent,
          });

          logStep("Failed payment recorded", { userId, amount });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id });

        const subscriptionId = invoice.subscription as string;
        const userId = invoice.metadata?.user_id;

        if (userId && subscriptionId) {
          // Update subscription status
          await supabaseClient.from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_end: new Date((invoice.lines.data[0]?.period?.end || 0) * 1000),
          }, {
            onConflict: 'stripe_subscription_id'
          });

          logStep("Subscription updated", { userId, subscriptionId });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

        const subscriptionId = invoice.subscription as string;
        const userId = invoice.metadata?.user_id;

        if (userId && subscriptionId) {
          await supabaseClient.from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: "past_due",
            current_period_end: new Date((invoice.lines.data[0]?.period?.end || 0) * 1000),
          }, {
            onConflict: 'stripe_subscription_id'
          });

          logStep("Subscription marked as past_due", { userId, subscriptionId });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

        await supabaseClient
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        logStep("Subscription canceled", { subscriptionId: subscription.id });
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Processing payout.paid", { payoutId: payout.id });

        // Update withdrawal status
        const { error } = await supabaseClient
          .from("withdrawals")
          .update({
            status: "paid",
            processed_at: new Date().toISOString(),
            metadata: payout,
          })
          .eq("stripe_payout_id", payout.id);

        if (error) {
          logStep("Error updating withdrawal", { error: error.message });
        } else {
          logStep("Withdrawal marked as paid", { payoutId: payout.id });
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        logStep("Processing payout.failed", { payoutId: payout.id });

        const { error } = await supabaseClient
          .from("withdrawals")
          .update({
            status: "failed",
            failure_reason: payout.failure_message || "Payout failed",
            metadata: payout,
          })
          .eq("stripe_payout_id", payout.id);

        if (error) {
          logStep("Error updating withdrawal", { error: error.message });
        } else {
          logStep("Withdrawal marked as failed", { payoutId: payout.id });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});