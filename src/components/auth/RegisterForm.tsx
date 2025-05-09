
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RegisterFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  username: string;
  setUsername: (username: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  username, 
  setUsername 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      await signUp(email, password, username);
      // Mostrar mensagem de confirmação (a própria função signUp já mostra)
      toast.success('Conta criada! Verifique seu email para confirmar o registro.');
    } catch (error) {
      console.error("Erro no cadastro:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Erro desconhecido ao criar conta');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nome de usuário (opcional)</Label>
          <Input
            id="username"
            placeholder="Seu nome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-black/50 border-white/20"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-register">Email</Label>
          <Input
            id="email-register"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-black/50 border-white/20"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-register">Senha</Label>
          <Input
            id="password-register"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      </div>
      <div className="mt-4">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cadastrando...
            </>
          ) : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};
