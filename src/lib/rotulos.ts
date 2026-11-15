import type { AreaAtendimento, Modalidade, StatusPaciente, StatusPreCadastro } from '@prisma/client'

export const MODALIDADES: Record<Modalidade, string> = {
  PRESENCIAL: 'Presencial (consultório)',
  ONLINE: 'Online',
  DOMICILIO: 'Presencial em domicílio',
}

export const AREAS: Record<AreaAtendimento, string> = {
  GESTACAO: 'Gestação',
  PUERPERIO: 'Puerpério',
  PARENTALIDADE: 'Parentalidade',
  SAUDE_MENTAL: 'Saúde mental',
  OUTRO: 'Outro',
}

export const STATUS_PRE: Record<StatusPreCadastro, string> = {
  NOVO: 'Novo',
  EM_CONTATO: 'Em contato',
  CONVERTIDO: 'Virou paciente',
  DESCARTADO: 'Descartado',
}

export const STATUS_PACIENTE: Record<StatusPaciente, string> = {
  ATIVO: 'Em atendimento',
  PAUSADO: 'Pausado',
  ALTA: 'Alta',
  INATIVO: 'Inativo',
}

export const opcoes = <T extends string>(mapa: Record<T, string>) =>
  (Object.entries(mapa) as [T, string][]).map(([valor, texto]) => ({ valor, texto }))
