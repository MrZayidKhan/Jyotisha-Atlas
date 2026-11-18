import test,{afterEach} from 'node:test';
import React from 'react';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,FormData:dom.window.FormData});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.fetch=async()=>new Response(JSON.stringify({results:[]}),{status:200});
const {render,screen,fireEvent,cleanup,waitFor}=await import('@testing-library/react');
const {default:BirthForm}=await import('../src/BirthForm');
afterEach(cleanup);
function enterMoment(){fireEvent.change(screen.getByLabelText('Date of birth'),{target:{value:'2000-01-01'}});fireEvent.change(screen.getByLabelText('Time of birth'),{target:{value:'12:00'}})}
test('Selecting a dropdown option autofills coordinates and the historical offset',async()=>{
 let result:any;const {container}=render(<BirthForm onCreate={birth=>{result=birth}}/>);enterMoment();const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.change(input,{target:{value:'Mysuru'}});fireEvent.click(screen.getByRole('option',{name:/Mysuru/}));assert.match(screen.getByRole('status').textContent??'',/Coordinates filled/);assert.match(container.textContent??'',/UTC \+05:30/);fireEvent.submit(container.querySelector('form')!);await waitFor(()=>assert.ok(result));assert.equal(result.lat,12.2958);assert.equal(result.lon,76.6394);assert.equal(result.offset,5.5);assert.match(result.place,/Mysuru/);
});
test('A typed place must be selected rather than silently accepting stale coordinates',()=>{
 let called=false;const {container}=render(<BirthForm onCreate={()=>{called=true}}/>);enterMoment();const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.change(input,{target:{value:'Mysuru'}});fireEvent.click(screen.getByRole('option',{name:/Mysuru/}));fireEvent.change(input,{target:{value:'Another place'}});fireEvent.submit(container.querySelector('form')!);assert.equal(called,false);assert.match(screen.getByRole('alert').textContent??'',/Choose your birthplace from the dropdown/);
});
test('Precise coordinates accept zero latitude, zero longitude and UTC zero',async()=>{
 let result:any;const {container}=render(<BirthForm onCreate={birth=>{result=birth}}/>);enterMoment();fireEvent.click(screen.getByRole('button',{name:/Use precise coordinates/}));fireEvent.change(screen.getByLabelText('Location label'),{target:{value:'Coordinate test'}});fireEvent.change(screen.getByLabelText('Latitude'),{target:{value:'0'}});fireEvent.change(screen.getByLabelText('Longitude'),{target:{value:'0'}});fireEvent.change(screen.getByLabelText('UTC offset at birth'),{target:{value:'0'}});fireEvent.submit(container.querySelector('form')!);await waitFor(()=>assert.ok(result));assert.equal(result.lat,0);assert.equal(result.lon,0);assert.equal(result.offset,0);
});
test('An ambiguous birth time blocks automatic submission until an offset is chosen',async()=>{
 let result:any;const {container}=render(<BirthForm onCreate={birth=>{result=birth}}/>);fireEvent.change(screen.getByLabelText('Date of birth'),{target:{value:'2024-11-03'}});fireEvent.change(screen.getByLabelText('Time of birth'),{target:{value:'01:30'}});const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.change(input,{target:{value:'New York'}});fireEvent.click(screen.getByRole('option',{name:/New York/}));fireEvent.submit(container.querySelector('form')!);assert.equal(result,undefined);assert.match(screen.getByRole('alert').textContent??'',/occurs twice/);fireEvent.click(screen.getByRole('button',{name:'Set manually'}));fireEvent.change(screen.getByLabelText('UTC offset at birth'),{target:{value:'-4'}});fireEvent.submit(container.querySelector('form')!);await waitFor(()=>assert.ok(result));assert.equal(result.offset,-4);
});
test('Chart-only submit keeps the birth details and skips the 3D entry route',()=>{
 let result:unknown;
 const {container}=render(<BirthForm onCreate={(birth,show3D)=>{result={place:birth.place,show3D}}}/>);
 enterMoment();
 const input=screen.getByRole('combobox');
 fireEvent.focus(input);
 fireEvent.change(input,{target:{value:'Mysuru'}});
 fireEvent.click(screen.getByRole('option',{name:/Mysuru/}));
 const button=screen.getByRole('button',{name:'Open chart only'});
 fireEvent(container.querySelector('form')!,new dom.window.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:button}));
 assert.deepEqual(result,{place:'Mysuru, Karnataka, India',show3D:false});
});
