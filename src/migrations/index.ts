import * as migration_20260802_094413_initial from './20260802_094413_initial';

export const migrations = [
  {
    up: migration_20260802_094413_initial.up,
    down: migration_20260802_094413_initial.down,
    name: '20260802_094413_initial'
  },
];
