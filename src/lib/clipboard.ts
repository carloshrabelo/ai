/**
 * Copia o texto para a área de transferência. Sem permissão (aba sem foco, navegador que nega, página sem
 * HTTPS), mostra o texto num `prompt` já selecionado para a pessoa copiar à mão, em vez de lançar erro.
 * Devolve true se copiou sozinho.
 */
export async function copyText(text: string, promptLabel: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    window.prompt(promptLabel, text)
    return false
  }
}
