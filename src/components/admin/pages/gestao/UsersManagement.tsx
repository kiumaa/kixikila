import React, { useState, useMemo } from 'react';
import { useAdminUsers } from '@/hooks/useAdminData';
import type { AdminUser } from '@/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/design-system/Avatar';
import EditUserModal from '@/components/admin/modals/EditUserModal';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Ban, 
  Edit, 
  Eye,
  UserCheck,
  Crown,
  Shield,
  Phone,
  Mail
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
import { formatCurrency, formatDate } from '@/data/mockData';

const UsersManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use real Supabase data with filters
  const searchOptions = useMemo(() => ({
    search: searchTerm || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'banned' ? false : undefined,
    isVip: planFilter === 'vip' ? true : planFilter === 'free' ? false : undefined,
    limit: 50
  }), [searchTerm, statusFilter, planFilter]);

  const { users: allUsers, totalCount, isLoading, updateUserStatus } = useAdminUsers(searchOptions);

  // Since we're filtering on the server side, use all users
  const filteredUsers = allUsers;

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Motivo do banimento:');
    if (reason) {
      try {
        await updateUserStatus(userId, { is_active: false });
        toast({
          title: "Utilizador banido",
          description: `Utilizador foi banido: ${reason}`,
        });
      } catch (error) {
        console.error('Error banning user:', error);
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await updateUserStatus(userId, { is_active: true });
      toast({
        title: "Utilizador reativado",
        description: "O utilizador foi reativado com sucesso",
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const handleTogglePlan = async (userId: string, currentIsVIP: boolean) => {
    try {
      await updateUserStatus(userId, { is_vip: !currentIsVIP });
      toast({
        title: "Plano atualizado",
        description: `Utilizador ${currentIsVIP ? 'removido do' : 'adicionado ao'} plano VIP`,
      });
    } catch (error) {
      console.error('Error updating user plan:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'banned': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Utilizadores</h2>
          <p className="text-gray-600">
            {isLoading ? 'Carregando...' : `${filteredUsers.length} de ${totalCount} utilizadores`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Exportar CSV
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
                  placeholder="Procurar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="banned">Banidos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Utilizadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando utilizadores...</p>
              </div>
            ) : filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar 
                    name={user.full_name?.split(' ').map(n => n[0]).join('') || user.email?.substring(0, 2) || 'U'} 
                    size="lg"
                    verified={user.kyc_status === 'verified'}
                  />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{user.full_name || 'Sem nome'}</h4>
                      {user.is_vip && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                      {user.role === 'admin' && (
                        <Shield className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone || 'Não fornecido'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(user.is_active ? 'active' : 'banned')}>
                        {user.is_active ? 'Ativo' : 'Banido'}
                      </Badge>
                      
                      <Badge className={getKYCStatusColor(user.kyc_status || 'pending')}>
                        KYC: {user.kyc_status === 'verified' ? 'Verificado' : 
                              user.kyc_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                      
                      <Badge variant={user.is_vip ? "default" : "secondary"}>
                        {user.is_vip ? 'VIP' : 'Free'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right space-y-1">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(user.wallet_balance || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.active_groups || 0} grupos
                    </div>
                    <div className="text-xs text-gray-400">
                      Desde {formatDate(user.created_at || new Date().toISOString())}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => {setSelectedUser(user); setIsEditModalOpen(true);}}>
                         <Eye className="w-4 h-4 mr-2" />
                         Ver Perfil
                       </DropdownMenuItem>
                       
                       <DropdownMenuItem onClick={() => {setSelectedUser(user); setIsEditModalOpen(true);}}>
                         <Edit className="w-4 h-4 mr-2" />
                         Editar Dados
                       </DropdownMenuItem>
                      
                       <DropdownMenuItem 
                         onClick={() => handleTogglePlan(user.id, user.is_vip || false)}
                       >
                         <Crown className="w-4 h-4 mr-2" />
                         {user.is_vip ? 'Remover VIP' : 'Tornar VIP'}
                       </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                       {!user.is_active ? (
                         <DropdownMenuItem 
                           onClick={() => handleUnbanUser(user.id)}
                           className="text-green-600"
                         >
                           <UserCheck className="w-4 h-4 mr-2" />
                           Desbanir
                         </DropdownMenuItem>
                       ) : (
                         <DropdownMenuItem 
                           onClick={() => handleBanUser(user.id)}
                           className="text-red-600"
                         >
                           <Ban className="w-4 h-4 mr-2" />
                           Banir Utilizador
                         </DropdownMenuItem>
                       )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum utilizador encontrado
                </h3>
                <p className="text-gray-500">
                  Tente ajustar os filtros ou termo de pesquisa.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/*<EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {setIsEditModalOpen(false); setSelectedUser(null);}}
      />*/}
    </div>
  );
};

export default UsersManagement;