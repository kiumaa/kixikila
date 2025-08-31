import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { 
  Users, Euro, Calendar, Shield, Globe, Lock, 
  UserCheck, Clock, Settings, CheckCircle 
} from 'lucide-react';
import { AdminGroup } from '@/hooks/useAdminGroups';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: AdminGroup | null;
  onSave?: (groupData: Partial<AdminGroup>) => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contribution_amount: 0,
    max_members: 0,
    is_private: false,
    requires_approval: true,
    status: 'draft' as any
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        contribution_amount: group.contribution_amount || 0,
        max_members: group.max_members || 0,
        is_private: group.is_private || false,
        requires_approval: group.requires_approval || true,
        status: group.status || 'draft'
      });
    }
  }, [group]);

  const handleSave = async () => {
    if (!group) return;

    setIsLoading(true);
    try {
      // Validate form
      if (!formData.name.trim()) {
        toast({
          title: "Erro",
          description: "Nome do grupo é obrigatório",
          variant: "destructive"
        });
        return;
      }

      if (formData.contribution_amount <= 0) {
        toast({
          title: "Erro", 
          description: "Valor de contribuição deve ser maior que zero",
          variant: "destructive"
        });
        return;
      }

      if (formData.max_members < 2) {
        toast({
          title: "Erro",
          description: "Número mínimo de membros é 2",
          variant: "destructive"
        });
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onSave) {
        onSave({
          ...group,
          ...formData
        });
      }

      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso"
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar grupo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!group) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Grupo"
      size="lg"
    >
      <div className="space-y-6">
        {/* Group Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Status do Grupo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Status Atual</Label>
                <p className="text-sm text-muted-foreground">
                  Controla se o grupo está ativo para novos membros
                </p>
              </div>
              <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                {group.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            <div>
              <Label htmlFor="status">Alterar Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({...formData, status: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome do grupo"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição do grupo"
                className="mt-1 h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Configurações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contribution">Valor de Contribuição</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="contribution"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.contribution_amount}
                  onChange={(e) => setFormData({...formData, contribution_amount: parseFloat(e.target.value) || 0})}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxMembers">Número Máximo de Membros</Label>
              <Input
                id="maxMembers"
                type="number"
                min="2"
                max="50"
                value={formData.max_members}
                onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value) || 0})}
                className="mt-1"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Valor Total por Ciclo
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(formData.contribution_amount * formData.max_members)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Guardando...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditGroupModal;