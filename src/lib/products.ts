// Starting catalogue, copied into the database on first start (src/server/catalog.server.ts).
// The live catalogue comes from the server; see src/components/store/store-provider.tsx.
export type Product = { slug: string; group: string; name: string; amount: string; price: number; category: string; description: string; badge?: string; batch?: string; coaUrl?: string };
export const products: Product[] = [
  {slug:'retatrutide-10',group:'retatrutide',name:'Retatrutide',amount:'10 mg',price:899,category:'Peptider',description:'Peptid för studier inom metabol forskning.',badge:'POPULÄR',batch:'201465',coaUrl:'https://polypeptide.io/tests/201465-Retatrutide_10mg'},
  {slug:'retatrutide-15',group:'retatrutide',name:'Retatrutide',amount:'15 mg',price:1199,category:'Peptider',description:'Peptid för studier inom metabol forskning.',batch:'204643',coaUrl:'https://polypeptide.io/tests/204643-Retatrutide_15mg'},
  {slug:'retatrutide-20',group:'retatrutide',name:'Retatrutide',amount:'20 mg',price:1499,category:'Peptider',description:'Peptid för studier inom metabol forskning.',batch:'201565',coaUrl:'https://polypeptide.io/tests/201565-Retatrutide_20mg'},
  {slug:'retatrutide-30',group:'retatrutide',name:'Retatrutide',amount:'30 mg',price:2099,category:'Peptider',description:'Peptid för studier inom metabol forskning.',batch:'201265',coaUrl:'https://polypeptide.io/tests/201265-Retatrutide_30mg'},
  {slug:'retatrutide-60',group:'retatrutide',name:'Retatrutide',amount:'60 mg',price:3799,category:'Peptider',description:'Peptid för studier inom metabol forskning.',batch:'201435',coaUrl:'https://polypeptide.io/tests/201435-Retatrutide_60mg'},
  {slug:'ghk-cu-50',group:'ghk-cu',name:'GHK-Cu',amount:'50 mg',price:399,category:'Peptider',description:'Koppartripeptid för forskning inom hudbiologi.',badge:'UTVALD',batch:'202455',coaUrl:'https://polypeptide.io/tests/202455-GHK-Cu_50mg'},
  {slug:'ghk-cu-100',group:'ghk-cu',name:'GHK-Cu',amount:'100 mg',price:699,category:'Peptider',description:'Koppartripeptid för forskning inom hudbiologi.',batch:'212399',coaUrl:'https://polypeptide.io/tests/212399-GHK-Cu_100mg'},
  {slug:'mots-c-40',group:'mots-c',name:'MOTS-C',amount:'40 mg',price:649,category:'Peptider',description:'Mitokondriell peptid för metabol forskning.',batch:'226949',coaUrl:'https://polypeptide.io/tests/226949-MOTS-C_40mg'},
  {slug:'bpc-157-10',group:'bpc-157',name:'BPC-157',amount:'10 mg',price:399,category:'Peptider',description:'Pentadekapeptid för laboratoriestudier.',batch:'626895',coaUrl:'https://polypeptide.io/tests/626895-BPC-157_10mg'},
  {slug:'bpc-157-20',group:'bpc-157',name:'BPC-157',amount:'20 mg',price:649,category:'Peptider',description:'Pentadekapeptid för laboratoriestudier.',batch:'626665',coaUrl:'https://polypeptide.io/tests/626665-BPC-157_20mg'},
  {slug:'bpc-157-tb-500-20',group:'bpc-157-tb-500',name:'BPC-157 + TB-500',amount:'20 mg',price:799,category:'Blends',description:'En kombination av två forskningspeptider.',badge:'BLEND',batch:'949595',coaUrl:'https://polypeptide.io/tests/949595-BPC-157+TB-500_20mg'},
];
/** Peptides get research-use texts, CoA and per-mg prices; accessories are sold per piece. */
export type ProductKind = 'peptid' | 'tillbehor';
export const productKindLabel: Record<ProductKind, string> = { peptid: 'Peptid', tillbehor: 'Tillbehör' };
export type ProductGroup = {
  slug: string; name: string; category: string; description: string; badge?: string | undefined;
  image: string; featured: boolean; about: string[]; specs: [string, string][];
  kind: ProductKind; quantityPresets: number[];
  variants: [Product, ...Product[]];
};
const seedFeatured = ['retatrutide', 'ghk-cu', 'mots-c', 'bpc-157-tb-500'];
export const productGroups: ProductGroup[] = products.reduce<ProductGroup[]>((groups, p) => {
  const g = groups.find(x => x.slug === p.group);
  if (g) { g.variants.push(p); if (p.badge && !g.badge) g.badge = p.badge; }
  else groups.push({ slug: p.group, name: p.name, category: p.category, description: p.description, badge: p.badge, image: 'bundled:vial', featured: seedFeatured.includes(p.group), about: [], specs: [], kind: 'peptid', quantityPresets: [], variants: [p] });
  return groups;
}, []);
export const findGroup = (slug: string, groups: ProductGroup[] = productGroups) => groups.find(g => g.slug === slug);
export const formatPrice = (value: number) => `${new Intl.NumberFormat('sv-SE').format(value)} kr`;
export type CartItem = { slug: string; quantity: number };
export function updateCart(items: CartItem[], slug: string, delta: number, catalog: Product[] = products): CartItem[] {
  const existing = items.find(item => item.slug === slug);
  if (!existing) return delta > 0 && catalog.some(p => p.slug === slug) ? [...items, {slug,quantity:delta}] : items;
  return items.map(item => item.slug === slug ? {...item,quantity:item.quantity + delta} : item).filter(item => item.quantity > 0);
}
export function cartTotal(items: CartItem[], catalog: Product[] = products) { return items.reduce((total,item) => total + (catalog.find(p => p.slug === item.slug)?.price ?? 0) * item.quantity,0); }
export const shippingInfo = { carrier: 'PostNord', leadTime: '1–3 arbetsdagar', summary: 'Skickas med PostNord. Leverans 1–3 arbetsdagar.', fee: 62, freeFrom: 2000 } as const;
/** Shipping in kronor for an order total after discount; the server uses the same rule. */
export const shippingFee = (totalAfterDiscount: number) => (totalAfterDiscount >= shippingInfo.freeFrom ? 0 : shippingInfo.fee);
export const vatNote = 'Alla priser är i svenska kronor inklusive moms.';
// Legal seller identity (e-handelslagen 8 §). orgNr and address are left empty until supplied; render them only when set.
export const companyInfo: { name: string; email: string; orgNr: string; address: string } = { name: 'Peptidesweden', email: 'support@peptidesweden.com', orgNr: '', address: '' };
export const supportInfo = { handle: '@peptideswedenn', url: 'https://t.me/peptideswedenn', label: 'Support på Telegram', blurb: 'Ställ en fråga direkt — vi svarar på svenska.' } as const;
export function normalizePhone(value: string) { return value.trim().replace(/[\s()\-.]/g, ''); }
export function isValidPhone(value: string) { return /^(\+46|0)[1-9]\d{5,12}$/.test(normalizePhone(value)); }
export type PeptideInfo = { about: string[]; specs: [string, string][] };
export const peptideInfo: Record<string, PeptideInfo> = {
  'retatrutide': { about: ['Retatrutide (LY3437943) är en syntetisk peptid med 39 aminosyror som studeras som trippelagonist vid GIP-, GLP-1- och glukagonreceptorerna.', 'Peptiden används i laboratoriestudier inom metabol forskning, bland annat receptorbindning och signalvägar.'],
    specs: [['Alternativt namn','LY3437943'],['Summaformel','C221H342N46O68'],['Molmassa','ca 4 731 g/mol'],['CAS-nummer','2381089-83-2'],['Sekvenslängd','39 aminosyror']] },
  'ghk-cu': { about: ['GHK-Cu är ett komplex av tripeptiden glycyl-L-histidyl-L-lysin och koppar(II).', 'Den förekommer naturligt i plasma och studeras inom hudbiologi, kollagensyntes och vävnadsforskning in vitro.'],
    specs: [['Sekvens','Gly-His-Lys (Cu²⁺)'],['Summaformel','C14H24N6O4Cu'],['Molmassa','ca 404 g/mol'],['CAS-nummer','49557-75-7'],['Sekvenslängd','3 aminosyror']] },
  'mots-c': { about: ['MOTS-C är en peptid med 16 aminosyror som kodas av mitokondriellt DNA (12S rRNA).', 'Den studeras inom forskning om cellulär energimetabolism och AMPK-signalering.'],
    specs: [['Sekvens','MRWQEMGYIFYPRKLR'],['Summaformel','C101H152N28O22S2'],['Molmassa','ca 2 175 g/mol'],['CAS-nummer','1627580-64-6'],['Sekvenslängd','16 aminosyror']] },
  'bpc-157': { about: ['BPC-157 är en syntetisk pentadekapeptid härledd från en skyddande protein-sekvens i magsaft.', 'Peptiden används i prekliniska laboratoriestudier inom vävnads- och cellforskning.'],
    specs: [['Sekvens','GEPPPGKPADDAGLV'],['Summaformel','C62H98N16O22'],['Molmassa','ca 1 419 g/mol'],['CAS-nummer','137525-51-0'],['Sekvenslängd','15 aminosyror']] },
  'bpc-157-tb-500': { about: ['En blend av BPC-157 och TB-500 (ett syntetiskt fragment relaterat till tymosin beta-4) i samma vial.', 'Kombinationen används i laboratoriestudier där båda peptiderna undersöks tillsammans.'],
    specs: [['Innehåll','BPC-157 + TB-500'],['BPC-157 molmassa','ca 1 419 g/mol (CAS 137525-51-0)'],['TB-500 molmassa','ca 4 963 g/mol (CAS 77591-33-4)']] },
};
for (const g of productGroups) { const info = peptideInfo[g.slug]; if (info) { g.about = info.about; g.specs = info.specs; } }

