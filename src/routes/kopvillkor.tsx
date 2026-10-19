import { createFileRoute, Link } from '@tanstack/react-router';
import { LegalPage, type LegalSection } from '@/components/store/legal-page';
import { companyInfo, formatPrice, shippingInfo, supportInfo, vatNote } from '@/lib/products';

export const Route = createFileRoute('/kopvillkor')({
  head: () => ({
    meta: [
      { title: 'Köpvillkor | Peptidesweden' },
      { name: 'description', content: 'Köpvillkor för Peptidesweden: beställning, priser inklusive moms, frakt, betalning, leverans, ångerrätt, reklamation och villkor för forskningsprodukter.' },
      { property: 'og:title', content: 'Köpvillkor | Peptidesweden' },
      { property: 'og:description', content: 'Villkor för köp hos Peptidesweden.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: '/kopvillkor' },
    ],
    links: [{ rel: 'canonical', href: '/kopvillkor' }],
  }),
  component: Terms,
});

const contact = <><a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a> eller Telegram <a href={supportInfo.url} target="_blank" rel="noopener noreferrer">{supportInfo.handle}</a></>;

const sections: LegalSection[] = [
  { id: 'allmant', title: 'Allmänt', body: <>
    <p>Dessa villkor gäller när du handlar i webbutiken från {companyInfo.name} ("vi"). Genom att lägga en beställning godkänner du villkoren som gäller vid beställningstillfället. Kontaktuppgifter till oss finns längst ned på sidan.</p>
    <p>Du måste vara minst 18 år för att handla. Ingenting i villkoren begränsar dina rättigheter enligt tvingande konsumentlagstiftning, till exempel konsumentköplagen och distansavtalslagen.</p>
  </> },
  { id: 'forskning', title: 'Endast för laboratorieforskning', body: <>
    <p>Alla produkter säljs uteslutande för laboratorieforskning in vitro. De är inte läkemedel, livsmedel eller kosttillskott och får inte användas på människor eller djur. Vi ger inga råd om dosering eller användning.</p>
    <p>Genom att beställa intygar du att produkterna köps för forskningsändamål och hanteras av person med lämplig kunskap, enligt gällande lagar och regler.</p>
  </> },
  { id: 'bestallning', title: 'Beställning', body: <>
    <p>Du beställer genom kassan: varukorg, leverans- och kontaktuppgifter och betalning. När beställningen är lagd får du ett ordernummer och en orderbekräftelse till din e-post. Avtalet är ingånget när vi har bekräftat beställningen.</p>
    <p>Kontrollera att uppgifterna i bekräftelsen stämmer och kontakta oss direkt om något är fel. Om en vara inte kan levereras meddelar vi dig, och du får tillbaka det du har betalat för den.</p>
  </> },
  { id: 'priser', title: 'Priser, moms och frakt', body: <>
    <p>{vatNote} Priset som gäller är det som visas i kassan när du lägger beställningen.</p>
    <p>Frakten kostar {formatPrice(shippingInfo.fee)} per beställning. Är summan efter eventuell rabatt {formatPrice(shippingInfo.freeFrom)} eller mer är frakten gratis. Fraktkostnaden visas i varukorgen och i kassan innan du betalar.</p>
    <p>Rabattkoder anges i kassan, gäller enligt de villkor som visas för koden. En rabattkod kan användas per beställning.</p>
  </> },
  { id: 'betalning', title: 'Betalning', body: <>
    <p><strong>Kryptovaluta via NOWPayments.</strong> När du slutför beställningen skickas du till NOWPayments betalsida, där du väljer kryptovaluta, till exempel Bitcoin eller USDT. Beloppet räknas om från kronor vid betalningstillfället. Beställningen räknas som betald när hela beloppet är bekräftat på blockkedjan. En betalning som inte når hela beloppet, eller som görs efter att betalningen har gått ut, behandlas inte automatiskt — kontakta oss så hjälper vi dig.</p>
    <p><strong>Betalning efter beställning.</strong> När kryptobetalning inte är tillgänglig sparas beställningen och vi kontaktar dig med betalningsinstruktioner. Beställningen skickas när betalningen har kommit in.</p>
  </> },
  { id: 'leverans', title: 'Leverans', body: <>
    <p>Beställningar skickas med {shippingInfo.carrier} i neutral förpackning till adressen du anger i kassan. Leveranstiden är normalt {shippingInfo.leadTime} från att betalningen är bekräftad. Telefonnumret används om {shippingInfo.carrier} behöver nå dig inför leveransen.</p>
    <p>Risken för varan går över på dig när du har tagit emot den. Blir leveransen väsentligt försenad meddelar vi dig, och du har då rätt att häva köpet. Kan du inte hämta ut paketet i tid, kontakta oss innan det skickas tillbaka.</p>
  </> },
  { id: 'angerratt', title: 'Ångerrätt', body: <>
    <p>Enligt lagen om distansavtal och avtal utanför affärslokaler har du 14 dagars ångerrätt. Ångerfristen börjar dagen efter att du har tagit emot varan.</p>
    <p><strong>Så använder du ångerrätten.</strong> Meddela oss inom ångerfristen via {contact}. Ange ordernummer och vilka varor det gäller; du kan använda Konsumentverkets standardformulär för ångerrätt, men det behövs inte. Vi svarar med returadress och instruktioner. Skicka sedan tillbaka varorna senast 14 dagar efter att du har meddelat oss. Du står för returfrakten.</p>
    <p><strong>Undantag.</strong> Produkterna levereras i förseglade vialer. Av hälso- och hygienskäl gäller ångerrätten inte för en förseglad vara vars försegling har brutits efter leveransen (2 kap. 11 § 5 distansavtalslagen). Oöppnade vialer med obruten försegling kan ångras.</p>
    <p><strong>Återbetalning.</strong> Vi betalar tillbaka det du har betalat, inklusive den ursprungliga fraktkostnaden, senast 14 dagar efter att vi fick ditt meddelande. Vi får vänta med återbetalningen tills vi har fått tillbaka varorna eller du har visat att de är skickade. Betalade du med kryptovaluta betalar vi tillbaka beloppet i kronor som du betalade, till en plånboksadress du anger, om vi inte kommer överens om annat. Har varorna hanterats mer än vad som behövts för att fastställa deras egenskaper får vi göra avdrag för värdeminskningen.</p>
  </> },
  { id: 'reklamation', title: 'Reklamation och returer', body: <>
    <p>Du har rätt att reklamera fel på varan enligt konsumentköplagen i tre år från att du tog emot den. Meddela oss inom skälig tid efter att du har upptäckt felet; ett meddelande inom två månader räknas alltid som i rätt tid.</p>
    <p>Kontakta oss via {contact} med ordernummer, en beskrivning av felet och gärna en bild. Vi svarar med returadress och instruktioner om varan behöver skickas tillbaka. Vid en godkänd reklamation står vi för returfrakten och lagar, byter ut eller betalar tillbaka varan.</p>
    <p>Är paketet skadat vid leveransen ska du anmäla det till {shippingInfo.carrier} och till oss så snart som möjligt. Skicka inga returer utan att först ha kontaktat oss, så att vi kan ta emot dem.</p>
  </> },
  { id: 'personuppgifter', title: 'Personuppgifter', body: <>
    <p>Vi behandlar de personuppgifter du lämnar i kassan för att kunna hantera beställningen. Läs mer i vår <Link to="/integritetspolicy">integritetspolicy</Link>.</p>
  </> },
  { id: 'tvister', title: 'Tvister', body: <>
    <p>Kontakta oss först om du inte är nöjd, så försöker vi hitta en lösning. Kommer vi inte överens kan du vända dig till Allmänna reklamationsnämnden (ARN), <a href="https://www.arn.se" target="_blank" rel="noopener noreferrer">arn.se</a>.</p>
    <p>Svensk lag gäller för köpet. Tvister som inte kan lösas på annat sätt prövas av allmän domstol.</p>
  </> },
];

function Terms() {
  return <LegalPage eyebrow="KÖPVILLKOR" title="Köpvillkor" lead="Det här gäller när du beställer hos oss: priser, frakt, betalning, leverans, ångerrätt och reklamation." updated="19 oktober 2026" sections={sections} />;
}
