import React from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKycProcess } from '@/hooks/useKycProcess';

const PersonalInfoStep = () => {
  const { kycData, updatePersonalInfo } = useKycProcess();
  const { personalInfo } = kycData;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Vamos começar com as tuas informações pessoais básicas.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome Completo *</Label>
          <Input
            id="fullName"
            value={personalInfo.fullName}
            onChange={(e) => updatePersonalInfo({ fullName: e.target.value })}
            placeholder="João Silva Santos"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={(e) => updatePersonalInfo({ dateOfBirth: e.target.value })}
            className="w-full"
            max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Morada *</Label>
          <Input
            id="address"
            value={personalInfo.address}
            onChange={(e) => updatePersonalInfo({ address: e.target.value })}
            placeholder="Rua das Flores, 123, 2º Andar"
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={personalInfo.city}
              onChange={(e) => updatePersonalInfo({ city: e.target.value })}
              placeholder="Lisboa"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Código Postal *</Label>
            <Input
              id="postalCode"
              value={personalInfo.postalCode}
              onChange={(e) => updatePersonalInfo({ postalCode: e.target.value })}
              placeholder="1000-001"
              className="w-full"
              pattern="[0-9]{4}-[0-9]{3}"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nacionalidade *</Label>
          <Select
            value={personalInfo.nationality}
            onValueChange={(value) => updatePersonalInfo({ nationality: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleciona a nacionalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Portugal">🇵🇹 Portugal</SelectItem>
              <SelectItem value="Brasil">🇧🇷 Brasil</SelectItem>
              <SelectItem value="Espanha">🇪🇸 Espanha</SelectItem>
              <SelectItem value="França">🇫🇷 França</SelectItem>
              <SelectItem value="Angola">🇦🇴 Angola</SelectItem>
              <SelectItem value="Moçambique">🇲🇿 Moçambique</SelectItem>
              <SelectItem value="Cabo Verde">🇨🇻 Cabo Verde</SelectItem>
              <SelectItem value="Outro">🌍 Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium mb-1">Informação importante</p>
            <p className="text-xs text-muted-foreground">
              Certifica-te de que os dados coincidem exatamente com o teu documento de identidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;