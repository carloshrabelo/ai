// Antes de cada commit (husky, .husky/pre-commit), só nos arquivos do commit:
// - formata (oxfmt respeita os ignorePatterns do .oxfmtrc.json) e devolve o arquivo formatado ao commit;
// - lint (oxlint);
// - checa os tipos do projeto (tsc -b não aceita lista de arquivos: roda inteiro se há TS no commit).
export default {
  '*': 'oxfmt --no-error-on-unmatched-pattern',
  // --type-aware: regras que usam os tipos (promises esquecidas, async em onClick…).
  '*.{ts,tsx,js,mjs,cjs}': 'oxlint --type-aware',
  '*.{ts,tsx}': () => 'tsc -b',
}
