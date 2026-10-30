// Original 24 × 24 artwork. All UI icons share the same rounded stroke;
// editable category/chore emoji and data visualizations are intentionally separate.
const artwork={
 home:`<path fill="var(--home-fill)" stroke="none" d="M4.4 10.4 12.5 4l7.7 6.6v9.1H4.4Z"/><path fill="var(--home-door)" stroke="none" d="M10.4 14.2h4.2v6.1h-4.2z"/><path d="m2.8 10.4 9.2-7.3 9.2 7.3M5 9.3v11h14V9.3M10 20.3v-6.4h4v6.4"/>`,
 money:`<path fill="var(--category-money)" stroke="none" d="M4.2 11.2h10.3v8H4.2z"/><path d="M19 8V5.2a1.4 1.4 0 0 0-1.6-1.4L5.1 5.9A2.4 2.4 0 0 0 3 8.3v9.4A2.3 2.3 0 0 0 5.3 20H19a2 2 0 0 0 2-2V9.9A1.9 1.9 0 0 0 19.1 8H5.5"/><path fill="var(--surface)" d="M17.2 11h4v5h-4a2.5 2.5 0 0 1 0-5Z"/><path d="M17.8 13.5h.2"/>`,
 pets:`<path fill="var(--category-pet)" stroke="none" d="M9.4 11.9c1.5-2.1 4.4-2 5.8.2 1.1 1.7 3.4 2.8 3.2 5-.3 2.6-2.9 3-5.7 2.5-2.2-.4-4.3 1.1-5.8-.5-2.4-2.5.7-4.8 2.5-7.2Z"/><path d="M9.1 12.4c1.4-2.5 4.4-2.5 5.8 0 1.1 1.8 3.3 2.4 3.3 4.6 0 2.8-2.8 3.2-6.2 2.4-3.4.8-6.2.4-6.2-2.4 0-2.2 2.2-2.8 3.3-4.6Z"/><ellipse cx="8.7" cy="6.7" rx="1.9" ry="2.7"/><ellipse cx="15.3" cy="6.7" rx="1.9" ry="2.7"/><ellipse cx="3.8" cy="10.2" rx="1.6" ry="2.2" transform="rotate(-20 3.8 10.2)"/><ellipse cx="20.2" cy="10.2" rx="1.6" ry="2.2" transform="rotate(20 20.2 10.2)"/>`,
 chores:`<path fill="var(--category-chore)" stroke="none" d="m8.1 11.8 6.5 3.5-2.5 6-8.7-4.7Z"/><path d="m18.6 3.3-6.1 9.6M7.6 11.3l7.2 4-3 5.6-8.6-4.8 4.4-4.8ZM7.3 18.7l2.5-3.8m.8 5.6 1.8-3.8M20 10.3v4m-2-2h4"/>`,
 health:`<path fill="var(--category-health)" stroke="none" d="M4 12.5c3.3 1.8 6.7 1.8 9.2.1l2.3 1.5 4.3 1.5v2.3H3.3Z"/><path d="M3.2 6.1c2.3 2.2 4 3.2 6.8 2.5l2.2-2.1 3.4 6 4.1 1.5c1.2.4 1.6 1.3 1.6 2.5v3.3h-18V6.1ZM3.3 16.8h18M12.8 9.5l-2.2 1.1m3.8 1.1-2.1 1.1"/>`,
 more:`<circle cx="5" cy="12" r=".7"/><circle cx="12" cy="12" r=".7"/><circle cx="19" cy="12" r=".7"/>`,
 settings:`<path d="m9.3 3-.5 2.2-2 .9-2-.8-2.2 3.8L4.3 11v2l-1.7 1.9 2.2 3.8 2-.8 2 .9.5 2.2h5.4l.5-2.2 2-.9 2 .8 2.2-3.8-1.7-1.9v-2l1.7-1.9-2.2-3.8-2 .8-2-.9-.5-2.2Z"/><circle cx="12" cy="12" r="3.2"/>`,
 search:`<circle cx="10.4" cy="10.4" r="6.5"/><path d="m15.1 15.1 5.2 5.2"/>`,
 activity:`<path d="M4.2 8a8.4 8.4 0 1 1-.6 6.1M3.3 3.8V8h4.2M12 7.3V12l3 1.8"/>`,
 recurring:`<path d="M4.2 9a8.1 8.1 0 0 1 13.4-3l2.3 2.2M20 3.5v4.8h-4.8M19.8 15a8.1 8.1 0 0 1-13.4 3l-2.3-2.2M4 20.5v-4.8h4.8"/>`,
 add:`<path d="M12 4.5v15M4.5 12h15"/>`,
 info:`<circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v6m0-9.5v.2"/>`,
 back:`<path d="m10.5 5-7 7 7 7M4 12h16"/>`,
 next:`<path d="m13.5 5 7 7-7 7M20 12H4"/>`,
 close:`<path d="m6 6 12 12M18 6 6 18"/>`,
 edit:`<path d="m14.8 4.8 4.4 4.4M4 20l1-5.3L15.5 4.2a2.4 2.4 0 0 1 3.4 0l.9.9a2.4 2.4 0 0 1 0 3.4L9.3 19Z"/>`,
 check:`<path d="m5 12 4.5 4.5L19 7"/>`,
 sparkle:`<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>`,
 pin:`<path d="m13 3 7 7-3 1.5-3.5 5-2.5-2.5-6 6m3.5-8.5L6 9l5-3.5L13 3Z"/>`,
 calculator:`<rect x="5" y="2.8" width="14" height="18.4" rx="2.3"/><path d="M8 6.5h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 3h1m6 0h1"/>`
};
const colorful=new Set(['home','money','pets','chores','health']);
export const iconNames=Object.freeze(Object.keys(artwork));
export function icon(name){if(!Object.hasOwn(artwork,name))return '';return `<svg class="app-icon icon-${name} ${colorful.has(name)?'icon-color':'icon-tool'}" data-icon="${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colorful.has(name)?'var(--icon-ink)':'currentColor'}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${artwork[name]}</svg>`;}
export function categoryIcon(category){return icon(({money:'money',pet:'pets',chore:'chores',health:'health'})[category]);}

