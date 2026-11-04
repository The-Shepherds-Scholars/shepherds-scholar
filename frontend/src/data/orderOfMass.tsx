import type { ReactNode } from 'react';
import ScholarDefinition from '../components/ScholarDefinition';

// The Order of Mass, step by step, for the Guide to Mass page.
//
// Prayer texts and copyright:
//   - Short dialogue lines ("The Lord be with you." / "And with your spirit.") are quoted from the
//     English translation of The Roman Missal, © 2010 ICEL, with the credit shown on the page.
//   - Longer prayers (the Confiteor, Gloria, Creed, Holy Holy, and others) show only their opening
//     words and link to the full official text on the USCCB's Order of Mass page. Publishing them in
//     full needs permission from ICEL.
//   - The Sign of the Cross and the traditional Our Father are public domain and shown in full.
// Postures follow the usual practice in the United States; parishes vary a little.
// Descriptions are a DRAFT, written with AI help: check them against the General Instruction of the
// Roman Missal and with a priest before launch.

export const ORDER_OF_MASS_URL = 'https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass';

export type Posture = 'Stand' | 'Sit' | 'Kneel' | 'Stand, then kneel' | 'Kneel, then stand' | 'Come forward or stay in your pew';

export interface Line {
  who: 'Priest' | 'Deacon or priest' | 'Reader' | 'Everyone' | 'You';
  text: string;
}

export interface Step {
  name: string;
  begins?: string; // a sub-section that starts at this step, e.g. "Communion Rite"
  posture: Posture;
  when?: string; // only some Masses
  about: ReactNode;
  lines?: Line[];
  fullText?: string[]; // public-domain prayers, shown in full
  opening?: string; // first words of a longer copyrighted prayer
  scripture?: string; // where the words come from
}

export interface Part {
  name: string;
  steps: Step[];
}

const D = ScholarDefinition;

