import type { Api } from '../shared/ipc.ts';
declare global { interface Window { api: Api } }
export {};
