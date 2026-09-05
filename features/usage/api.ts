import { apiFetch } from '@/lib/http/apiFetch';
import type { PageResponse } from '@/lib/http/pageResponse';

const DEFAULT_PAGE_SIZE = 50;

export const PLAN_BILLING_CYCLES = ['MONTHLY', 'BIWEEKLY'] as const;
export type PlanBillingCycle = (typeof PLAN_BILLING_CYCLES)[number];

export const PLAN_BILLING_CYCLE_LABELS: Record<PlanBillingCycle, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
};

export const AI_OPERATION_TYPES = ['CUSTOMER_CHAT', 'SIMULATION', 'HANDOFF_SUMMARY'] as const;
export type AiOperationType = (typeof AI_OPERATION_TYPES)[number];

export const AI_OPERATION_TYPE_LABELS: Record<AiOperationType, string> = {
  CUSTOMER_CHAT: 'Conversación con cliente',
  SIMULATION: 'Prueba del agente',
  HANDOFF_SUMMARY: 'Resumen de traspaso',
};

export const LLM_CALL_KIND_LABELS: Record<string, string> = {
  CHAT_RESPONSE: 'Respuesta',
  CHAT_RESPONSE_FOLLOWUP: 'Respuesta (tras agendar)',
  SUMMARY: 'Resumen',
};

/** Refleja CurrentUsageResponse (api-crmws, usage/presentation). */
export interface CurrentUsage {
  planConfigured: boolean;
  billingCycle: PlanBillingCycle | null;
  periodStart: string;
  periodEnd: string;
  includedInteractions: number;
  usedInteractions: number;
  remainingInteractions: number;
  usagePercentage: number;
  overageInteractions: number;
  overageEnabled: boolean;
  overageUnitPrice: number | null;
  overageAmount: number | null;
  llmCalls: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  estimatedCost: number | null;
}

/** Refleja AiInteractionResponse. */
export interface AiInteraction {
  id: string;
  contactId: string | null;
  operationType: AiOperationType;
  billable: boolean;
  includedInPlan: boolean;
  overage: boolean;
  llmCallsCount: number;
  toolCallsCount: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  estimatedCost: number | null;
  startedAt: string;
  completedAt: string | null;
}

/** Refleja AiUsageEventResponse. */
export interface AiUsageEvent {
  provider: string;
  model: string;
  operationType: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  usageSource: 'PROVIDER' | 'ESTIMATED';
  providerCost: number | null;
  startedAt: string;
  completedAt: string;
}

/** Refleja AiToolCallResponse. */
export interface AiToolCallEntry {
  toolName: string;
  status: string;
  startedAt: string;
  completedAt: string;
}

/** Refleja AiInteractionDetailResponse. */
export interface AiInteractionDetail {
  interaction: AiInteraction;
  events: AiUsageEvent[];
  toolCalls: AiToolCallEntry[];
}

export async function getCurrentUsage(): Promise<CurrentUsage> {
  return apiFetch<CurrentUsage>('/api/usage/current');
}

export async function listInteractions(page = 0): Promise<PageResponse<AiInteraction>> {
  return apiFetch<PageResponse<AiInteraction>>(`/api/usage/interactions?page=${page}&size=${DEFAULT_PAGE_SIZE}`);
}

export async function getInteractionDetail(id: string): Promise<AiInteractionDetail> {
  return apiFetch<AiInteractionDetail>(`/api/usage/interactions/${id}`);
}
