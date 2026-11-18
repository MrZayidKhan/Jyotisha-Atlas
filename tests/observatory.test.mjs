import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../src/engine.ts';
import {availableChapters,destinationInfo,worldPosition} from '../src/observatoryModel.ts';
const birth={name:'Sample chart',date:'2000-01-01',time:'12:00',place:'Greenwich',lat:51.48,lon:0,offset:0,unknown:false};
test('Every graha destination uses the selected calculated placement',()=>{const c=calculate(birth);for(const p of c.placements){const info=destinationInfo(c,p.key);assert.equal(info.placement,p);assert.equal(info.longitude,p.longitude);assert.ok(info.relation.includes(p.name))}});
test('Rashi and Nakshatra camera destinations lie inside the Moon sector',()=>{const c=calculate(birth);const moon=c.placements[1];assert.equal(Math.floor(destinationInfo(c,'rashi').longitude/30),moon.sign);assert.equal(Math.floor(destinationInfo(c,'nakshatra').longitude/(360/27)),Math.floor(moon.longitude/(360/27)))});
test('Lagna chapter uses rising longitude and disappears when time is unknown',()=>{const c=calculate(birth);assert.equal(destinationInfo(c,'lagna').longitude,c.lagna);const unknown=calculate({...birth,unknown:true,time:''});assert.ok(!availableChapters(unknown).includes('lagna'));assert.match(destinationInfo(unknown,'moon').relation,/withheld/)});
test('World-space angles retain longitude and explicit radial spacing',()=>{for(const angle of [0,30,90,180,270,359]){const [x,y,z]=worldPosition(angle,47);assert.equal(y,0);assert.ok(Math.abs(Math.hypot(x,z)-47)<1e-8);const recovered=(Math.atan2(-z,x)*180/Math.PI+360)%360;assert.ok(Math.abs(recovered-angle)<1e-8)}});
