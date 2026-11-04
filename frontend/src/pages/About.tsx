import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ScholarDefinition from '../components/ScholarDefinition';

// About me, styled after the design concept (page 4) and wireframe 9. Guadalupe palette.
// The story is Lupe's own words; don't edit or reword it. The photo is frontend/public/lupe.jpg.
const PHOTO = {
  src: '/lupe.jpg',
  alt: 'Lupe at her graduation, smiling and holding her diploma, wearing a black dress with bright embroidered flowers and a red, white, and blue stole.',
};

const ROSE = '#A8394C';

export default function About() {
  return (
    <main style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 48px', alignItems: 'flex-start', maxWidth: 1080 }}>
      <div className="about-photo" style={{ flex: '0 1 300px', width: '100%' }}>
        <img
          src={PHOTO.src}
          alt={PHOTO.alt}
          width={900}
          height={1234}
          style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block', border: '2px solid #b08a3e' }}
        />
      </div>

      <article style={{ flex: '1 1 420px', minWidth: 0, maxWidth: '64ch' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5vw, 48px)', color: 'var(--accent)' }}>About me</h1>
        <p style={{ margin: '18px 0 0', fontFamily: 'var(--font-display)', fontSize: 26, color: ROSE }}>Hi, I’m Lupe!</p>

        <P>
          My journey with Catholicism actually started long before I could understand what faith really meant. It began
          with my mother, who had been drawn to the Catholic Church since her youth. She planted that first seed of faith
          in my life, although my upbringing wasn’t exactly what you would call traditionally Catholic.
        </P>
        <P>
          I wasn’t <ScholarDefinition term="baptism">baptized</ScholarDefinition> as a baby. I was around seven or eight
          years old, and while much of that day is fuzzy, there’s one moment I remember as clearly as if it happened
          yesterday.
        </P>
        <P>
          I remember standing in a church in Mexico, bowing my head as the priest poured water over me. As the water
          dripped into the bucket below, I remember seeing it turn a deep red, almost like blood, before becoming clear
          again as more water washed through it. No one else seemed to notice, not even the priest. I can’t explain what I
          saw, and I don’t expect everyone to believe it, but that moment has stayed with me throughout my life. In some of
          my hardest times, it’s been a memory I’ve held onto.
        </P>
        <P>
          Growing up, my relationship with Catholicism wasn’t always straightforward. There were people and experiences
          that pushed me away from the Church, and for a long time, I struggled to separate the actions of people from the
          faith itself.
        </P>
        <P>
          But as I got older, I began to understand something important to me: <strong>people are not God.</strong> People
          are imperfect. We misunderstand, judge, and sometimes use religion in ways that contradict the very teachings we
          claim to follow. Even in biblical history, we see people so focused on their own interpretations and traditions
          that they failed to recognize what was right in front of them.
        </P>
        <P>That realization changed how I approached faith.</P>
        <P>
          Like many people growing up in America, I explored other religions, beliefs, and philosophies. I wanted to
          understand not just <em>what</em> people believed, but <em>why</em>. What made something true? How did these
          beliefs begin? Who recorded them? What evidence survived? And how much of what we practice today comes from God
          versus the systems humanity built around religion?
        </P>
        <P>
          I’ve always had a curious, somewhat nerdy mind. I love science, history, technology, and asking questions that
          don’t always have simple answers. Rather than accepting something just because I was told to, I wanted to dig
          deeper.
        </P>
        <P>Eventually, that curiosity brought me back to Catholicism.</P>
        <P>
          Part of it was history. Jesus of Nazareth wasn’t simply a character in a story; he was a real historical figure.
          But another part was much more personal. I kept thinking about that little kid in the church in Mexico, and the
          belief that despite my mistakes, my struggles, and everything I’ve done or experienced, there is a God who still
          believes I am worth saving.
        </P>
        <P>
          <strong>
            I don’t have every answer. I still have questions and doubts. But I’ve come to realize that my questions aren’t
            necessarily about doubting God. They’re often about trying to understand humanity, our history, and how we’ve
            interpreted His word.
          </strong>
        </P>
        <P>And that’s part of why I’m building this project.</P>

        <H2>Why the nerdy side matters</H2>
        <P>I’m also a software engineer, and I believe faith and intellectual curiosity don’t have to be enemies.</P>
        <P>
          I wanted to create something for people like me: those who believe but still question, those who have walked
          away and are curious about returning, and even those who don’t believe but simply want to understand the history
          behind Christianity and Catholicism.
        </P>
        <P>
          I want people to be able to explore biblical events alongside historical timelines, archaeological discoveries,
          geography, and the cultures that shaped the world of the Bible.
        </P>
        <P>
          Not to pretend that every question has a definitive answer, or that faith can be proven through science alone,
          but to make room for both belief and honest investigation.
        </P>
        <P>
          Because sometimes understanding <em>when, where, how, and why</em> something happened can completely change the
          way we read a story we’ve heard our entire lives.
        </P>

        <H2>What I’m working on next</H2>
        <P>
          Right now, I’m combining my love for software engineering, history, and Catholicism to build an interactive
          platform that makes exploring faith more accessible.
        </P>
        <P>
          My goal is to bring together biblical timelines, historical context, interactive maps, daily Catholic readings,
          and guided learning experiences into one place.
        </P>
        <P>
          I want this to be a space where curiosity is encouraged, questions are welcomed, and people can explore at their
          own pace, regardless of where they are in their faith journey.
        </P>
        <P>I’m still learning, both as a developer and as a Catholic. This project is part of that learning process.</P>
        <P>
          And if it helps even one person reconnect with their faith, discover something they never knew, or feel
          comfortable asking a question they’ve been afraid to ask, then I believe it’s worth building.
        </P>
        <P>
          <strong>
            After all, my own journey started with a seed planted by my mother, a memory from when I was eight, and a
            lifetime of questions.
          </strong>
        </P>
        <p style={{ margin: '18px 0 0', fontFamily: 'var(--font-display)', fontSize: 24, color: ROSE }}>
          Maybe this can be a starting point for someone else.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
          <Link className="button" to="/contact">Get in touch</Link>
          <a className="button button--outline" href="/#how" style={{ color: ROSE, borderColor: ROSE }}>
            How this site works
          </a>
        </div>
      </article>
    </main>
  );
}

const paragraph: CSSProperties = { margin: '16px 0 0', fontSize: 19, lineHeight: 1.65 };

function P({ children }: { children: ReactNode }) {
  return <p style={paragraph}>{children}</p>;
}

function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ margin: '40px 0 0', fontSize: 30, color: 'var(--accent)' }}>{children}</h2>;
}
