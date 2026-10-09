import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { Api } from '../shared/ipc.ts';

const call = (ch: string) => (...a: unknown[]) => ipcRenderer.invoke(ch, ...a);

const api: Api = {
  app: { info: call('app:info') as Api['app']['info'], diagnostics: call('app:diagnostics') as Api['app']['diagnostics'], getTheme: call('app:getTheme') as Api['app']['getTheme'], setTheme: call('app:setTheme') as Api['app']['setTheme'] },
  localData: { info: call('data:info') as Api['localData']['info'], backup: call('data:backup') as Api['localData']['backup'], recover: call('data:recover') as Api['localData']['recover'], showFolder: call('data:showFolder') as Api['localData']['showFolder'] },
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
    trashList: call('projects:trashList') as Api['projects']['trashList'],
    restore: call('projects:restore') as Api['projects']['restore'],
    purge: call('projects:purge') as Api['projects']['purge'],
    list: call('projects:list') as Api['projects']['list'],
    create: call('projects:create') as Api['projects']['create'],
    open: call('projects:open') as Api['projects']['open'],
    rename: call('projects:rename') as Api['projects']['rename'],
    episode: call('projects:episode') as Api['projects']['episode'],
    remove: call('projects:remove') as Api['projects']['remove'],
    edit: call('projects:edit') as Api['projects']['edit'],
    undoTurn: call('projects:undoTurn') as Api['projects']['undoTurn'],
    setOutline: call('projects:setOutline') as Api['projects']['setOutline'],
    setCover: call('projects:setCover') as Api['projects']['setCover'],
    setBeats: call('projects:setBeats') as Api['projects']['setBeats'],
    setProduction: call('projects:setProduction') as Api['projects']['setProduction'],
    exportArchive: call('projects:exportArchive') as Api['projects']['exportArchive'],
    importArchive: call('projects:importArchive') as Api['projects']['importArchive'],
  },
  ai: {
    status: call('ai:status') as Api['ai']['status'],
    write: call('ai:write') as Api['ai']['write'],
    cancel: call('ai:cancel') as Api['ai']['cancel'],
    resolve: call('ai:resolve') as Api['ai']['resolve'],
    reverse: call('ai:reverse') as Api['ai']['reverse'],
    summarizeNote: call('ai:summarizeNote') as Api['ai']['summarizeNote'],
    scenePrompt: call('ai:scenePrompt') as Api['ai']['scenePrompt'],
    selection: call('ai:selection') as Api['ai']['selection'],
    onDelta(cb) {
      const h = (_e: Electron.IpcRendererEvent, d: { reqId: string; text: string }) => cb(d);
      ipcRenderer.on('ai:delta', h);
      return () => ipcRenderer.removeListener('ai:delta', h);
    },
    onActivity(cb) {
      const h = (_e: Electron.IpcRendererEvent, d: Parameters<Parameters<Api['ai']['onActivity']>[0]>[0]) => cb(d);
      ipcRenderer.on('ai:activity', h);
      return () => ipcRenderer.removeListener('ai:activity', h);
    },
  },
  workflows: {
    start: call('wf:start') as Api['workflows']['start'],
    cancel: call('wf:cancel') as Api['workflows']['cancel'],
    retry: call('wf:retry') as Api['workflows']['retry'],
    confirm: call('wf:confirm') as Api['workflows']['confirm'],
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
  ancherNotes: {
    create: call('ancherNotes:create') as Api['ancherNotes']['create'],
    list: call('ancherNotes:list') as Api['ancherNotes']['list'],
    read: call('ancherNotes:read') as Api['ancherNotes']['read'],
    import: call('ancherNotes:import') as Api['ancherNotes']['import'],
  },
  files: {
    collection: call('files:collection') as Api['files']['collection'],
    exportNote: call('files:exportNote') as Api['files']['exportNote'],
    update: call('files:update') as Api['files']['update'],
    createNote: call('files:createNote') as Api['files']['createNote'],
    readBody: call('files:readBody') as Api['files']['readBody'],
    saveBody: call('files:saveBody') as Api['files']['saveBody'],
    pick: call('files:pick') as Api['files']['pick'],
    addPaths: call('files:addPaths') as Api['files']['addPaths'],
    open: call('files:open') as Api['files']['open'],
    pickImage: call('files:pickImage') as Api['files']['pickImage'],
    readImage: call('files:readImage') as Api['files']['readImage'],
    pin: call('files:pin') as Api['files']['pin'],
    onProjectChanged(cb) {
      const h = (_e: Electron.IpcRendererEvent, d: { projectId: string }) => cb(d);
      ipcRenderer.on('project:changed', h);
      return () => ipcRenderer.removeListener('project:changed', h);
    },
    pathFor: (file: File) => webUtils.getPathForFile(file),
  },
  update: {
    status: call('update:status') as Api['update']['status'],
    check: call('update:check') as Api['update']['check'],
    install: call('update:install') as Api['update']['install'],
    onStatus(cb) {
      const h = (_e: Electron.IpcRendererEvent, s: import('../shared/ipc.ts').UpdateStatus) => cb(s);
      ipcRenderer.on('update:status', h);
      return () => ipcRenderer.removeListener('update:status', h);
    },
  },
  chat: {
    newConversation: call('chat:new') as Api['chat']['newConversation'],
    openConversation: call('chat:open') as Api['chat']['openConversation'],
    react: call('chat:react') as Api['chat']['react'],
    saveAsNote: call('chat:saveNote') as Api['chat']['saveAsNote'],
  },
  exporter: { save: call('export:save') as Api['exporter']['save'] },
};

contextBridge.exposeInMainWorld('api', api);
