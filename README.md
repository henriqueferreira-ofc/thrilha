<h1 align="center">Seja-bem vindo a meu Projeto Triha</h1>

<p align="center">
Meu Projeto ainda está sendo desenvolvido e logo teremos boas novas<br/>
<a href="https://trilha-eight.vercel.app/">Veja meu Projeto Clicando aqui</a>
</p>

<p align="center">
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-banco">Banco</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-projeto">Projeto</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-layout">Layout</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-configuração">Configuração</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#memo-licença">Licença</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/static/v1?label=license&message=MIT&color=49AA26&labelColor=000000">
</p>

<br>

![ProjetoDev](https://github.com/henriqueferreira-ofc/trilha/blob/main/public/trilhacapas.jpg)
## 🚀 Tecnologias

Esse projeto foi desenvolvido com as seguintes tecnologias:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🚀 Banco

Esse projeto foi desenvolvido usando:
- Supabase

## 💻 Projeto

O Projeto Trilha está sendo desenvolvido por [@henriqueFerreira.ofc](https://github.com/henriqueferreira-ofc), Teremos muitas novidades em breve.

## 🔖 Layout

Você pode visualizar o layout do projeto através [DESSE LINK](https://www.figma.com/design/ugxcVLR8uDnySuq0uPze4y/DevLinks-%E2%80%A2-Projeto-Discover-(Community)?t=ZZvB2irPs4CPmNRz-0). É necessário ter conta no [Figma](https://figma.com) para acessá-lo.

## 🔧 Configuração

### Configuração do Supabase para Upload de Avatares

Para que o sistema de upload de avatares funcione corretamente, siga estas etapas:

1. Acesse o [Painel do Supabase](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para a seção **Storage**
4. Clique em **Criar novo bucket**
5. Nomeie o bucket como `avatars`
6. Marque a opção **Público** para que as imagens possam ser acessadas sem autenticação
7. Defina o limite de tamanho para `2MB`

Em seguida, você precisa adicionar políticas RLS (Row Level Security) para permitir operações específicas no bucket:

#### Políticas de Acesso para o Bucket "avatars"

1. No bucket criado, vá para a aba **Policies**
2. Para cada operação, clique em **Novo Policy** e configure conforme abaixo:

##### INSERIR - Upload de Avatares
```sql
-- Permitir que usuários autenticados façam upload de avatares
((bucket_id = 'avatars') AND (auth.uid() IS NOT NULL))
```

##### SELECIONAR - Visualização de Avatares
```sql
-- Acesso público para visualização das imagens
(bucket_id = 'avatars')
```

##### ATUALIZAR - Atualização de Avatares
```sql
-- Permitir que usuários atualizem seus próprios avatares
((bucket_id = 'avatars') AND (auth.uid() = owner))
```

##### EXCLUIR - Remoção de Avatares
```sql
-- Permitir que usuários excluam seus próprios avatares
((bucket_id = 'avatars') AND (auth.uid() = owner))
```

### Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

## :memo: Licença

Esse projeto está sob a licença MIT.

---

Simply visit the [Trilha Project](https://github.com/henriqueferreira-ofc/trilha) and start prompting.

Feito com ❤️ por Henrique Ferreira 👋  
[Conheça um pouco mais sobre mim!!](https://www.henriqueportfolio.com/)

























