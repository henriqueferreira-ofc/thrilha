
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { clearAuthData } from '@/utils/auth-utils';

// Imported components
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AuthHeader } from '@/components/auth/AuthHeader';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navegação */}
      <AuthHeader />

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {showResetPassword ? (
            <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
              <CardHeader className="pb-2">
                <ResetPasswordForm 
                  email={email} 
                  setEmail={setEmail} 
                  onBack={() => {
                    setShowResetPassword(false);
                  }} 
                />
              </CardHeader>
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
                  <CardContent className="pb-0">
                    <LoginForm 
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      onShowResetPassword={() => setShowResetPassword(true)}
                    />
                  </CardContent>
                  <CardFooter></CardFooter>
                </Card>
              </TabsContent>

              {/* Conteúdo da aba de Cadastro */}
              <TabsContent value="register">
                <Card className="bg-black/60 border border-white/10 shadow-lg shadow-purple-500/10">
                  <CardHeader>
                    <CardTitle className="text-gradient">Criar conta</CardTitle>
                    <CardDescription>Crie uma nova conta para começar a usar o Trilha.</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <RegisterForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      username={username}
                      setUsername={setUsername}
                    />
                  </CardContent>
                  <CardFooter></CardFooter>
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
