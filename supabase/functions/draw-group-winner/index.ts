import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrawWinnerRequest {
  groupId: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DRAW-WINNER] Function started');

    // Parse request body
    const { groupId }: DrawWinnerRequest = await req.json();
    
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    console.log('[DRAW-WINNER] Drawing winner for group:', groupId);

    // Get group details and verify admin permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid authentication token');
    }

    // Verify user is admin of the group
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userData.user.id)
      .single();

    if (memberError || !memberData || !['creator', 'admin'].includes(memberData.role)) {
      throw new Error('Only group admins can draw winners');
    }

    // Get all active members who have paid their contribution
    const { data: activeMembers, error: membersError } = await supabase
      .from('group_members')
      .select(`
        id,
        user_id,
        users!inner(full_name)
      `)
      .eq('group_id', groupId)
      .eq('status', 'active');

    if (membersError) {
      console.error('[DRAW-WINNER] Error fetching members:', membersError);
      throw new Error('Failed to fetch group members');
    }

    if (!activeMembers || activeMembers.length === 0) {
      throw new Error('No active members found for drawing');
    }

    console.log('[DRAW-WINNER] Found', activeMembers.length, 'active members');

    // Check if all members have paid (for lottery groups)
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('group_type, contribution_amount, current_cycle')
      .eq('id', groupId)
      .single();

    if (groupError) {
      throw new Error('Failed to fetch group data');
    }

    // For lottery groups, ensure all members have paid
    if (groupData.group_type === 'lottery') {
      // Check recent transactions to see who has paid
      const { data: recentTransactions, error: transError } = await supabase
        .from('transactions')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('type', 'group_payment')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (transError) {
        console.error('[DRAW-WINNER] Error checking payments:', transError);
      }

      const paidMemberIds = new Set(recentTransactions?.map(t => t.user_id) || []);
      
      // Filter to only members who have paid
      const eligibleMembers = activeMembers.filter(member => paidMemberIds.has(member.user_id));
      
      if (eligibleMembers.length === 0) {
        throw new Error('No members have paid their contributions yet');
      }

      console.log('[DRAW-WINNER] Found', eligibleMembers.length, 'eligible members who have paid');
    }

    // Randomly select a winner
    const eligibleMembers = activeMembers;
    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const winner = eligibleMembers[randomIndex];

    console.log('[DRAW-WINNER] Selected winner:', winner.users.full_name);

    // Calculate prize amount (total contributions from all members)
    const prizeAmount = groupData.contribution_amount * activeMembers.length;

    // Create group cycle record
    const { data: cycleData, error: cycleError } = await supabase
      .from('group_cycles')
      .insert({
        group_id: groupId,
        cycle_number: groupData.current_cycle || 1,
        winner_user_id: winner.user_id,
        winner_member_id: winner.id,
        prize_amount: prizeAmount,
        draw_method: groupData.group_type,
        participants: eligibleMembers.map(m => ({
          user_id: m.user_id,
          name: m.users.full_name
        })),
        metadata: {
          total_members: activeMembers.length,
          eligible_members: eligibleMembers.length,
          draw_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (cycleError) {
      console.error('[DRAW-WINNER] Error creating cycle:', cycleError);
      throw new Error('Failed to record draw results');
    }

    // Update group with next cycle
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        current_cycle: (groupData.current_cycle || 1) + 1,
        last_draw_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    if (updateError) {
      console.error('[DRAW-WINNER] Error updating group:', updateError);
    }

    // Create transaction for the winner
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: winner.user_id,
        type: 'group_receipt',
        amount: prizeAmount,
        status: 'completed',
        description: `Prémio do sorteio - ${cycleData.id}`,
        group_id: groupId,
        payment_method: 'internal',
        metadata: {
          cycle_id: cycleData.id,
          cycle_number: cycleData.cycle_number,
          draw_method: groupData.group_type
        }
      });

    if (transactionError) {
      console.error('[DRAW-WINNER] Error creating winner transaction:', transactionError);
    }

    // Send notifications to all members
    const notifications = activeMembers.map(member => ({
      user_id: member.user_id,
      title: member.user_id === winner.user_id ? '🎉 Parabéns! Foi contemplado!' : '🎯 Sorteio realizado',
      message: member.user_id === winner.user_id 
        ? `Ganhou ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(prizeAmount)} no grupo ${groupId}!`
        : `${winner.users.full_name} foi contemplado(a) com ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(prizeAmount)}`,
      type: member.user_id === winner.user_id ? 'success' : 'info',
      metadata: {
        group_id: groupId,
        cycle_id: cycleData.id,
        winner_id: winner.user_id,
        prize_amount: prizeAmount
      }
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('[DRAW-WINNER] Error sending notifications:', notificationError);
    }

    console.log('[DRAW-WINNER] Draw completed successfully');

    return new Response(JSON.stringify({
      success: true,
      winner: {
        user_id: winner.user_id,
        name: winner.users.full_name,
        prize_amount: prizeAmount
      },
      cycle: {
        id: cycleData.id,
        number: cycleData.cycle_number,
        draw_date: cycleData.draw_date
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[DRAW-WINNER] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});