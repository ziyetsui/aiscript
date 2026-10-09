import { expect, it } from 'vitest';
import { prepareChatNotes } from '../src/chat-notes.ts';
import { ScriptDoc } from '@scripter/core';
const emptyBible = () => new ScriptDoc().readBible();
it('uses cloud note resource ids and local note contents only for selected attachments',()=>{
 const bible=emptyBible();
 bible.files.push({id:'local-1',name:'笔记.md',title:'本地资料',excerpt:'正文证据',extract:'ready'} as typeof bible.files[number]);
 const r=prepareChatNotes([{source:'ancher',id:'cloud-1',title:'官网资料'},{source:'project',id:'local-1',title:'旧标题'},{source:'ancher',id:'cloud-1',title:'重复'}],bible);
 expect(r.attachments).toEqual([{type:'note',id:'cloud-1'}]);
 expect(r.reference).toContain('正文证据');expect(r.notes).toHaveLength(2);
});
it('rejects missing local notes instead of silently sending without their contents',()=>{
 expect(()=>prepareChatNotes([{source:'project',id:'missing',title:'丢失'}],emptyBible())).toThrow();
});