export const ORDER_OF_MASS: Part[] = [
  {
    name: 'Introductory Rites',
    steps: [
      {
        name: 'Entrance',
        posture: 'Stand',
        about: <>Everyone stands and usually sings as the priest and ministers walk in. The priest kisses the altar.</>,
      },
      {
        name: 'Sign of the Cross',
        posture: 'Stand',
        about: <>Everyone makes the Sign of the Cross: right hand to forehead, chest, left shoulder, then right shoulder.</>,
        fullText: ['In the name of the Father, and of the Son, and of the Holy Spirit.', 'Amen.'],
      },
      {
        name: 'Greeting',
        posture: 'Stand',
        about: <>The priest greets everyone. There are a few forms; this is the most common.</>,
        lines: [
          { who: 'Priest', text: 'The Lord be with you.' },
          { who: 'Everyone', text: 'And with your spirit.' },
        ],
      },
      {
        name: 'Penitential Act',
        posture: 'Stand',
        about: <>A moment of silence to call to mind our sins and ask God’s mercy, often with a prayer of confession said together.</>,
        opening: 'I confess to almighty God and to you, my brothers and sisters…',
      },
      {
        name: 'Lord, have mercy',
        posture: 'Stand',
        about: <>The <D term="kyrie">Kyrie</D>: the priest or cantor says each line and everyone repeats it.</>,
        lines: [
          { who: 'Everyone', text: 'Lord, have mercy.' },
          { who: 'Everyone', text: 'Christ, have mercy.' },
          { who: 'Everyone', text: 'Lord, have mercy.' },
        ],
      },
      {
        name: 'Glory to God',
        posture: 'Stand',
        when: 'Sundays outside Advent and Lent, solemnities, and feasts',
        about: <>The <D term="gloria">Gloria</D>, a hymn of praise, said or sung together.</>,
        opening: 'Glory to God in the highest, and on earth peace to people of good will…',
        scripture: 'Luke 2:14',
      },
      {
        name: 'Opening Prayer',
        posture: 'Stand',
        about: <>The priest says “Let us pray,” pauses, and prays the <D term="collect">Collect</D>, the prayer of the day. Everyone answers:</>,
        lines: [{ who: 'Everyone', text: 'Amen.' }],
      },
    ],
  },
  {
    name: 'Liturgy of the Word',
    steps: [
      {
        name: 'First Reading',
        posture: 'Sit',
        about: <>Usually from the Old Testament. At the end:</>,
        lines: [
          { who: 'Reader', text: 'The word of the Lord.' },
          { who: 'Everyone', text: 'Thanks be to God.' },
        ],
      },
      {
        name: 'Responsorial Psalm',
        posture: 'Sit',
        about: <>A <D term="psalm">Psalm</D> is sung or read. Everyone repeats the short response after each verse.</>,
      },
      {
        name: 'Second Reading',
        posture: 'Sit',
        when: 'Sundays and solemnities',
        about: <>Usually from one of the New Testament letters, ending the same way.</>,
        lines: [
          { who: 'Reader', text: 'The word of the Lord.' },
          { who: 'Everyone', text: 'Thanks be to God.' },
        ],
      },
      {
        name: 'Gospel Acclamation',
        posture: 'Stand',
        about: <>Everyone stands and sings the <D term="alleluia">Alleluia</D> to welcome the Gospel. During <D term="lent">Lent</D> another acclamation is sung instead.</>,
      },
      {
        name: 'Gospel',
        posture: 'Stand',
        about: (
          <>
            A deacon or priest reads the <D term="gospel">Gospel</D>. At “Glory to you, O Lord,” people trace a small cross
            on their forehead, lips, and heart.
          </>
        ),
        lines: [
          { who: 'Deacon or priest', text: 'The Lord be with you.' },
          { who: 'Everyone', text: 'And with your spirit.' },
          { who: 'Deacon or priest', text: 'A reading from the holy Gospel according to N.' },
          { who: 'Everyone', text: 'Glory to you, O Lord.' },
          { who: 'Deacon or priest', text: 'The Gospel of the Lord.' },
          { who: 'Everyone', text: 'Praise to you, Lord Jesus Christ.' },
        ],
      },
      {
        name: 'Homily',
        posture: 'Sit',
        about: <>The priest or deacon gives the <D term="homily">homily</D>, explaining the readings and how to live them.</>,
      },
      {
        name: 'Profession of Faith',
        posture: 'Stand',
        when: 'Sundays and solemnities',
        about: (
          <>
            Everyone says the <D term="creed">Creed</D> together. At the words about Jesus becoming man, everyone bows
            (and kneels on Christmas and the Annunciation).
          </>
        ),
        opening: 'I believe in one God, the Father almighty, maker of heaven and earth…',
      },
      {
        name: 'Prayer of the Faithful',
        posture: 'Stand',
        about: <>The <D term="universalPrayer">Universal Prayer</D>: prayers for the Church, the world, and people in need. After each, everyone answers, often:</>,
        lines: [{ who: 'Everyone', text: 'Lord, hear our prayer.' }],
      },
    ],
  },
  {
    name: 'Liturgy of the Eucharist',
    steps: [
      {
        name: 'Preparation of the Gifts',
        posture: 'Sit',
        about: <>The collection is taken, and bread and wine are brought to the altar. If the priest’s prayers are said aloud, everyone answers:</>,
        lines: [{ who: 'Everyone', text: 'Blessed be God for ever.' }],
      },
      {
        name: 'Pray, brethren',
        posture: 'Stand',
        about: <>The priest invites everyone to pray that the sacrifice will be acceptable to God. Everyone stands and answers:</>,
        opening: 'May the Lord accept the sacrifice at your hands…',
      },
      {
        name: 'Prayer over the Offerings',
        posture: 'Stand',
        about: <>The priest prays over the bread and wine.</>,
        lines: [{ who: 'Everyone', text: 'Amen.' }],
      },
      {
        name: 'Preface Dialogue',
        posture: 'Stand',
        about: <>The <D term="eucharisticPrayer">Eucharistic Prayer</D> begins with this exchange:</>,
        lines: [
          { who: 'Priest', text: 'The Lord be with you.' },
          { who: 'Everyone', text: 'And with your spirit.' },
          { who: 'Priest', text: 'Lift up your hearts.' },
          { who: 'Everyone', text: 'We lift them up to the Lord.' },
          { who: 'Priest', text: 'Let us give thanks to the Lord our God.' },
          { who: 'Everyone', text: 'It is right and just.' },
        ],
      },
      {
        name: 'Holy, Holy, Holy',
        posture: 'Stand, then kneel',
        about: <>The <D term="sanctus">Sanctus</D>, sung together. Afterward, everyone kneels.</>,
        opening: 'Holy, Holy, Holy Lord God of hosts…',
        scripture: 'Isaiah 6:3; Matthew 21:9',
      },
      {
        name: 'Consecration',
        posture: 'Kneel',
        about: (
          <>
            The priest says Jesus’s words from the Last Supper, and the bread and wine are{' '}
            <D term="consecrated">consecrated</D>. The priest raises the Host, then the chalice. Many people look up in
            silence, or pray quietly, “My Lord and my God.”
          </>
        ),
      },
      {
        name: 'Mystery of Faith',
        posture: 'Kneel',
        about: <>The <D term="mysteryOfFaith">acclamation</D> after the consecration. The priest says “The mystery of faith,” and everyone answers with one of three responses, such as:</>,
        opening: 'We proclaim your Death, O Lord, and profess your Resurrection…',
      },
      {
        name: 'Great Amen',
        posture: 'Kneel, then stand',
        about: <>The Eucharistic Prayer ends with the priest raising the Host and chalice. Everyone sings the <D term="greatAmen">Great Amen</D>:</>,
        lines: [{ who: 'Everyone', text: 'Amen.' }],
      },
      {
        name: 'The Lord’s Prayer',
        begins: 'Communion Rite',
        posture: 'Stand',
        about: (
          <>
            Everyone prays the <D term="ourFather">Our Father</D> together. Catholics pause before “For the kingdom…”: the
            priest prays alone first, then everyone finishes together.
          </>
        ),
        fullText: [
          'Our Father, who art in heaven, hallowed be thy name;',
          'thy kingdom come, thy will be done on earth as it is in heaven.',
          'Give us this day our daily bread,',
          'and forgive us our trespasses, as we forgive those who trespass against us;',
          'and lead us not into temptation, but deliver us from evil.',
        ],
        lines: [{ who: 'Everyone', text: 'For the kingdom, the power and the glory are yours now and for ever.' }],
        scripture: 'Matthew 6:9–13',
      },
      {
        name: 'Sign of Peace',
        posture: 'Stand',
        about: <>The <D term="signOfPeace">Sign of Peace</D>. People then turn to those nearby with a handshake or nod and say “Peace be with you.”</>,
        lines: [
          { who: 'Priest', text: 'The peace of the Lord be with you always.' },
          { who: 'Everyone', text: 'And with your spirit.' },
        ],
      },
      {
        name: 'Lamb of God',
        posture: 'Stand, then kneel',
        about: <>The <D term="agnusDei">Agnus Dei</D> is sung while the priest breaks the Host. Afterward, everyone kneels.</>,
        opening: 'Lamb of God, you take away the sins of the world…',
        scripture: 'John 1:29',
      },
      {
        name: 'Invitation to Communion',
        posture: 'Kneel',
        about: <>The priest raises the Host and says, “Behold the Lamb of God…” Everyone answers together:</>,
        opening: 'Lord, I am not worthy that you should enter under my roof…',
        scripture: 'Matthew 8:8',
      },
      {
        name: 'Communion',
        posture: 'Come forward or stay in your pew',
        about: (
          <>
            Catholics who are prepared come forward to receive <D term="communion">Communion</D>. Bow your head before
            receiving. If you aren’t receiving, you are welcome to stay in your pew and pray, or, where the parish invites
            it, to come forward with arms crossed over your chest for a blessing.
          </>
        ),
        lines: [
          { who: 'Priest', text: 'The Body of Christ.' },
          { who: 'You', text: 'Amen.' },
        ],
      },
      {
        name: 'Prayer after Communion',
        posture: 'Stand',
        about: <>After a time of quiet prayer, sitting or kneeling, everyone stands for the closing prayer.</>,
        lines: [{ who: 'Everyone', text: 'Amen.' }],
      },
    ],
  },
  {
    name: 'Concluding Rites',
    steps: [
      {
        name: 'Blessing',
        posture: 'Stand',
        about: <>The priest blesses everyone, and people make the Sign of the Cross.</>,
        lines: [
          { who: 'Priest', text: 'May almighty God bless you, the Father, and the Son, and the Holy Spirit.' },
          { who: 'Everyone', text: 'Amen.' },
        ],
      },
      {
        name: 'Dismissal',
        posture: 'Stand',
        about: <>The <D term="dismissal">dismissal</D> sends everyone out to live what they have received. Most people stay for the closing song.</>,
        lines: [
          { who: 'Deacon or priest', text: 'Go forth, the Mass is ended.' },
          { who: 'Everyone', text: 'Thanks be to God.' },
        ],
      },
    ],
  },
];
