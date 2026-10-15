import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { FlaskConical, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TelegramSupportRow } from '@/components/store/support-telegram';
import { calculateConcentration, parseDecimal } from '@/lib/concentration';
export const Route = createFileRoute('/kalkylator')({head:()=>({meta:[{title:'Peptidkalkylator | Peptidesweden'},{name:'description',content:'Beräkna masskoncentration i mg/ml för laboratorieforskning. Massa dividerad med slutlig lösningsvolym.'},{property:'og:title',content:'Peptidkalkylator | Peptidesweden'},{property:'og:description',content:'En enkel beräkning av masskoncentration för laboratoriet.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Calculator});
const MASS_PRESETS=['5','10','15','20','30','50','60','100'];
const VOLUME_PRESETS=['1','2','3','5','10'];
function Presets({values,current,unit,onPick,label}:{values:string[];current:string;unit:string;onPick:(v:string)=>void;label:string}){
 return <div className="strength-options" role="group" aria-label={label}>{values.map(v=><Button variant="outline" key={v} type="button" className="strength-chip" aria-pressed={current===v} data-active={current===v} onClick={()=>onPick(v)}>{v} {unit}</Button>)}</div>
}
function Calculator(){
 const [mass,setMass]=useState('10'); const [volume,setVolume]=useState('2');
 const m=parseDecimal(mass), v=parseDecimal(volume);
 const concentration=calculateConcentration(m,v);
 const invalid=concentration===null;
 const fmt=(n:number)=>new Intl.NumberFormat('sv-SE',{maximumSignificantDigits:6}).format(n);
 return <main className="content-width info-page">
  <div className="research-banner">Endast för laboratorieforskning – ingen doseringskalkylator.</div>
  <div className="eyebrow"><span className="eyebrow-line"/> LABORATORIET</div>
  <h1>Peptid<wbr/>kalkylator</h1>
  <p className="lead">Välj vialens innehåll och den slutliga lösningsvolymen för att se koncentrationen.</p>
  <section className="calculator-tool" aria-label="Beräkna masskoncentration">
   <div className="calculator-heading"><FlaskConical size={22}/><h2>Rekonstitution</h2><Button variant="ghost" size="icon" aria-label="Återställ kalkylator" title="Återställ" onClick={()=>{setMass('10');setVolume('2')}}><RotateCcw/></Button></div>
   <div className="calculator-step"><h3><span className="step-num">1</span> Peptidmängd i vialen</h3><Presets label="Välj peptidmängd" values={MASS_PRESETS} current={mass} unit="mg" onPick={setMass}/>
    <label htmlFor="mass">Eget värde<div className="unit-input"><input id="mass" inputMode="decimal" value={mass} onChange={e=>setMass(e.target.value)} aria-invalid={invalid && !(m>0)}/><span>mg</span></div></label></div>
   <div className="calculator-step"><h3><span className="step-num">2</span> Slutlig lösningsvolym</h3><Presets label="Välj volym" values={VOLUME_PRESETS} current={volume} unit="ml" onPick={setVolume}/>
    <label htmlFor="volume">Eget värde<div className="unit-input"><input id="volume" inputMode="decimal" value={volume} onChange={e=>setVolume(e.target.value)} aria-invalid={invalid && !(v>0)}/><span>ml</span></div></label></div>
   <div className="calculator-result" aria-live="polite"><span><span className="step-num">3</span> Resultat</span>{concentration!==null?<>
    <strong>{fmt(concentration)} <small>mg/ml</small></strong>
    <div className="calc-result-grid"><div><small>Mikrogram per ml</small><b>{fmt(concentration*1000)} µg/ml</b></div><div><small>Mikrogram per 0,1 ml</small><b>{fmt(concentration*100)} µg</b></div><div><small>Beräkning</small><b>{mass} mg ÷ {volume} ml</b></div></div>
   </>:<p role="alert">Ange en massa och volym större än noll, med punkt eller komma som decimaltecken.</p>}</div>
  </section>
  <section className="calculator-step"><h3>Så fungerar det</h3><p>Koncentrationen är peptidens massa dividerad med lösningens slutliga volym. Exempel: 10 mg i 2 ml ger 5 mg/ml, vilket motsvarar 5 000 µg/ml.</p></section>
  <p className="calculator-notice">Endast en matematisk beräkning för laboratorieforskning. Inte doseringsråd eller anvisningar för användning på människor eller djur.</p>
  <TelegramSupportRow note="Behöver du hjälp med beräkningen? Fråga oss på Telegram" />
  <Button variant="link" asChild><Link to="/blogg/$slug" params={{slug:'koncentration-i-laboratoriet'}}>Läs om masskoncentration <ArrowRight/></Link></Button>
 </main>
}
