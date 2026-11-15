// Modelo da ficha de anamnese da Érika (transcrito do arquivo dela).
//
// Para mudar perguntas: crie uma NOVA versão (copie MODELO_V1 para MODELO_V2,
// ajuste e aponte MODELO_ATUAL). Fichas já respondidas continuam lidas pela
// versão com que foram preenchidas — nunca altere uma versão já usada.

export type Campo =
  | { id: string; tipo: 'texto' | 'data' | 'telefone' | 'email' | 'cpf'; rotulo: string; obrigatorio?: boolean; dica?: string }
  | { id: string; tipo: 'longo'; rotulo: string; dica?: string }
  | { id: string; tipo: 'escolha'; rotulo: string; opcoes: string[]; outro?: string }
  | { id: string; tipo: 'multipla'; rotulo: string; opcoes: string[]; outro?: string }

/** semNumero: bloco acrescentado ao modelo da Érika (não muda a numeração dela). */
export type Secao = { id: string; titulo: string; icone: string; nota?: string; semNumero?: boolean; campos: Campo[] }
export type Modelo = { versao: number; titulo: string; secoes: Secao[] }

export const MODELO_V1: Modelo = {
  versao: 1,
  titulo: 'Anamnese psicológica',
  secoes: [
    {
      id: 'identificacao',
      titulo: 'Identificação',
      icone: '👤',
      campos: [
        { id: 'nome', tipo: 'texto', rotulo: 'Nome', obrigatorio: true },
        { id: 'dataNascimento', tipo: 'data', rotulo: 'Data de nascimento' },
        { id: 'telefone', tipo: 'telefone', rotulo: 'Telefone' },
        { id: 'email', tipo: 'email', rotulo: 'E-mail' },
        { id: 'estadoCivil', tipo: 'texto', rotulo: 'Estado civil' },
        { id: 'profissao', tipo: 'texto', rotulo: 'Profissão' },
      ],
    },
    {
      id: 'cadastro',
      titulo: 'Para o seu cadastro',
      icone: '📋',
      semNumero: true,
      nota: 'Opcional — se preferir, combinamos depois. Necessário para atendimento em domicílio e para o recibo.',
      campos: [
        { id: 'cpf', tipo: 'cpf', rotulo: 'CPF' },
        { id: 'endereco', tipo: 'texto', rotulo: 'Endereço' },
        { id: 'cidade', tipo: 'texto', rotulo: 'Cidade' },
        { id: 'contatoEmergencia', tipo: 'texto', rotulo: 'Contato de emergência (nome)' },
        { id: 'telefoneEmergencia', tipo: 'telefone', rotulo: 'Telefone do contato de emergência' },
      ],
    },
    {
      id: 'motivo',
      titulo: 'Motivo da consulta',
      icone: '♡',
      campos: [{ id: 'motivo', tipo: 'longo', rotulo: 'O que a trouxe até o atendimento?' }],
    },
    {
      id: 'gestacional',
      titulo: 'História gestacional e perinatal',
      icone: '🤰',
      nota: 'Se não se aplica a você neste momento, pode deixar em branco.',
      campos: [
        { id: 'gestacaoPlanejada', tipo: 'escolha', rotulo: 'Gestação planejada?', opcoes: ['Sim', 'Não', 'Parcialmente'] },
        { id: 'comoFoiGestacao', tipo: 'longo', rotulo: 'Como foi a gestação?', dica: 'Ex.: intercorrências, medicações, sentimentos, rede de apoio' },
        { id: 'tipoParto', tipo: 'escolha', rotulo: 'Tipo de parto', opcoes: ['Normal', 'Cesárea', 'Fórceps'], outro: 'Outro' },
        { id: 'comoFoiPosParto', tipo: 'longo', rotulo: 'Como foi o pós-parto?', dica: 'Ex.: recuperação, amamentação, dificuldades, apoio recebido' },
      ],
    },
    {
      id: 'saude',
      titulo: 'Saúde emocional e histórico pessoal',
      icone: '♡',
      campos: [
        { id: 'acompanhamento', tipo: 'escolha', rotulo: 'Você já fez algum acompanhamento psicológico ou psiquiátrico?', opcoes: ['Sim', 'Não', 'Já fiz, mas não continuei'] },
        { id: 'acompanhamentoQuando', tipo: 'texto', rotulo: 'Se sim, quando?' },
        { id: 'acompanhamentoMotivo', tipo: 'texto', rotulo: 'Qual foi o motivo?' },
        { id: 'medicacao', tipo: 'escolha', rotulo: 'Tem histórico de uso de medicação?', opcoes: ['Sim', 'Não'] },
        { id: 'medicacaoQual', tipo: 'texto', rotulo: 'Qual?' },
        { id: 'historicoFamiliar', tipo: 'escolha', rotulo: 'Possui histórico de transtornos mentais na família?', opcoes: ['Sim', 'Não', 'Não sei informar'] },
        { id: 'momentoEmocional', tipo: 'longo', rotulo: 'Como você descreveria seu momento emocional atual?' },
      ],
    },
    {
      id: 'apoio',
      titulo: 'Rede de apoio',
      icone: '👥',
      campos: [
        { id: 'pessoasApoio', tipo: 'multipla', rotulo: 'Quem são as pessoas que te apoiam neste momento?', opcoes: ['Parceiro(a)', 'Família', 'Amigos(as)'], outro: 'Outros' },
        { id: 'relacionamentoApoio', tipo: 'longo', rotulo: 'Como é o relacionamento com essas pessoas?' },
        { id: 'seguraAcolhida', tipo: 'escolha', rotulo: 'Você se sente segura e acolhida?', opcoes: ['Sim', 'Não', 'Às vezes'] },
        { id: 'naoAVontade', tipo: 'escolha', rotulo: 'Há alguém com quem você não se sente à vontade para contar sobre o que está vivendo?', opcoes: ['Sim', 'Não'] },
        { id: 'naoAVontadeQuem', tipo: 'texto', rotulo: 'Se sim, quem?' },
      ],
    },
    {
      id: 'expectativas',
      titulo: 'Expectativas com a psicoterapia',
      icone: '☆',
      campos: [{ id: 'expectativas', tipo: 'longo', rotulo: 'O que você espera trabalhar durante o processo terapêutico?' }],
    },
    {
      id: 'adicionais',
      titulo: 'Informações adicionais',
      icone: '🗒',
      campos: [{ id: 'adicionais', tipo: 'longo', rotulo: 'Há algo mais que você gostaria de compartilhar e que considere importante para o atendimento?' }],
    },
  ],
}

/** Títulos com a numeração do modelo original (blocos extras sem número). */
export function numerar(modelo: Modelo): string[] {
  let n = 0
  return modelo.secoes.map((s) => (s.semNumero ? s.titulo : `${++n}. ${s.titulo}`))
}

export const MODELOS: Record<number, Modelo> = { 1: MODELO_V1 }
export const MODELO_ATUAL = MODELO_V1

/** Campos de identificação/cadastro (não clínicos): podem preencher o cadastro do paciente. */
export const CAMPOS_CADASTRO = ['nome', 'dataNascimento', 'telefone', 'email', 'estadoCivil', 'profissao', 'cpf', 'endereco', 'cidade', 'contatoEmergencia', 'telefoneEmergencia'] as const
