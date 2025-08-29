import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  groupId: string;
  emails: string[];
  phones?: string[];
  role?: 'admin' | 'member';
  message?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized");
    }

    const {
      groupId,
      emails,
      phones = [],
      role = 'member',
      message = ''
    }: InvitationRequest = await req.json();

    console.log("Processing invitations for group:", groupId);

    // Verify user is group admin
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership || !['creator', 'admin'].includes(membership.role)) {
      throw new Error("Permission denied: Must be group admin");
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      throw new Error("Group not found");
    }

    const invitations = [];
    const results = [];

    // Process email invitations
    for (const email of emails) {
      try {
        // Generate secure token
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_invite_token');

        if (tokenError) {
          console.error("Token generation error:", tokenError);
          throw new Error("Failed to generate invitation token");
        }

        const inviteToken = tokenData;

        // Create invitation record
        const { data: invitation, error: invitationError } = await supabase
          .from('group_invitations')
          .insert({
            group_id: groupId,
            invited_by: user.id,
            email: email,
            invite_token: inviteToken,
            role: role,
            message: message
          })
          .select()
          .single();

        if (invitationError) {
          console.error("Invitation creation error:", invitationError);
          results.push({ email, success: false, error: "Failed to create invitation" });
          continue;
        }

        // Send email invitation
        const inviteLink = `${Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://kixikila.pt')}/join/${inviteToken}`;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Convite para o Grupo KIXIKILA</h2>
            <p>Olá!</p>
            <p>Foste convidado(a) para participar no grupo <strong>"${group.name}"</strong> na plataforma KIXIKILA.</p>
            
            ${group.description ? `<p><em>${group.description}</em></p>` : ''}
            
            <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Detalhes do Grupo:</h3>
              <p style="margin: 5px 0;"><strong>Contribuição:</strong> €${group.contribution_amount}/mês</p>
              <p style="margin: 5px 0;"><strong>Membros:</strong> ${group.current_members}/${group.max_members}</p>
              <p style="margin: 5px 0;"><strong>Tipo:</strong> ${group.group_type === 'savings' ? 'Poupança' : 'Investimento'}</p>
            </div>

            ${message ? `<p style="background-color: #EEF2FF; padding: 12px; border-left: 4px solid #4F46E5; margin: 20px 0;"><strong>Mensagem:</strong> ${message}</p>` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Aceitar Convite
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280;">
              Este convite expira em 7 dias. Se não conseguires clicar no botão, copia e cola este link no teu navegador:
            </p>
            <p style="font-size: 12px; word-break: break-all; color: #9CA3AF;">${inviteLink}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;" />
            <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
              KIXIKILA - Poupança Colaborativa Inteligente
            </p>
          </div>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "KIXIKILA <convites@kixikila.pt>",
          to: [email],
          subject: `Convite para o grupo "${group.name}" - KIXIKILA`,
          html: emailHtml,
        });

        if (emailError) {
          console.error("Email send error:", emailError);
          results.push({ email, success: false, error: "Failed to send email" });
        } else {
          invitations.push(invitation);
          results.push({ email, success: true, inviteToken });
        }

      } catch (error) {
        console.error("Error processing invitation for", email, ":", error);
        results.push({ email, success: false, error: error.message });
      }
    }

    // Create notification for successful invitations
    if (invitations.length > 0) {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'invitations_sent',
          title: 'Convites enviados',
          message: `${invitations.length} convites foram enviados para o grupo "${group.name}"`,
          metadata: {
            group_id: groupId,
            invitations_count: invitations.length
          }
        });
    }

    console.log("Invitations processed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        invitations_sent: invitations.length,
        total_processed: results.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in send-group-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);