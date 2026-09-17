export type { Contact, ContactFilters, ContactLifecycleStage, ContactStats } from './api';
export {
  searchContacts,
  getContactsByIds,
  changeLifecycleStage,
  updateContactProfile,
  mergeContacts,
  setFollowUpOptedOut,
  getContactStats,
  CONTACT_LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
  FOLLOW_UP_REASONS,
} from './api';
