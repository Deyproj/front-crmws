'use client';

import { useCallback, useEffect, useState } from 'react';
import { createAiModelPrice, listAiModelPrices, type AiModelPrice, type AiModelPricePayload } from '@/features/platform';

/**
 * Catálogo de precios por proveedor/modelo (punto 18 del pedido original, Paso 8) — el costo de
 * cada ejecución se calcula y guarda en el momento con el precio vigente entonces; cargar un
 * precio nuevo aquí nunca recalcula ejecuciones pasadas. Exclusivo del admin de plataforma.
 */
export function AiModelPricesManager() {
  const [prices, setPrices] = useState<AiModelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPrices(await listAiModelPrices());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los precios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate(payload: AiModelPricePayload) {
    setCreating(true);
    setError(null);
    try {
      await createAiModelPrice(payload);
      await load();
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el precio');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-secondary">Cargando...</p>
      ) : prices.length === 0 ? (
        <p className="text-sm text-secondary">Sin precios configurados todavía — el costo de las ejecuciones queda sin calcular.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-app text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-[var(--space-6)] py-[var(--space-4)]">Proveedor / modelo</th>
                <th className="px-[var(--space-6)] py-[var(--space-4)]">Entrada (por millón)</th>
                <th className="px-[var(--space-6)] py-[var(--space-4)]">Salida (por millón)</th>
                <th className="px-[var(--space-6)] py-[var(--space-4)]">Caché (por millón)</th>
                <th className="px-[var(--space-6)] py-[var(--space-4)]">Vigente desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prices.map((price) => (
                <tr key={price.id}>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">
                    {price.provider}/{price.model}
                  </td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">${price.inputTokenPrice}</td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">${price.outputTokenPrice}</td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                    {price.cachedTokenPrice !== null ? `$${price.cachedTokenPrice}` : '—'}
                  </td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                    {new Date(price.effectiveFrom).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? (
        <NewPriceForm pending={creating} onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="self-start rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
        >
          Agregar precio
        </button>
      )}
    </div>
  );
}

function NewPriceForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (payload: AiModelPricePayload) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('');
  const [inputTokenPrice, setInputTokenPrice] = useState('');
  const [outputTokenPrice, setOutputTokenPrice] = useState('');
  const [cachedTokenPrice, setCachedTokenPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const inputClass =
    'w-full rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const input = Number(inputTokenPrice);
    const output = Number(outputTokenPrice);
    if (!model.trim() || !Number.isFinite(input) || input < 0 || !Number.isFinite(output) || output < 0) {
      setFormError('Modelo y precios de entrada/salida son obligatorios y deben ser números válidos');
      return;
    }
    const cached = cachedTokenPrice.trim() === '' ? null : Number(cachedTokenPrice);
    if (cached !== null && (!Number.isFinite(cached) || cached < 0)) {
      setFormError('El precio de caché debe ser un número válido, o dejarse vacío');
      return;
    }
    await onSubmit({ provider: provider.trim(), model: model.trim(), inputTokenPrice: input, outputTokenPrice: output, cachedTokenPrice: cached });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-[var(--space-5)] rounded-lg border border-border bg-surface p-[var(--space-8)] sm:grid-cols-2"
    >
      {formError && <p className="text-xs text-danger sm:col-span-2">{formError}</p>}
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Proveedor
        <input required value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Modelo
        <input
          required
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="ej. gemini-3.6-flash"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Precio entrada (por millón de tokens)
        <input required type="number" min={0} step="0.0001" value={inputTokenPrice} onChange={(e) => setInputTokenPrice(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Precio salida (por millón de tokens)
        <input required type="number" min={0} step="0.0001" value={outputTokenPrice} onChange={(e) => setOutputTokenPrice(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Precio caché (opcional)
        <input type="number" min={0} step="0.0001" value={cachedTokenPrice} onChange={(e) => setCachedTokenPrice(e.target.value)} placeholder="Sin definir" className={inputClass} />
      </label>
      <div className="flex items-end gap-[var(--space-4)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-5)] text-sm font-semibold text-ink hover:bg-app disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Crear
        </button>
      </div>
    </form>
  );
}
