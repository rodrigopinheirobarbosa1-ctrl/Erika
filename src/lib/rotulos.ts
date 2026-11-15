import type { AreaAtendimento, Modalidade, StatusAtendimento, StatusPaciente, StatusPreCadastro, TipoRegistro } from '@prisma/client'

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

export const STATUS_ATENDIMENTO: Record<StatusAtendimento, string> = {
  AGENDADO: 'Agendado',
  REALIZADO: 'Realizado',
  FALTOU: 'Faltou',
  DESMARCADO_PACIENTE: 'Desmarcado pelo paciente',
  DESMARCADO_PSICOLOGA: 'Desmarcado pela psicóloga',
}

export const TOM_ATENDIMENTO: Record<StatusAtendimento, 'azul' | 'verde' | 'vermelho' | 'cinza' | 'amarelo'> = {
  AGENDADO: 'azul',
  REALIZADO: 'verde',
  FALTOU: 'vermelho',
  DESMARCADO_PACIENTE: 'cinza',
  DESMARCADO_PSICOLOGA: 'amarelo',
}

export const TIPOS_REGISTRO: Record<TipoRegistro, string> = {
  EVOLUCAO: 'Evolução da sessão',
  ANOTACAO: 'Anotação',
  RETIFICACAO: 'Retificação',
}

export const MODALIDADES_CURTAS: Record<Modalidade, string> = {
  PRESENCIAL: 'Consultório',
  ONLINE: 'Online',
  DOMICILIO: 'Domicílio',
}

export const opcoes = <T extends string>(mapa: Record<T, string>) =>
  (Object.entries(mapa) as [T, string][]).map(([valor, texto]) => ({ valor, texto }))
