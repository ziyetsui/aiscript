import { contextBridge, ipcRenderer } from 'electron';
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
  },
  ai: {
    write: call('ai:write') as Api['ai']['write'],
    cancel: call('ai:cancel') as Api['ai']['cancel'],
    onDelta(cb) {
      const h = (_e: Electron.IpcRendererEvent, d: { reqId: string; text: string }) => cb(d);
      ipcRenderer.on('ai:delta', h);
      return () => ipcRenderer.removeListener('ai:delta', h);
    },
  },
  exporter: { save: call('export:save') as Api['exporter']['save'] },
};

contextBridge.exposeInMainWorld('api', api);
