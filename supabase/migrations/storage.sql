-- Função para criar políticas do bucket avatars
create or replace function criar_politicas_avatar()
returns void
language plpgsql
security definer
as $$
begin
  -- Remover políticas existentes
  drop policy if exists "Avatar Public Read Policy" on storage.objects;
  drop policy if exists "Avatar Upload Policy" on storage.objects;
  
  -- Criar políticas novas
  create policy "Avatar Public Read Policy"
  on storage.objects for select
  using (bucket_id = 'avatars');

  create policy "Avatar Upload Policy"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );
end;
$$;

-- Executar função
select criar_politicas_avatar();