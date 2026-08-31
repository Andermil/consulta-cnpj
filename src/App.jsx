import { useMemo, useState } from 'react'

const API_BASE = 'https://publica.cnpj.ws/cnpj'

const onlyDigits = (value = '') => String(value ?? '').replace(/\D/g, '')

function maskCnpj(value = '') {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatCnpj(value) {
  const digits = onlyDigits(value)
  if (digits.length !== 14) return value || '—'
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatCep(value) {
  const digits = onlyDigits(value)
  if (digits.length !== 8) return value || '—'
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  if (!Number.isFinite(number)) return String(value)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

function formatDate(value) {
  if (typeof value !== 'string') return value
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return value
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== '')
}

function humanize(value = '') {
  const acronyms = new Set(['cnpj', 'cpf', 'cep', 'uf', 'id', 'cnae', 'mei', 'ddd', 'ibge'])
  return String(value)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (acronyms.has(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function formatPrimitive(value, path = '') {
  if (value === null || value === undefined || value === '') return 'Não informado'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'

  const key = path.toLowerCase()
  if (key.includes('cnpj') && onlyDigits(value).length === 14) return formatCnpj(value)
  if (key.includes('cep') && onlyDigits(value).length === 8) return formatCep(value)
  if (key.includes('capital_social')) return formatMoney(value)
  if (typeof value === 'string') return formatDate(value)
  return String(value)
}

function countFilledFields(value) {
  if (value === null || value === undefined || value === '') return 0
  if (Array.isArray(value)) return value.reduce((total, item) => total + countFilledFields(item), 0)
  if (typeof value === 'object') return Object.values(value).reduce((total, item) => total + countFilledFields(item), 0)
  return 1
}

function describeStructure(value) {
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'item' : 'itens'}`
  if (value && typeof value === 'object') {
    const count = Object.keys(value).length
    return `${count} ${count === 1 ? 'campo' : 'campos'}`
  }
  return typeof value
}

function getAddress(establishment = {}) {
  const line1 = [
    establishment.tipo_logradouro,
    establishment.logradouro,
    establishment.numero && `nº ${establishment.numero}`,
  ].filter(Boolean).join(' ')

  const line2 = [
    establishment.complemento,
    establishment.bairro,
    establishment.cep && `CEP ${formatCep(establishment.cep)}`,
  ].filter(Boolean).join(' • ')

  return [line1, line2].filter(Boolean).join(' — ') || '—'
}

function getPhone(establishment = {}) {
  const phones = [
    [establishment.ddd1, establishment.telefone1],
    [establishment.ddd2, establishment.telefone2],
  ]
    .filter(([, number]) => number)
    .map(([ddd, number]) => `${ddd ? `(${ddd}) ` : ''}${number}`)
  return phones.length ? phones.join(' • ') : '—'
}

function getCnae(establishment = {}) {
  const cnae = establishment.atividade_principal
  if (!cnae) return '—'
  if (typeof cnae === 'string') return cnae
  return [cnae.subclasse || cnae.id, cnae.descricao].filter(Boolean).join(' — ') || '—'
}

function SummaryCard({ label, value, wide = false }) {
  return (
    <article className={`rounded-2xl border border-slate-800 bg-slate-900/75 p-5 ${wide ? 'xl:col-span-2' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-100">{value || '—'}</div>
    </article>
  )
}

function StatusBadge({ value }) {
  if (!value) return null
  const active = String(value).toLowerCase().includes('ativ')
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${active
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
      : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}
    >
      {value}
    </span>
  )
}

function DynamicValue({ value, path = 'root' }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-sm italic text-slate-600">Não informado</span>
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-sm italic text-slate-600">Lista vazia</span>
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={`${path}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-400">Item {index + 1}</div>
            <DynamicValue value={item} path={`${path}.${index}`} />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    return (
      <div className="grid gap-3">
        {Object.entries(value).map(([key, child]) => (
          <DynamicField key={`${path}.${key}`} fieldKey={key} value={child} path={`${path}.${key}`} />
        ))}
      </div>
    )
  }

  return <span className="break-words text-sm font-medium text-slate-100">{formatPrimitive(value, path)}</span>
}

function DynamicField({ fieldKey, value, path }) {
  const complex = value !== null && typeof value === 'object'

  if (complex) {
    return (
      <details open className="group rounded-2xl border border-slate-800 bg-slate-900/50">
        <summary className="cursor-pointer list-none px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-200">{humanize(fieldKey)}</div>
              <div className="mt-1 text-xs text-slate-500">{describeStructure(value)}</div>
            </div>
            <span className="text-slate-500 transition group-open:rotate-180">⌄</span>
          </div>
        </summary>
        <div className="border-t border-slate-800 p-4">
          <DynamicValue value={value} path={path} />
        </div>
      </details>
    )
  }

  return (
    <div className="grid gap-1 rounded-xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 sm:grid-cols-[220px_1fr] sm:gap-5">
      <div className="text-xs font-medium text-slate-500">{humanize(fieldKey)}</div>
      <div className="min-w-0"><DynamicValue value={value} path={path} /></div>
    </div>
  )
}

function LoadingState() {
  return (
    <section className="mt-8 animate-pulse">
      <div className="mb-5 h-7 w-64 rounded-lg bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-slate-800 bg-slate-900" />
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const [cnpj, setCnpj] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied] = useState(false)

  const establishment = data?.estabelecimento || {}
  const fieldCount = useMemo(() => countFilledFields(data), [data])

  const summary = useMemo(() => ({
    razaoSocial: firstValue(data?.razao_social, data?.nome_empresarial, data?.nome),
    fantasia: firstValue(establishment?.nome_fantasia, data?.nome_fantasia),
    situacao: firstValue(establishment?.situacao_cadastral, data?.situacao_cadastral, data?.situacao),
    cnpj: firstValue(establishment?.cnpj, data?.cnpj, onlyDigits(cnpj)),
    endereco: getAddress(establishment),
    cidadeUf: [establishment?.cidade?.nome, establishment?.estado?.sigla].filter(Boolean).join(' / ') || '—',
    cnae: getCnae(establishment),
    telefone: getPhone(establishment),
    email: firstValue(establishment?.email, data?.email) || '—',
    capitalSocial: formatMoney(data?.capital_social),
  }), [data, establishment, cnpj])

  async function consultar(event) {
    event?.preventDefault()
    const digits = onlyDigits(cnpj)

    if (digits.length !== 14) {
      setError('Informe um CNPJ válido com 14 dígitos.')
      return
    }

    setLoading(true)
    setError('')
    setData(null)
    setShowRaw(false)

    try {
      const response = await fetch(`${API_BASE}/${digits}`, { headers: { Accept: 'application/json' } })
      let payload = null

      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        const fallback = response.status === 429
          ? 'Limite de consultas atingido. Aguarde aproximadamente 60 segundos e tente novamente.'
          : response.status === 404
            ? 'CNPJ não encontrado na base pública.'
            : 'Não foi possível realizar a consulta.'
        throw new Error(payload?.detalhes || payload?.titulo || payload?.message || fallback)
      }

      setData(payload)
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Falha de rede ao acessar a API. Verifique sua conexão e tente novamente.'
        : err?.message || 'Ocorreu um erro inesperado durante a consulta.')
    } finally {
      setLoading(false)
    }
  }

  async function copyJson() {
    if (!data) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('O navegador não permitiu copiar o JSON automaticamente.')
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_42%,_#020617_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8">
          <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Consulta pública</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">Consulta de CNPJ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Pesquise uma empresa, confira os principais dados cadastrais e explore automaticamente todos os campos retornados pela API.</p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
          <form onSubmit={consultar} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="cnpj" className="mb-2 block text-sm font-semibold text-slate-300">CNPJ</label>
              <input
                id="cnpj"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cnpj}
                onChange={(event) => setCnpj(maskCnpj(event.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="h-14 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-lg font-semibold tracking-wide text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10"
              />
            </div>
            <button type="submit" disabled={loading} className="h-14 rounded-2xl bg-sky-500 px-7 font-bold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Consultando…' : 'Consultar'}
            </button>
          </form>

          {error && <div role="alert" className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"><strong>Não foi possível consultar:</strong> {error}</div>}
          <p className="mt-4 text-xs leading-5 text-slate-500">O CNPJ é enviado sem máscara para a API pública CNPJ.ws.</p>
        </section>

        {loading && <LoadingState />}

        {!loading && data && (
          <>
            <section className="mt-8">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-400">Empresa localizada</p>
                  <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{summary.razaoSocial || 'Dados cadastrais'}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">{fieldCount} {fieldCount === 1 ? 'campo preenchido' : 'campos preenchidos'}</span>
                  <StatusBadge value={summary.situacao} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SummaryCard label="Razão social" value={summary.razaoSocial} wide />
                <SummaryCard label="Nome fantasia" value={summary.fantasia} />
                <SummaryCard label="CNPJ" value={formatCnpj(summary.cnpj)} />
                <SummaryCard label="Situação cadastral" value={summary.situacao} />
                <SummaryCard label="Capital social" value={summary.capitalSocial} />
                <SummaryCard label="CNAE principal" value={summary.cnae} wide />
                <SummaryCard label="Endereço" value={summary.endereco} wide />
                <SummaryCard label="Cidade / UF" value={summary.cidadeUf} />
                <SummaryCard label="Telefone" value={summary.telefone} />
                <SummaryCard label="E-mail" value={summary.email} wide />
              </div>
            </section>

            {Array.isArray(establishment?.inscricoes_estaduais) && establishment.inscricoes_estaduais.length > 0 && (
              <section className="mt-8">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-white">Inscrições estaduais</h3>
                  <p className="mt-1 text-sm text-slate-400">Registros estaduais encontrados para o estabelecimento.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/55 p-4 sm:p-6">
                  <DynamicValue value={establishment.inscricoes_estaduais} path="estabelecimento.inscricoes_estaduais" />
                </div>
              </section>
            )}

            <section className="mt-8">
              <div className="mb-4">
                <h3 className="text-xl font-black text-white">Todos os dados da API</h3>
                <p className="mt-1 text-sm text-slate-400">Renderização automática de objetos, listas, listas de objetos e valores simples.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/55 p-4 sm:p-6"><DynamicValue value={data} /></div>
            </section>

            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
              <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-white">JSON bruto</h3>
                  <p className="mt-1 text-sm text-slate-400">Confira ou copie exatamente a resposta recebida.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setShowRaw((current) => !current)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">{showRaw ? 'Ocultar JSON' : 'Ver JSON bruto'}</button>
                  <button type="button" onClick={copyJson} className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-sky-400">{copied ? 'Copiado!' : 'Copiar JSON'}</button>
                </div>
              </div>
              {showRaw && <div className="overflow-x-auto p-5"><pre className="min-w-full whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-300 sm:text-sm">{JSON.stringify(data, null, 2)}</pre></div>}
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-xs leading-5 text-slate-600">Dados consultados na API pública CNPJ.ws. A disponibilidade e atualização das informações dependem da fonte pública.</footer>
      </div>
    </main>
  )
}
