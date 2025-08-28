import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  success: boolean;
  cleaned_items?: {
    expired_otps: number;
    old_logs?: number;
  };
  error?: string;
  timestamp: string;
}

const cleanupExpiredOtps = async (supabase: any): Promise<number> => {
  try {
    // Delete OTPs that expired more than 1 day ago
    const { count } = await supabase
      .from('otp_codes')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`Cleaned up ${count || 0} expired OTP codes`);
    return count || 0;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

const cleanupOldVerifiedOtps = async (supabase: any): Promise<number> => {
  try {
    // Delete verified OTPs older than 7 days
    const { count } = await supabase
      .from('otp_codes')
      .delete({ count: 'exact' })
      .eq('status', 'verified')
      .lt('verified_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    console.log(`Cleaned up ${count || 0} old verified OTP codes`);
    return count || 0;
  } catch (error) {
    console.error('Error cleaning up old verified OTPs:', error);
    return 0;
  }
};

const cleanupFailedOtps = async (supabase: any): Promise<number> => {
  try {
    // Delete failed OTPs older than 1 day
    const { count } = await supabase
      .from('otp_codes')
      .delete({ count: 'exact' })
      .eq('status', 'failed')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`Cleaned up ${count || 0} failed OTP codes`);
    return count || 0;
  } catch (error) {
    console.error('Error cleaning up failed OTPs:', error);
    return 0;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should only be called by cron jobs or admin
    // In production, you might want to validate a secret token here
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    // Allow calls from cron jobs with secret or authenticated admin users
    if (!cronSecret && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - This endpoint is for scheduled cleanup only' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Starting scheduled cleanup...');

    // Run cleanup operations in parallel
    const [expiredOtps, verifiedOtps, failedOtps] = await Promise.all([
      cleanupExpiredOtps(supabase),
      cleanupOldVerifiedOtps(supabase),
      cleanupFailedOtps(supabase)
    ]);

    const totalCleaned = expiredOtps + verifiedOtps + failedOtps;
    
    const result: CleanupResult = {
      success: true,
      cleaned_items: {
        expired_otps: totalCleaned
      },
      timestamp: new Date().toISOString()
    };

    console.log('Cleanup completed successfully:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-expired-data function:', error);
    
    const errorResult: CleanupResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResult),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});