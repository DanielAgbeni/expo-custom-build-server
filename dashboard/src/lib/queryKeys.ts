export const queryKeys = {
  builds: {
    all: ['builds'] as const,
    one: (id: string) => ['builds', id] as const,
    logs: (id: string) => ['builds', id, 'logs'] as const,
  },
  admin: {
    users: ['admin', 'users'] as const,
    builds: ['admin', 'builds'] as const,
    monitor: ['admin', 'monitor'] as const,
  },
}
