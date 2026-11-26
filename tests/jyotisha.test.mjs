import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/engine.ts';
import { birthHorizon } from '../src/horizon.ts';
import { chartHelp, generalChartHelp } from '../src/chartHelp.ts';
import { currentPeriods, jaiminiIndicators, personalReading, vimshottari, yogaCandidates } from '../src/jyotisha.ts';

test('Pip resolves the selected planet, exact yoga, and chart frame', () => {
 const chart = calculate({ date:'2000-01-01', time:'12:00', lat:51.48, lon:0, offset:0, unknown:false, name:'', place:'Greenwich' });
 assert.ok(chartHelp(chart, 'sidereal').text.includes(chart.ayanamsa.toFixed(2)));
 assert.ok(!generalChartHelp(chart, 'sidereal').text.includes(chart.ayanamsa.toFixed(2)));
 assert.doesNotMatch(generalChartHelp(chart, 'planet:rahu').text, /°|House [0-9]/);
 assert.match(chartHelp(chart, 'degree:rahu').text, /°/);
 assert.equal(chartHelp(chart, 'planet:rahu').title, 'Rahu');
 assert.ok(chartHelp(chart, 'theme:0').text.includes('ruling planet'));
 const yoga = yogaCandidates(chart)[0];
 assert.equal(chartHelp(chart, 'yoga:0').title, yoga.name);
 assert.ok(chartHelp(chart, 'yoga:0').text.includes(yoga.evidence));
 assert.equal(chartHelp(chart, 'planet:unknown'), undefined);
});

const birth={name:'Fixture',date:'2000-01-01',time:'12:00',place:'Greenwich',lat:51.48,lon:0,offset:0,unknown:false};
const chart=calculate(birth);

test('Vimshottari begins with the Moon mansion lord and keeps subperiod boundaries contiguous',()=>{
 const fixture={...chart,placements:chart.placements.map(p=>p.key==='moon'?{...p,longitude:(360/27)/2}:p)};
 const [first,second]=vimshottari(fixture);
 const birthTime=Date.parse(fixture.utc);
 assert.equal(first.lord,'ketu');
 assert.equal(first.start,birthTime);
 assert.equal(first.end-birthTime,3.5*365.25*86400000);
 assert.equal(second.lord,'venus');
 assert.equal(first.end,second.start);
 assert.equal(first.sub[0].start,birthTime);
 assert.equal(first.sub.at(-1).end,first.end);
 assert.ok(first.sub.every((sub,i)=>!i||sub.start===first.sub[i-1].end));
 assert.equal(currentPeriods(fixture,first.end).major.lord,'venus');
});

test('yoga candidates use their documented positions, and Jaimini ranks without nodes',()=>{
 const fixture={...chart,placements:chart.placements.map(p=>{
  if(p.key==='moon')return {...p,sign:2};
  if(p.key==='jupiter')return {...p,sign:5};
  if(p.key==='mars')return {...p,sign:9,house:10};
  return p;
 })};
 const names=yogaCandidates(fixture).map(y=>y.name);
 assert.ok(names.includes('Gaja Kesari'));
 assert.ok(names.includes('Ruchaka'));
 const indicators=jaiminiIndicators(chart);
 assert.equal(indicators.length,7);
 assert.ok(indicators.every((p,i)=>!i||indicators[i-1].degree>=p.degree));
 assert.ok(!indicators.some(p=>['Rahu','Ketu'].includes(p.planet)));
});

test('house readings and timelines are withheld without an actual birth time',()=>{
 const unknown=calculate({...birth,time:'',unknown:true});
 for(const derive of [personalReading,vimshottari,yogaCandidates,jaiminiIndicators])assert.deepEqual(derive(unknown),[]);
});

test('Greenwich equinox noon has a high southern Sun while midnight is below the horizon',()=>{
 const civil={...birth,date:'2020-03-20'};
 const noon=birthHorizon(calculate(civil)).planets[0];
 const midnight=birthHorizon(calculate({...civil,time:'00:00'})).planets[0];
 assert.ok(noon.azimuth>172&&noon.azimuth<186);
 assert.ok(noon.altitude>37&&noon.altitude<40);
 assert.ok(midnight.altitude<0);
 assert.equal(birthHorizon(chart).stars.length,20);
});
