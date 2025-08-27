import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Phone, KeyRound } from 'lucide-react';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';

const AdminLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const { adminLogin, allUsers } = useAdminStore();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (phone.length < 9) return;
    
    // Mock validation - check if phone belongs to admin user
    const adminUser = allUsers.find(user => 
      user.phone.includes(phone) && (user.role === 'admin' || user.role === 'superadmin')
    );
    
    if (!adminUser) {
      alert('Número de telefone não autorizado para acesso administrativo.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setStep('otp');
      setResendTimer(60);
      setIsLoading(false);
    }, 2000);
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    
    setIsLoading(true);
    
    // Mock OTP verification (accept any 6-digit code)
    setTimeout(() => {
      const adminUser = allUsers.find(user => 
        user.phone.includes(phone) && (user.role === 'admin' || user.role === 'superadmin')
      );
      
      if (adminUser) {
        adminLogin({
          ...adminUser,
          lastLogin: new Date().toISOString()
        });
      }
      
      setIsLoading(false);
    }, 2000);
  };

  const handleResendOTP = () => {
    setResendTimer(60);
    // Mock resend logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Painel Administrativo
          </CardTitle>
          <p className="text-gray-600">
            Acesso restrito a administradores
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'phone' ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Telemóvel
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="912 345 678"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Apenas números autorizados podem aceder
                  </p>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={phone.length < 9 || isLoading}
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner /> : 'Enviar Código SMS'}
                </Button>
              </div>

              {/* Mock admin numbers for testing */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Para demonstração:</p>
                <p className="text-xs text-gray-600">+351 912 345 678 (SuperAdmin)</p>
                <p className="text-xs text-gray-600">+351 913 456 789 (Admin)</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">Código enviado para</p>
                <p className="font-semibold text-gray-900">+351 {phone}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Verificação
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="pl-10 text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Para demonstração: qualquer código de 6 dígitos
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={otpCode.length !== 6 || isLoading}
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner /> : 'Verificar e Entrar'}
                </Button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Reenviar código em {resendTimer}s
                    </p>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleResendOTP}
                      className="text-sm"
                    >
                      Reenviar código
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setStep('phone')}
                  className="w-full text-sm"
                >
                  Alterar número
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;