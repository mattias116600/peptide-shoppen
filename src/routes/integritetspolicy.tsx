import { createFileRoute } from '@tanstack/react-router';
import { LegalPage, type LegalSection } from '@/components/store/legal-page';
import { companyInfo, shippingInfo } from '@/lib/products';

export const Route = createFileRoute('/integritetspolicy')({
  head: () => ({
    meta: [
      { title: 'Integritetspolicy | Peptidesweden' },
      { name: 'description', content: 'Så behandlar Peptidesweden dina personuppgifter enligt GDPR: vilka uppgifter vi samlar in i kassan, varför, hur länge de sparas, vem som får dem och vilka rättigheter du har.' },
      { property: 'og:title', content: 'Integritetspolicy | Peptidesweden' },
      { property: 'og:description', content: 'Så behandlar vi dina personuppgifter.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: '/integritetspolicy' },
    ],
    links: [{ rel: 'canonical', href: '/integritetspolicy' }],
  }),
  component: Privacy,
});

const email = <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>;

const sections: LegalSection[] = [
  { id: 'ansvarig', title: 'Personuppgiftsansvarig', body: <>
    <p>{companyInfo.name} är personuppgiftsansvarig för behandlingen av dina personuppgifter i webbutiken. Frågor om hur vi behandlar personuppgifter skickar du till {email}.</p>
  </> },
  { id: 'uppgifter', title: 'Vilka uppgifter vi samlar in', body: <>
    <p>När du beställer lämnar du:</p>
    <ul>
      <li>namn, e-postadress och telefonnummer</li>
      <li>leveransadress: gatuadress, postnummer och ort</li>
      <li>beställningens innehåll, belopp och eventuell rabattkod</li>
    </ul>
    <p>Vi sparar också orderns status och historik, och från NOWPayments betalningens status, fakturanummer och betalt belopp. Vi får aldrig tillgång till din plånbok eller dina inloggningsuppgifter. För att begränsa missbruk av kassan håller servern din IP-adress i minnet i tio minuter när du lägger en beställning; den sparas inte i databasen.</p>
  </> },
  { id: 'syfte', title: 'Varför vi behandlar uppgifterna och med vilken rätt', body: <>
    <ul>
      <li><strong>Hantera och leverera din beställning</strong>, ta emot betalning, skicka orderbekräftelse och svara på frågor, ångerärenden och reklamationer. Rättslig grund: att fullgöra köpavtalet med dig (artikel 6.1 b GDPR).</li>
      <li><strong>Bokföring.</strong> Uppgifter om köpet är räkenskapsinformation som vi måste spara enligt bokföringslagen. Rättslig grund: rättslig förpliktelse (artikel 6.1 c).</li>
      <li><strong>Förhindra bedrägerier och missbruk</strong> av kassan och kunna försvara rättsliga anspråk. Rättslig grund: vårt berättigade intresse (artikel 6.1 f).</li>
    </ul>
    <p>Vi använder inte dina uppgifter för marknadsföring, säljer dem inte och gör ingen profilering.</p>
  </> },
  { id: 'lagring', title: 'Hur länge vi sparar uppgifterna', body: <>
    <p>Orderuppgifter sparas så länge det behövs för att leverera beställningen och hantera reklamationer, det vill säga i tre år från leveransen. Uppgifter som är räkenskapsinformation sparas i sju år efter utgången av det kalenderår då räkenskapsåret avslutades, enligt bokföringslagen. Därefter raderas de.</p>
  </> },
  { id: 'mottagare', title: 'Vem som får del av uppgifterna', body: <>
    <ul>
      <li><strong>NOWPayments</strong>, som förmedlar kryptobetalningar, får ordernummer och belopp. På NOWPayments betalsida gäller deras egen integritetspolicy.</li>
      <li><strong>{shippingInfo.carrier}</strong> får namn, adress och telefonnummer för att leverera paketet och avisera dig.</li>
      <li><strong>Vår e-postleverantör</strong> skickar orderbekräftelser och meddelanden om din beställning och behandlar då din e-postadress och orderns innehåll.</li>
      <li><strong>Vår driftleverantör</strong> lagrar webbutiken och databasen på en server som vi hyr.</li>
    </ul>
    <p>Leverantörer som behandlar uppgifter för vår räkning är personuppgiftsbiträden och får bara använda dem enligt våra instruktioner. Om uppgifter behandlas utanför EU/EES sker det med stöd av ett beslut om adekvat skyddsnivå eller EU-kommissionens standardavtalsklausuler. Vi lämnar också ut uppgifter till myndigheter när lagen kräver det.</p>
  </> },
  { id: 'lagring-webblasare', title: 'Kakor och lagring i webbläsaren', body: <>
    <p>Webbutiken använder inga kakor för analys eller marknadsföring. När du bekräftar att du är minst 18 år sparas det svaret i din webbläsares lokala lagring (localStorage), så att frågan inte visas vid varje besök. Varukorgen finns bara i webbläsarfönstret medan du handlar och sparas inte. Du kan när som helst rensa den lokala lagringen i webbläsarens inställningar.</p>
  </> },
  { id: 'rattigheter', title: 'Dina rättigheter', body: <>
    <p>Du har rätt att:</p>
    <ul>
      <li>få veta vilka uppgifter vi har om dig och få en kopia av dem (registerutdrag)</li>
      <li>få felaktiga uppgifter rättade</li>
      <li>få uppgifter raderade, när vi inte längre behöver dem eller måste spara dem enligt lag</li>
      <li>begära att behandlingen begränsas</li>
      <li>invända mot behandling som grundas på vårt berättigade intresse</li>
      <li>få ut uppgifter du har lämnat till oss i ett maskinläsbart format (dataportabilitet)</li>
    </ul>
    <p>Skicka din begäran till {email}. Vi svarar inom en månad.</p>
  </> },
  { id: 'klagomal', title: 'Klagomål', body: <>
    <p>Tycker du att vi behandlar dina personuppgifter felaktigt, kontakta oss först. Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY), <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer">imy.se</a>.</p>
  </> },
];

function Privacy() {
  return <LegalPage eyebrow="INTEGRITETSPOLICY" title="Integritetspolicy" lead="Så behandlar vi de personuppgifter du lämnar när du handlar hos oss, och vilka rättigheter du har enligt dataskyddsförordningen (GDPR)." updated="19 oktober 2026" sections={sections} />;
}
