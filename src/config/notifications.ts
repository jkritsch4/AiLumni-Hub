export type NotificationQuestion = {
  key: string;
  title: string;
  description: string;
  default?: boolean;
};

// Shared source of truth for onboarding + preferences.
// Import this in Onboarding later so both places stay in sync.
export const notificationQuestions: NotificationQuestion[] = [
  {
    key: 'gameReminders',
    title: 'Game Reminders',
    description: 'Instant reminders the morning of each game',
    default: true,
  },
  {
    key: 'standingsUpdates',
    title: 'Standings Updates',
    description: 'Weekly conference standings updates',
    default: true,
  },
  {
    key: 'gameResults',
    title: 'Game Results',
    description: 'Receive notifications for game results',
    default: true,
 
  },
  // If your onboarding includes a numeric reminder time, keep the key to drive the field in Preferences
  // In Preferences we render this as a separate input; keep here to preserve linkage.
  // Using default as boolean is fine; actual number is handled via reminderHours in the component.
];