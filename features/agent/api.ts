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
