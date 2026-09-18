export type { Contact, ContactFilters, ContactLifecycleStage, ContactStats, FollowUpOptOut } from './api';
export {
  searchContacts,
  getContactsByIds,
  changeLifecycleStage,
  updateContactProfile,
  mergeContacts,
  setFollowUpOptedOut,
  listFollowUpOptOuts,
  getContactStats,
  CONTACT_LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
  FOLLOW_UP_REASONS,
} from './api';
