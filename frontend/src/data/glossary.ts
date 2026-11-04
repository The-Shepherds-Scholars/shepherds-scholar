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

  // ---- Daily readings and the Church's year -------------------------------------------------
  usccb: {
    term: "USCCB",
    definition: "The United States Conference of Catholic Bishops, the assembly of the Catholic bishops of the United States.",
    moreInfo: "Its website publishes the readings for every day’s Mass. The reading text is copyrighted, so this site shows only the references and links there.",
    icon: Church,
    url: "https://www.usccb.org",
    sourceLabel: "USCCB",
  },
  lectionary: {
    term: "Lectionary",
    definition: "The book of Scripture readings used at Mass, arranged for every day of the Church’s year.",
    moreInfo: "Sundays follow a three-year cycle and weekdays a two-year cycle, so over time much of the Bible is read aloud at Mass.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Lectionary",
  },
  alleluia: {
    term: "Alleluia",
    definition: "A Hebrew word meaning “Praise the Lord,” sung just before the Gospel to welcome it.",
    moreInfo: "It comes with a short verse from Scripture. During Lent the Alleluia is not sung, and another acclamation takes its place.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Alleluia",
  },
  ordinaryTime: {
    term: "Ordinary Time",
    definition: "The parts of the Church’s year outside its major seasons, when the weeks are simply counted.",
    moreInfo: "“Ordinary” comes from “ordinal,” meaning counted, as in the Thirty-first Week. Its color is green.",
    icon: Church,
    url: "https://en.wikipedia.org/wiki/Ordinary_Time",
  },
  advent: {
    term: "Advent",
    definition: "The four weeks before Christmas, when the Church prepares to celebrate Jesus’s birth and looks ahead to his return.",
    moreInfo: "It begins the Church’s year. Its color is violet, with rose on the third Sunday.",
    icon: Church,
    url: "https://en.wikipedia.org/wiki/Advent",
  },
  lent: {
    term: "Lent",
    definition: "The forty days before Easter, a season of prayer, fasting, and giving to the poor.",
    moreInfo: "It begins on Ash Wednesday. Its color is violet.",
    icon: Church,
    url: "https://en.wikipedia.org/wiki/Lent",
  },
  solemnity: {
    term: "Solemnity",
    definition: "The highest rank of celebration in the Church’s calendar, such as Christmas, Easter, or All Saints.",
    moreInfo: "Below it come feasts, then memorials. A solemnity has its own readings and the Gloria and Creed at Mass.",
    icon: Church,
    url: "https://en.wikipedia.org/wiki/Solemnity",
  },
  feast: {
    term: "Feast",
    definition: "A celebration in the Church’s calendar ranked between a solemnity and a memorial, such as the feast of an apostle.",
    moreInfo: "A feast has its own readings. The Gloria is sung, but the Creed is usually not said on a weekday feast.",
    icon: Church,
    url: "https://en.wikipedia.org/wiki/Feast_day",
  },
  memorial: {
    term: "Memorial",
    definition: "A day in the Church’s calendar that honors a saint, the lowest rank of celebration.",
    moreInfo: "Some memorials are required and some are optional. The day’s weekday readings are often still used.",
    icon: Church,
    url: "https://en.wikipedia.org/wiki/Memorial_(liturgy)",
  },

  baptism: {
    term: "Baptism",
    definition: "The first sacrament, in which a person is washed with water in the name of the Father, the Son, and the Holy Spirit, and becomes a member of the Church.",
    moreInfo: "Many Catholics are baptized as babies, but children and adults can be baptized at any age.",
    icon: Cross,
    url: "https://www.vatican.va/archive/ENG0015/__P3E.HTM",
    sourceLabel: "Catechism of the Catholic Church",
  },

  // ---- The order of Mass ------------------------------------------------------------------------
  kyrie: {
    term: "Kyrie",
    definition: "“Lord, have mercy”: a short prayer asking for God’s mercy, near the start of Mass.",
    moreInfo: "Kyrie eleison is Greek for “Lord, have mercy.” It is one of the oldest prayers in the Mass and is sometimes still sung in Greek.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Kyrie",
  },
  gloria: {
    term: "Gloria",
    definition: "“Glory to God in the highest”: a hymn of praise sung or said near the start of Mass.",
    moreInfo: "It begins with the angels’ song at Jesus’s birth (Luke 2:14). It is left out during Advent and Lent.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Gloria_in_excelsis_Deo",
  },
  collect: {
    term: "Collect",
    definition: "The opening prayer of the Mass, which “collects” everyone’s prayers into one. It changes with the day.",
    moreInfo: "The priest invites everyone to pray, pauses for silent prayer, then says the Collect aloud.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Collect",
  },
  creed: {
    term: "Creed",
    definition: "A summary of what Christians believe. At Sunday Mass it is usually the Nicene Creed, from the councils of 325 and 381.",
    moreInfo: "The shorter Apostles’ Creed may be used instead, especially during Lent and Easter.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Nicene_Creed",
  },
  universalPrayer: {
    term: "Universal Prayer",
    definition: "Also called the Prayer of the Faithful: prayers for the Church, the world, people in need, and the local community.",
    moreInfo: "A deacon, reader, or cantor reads each request, and everyone answers together.",
    icon: Cross,
  },
  eucharisticPrayer: {
    term: "Eucharistic Prayer",
    definition: "The great prayer of thanks at the heart of the Mass, during which the bread and wine are consecrated.",
    moreInfo: "There are several approved Eucharistic Prayers. Each recalls the Last Supper and ends with the Great Amen.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Eucharistic_Prayer",
  },
  sanctus: {
    term: "Sanctus",
    definition: "“Holy, Holy, Holy”: a hymn sung by everyone during the Eucharistic Prayer.",
    moreInfo: "It joins the angels’ song in Isaiah 6:3 with the crowd’s welcome of Jesus into Jerusalem in Matthew 21:9.",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Sanctus",
  },
  mysteryOfFaith: {
    term: "Mystery of Faith",
    definition: "The acclamation right after the consecration, proclaiming Jesus’s death and resurrection.",
    moreInfo: "There are three approved responses, and the priest or music leader chooses one.",
    icon: Cross,
  },
  greatAmen: {
    term: "Great Amen",
    definition: "The “Amen” everyone sings at the end of the Eucharistic Prayer, saying yes to all that was prayed.",
    moreInfo: "It is called “great” because it seals the whole Eucharistic Prayer, and it is often sung more than once.",
    icon: Cross,
  },
  signOfPeace: {
    term: "Sign of Peace",
    definition: "A gesture of peace shared with people nearby before Communion, often a handshake or a nod.",
    moreInfo: "Customs vary by place. A nod or a small bow is always fine.",
    icon: Cross,
  },
  agnusDei: {
    term: "Agnus Dei",
    definition: "“Lamb of God”: a prayer sung while the priest breaks the consecrated Host before Communion.",
    moreInfo: "It echoes John the Baptist pointing to Jesus as “the Lamb of God” (John 1:29).",
    icon: Cross,
    url: "https://en.wikipedia.org/wiki/Agnus_Dei",
  },
  dismissal: {
    term: "Dismissal",
    definition: "The last words of the Mass, sending everyone out to live what they have received.",
    moreInfo: "The word Mass itself comes from the Latin dismissal, “Ite, missa est.”",
    icon: Cross,
  },

  // ---- The then-and-now map ---------------------------------------------------------------------
  romanEra: {
    term: "Roman era",
    definition: "The centuries when Rome ruled the Holy Land, from 63 BC, when the general Pompey took Jerusalem, into the early Church.",
    moreInfo: "The Roman-era map shows the region in Latin, as Roman maps named it: Hierosolyma for Jerusalem, Mare Galilaeae for the Sea of Galilee.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Judaea_(Roman_province)",
  },
  stadia: {
    term: "Stadia",
    definition: "A Greek and Roman unit of distance. One stadion was about 185 meters, so 60 stadia is roughly 11 km (7 miles).",
    moreInfo: "The exact length varied from place to place, which is one reason distances in ancient texts are hard to pin down.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Stadion_(unit)",
  },
  crusades: {
    term: "Crusades",
    definition: "Military expeditions from Western Europe to the Holy Land between 1096 and 1291, which for a time set up Crusader kingdoms there.",
    moreInfo: "Crusaders built or rebuilt many churches at holy sites, and some of the sites they named are still honored today.",
    icon: BookOpen,
    url: "https://en.wikipedia.org/wiki/Crusades",
  },
  locCertain: {
    term: "Certain",
    definition: "Where this place was is not in doubt, usually because it has been lived in without a break since ancient times.",
    moreInfo: "Certain means the location, not every event said to have happened there.",
    icon: BookOpen,
  },
  locProbable: {
    term: "Probable",
    definition: "Most scholars accept this identification, based on ruins, inscriptions, or ancient descriptions, though it isn’t beyond doubt.",
    moreInfo: "New evidence could still change it, which is why the sources are listed.",
    icon: BookOpen,
  },
  locPossible: {
    term: "Possible",
    definition: "One of the sites scholars propose. The evidence fits, but other sites fit too.",
    moreInfo: "When a place has several possible sites, the map shows all of them.",
    icon: BookOpen,
  },
  locTraditional: {
    term: "Traditional",
    definition: "Honored as the place by long Christian tradition, though historians can’t confirm it from other evidence.",
    moreInfo: "Many traditional sites go back to pilgrims of the fourth century and later.",
    icon: Church,
  },
  locUnknown: {
    term: "Uncertain",
    definition: "Where this place was isn’t known. Scholars have proposed several sites, and none is settled.",
    moreInfo: "Each proposed site is shown on the map with what supports it.",
    icon: BookOpen,
  },

  // ---- The six claim labels (claims.claim_type) ----------------------------------------------
  claimScripture: {
    term: "Scripture",
    definition: "A statement of what the Bible says, with the passage cited so you can read it yourself.",
    moreInfo: "It reports what the text says. Whether an event can also be shown historically is a separate, History-labeled statement.",
    icon: BookOpen,
  },
  claimChurchTeaching: {
    term: "Church teaching",
    definition: "What the Catholic Church teaches, citing the Catechism or another Church document.",
    moreInfo: "Teaching is about faith and morals. It is labeled separately from history so the two are never mixed up.",
    icon: Church,
    url: "https://www.vatican.va/archive/ENG0015/_INDEX.HTM",
    sourceLabel: "Catechism of the Catholic Church",
  },
  claimTradition: {
    term: "Tradition",
    definition: "Something handed down in the Church over centuries, such as where an event is remembered to have taken place.",
    moreInfo: "Some traditions are very old and well supported; others are pious customs. The sources show which.",
    icon: Church,
  },
  claimHistoricalConsensus: {
    term: "Historical consensus",
    definition: "What most historians agree on, based on the surviving evidence.",
    moreInfo: "Consensus can change when new evidence turns up, which is why each statement lists its sources.",
    icon: BookOpen,
  },
  claimScholarlyHypothesis: {
    term: "Scholarly hypothesis",
    definition: "A reasoned idea some scholars hold, but not settled.",
    moreInfo: "Hypotheses are shown so you can see the conversation, not because the site endorses them.",
    icon: BookOpen,
  },
  claimDebated: {
    term: "Debated",
    definition: "Experts disagree, and the evidence points more than one way.",
    moreInfo: "Each side’s sources are shown, so you can weigh them yourself.",
    icon: BookOpen,
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryTerm = keyof typeof GLOSSARY;
