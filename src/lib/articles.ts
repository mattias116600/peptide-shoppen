import peptider from '@/assets/blog/peptider.webp';
import analysrapport from '@/assets/blog/analysrapport.webp';
import koncentration from '@/assets/blog/koncentration.webp';
import retatrutide from '@/assets/blog/retatrutide.webp';
import bpc157 from '@/assets/blog/bpc157.webp';
import ghkcu from '@/assets/blog/ghkcu.webp';
import motsc from '@/assets/blog/motsc.webp';
import forvaring from '@/assets/blog/forvaring.webp';
import hplc from '@/assets/blog/hplc.webp';
import tb500 from '@/assets/blog/tb500.webp';

export type Article = {
  slug: string; title: string; metaTitle: string; description: string; category: string;
  intro: string; date: string; readTime: number; image: string; imageAlt: string;
  keywords: string[]; productSlug?: string;
  sections: { title: string; text: string }[];
};

const notice = { title: 'Endast för laboratorieforskning', text: 'Produkterna hos Peptidesweden säljs uteslutande för laboratorieforskning in vitro. De är inte avsedda för användning på människor eller djur och texten är inte medicinsk rådgivning.' };

export const articles: Article[] = [
  { slug: 'vad-ar-peptider', title: 'Vad är peptider? En guide för nybörjare', metaTitle: 'Vad är peptider? Guide om aminosyror och peptidbindningar', description: 'Lär dig vad peptider är, hur aminosyror bildar peptidbindningar och varför peptider är viktiga inom modern laboratorieforskning.', category: 'Grundläggande kunskap', intro: 'Aminosyror, peptidbindningar och varför peptider är så intressanta inom forskning.', date: '2026-10-01', readTime: 5, image: peptider, imageAlt: 'Molekylmodell av en peptidkedja i blått och gult', keywords: ['peptider', 'aminosyror', 'peptidbindning'], sections: [
    { title: 'Aminosyror i kedjor', text: 'Peptider är molekyler som består av aminosyror sammanlänkade genom peptidbindningar. En peptidbindning bildas när karboxylgruppen på en aminosyra reagerar med aminogruppen på nästa, och en vattenmolekyl frigörs.' },
    { title: 'Peptid eller protein?', text: 'Kortare kedjor (oftast under cirka 50 aminosyror) kallas peptider, längre kedjor proteiner. Gränsen är inte skarp — det som skiljer är ofta storlek och hur kedjan veckar sig i tre dimensioner.' },
    { title: 'Varför forskare studerar peptider', text: 'Peptider fungerar som signalmolekyler i många biologiska system. I laboratoriet används syntetiska peptider för att studera receptorer, cellsignalering och molekylära interaktioner. Att en molekyl studeras innebär inte att den är godkänd eller säker för behandling.' },
    notice ] },
  { slug: 'analys-och-dokumentation', title: 'Så läser du en analysrapport (CoA)', metaTitle: 'Så läser du en CoA – analysrapport för peptider', description: 'Vad står i ett Certificate of Analysis? Lär dig granska batchnummer, metod, renhet och identitet i en analysrapport för peptider.', category: 'Kvalitet & dokumentation', intro: 'Vad kan ett analysresultat berätta — och vilka frågor behöver du fortfarande ställa?', date: '2026-10-03', readTime: 6, image: analysrapport, imageAlt: 'Analysrapport med kromatogram bredvid en vial', keywords: ['CoA', 'analysrapport', 'certificate of analysis'], sections: [
    { title: 'Batchen är viktigast', text: 'En rapport måste kunna kopplas till exakt den batch du har. Kontrollera batchnummer, analysdatum, metod och vilket laboratorium som utförde analysen. Ett resultat från en annan batch verifierar inte din produkt.' },
    { title: 'Identitet och renhet', text: 'HPLC visar hur stor andel av provet som utgörs av huvudtoppen (renhet). Masspektrometri bekräftar att molekylens massa stämmer med den förväntade (identitet). En bra rapport innehåller båda.' },
    { title: 'Vad rapporten inte säger', text: 'Ett renhetsvärde bevisar inte sterilitet, endotoxinfrihet eller lämplighet för medicinsk användning. Hos Peptidesweden länkas rapporten från produktsidan för den styrka du väljer.' },
    notice ] },
  { slug: 'koncentration-i-laboratoriet', title: 'Räkna ut koncentration: mg/ml förklarat', metaTitle: 'Räkna ut koncentration mg/ml – enkel guide för labbet', description: 'Så beräknar du masskoncentration i mg/ml och µg/ml utifrån massa och volym, med tydliga exempel och vanliga enhetsfel att undvika.', category: 'Laboratoriekunskap', intro: 'Sambandet mellan massa, volym och koncentration — med tydliga enheter.', date: '2026-10-05', readTime: 4, image: koncentration, imageAlt: 'Mätkolv, pipett och analysvåg i ett ljust labb', keywords: ['koncentration', 'mg/ml', 'beräkning'], sections: [
    { title: 'Massa delad med volym', text: 'Masskoncentration = massa ÷ volym. Anges massan i milligram och slutvolymen i milliliter blir enheten mg/ml.' },
    { title: 'Ett räkneexempel', text: '10 mg löst till en slutvolym på 2 ml ger 5 mg/ml, vilket motsvarar 5 000 µg/ml. Detta är matematik, inte en instruktion för beredning eller användning.' },
    { title: 'Vanliga fel', text: 'Blanda inte ihop mg och µg (faktor 1 000) och använd alltid slutvolymen. Vår kalkylator räknar enbart masskoncentration och tar inte hänsyn till löslighet eller stabilitet.' },
    notice ] },
  { slug: 'retatrutide-forskning', title: 'Retatrutide: vad säger forskningen?', metaTitle: 'Retatrutide – forskning, struktur och fakta', description: 'En översikt över retatrutide, en trippelagonist (GIP, GLP-1 och glukagon) som studeras i klinisk forskning. Struktur, mekanism och status.', category: 'Peptidprofiler', intro: 'En syntetisk peptid som verkar på tre receptorer samtidigt — en av de mest omtalade forskningsmolekylerna just nu.', date: '2026-10-07', readTime: 6, image: retatrutide, imageAlt: 'Rad med forskningsvialer med blå lock och vitt pulver', keywords: ['retatrutide', 'trippelagonist', 'GLP-1'], productSlug: 'retatrutide', sections: [
    { title: 'Vad är retatrutide?', text: 'Retatrutide (LY3437943) är en syntetisk peptid som utvecklats för att aktivera tre receptorer: GIP, GLP-1 och glukagonreceptorn. Därför kallas den ofta trippelagonist.' },
    { title: 'Forskningsläget', text: 'Molekylen har studerats i kliniska prövningar som publicerats i bland annat New England Journal of Medicine. Den är fortfarande under utveckling och inte godkänd som läkemedel.' },
    { title: 'Varför den intresserar forskare', text: 'Att kombinera flera receptorvägar i en molekyl ger forskare möjlighet att studera hur metabola signalsystem samverkar i cell- och receptormodeller.' },
    notice ] },
  { slug: 'bpc-157-forskning', title: 'BPC-157: bakgrund och forskning', metaTitle: 'BPC-157 – vad är det? Forskning och fakta', description: 'BPC-157 är en syntetisk pentadekapeptid härledd ur ett protein i magsaft. Läs om struktur, prekliniska studier och vad som fortfarande är okänt.', category: 'Peptidprofiler', intro: 'En kort peptid på 15 aminosyror som främst har studerats i prekliniska modeller.', date: '2026-10-08', readTime: 5, image: bpc157, imageAlt: 'Forskare håller en petriskål under mikroskop', keywords: ['BPC-157', 'pentadekapeptid', 'forskning'], productSlug: 'bpc-157', sections: [
    { title: 'Struktur', text: 'BPC-157 (Body Protection Compound-157) är en pentadekapeptid, alltså 15 aminosyror lång, baserad på en sekvens från ett protein som finns i magsaft.' },
    { title: 'Vad har studerats?', text: 'Merparten av publicerad forskning är preklinisk, det vill säga cell- och djurmodeller. Välkontrollerade studier på människor saknas i stort sett.' },
    { title: 'Kritiskt perspektiv', text: 'Eftersom underlaget är begränsat är det viktigt att skilja mellan hypoteser i labbet och bevisad effekt. Substansen är inte godkänd som läkemedel.' },
    notice ] },
  { slug: 'ghk-cu-kopparpeptid', title: 'GHK-Cu: kopparpeptiden förklarad', metaTitle: 'GHK-Cu kopparpeptid – struktur och forskning', description: 'GHK-Cu är en naturligt förekommande tripeptid bunden till koppar. Lär dig om dess kemi, förekomst och hur den används i laboratorieforskning.', category: 'Peptidprofiler', intro: 'Tre aminosyror och en kopparjon — en av de mest studerade små peptiderna.', date: '2026-10-09', readTime: 5, image: ghkcu, imageAlt: 'Blå kopparlösning i en glasbägare', keywords: ['GHK-Cu', 'kopparpeptid', 'tripeptid'], productSlug: 'ghk-cu', sections: [
    { title: 'Glycin, histidin, lysin', text: 'GHK är en tripeptid (Gly-His-Lys) som har hög affinitet för koppar(II)-joner. Komplexet kallas GHK-Cu och har en karakteristisk blå färg.' },
    { title: 'Naturlig förekomst', text: 'GHK upptäcktes i humant plasma på 1970-talet och nivåerna har rapporterats minska med ålder. Det har gjort molekylen intressant i forskning kring vävnadsbiologi.' },
    { title: 'I laboratoriet', text: 'GHK-Cu används i cellstudier som rör genuttryck och kopparbiologi. Den kopparbundna formen är känslig för pH och bör hanteras enligt ditt labbprotokoll.' },
    notice ] },
  { slug: 'mots-c-mitokondriell-peptid', title: 'MOTS-C: en peptid från mitokondrierna', metaTitle: 'MOTS-C – mitokondriell peptid, forskning och fakta', description: 'MOTS-C är en peptid som kodas av mitokondriellt DNA. Läs om upptäckten, sekvensen och varför den studeras inom metabol forskning.', category: 'Peptidprofiler', intro: 'Ovanligt nog kodas MOTS-C inte i cellkärnan utan i mitokondriernas eget DNA.', date: '2026-10-10', readTime: 5, image: motsc, imageAlt: '3D-illustration av mitokondrier i blått och gult', keywords: ['MOTS-C', 'mitokondrier', 'peptid'], productSlug: 'mots-c', sections: [
    { title: 'Upptäckten', text: 'MOTS-C beskrevs 2015 som en 16 aminosyror lång peptid kodad i 12S rRNA-regionen av mitokondriellt DNA — en del av gruppen mitokondriellt härledda peptider.' },
    { title: 'Forskningsfokus', text: 'Studier har främst undersökt hur MOTS-C påverkar cellulär metabolism och signalering i cell- och djurmodeller. Kunskapen om människor är fortfarande begränsad.' },
    { title: 'Varför den är intressant', text: 'Att mitokondrier kan producera egna signalpeptider har öppnat ett nytt forskningsfält om kommunikationen mellan mitokondrier och cellkärna.' },
    notice ] },
  { slug: 'forvaring-av-peptider', title: 'Förvaring av lyofiliserade peptider', metaTitle: 'Förvaring av peptider – temperatur, ljus och fukt', description: 'Så förvarar du lyofiliserade peptider korrekt i labbet: temperatur, ljusskydd, fukt och varför du bör undvika upprepad frysning och upptining.', category: 'Laboratoriekunskap', intro: 'Rätt förvaring är avgörande för att peptiden ska hålla sig stabil över tid.', date: '2026-10-12', readTime: 4, image: forvaring, imageAlt: 'Frysfack med ordnade vialer med blå lock', keywords: ['förvaring peptider', 'lyofiliserad', 'stabilitet'], sections: [
    { title: 'Kallt, mörkt och torrt', text: 'Lyofiliserade (frystorkade) peptider förvaras vanligtvis i frys, skyddade från ljus och fukt. Låt vialen nå rumstemperatur innan den öppnas för att undvika kondens.' },
    { title: 'Undvik frys–tö-cykler', text: 'Upprepad frysning och upptining kan bryta ned peptider. Många labb delar därför upp material i mindre portioner.' },
    { title: 'Dokumentera', text: 'Märk vialer med batchnummer och datum och följ leverantörens och ditt labbs riktlinjer för hållbarhet.' },
    notice ] },
  { slug: 'hplc-och-masspektrometri', title: 'HPLC och masspektrometri: så testas peptider', metaTitle: 'HPLC och masspektrometri – så testas peptiders renhet', description: 'Förstå hur HPLC mäter renhet och hur masspektrometri bekräftar identitet. En enkel förklaring av metoderna bakom en analysrapport.', category: 'Kvalitet & dokumentation', intro: 'De två metoder som oftast ligger bakom siffrorna i en analysrapport.', date: '2026-10-13', readTime: 6, image: hplc, imageAlt: 'HPLC-instrument i ett modernt laboratorium', keywords: ['HPLC', 'masspektrometri', 'renhet peptider'], sections: [
    { title: 'HPLC – separation', text: 'Vid högupplösande vätskekromatografi pressas provet genom en kolonn. Olika ämnen passerar olika snabbt och syns som toppar i ett kromatogram. Huvudtoppens andel av ytan anges som renhet.' },
    { title: 'MS – identitet', text: 'Masspektrometri mäter molekylers massa i förhållande till laddning. Stämmer den uppmätta massan med den teoretiska stöder det att rätt peptid finns i provet.' },
    { title: 'Tillsammans', text: 'HPLC säger hur rent provet är, MS säger vad det är. En analysrapport med båda ger en betydligt mer komplett bild.' },
    notice ] },
  { slug: 'tb-500-thymosin-beta-4', title: 'TB-500 och thymosin beta-4', metaTitle: 'TB-500 – thymosin beta-4 fragment, forskning och fakta', description: 'Vad är TB-500 och hur förhåller den sig till thymosin beta-4? Läs om struktur, preklinisk forskning och kombinationen BPC-157 + TB-500.', category: 'Peptidprofiler', intro: 'En syntetisk peptid kopplad till thymosin beta-4, ofta studerad tillsammans med BPC-157.', date: '2026-10-14', readTime: 5, image: tb500, imageAlt: 'Två vialer med blått och gult lock bredvid en anteckningsbok', keywords: ['TB-500', 'thymosin beta-4', 'BPC-157 TB-500'], productSlug: 'bpc-157-tb-500', sections: [
    { title: 'Ursprung', text: 'Thymosin beta-4 är ett protein på 43 aminosyror som binder aktin. TB-500 är en syntetisk peptid baserad på en aktiv region av thymosin beta-4.' },
    { title: 'Forskningsläge', text: 'Forskningen är huvudsakligen preklinisk och fokuserar på cellmigration och aktindynamik i laboratoriemodeller.' },
    { title: 'Kombinationen med BPC-157', text: 'I forskningssammanhang kombineras ibland BPC-157 och TB-500 i samma vial för att studera två olika peptider parallellt. Kombinationen är inte godkänd för någon behandling.' },
    notice ] },
];
