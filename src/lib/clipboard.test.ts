import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'

afterEach(() => vi.unstubAllGlobals())

describe('copyText', () => {
  it('copia pela área de transferência', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const prompt = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('window', { prompt })
    expect(await copyText('abc', 'Copie:')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('abc')
    expect(prompt).not.toHaveBeenCalled()
  })

  it('sem permissão, mostra o texto para copiar à mão em vez de lançar erro', async () => {
    const prompt = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) } })
    vi.stubGlobal('window', { prompt })
    expect(await copyText('abc', 'Copie:')).toBe(false)
    expect(prompt).toHaveBeenCalledWith('Copie:', 'abc')
  })

  it('sem a API de área de transferência (página sem HTTPS)', async () => {
    const prompt = vi.fn()
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('window', { prompt })
    expect(await copyText('abc', 'Copie:')).toBe(false)
    expect(prompt).toHaveBeenCalledOnce()
  })
})
