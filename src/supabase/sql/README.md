# Correção de Erro: Função `create_user_profile` Ausente

Este diretório contém soluções para erros relacionados à seguinte mensagem:

```
Searched for the function public.create_user_profile(user_id, user_name), 
but no matches were found in the schema cache.
```

## Problema

A aplicação está tentando chamar uma função RPC (`create_user_profile`) que não existe no banco de dados Supabase, resultando nos seguintes erros:

1. `PGRST202: Searched for the function public.create_user_profile(user_id, user_name), but no matches were found in the schema cache`
2. `42501: new row violates row-level security policy for table "profiles"`

Estes erros ocorrem porque:
- A função RPC esperada não existe no banco de dados
- As políticas de segurança (RLS) estão impedindo a inserção direta na tabela `profiles`

## Solução

### Opção 1: Implementar a Função no Supabase

⚠️ **Importante**: Divida a execução em dois scripts separados para evitar erros de sintaxe.

#### Passo 1: Criar a Função
1. Acesse o painel do Supabase para seu projeto
2. Navegue até "SQL Editor"
3. Crie uma nova query
4. Cole o conteúdo do arquivo `1_create_function.sql`
5. Execute a query

#### Passo 2: Criar Políticas RLS (se necessário)
1. Crie uma nova query
2. Cole o conteúdo do arquivo `2_create_policies.sql`
3. Execute a query
   - Se ocorrer erro indicando que alguma política já existe, você pode ignorar ou modificar para adicionar apenas as políticas faltantes

Esta função vai:
- Utilizar `SECURITY DEFINER` para contornar restrições de RLS
- Verificar se o perfil já existe antes de criar um novo
- Garantir que apenas o próprio usuário possa acessar/modificar seus dados

### Opção 2: Modificar as Políticas RLS (Menos Seguro)

Se você não puder criar a função, uma alternativa é modificar as políticas RLS:

1. Acesse o painel do Supabase para seu projeto
2. Navegue até "Authentication" → "Policies"
3. Encontre a tabela `profiles`
4. Adicione uma política permitindo inserção:
   - Operação: INSERT
   - Permissões: authenticated
   - Expressão: `auth.uid() = id`

## Implementação Atual

A aplicação já tem um sistema de fallback robusto que cria um perfil local mesmo quando o Supabase falha. Isso permite que a aplicação continue funcionando, mas valores como avatares e preferências de usuário não serão salvos entre sessões.

## Verificação

Após implementar a solução, os erros devem desaparecer e a criação de perfil deve funcionar normalmente, incluindo a persistência de avatares e configurações de usuário. 