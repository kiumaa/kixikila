import React, { useState } from 'react';
import { mockGroups } from '@/lib/mockData';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/design-system/Avatar';
import EditGroupModal from '@/components/admin/modals/EditGroupModal';
import { useToast } from '@/hooks/use-toast';
import { type Group } from '@/lib/mockData';
import { 
  FileText, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Pause,
  Users,
  Calendar,
  Euro,
  Lock,
  Globe,
  UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/mockData';

const GroupsManagement: React.FC = () => {
  const { deleteGroup, freezeGroup } = useAdminStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || group.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (confirm(`Tem certeza que deseja eliminar o grupo "${groupName}"? Esta ação não pode ser desfeita.`)) {
      deleteGroup(groupId);
    }
  };

  const handleFreezeGroup = (groupId: string, groupName: string) => {
    if (confirm(`Tem certeza que deseja congelar o grupo "${groupName}"?`)) {
      freezeGroup(groupId);
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ready_for_draw': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'family': return 'bg-pink-100 text-pink-800';
      case 'investment': return 'bg-purple-100 text-purple-800';
      case 'hobby': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'travel': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'family': return 'Família';
      case 'investment': return 'Investimento';
      case 'hobby': return 'Hobby';
      case 'emergency': return 'Emergência';
      case 'travel': return 'Viagem';
      default: return category;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'ready_for_draw': return 'Pronto para sorteio';
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Grupos</h2>
          <p className="text-gray-600">
            {filteredGroups.length} de {mockGroups.length} grupos
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Procurar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="ready_for_draw">Prontos para sorteio</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="family">Família</SelectItem>
                <SelectItem value="investment">Investimento</SelectItem>
                <SelectItem value="hobby">Hobby</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
                <SelectItem value="travel">Viagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <div className="grid gap-6">
        {filteredGroups.map((group) => {
          const progress = (group.members.filter(m => m.paid).length / group.members.length) * 100;
          
          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                      
                      {group.privacy === 'private' && <Lock className="w-4 h-4 text-gray-400" />}
                      {group.privacy === 'public' && <Globe className="w-4 h-4 text-green-500" />}
                      {group.privacy === 'invite_only' && <UserPlus className="w-4 h-4 text-blue-500" />}
                      
                      <Badge className={getStatusColor(group.status)}>
                        {getStatusLabel(group.status)}
                      </Badge>
                      
                      <Badge className={getCategoryColor(group.category)}>
                        {getCategoryLabel(group.category)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{group.description}</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Euro className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">Contribuição:</span>
                        <span className="font-semibold">{formatCurrency(group.contributionAmount)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Membros:</span>
                        <span className="font-semibold">{group.currentMembers}/{group.maxMembers}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-600">Próximo:</span>
                        <span className="font-semibold">{formatDate(group.nextPaymentDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-600">Ciclo:</span>
                        <span className="font-semibold">{group.cycle}º</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Progresso dos pagamentos
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Members */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 6).map((member) => (
                          <Avatar 
                            key={member.id}
                            name={member.avatar} 
                            size="sm"
                            className="ring-2 ring-white"
                            online={member.paid}
                          />
                        ))}
                        {group.members.length > 6 && (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 ring-2 ring-white">
                            +{group.members.length - 6}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(group.totalPool)}
                        </div>
                        <div className="text-sm text-gray-500">Pool total</div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Grupo
                        </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => handleFreezeGroup(group.id, group.name)}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Congelar Grupo
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Grupo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredGroups.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum grupo encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou termo de pesquisa.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <EditGroupModal
        group={selectedGroup}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGroup(null);
        }}
      />
    </div>
  );
};

export default GroupsManagement;