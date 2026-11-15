// Horários da agenda no fuso de Brasília. Código puro (testes/horario.test.ts).
//
// O Brasil não tem horário de verão desde 2019: Brasília é sempre UTC-3. Se um
// dia voltar, é só este arquivo que precisa mudar.
const OFFSET_HORAS = 3

/** "2026-11-20" + "14:30" (Brasília) -> instante UTC. Inválido -> null. */
export function localParaUtc(data: string, hora: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) return null
  const [h, m] = hora.split(':').map(Number)
  if (h > 23 || m > 59) return null
  const d = new Date(`${data}T${hora}:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== data) return null
  return new Date(d.getTime() + OFFSET_HORAS * 3600000)
}

/** Instante UTC -> { data: "2026-11-20", hora: "14:30" } em Brasília. */
export function utcParaLocal(d: Date): { data: string; hora: string } {
  const local = new Date(d.getTime() - OFFSET_HORAS * 3600000).toISOString()
  return { data: local.slice(0, 10), hora: local.slice(11, 16) }
}

/** Data de hoje em Brasília: "2026-11-15". */
export function hojeLocal(agora = new Date()): string {
  return utcParaLocal(agora).data
}

/** Soma dias a uma data "AAAA-MM-DD". */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Segunda-feira da semana da data. */
export function segundaDaSemana(data: string): string {
  const diaSemana = new Date(`${data}T12:00:00Z`).getUTCDay() // 0 = domingo
  return somarDias(data, -((diaSemana + 6) % 7))
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2026-11-20" -> "sexta, 20 nov" */
export function rotuloDia(data: string): string {
  const d = new Date(`${data}T12:00:00Z`)
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
}

/** Instante -> "sex, 20/11 às 14:30" */
export function rotuloInstante(d: Date): string {
  const { data, hora } = utcParaLocal(d)
  const dia = DIAS[new Date(`${data}T12:00:00Z`).getUTCDay()].slice(0, 3)
  return `${dia}, ${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)} às ${hora}`
}

/** Os dois intervalos [inicio, inicio+duração) se cruzam? */
export function sobrepoe(aInicio: Date, aMin: number, bInicio: Date, bMin: number): boolean {
  const aFim = aInicio.getTime() + aMin * 60000
  const bFim = bInicio.getTime() + bMin * 60000
  return aInicio.getTime() < bFim && bInicio.getTime() < aFim
}
