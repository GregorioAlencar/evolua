# Evolua · beta privada (GitHub Pages + Supabase)

Esta versão reconstrói o Evolua com **Supabase Auth e tabela protegida por RLS**, mantendo a interface estática que pode ser hospedada no **GitHub Pages**. Sem IA, sem servidor próprio e sem build. Feita para testar inicialmente com **3 contas**.

## 1. Criar o Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. Abra **SQL Editor** e execute **`supabase/schema.sql`** integralmente. **Não publique sem executar e verificar RLS.**
3. Em **Project Settings → API Keys** ou **Connect**, copie a **Project URL** e a **publishable key** (`sb_publishable_...`; um projeto legado pode usar `anon`). A chave **service_role**, `sb_secret_...` e a senha do banco **NUNCA** podem estar no GitHub/JS.
4. Preencha `config.js`:
   ```js
   export const SUPABASE_URL='https://SEU-ID.supabase.co';
   export const SUPABASE_PUBLISHABLE_KEY='sb_publishable_...';
   ```
5. Em **Authentication → URL Configuration**, informe a URL real do seu GitHub Pages como **Site URL** e acrescente em **Redirect URLs**: `https://SEU-USUARIO.github.io/evolua/**` e `http://localhost:5500/**` (para testar a confirmação/recuperação de senha). Em ambiente beta, evite redirecionamentos com domínios amplos.
6. Em **Authentication → Providers → Email**, deixe e-mail/senha habilitado e **confirmação de e-mail** habilitada. Para um teste fechado, desabilite novos cadastros públicos depois de preparar as contas; convide seus dois amigos por **Authentication → Users → Invite user** (ou crie as contas de teste pelo fluxo permitido no seu painel). O convite pode exigir configuração SMTP; teste primeiro.

**Nota:** a chave publicável é pública por design; a proteção dos dados vem da autenticação, das permissões SQL e da RLS. A política é `auth.uid() = user_id`. Confira o Security Advisor do Supabase antes de compartilhar o endereço.

## 2. Rodar local

```bash
python3 -m http.server 5500
```

Acesse http://localhost:5500. Para testes no iPhone, use a URL HTTPS publicada no GitHub Pages; a autenticação e a instalação PWA são mais confiáveis em HTTPS.

## 3. Publicar no GitHub Pages

1. Crie o repositório `evolua` e copie **o conteúdo desta pasta** para a raiz (inclusive `.github/workflows/pages.yml`).
2. Configure **Settings → Pages → Source: GitHub Actions**, faça `git push` para `main` e acompanhe **Actions**.
3. Abra `https://SEU-USUARIO.github.io/evolua/` no Safari; Compartilhar → Adicionar à Tela de Início.
4. O URL do projeto e a **publishable key** no `config.js` podem constar no repositório. **Nunca** faça commit com segredos, senha, exportação JSON, dados pessoais ou fotos.

## 4. Como funciona o salvamento

- Cada usuário autentica com e-mail e senha.
- Em `public.user_state`, há um documento JSON por `user_id`, com `revision` para detectar alterações concorrentes.
- Os dados são armazenados **também no IndexedDB**, sob uma chave exclusiva daquele usuário, permitindo continuar uma sessão quando a internet cair depois do primeiro acesso.
- O indicador informa se os dados estão **sincronizados**, **pendentes**, **offline** ou em **conflito**.
- Conflito entre aparelhos **não é sobrescrito**: exporte o backup e use **Perfil → Carregar nuvem** apenas se concordar em descartar as alterações locais. Não há mesclagem automática de sessões paralelas nesta beta.
- Fotos são compactadas (~650 px) e embutidas no documento JSON; limite de 20 fotos. Para uso ampliado ou alta resolução, migrar para **Supabase Storage com bucket privado e políticas próprias**.
- Exportação/importação JSON permanece disponível. O backup contém informações sensíveis e não é criptografado.
- **Dados do app anterior não migram sozinhos.** Neste navegador, Perfil → **Importar dados da versão sem login** tenta ler a chave IndexedDB antiga. Se já houver dados na conta, exporte/import e revise antes.

## 5. Checklist obrigatório com 3 contas

- [ ] Conta A entra, registra treino e academia A, sai e entra novamente: treino permanece.
- [ ] Conta B no MESMO navegador entra: não vê peso, fotos nem treinos da A.
- [ ] Conta B em navegador diferente: continua sem ver dados A.
- [ ] Conta C registra sessões em duas academias: o Progresso separa os dados por academia.
- [ ] Tire o Wi-Fi depois de carregar a conta; registre série; reconecte e espere indicador **Sincronizado**.
- [ ] Teste acesso no Safari do iPhone e instalação pela tela inicial.
- [ ] Teste importação e exportação JSON; salve cópia protegida.
- [ ] Tente acessar `user_state` de outra conta usando Supabase client: RLS deve retornar zero registros e impedir atualização.
- [ ] Abra duas sessões da MESMA conta; altere ambas. A segunda não deve sobrescrever a primeira em silêncio (aviso de conflito).
- [ ] Teste confirmação de e-mail e recuperação de senha no link HTTPS.
- [ ] No Supabase, confirme que **RLS está ENABLED** e que `anon` não tem SELECT/INSERT/UPDATE/DELETE.

## Limitações e riscos

Esta é uma **beta funcional de código**, não uma produção validada: o banco ainda precisa ser criado em sua conta, as chaves públicas configuradas e os testes ponta a ponta realizados com Supabase real, três contas e Safari. Não é possível afirmar que a hospedagem ou o backend estão ativos antes da sua configuração.

- GitHub Pages entrega o frontend, não oculta código nem impede acesso ao link. Apenas os dados exigem login. Para evitar cadastros indesejados, desabilite inscrição pública no Supabase.
- Não existe recurso administrativo de excluir conta e dados pelo aplicativo; antes de qualquer lançamento aberto implemente exclusão, LGPD, consentimento e política de privacidade.
- Não há logs de erro/observabilidade, rate limiting próprio, sincronização em tempo real, testes automatizados de RLS contra projeto vivo ou proteção completa contra alterações no mesmo instante de dois aparelhos.
- A biblioteca Supabase é importada de CDN, exigindo acesso a esse domínio no primeiro carregamento; offline completo da autenticação não é garantido.
- A ficha inicial é **modelo editável**, não um gerador adaptado ao nível nem prescrição individual. Não substitui professor ou avaliação de restrições.

## Arquivos

- `app.js`: telas, IndexedDB por conta, indicador de sincronização, importação e exportação.
- `cloud.js`: autenticação e operações no banco com controle de revisão.
- `config.js`: URL e chave pública Supabase (substitua os placeholders).
- `supabase/schema.sql`: tabela, permissões e políticas RLS.
- `.github/workflows/pages.yml`: publicação automática.
- `index.html`, `styles.css`, `data.js`, `sw.js`, `manifest.webmanifest`, `assets/`: frontend/PWA.
