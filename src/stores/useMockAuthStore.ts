import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MockUser {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  createdAt: Date;
}

interface OTPAttempt {
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

interface MockAuthState {
  // State
  isAuthenticated: boolean;
  user: MockUser | null;
  isLoading: boolean;
  error: string | null;
  
  // OTP Management
  currentOtpAttempt: OTPAttempt | null;
  
  // PIN Management
  hasPinConfigured: boolean;
  
  // Trusted Device Management
  deviceSessionId: string | null;
  
  // Actions
  sendOTP: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (phone: string, code: string) => Promise<{ success: boolean; message: string; user?: MockUser }>;
  createUser: (phone: string, userData?: Partial<MockUser>) => MockUser;
  login: (user: MockUser) => void;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // PIN Actions
  setPinConfigured: (configured: boolean) => void;
  clearPinData: () => void;
  
  // Trusted Device Actions
  createTrustedSession: (userId: string, deviceId: string) => void;
  verifyPinLogin: (pin: string, userId: string) => Promise<{ success: boolean; message: string }>;
  clearTrustedSession: () => void;
}

export const useMockAuthStore = create<MockAuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      currentOtpAttempt: null,
      hasPinConfigured: false,
      deviceSessionId: null,

      // Send OTP (Mock)
      sendOTP: async (phone: string) => {
        set({ isLoading: true, error: null });

        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Generate mock OTP (always "123456" for testing)
          const mockCode = "123456";
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

          set({
            currentOtpAttempt: {
              phone,
              code: mockCode,
              expiresAt,
              attempts: 0
            },
            isLoading: false
          });

          console.log(`🚀 [MOCK OTP] Código enviado para ${phone}: ${mockCode}`);

          return {
            success: true,
            message: `Código SMS enviado para ${phone}`
          };

        } catch (error) {
          set({ 
            error: "Erro ao enviar código SMS", 
            isLoading: false 
          });
          
          return {
            success: false,
            message: "Erro ao enviar código SMS"
          };
        }
      },

      // Verify OTP (Mock)
      verifyOTP: async (phone: string, code: string) => {
        set({ isLoading: true, error: null });

        try {
          const { currentOtpAttempt } = get();

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));

          // Check if OTP attempt exists
          if (!currentOtpAttempt || currentOtpAttempt.phone !== phone) {
            set({ 
              error: "Código não encontrado. Solicite um novo código.", 
              isLoading: false 
            });
            return {
              success: false,
              message: "Código não encontrado"
            };
          }

          // Check if OTP is expired
          if (new Date() > currentOtpAttempt.expiresAt) {
            set({ 
              error: "Código expirado. Solicite um novo código.", 
              isLoading: false,
              currentOtpAttempt: null
            });
            return {
              success: false,
              message: "Código expirado"
            };
          }

          // Increment attempts
          const updatedAttempt = {
            ...currentOtpAttempt,
            attempts: currentOtpAttempt.attempts + 1
          };

          // Check max attempts
          if (updatedAttempt.attempts > 5) {
            set({ 
              error: "Muitas tentativas inválidas. Solicite um novo código.", 
              isLoading: false,
              currentOtpAttempt: null
            });
            return {
              success: false,
              message: "Muitas tentativas inválidas"
            };
          }

          // Check if code is correct (accept "123456" or actual sent code)
          if (code !== currentOtpAttempt.code && code !== "123456") {
            set({ 
              currentOtpAttempt: updatedAttempt,
              error: `Código inválido. ${5 - updatedAttempt.attempts} tentativas restantes.`,
              isLoading: false 
            });
            return {
              success: false,
              message: "Código inválido"
            };
          }

          // Success - Create or retrieve user
          const user = get().createUser(phone);
          
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
            currentOtpAttempt: null,
            error: null
          });

          console.log(`✅ [MOCK AUTH] Usuário autenticado:`, user);

          return {
            success: true,
            message: "Autenticação realizada com sucesso!",
            user
          };

        } catch (error) {
          set({ 
            error: "Erro na verificação do código", 
            isLoading: false 
          });
          
          return {
            success: false,
            message: "Erro na verificação do código"
          };
        }
      },

      // Create User (Mock)
      createUser: (phone: string, userData?: Partial<MockUser>) => {
        const user: MockUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          phone,
          name: userData?.name,
          email: userData?.email,
          createdAt: new Date()
        };

        return user;
      },

      // Login
      login: (user: MockUser) => {
        set({
          isAuthenticated: true,
          user,
          error: null
        });
      },

      // Logout
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          currentOtpAttempt: null,
          error: null,
          hasPinConfigured: false,
          deviceSessionId: null
        });
      },

      // Clear Error
      clearError: () => {
        set({ error: null });
      },

      // Set Loading
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // PIN Actions
      setPinConfigured: (configured: boolean) => {
        set({ hasPinConfigured: configured });
      },

      clearPinData: () => {
        set({ hasPinConfigured: false });
      },

      // Trusted Device Actions
      createTrustedSession: (userId: string, deviceId: string) => {
        set({ 
          deviceSessionId: deviceId,
          hasPinConfigured: true 
        });
        console.log(`✅ [MOCK AUTH] Sessão confiável criada para usuário ${userId}: ${deviceId}`);
      },

      verifyPinLogin: async (pin: string, userId: string) => {
        set({ isLoading: true, error: null });

        try {
          // Simulate PIN verification delay
          await new Promise(resolve => setTimeout(resolve, 300));

          // For demo, accept "1234" as valid PIN
          if (pin === '1234') {
            set({ isLoading: false });
            console.log(`✅ [MOCK AUTH] PIN verificado com sucesso para usuário ${userId}`);
            
            return {
              success: true,
              message: "PIN verificado com sucesso!"
            };
          } else {
            set({ 
              error: "PIN incorreto",
              isLoading: false 
            });
            
            return {
              success: false,
              message: "PIN incorreto"
            };
          }
        } catch (error) {
          set({ 
            error: "Erro na verificação do PIN", 
            isLoading: false 
          });
          
          return {
            success: false,
            message: "Erro na verificação do PIN"
          };
        }
      },

      clearTrustedSession: () => {
        set({ 
          deviceSessionId: null,
          hasPinConfigured: false 
        });
        console.log(`🗑️ [MOCK AUTH] Sessão confiável removida`);
      }
    }),
    {
      name: 'mock-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasPinConfigured: state.hasPinConfigured,
        deviceSessionId: state.deviceSessionId
      })
    }
  )
);