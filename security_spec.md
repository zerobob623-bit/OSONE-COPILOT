# Especificação de Segurança - OSONE 3

## 1. Planilha de Invariantes de Dados
- Perfil do Usuário: Apenas o próprio usuário (`userId` na rota coincide com `auth.uid`) pode ler e escrever.
- Histórico de Chat: Apenas o dono pode ler e adicionar mensagens. Mensagens são imutáveis após a criação.
- Administradores: Não há conceito de admin explícito solicitado agora, mas os dados são estritamente privados.

## 2. As "Doze Cargas Sujas" (Dirty Dozen)
1. **Identidade Falsa**: Tentar criar um perfil em `/users/outrouid`.
2. **Escalação de Privilégio**: Tentar ler `/users/outrouid`.
3. **Injeção de Lixo**: Enviar um nome de perfil com 1MB de caracteres.
4. **Violação Temporal**: Enviar `updatedAt` com data retroativa.
5. **Orfandade**: Criar uma mensagem de chat para um usuário que não existe (via ID malicioso).
6. **Shadow Update**: Tentar injetar um campo `isAdmin: true` no perfil.
7. **Bypass de Schema**: Enviar um objeto malformado para `aiProfile`.
8. **Envenenamento de ID**: Usar caracteres especiais longos como ID de documento.
9. **Apagamento em Massa**: Tentar deletar a coleção `/users` inteira.
10. **Query Scraping**: Tentar listar todos os usuários sem filtrar por UID.
11. **Spoofing de Verificação**: Tentar burlar `email_verified` (se habilitado).
12. **Status Imortal**: Tentar alterar o campo `email` após a criação.

## 3. Matriz de Auditoria Red Team
| Coleção | Roubo de ID | Injeção de Dados | Leak de PII | Passou? |
| :--- | :---: | :---: | :---: | :---: |
| /users/{uid} | Bloqueado | Bloqueado (hasOnly) | Bloqueado (Owner only) | Sim |
| /users/{uid}/chatHistory | Bloqueado | Bloqueado (Schema) | Bloqueado (Owner only) | Sim |
