// The one contract between renderer and main (spec 0002 §4.1: typed IPC, no localhost port).
import type { ElementType, ScriptNode, SceneSummary } from '@scripter/core';

export type LicenseStatus =
  | { state: 'active'; via: 'keygen' | 'offline'; customer?: string; seat?: string; expiresAt?: string | null; machineCode: string }
  | { state: 'inactive'; reason?: string; machineCode: string; keygenConfigured: boolean };

export type ActivateResult = { ok: true } | { ok: false; message: string };
export interface KeyStatus { ancher: boolean; gemini: boolean; ancherAccount?: string; encryption: boolean }
export type KeyResult = { ok: true; account?: string } | { ok: false; message: string };

export interface ProjectMeta { id: string; title: string; kind: 'script' | 'video'; createdAt: number; updatedAt: number; words: number }
export interface TurnInfo { id: string; label: string; undone: boolean }
export interface ProjectState { meta: ProjectMeta; nodes: ScriptNode[]; scenes: SceneSummary[]; turns: TurnInfo[] }

export type Edit =
  | { op: 'insert'; after: string | null | 'end'; type: ElementType; text: string; id?: string }
  | { op: 'text'; id: string; text: string }
  | { op: 'type'; id: string; type: ElementType }
  | { op: 'remove'; id: string };

export interface AiWriteRequest { reqId: string; projectId: string; instruction: string; webSearch: boolean; focusId?: string }
export interface AiWriteResult {
  ok: boolean;
  narration: string;
  turn?: TurnInfo;
  applied: number;
  errors: string[];
  citations: { url: string; title: string }[];
  cancelled?: boolean;
  message?: string;
}
export type ExportFormat = 'pdf' | 'fdx' | 'fountain' | 'txt';

export interface Api {
  app: { info(): Promise<{ version: string; platform: string }> };
  license: {
    status(): Promise<LicenseStatus>;
    activateKeygen(key: string): Promise<ActivateResult>;
    activateOffline(code: string): Promise<ActivateResult>;
    deactivate(): Promise<void>;
  };
  keys: {
    status(): Promise<KeyStatus>;
    setAncher(key: string): Promise<KeyResult>;
    setGemini(key: string): Promise<KeyResult>;
    clear(which: 'ancher' | 'gemini'): Promise<void>;
  };
  projects: {
    list(): Promise<ProjectMeta[]>;
    create(title: string, kind: ProjectMeta['kind']): Promise<ProjectMeta>;
    open(id: string): Promise<ProjectState>;
    rename(id: string, title: string): Promise<ProjectState>;
    remove(id: string): Promise<void>;
    edit(id: string, edits: Edit[]): Promise<ProjectState>;
    undoTurn(id: string, turnId: string): Promise<ProjectState>;
  };
  ai: {
    write(req: AiWriteRequest): Promise<AiWriteResult>;
    cancel(reqId: string): Promise<void>;
    onDelta(cb: (e: { reqId: string; text: string }) => void): () => void;
  };
  exporter: { save(id: string, format: ExportFormat): Promise<{ ok: boolean; path?: string; message?: string }> };
}
