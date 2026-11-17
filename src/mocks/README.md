# Dados mock

Dados falsos usados pelos protótipos e páginas enquanto não existe API real.

- Um arquivo por domínio: `users.ts`, `products.ts`, etc.
- Exporte os tipos junto com os dados, para reaproveitar quando a API chegar.
- Para dados grandes ou copiados de uma API, use `.json` e importe direto (`import data from './x.json'`).

```ts
// src/mocks/users.ts
export type User = { id: string; name: string }

export const users: User[] = [
  { id: '1', name: 'Ana' },
  { id: '2', name: 'Bruno' },
]
```
