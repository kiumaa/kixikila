import React, { useState } from 'react';
import { Share2, Copy, Mail, MessageSquare, Users, Check, QrCode } from 'lucide-react';
import { Modal } from '@/components/design-system/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Group, formatCurrency } from '@/data/mockData';

interface InviteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const InviteGroupModal: React.FC<InviteGroupModalProps> = ({
  isOpen,
  onClose,
  group
}) => {
  const [inviteCode] = useState(`KIXIKILA${group.id}${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [inviteLink] = useState(`https://kixikila.pt/join/${inviteCode}`);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link de convite foi copiado para a área de transferência."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${group.name}`,
          text: `Junte-se ao meu grupo de poupança "${group.name}" na KIXIKILA!`,
          url: inviteLink
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Convite para ${group.name} - KIXIKILA`);
    const body = encodeURIComponent(
      `Olá!\n\nConvido-te a juntar-te ao meu grupo de poupança "${group.name}" na KIXIKILA.\n\n` +
      `${group.description}\n\n` +
      `Contribuição mensal: ${formatCurrency(group.contributionAmount)}\n` +
      `Membros: ${group.currentMembers}/${group.maxMembers}\n\n` +
      `Clica no link para entrares:\n${inviteLink}\n\n` +
      `Ou usa o código: ${inviteCode}\n\n` +
      `Até breve!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔗 *Convite KIXIKILA*\n\n` +
      `Junta-te ao meu grupo "${group.name}"!\n\n` +
      `💰 Contribuição: ${formatCurrency(group.contributionAmount)}/mês\n` +
      `👥 Vagas: ${group.maxMembers - group.currentMembers} disponíveis\n\n` +
      `${inviteLink}\n\n` +
      `Código: *${inviteCode}*`
    );
    window.open(`https://wa.me/?text=${text}`);
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
        <Card className="ios-card bg-gradient-to-r from-primary-subtle to-primary-subtle/50 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-bold font-system text-primary mb-1">
              {group.name}
            </h3>
            <p className="text-sm text-primary/80 mb-2 font-system">
              {group.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold font-system text-primary">
                {formatCurrency(group.contributionAmount)}/mês
              </span>
              <span className="text-primary/70">
                {group.maxMembers - group.currentMembers} vagas disponíveis
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-medium font-system text-foreground mb-3">
            Código de Convite
          </label>
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              readOnly
              className="font-mono text-center text-lg font-bold"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="ios-button flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-system">
            Partilhe este código ou o link abaixo
          </p>
        </div>

        {/* Invite Link */}
        <div>
          <label className="block text-sm font-medium font-system text-foreground mb-3">
            Link de Convite
          </label>
          <div className="flex gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="ios-button flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Share Options */}
        <div>
          <h4 className="text-sm font-medium font-system text-foreground mb-3">
            Partilhar via
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="ios-button h-auto p-4 flex-col gap-2"
            >
              <Share2 className="w-6 h-6 text-primary" />
              <span className="text-sm font-system">Partilhar</span>
            </Button>
            
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              className="ios-button h-auto p-4 flex-col gap-2"
            >
              <MessageSquare className="w-6 h-6 text-green-500" />
              <span className="text-sm font-system">WhatsApp</span>
            </Button>
            
            <Button
              onClick={handleEmailShare}
              variant="outline"
              className="ios-button h-auto p-4 flex-col gap-2"
            >
              <Mail className="w-6 h-6 text-blue-500" />
              <span className="text-sm font-system">Email</span>
            </Button>
            
            <Button
              variant="outline"
              className="ios-button h-auto p-4 flex-col gap-2"
              disabled
            >
              <QrCode className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-system">QR Code</span>
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="ios-card bg-surface">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-info" />
              </div>
              <div>
                <h4 className="font-medium font-system text-foreground text-sm mb-1">
                  Como funciona?
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 font-system">
                  <li>• Partilhe o código ou link com amigos</li>
                  <li>• Eles instalam a app KIXIKILA</li>
                  <li>• Inserem o código para pedir entrada</li>
                  <li>• Você aprova o pedido como admin</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full ios-button"
        >
          Fechar
        </Button>
      </div>
    </Modal>
  );
};