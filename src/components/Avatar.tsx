import React, { useEffect, useState } from 'react';
import { User, Loader2 } from 'lucide-react';

const Avatar: React.FC<{ avatarUrl: string }> = ({ avatarUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarUrl) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar se a URL é válida
        if (!avatarUrl.startsWith('http')) {
          throw new Error('URL do avatar inválida');
        }

        // Tentar carregar a imagem
        const img = new Image();
        img.src = avatarUrl;

        // Adicionar timestamp para evitar cache
        const timestamp = new Date().getTime();
        img.src = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${timestamp}`;

        img.onload = () => {
          console.log('Avatar carregado com sucesso:', avatarUrl);
          setIsLoading(false);
        };

        img.onerror = (err) => {
          console.error('Erro ao carregar avatar:', err);
          setError('Erro ao carregar imagem');
          setIsLoading(false);
        };
      } catch (error) {
        console.error('Erro no carregamento do avatar:', error);
        setError('Erro ao carregar imagem');
        setIsLoading(false);
      }
    };

    loadImage();
  }, [avatarUrl]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
        <User className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-10 h-10">
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          console.error('Erro ao renderizar imagem do avatar');
          setError('Erro ao carregar imagem');
        }}
      />
    </div>
  );
};

export default Avatar; 