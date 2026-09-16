'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SendIcon } from '@/components/ui/icons';
import { listOrganizationTemplates, type MessageTemplate } from '@/features/channel';
import {
  BROADCAST_REPLY_HANDLINGS,
  BROADCAST_REPLY_HANDLING_LABELS,
  BROADCAST_STATUS_LABELS,
  DEFAULT_ADVISOR_REPLY_WINDOW_HOURS,
  DEFAULT_DAILY_LIMIT,
  cancelBroadcast,
  createBroadcast,
  previewBroadcastAudience,
  sendBroadcastTest,
  type Broadcast,
  type BroadcastAudiencePreview,
  type BroadcastReplyHandling,
} from '@/features/broadcast';
import { useBroadcasts } from '../hooks/useBroadcasts';
import { BroadcastRecipientsDialog } from '../components/BroadcastRecipientsDialog';

/**
 * Difusión masiva (BR-035): una plantilla aprobada por Meta enviada a los clientes con plan
 * vigente sincronizados desde GymSoft.
 *
 * La vista previa se muestra **antes** de confirmar, con los excluidos y su motivo, porque una vez
 * creada la campaña la audiencia queda congelada y lo ya enviado no se puede deshacer.
 */
export function BroadcastsView() {
  const { broadcasts, page, totalPages, loading, error, goToPage, reload } = useBroadcasts();

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BroadcastAudiencePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [replyHandling, setReplyHandling] = useState<BroadcastReplyHandling>('ADVISOR');
  const [windowHours, setWindowHours] = useState(String(DEFAULT_ADVISOR_REPLY_WINDOW_HOURS));
  const [dailyLimit, setDailyLimit] = useState(String(DEFAULT_DAILY_LIMIT));
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledAtLocal, setScheduledAtLocal] = useState('');

  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Broadcast | null>(null);
  const [recipientsTarget, setRecipientsTarget] = useState<Broadcast | null>(null);

  useEffect(() => {
    listOrganizationTemplates('BROADCAST')
      .then((result) => {
        setTemplates(result);
        setTemplatesError(null);
      })
      .catch((err: unknown) =>
        setTemplatesError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas')
      );
  }, []);

  useEffect(() => {
    const limit = Number(dailyLimit);
    if (!Number.isFinite(limit) || limit < 1) return;
    previewBroadcastAudience(limit)
      .then((result) => {
        setPreview(result);
        setPreviewError(null);
      })
      .catch((err: unknown) =>
        setPreviewError(err instanceof Error ? err.message : 'No se pudo calcular la audiencia')
      );
  }, [dailyLimit]);

  /**
   * Una plantilla aprobada por Meta no se puede editar después, y la campaña le llega a miles: ver
   * el mensaje real en un WhatsApp propio antes de lanzarla es la única forma de detectar a tiempo
   * un texto mal redactado o una variable que no calza.
   */
  async function handleTestSend() {
    setTestResult(null);
    setTestError(null);
    if (!templateId) return setTestError('Elige primero la plantilla que quieres probar.');
    if (!testPhone.trim()) return setTestError('Escribe el número al que enviar la prueba.');
    setTesting(true);
    try {
      const result = await sendBroadcastTest(templateId, toInternationalPhone(testPhone));
      if (result.sent) {
        setTestResult('Enviado. Revisa ese WhatsApp: así le llega el mensaje a un cliente.');
      } else {
        setTestError(result.failureReason ?? 'No se pudo enviar la prueba.');
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'No se pudo enviar la prueba');
    } finally {
      setTesting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    if (!name.trim()) return setFormError('Ponle un nombre a la campaña para poder reconocerla después.');
    if (!templateId) return setFormError('Elige una plantilla clasificada como "Difusión masiva".');
    if (scheduleLater && !scheduledAtLocal) return setFormError('Indica la fecha y hora de envío.');
    setConfirming(true);
  }

  async function handleConfirm() {
    setCreating(true);
    setFormError(null);
    try {
      const created = await createBroadcast({
        name: name.trim(),
        templateId,
        replyHandling,
        advisorReplyWindowHours: Number(windowHours),
        dailyLimit: Number(dailyLimit),
        scheduledAt: scheduleLater ? new Date(scheduledAtLocal).toISOString() : null,
      });
      setSuccessMessage(
        `Difusión "${created.name}" creada con ${created.totalRecipients} destinatario(s).` +
          (created.totalRecipients > created.dailyLimit
            ? ` Se enviará por tandas de ${created.dailyLimit} por día.`
            : '')
      );
      setName('');
      setTemplateId('');
      setScheduleLater(false);
      setScheduledAtLocal('');
      setConfirming(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear la difusión');
      setConfirming(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCreating(true);
    try {
      await cancelBroadcast(cancelTarget.id);
      setCancelTarget(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo cancelar la difusión');
      setCancelTarget(null);
    } finally {
      setCreating(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-y-[var(--space-3)] border-b border-border bg-surface px-[var(--space-7)] py-[var(--space-3)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">Difusión</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        <div className="flex flex-col gap-[var(--space-7)]">
          <p className="max-w-3xl text-sm text-secondary">
            Envía una plantilla aprobada por Meta a los clientes con plan vigente sincronizados desde GymSoft. La
            audiencia queda congelada al crear la campaña y lo enviado no se puede deshacer.
          </p>

          <section className="rounded-xl border border-border bg-surface p-[var(--space-7)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Nueva difusión</p>

            {preview && (
              <div className="mt-[var(--space-5)] flex flex-wrap gap-[var(--space-7)] rounded-lg border border-border bg-app px-[var(--space-6)] py-[var(--space-5)]">
                <Metric label="Le llega a" value={preview.recipients} highlight />
                <Metric label="Con plan vigente" value={preview.currentPlanClients} />
                <Metric label="Sin WhatsApp válido" value={preview.excludedWithoutPhone} />
                <Metric label="Teléfono repetido" value={preview.excludedDuplicatePhone} />
                <Metric label="Días estimados" value={preview.estimatedDays} />
              </div>
            )}
            {previewError && <p className="mt-[var(--space-4)] text-xs text-danger">{previewError}</p>}

            <form onSubmit={handleSubmit} className="mt-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
              <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
                Nombre de la campaña
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Promoción de septiembre"
                  className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm font-normal text-ink placeholder-secondary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
                Plantilla
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm font-normal text-ink focus:outline-none"
                >
                  <option value="">Elige una plantilla…</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.languageCode})
                    </option>
                  ))}
                </select>
              </label>
              {templatesError && <p className="text-xs text-danger">{templatesError}</p>}
              {!templatesError && templates.length === 0 && (
                <p className="text-xs text-secondary">
                  No hay plantillas de difusión todavía. Créala en Meta, sincronízala en{' '}
                  <Link href="/settings/templates" className="font-semibold text-brand hover:underline">Configuración → Plantillas de Meta</Link>{' '}
                  y clasifícala como &ldquo;Difusión masiva&rdquo;.
                </p>
              )}
              {selectedTemplate && (
                <p className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs text-secondary">
                  {selectedTemplate.bodyPreview}
                </p>
              )}

              {selectedTemplate && (
                <div className="flex flex-wrap items-end gap-[var(--space-4)] rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-5)]">
                  <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
                    Probar con un número antes de enviar
                    <input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="3001234567"
                      className="w-52 rounded-md border border-border bg-surface px-[var(--space-5)] py-[var(--space-4)] text-sm font-normal text-ink placeholder-secondary focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleTestSend}
                    disabled={testing}
                    className="rounded-md border border-border bg-surface px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
                  >
                    {testing ? 'Enviando...' : 'Enviar prueba'}
                  </button>
                  {testResult && <p className="w-full text-xs text-success">{testResult}</p>}
                  {testError && <p className="w-full text-xs text-danger">{testError}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-[var(--space-6)]">
                <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
                  Quién atiende las respuestas
                  <select
                    value={replyHandling}
                    onChange={(e) => setReplyHandling(e.target.value as BroadcastReplyHandling)}
                    className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm font-normal text-ink focus:outline-none"
                  >
                    {BROADCAST_REPLY_HANDLINGS.map((handling) => (
                      <option key={handling} value={handling}>
                        {BROADCAST_REPLY_HANDLING_LABELS[handling]}
                      </option>
                    ))}
                  </select>
                </label>

                {replyHandling === 'ADVISOR' && (
                  <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
                    Horas para atender
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={windowHours}
                      onChange={(e) => setWindowHours(e.target.value)}
                      className="w-28 rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm font-normal text-ink focus:outline-none"
                    />
                  </label>
                )}

                <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
                  Tope diario
                  <input
                    type="number"
                    min={1}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-28 rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm font-normal text-ink focus:outline-none"
                  />
                </label>
              </div>

              <p className="max-w-3xl text-xs text-secondary">
                {replyHandling === 'ADVISOR'
                  ? `Quien responda dentro de las primeras ${windowHours} horas pasa a la bandeja "Esperando", sin asignar. Después de ese plazo responde la IA.`
                  : 'Todas las respuestas las atiende la IA, como en cualquier conversación.'}{' '}
                Meta limita a cuántas personas distintas se les puede escribir por día ({DEFAULT_DAILY_LIMIT} para un
                número nuevo); al llegar al tope, la campaña sigue al día siguiente.
              </p>

              <label className="flex items-center gap-[var(--space-3)] text-xs font-semibold text-secondary">
                <input type="checkbox" checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)} />
                Programar para más tarde
              </label>
              {scheduleLater && (
                <input
                  type="datetime-local"
                  value={scheduledAtLocal}
                  onChange={(e) => setScheduledAtLocal(e.target.value)}
                  className="w-fit rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink focus:outline-none"
                />
              )}

              {formError && <p className="text-xs text-danger">{formError}</p>}
              {successMessage && (
                <p className="rounded-md border border-success/30 bg-success-bg px-[var(--space-5)] py-[var(--space-4)] text-xs text-success">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="self-start rounded-md bg-brand px-[var(--space-8)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
              >
                Revisar y enviar
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-[var(--space-5)]">
            <p className="text-sm font-semibold uppercase text-muted">Difusiones</p>
            {error && <p className="text-sm text-danger">{error}</p>}
            {loading ? (
              <p className="text-sm text-secondary">Cargando...</p>
            ) : broadcasts.length === 0 ? (
              <EmptyState
                icon={<SendIcon className="size-6" />}
                title="Sin difusiones todavía"
                description="Crea una arriba para enviarle una plantilla a los clientes con plan vigente."
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-app text-xs font-semibold uppercase text-muted">
                    <tr>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Campaña</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Estado</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Progreso</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Respuestas</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {broadcasts.map((broadcast) => (
                      <tr key={broadcast.id}>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">{broadcast.name}</td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                          {BROADCAST_STATUS_LABELS[broadcast.status]}
                        </td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                          {broadcast.sentCount}/{broadcast.totalRecipients} enviados
                          {broadcast.failedCount > 0 && (
                            <span className="text-danger"> · {broadcast.failedCount} fallaron</span>
                          )}
                          {broadcast.skippedCount > 0 && <span> · {broadcast.skippedCount} omitidos</span>}
                        </td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                          {BROADCAST_REPLY_HANDLING_LABELS[broadcast.replyHandling]}
                        </td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)]">
                          <div className="flex justify-end gap-[var(--space-4)]">
                            <button
                              type="button"
                              onClick={() => setRecipientsTarget(broadcast)}
                              className="text-xs font-semibold text-brand hover:underline"
                            >
                              Ver destinatarios
                            </button>
                            {(broadcast.status === 'SCHEDULED' || broadcast.status === 'SENDING') && (
                              <button
                                type="button"
                                onClick={() => setCancelTarget(broadcast)}
                                className="text-xs font-semibold text-danger hover:underline"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-[var(--space-4)] text-sm">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => goToPage(page - 1)}
                  className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-secondary">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Confirmar difusión"
        description={
          preview
            ? `Se le enviará "${selectedTemplate?.name ?? ''}" a ${preview.recipients} persona(s)` +
              (preview.estimatedDays > 1 ? `, repartido en unos ${preview.estimatedDays} días.` : '.') +
              ' Lo enviado no se puede deshacer.'
            : 'Lo enviado no se puede deshacer.'
        }
        confirmLabel={creating ? 'Creando...' : 'Enviar'}
        pending={creating}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar difusión"
        description="Deja de enviar a quienes todavía no recibieron nada. Los mensajes ya enviados no se pueden deshacer."
        confirmLabel="Cancelar envío"
        cancelLabel="Volver"
        destructive
        pending={creating}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <BroadcastRecipientsDialog broadcast={recipientsTarget} onClose={() => setRecipientsTarget(null)} />
    </div>
  );
}

/**
 * El backend exige E.164 (`contact.application.PhoneNormalizer`), pero acá se escribe un número a
 * mano y en Colombia se dicta sin indicativo: se completa el `+57` de un celular de 10 dígitos en
 * vez de devolver "teléfono inválido" por algo que se entiende perfectamente. Cualquier otro
 * formato se envía tal cual y lo valida el backend, que es donde vive la regla real.
 */
function toInternationalPhone(raw: string): string {
  const cleaned = raw.trim().replace(/[\s\-().]/g, '');
  if (/^3\d{9}$/.test(cleaned)) return `+57${cleaned}`;
  if (/^573\d{9}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

function Metric({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <span className="text-xs text-secondary">{label}</span>
      <span className={`text-lg font-bold leading-none ${highlight ? 'text-brand' : 'text-ink'}`}>{value}</span>
    </div>
  );
}
