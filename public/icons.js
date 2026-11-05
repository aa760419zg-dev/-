// Original 24 × 24 artwork. All UI icons share the same rounded stroke;
// editable category/chore emoji and data visualizations are intentionally separate.
const artwork={
 "place-food":`<path d="M7 3v7m-3-7v4c0 4 6 4 6 0V3M7 11v10M18 21V3c-4 2-5 8 0 8"/>`,
 "place-coffee":`<path d="M4 7h12v8a5 5 0 0 1-10 0V7Zm12 1h2a3 3 0 0 1 0 6h-2M3 21h16M8 3v1m4-1v1"/>`,
 "place-cake":`<path d="M4 12h16v9H4zM4 15c2-3 4 3 6 0s4 3 6 0 4 0 4 0M12 12V6m0-4c3 3-3 3 0 0Z"/>`,
 "place-snack":`<path d="M3 12h18c-1 7-4 9-9 9s-8-2-9-9ZM6 6h12M8 3v6m4-6v6m4-6v6"/>`,
 "place-bar":`<path d="m4 3 8 10 8-10H4ZM12 13v8m-4 0h8M7 7h10"/>`,
 "place-view":`<path d="m2 20 7-13 5 8 3-5 5 10H2ZM7 11l2 2 2-2M16 4h3"/>`,
 "place-trail":`<path d="M14 5a2 2 0 1 0 0-.1M13 8l-3 6 4 2 1 5M10 14l-5 7m7-11 4 3 4-1M7 10l-2 4m15-1v8"/>`,
 "place-art":`<path d="M3 4h18v16H3zM7 16l4-5 4 3 3-4m-9-3h.1"/>`,
 "place-shopping":`<path d="M5 8h14l2 13H3L5 8ZM8 8V6a4 4 0 0 1 8 0v2"/>`,
 "place-stay":`<path d="M3 21V5m0 11h18v5M4 10h5v6m0-7h10a2 2 0 0 1 2 2v5M6 8h.1"/>`,

 places:`<path fill="var(--category-pet)" stroke="none" d="M6 9a6 6 0 0 1 12 0c0 4-6 10-6 10S6 13 6 9Z"/><path d="M12 22S4.5 14.5 4.5 8.8a7.5 7.5 0 0 1 15 0C19.5 14.5 12 22 12 22Z"/><circle cx="12" cy="8.5" r="2.5"/>`,
 mahjong:`<rect x="5.5" y="3.5" width="14" height="18" rx="3" fill="var(--category-mahjong)" stroke="none"/><rect x="4.5" y="2.5" width="14" height="18" rx="3"/><path fill="var(--primary)" stroke="none" d="M7.29 8.6C7.6 8.78 7.97 9.03 8.25 9.24C7.7 9.58 7.11 9.86 6.5 10.04C6.71 10.26 7.01 10.69 7.17 10.96C7.42 10.87 7.66 10.77 7.9 10.65V10.73H9.64V11.46H7.7C7.57 12.31 7.34 13.36 7.15 14.07L8.16 14.22L8.23 13.97H9.58C9.51 14.78 9.42 15.14 9.29 15.27C9.18 15.35 9.07 15.36 8.89 15.36C8.67 15.36 8.14 15.35 7.62 15.31C7.81 15.59 7.96 16.04 7.98 16.37C8.54 16.39 9.08 16.38 9.38 16.36C9.75 16.33 10 16.25 10.22 16C10.5 15.71 10.63 15.02 10.74 13.5C10.76 13.35 10.77 13.06 10.77 13.06H8.43L8.56 12.39H9.64V12.52H10.75V12.07C10.98 12.25 11.29 12.57 11.4 12.74C12.27 12.19 12.52 11.4 12.56 10.66H13.49V11.27C13.49 11.86 13.57 12.07 13.75 12.24C13.9 12.4 14.2 12.47 14.44 12.47C14.58 12.47 14.81 12.47 14.97 12.47C15.13 12.47 15.36 12.44 15.48 12.4C15.66 12.34 15.79 12.24 15.87 12.11C15.95 11.98 16 11.7 16.03 11.43C15.74 11.33 15.34 11.13 15.15 10.97C15.14 11.19 15.13 11.36 15.11 11.44C15.09 11.52 15.04 11.55 15.01 11.57C14.98 11.58 14.93 11.58 14.88 11.58C14.82 11.58 14.74 11.58 14.7 11.58C14.64 11.58 14.6 11.57 14.58 11.54C14.56 11.51 14.55 11.42 14.55 11.29V10.32C14.93 10.52 15.33 10.68 15.75 10.82C15.91 10.53 16.24 10.07 16.5 9.84C15.98 9.7 15.48 9.51 15.03 9.27C15.42 9.01 15.86 8.67 16.24 8.33L15.33 7.7C15.04 8.01 14.59 8.44 14.2 8.76C14 8.61 13.81 8.45 13.63 8.29C14.02 8 14.47 7.65 14.89 7.28L13.98 6.65C13.75 6.93 13.37 7.31 13.02 7.6C12.77 7.28 12.57 6.95 12.41 6.58L11.4 6.87C11.91 8.02 12.65 8.99 13.59 9.71H11.52V10.45C11.52 10.92 11.42 11.45 10.75 11.88V9.77H9.39C10.24 9.13 10.94 8.31 11.37 7.28L10.59 6.9L10.4 6.95H7.63V7.93H9.71C9.54 8.17 9.33 8.39 9.1 8.6C8.79 8.37 8.34 8.12 8 7.94ZM14.03 13.62C13.83 13.92 13.59 14.19 13.31 14.42C12.98 14.18 12.72 13.92 12.52 13.62ZM11.2 12.77V13.62H12.16L11.53 13.79C11.76 14.24 12.05 14.63 12.41 14.98C11.87 15.23 11.25 15.41 10.58 15.51C10.78 15.74 11.01 16.15 11.12 16.42C11.92 16.25 12.65 16 13.27 15.65C13.87 16.01 14.56 16.26 15.37 16.42C15.53 16.11 15.84 15.65 16.09 15.41C15.4 15.32 14.78 15.16 14.26 14.95C14.79 14.43 15.2 13.79 15.46 12.98L14.78 12.74L14.58 12.77Z"/>`,
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
const colorful=new Set(['home','money','pets','chores','health','mahjong','places']);
export const iconNames=Object.freeze(Object.keys(artwork));
export function icon(name){if(!Object.hasOwn(artwork,name))return '';return `<svg class="app-icon icon-${name} ${colorful.has(name)?'icon-color':'icon-tool'}" data-icon="${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colorful.has(name)?'var(--icon-ink)':'currentColor'}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${artwork[name]}</svg>`;}
export function categoryIcon(category){return icon(({money:'money',pet:'pets',chore:'chores',health:'health',mahjong:'mahjong',places:'places'})[category]);}

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

export function placeTypeIcon(type){return icon(({餐廳:"place-food",咖啡廳:"place-coffee",甜點:"place-cake",小吃:"place-snack",酒吧:"place-bar",景點:"place-view",步道:"place-trail",展覽:"place-art",購物:"place-shopping",住宿:"place-stay"})[type]);}
