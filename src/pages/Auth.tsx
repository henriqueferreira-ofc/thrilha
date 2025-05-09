
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Mountain, LogIn, UserPlus, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { clearAuthData } from '@/utils/auth-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { user, signIn, signUp, resetPassword } = useAuth();
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
      } else {
        setErrorMessage('Erro desconhecido ao fazer login');
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
          {showResetPassword ? (
            <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    className="mr-2 h-8 w-8 p-0" 
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetSent(false);
                      setErrorMessage(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-gradient">Recuperar senha</CardTitle>
                </div>
                <CardDescription>
                  {!resetSent 
                    ? 'Digite seu email para receber um link de redefinição de senha.'
                    : 'Verifique seu email para instruções de redefinição de senha.'}
                </CardDescription>
              </CardHeader>

              {!resetSent ? (
                <form onSubmit={handleResetPassword}>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                  <CardFooter>
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
                  </CardFooter>
                </form>
              ) : (
                <CardContent className="space-y-4">
                  <Alert className="bg-green-900/20 border-green-900 text-green-300">
                    <AlertDescription>
                      Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          ) : (
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
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password-login">Senha</Label>
                          <Button 
                            variant="link" 
                            className="px-0 text-purple-300 text-xs"
                            type="button"
                            onClick={() => setShowResetPassword(true)}
                          >
                            Esqueceu a senha?
                          </Button>
                        </div>
                        <Input
                          id="password-login"
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
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : 'Entrar'}
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
                    </CardContent>
                    <CardFooter>
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
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
