import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Tratamiento de Datos — Dinabot',
  description:
    'Política de tratamiento de datos personales de Dinabot, operado por Prothymía.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-full bg-app text-ink">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted">Prothymía · Dinabot</p>
        <h1 className="mt-2 text-display font-semibold text-ink">
          Política de Tratamiento de Datos Personales
        </h1>
        <p className="mt-2 text-sm text-muted">Última actualización: 5 de septiembre de 2026</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-secondary">
          <section>
            <p>
              Esta política aplica a <strong className="text-ink">Dinabot</strong>, el asistente
              comercial de WhatsApp con CRM operado por{' '}
              <strong className="text-ink">Prothymía</strong> (Daniel Guzmán, persona natural,
              Colombia), disponible en <code className="text-sm">dinabot.prothymia.app</code>.
              Describe qué datos personales trata Dinabot, con qué finalidad, con quién se
              comparten y cómo puedes ejercer tus derechos, en cumplimiento de la{' '}
              <strong className="text-ink">Ley 1581 de 2012</strong> (régimen de protección de
              datos personales de Colombia, &quot;Habeas Data&quot;) y sus decretos reglamentarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">1. ¿Quién es el responsable y quién el encargado?</h2>
            <p className="mt-2">
              Cada negocio que usa Dinabot para atender WhatsApp (por ejemplo, un gimnasio) es el{' '}
              <strong className="text-ink">responsable del tratamiento</strong> de los datos de
              sus propios clientes y prospectos: decide qué información pide, cuánto tiempo la
              conserva y con qué fin comercial la usa.
            </p>
            <p className="mt-2">
              Prothymía actúa como{' '}
              <strong className="text-ink">encargado del tratamiento</strong>: provee la
              infraestructura técnica (Dinabot) que recibe, almacena y responde los mensajes de
              WhatsApp por cuenta de ese negocio, incluida la generación de respuestas mediante
              inteligencia artificial.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">2. Qué datos tratamos</h2>
            <p className="mt-2 font-medium text-ink">Si escribes por WhatsApp a un negocio que usa Dinabot:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Tu número de teléfono y el nombre visible en tu perfil de WhatsApp.</li>
              <li>El contenido de tus mensajes (texto) y metadatos de los archivos que envíes (imagen, video, audio, documento o sticker) — Dinabot no interpreta el contenido real de esos archivos, solo registra que fueron enviados.</li>
              <li>El historial de la conversación y su etapa comercial (por ejemplo: prospecto, oportunidad, cliente).</li>
              <li>Si agendas una cita o cortesía a través del agente: tu nombre completo, número de documento de identidad y correo electrónico.</li>
              <li>Tu respuesta, si decides contestar, a una encuesta breve de satisfacción enviada al cerrarse un caso comercial.</li>
            </ul>
            <p className="mt-4 font-medium text-ink">Si eres dueño o asesor de un negocio cliente:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Nombre, correo electrónico y rol dentro de la plataforma.</li>
              <li>Registro de acceso y de las acciones que realizas sobre las conversaciones (por ejemplo, a qué conversaciones te asignas o transfieres).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">3. Para qué usamos estos datos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Recibir y responder mensajes de WhatsApp en nombre del negocio, de forma automática (agente de IA) o a través de un asesor humano.</li>
              <li>Gestionar el proceso comercial: calificación de prospectos, agendamiento de citas o cortesías, seguimiento y encuestas de satisfacción.</li>
              <li>Generar respuestas automáticas mediante un proveedor externo de inteligencia artificial.</li>
              <li>Medir el uso técnico de la plataforma (por ejemplo, volumen de interacciones de IA) para fines de soporte y facturación del negocio cliente, nunca para perfilar al usuario final con fines distintos al comercial ya descrito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">4. Con quién compartimos tus datos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong className="text-ink">El negocio con el que hablaste</strong> (sus dueños y
                asesores autorizados): son quienes gestionan tu conversación.
              </li>
              <li>
                <strong className="text-ink">Meta Platforms, Inc.</strong>, cuando el negocio usa
                el canal oficial de WhatsApp Business Platform (Cloud API) — los mensajes
                transitan por su infraestructura para poder entregarse por WhatsApp.
              </li>
              <li>
                <strong className="text-ink">Google (Gemini)</strong>, como proveedor de
                inteligencia artificial que procesa el texto de la conversación para generar
                respuestas automáticas.
              </li>
            </ul>
            <p className="mt-2">
              No vendemos tus datos personales a terceros ni los usamos para publicidad ajena al
              negocio con el que interactuaste.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">5. Cuánto tiempo conservamos tus datos</h2>
            <p className="mt-2">
              Conservamos tu información mientras exista una relación comercial activa entre tú y
              el negocio con el que hablaste, o mientras el negocio mantenga su cuenta en Dinabot.
              Puedes solicitar la eliminación anticipada en cualquier momento — ver la{' '}
              <Link href="/legal/eliminacion-de-datos" className="text-brand underline">
                página de solicitud de eliminación de datos
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">6. Tus derechos</h2>
            <p className="mt-2">Como titular de tus datos personales, tienes derecho a:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Conocer, actualizar y rectificar tus datos.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
              <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que impida eliminarlos.</li>
              <li>Acceder de forma gratuita a tus datos personales tratados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">7. Seguridad</h2>
            <p className="mt-2">
              Las comunicaciones con la plataforma viajan cifradas (HTTPS/TLS) y las credenciales
              de conexión a los canales de mensajería se almacenan cifradas y separadas de los
              mensajes. El acceso a la información de cada negocio está restringido a sus propios
              dueños y asesores autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">8. Menores de edad</h2>
            <p className="mt-2">
              Dinabot no está dirigido a niños, niñas ni adolescentes. Si un negocio cliente
              identifica que trató por error datos de un menor sin la autorización de su
              representante legal, debe informarlo para proceder a su eliminación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">9. Cómo contactarnos</h2>
            <p className="mt-2">
              Para ejercer tus derechos, resolver dudas sobre esta política o reportar una
              inquietud de privacidad, escribe a{' '}
              <a href="mailto:privacidad@prothymia.app" className="text-brand underline">
                privacidad@prothymia.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">10. Cambios a esta política</h2>
            <p className="mt-2">
              Si actualizamos esta política, publicaremos la nueva versión en esta misma página
              con la fecha de actualización correspondiente.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
