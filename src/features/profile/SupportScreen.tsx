import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Mail, Phone, MessageSquare, Book, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/mockData';

interface SupportScreenProps {
  onBack: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const faqItems = [
    {
      question: "Como funciona a poupança colaborativa?",
      answer: "Cada membro contribui mensalmente para um fundo comum. A cada ciclo, um membro recebe o valor total acumulado, por sorteio ou ordem predefinida."
    },
    {
      question: "Como posso levantar dinheiro da minha carteira?",
      answer: "Vá à secção Carteira, toque em 'Levantar' e escolha o método (transferência bancária ou MB Way). Processamento em 1-2 dias úteis."
    },
    {
      question: "O que acontece se não conseguir pagar num mês?",
      answer: "Contacte-nos imediatamente. Podemos ajudar a encontrar uma solução. Pagamentos em atraso podem resultar em exclusão do sorteio atual."
    },
    {
      question: "Como criar um grupo privado?",
      answer: "Ao criar um grupo, escolha 'Privado' nas definições. Só pessoas com o código de convite podem entrar."
    },
    {
      question: "Posso sair de um grupo a qualquer altura?",
      answer: "Sim, mas deve cumprir os compromissos do ciclo atual. A saída antecipada pode afetar outros membros."
    },
    {
      question: "Como funciona a verificação KYC?",
      answer: `Carregue documento de identidade e comprovativo de morada. A verificação demora 1-3 dias úteis e é obrigatória para levantamentos superiores a ${formatCurrency(500)}.`
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    setIsSending(true);
    // Simulate sending message
    setTimeout(() => {
      setIsSending(false);
      setShowContactForm(false);
      setContactForm({ subject: '', message: '', priority: 'normal' });
      toast({
        title: "Mensagem enviada",
        description: "A sua mensagem foi enviada. Responderemos em breve."
      });
    }, 2000);
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
            Ajuda e Suporte
          </h1>
        </div>

        {/* Support Info */}
        <Card className="glass text-primary-foreground border-primary-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold font-system mb-2">
              Como podemos ajudar?
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              Encontre respostas ou contacte o nosso suporte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Quick Contact */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="ios-card p-4 text-center hover:shadow-md hover:scale-105 transition-all cursor-pointer">
            <CardContent className="p-0 space-y-2">
              <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5 text-success" />
              </div>
              <div className="text-xs font-system text-foreground">Chat</div>
            </CardContent>
          </Card>
          
          <Card 
            className="ios-card p-4 text-center hover:shadow-md hover:scale-105 transition-all cursor-pointer"
            onClick={() => setShowContactForm(true)}
          >
            <CardContent className="p-0 space-y-2">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs font-system text-foreground">Email</div>
            </CardContent>
          </Card>
          
          <Card className="ios-card p-4 text-center hover:shadow-md hover:scale-105 transition-all cursor-pointer">
            <CardContent className="p-0 space-y-2">
              <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5 text-warning" />
              </div>
              <div className="text-xs font-system text-foreground">Telefone</div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        {showContactForm && (
          <Card className="ios-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-system text-foreground">
                  Enviar Mensagem
                </h3>
                <Button
                  onClick={() => setShowContactForm(false)}
                  variant="outline"
                  size="sm"
                  className="ios-button"
                >
                  Cancelar
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Assunto
                </label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  placeholder="Descreva brevemente o seu problema"
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Mensagem
                </label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="Descreva o seu problema em detalhe..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Prioridade
                </label>
                <div className="flex gap-2">
                  {['normal', 'urgent'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setContactForm({...contactForm, priority})}
                      className={`px-3 py-2 rounded-lg text-sm font-medium font-system transition-all ${
                        contactForm.priority === priority
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted-hover'
                      }`}
                    >
                      {priority === 'normal' ? 'Normal' : 'Urgente'}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={isSending || !contactForm.subject || !contactForm.message}
                className="w-full ios-button"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'A enviar...' : 'Enviar Mensagem'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FAQ Search */}
        <div>
          <h3 className="font-semibold font-system text-foreground mb-4">
            Perguntas Frequentes
          </h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Procurar nas FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map((item, idx) => (
              <Card key={idx} className="ios-card">
                <CardContent className="p-4">
                  <h4 className="font-semibold font-system text-foreground mb-2">
                    {item.question}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed font-system">
                    {item.answer}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Book className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground font-medium font-system">
                Nenhuma FAQ encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente usar outros termos de pesquisa
              </p>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <Card className="ios-card">
          <CardContent className="p-6">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Informações de Contacto
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-system text-foreground">suporte@kixikila.pt</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-system text-foreground">+351 210 123 456</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="font-system text-foreground">Chat disponível 24/7</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-system">
              Tempo de resposta médio: 2-4 horas (dias úteis)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};