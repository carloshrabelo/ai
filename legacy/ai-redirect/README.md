# Redirecionamento de carloshrabelo.dev/ai/

Conteúdo do repositório **`ai`** depois que o app passou para `lisbondance.com` (repositório
`lisbon-social-dances`). Publicado pelo GitHub Pages direto da branch (*Deploy from a branch*, `main`, `/`), sem
build.

- `index.html` e `404.html` (iguais): qualquer caminho em `/ai/…` vai para o mesmo caminho em `lisbondance.com`,
  com a query, levando os dados salvos no aparelho (tema, idioma, eventos acompanhados…) no fragmento
  `#migrate=…` (`redirect.js`).
- `sw.js`: substitui o service worker do app antigo. Apaga os caches, se desregistra e recarrega as abas, que
  caem no redirecionamento acima. Sem ele, quem tem o app instalado continuaria vendo a versão em cache.
- `.nojekyll`: publica os arquivos como estão.

Manter publicado por alguns meses (links compartilhados e apps instalados).
