import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { Api } from '../shared/ipc.ts';

const call = (ch: string) => (...a: unknown[]) => ipcRenderer.invoke(ch, ...a);

const api: Api = {
  app: { info: call('app:info') as Api['app']['info'] },
  license: {
    status: call('license:status') as Api['license']['status'],
    activateKeygen: call('license:activateKeygen') as Api['license']['activateKeygen'],
    activateOffline: call('license:activateOffline') as Api['license']['activateOffline'],
    deactivate: call('license:deactivate') as Api['license']['deactivate'],
  },
  keys: {
    status: call('keys:status') as Api['keys']['status'],
    setAncher: call('keys:setAncher') as Api['keys']['setAncher'],
    setGemini: call('keys:setGemini') as Api['keys']['setGemini'],
    clear: call('keys:clear') as Api['keys']['clear'],
  },
  projects: {
    list: call('projects:list') as Api['projects']['list'],
    create: call('projects:create') as Api['projects']['create'],
    open: call('projects:open') as Api['projects']['open'],
    rename: call('projects:rename') as Api['projects']['rename'],
    remove: call('projects:remove') as Api['projects']['remove'],
    edit: call('projects:edit') as Api['projects']['edit'],
    undoTurn: call('projects:undoTurn') as Api['projects']['undoTurn'],
    setOutline: call('projects:setOutline') as Api['projects']['setOutline'],
  },
  ai: {
    write: call('ai:write') as Api['ai']['write'],
    cancel: call('ai:cancel') as Api['ai']['cancel'],
    resolve: call('ai:resolve') as Api['ai']['resolve'],
    onDelta(cb) {
      const h = (_e: Electron.IpcRendererEvent, d: { reqId: string; text: string }) => cb(d);
      ipcRenderer.on('ai:delta', h);
      return () => ipcRenderer.removeListener('ai:delta', h);
    },
  },
  workflows: {
    start: call('wf:start') as Api['workflows']['start'],
    cancel: call('wf:cancel') as Api['workflows']['cancel'],
    retry: call('wf:retry') as Api['workflows']['retry'],
    apply: call('wf:apply') as Api['workflows']['apply'],
    pickFile: call('wf:pickFile') as Api['workflows']['pickFile'],
    onUpdate(cb) {
      const h = (_e: Electron.IpcRendererEvent, d: { projectId: string; run: import('../shared/ipc.ts').RunState }) => cb(d);
      ipcRenderer.on('wf:update', h);
      return () => ipcRenderer.removeListener('wf:update', h);
    },
  },
  bible: {
    add: call('bible:add') as Api['bible']['add'],
    update: call('bible:update') as Api['bible']['update'],
    remove: call('bible:remove') as Api['bible']['remove'],
    move: call('bible:move') as Api['bible']['move'],
  },
  files: {
    pick: call('files:pick') as Api['files']['pick'],
    addPaths: call('files:addPaths') as Api['files']['addPaths'],
    open: call('files:open') as Api['files']['open'],
    pickImage: call('files:pickImage') as Api['files']['pickImage'],
    readImage: call('files:readImage') as Api['files']['readImage'],
    pathFor: (file: File) => webUtils.getPathForFile(file),
  },
  exporter: { save: call('export:save') as Api['exporter']['save'] },
};

contextBridge.exposeInMainWorld('api', api);
