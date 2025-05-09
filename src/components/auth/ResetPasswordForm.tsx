
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ResetPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  onBack: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ 
  email, 
  setEmail, 
  onBack 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Erro desconhecido ao enviar email de recuperação');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-2 h-8 w-8 p-0" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-gradient">Recuperar senha</h2>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        {!resetSent 
          ? 'Digite seu email para receber um link de redefinição de senha.'
          : 'Verifique seu email para instruções de redefinição de senha.'}
      </p>

      {!resetSent ? (
        <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-reset">Email</Label>
            <Input
              id="email-reset"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/20"
              disabled={isLoading}
            />
          </div>
          {errorMessage && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : 'Enviar link de recuperação'}
          </Button>
        </form>
      ) : (
        <Alert className="bg-green-900/20 border-green-900 text-green-300 mt-4">
          <AlertDescription>
            Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
