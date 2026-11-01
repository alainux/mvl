import * as de from './de.mjs';
import * as fr from './fr.mjs';
import * as es from './es.mjs';
export const languages=[de,fr,es];
export function linearize(tree,code){const l=languages.find(x=>x.profile.code===code);if(!l)throw new TypeError(`No adapter: ${code}`);return l.realize(tree);}