const illustrations={
 plant:`<ellipse cx="89" cy="96" rx="40" ry="3" fill="var(--home-fill)" stroke="none"/><path fill="var(--category-chore)" stroke="none" d="M90 59c-2-22-24-35-34-31 1 20 14 30 34 31Zm1-12c0-21 17-33 30-30 0 17-10 29-30 30Z"/><path d="M89 70V42m0 16L63 34m27 14 23-23"/><path fill="var(--home-door)" d="m67 67 6 24c1 4 31 4 33 0l6-24Z"/><path d="M63 66h53m-45 12h37"/>`,
 wallet:`<ellipse cx="90" cy="93" rx="51" ry="3" fill="var(--home-fill)" stroke="none"/><path fill="var(--category-money)" stroke="none" d="M48 44h88v43H48Z"/><path d="M130 45V29c0-3-3-5-6-4L54 37c-5 1-9 5-9 10v36c0 5 4 8 8 8h78c5 0 8-3 8-8V50c0-3-3-5-6-5H55"/><path fill="var(--surface)" d="M123 58h16v18h-16a9 9 0 0 1 0-18Z"/><path d="M125 67h1m-61-41 4-8m70 17 8-4"/>`,
 shoes:`<ellipse cx="90" cy="96" rx="62" ry="3" fill="var(--home-fill)" stroke="none"/><path fill="var(--category-health)" fill-opacity=".55" d="M42 27c10 8 18 11 30 8l8-8 12 22 17 6c5 2 7 6 7 12v9H40V27Z"/><path d="M40 27c10 8 18 11 30 8l8-8 12 22 17 6c5 2 7 6 7 12v9H40V27Zm0 38h76M81 39l-10 5m16 3-9 4"/><path fill="var(--category-health)" fill-opacity=".4" d="M66 49c10 8 18 11 30 8l8-8 12 22 17 6c5 2 7 6 7 12v7H64V49Z"/><path d="M64 49c10 8 18 11 30 8l8-8 12 22 17 6c5 2 7 6 7 12v7H64V49Zm0 36h76m-35-24-10 5m16 3-9 4"/>`,
 tea:`<ellipse cx="87" cy="95" rx="48" ry="3" fill="var(--home-fill)" stroke="none"/><path fill="var(--accent-soft)" stroke="none" d="M55 49h62v26c0 12-11 19-31 19S55 87 55 75Z"/><path d="M53 46h64v28c0 14-12 20-32 20S53 88 53 74V46Zm65 8h8c18 0 17 25-8 25M44 94h84M76 35c-9-9 9-13 0-23m20 23c-9-9 9-13 0-23"/>`,
 cats:`<ellipse cx="90" cy="97" rx="76" ry="4" fill="var(--home-fill)" stroke="none"/>
 <path fill="var(--cat-charcoal)" d="M16 78c-3-24 20-46 45-38 20 6 36 25 28 43-6 16-61 21-73-5Z"/><path d="M40 82c-22 1-23-26-6-32m16 42c-17-12-5-28 9-26"/><path fill="var(--cat-charcoal)" d="m25 50-1-18 18 8c8-3 17-1 22 5l15-3-6 19c-2 19-43 20-48-11Z"/><path d="m35 56 5 3 5-2m11 4 5 1 4-3m-17 6 2 2 2-2"/>
 <path fill="var(--surface)" d="M61 80c0-21 22-34 43-28 22 6 29 27 18 37-11 12-57 10-61-9Z"/><path fill="var(--cat-orange)" stroke="none" d="M88 53c12-3 25 3 31 12-10 7-18 5-24 0Z"/><path fill="var(--cat-calico)" stroke="none" d="M64 73c7-8 15-9 23-4l-6 17-15 1Z"/><path d="M87 87c-12-9-2-19 8-13"/><path fill="var(--surface)" d="m65 62 3-17 14 10c7-2 15 0 21 5l13-2-6 17c-7 15-45 8-45-13Z"/><path fill="var(--cat-orange)" stroke="none" d="m67 59 3-11 12 9-3 12-12-1Z"/><path fill="var(--cat-calico)" stroke="none" d="m97 60 15-1-4 12-11-4Z"/><path d="m75 69 5 3 5-2m10 3 5 1 4-3m-17 6 2 2 2-2"/>
 <path fill="var(--surface)" d="M111 82c-2-18 14-32 31-28 19 4 29 24 20 34-10 11-45 8-51-6Z"/><path stroke="var(--cat-tabby)" stroke-width="4" d="m132 55-1 9m10-7-2 9m14-2-5 7m7 6-7 2"/><path d="M132 88c-12-7-6-16 4-15"/><path fill="var(--surface)" d="m111 66 1-15 14 8c5-2 13 0 17 3l12-2-6 15c-4 13-35 11-38-9Z"/><path stroke="var(--cat-tabby)" stroke-width="3" d="m126 60-1 7m7-6-1 6m8-4-2 6"/><path d="m118 73 4 2 4-2m9 3 4 1 4-3m-16 5 2 2 2-2"/>`,
 'cat-head':`<path fill="var(--surface)" d="m42 48 3-27 29 16c11-4 25-3 37 1l27-16 2 29c18 38-12 48-48 48-37 0-64-15-50-51Z"/><path fill="var(--cat-orange)" stroke="none" d="m46 46 2-20 27 15-8 23-20-2Z"/><path fill="var(--cat-calico)" stroke="none" d="m113 42 21-15 2 24-18 9Z"/><path d="m60 66 10 5 10-4m23 1 10 4 10-6m-37 13 6 4 6-4m-6 4v6m-30-5-19-3m20 10-16 3m71-10 18-3m-19 10 17 3"/>`
};
export const illustrationNames=Object.freeze(Object.keys(illustrations));
export function illustration(name){if(!Object.hasOwn(illustrations,name))return '';return `<svg class="empty-illustration illustration-${name}" data-illustration="${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110" fill="none" stroke="var(--tea)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${illustrations[name]}</svg>`;}
