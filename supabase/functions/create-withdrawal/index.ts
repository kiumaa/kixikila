import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-WITHDRAWAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message}`);
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { amount, iban, accountHolderName, bankName } = await req.json();
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    if (!iban || !accountHolderName) {
      throw new Error("IBAN and account holder name are required");
    }

    logStep("Request validated", { amount, iban: iban.substring(0, 4) + "****" });

    // Check user balance from transactions
    const { data: userTransactions, error: transError } = await supabaseClient
      .from("transactions")
      .select("amount, type")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (transError) {
      throw new Error(`Error fetching balance: ${transError.message}`);
    }

    // Calculate current balance
    const balance = userTransactions.reduce((total, transaction) => {
      if (transaction.type === 'deposit' || transaction.type === 'reward') {
        return total + Number(transaction.amount);
      } else if (transaction.type === 'withdrawal' || transaction.type === 'payment') {
        return total - Number(transaction.amount);
      }
      return total;
    }, 0);

    logStep("Balance calculated", { balance, requestedAmount: amount });

    if (balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Check or create payout account
    let { data: payoutAccount, error: payoutError } = await supabaseClient
      .from("payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("iban", iban)
      .single();

    if (payoutError && payoutError.code !== 'PGRST116') {
      throw new Error(`Payout account error: ${payoutError.message}`);
    }

    if (!payoutAccount) {
      // Create new payout account
      const { data: newPayoutAccount, error: createError } = await supabaseClient
        .from("payout_accounts")
        .insert({
          user_id: user.id,
          type: 'manual',
          iban: iban,
          account_holder_name: accountHolderName,
          bank_name: bankName || null,
          is_verified: false
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating payout account: ${createError.message}`);
      }

      payoutAccount = newPayoutAccount;
      logStep("Created new payout account", { accountId: payoutAccount.id });
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseClient
      .from("withdrawals")
      .insert({
        user_id: user.id,
        payout_account_id: payoutAccount.id,
        amount: amount,
        status: 'pending',
        method: 'manual',
        metadata: {
          requested_at: new Date().toISOString(),
          user_agent: req.headers.get("user-agent"),
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        }
      })
      .select()
      .single();

    if (withdrawalError) {
      throw new Error(`Error creating withdrawal: ${withdrawalError.message}`);
    }

    logStep("Withdrawal created successfully", { withdrawalId: withdrawal.id });

    // Create corresponding transaction record
    const { error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: -amount, // Negative for withdrawal
        description: `Levantamento para conta ${iban.substring(0, 4)}****`,
        status: 'pending',
        currency: 'EUR',
        payment_method: 'manual',
        metadata: {
          withdrawal_id: withdrawal.id,
          payout_account_id: payoutAccount.id,
          iban_preview: iban.substring(0, 4) + "****"
        }
      });

    if (transactionError) {
      console.warn("Failed to create transaction record:", transactionError);
    }

    // TODO: Send notification to admins about new withdrawal request

    return new Response(JSON.stringify({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        method: withdrawal.method,
        created_at: withdrawal.created_at
      },
      message: "Pedido de levantamento criado com sucesso"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-withdrawal", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});