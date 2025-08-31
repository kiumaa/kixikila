import React, { useState } from 'react';
import { Share2, Copy, Mail, MessageSquare, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Group } from '@/services/groupService';

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const GroupInviteModal: React.FC<GroupInviteModalProps> = ({
  isOpen,
  onClose,
  group
}) => {
  const [emails, setEmails] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const inviteLink = `${window.location.origin}/join/${group.id}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "✅ Link copiado!",
        description: "O link de convite foi copiado para a área de transferência"
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao copiar",
        description: "Não foi possível copiar o link",
        variant: "destructive"
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${group.name}`,
          text: `Foste convidado(a) para o grupo ${group.name} no KIXIKILA!`,
          url: inviteLink
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Convite para ${group.name} - KIXIKILA`);
    const body = encodeURIComponent(
      `Olá!\n\nFoste convidado(a) para o grupo "${group.name}" no KIXIKILA.\n\n${group.description || ''}\n\nClica no link para participar:\n${inviteLink}\n\nAté breve!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🎯 Convite KIXIKILA\n\nFoste convidado(a) para o grupo *${group.name}*!\n\n${group.description || ''}\n\n👥 Vagas: ${group.current_members}/${group.max_members}\n💰 Contribuição: €${group.contribution_amount}/${group.frequency}\n\nJunta-te aqui: ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`);
  };

  const handleSendInvites = async () => {
    if (!emails.trim()) {
      toast({
        title: "❌ Emails necessários",
        description: "Por favor, insira pelo menos um email",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    
    try {
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
      
      const { error } = await supabase.functions.invoke('send-group-invitation', {
        body: {
          groupId: group.id,
          emails: emailList,
          message: message.trim() || undefined,
          role: 'member'
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Convites enviados!",
        description: `${emailList.length} convite(s) enviado(s) com sucesso`
      });
      
      setEmails('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending invites:', error);
      toast({
        title: "❌ Erro ao enviar convites",
        description: "Ocorreu um erro ao enviar os convites. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convidar para o Grupo"
      size="lg"
    >
      <div className="space-y-6">
        {/* Group Info */}
        <Card className="ios-card bg-primary-subtle/20 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold font-system text-foreground mb-1">
                  {group.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {group.description}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {group.current_members}/{group.max_members} membros
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    €{group.contribution_amount}/{group.frequency}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Share Options */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Partilhar rapidamente</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleNativeShare}
              className="ios-button flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Partilhar
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="ios-button flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Link
            </Button>
            <Button
              variant="outline"
              onClick={handleEmailShare}
              className="ios-button flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button
              variant="outline"
              onClick={handleWhatsAppShare}
              className="ios-button flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Invite Link */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Link de convite</h4>
          <div className="flex gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="flex-1 ios-input font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="ios-button"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Send Email Invites */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Enviar convites por email</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Endereços de email (separados por vírgula)
              </label>
              <Textarea
                placeholder="ana@exemplo.com, pedro@exemplo.com, ..."
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="ios-input resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Mensagem personalizada (opcional)
              </label>
              <Textarea
                placeholder="Olá! Gostaria de te convidar para o nosso grupo de poupança..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="ios-input resize-none"
                rows={3}
              />
            </div>
            <Button
              onClick={handleSendInvites}
              disabled={sending || !emails.trim()}
              className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground"
              size="lg"
            >
              {sending ? (
                "A enviar..."
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Enviar Convites
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};