// The one contract between renderer and main (spec 0002 §4.1: typed IPC, no localhost port).
import type { PreviewItem } from '@scripter/core';
import type { RunState, WorkflowId, WorkflowInput } from '@scripter/agent';
import type { Bible, BibleItem, BibleKind, ElementType, ScriptNode, SceneSummary } from '@scripter/core/script';

export type LicenseStatus =
  | { state: 'active'; via: 'keygen' | 'offline'; customer?: string; seat?: string; expiresAt?: string | null; machineCode: string }
  | { state: 'inactive'; reason?: string; machineCode: string; keygenConfigured: boolean };

export type ActivateResult = { ok: true } | { ok: false; message: string };
export interface KeyStatus { ancher: boolean; gemini: boolean; ancherAccount?: string; encryption: boolean }
export type KeyResult = { ok: true; account?: string } | { ok: false; message: string };

export interface ProjectMeta { id: string; title: string; kind: 'script' | 'video'; createdAt: number; updatedAt: number; words: number }
export interface TurnInfo { id: string; label: string; undone: boolean }
/** One entry in the project's AI conversation, persisted with the project. */
export interface ChatMsg {
  id: string;
  role: 'user' | 'ai';
  text: string;
  at: number;
  turnId?: string;
  applied?: number;
  error?: string;
  citations?: { url: string; title: string }[];
  /** A workflow run shown in the conversation. */
  runId?: string;
  /** A rewrite waiting for the writer's decision (modification preview). */
  preview?: { items: PreviewItem[]; state: 'open' | 'accepted' | 'rejected' | 'stale' };
}
export interface ProjectState { meta: ProjectMeta; nodes: ScriptNode[]; scenes: SceneSummary[]; turns: TurnInfo[]; bible: Bible; chat: ChatMsg[]; runs: RunState[]; outline: string }
export type WorkflowAction =
  | { type: 'direction'; index: number }
  | { type: 'preview' }
  | { type: 'joke'; index: number; verdict?: 'good' | 'bad' }
  | { type: 'rules'; indexes: number[] }
  | { type: 'topics'; indexes: number[] };
export type { RunState, WorkflowId, WorkflowInput };
export interface AddFilesResult { state: ProjectState; added: number; skipped: string[] }

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
  /** Set when the reply is a modification preview waiting for the writer. */
  previewId?: string;
}
export type UpdateStatus = { state: 'idle' | 'checking' | 'none' | 'downloading' | 'ready' | 'error'; version?: string; percent?: number; message?: string };
export type ExportFormat = 'pdf' | 'docx' | 'fdx' | 'fountain' | 'txt';

export interface Api {
  app: { info(): Promise<{ version: string; platform: string }>; diagnostics(): Promise<{ ok: boolean; path?: string }> };
  update: {
    status(): Promise<UpdateStatus>;
    check(): Promise<void>;
    install(): Promise<void>;
    onStatus(cb: (s: UpdateStatus) => void): () => void;
  };
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
    setOutline(id: string, text: string): Promise<ProjectState>;
    exportArchive(id: string): Promise<{ ok: boolean; path?: string }>;
    importArchive(): Promise<ProjectMeta | null>;
  };
  workflows: {
    start(projectId: string, wf: WorkflowId, input: WorkflowInput): Promise<ProjectState>;
    cancel(runId: string, projectId?: string): Promise<void>;
    retry(projectId: string, runId: string): Promise<ProjectState>;
    confirm(projectId: string, runId: string, text: string): Promise<ProjectState>;
    apply(projectId: string, runId: string, action: WorkflowAction): Promise<{ ok: boolean; message: string; state: ProjectState }>;
    pickFile(kind: 'media' | 'any'): Promise<string | null>;
    onUpdate(cb: (e: { projectId: string; run: RunState }) => void): () => void;
  };
  bible: {
    add<K extends BibleKind>(id: string, kind: K, data: Partial<BibleItem<K>>): Promise<ProjectState>;
    update<K extends BibleKind>(id: string, kind: K, itemId: string, patch: Partial<BibleItem<K>>): Promise<ProjectState>;
    remove(id: string, kind: BibleKind, itemId: string): Promise<ProjectState>;
    move(id: string, kind: BibleKind, itemId: string, to: number): Promise<ProjectState>;
  };
  files: {
    pick(id: string): Promise<AddFilesResult | null>;
    addPaths(id: string, paths: string[]): Promise<AddFilesResult>;
    open(id: string, fileId: string): Promise<string>;
    pickImage(id: string): Promise<string | null>;
    readImage(id: string, file: string): Promise<string | null>;
    /** Absolute path of a File dropped onto the window (Electron webUtils). */
    pathFor(file: File): string;
  };
  ai: {
    write(req: AiWriteRequest): Promise<AiWriteResult>;
    cancel(reqId: string): Promise<void>;
    /** Accept or reject a pending modification preview. */
    resolve(projectId: string, msgId: string, accept: boolean): Promise<{ ok: boolean; message?: string; turn?: TurnInfo; state: ProjectState }>;
    onDelta(cb: (e: { reqId: string; text: string }) => void): () => void;
  };
  exporter: { save(id: string, format: ExportFormat): Promise<{ ok: boolean; path?: string; message?: string }> };
}
