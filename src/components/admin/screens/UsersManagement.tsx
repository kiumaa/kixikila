import React, { useState } from 'react';
import { useAdminStore, type AdminUser } from '@/store/useAdminStore';
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
  const { allUsers, banUser, unbanUser, updateUserPlan } = useAdminStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesPlan = planFilter === 'all' || 
                       (planFilter === 'vip' && user.isVIP) ||
                       (planFilter === 'free' && !user.isVIP);
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleBanUser = (userId: number) => {
    const reason = prompt('Motivo do banimento:');
    if (reason) {
      banUser(userId, reason);
    }
  };

  const handleTogglePlan = (userId: number, currentIsVIP: boolean) => {
    updateUserPlan(userId, currentIsVIP ? 'free' : 'vip');
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
            {filteredUsers.length} de {allUsers.length} utilizadores
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
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar 
                    name={user.avatar} 
                    size="lg"
                    verified={user.kycStatus === 'verified'}
                  />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      {user.isVIP && (
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
                        <span>{user.phone}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status === 'active' ? 'Ativo' : 
                         user.status === 'banned' ? 'Banido' : 'Inativo'}
                      </Badge>
                      
                      <Badge className={getKYCStatusColor(user.kycStatus)}>
                        KYC: {user.kycStatus === 'verified' ? 'Verificado' : 
                              user.kycStatus === 'pending' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                      
                      <Badge variant={user.isVIP ? "default" : "secondary"}>
                        {user.isVIP ? 'VIP' : 'Free'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(user.walletBalance)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.activeGroups} grupos
                    </div>
                    <div className="text-xs text-gray-400">
                      Desde {formatDate(user.joinDate)}
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
                        onClick={() => handleTogglePlan(user.id, user.isVIP)}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        {user.isVIP ? 'Remover VIP' : 'Tornar VIP'}
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {user.status === 'banned' ? (
                        <DropdownMenuItem 
                          onClick={() => unbanUser(user.id)}
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

      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {setIsEditModalOpen(false); setSelectedUser(null);}}
      />
    </div>
  );
};

export default UsersManagement;