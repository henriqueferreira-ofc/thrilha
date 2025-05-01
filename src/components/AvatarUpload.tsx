
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User, Upload, Loader2 } from 'lucide-react';
import { ImageTest } from './ImageTest';
import { AVATARS_BUCKET, getAvatarPublicUrl, supabase } from '../supabase/client';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarChange?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarChange,
  size = 'md'
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string | null>(null);

  // Limpar a URL local quando o componente desmonta
  useEffect(() => {
    return () => {
      if (localPreviewRef.current) {
        console.log('AvatarUpload: Limpando URL local');
        URL.revokeObjectURL(localPreviewRef.current);
      }
    };
  }, []);

  // Processar a URL do avatar quando o componente monta ou quando currentAvatarUrl muda
  useEffect(() => {
    console.log('AvatarUpload: currentAvatarUrl mudou:', currentAvatarUrl);
    if (currentAvatarUrl) {
      // Normalizar a URL para evitar problemas
      let url = currentAvatarUrl;
      if (url.includes('avatars/avatars/')) {
        url = url.replace('avatars/avatars/', 'avatars/');
      }
      // Adicionar timestamp para forçar recarregamento
      url = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setAvatarUrl(url);
    } else {
      setAvatarUrl(null);
    }
  }, [currentAvatarUrl]);

  // Configuração de tamanhos
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const uploadButtonSizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      console.log('AvatarUpload: Iniciando upload do arquivo:', file.name);
      setUploading(true);
      setUploadError(null);
      
      // Prevenir envio de arquivos muito grandes
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }
      
      // Validar tipos de arquivo permitidos
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
      }
      
      toast.info('Enviando imagem...');
      
      // Mostrar prévia local antes do upload completo
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
      localPreviewRef.current = URL.createObjectURL(file);
      console.log('AvatarUpload: Prévia local criada:', localPreviewRef.current);
      
      // Upload para o storage
      if (user) {
        try {
          // Preparar o caminho do arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`; // Remover prefixo avatars/
          
          console.log('AvatarUpload: Iniciando upload para:', filePath);
          
          // Fazer upload direto pelo cliente Supabase
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(filePath, file, {
              cacheControl: '0', // Sem cache
              upsert: true
            });
            
          if (uploadError) {
            console.error('AvatarUpload: Erro no upload:', uploadError);
            throw uploadError;
          }
          
          // Gerar URL pública
          const publicUrl = getAvatarPublicUrl(filePath);
          console.log('AvatarUpload: URL pública gerada:', publicUrl);
          
          // Atualizar o perfil com a nova URL
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('AvatarUpload: Erro ao atualizar perfil:', updateError);
            throw updateError;
          }
          
          // Atualizar o estado local com a URL pública
          setAvatarUrl(publicUrl);
          if (onAvatarChange) {
            onAvatarChange(publicUrl);
          }
          
          // Limpar a prévia local após o upload bem-sucedido
          if (localPreviewRef.current) {
            URL.revokeObjectURL(localPreviewRef.current);
            localPreviewRef.current = null;
          }
          
          toast.success('Avatar atualizado com sucesso!');
        } catch (error) {
          console.error('AvatarUpload: Erro no upload:', error);
          setUploadError('Erro ao fazer upload da imagem');
          toast.error('Erro ao fazer upload da imagem');
          
          // Em caso de erro, manter a URL original
          setAvatarUrl(currentAvatarUrl);
        }
      }
    } catch (error) {
      console.error('AvatarUpload: Erro ao processar arquivo:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      
      // Em caso de erro, manter a URL original
      setAvatarUrl(currentAvatarUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div 
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-800 cursor-pointer`}
        onClick={handleClick}
      >
        {avatarUrl ? (
          <ImageTest imageUrl={avatarUrl} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={`${uploadButtonSizes[size]} bg-purple-600 hover:bg-purple-700 text-white rounded-full`}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload />
            )}
          </Button>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        disabled={uploading}
      />
      
      {uploadError && (
        <p className="mt-2 text-sm text-red-500 text-center">{uploadError}</p>
      )}
    </div>
  );
}