// Accessories (not peptides), sold per piece with quick-pick quantities. Added to existing shops once.
const syringe: Product = { slug: 'insulinspruta-u100-1ml-29g', group: 'insulinspruta-u100', name: 'Insulinspruta U-100', amount: '1 ml · 29G', price: 5, category: 'Tillbehör', description: 'Steril engångsspruta 1 ml (U-100) med integrerad 29G-kanyl, individuellt blisterförpackad.' };
export const seedAccessoryGroups: ProductGroup[] = [{
  slug: syringe.group, name: syringe.name, category: syringe.category, description: syringe.description, image: 'bundled:insulinspruta', featured: false,
  kind: 'tillbehor', quantityPresets: [5, 10, 20], variants: [syringe],
  about: [
    'Insulinsprutor U-100 från Romed med integrerad kanyl, utvecklade för hög precision och tillförlitlig kvalitet. Varje spruta är individuellt blisterförpackad för att säkerställa god hygien och enkel hantering. Sprutorna är CE-märkta och tillverkade enligt europeiska kvalitetsstandarder.',
    '• Insulinspruta med integrerad 29G-kanyl (0,33 × 12,7 mm)\n• 1 ml cylinder med tydlig och lättavläst gradering\n• Individuellt sterilt blisterförpackade engångssprutor\n• Tunnväggig kanyl med trefacettsslipad spets och silikonbeläggning\n• Tillverkad för hög precision och jämn dosering',
    'Viktig information: Endast för engångsbruk. Återanvänd ej. Kassera enligt lokala föreskrifter.',
  ],
  specs: [
    ['Volym', '1 ml (U-100)'], ['Nålstorlek', '29G (0,33 × 12,7 mm)'], ['Varumärke', 'Romed'], ['Försäljning', 'Styckvis, individuellt sterilt blisterförpackade'],
    ['Standard', 'EN ISO 9626'], ['Certifiering', 'CE-märkt medicinteknisk produkt'], ['Material', 'Medicinsk polypropylen, rostfritt stål och silikonbeläggning'], ['Användning', 'Endast för engångsbruk'],
  ],
}];
/** Everything shipped as starting content, used when the database cannot be opened. */
export const allSeedGroups: ProductGroup[] = [...productGroups, ...seedAccessoryGroups];
export const allSeedProducts: Product[] = allSeedGroups.flatMap(g => g.variants);
