import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ZapierIntegration() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from('user_settings')
        .select('birthday_zapier_webhook')
        .eq('user_id', user.id)
        .maybeSingle();
      const saved = (data as any)?.birthday_zapier_webhook;
      if (saved) {
        setWebhookUrl(saved);
        setIsConnected(true);
      }
    })();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) {
      toast.error('Por favor, insira a URL do webhook do Zapier');
      return;
    }
    if (!userId) {
      toast.error('Você precisa estar logado');
      return;
    }

    setIsLoading(true);
    try {
      // Test ping
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          event: 'test_connection',
          message: 'Conexão de teste do Thrilha',
          triggered_at: new Date().toISOString(),
        }),
      });

      const { error } = await supabase
        .from('profiles')
        .update({ birthday_zapier_webhook: webhookUrl } as any)
        .eq('id', userId);

      if (error) throw error;

      setIsConnected(true);
      toast.success('Zapier conectado! Você receberá lembretes diariamente quando houver aniversário.');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Não foi possível conectar ao Zapier. Verifique a URL e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!userId) return;
    await supabase
      .from('profiles')
      .update({ birthday_zapier_webhook: null } as any)
      .eq('id', userId);
    setIsConnected(false);
    setWebhookUrl('');
    toast('Desconectado', { description: 'A integração com o Zapier foi removida.' });
  };

  const handleTestNow = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('birthday-notifier', {
        body: {},
      });
      if (error) throw error;
      toast.success(`Verificação executada. Aniversários hoje: ${data?.total ?? 0}, enviados: ${data?.sent ?? 0}.`);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao executar verificação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-sm sm:text-base text-gray-400">
        Configure seu Zapier para receber um aviso automático no WhatsApp quando chegar a data de um aniversário cadastrado. A verificação acontece diariamente às 08:00 UTC.
      </p>

      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="webhookUrl" className="text-sm">URL do Webhook do Zapier</Label>
            <Input
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/..."
              disabled={isLoading}
              className="bg-black/50 text-sm sm:text-base"
            />
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-blue-300">
              <p className="mb-1.5 font-medium">Como configurar:</p>
              <ol className="list-decimal ml-4 sm:ml-5 space-y-1">
                <li>Crie um Zap no <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Zapier</a> com trigger "Webhook by Zapier" → "Catch Hook"</li>
                <li>Copie a URL do webhook gerada</li>
                <li>Configure a ação para enviar mensagem no WhatsApp (ex.: WhatsApp Business, Twilio)</li>
                <li>Cole a URL aqui e salve</li>
              </ol>
            </div>
          </div>

          <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading || !webhookUrl}>
            {isLoading ? 'Conectando...' : 'Conectar ao Zapier'}
          </Button>
        </form>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 sm:p-4">
            <p className="text-sm sm:text-base text-green-400">✓ Integração ativa</p>
            <p className="text-xs sm:text-sm text-green-500/80 mt-1 break-all">{webhookUrl}</p>
            <p className="text-xs text-green-500/70 mt-2">
              Todo dia às 08:00 UTC verificamos seus aniversários e enviamos um aviso ao seu Zap.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 text-sm" onClick={handleTestNow} disabled={isLoading}>
              {isLoading ? 'Executando...' : 'Verificar agora'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-800 text-red-400 hover:bg-red-950 text-sm"
              onClick={handleDisconnect}
            >
              Desconectar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
