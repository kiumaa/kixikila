import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/design-system/Avatar';
import { useToast } from '@/hooks/use-toast';
import { mockUser } from '@/lib/mockData';

interface PersonalDataScreenProps {
  onBack: () => void;
}

export const PersonalDataScreen: React.FC<PersonalDataScreenProps> = ({
  onBack
}) => {
  const [formData, setFormData] = useState({
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone || '+351 912 345 678'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast({
        title: "Dados atualizados",
        description: "As suas informações pessoais foram atualizadas com sucesso."
      });
    }, 1500);
  };

  const handleCancel = () => {
    setFormData({
      name: mockUser.name,
      email: mockUser.email,
      phone: mockUser.phone || '+351 912 345 678'
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Dados Pessoais
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Profile Photo */}
        <Card className="ios-card">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar 
                name={mockUser.avatar} 
                size="xxl" 
                className="mx-auto hover:scale-105 transition-transform" 
              />
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ios-button">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
            <h3 className="font-semibold font-system text-foreground mb-1">
              Foto de Perfil
            </h3>
            <p className="text-sm text-muted-foreground">
              Toque no ícone da câmara para alterar
            </p>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="ios-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold font-system text-foreground">
                Informações Pessoais
              </h3>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="ios-button"
                >
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="ios-button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={isSaving}
                    className="ios-button"
                  >
                    {isSaving ? 'A guardar...' : 'Guardar'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Telemóvel
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="ios-card">
          <CardContent className="p-6">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Estado da Conta
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-system text-muted-foreground">
                  Conta criada em
                </span>
                <span className="text-sm font-medium font-system text-foreground">
                  {new Date(mockUser.joinDate).toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-system text-muted-foreground">
                  Última atualização
                </span>
                <span className="text-sm font-medium font-system text-foreground">
                  {new Date().toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-system text-muted-foreground">
                  Estado KYC
                </span>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium font-system text-success">
                    Verificado
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};