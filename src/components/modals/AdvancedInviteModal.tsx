import React, { useState } from 'react';
import { Plus, X, Mail, MessageSquare, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/design-system/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Group {
  id: string;
  name: string;
  description?: string;
  contribution_amount: number;
  current_members: number;
  max_members: number;
  group_type: string;
}

interface AdvancedInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onInvitesSent?: () => void;
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
  inviteToken?: string;
}

export const AdvancedInviteModal: React.FC<AdvancedInviteModalProps> = ({
  isOpen,
  onClose,
  group,
  onInvitesSent
}) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const addEmailField = () => {
    if (emails.length < 10) {
      setEmails([...emails, '']);
    }
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()));

  const handleSendInvites = async () => {
    if (validEmails.length === 0) {
      toast({
        title: "Emails em falta",
        description: "Por favor, adicione pelo menos um email válido.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('send-group-invitation', {
        body: {
          groupId: group.id,
          emails: validEmails,
          role,
          message: message.trim()
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send invitations');
      }

      const { results: inviteResults, invitations_sent } = response.data;
      setResults(inviteResults);
      setShowResults(true);

      const successfulInvites = inviteResults.filter((r: InviteResult) => r.success).length;
      
      if (successfulInvites > 0) {
        toast({
          title: "Convites enviados!",
          description: `${successfulInvites} convite(s) enviado(s) com sucesso.`
        });
        
        if (onInvitesSent) {
          onInvitesSent();
        }
      }

      if (successfulInvites < validEmails.length) {
        toast({
          title: "Alguns convites falharam",
          description: `${validEmails.length - successfulInvites} convite(s) não foram enviados.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Erro ao enviar convites",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmails(['']);
    setRole('member');
    setMessage('');
    setResults([]);
    setShowResults(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Convidar Membros"
      size="lg"
    >
      <div className="space-y-6">
        {/* Group Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-bold text-primary mb-1">
              {group.name}
            </h3>
            <p className="text-sm text-primary/80 mb-2">
              {group.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-primary">
                €{group.contribution_amount}/mês
              </span>
              <span className="text-primary/70">
                {group.max_members - group.current_members} vagas disponíveis
              </span>
            </div>
          </CardContent>
        </Card>

        {!showResults ? (
          <>
            {/* Email Fields */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Emails dos Convidados
              </label>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      placeholder="exemplo@email.com"
                      className="flex-1"
                    />
                    {emails.length > 1 && (
                      <Button
                        onClick={() => removeEmailField(index)}
                        variant="outline"
                        size="sm"
                        className="px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {emails.length < 10 && (
                <Button
                  onClick={addEmailField}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Email
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Máximo de 10 convites por vez
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Função no Grupo
              </label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Administradores podem gerir o grupo e seus membros
              </p>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Mensagem Personalizada (Opcional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Adicione uma mensagem pessoal ao seu convite..."
                rows={3}
                maxLength={500}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/500 caracteres
              </p>
            </div>

            {/* Valid Emails Preview */}
            {validEmails.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Emails válidos ({validEmails.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {validEmails.map((email, index) => (
                    <Badge key={index} variant="secondary">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendInvites}
              className="w-full"
              disabled={isLoading || validEmails.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando Convites...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar {validEmails.length} Convite{validEmails.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Results */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resultado dos Convites</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <Check className="w-5 h-5 text-success" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="text-sm">{result.email}</span>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Enviado" : "Falhou"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Enviar Mais Convites
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1"
              >
                Concluir
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};