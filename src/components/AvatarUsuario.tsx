import { User } from 'lucide-react';
import { ImageLoader } from './ImageLoader';
import { useEffect, useState } from 'react';
import { verificarBucket } from '@/utils/storage-utils';

interface AvatarUsuarioProps {
  urlAvatar?: string | null;
  nomeUsuario: string;
  tamanho?: 'pequeno' | 'medio' | 'grande';
  className?: string;
}

const classeTamanhos = {
  pequeno: 'w-8 h-8',
  medio: 'w-12 h-12',
  grande: 'w-16 h-16'
};

export function AvatarUsuario({
  urlAvatar,
  nomeUsuario,
  tamanho = 'medio',
  className = ''
}: AvatarUsuarioProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Verifica o bucket antes de tentar carregar a imagem
      await verificarBucket();
      
      if (!urlAvatar) return;

      const baseUrl = urlAvatar.split('?')[0];
      const newUrl = `${baseUrl}?v=${Date.now()}`;
      setImageUrl(newUrl);
    };

    init();
  }, [urlAvatar]);

  const avatarClasses = `
    relative rounded-full overflow-hidden 
    ${classeTamanhos[tamanho]} 
    ${className}
  `;

  if (!imageUrl) {
    return (
      <div className={`
        flex items-center justify-center 
        bg-purple-500/20 rounded-full 
        ${classeTamanhos[tamanho]} 
        ${className}
      `}>
        <User className="w-1/2 h-1/2 text-purple-500" />
      </div>
    );
  }

  return (
    <div className={avatarClasses}>
      <ImageLoader
        src={imageUrl}
        alt={`Avatar de ${nomeUsuario}`}
        className="w-full h-full object-cover"
        fallbackClassName={classeTamanhos[tamanho]}
      />
    </div>
  );
}