import Image from 'next/image'

/** Logo + título usados nas telas de login e primeiro acesso. */
export function MarcaSistema({ subtitulo }: { subtitulo: string }) {
  return (
    <div className="mb-6 text-center">
      <Image src="/img/logo.png" alt="Érika Dias Psicóloga" width={120} height={120} className="mx-auto h-28 w-28" priority />
      <p className="mt-3 text-sm text-stone-500">{subtitulo}</p>
    </div>
  )
}
