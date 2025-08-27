import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TermsScreenProps {
  onBack: () => void;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({
  onBack
}) => {
  const [activeSection, setActiveSection] = useState('terms');

  const sections = [
    { key: 'terms', label: 'Termos de Serviço' },
    { key: 'privacy', label: 'Política de Privacidade' },
    { key: 'cookies', label: 'Política de Cookies' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'terms':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                1. Aceitação dos Termos
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Ao utilizar a aplicação KIXIKILA, concorda com estes termos de serviço. 
                Se não concordar, não deve utilizar os nossos serviços.
              </p>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                2. Descrição do Serviço
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                A KIXIKILA é uma plataforma de poupança colaborativa que permite aos utilizadores
                criar e participar em grupos de poupança com objetivos específicos.
              </p>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                3. Responsabilidades do Utilizador
              </h3>
              <ul className="text-sm text-muted-foreground font-system space-y-2">
                <li>• Fornecer informações verdadeiras e atualizadas</li>
                <li>• Cumprir com os pagamentos acordados nos grupos</li>
                <li>• Não utilizar o serviço para atividades ilegais</li>
                <li>• Manter a confidencialidade das suas credenciais</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                4. Política de Pagamentos
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Os pagamentos são processados através de parceiros certificados (Stripe).
                Atrasos podem resultar em penalizações ou exclusão de sorteios.
              </p>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                5. Limitação de Responsabilidade
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                A KIXIKILA não se responsabiliza por perdas resultantes do incumprimento
                de outros utilizadores ou fatores externos à plataforma.
              </p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                Recolha e Utilização de Dados
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Recolhemos apenas os dados necessários para fornecer os nossos serviços,
                incluindo informações de contacto, dados financeiros e histórico de transações.
              </p>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                Partilha de Dados
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Os seus dados não são partilhados com terceiros, exceto quando necessário
                para processamento de pagamentos ou cumprimento de obrigações legais.
              </p>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                Segurança dos Dados
              </h3>
              <ul className="text-sm text-muted-foreground font-system space-y-2">
                <li>• Encriptação SSL/TLS para todas as comunicações</li>
                <li>• Armazenamento seguro em servidores certificados</li>
                <li>• Acesso restrito apenas a pessoal autorizado</li>
                <li>• Auditoria regular dos sistemas de segurança</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                Os Seus Direitos
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Tem o direito de aceder, corrigir ou eliminar os seus dados pessoais.
                Contacte-nos para exercer estes direitos.
              </p>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                O que são Cookies
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Cookies são pequenos ficheiros de texto armazenados no seu dispositivo
                para melhorar a experiência de utilização da aplicação.
              </p>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                Tipos de Cookies Utilizados
              </h3>
              <ul className="text-sm text-muted-foreground font-system space-y-2">
                <li>• <strong>Essenciais:</strong> Necessários para o funcionamento básico</li>
                <li>• <strong>Funcionais:</strong> Melhoram a experiência do utilizador</li>
                <li>• <strong>Analytics:</strong> Ajudam a entender como usa a aplicação</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold font-system text-foreground mb-3">
                Gerir Cookies
              </h3>
              <p className="text-sm text-muted-foreground font-system leading-relaxed">
                Pode gerir as preferências de cookies nas definições do seu navegador.
                Note que desativar cookies pode afetar a funcionalidade da aplicação.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Termos e Privacidade
          </h1>
        </div>

        {/* Status Card */}
        <Card className="glass text-primary-foreground border-primary-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold font-system mb-2">
              Documentos Legais
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              Consulte os nossos termos e políticas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Section Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium font-system transition-all whitespace-nowrap ${
                activeSection === section.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-card-hover'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="ios-card">
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Download/Share Options */}
        <Card className="ios-card">
          <CardContent className="p-6">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Documentos
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full ios-button justify-start"
              >
                <Download className="w-4 h-4 mr-3" />
                Descarregar Termos de Serviço (PDF)
              </Button>
              <Button
                variant="outline"
                className="w-full ios-button justify-start"
              >
                <Download className="w-4 h-4 mr-3" />
                Descarregar Política de Privacidade (PDF)
              </Button>
              <Button
                variant="outline"
                className="w-full ios-button justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-3" />
                Ver no Website
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <Card className="ios-card bg-surface">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground font-system">
              Última atualização: 15 de agosto de 2025
            </p>
            <p className="text-xs text-muted-foreground font-system mt-1">
              Versão 2.1 dos Termos de Serviço
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};