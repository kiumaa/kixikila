import React, { useState, useEffect } from 'react';
import { Search, Users, Euro, Lock, Globe, UserPlus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GroupService, type Group } from '@/services/groupService';
import { supabase } from '@/integrations/supabase/client';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess?: (group: Group) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess
}) => {
  const [searchMethod, setSearchMethod] = useState<'code' | 'browse'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [step, setStep] = useState<'search' | 'details' | 'confirm'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const { toast } = useToast();

  // Fetch public groups
  useEffect(() => {
    if (searchMethod === 'browse' && isOpen) {
      fetchPublicGroups();
    }
  }, [searchMethod, isOpen, searchQuery]);

  const fetchPublicGroups = async () => {
    setLoadingGroups(true);
    try {
      const { groups } = await GroupService.getAllGroups({
        search: searchQuery || undefined
      });
      
      // Filter public groups
      const filtered = groups.filter(group => group.privacy === 'public');
      setPublicGroups(filtered);
    } catch (error) {
      console.error('Error fetching public groups:', error);
      toast({
        title: "❌ Erro ao carregar grupos",
        description: "Não foi possível carregar os grupos públicos",
        variant: "destructive"
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleCodeSearch = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Código necessário",
        description: "Por favor, insira um código de convite.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Search for group invitation by token
      const { data, error } = await supabase
        .from('group_invitations')
        .select(`
          *,
          groups!inner(*)
        `)
        .eq('invite_token', inviteCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "❌ Código inválido",
          description: "O código de convite não foi encontrado ou expirou.",
          variant: "destructive"
        });
        return;
      }

      // Convert group data to our Group interface
      const group: Group = {
        id: data.groups.id,
        name: data.groups.name,
        description: data.groups.description,
        contribution_amount: data.groups.contribution_amount,
        frequency: data.groups.contribution_frequency,
        max_members: data.groups.max_members,
        current_members: data.groups.current_members,
        status: data.groups.status,
        privacy: data.groups.is_private ? 'private' : 'public',
        category: 'general',
        created_at: data.groups.created_at,
        updated_at: data.groups.updated_at,
        creator_id: data.groups.creator_id,
        total_pool: data.groups.total_pool,
        next_payment_date: data.groups.next_payout_date,
        group_type: data.groups.group_type
      };

      setSelectedGroup(group);
      setStep('details');
    } catch (error) {
      console.error('Error searching for group:', error);
      toast({
        title: "❌ Erro na busca",
        description: "Ocorreu um erro ao procurar o grupo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setStep('details');
  };

  const handleJoinRequest = async () => {
    if (!selectedGroup) return;
    
    setIsLoading(true);
    
    try {
      // Add user to group as pending member
      await GroupService.addMember(selectedGroup.id, (await supabase.auth.getUser()).data.user?.id!, 'member');
      
      setStep('confirm');
      
      setTimeout(() => {
        onJoinSuccess?.(selectedGroup);
        toast({
          title: "✅ Pedido enviado!",
          description: `O seu pedido para entrar em "${selectedGroup.name}" foi enviado.`
        });
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "❌ Erro ao entrar no grupo",
        description: "Não foi possível enviar o pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSelectedGroup(null);
    setInviteCode('');
    setSearchQuery('');
    onClose();
  };

  const getPrivacyIcon = (privacy: string | undefined) => {
    if (!privacy || privacy === 'public') return <Globe className="w-4 h-4 text-emerald-500" />;
    if (privacy === 'private') return <Lock className="w-4 h-4 text-amber-500" />;
    return <UserPlus className="w-4 h-4 text-blue-500" />;
  };

  const getPrivacyLabel = (privacy: string | undefined) => {
    if (!privacy || privacy === 'public') return 'Público';
    if (privacy === 'private') return 'Privado';
    return 'Por Convite';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'search' ? 'Procurar Grupos' : step === 'details' ? 'Detalhes do Grupo' : ''}
      size="lg"
    >
      {step === 'search' && (
        <div className="space-y-6">
          {/* Search Method Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setSearchMethod('code')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                searchMethod === 'code'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Código de Convite
            </button>
            <button
              onClick={() => setSearchMethod('browse')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                searchMethod === 'browse'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Explorar Grupos
            </button>
          </div>

          {searchMethod === 'code' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Código de Convite
                </label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="KIXIKILA123ABC"
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Cole o código que recebeu do administrador do grupo
                </p>
              </div>

              <Button
                onClick={handleCodeSearch}
                disabled={!inviteCode.trim() || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Procurar Grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
                <div>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Procurar por nome ou descrição..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingGroups ? (
                    <Card className="p-8 text-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-muted-foreground">A carregar grupos...</p>
                    </Card>
                  ) : publicGroups.length === 0 ? (
                    <Card className="p-8 text-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Nenhum grupo encontrado' : 'Nenhum grupo público disponível'}
                      </p>
                    </Card>
                  ) : (
                    publicGroups.map((group) => (
                      <Card
                        key={group.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleGroupSelect(group)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {group.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {group.description}
                              </p>
                            </div>
                            <div className="ml-3 flex items-center gap-2">
                              {getPrivacyIcon(group.privacy)}
                              <Badge variant="secondary" className="text-xs">
                                {getPrivacyLabel(group.privacy)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-primary">
                                €{group.contribution_amount}/{group.frequency}
                              </span>
                              <span className="text-muted-foreground">
                                {group.current_members}/{group.max_members} membros
                              </span>
                            </div>
                            <Badge 
                              variant={group.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {group.status === 'active' ? 'Ativo' : 'Pendente'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
            </div>
          )}
        </div>
      )}

      {step === 'details' && selectedGroup && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary-subtle to-primary-subtle/50 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-primary mb-2">
                    {selectedGroup.name}
                  </h2>
                  <p className="text-primary/80 mb-3">
                    {selectedGroup.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getPrivacyIcon(selectedGroup.privacy)}
                  <Badge variant="outline" className="border-primary/30">
                    {getPrivacyLabel(selectedGroup.privacy)}
                  </Badge>
                </div>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/10 rounded-xl">
                    <div className="text-2xl font-bold text-primary">
                      €{selectedGroup.contribution_amount}
                    </div>
                    <div className="text-xs text-primary/70">Por {selectedGroup.frequency}</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-xl">
                    <div className="text-2xl font-bold text-primary">
                      {selectedGroup.current_members}/{selectedGroup.max_members}
                    </div>
                    <div className="text-xs text-primary/70">Membros</div>
                  </div>
                </div>
            </CardContent>
          </Card>

          {selectedGroup.privacy === 'private' && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-1">
                      Aprovação necessária
                    </p>
                    <p className="text-amber-700">
                      O administrador do grupo precisa aprovar o seu pedido de entrada.
                      Será notificado quando for aceito.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setStep('search')}
              variant="outline"
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={handleJoinRequest}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Pedir Entrada
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-success-subtle rounded-full flex items-center justify-center mx-auto animate-bounce-in">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Pedido Enviado!
            </h3>
            <p className="text-muted-foreground">
              O administrador do grupo foi notificado.<br />
              Receberá uma notificação quando for aceito.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};