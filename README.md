# Vi Store v1.0

SPA premium para venda de scripts digitais de MTA, FiveM, SA:MP e OpenMP.

## Stack
- HTML5 / CSS3 / JavaScript ES6
- Supabase Auth + PostgreSQL + Storage
- GitHub Pages
- Hash-based SPA para funcionar sem servidor de rewrite

## Rodar
1. Crie um projeto no Supabase.
2. Abra o SQL Editor e execute `supabase.sql`.
3. Em `app.js`, troque:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Crie os buckets `products` (público) e `downloads` (privado).
5. Publique estes arquivos no GitHub Pages.

## Admin
Depois de criar seu usuário, no SQL Editor faça:
```sql
update public.profiles
set role='admin'
where username='SEU_USUARIO';
```

## Pagamentos
O frontend cria pedidos com status `pending`. Para produção, conecte um gateway (Mercado Pago, Stripe, Asaas etc.) por uma Edge Function/webhook do Supabase. Nunca coloque segredo de gateway no JavaScript público.

## Observação
A versão entregue já possui UI/UX, navegação SPA, loja, busca, filtros, favoritos, carrinho, autenticação preparada, checkout, conta, downloads, histórico e painel admin preparado. A aprovação real de pagamento e liberação segura dos arquivos dependem do gateway + Edge Functions.
