// App version management for PWA updates
export const APP_VERSION = 'v1.2.0';
export const CACHE_VERSION = 'ai-gym-tracker-v3'; // Update this to trigger PWA updates

// Version changelog for display in settings or about page
export const VERSION_HISTORY = [
  {
    version: 'v1.2.0',
    date: '2025-01-15',
    changes: [
      'Added export functionality for custom exercises',
      'Added exercise promotion system',
      'Enhanced PWA update notifications',
      'Improved dropdown menu components',
    ],
  },
  {
    version: 'v1.1.0', 
    date: '2025-01-14',
    changes: [
      'Enhanced PWA capabilities with install prompts',
      'Added manifest shortcuts and app icons',
      'Improved service worker caching strategy',
      'Fixed Next.js 15 favicon conflicts',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025-01-10', 
    changes: [
      'Initial release with workout tracking',
      'Exercise library and custom exercises',
      'Workout templates and sharing',
      'Progress analytics and history',
    ],
  },
];

// Check if cache needs updating
export function shouldUpdateCache(): boolean {
  if (typeof window === 'undefined') return false;
  
  const storedVersion = localStorage.getItem('app-cache-version');
  if (storedVersion !== CACHE_VERSION) {
    localStorage.setItem('app-cache-version', CACHE_VERSION);
    return true;
  }
  return false;
}

// Get current app version
export function getCurrentVersion(): string {
  return APP_VERSION;
}