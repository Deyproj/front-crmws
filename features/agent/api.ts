import { apiFetch } from '@/lib/http/apiFetch';

export const AGENT_TONES = ['CLOSE', 'PROFESSIONAL', 'ENERGETIC', 'FORMAL'] as const;
export type AgentTone = (typeof AGENT_TONES)[number];

export const TONE_LABELS: Record<AgentTone, string> = {
  CLOSE: 'Cercano',
  PROFESSIONAL: 'Profesional',
  ENERGETIC: 'Energético',
  FORMAL: 'Formal',
};

export const RESPONSE_LENGTHS = ['SHORT', 'MEDIUM'] as const;
export type ResponseLength = (typeof RESPONSE_LENGTHS)[number];

export const RESPONSE_LENGTH_LABELS: Record<ResponseLength, string> = {
  SHORT: 'Corta (1-2 frases)',
  MEDIUM: 'Media (el detalle necesario)',
};

/** Refleja AgentConfigResponse (api-crmws, agent/presentation/AgentConfigResponse.java). */
export interface AgentConfig {
  agentName: string;
  tone: AgentTone;
  emojisAllowed: boolean;
  responseLength: ResponseLength;
  greetingStyle: string | null;
  farewellStyle: string | null;
  forbiddenWords: string | null;
  humanHoursNote: string | null;
  updatedAt: string;
}

export interface UpdateAgentConfigInput {
  agentName: string;
  tone: AgentTone;
  emojisAllowed: boolean;
  responseLength: ResponseLength;
  greetingStyle: string;
  farewellStyle: string;
  forbiddenWords: string;
  humanHoursNote: string;
}

export async function getAgentConfig(): Promise<AgentConfig> {
  return apiFetch<AgentConfig>('/api/agent/config');
}

export async function updateAgentConfig(input: UpdateAgentConfigInput): Promise<AgentConfig> {
  return apiFetch<AgentConfig>('/api/agent/config', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export type SimulatedTurnRole = 'CUSTOMER' | 'ASSISTANT';

export interface SimulatedTurn {
  role: SimulatedTurnRole;
  text: string;
}

/** Refleja SimulateAgentResponse (api-crmws, agent/presentation/SimulateAgentResponse.java). */
export interface SimulateAgentResult {
  text: string | null;
  escalate: boolean;
  escalationReason: string | null;
  qualificationGoal: string | null;
  qualificationSchedule: string | null;
  qualificationPlanOfInterest: string | null;
  qualificationIntent: string | null;
  knowledgeQuestionsUsed: string[];
}

/** "Probar agente" (Paso 5) — no persiste nada en conversation/contact. Rol OWNER/ADMIN. */
export async function simulateAgent(turns: SimulatedTurn[]): Promise<SimulateAgentResult> {
  return apiFetch<SimulateAgentResult>('/api/agent/simulate', {
    method: 'POST',
    body: JSON.stringify({ turns }),
  });
}

/** Refleja KnowledgeEntryResponse (api-crmws, agent/presentation/KnowledgeEntryResponse.java). */
export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  return apiFetch<KnowledgeEntry[]>('/api/agent/knowledge-entries');
}

export async function createKnowledgeEntry(question: string, answer: string): Promise<KnowledgeEntry> {
  return apiFetch<KnowledgeEntry>('/api/agent/knowledge-entries', {
    method: 'POST',
    body: JSON.stringify({ question, answer }),
  });
}

export async function updateKnowledgeEntry(
  id: string,
  question: string,
  answer: string,
  active: boolean
): Promise<KnowledgeEntry> {
  return apiFetch<KnowledgeEntry>(`/api/agent/knowledge-entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ question, answer, active }),
  });
}
