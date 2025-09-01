import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create a Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body for plan information
    const { plan_type = 'pro_promo_monthly', amount } = await req.json();
    
    // Determine correct amount based on plan
    let finalAmount;
    let productName;
    let productDescription;
    
    if (plan_type === 'pro_promo_monthly') {
      finalAmount = 599;  // €5.99 (promo price)
      productName = "KIXIKILA Pro - Promoção Lançamento";
      productDescription = "Grupos ilimitados, estatísticas avançadas e suporte prioritário (Preço promocional)";
    } else if (plan_type === 'pro_monthly') {
      finalAmount = 999;  // €9.99 (regular price)
      productName = "KIXIKILA Pro Mensal";
      productDescription = "Grupos ilimitados, estatísticas avançadas e suporte prioritário";
    } else {
      finalAmount = 599;  // Default to promo price
      productName = "KIXIKILA Pro - Promoção Lançamento";
      productDescription = "Grupos ilimitados, estatísticas avançadas e suporte prioritário (Preço promocional)";
    }
    
    logStep("Request data", { plan: plan_type, amount: finalAmount, productName });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("Creating new customer");
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "https://kixikila.pt";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: productName,
              description: productDescription
            },
            unit_amount: finalAmount, // amount in cents
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/payment/success?upgrade=success`,
      cancel_url: `${origin}/app?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
        plan: plan_type,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});