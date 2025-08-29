import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Crown,
  Settings,
  Ban,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/design-system/Avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: 'creator' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joined_at: string;
  total_contributed: number;
  current_balance: number;
}

interface GroupInvitation {
  id: string;
  email?: string;
  phone?: string;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invited_by: string;
  created_at: string;
  expires_at: string;
  message?: string;
}

interface MemberManagementPanelProps {
  groupId: string;
  members: GroupMember[];
  invitations?: GroupInvitation[];
  currentUserId: string;
  userRole: 'creator' | 'admin' | 'member';
  onMemberUpdate?: () => void;
}

export const MemberManagementPanel: React.FC<MemberManagementPanelProps> = ({
  groupId,
  members,
  invitations = [],
  currentUserId,
  userRole,
  onMemberUpdate
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const canManageMembers = userRole === 'creator' || userRole === 'admin';

  const handleMemberAction = async (memberId: string, action: string, newRole?: string) => {
    if (!canManageMembers) return;

    setLoading(memberId);

    try {
      switch (action) {
        case 'promote':
          await supabase
            .from('group_members')
            .update({ role: newRole as any })
            .eq('id', memberId);
          
          toast({
            title: "Função atualizada",
            description: `Membro promovido a ${newRole === 'admin' ? 'administrador' : 'membro'}.`
          });
          break;

        case 'suspend':
          await supabase
            .from('group_members')
            .update({ status: 'suspended' })
            .eq('id', memberId);
          
          toast({
            title: "Membro suspenso",
            description: "O membro foi suspenso do grupo."
          });
          break;

        case 'reactivate':
          await supabase
            .from('group_members')
            .update({ status: 'active' })
            .eq('id', memberId);
          
          toast({
            title: "Membro reativado",
            description: "O membro foi reativado no grupo."
          });
          break;

        case 'remove':
          await supabase
            .from('group_members')
            .delete()
            .eq('id', memberId);
          
          toast({
            title: "Membro removido",
            description: "O membro foi removido do grupo."
          });
          break;
      }

      if (onMemberUpdate) {
        onMemberUpdate();
      }

    } catch (error) {
      console.error('Error managing member:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao executar a ação.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, icon: CheckCircle, text: "Ativo" },
      pending: { variant: "secondary" as const, icon: Clock, text: "Pendente" },
      suspended: { variant: "destructive" as const, icon: Ban, text: "Suspenso" },
      expired: { variant: "outline" as const, icon: XCircle, text: "Expirado" }
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs">
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestão de Membros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">
              Membros ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Convites ({invitations.filter(i => i.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4 mt-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar 
                    name={member.name} 
                    image={member.avatar}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {getRoleIcon(member.role)}
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'creator' ? 'Criador' : 
                         member.role === 'admin' ? 'Admin' : 'Membro'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Desde {formatDate(member.joined_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm mt-1">
                      <span>Contribuído: {formatCurrency(member.total_contributed)}</span>
                      <span>Saldo: {formatCurrency(member.current_balance)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(member.status)}
                  
                  {canManageMembers && member.user_id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={loading === member.id}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'member' && (
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'promote', 'admin')}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Promover a Admin
                          </DropdownMenuItem>
                        )}
                        
                        {member.role === 'admin' && userRole === 'creator' && (
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'promote', 'member')}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Rebaixar a Membro
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        {member.status === 'active' ? (
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'suspend')}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleMemberAction(member.id, 'reactivate')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleMemberAction(member.id, 'remove')}
                          className="text-destructive"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remover do Grupo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4 mt-4">
            {invitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum convite pendente</p>
              </div>
            ) : (
              invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {invitation.email || invitation.phone}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {invitation.role === 'admin' ? 'Admin' : 'Membro'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Enviado em {formatDate(invitation.created_at)}
                      {invitation.message && (
                        <span className="block mt-1 italic">"{invitation.message}"</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Expira em {formatDate(invitation.expires_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(invitation.status)}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};