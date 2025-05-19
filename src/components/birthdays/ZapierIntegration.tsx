
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function ZapierIntegration() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast("Erro", {
        description: "Por favor, insira a URL do webhook do Zapier",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate connecting to Zapier
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Test the connection by sending a test payload
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Add this to handle CORS
        body: JSON.stringify({
          action: "test_connection",
          timestamp: new Date().toISOString(),
          message: "Conexão de teste do Thrilha App"
        }),
      });
      
      setIsConnected(true);
      toast("Conectado com sucesso", {
        description: "Seu Zapier foi conectado e irá enviar lembretes para seu WhatsApp.",
      });
      
      // Save in local storage for now
      localStorage.setItem('birthdayZapierWebhook', webhookUrl);
      
    } catch (error) {
      console.error("Erro ao conectar:", error);
      toast("Erro na conexão", {
        description: "Não foi possível conectar ao Zapier. Verifique a URL e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWebhookUrl('');
    localStorage.removeItem('birthdayZapierWebhook');
    toast("Desconectado", {
      description: "A integração com o Zapier foi removida.",
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 mb-4">
        Configure seu Zapier para receber lembretes de aniversário no WhatsApp
      </p>
      
      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL do Webhook do Zapier</Label>
            <Input
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              disabled={isLoading}
              className="bg-black/50"
            />
          </div>
          
          <div className="bg-blue-900/20 border border-blue-800 rounded p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="mb-1">Como configurar:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Crie uma conta no <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Zapier</a></li>
                <li>Crie um novo Zap com trigger "Webhook by Zapier"</li>
                <li>Selecione "Catch Hook" e copie a URL do webhook</li>
                <li>Configure uma ação para enviar mensagem no WhatsApp</li>
                <li>Cole a URL do webhook aqui</li>
              </ol>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !webhookUrl}
          >
            {isLoading ? "Conectando..." : "Conectar ao Zapier"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-800 rounded p-4">
            <p className="text-green-400">✓ Integração com Zapier configurada com sucesso!</p>
            <p className="text-sm text-green-500/80 mt-1">
              Os lembretes de aniversário serão enviados para seu WhatsApp automaticamente.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full border-red-800 text-red-400 hover:bg-red-950"
            onClick={handleDisconnect}
          >
            Desconectar Integração
          </Button>
        </div>
      )}
    </div>
  );
}
