import type { PersistStorage } from 'zustand/middleware'
import { readText, writeText } from './storage'

/**
 * Formato de uma chave do localStorage: como ler o texto salvo e como gravar o estado.
 * `parse` devolve undefined quando não há nada salvo (ou o salvo é inválido): o store fica no padrão.
 * `serialize` devolve null para apagar a chave.
 */
export type StorageCodec<S> = {
  parse: (text: string | null) => S | undefined
  serialize: (state: S) => string | null
}

/**
 * Storage do `persist` do Zustand que grava cada chave no formato que o app já usava (texto puro,
 * como "dark" em `theme`, ou JSON sem o envelope `{ state, version }` do Zustand). Assim, o que já
 * estava salvo nos aparelhos continua valendo, e o script inline do index.html (que lê `theme`)
 * segue funcionando.
 *
 * Usa o localStorage seguro de lib/storage: sem storage (aba anônima com bloqueio, cota cheia, testes
 * fora do navegador), o store funciona só em memória, nesta sessão.
 */
export function legacyStorage<S>(codec: StorageCodec<S>): PersistStorage<S> {
  return {
    getItem(name) {
      const state = codec.parse(readText(name))
      return state === undefined ? null : { state, version: 0 }
    },
    setItem(name, { state }) {
      writeText(name, codec.serialize(state))
    },
    removeItem(name) {
      writeText(name, null)
    },
  }
}

/** Codec para JSON puro, validado por `isValid` (o que não passa é descartado). */
export function jsonCodec<S>(isValid: (value: unknown) => value is S): StorageCodec<S> {
  return {
    parse(text) {
      if (text === null) return undefined
      try {
        const value: unknown = JSON.parse(text)
        return isValid(value) ? value : undefined
      } catch {
        return undefined
      }
    },
    serialize: (state) => JSON.stringify(state),
  }
}
