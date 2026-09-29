import {it,expect} from 'vitest';
import {labelLines,measureText,footprint,labelSize,labelGeometry,visualFootprint} from '../src/graph/footprint';
it('wraps long mixed labels without splitting emoji or combining characters',()=>{
 const emoji='👩🏽‍💻',text=emoji.repeat(70),lines=labelLines(text);expect(lines).toHaveLength(2);expect(lines[1].endsWith('…')).toBe(true);for(const line of lines){expect(line.replaceAll(emoji,'').replace('…','')).toBe('');expect(measureText(line)).toBeLessThanOrEqual(190);}
 const mixed=labelLines('Заметка e\u0301 日本語 🧑‍🚀 — длинное обсуждение проекта и следующий шаг');expect(mixed).toHaveLength(2);expect(mixed.join('')).toContain('e\u0301');expect(labelLines(text)).toBe(lines);expect(footprint(text,30).halfWidth).toBeGreaterThan(30);
});
it('reserves the full state caption below one- and two-line titles at every detail scale',()=>{
 for(const state of ['now','paused','archived'])for(const zoom of [.6,1,1.5,3])for(const label of ['A','👩🏽‍💻 Длинный заголовок заметки со следующим шагом']){
  const text=labelGeometry(label,25,zoom,390,state),bounds=visualFootprint(label,25,zoom,390,state);
  expect(text.captionTop).toBeGreaterThan(text.top+text.lines.length*text.lineHeight);
  expect(text.captionSize*zoom).toBeGreaterThanOrEqual(10);
  expect(text.captionSize*zoom).toBeLessThanOrEqual(13);
  expect(bounds.bottom).toBeGreaterThan(text.captionTop+text.captionSize);
  expect(bounds.halfWidth).toBeGreaterThan(measureText(text.caption,text.captionSize)/2);
 }
});
it('keeps centered close-zoom labels within a narrow screen',()=>{
 for(const width of [320,390,1280])for(const zoom of [1,2,3]){
  const size=labelSize(zoom,width);
  expect(size*zoom).toBeLessThanOrEqual(22);
  for(const line of labelLines('👩🏽‍💻 Markdown on the map and a long title'))expect(measureText(line,size)*zoom).toBeLessThanOrEqual(width-32);
 }
});
