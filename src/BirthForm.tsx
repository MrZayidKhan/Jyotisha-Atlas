import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {Birth} from './engine';
import {birthOffset,findLocalPlaces,formatOffset,mergePlaces,parsePlaces,placeLabel,type Place} from './locations';
export default function BirthForm({onCreate}:{onCreate:(birth:Birth,show3D:boolean)=>void}){
 const [query,setQuery]=useState(''),[selected,setSelected]=useState<Place|null>(null),[places,setPlaces]=useState<Place[]>(findLocalPlaces(''));
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1),[searching,setSearching]=useState(false),[searchIssue,setSearchIssue]=useState('');
 const [precise,setPrecise]=useState(false),[lat,setLat]=useState(''),[lon,setLon]=useState(''),[placeName,setPlaceName]=useState('');
 const [date,setDate]=useState(''),[time,setTime]=useState(''),[unknown,setUnknown]=useState(false);
 const [manualOffset,setManualOffset]=useState(false),[offset,setOffset]=useState('');
 const [error,setError]=useState('');
 const picker=useRef<HTMLDivElement>(null);
 const resolved=useMemo(()=>birthOffset(selected?.timezone??'',date,unknown?'12:00':time),[selected,date,time,unknown]);
 useEffect(()=>{if(!open)return;const local=findLocalPlaces(query);setPlaces(local);setActive(-1);setSearchIssue('');if(query.trim().length<3){setSearching(false);return}const controller=new AbortController();const timer=setTimeout(async()=>{setSearching(true);try{const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`,{signal:controller.signal});if(!response.ok)throw Error();const data=await response.json();if(!controller.signal.aborted)setPlaces(mergePlaces(local,parsePlaces(data)))}catch{if(!controller.signal.aborted)setSearchIssue('Online search unavailable. Choose a saved city or use precise coordinates.')}finally{if(!controller.signal.aborted)setSearching(false)}},350);return()=>{clearTimeout(timer);controller.abort()}},[query,open]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!picker.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[]);
 function choose(place:Place){setSelected(place);setQuery(placeLabel(place));setPlaceName(placeLabel(place));setLat(String(place.lat));setLon(String(place.lon));setPrecise(false);setManualOffset(false);setOffset('');setOpen(false);setError('')}
 function changeCoordinate(kind:'lat'|'lon',value:string){if(kind==='lat')setLat(value);else setLon(value);if(selected){setSelected(null);setManualOffset(true);setOffset('')}}
 const effectiveOffset=manualOffset?Number(offset):resolved.status==='ready'?resolved.offset:NaN;
 return <form className="birth-form" onSubmit={event=>{
  event.preventDefault();setError('');
  if(!precise&&!selected){setError('Choose your birthplace from the dropdown, or switch to precise coordinates.');setOpen(true);return}
  if(!lat||!lon){setError('Enter both latitude and longitude. Zero is a valid coordinate.');return}
  if(!Number.isFinite(effectiveOffset)||(manualOffset&&offset==='')){
   setError(manualOffset?'Enter the UTC offset at birth.':resolved.status==='ready'?'Check the UTC offset.':resolved.message);return;
  }
  const fields=new FormData(event.currentTarget);
  const submitter=(event.nativeEvent as SubmitEvent).submitter;
  try{
   onCreate({
    name:String(fields.get('name')??'').trim(),date,time,unknown,
    place:precise?placeName:placeLabel(selected!),lat:Number(lat),lon:Number(lon),offset:effectiveOffset,
   },submitter?.getAttribute('value')!=='report');
  }catch(err){setError((err as Error).message)}
 }}>
  <label>Name <small>optional</small><input name="name" maxLength={80} placeholder="Your name" autoComplete="given-name"/></label>
  <div className="input-row"><label>Date of birth<input name="date" type="date" value={date} onChange={e=>setDate(e.target.value)} min="1900-01-01" max={new Date().toISOString().slice(0,10)} required/></label><label>Time of birth<input name="time" type="time" value={time} onChange={e=>setTime(e.target.value)} required={!unknown} disabled={unknown}/></label></div>
  <label className="check"><input type="checkbox" checked={unknown} onChange={e=>setUnknown(e.target.checked)}/><span>I don’t know the exact time</span></label>
  {unknown&&<p className="form-help">We’ll use a labeled noon reference. Rising sign, houses and personalized readings need an exact time.</p>}
  {!precise?<div className="place-picker" ref={picker}><label htmlFor="birthplace-search">Place of birth</label><div className="place-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="birthplace-search" name="place" role="combobox" aria-autocomplete="list" aria-controls={open?'birthplace-options':undefined} aria-expanded={open} aria-activedescendant={open&&active>=0?`place-option-${active}`:undefined} value={query} placeholder="Search for a city or town" autoComplete="off" onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setSelected(null);setLat('');setLon('');setManualOffset(false);setOpen(true)}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(i=>Math.min(i+1,places.length-1))}else if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(i-1,0))}else if(e.key==='Enter'&&open&&active>=0&&places[active]){e.preventDefault();choose(places[active])}else if(e.key==='Escape'){setOpen(false);e.stopPropagation()}else if(e.key==='Tab')setOpen(false)}}/><button type="button" aria-label={open?'Close city dropdown':'Open city dropdown'} onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span>⌄</span></button></div>
   {open&&<div className="place-dropdown"><div className="place-dropdown-status">{searching?'Searching places…':query.trim().length<3?'Popular places · type to search worldwide':'Choose a matching place'}</div><ul id="birthplace-options" role="listbox" aria-label="Birthplace suggestions">{places.map((p,i)=><li key={p.id} role="option" id={`place-option-${i}`} aria-selected={active===i} className={active===i?'active':''} onPointerMove={()=>setActive(i)} onPointerDown={e=>e.preventDefault()} onClick={()=>choose(p)}><span className="place-pin" aria-hidden="true">↗</span><div><strong>{p.name}</strong><small>{[p.region,p.country].filter(Boolean).join(', ')}</small></div><span className="place-pick-arrow">↵</span></li>)}</ul>{!searching&&places.length===0&&<p className="place-empty">No matching places. Try a nearby city or use precise coordinates.</p>}{searchIssue&&<p className="place-empty" role="status">{searchIssue}</p>}<a className="geocoding-credit" href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">City search: Open-Meteo / GeoNames ↗</a></div>}
   {selected&&<div className="location-filled" role="status"><span>✓ Coordinates filled</span><small>{selected.lat.toFixed(4)}°, {selected.lon.toFixed(4)}°</small></div>}
  </div>:<div className="precise-fields"><label>Location label<input name="place" value={placeName} onChange={e=>setPlaceName(e.target.value)} required placeholder="Town, hospital, or village"/></label><div className="input-row"><label>Latitude °<input aria-label="Latitude" type="number" step="any" min="-66" max="66" required value={lat} onChange={e=>changeCoordinate('lat',e.target.value)} placeholder="12.2958"/></label><label>Longitude °<input aria-label="Longitude" type="number" step="any" min="-180" max="180" required value={lon} onChange={e=>changeCoordinate('lon',e.target.value)} placeholder="76.6394"/></label></div><p className="form-help">North/east are positive; south/west are negative. Supported latitude: 66° S to 66° N.</p></div>}
  <button className="form-text-button" type="button" onClick={()=>{setPrecise(v=>!v);setOpen(false);if(!selected){setManualOffset(true);setOffset('')}}}>{precise?'← Back to city dropdown':'Use precise coordinates instead ↗'}</button>
  {(selected||precise)&&<div className="timezone-line"><div><span>TIME ZONE AT BIRTH</span><strong>{manualOffset?'Manual UTC offset':selected?.timezone??'Choose an offset'}</strong>{!manualOffset&&resolved.status==='ready'&&<small>{formatOffset(resolved.offset)} · daylight-saving rules applied</small>}{!manualOffset&&resolved.status!=='ready'&&<small className={resolved.status==='missing'?'':'zone-warning'}>{resolved.message}</small>}</div>{selected&&<button type="button" onClick={()=>{setManualOffset(v=>!v);if(!manualOffset&&resolved.status==='ready')setOffset(String(resolved.offset))}}>{manualOffset&&selected?'Use automatic time zone' :'Set manually'}</button>}</div>}
  {manualOffset&&<label>UTC offset at birth <small>hours</small><input aria-label="UTC offset at birth" type="number" step="any" min="-14" max="14" required value={offset} onChange={e=>setOffset(e.target.value)} placeholder="e.g. 5.5 for UTC +05:30"/><small className="manual-offset-help">Use the offset on your birth date, including daylight saving. Enter 0 explicitly for UTC.</small></label>}
  <p className="form-error" role="alert">{error}</p>
  <div className="birth-actions">
   <button className="button birth-submit" type="submit" value="tour">Generate chart &amp; open 3D <span aria-hidden="true">↗</span></button>
   <button className="outline-button" type="submit" value="report">Open chart only</button>
  </div>
  <p className="form-help privacy-line">Chart calculation runs in your browser. City search sends only the place you type. Connected AI is optional.</p>
 </form>
}
