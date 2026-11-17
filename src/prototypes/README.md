# Protótipos

Telas e fluxos em fase de experimentação. Cada protótipo fica na sua própria pasta:

```
src/prototypes/
  nome-do-prototipo/
    index.tsx      # componente principal (export default)
    ...            # componentes auxiliares do protótipo
```

Para acessar no app, registre uma rota em `src/router.tsx` com `lazy`, como nas páginas existentes.
Quando um protótipo for aprovado, mova o código para `src/pages` e `src/components`.
