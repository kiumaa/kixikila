import React, { useState } from 'react';
import { Search, Users, Lock, Globe, Calendar, Euro, User } from 'lucide-react';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { Avatar } from '@/components/design-system/Avatar';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/data/mockData';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for available groups
const mockAvailableGroups = [
  {
    id: 4,
    name: "Férias de Verão 2025",
    description: "Grupo para poupar para as férias de família",
    contributionAmount: 150,
    maxMembers: 6,
    currentMembers: 4,
    privacy: "public",
    category: "travel",
    admin: "Sandra Costa",
    nextStart: "2025-10-01"
  },
  {
    id: 5,
    name: "Investimento Imobiliário",
    description: "Entrada para apartamento no centro",
    contributionAmount: 800,
    maxMembers: 5,
    currentMembers: 3,
    privacy: "invite_only",
    category: "investment",
    admin: "Miguel Santos",
    nextStart: "2025-09-15"
  },
  {
    id: 6,
    name: "Emergência Familiar",
    description: "Fundo de emergência para a família",
    contributionAmount: 100,
    maxMembers: 8,
    currentMembers: 5,
    privacy: "private",
    category: "emergency",
    admin: "Ana Ferreira",
    nextStart: "2025-09-10"
  }
];

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const filteredGroups = mockAvailableGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinGroup = async (group: any) => {
    setIsJoining(true);
    setSelectedGroup(group);
    
    // Simulate join request
    setTimeout(() => {
      setIsJoining(false);
      toast({
        title: "Pedido enviado!",
        description: `O seu pedido para entrar em "${group.name}" foi enviado ao administrador.`,
      });
      onClose();
    }, 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel':
        return '✈️';
      case 'investment':
        return '📈';
      case 'emergency':
        return '🚨';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'hobby':
        return '🎯';
      default:
        return '💰';
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4 text-success" />;
      case 'private':
        return <Lock className="w-4 h-4 text-destructive" />;
      case 'invite_only':
        return <User className="w-4 h-4 text-warning" />;
      default:
        return <Globe className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Entrar em Grupo"
      size="lg"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Procurar grupos por nome, categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Todos', 'Viagem', 'Investimento', 'Emergência', 'Família'].map((filter) => (
            <button
              key={filter}
              className="px-3 py-1.5 rounded-lg text-xs font-medium font-system whitespace-nowrap bg-muted text-muted-foreground hover:bg-muted-hover transition-all"
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Groups List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <Card key={group.id} className="ios-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getCategoryIcon(group.category)}</span>
                        <h3 className="font-bold font-system text-foreground">
                          {group.name}
                        </h3>
                        {getPrivacyIcon(group.privacy)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold font-system text-primary">
                          {formatCurrency(group.contributionAmount)}/mês
                        </span>
                        <span className="text-muted-foreground">
                          {group.currentMembers}/{group.maxMembers} membros
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="font-system">Admin: {group.admin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="font-system">Início: {new Date(group.nextStart).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinGroup(group)}
                        disabled={isJoining && selectedGroup?.id === group.id}
                        className="ios-button"
                      >
                        {isJoining && selectedGroup?.id === group.id ? 'A enviar...' : 'Entrar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground font-medium font-system">
                {searchQuery ? 'Nenhum grupo encontrado' : 'Procure por grupos disponíveis'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Tente usar outros termos de pesquisa' : 'Use a barra de pesquisa acima'}
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold font-system text-foreground text-sm mb-1">
                Como funciona?
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 font-system">
                <li>• Envie um pedido para entrar no grupo</li>
                <li>• O administrador irá aprovar o seu pedido</li>
                <li>• Após aprovação, pode começar a contribuir</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};