import { BookOpen, Church, Cross, type LucideIcon } from 'lucide-react';

// Shared across the whole site via `ScholarDefinition`, the same pattern as Quantum Lab's
// GLOSSARY: every entry has an icon and a `moreInfo` so "Learn more" always has something to
// expand into. `url` is new here: the source a reader can follow for the full story.
//
// Draft text: check every definition against Church sources before launch.

export interface GlossaryEntry {
  term: string;
  definition: string;
  moreInfo: string;
  icon: LucideIcon;
  url?: string;
  sourceLabel?: string;
}

export const GLOSSARY = {
  mass: {
    term: 'Mass',
    definition: 'The Catholic Church’s central act of worship, where Scripture is read and the Eucharist is celebrated.',
    moreInfo: 'The name comes from the Latin words that end the liturgy, “Ite, missa est,” roughly “Go, it is sent.” Catholics are asked to attend every Sunday and on holy days.',
    icon: Cross,
    url: 'https://en.wikipedia.org/wiki/Mass_in_the_Catholic_Church',
  },
  psalm: {
    term: 'Psalm',
    definition: 'A sacred song or prayer from the Book of Psalms in the Old Testament. At Mass one is usually sung, and everyone repeats a short response.',
    moreInfo: 'The Psalms were ancient Israel’s prayer book and hymnal, and Jesus himself prayed them. The Douay-Rheims numbers most of them one lower than modern Bibles.',
    icon: BookOpen,
    url: 'https://en.wikipedia.org/wiki/Psalms',
  },
  gospel: {
    term: 'Gospel',
    definition: 'A reading from one of the four accounts of Jesus’s life: Matthew, Mark, Luke, or John. Everyone stands to hear it.',
    moreInfo: 'The word means “good news.” Because it presents Christ’s own words and deeds, the Gospel is proclaimed by a priest or deacon.',
    icon: BookOpen,
    url: 'https://en.wikipedia.org/wiki/Gospel',
  },
  homily: {
    term: 'Homily',
    definition: 'A talk by the priest or deacon that explains the Scripture readings and invites people to live them.',
    moreInfo: 'A homily isn’t a lecture: its job is to connect the day’s readings to everyday life. At Mass, only a priest or deacon gives it.',
    icon: BookOpen,
    url: 'https://usccb.org/sites/default/files/flipbooks/catechism/884',
    sourceLabel: 'Catechism glossary (USCCB)',
  },
  consecrated: {
    term: 'Consecrated',
    definition: 'Made holy. Catholics believe that at the consecration, the bread and wine become the Body and Blood of Christ.',
    moreInfo: 'It happens during the Eucharistic Prayer, when the priest repeats Jesus’s words from the Last Supper: “This is my Body” and “This is my Blood.”',
    icon: Cross,
    url: 'https://en.wikipedia.org/wiki/Eucharist_in_the_Catholic_Church',
  },
  ourFather: {
    term: 'Our Father',
    definition: 'The prayer Jesus taught his disciples, also called the Lord’s Prayer. Everyone prays it together.',
    moreInfo: 'It appears in two Gospels, Matthew 6:9–13 and Luke 11:2–4. At Mass it comes after the Eucharistic Prayer, just before the sign of peace.',
    icon: Cross,
    url: 'https://en.wikipedia.org/wiki/Lord%27s_Prayer',
  },
  communion: {
    term: 'Communion',
    definition: 'Receiving the Eucharist, which Catholics believe is truly the Body and Blood of Christ.',
    moreInfo: 'The word means “union with.” The minister says “The Body of Christ,” and the person receiving answers “Amen,” in the hand or on the tongue.',
    icon: Cross,
    url: 'https://en.wikipedia.org/wiki/Eucharist_in_the_Catholic_Church',
  },
  parish: {
    term: 'Parish',
    definition: 'A local Catholic community and its church, led by a pastor.',
    moreInfo: 'Catholics usually belong to the parish where they live, and that is where they go for sacraments like baptism and marriage.',
    icon: Church,
    url: 'https://en.wikipedia.org/wiki/Parish',
  },
  pew: {
    term: 'Pew',
    definition: 'The long benches where people sit during Mass.',
    moreInfo: 'Many pews have a padded kneeler that folds down from the pew in front of you, for the moments when everyone kneels.',
    icon: Church,
  },
  genuflect: {
    term: 'Genuflect',
    definition: 'To touch your right knee to the floor as a sign of adoration, especially toward the tabernacle.',
    moreInfo: 'If kneeling is hard for you, a bow from the waist shows the same reverence.',
    icon: Church,
    url: 'https://en.wikipedia.org/wiki/Genuflection',
  },
  tabernacle: {
    term: 'Tabernacle',
    definition: 'The locked box, often gold, where the consecrated hosts are kept after Mass.',
    moreInfo: 'The name comes from the tent where God dwelt among the Israelites in the Book of Exodus. A lamp, often red, burns beside it as a sign that Christ is present.',
    icon: Church,
    url: 'https://en.wikipedia.org/wiki/Church_tabernacle',
  },
  fast: {
    term: 'Fast',
    definition: 'Going without food or drink, except water and medicine, for one hour before receiving Communion.',
    moreInfo: 'The elderly, the sick, and the people who care for them don’t need to keep this fast.',
    icon: Cross,
    url: 'https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass/liturgy-of-the-eucharist/guidelines-for-the-reception-of-communion',
    sourceLabel: 'US bishops’ Communion guidelines',
  },
  patriarchs: {
    term: "Patriarchs",
    definition: "Abraham, Isaac, and Jacob, the founding fathers of Israel whose stories are told in Genesis.",
    moreInfo: "Jacob’s twelve sons gave their names to the twelve tribes of Israel. Their dates are uncertain, so the timeline shows them as ranges.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Patriarchs_(Bible)",
  },
  douayRheims: {
    term: "Douay-Rheims",
    definition: "An English Catholic Bible translated from the Latin Vulgate in the late 1500s and early 1600s, and revised by Bishop Richard Challoner in the 1750s.",
    moreInfo: "It has all 73 books of the Catholic Bible. Because it is in the public domain, this site can show every verse for free.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Douay%E2%80%93Rheims_Bible",
  },
  publicDomain: {
    term: "Public domain",
    definition: "Writing whose copyright has run out or never existed, so anyone may share it freely.",
    moreInfo: "Most modern Bible translations are still under copyright, which is why the site shows an older translation it can share in full.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Public_domain",
  },
  eucharisticMiracle: {
    term: "Eucharistic miracle",
    definition: "An event in which consecrated bread or wine is reported to show a visible sign, such as flesh or blood, pointing to Christ’s presence.",
    moreInfo: "Catholics believe Christ is truly present in every Eucharist, miracle or not. These events are rare, and each is judged by the local bishop.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Eucharistic_miracle",
  },
  canonized: {
    term: "Canonized",
    definition: "Officially declared a saint by the Pope, after a long investigation of the person’s life.",
    moreInfo: "Usually two miracles attributed to the person’s prayers are needed, one for beatification and one for canonization. Martyrs need only the second.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Canonization",
  },
  deuterocanonical: {
    term: "Deuterocanonical",
    definition: "Seven Old Testament books in Catholic Bibles but not in most Protestant ones: Tobit, Judith, 1 and 2 Maccabees, Wisdom, Sirach, and Baruch.",
    moreInfo: "They survive mainly in Greek and were part of the Bible the early Church used. The Council of Trent confirmed them in 1546.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Deuterocanonical_books",
  },
  catechism: {
    term: "Catechism",
    definition: "The Catechism of the Catholic Church: the official summary of what the Church believes, published in 1992.",
    moreInfo: "Its paragraphs are numbered, so teachings can be cited exactly, like Catechism 1673 on exorcism.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Catechism_of_the_Catholic_Church",
  },
  exorcism: {
    term: "Exorcism",
    definition: "A prayer in Jesus’s name asking that a person be protected or freed from the power of evil.",
    moreInfo: "A simple exorcism is part of every baptism. The formal rite for possession may be performed only by a priest with his bishop’s permission.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Exorcism_in_the_Catholic_Church",
  },
  romanRitual: {
    term: "Roman Ritual",
    definition: "The Church’s official book of prayers and ceremonies for sacraments and blessings outside of Mass.",
    moreInfo: "It was first published in 1614 under Pope Paul V, and its rite of exorcism stayed in use until the 1999 revision.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Roman_Ritual",
  },
  stMichaelPrayer: {
    term: "Prayer to St. Michael",
    definition: "A short prayer asking St. Michael the Archangel to defend us in the battle against evil.",
    moreInfo: "Pope Leo XIII added it to the prayers said after Low Mass in the 1880s, and many parishes pray it again today.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Prayer_to_Saint_Michael",
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryTerm = keyof typeof GLOSSARY;
