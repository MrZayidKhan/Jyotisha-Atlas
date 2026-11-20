import { assetUrl } from './assetUrl';
export default function HomeHero({preview}:{preview:()=>void}){
 return <section className="home-hero wrap">
  <div className="home-hero-copy">
   <h1>Explore the sky<br/><em>at your birth.</em></h1>
   <p className="home-lede">Create your Jyotisha birth chart, fly through your planetary placements, and see how each traditional reading is calculated.</p>
   <div className="home-actions">
    <a className="button" href="#birth-details">Create my birth chart</a>
    <button className="home-play" onClick={preview}>Explore a sample sky</button>
   </div>
  </div>
  <figure className="home-moon-scene">
   <div className="home-moon-halo"/>
   <img src={assetUrl('assets/moon-nearside-960.webp')}
    srcSet={[assetUrl('assets/moon-nearside-480.webp') + ' 480w', assetUrl('assets/moon-nearside-960.webp') + ' 960w', assetUrl('assets/moon-nearside-1600.webp') + ' 1600w'].join(', ')}
    sizes="(max-width: 760px) 330px, 470px"
    alt="The lunar near side, photographed by NASA’s Lunar Reconnaissance Orbiter"
    width="1600" height="1554" fetchPriority="high"/>
   <figcaption className="hero-image-credit">LUNAR NEAR SIDE · NASA LRO</figcaption>
  </figure>
 </section>;
}
