import React, { useState } from 'react';
import { X, Users, Euro, Calendar, Lock, Globe, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserGroups } from '@/hooks/useGroupData';
import { CreateGroupData } from '@/services/groupService';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupRealModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createGroup } = useUserGroups();

  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    contribution_amount: 0,
    max_members: 10,
    group_type: 'savings',
    is_private: true
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (!formData.name || formData.contribution_amount <= 0) {
        toast({
          title: 'Erro',
          description: 'Por favor, preencha todos os campos obrigatórios.',
          variant: 'destructive'
        });
        return;
      }

      await createGroup(formData);
      
      toast({
        title: 'Sucesso!',
        description: 'Grupo criado com sucesso!'
      });
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      contribution_amount: 0,
      max_members: 10,
      group_type: 'savings',
      is_private: true
    });
    setStep(1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.group_type !== undefined;
      case 2:
        return formData.name.length >= 3;
      case 3:
        return formData.contribution_amount > 0 && formData.max_members >= 2;
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Criar Novo Grupo</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Group Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Tipo de Grupo</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha como o grupo funcionará
                </p>
              </div>
              
              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.group_type === 'savings' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, group_type: 'savings' })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Target className="w-6 h-6 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">Poupança por Ordem</h4>
                        <p className="text-sm text-muted-foreground">
                          Cada membro recebe numa ordem predefinida
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.group_type === 'investment' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, group_type: 'investment' })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-warning mt-1" />
                      <div>
                        <h4 className="font-medium">Sorteio</h4>
                        <p className="text-sm text-muted-foreground">
                          O contemplado é escolhido por sorteio
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Informações Básicas</h3>
                <p className="text-sm text-muted-foreground">
                  Defina o nome e descrição do grupo
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Grupo *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Família Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o objetivo do grupo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Detalhes Financeiros</h3>
                <p className="text-sm text-muted-foreground">
                  Configure os valores e membros
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="contribution">Valor da Contribuição (€) *</Label>
                  <div className="relative mt-1">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="contribution"
                      type="number"
                      placeholder="0"
                      min="1"
                      value={formData.contribution_amount || ''}
                      onChange={(e) => setFormData({ ...formData, contribution_amount: parseFloat(e.target.value) || 0 })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Número Máximo de Membros *</Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="maxMembers"
                      type="number"
                      placeholder="10"
                      min="2"
                      max="50"
                      value={formData.max_members}
                      onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 10 })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Privacy & Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Privacidade</h3>
                <p className="text-sm text-muted-foreground">
                  Defina quem pode ver e juntar-se ao grupo
                </p>
              </div>

              <div className="space-y-3">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.is_private ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, is_private: true })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Privado</h4>
                        <p className="text-sm text-muted-foreground">
                          Apenas por convite
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !formData.is_private ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, is_private: false })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-success" />
                      <div>
                        <h4 className="font-medium">Público</h4>
                        <p className="text-sm text-muted-foreground">
                          Visível na pesquisa
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-medium">Resumo</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Nome:</span> {formData.name}</p>
                    <p><span className="text-muted-foreground">Tipo:</span> {formData.group_type === 'savings' ? 'Poupança por Ordem' : 'Sorteio'}</p>
                    <p><span className="text-muted-foreground">Contribuição:</span> €{formData.contribution_amount}</p>
                    <p><span className="text-muted-foreground">Membros:</span> {formData.max_members}</p>
                    <p><span className="text-muted-foreground">Privacidade:</span> {formData.is_private ? 'Privado' : 'Público'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button onClick={handleBack} variant="outline">
                Voltar
              </Button>
            )}
            
            <div className="ml-auto">
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isLoading}
                >
                  {isLoading ? 'Criando...' : 'Criar Grupo'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};