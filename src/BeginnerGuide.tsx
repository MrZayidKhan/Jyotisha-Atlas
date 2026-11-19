import KnowledgeLibrary from './KnowledgeLibrary';

const concepts = [
    { title: 'Lagna and bhava', text: 'Lagna is the rising sign at the recorded birth time. In the whole-sign system Atlas uses, that sign is the first bhava (house). Houses organize the chart into areas of life. An unknown birth time leaves the rising sign and houses unavailable.' },
    { title: 'Graha and rashi', text: 'A graha is one of the bodies or points used in Jyotisha. A rashi is a 30-degree zodiac sign. For example, Chandra in Vrishabha means the Moon falls in Taurus in Atlas’s sidereal calculation.' },
    { title: 'Rahu and Ketu', text: 'These are mathematical points where the Moon’s orbit crosses the plane of Earth’s orbit, called the lunar nodes. They sit opposite each other. Atlas uses the mean positions of the nodes.' },
    { title: 'Nakshatra and pada', text: 'The sidereal zodiac is divided into 27 nakshatras, or lunar mansions. Each has four quarters called padas. The chart summary shows the nakshatra and pada containing your Moon.' },
    { title: 'Dasha and antardasha', text: 'Vimshottari dasha is a traditional timing system that begins from the Moon’s birth nakshatra. A mahadasha is a major period and an antardasha is a shorter period within it. Read the timeline as a traditional framework for reflection.' },
    { title: 'Yogas and schools', text: 'A yoga is a named pattern formed by placements or relationships in the chart. Parashara and Jaimini use different interpretive rules. Atlas shows the basis for the patterns it identifies so you can compare them.' },
];

export default function BeginnerGuide() {
    return <>
        <section id="guide" className="beginner-guide wrap">
            <h1>A beginner’s guide to Jyotisha</h1>
            <p className="guide-intro">Jyotisha is an Indian astrological tradition. Atlas calculates a sidereal birth chart and explains how the tradition interprets its placements. Treat interpretations as cultural context and prompts for reflection.</p>
            <h2>Start with your chart</h2>
            <ol className="guide-steps">
                <li>Enter your birth date, local time, and city. Choose “Time unknown” if you only know the date.</li>
                <li>Read your rising sign and Moon nakshatra in the summary. Select a graha in the chart or table to see its details.</li>
                <li>Use the 3D observatory to explore placements. Open the birthplace horizon to see where bodies were relative to the local horizon at the chart’s reference time.</li>
            </ol>
            <h2>What the terms mean</h2>
            <dl className="guide-concepts">
                {concepts.map(({title,text})=><div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}
            </dl>
            <p className="guide-intro">If your birth time is unknown, Atlas uses local noon as a reference and shows the range across the day. Read those placements with care near sign and nakshatra boundaries.</p>
            <div className="guide-actions"><a className="button" href="#birth-details">Create chart</a><a className="source" href="/GUIDE.md">Read the technical guide</a></div>
        </section>
        <KnowledgeLibrary/>
    </>;
}
