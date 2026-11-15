import { site } from '@/lib/site'
import { linkWhatsapp } from '@/lib/formatos'
import { IconeWhatsapp } from '@/components/icones'

/** Botão fixo no canto da tela (só aparece com o número cadastrado em src/lib/site.ts). */
export function WhatsappFlutuante() {
  if (!site.whatsapp) return null
  return (
    <a
      href={linkWhatsapp(site.whatsapp, site.mensagemWhatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Érika pelo WhatsApp (abre em nova janela)"
      className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-white shadow-lg ring-4 ring-white/70 transition hover:scale-105 hover:bg-[#1ebe5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-6 sm:right-6"
    >
      <IconeWhatsapp className="h-7 w-7" />
      <span className="hidden text-sm font-medium sm:inline">WhatsApp</span>
    </a>
  )
}
