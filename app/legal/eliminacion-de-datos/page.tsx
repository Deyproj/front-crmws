import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Solicitud de Eliminación de Datos — Dinabot',
  description:
    'Cómo solicitar la eliminación de tus datos personales tratados por Dinabot, operado por Prothymía.',
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-full bg-app text-ink">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted">Prothymía · Dinabot</p>
        <h1 className="mt-2 text-display font-semibold text-ink">
          Solicitud de Eliminación de Datos
        </h1>
        <p className="mt-2 text-sm text-muted">Última actualización: 5 de septiembre de 2026</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-secondary">
          <section>
            <p>
              Esta página explica cómo solicitar la eliminación de tus datos personales si
              interactuaste por WhatsApp con un negocio que usa{' '}
              <strong className="text-ink">Dinabot</strong>, el asistente comercial operado por{' '}
              <strong className="text-ink">Prothymía</strong>. Aplica tanto si escribiste como
              cliente o prospecto de ese negocio, como si eres un asesor o dueño con una cuenta en
              la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Qué se elimina</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Tu número de teléfono y nombre asociados a tu conversación.</li>
              <li>El historial de mensajes de esa conversación.</li>
              <li>Datos de agendamiento (nombre completo, documento de identidad, correo) si agendaste una cita o cortesía.</li>
              <li>Respuestas de encuestas de satisfacción asociadas a tu contacto.</li>
              <li>Tu cuenta de acceso a la plataforma, si eres asesor o dueño de un negocio cliente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Cómo solicitarla</h2>
            <p className="mt-2">Elige la opción que te resulte más fácil:</p>
            <ol className="mt-2 list-decimal space-y-3 pl-6">
              <li>
                <strong className="text-ink">Por correo (recomendado):</strong> escribe a{' '}
                <a href="mailto:privacidad@prothymia.app" className="text-brand underline">
                  privacidad@prothymia.app
                </a>{' '}
                indicando:
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>El número de WhatsApp desde el que escribiste.</li>
                  <li>El nombre del negocio con el que hablaste (ayuda a ubicar tu registro más rápido, aunque no es obligatorio).</li>
                  <li>Que solicitas la eliminación de tus datos personales.</li>
                </ul>
              </li>
              <li>
                <strong className="text-ink">Directamente por WhatsApp:</strong> escribe el
                mensaje &quot;ELIMINAR MIS DATOS&quot; en tu conversación con el negocio. Un asesor
                o el administrador de esa cuenta escalará tu solicitud.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Plazo de respuesta</h2>
            <p className="mt-2">
              Atenderemos tu solicitud dentro de los <strong className="text-ink">10 días hábiles</strong> siguientes
              a su recepción, conforme a la Ley 1581 de 2012. Si no es posible resolverla en ese
              plazo, te informaremos los motivos y la fecha en que se atenderá, que no podrá
              superar los 5 días hábiles adicionales. Recibirás una confirmación por correo cuando
              la eliminación se haya completado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Excepciones</h2>
            <p className="mt-2">
              Si existe una obligación legal o contractual vigente que exija conservar cierta
              información (por ejemplo, un comprobante de pago), esa parte de tus datos se
              restringirá de tratamiento adicional en vez de eliminarse de inmediato, y solo se
              conservará mientras dure esa obligación.
            </p>
          </section>

          <section>
            <p>
              Para conocer con más detalle qué datos tratamos y con qué finalidad, consulta la{' '}
              <Link href="/legal/privacidad" className="text-brand underline">
                Política de Tratamiento de Datos Personales
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
