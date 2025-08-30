import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Users, Sparkles, Calendar, Euro, Lock, Globe, UserCheck, X, Check, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/stores/useAppStore';
import { formatCurrency } from '@/lib/utils';
import { Group } from '@/lib/mockData';

interface CreateGroupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GroupData {
  name: string;
  description: string;
  contribution_amount: number;
  max_members: number;
  contribution_frequency: 'weekly' | 'monthly';
  payout_method: 'lottery' | 'order';
  is_private: boolean;
  type: 'savings' | 'investment' | 'emergency';
}

export const CreateGroupWizard: React.FC<CreateGroupWizardProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { userPlan, canCreateGroup, addGroup } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<GroupData>({
    name: '',
    description: '',
    contribution_amount: 100,
    max_members: 8,
    contribution_frequency: 'monthly',
    payout_method: 'lottery',
    is_private: true,
    type: 'savings'
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canCreateGroup()) {
      toast({
        title: "Limite atingido",
        description: "Faça upgrade para VIP para criar grupos ilimitados",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      status: 'active',
      payout_method: formData.payout_method,
      contribution_amount: formData.contribution_amount,
      contribution_frequency: formData.contribution_frequency,
      max_members: formData.max_members,
      current_members: 1,
      current_cycle: 1,
      total_pool: formData.contribution_amount,
      creator_id: 'user_1',
      created_at: new Date().toISOString(),
      start_date: new Date().toISOString(),
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_private: formData.is_private,
      requires_approval: true,
      settings: {
        payment_window_hours: 72,
        auto_exclude_late_payments: true
      },
      members: [{
        user_id: 'user_1',
        name: "Você",
        paid: false,
        is_admin: true,
        joined_at: new Date().toISOString()
      }]
    };

    addGroup(newGroup);
    setIsLoading(false);
    
    toast({
      title: "Grupo criado com sucesso!",
      description: `${formData.name} foi criado e está pronto para membros.`
    });
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      description: '',
      contribution_amount: 100,
      max_members: 8,
      contribution_frequency: 'monthly',
      payout_method: 'lottery',
      is_private: true,
      type: 'savings'
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 3 && formData.description.trim().length >= 10;
      case 2:
        return formData.contribution_amount >= 10 && formData.max_members >= 2;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Criar Grupo</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Passo {currentStep} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Informações Básicas</h3>
                <p className="text-muted-foreground text-sm">
                  Defina o nome e objetivo do seu grupo de poupança
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Grupo *</Label>
                  <Input
                    id="name"
                    placeholder="ex: Férias de Verão 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o objetivo do grupo..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Categoria</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="emergency">Emergência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Financial Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Euro className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Detalhes Financeiros</h3>
                <p className="text-muted-foreground text-sm">
                  Configure os valores e periodicidade dos pagamentos
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="contribution">Valor por Contribuição *</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="contribution"
                      type="number"
                      min="10"
                      max="10000"
                      value={formData.contribution_amount}
                      onChange={(e) => setFormData({...formData, contribution_amount: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Mínimo: €10</p>
                </div>

                <div>
                  <Label htmlFor="members">Número Máximo de Membros *</Label>
                  <Input
                    id="members"
                    type="number"
                    min="2"
                    max="50"
                    value={formData.max_members}
                    onChange={(e) => setFormData({...formData, max_members: Number(e.target.value)})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Frequência de Pagamento</Label>
                  <RadioGroup 
                    value={formData.contribution_frequency} 
                    onValueChange={(value: any) => setFormData({...formData, contribution_frequency: value})}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Semanal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly">Mensal</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Card className="p-4 bg-muted/50">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Valor Total do Grupo</div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(formData.contribution_amount * formData.max_members)}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Group Type */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Tipo de Seleção</h3>
                <p className="text-muted-foreground text-sm">
                  Como será definido quem recebe em cada ciclo?
                </p>
              </div>

              <div className="space-y-3">
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    formData.payout_method === 'lottery' 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({...formData, payout_method: 'lottery'})}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                      <Shuffle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">Sorteio Aleatório</h4>
                        <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A cada ciclo é feito um sorteio para determinar quem recebe o valor total.
                      </p>
                    </div>
                    {formData.payout_method === 'lottery' && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>

                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    formData.payout_method === 'order' 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({...formData, payout_method: 'order'})}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Ordem Predefinida</h4>
                      <p className="text-sm text-muted-foreground">
                        Os membros escolhem sua posição na fila. Cada um recebe na sua vez.
                      </p>
                    </div>
                    {formData.payout_method === 'order' && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Step 4: Privacy Settings */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Privacidade</h3>
                <p className="text-muted-foreground text-sm">
                  Quem pode encontrar e juntar-se ao seu grupo?
                </p>
              </div>

              <div className="space-y-3">
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    formData.is_private === true 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({...formData, is_private: true})}
                >
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Privado</h4>
                      <p className="text-sm text-muted-foreground">
                        Apenas você pode convidar membros. Não aparece em pesquisas.
                      </p>
                    </div>
                    {formData.is_private === true && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>

                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    formData.is_private === false 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({...formData, is_private: false})}
                >
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Público</h4>
                      <p className="text-sm text-muted-foreground">
                        Qualquer pessoa pode encontrar e juntar-se ao grupo.
                      </p>
                    </div>
                    {formData.is_private === false && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              </div>

              {/* Summary */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Resumo do Grupo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contribuição:</span>
                    <span className="font-medium">{formatCurrency(formData.contribution_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membros:</span>
                    <span className="font-medium">{formData.max_members}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">
                      {formData.payout_method === 'lottery' ? 'Sorteio' : 'Ordem'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(formData.contribution_amount * formData.max_members)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4">
          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={currentStep === 1 ? onClose : handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!isStepValid() || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Criar Grupo'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};