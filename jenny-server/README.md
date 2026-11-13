# Jenny Server — Atual Som

Backend inicial da assistente Jenny.

## Executar localmente
1. Instale Node.js (versão LTS).
2. Dentro desta pasta, execute `npm install`.
3. Copie `.env.example` para `.env` e ajuste as configurações locais.
4. Execute `npm start`.

## Rotas
- `GET /health`: verifica se o servidor está online.
- `POST /api/chat`: recebe `{ "message": "..." }`.

A integração com um provedor de IA ainda não está ativada. Não coloque chaves secretas no GitHub. Configure credenciais somente como variáveis de ambiente privadas na hospedagem, depois de verificar os termos do provedor.
