import { useCallback, useEffect, useState } from 'react';
import type { BibleItem, BibleKind } from '@scripter/core/script';
import type { ProjectState } from '../../../shared/ipc.ts';

/** Loads a project and exposes bible mutations that return the fresh state. */
export function useProject(id: string) {
  const [st, setSt] = useState<ProjectState | null>(null);
  useEffect(() => { void window.api.projects.open(id).then(setSt); }, [id]);
  const run = useCallback(async (p: Promise<ProjectState>) => { const s = await p; setSt(s); return s; }, []);
  const api = {
    add: <K extends BibleKind>(kind: K, data: Partial<BibleItem<K>>) => run(window.api.bible.add(id, kind, data)),
    update: <K extends BibleKind>(kind: K, itemId: string, patch: Partial<BibleItem<K>>) => run(window.api.bible.update(id, kind, itemId, patch)),
    remove: (kind: BibleKind, itemId: string) => run(window.api.bible.remove(id, kind, itemId)),
    move: (kind: BibleKind, itemId: string, to: number) => run(window.api.bible.move(id, kind, itemId, to)),
  };
  return { st, setSt, ...api };
}

/** Load a project image (stored file name) as a data URL. */
export function useImage(projectId: string, file: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!file) { setUrl(null); return; }
    void window.api.files.readImage(projectId, file).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [projectId, file]);
  return url;
}

export const PALETTE: [string, string][] = [
  ['赛车绿', 'oklch(0.36 0.07 160)'], ['砖红', 'oklch(0.55 0.15 35)'], ['琥珀', 'oklch(0.75 0.14 75)'],
  ['靛蓝', 'oklch(0.42 0.12 265)'], ['锈橙', 'oklch(0.58 0.14 45)'], ['石灰', 'oklch(0.62 0.02 90)'], ['藕粉', 'oklch(0.76 0.07 10)'],
];
