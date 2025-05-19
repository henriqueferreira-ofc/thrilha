
// Utilitários para o webhook do Stripe

// Configuração CORS segura
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Função para log com prefixo e timestamp
export const log = (message: string, data?: any) => {
  const now = new Date().toISOString();
  const logMessage = data 
    ? `[${now}][STRIPE-WEBHOOK] ${message}: ${typeof data === 'object' ? JSON.stringify(data) : data}`
    : `[${now}][STRIPE-WEBHOOK] ${message}`;
  console.log(logMessage);
};

// Cache para evitar processar eventos duplicados
export class EventCache {
  private processedEvents = new Set<string>();
  private readonly MAX_SIZE: number;

  constructor(maxSize = 1000) {
    this.MAX_SIZE = maxSize;
  }

  hasProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  markAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
    
    // Limitar o tamanho do conjunto
    if (this.processedEvents.size > this.MAX_SIZE) {
      const iterator = this.processedEvents.values();
      this.processedEvents.delete(iterator.next().value);
    }
  }
}
