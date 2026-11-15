'use client'

import Link from 'next/link'
import { BotaoEnviar, Formulario } from '@/components/form'
import { enviarPreCadastro } from '@/app/acoes-publicas'

const MODALIDADES = [
  { valor: 'PRESENCIAL', texto: 'Presencial' },
  { valor: 'ONLINE', texto: 'Online' },
  { valor: 'DOMICILIO', texto: 'Em domicílio' },
]

export function FormularioPreCadastro() {
  return (
    <Formulario action={enviarPreCadastro} limparAoSalvar className="space-y-4">
      {/* Armadilha para robôs: escondido de pessoas e de leitores de tela */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Não preencha <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="block">
        <span className="rotulo">Seu nome *</span>
        <input name="nome" required autoComplete="name" className="campo" maxLength={120} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="rotulo">Telefone / WhatsApp *</span>
          <input name="telefone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="(61) 99999-9999" className="campo" />
        </label>
        <label className="block">
          <span className="rotulo">E-mail</span>
          <input name="email" type="email" autoComplete="email" className="campo" />
        </label>
      </div>

      <fieldset>
        <legend className="rotulo">Como prefere ser atendida(o)?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {MODALIDADES.map((m) => (
            <label key={m.valor} className="cursor-pointer">
              <input type="radio" name="modalidade" value={m.valor} className="peer sr-only" />
              <span className="inline-block rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 transition peer-checked:border-terracota peer-checked:bg-terracota peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-terracota/40">
                {m.texto}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="rotulo">Assunto</span>
          <select name="area" className="campo" defaultValue="">
            <option value="">Prefiro não dizer agora</option>
            <option value="GESTACAO">Gestação</option>
            <option value="PUERPERIO">Puerpério (pós-parto)</option>
            <option value="PARENTALIDADE">Parentalidade</option>
            <option value="SAUDE_MENTAL">Saúde mental</option>
            <option value="OUTRO">Outro</option>
          </select>
        </label>
        <label className="block">
          <span className="rotulo">Melhor horário para contato</span>
          <input name="melhorHorario" className="campo" placeholder="Ex.: manhãs, depois das 18h" maxLength={120} />
        </label>
      </div>

      <label className="block">
        <span className="rotulo">Quer contar um pouco o que te traz? (opcional)</span>
        <textarea name="motivo" rows={4} className="campo" maxLength={2000} placeholder="Não precisa detalhar — conversamos com calma no primeiro contato." />
      </label>

      <label className="flex items-start gap-3 text-sm text-stone-700">
        <input type="checkbox" name="consentimento" required className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 accent-terracota" />
        <span>
          Concordo que meus dados sejam usados apenas para a psicóloga entrar em contato comigo, conforme a{' '}
          <Link href="/privacidade" className="text-terracota-escuro underline underline-offset-2">
            política de privacidade
          </Link>
          . *
        </span>
      </label>

      <BotaoEnviar>Enviar pedido de contato</BotaoEnviar>
      <p className="text-xs text-stone-500">Seus dados ficam protegidos e são tratados com sigilo profissional.</p>
    </Formulario>
  )
}
