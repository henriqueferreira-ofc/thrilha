
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Mountain, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { clearAuthData } from '@/utils/auth-utils';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Força a limpar qualquer resíduo de autenticação ao carregar a página
  useEffect(() => {
    console.log('Página de autenticação montada - limpando tokens residuais');
    clearAuthData();
  }, []);

  // Usar useEffect para redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    if (user) {
      console.log('Usuário já autenticado, redirecionando para /tasks');
      navigate('/tasks', { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log('Tentando fazer login com:', email);
      await signIn(email, password);
      // O redirecionamento é feito pelo próprio hook use-auth-service
    } catch (error) {
      console.error("Erro no login:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
      } else {
        setErrorMessage('Erro desconhecido ao fazer login');
        toast.error('Erro desconhecido ao fazer login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      await signUp(email, password, username);
      // Mostrar mensagem de confirmação (a própria função signUp já mostra)
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
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navegação */}
      <nav className="py-5 px-6 md:px-12 flex justify-between items-center border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-6 w-6 text-purple-300" />
          <span className="text-xl font-bold purple-gradient-text">Trilha</span>
        </Link>
      </nav>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-white/10">
              <TabsTrigger value="login" className="data-[state=active]:bg-purple-500/20">
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-purple-500/20">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo da aba de Login */}
            <TabsContent value="login">
              <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-gradient">Bem-vindo de volta!</CardTitle>
                  <CardDescription>Entre com seu email e senha para acessar suas tarefas.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-login">Email</Label>
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-black/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-login">Senha</Label>
                      <Input
                        id="password-login"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-black/50 border-white/20"
                      />
                    </div>
                    {errorMessage && (
                      <div className="text-red-500 text-sm mt-2">
                        {errorMessage}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Conteúdo da aba de Cadastro */}
            <TabsContent value="register">
              <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-gradient">Criar conta</CardTitle>
                  <CardDescription>Crie uma nova conta para começar a usar o Trilha.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de usuário (opcional)</Label>
                      <Input
                        id="username"
                        placeholder="Seu nome"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/50 border-white/20"
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
                      />
                    </div>
                    {errorMessage && (
                      <div className="text-red-500 text-sm mt-2">
                        {errorMessage}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Auth;
