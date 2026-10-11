/* 150 geprüfte Lernwörter für Klasse 2. Format: Wort|Silben|Wortart|Emoji|Fokus */
const WORD_ROWS = [
  // 1 – lautgetreu (40)
  'Oma|O-ma|Nomen|👵|lautgetreu','Opa|O-pa|Nomen|👴|lautgetreu','Sofa|So-fa|Nomen|🛋️|lautgetreu','Lama|La-ma|Nomen|🦙|lautgetreu','Nase|Na-se|Nomen|👃|lautgetreu','Dose|Do-se|Nomen|🥫|lautgetreu','Hase|Ha-se|Nomen|🐇|lautgetreu','Rose|Ro-se|Nomen|🌹|lautgetreu','Besen|Be-sen|Nomen|🧹|lautgetreu','Salat|Sa-lat|Nomen|🥗|lautgetreu',
  'Banane|Ba-na-ne|Nomen|🍌|lautgetreu','Tomate|To-ma-te|Nomen|🍅|lautgetreu','Melone|Me-lo-ne|Nomen|🍉|lautgetreu','Rakete|Ra-ke-te|Nomen|🚀|lautgetreu','Piraten|Pi-ra-ten|Nomen|🏴‍☠️|lautgetreu','rot|rot|Adjektiv|🔴|lautgetreu','lila|li-la|Adjektiv|🟣|lautgetreu','leise|lei-se|Adjektiv|🤫|lautgetreu','laut|laut|Adjektiv|📣|lautgetreu','gut|gut|Adjektiv|👍|lautgetreu',
  'malen|ma-len|Verb|🎨|lautgetreu','lesen|le-sen|Verb|📖|lautgetreu','sagen|sa-gen|Verb|💬|lautgetreu','holen|ho-len|Verb|🫴|lautgetreu','baden|ba-den|Verb|🛁|lautgetreu','rufen|ru-fen|Verb|📢|lautgetreu','turnen|tur-nen|Verb|🤸|lautgetreu','reden|re-den|Verb|🗣️|lautgetreu','leben|le-ben|Verb|🌱|lautgetreu','geben|ge-ben|Verb|🎁|lautgetreu',
  'Mama|Ma-ma|Nomen|👩|lautgetreu','Papa|Pa-pa|Nomen|👨|lautgetreu','Kind|Kind|Nomen|🧒|Endbuchstabe','Mund|Mund|Nomen|👄|Endbuchstabe','Hand|Hand|Nomen|✋|Endbuchstabe','Brot|Brot|Nomen|🍞|lautgetreu','Hut|Hut|Nomen|👒|lautgetreu','Bus|Bus|Nomen|🚌|lautgetreu','Rad|Rad|Nomen|🚲|Endbuchstabe','Tor|Tor|Nomen|🥅|lautgetreu',
  // 2 – ei/au/eu/ie und sch/ch/st/sp (45)
  'Eis|Eis|Nomen|🍦|ei','Ei|Ei|Nomen|🥚|ei','Bein|Bein|Nomen|🦵|ei','Stein|Stein|Nomen|🪨|ei','klein|klein|Adjektiv|🤏|ei','mein|mein|Pronomen|🙋|ei','Seife|Sei-fe|Nomen|🧼|ei','Reise|Rei-se|Nomen|🧳|ei','Zeit|Zeit|Nomen|⏰|ei','reiten|rei-ten|Verb|🐎|ei',
  'Haus|Haus|Nomen|🏠|au','Maus|Maus|Nomen|🐭|au','Baum|Baum|Nomen|🌳|au','Auge|Au-ge|Nomen|👁️|au','Pause|Pau-se|Nomen|⏸️|au','braun|braun|Adjektiv|🟤|au','bauen|bau-en|Verb|🧱|au','laufen|lau-fen|Verb|🏃|au','kaufen|kau-fen|Verb|🛒|au','Traum|Traum|Nomen|💭|au',
  'Eule|Eu-le|Nomen|🦉|eu','Feuer|Feu-er|Nomen|🔥|eu','heute|heu-te|Adverb|📅|eu','Leute|Leu-te|Nomen|👥|eu','neun|neun|Zahlwort|9️⃣|eu','Freund|Freund|Nomen|🤝|eu','Biene|Bie-ne|Nomen|🐝|ie','Fliege|Flie-ge|Nomen|🪰|ie','Wiese|Wie-se|Nomen|🌼|ie','Tier|Tier|Nomen|🐾|ie',
  'spielen|spie-len|Verb|🎲|sp/ie','vier|vier|Zahlwort|4️⃣|ie','Brief|Brief|Nomen|✉️|ie','Schule|Schu-le|Nomen|🏫|sch','Schaf|Schaf|Nomen|🐑|sch','Schuh|Schuh|Nomen|👟|sch','Fisch|Fisch|Nomen|🐟|sch','Tisch|Tisch|Nomen|🪑|sch','waschen|wa-schen|Verb|🧼|sch','lachen|la-chen|Verb|😄|ch',
  'Buch|Buch|Nomen|📕|ch','Milch|Milch|Nomen|🥛|ch','Stern|Stern|Nomen|⭐|st','Straße|Stra-ße|Nomen|🛣️|st/ß','Sport|Sport|Nomen|⚽|sp',
  // 3 – ck/tz und Doppelkonsonanten (35)
  'Jacke|Ja-cke|Nomen|🧥|ck','Schnecke|Schne-cke|Nomen|🐌|ck','Brücke|Brü-cke|Nomen|🌉|ck','Zucker|Zu-cker|Nomen|🍬|ck','Bäcker|Bä-cker|Nomen|🥖|ck','wecken|we-cken|Verb|⏰|ck','packen|pa-cken|Verb|🎒|ck','dick|dick|Adjektiv|📚|ck','Ecke|E-cke|Nomen|📐|ck','Rucksack|Ruck-sack|Nomen|🎒|ck',
  'Katze|Kat-ze|Nomen|🐈|tz','Mütze|Müt-ze|Nomen|🧢|tz','Pfütze|Pfüt-ze|Nomen|💦|tz','Satz|Satz|Nomen|📝|tz','Platz|Platz|Nomen|🏞️|tz','sitzen|sit-zen|Verb|🪑|tz','putzen|put-zen|Verb|🧽|tz','blitzen|blit-zen|Verb|⚡|tz','Hitze|Hit-ze|Nomen|☀️|tz','Spatz|Spatz|Nomen|🐦|tz',
  'Ball|Ball|Nomen|⚽|Doppelkonsonant','Mutter|Mut-ter|Nomen|👩|Doppelkonsonant','Sonne|Son-ne|Nomen|☀️|Doppelkonsonant','Kanne|Kan-ne|Nomen|🫖|Doppelkonsonant','Teller|Tel-ler|Nomen|🍽️|Doppelkonsonant','Wasser|Was-ser|Nomen|💧|Doppelkonsonant','Zimmer|Zim-mer|Nomen|🚪|Doppelkonsonant','Sommer|Som-mer|Nomen|🌞|Doppelkonsonant','kommen|kom-men|Verb|➡️|Doppelkonsonant','rennen|ren-nen|Verb|🏃|Doppelkonsonant',
  'schwimmen|schwim-men|Verb|🏊|Doppelkonsonant','essen|es-sen|Verb|🍽️|Doppelkonsonant','offen|of-fen|Adjektiv|🚪|Doppelkonsonant','schnell|schnell|Adjektiv|💨|Doppelkonsonant','hell|hell|Adjektiv|💡|Doppelkonsonant',
  // 4 – Merkwörter und anspruchsvollere Wörter (30)
  'Vater|Va-ter|Nomen|👨|v','Vogel|Vo-gel|Nomen|🐦|v','viel|viel|Pronomen|➕|v/ie','Vase|Va-se|Nomen|🏺|v','voll|voll|Adjektiv|🫗|v/Doppelkonsonant','von|von|Präposition|➡️|v','vor|vor|Präposition|⏩|v','Verkehr|Ver-kehr|Nomen|🚦|v','vergessen|ver-ges-sen|Verb|💭|v/Doppelkonsonant','vielleicht|viel-leicht|Adverb|🤔|v/ie',
  'Fahrrad|Fahr-rad|Nomen|🚲|Dehnungs-h','fahren|fah-ren|Verb|🚗|Dehnungs-h','Zahn|Zahn|Nomen|🦷|Dehnungs-h','Uhr|Uhr|Nomen|🕒|Dehnungs-h','Lehrer|Leh-rer|Nomen|🧑‍🏫|Dehnungs-h','ihm|ihm|Pronomen|👤|Dehnungs-h','ihn|ihn|Pronomen|👤|Dehnungs-h','nehmen|neh-men|Verb|🫴|Dehnungs-h','sehen|se-hen|Verb|👀|Dehnungs-h','gehen|ge-hen|Verb|🚶|Dehnungs-h',
  'Hund|Hund|Nomen|🐕|Endbuchstabe','Wald|Wald|Nomen|🌲|Endbuchstabe','Bild|Bild|Nomen|🖼️|Endbuchstabe','Tag|Tag|Nomen|📆|Endbuchstabe','Weg|Weg|Nomen|🛤️|Endbuchstabe','Korb|Korb|Nomen|🧺|Endbuchstabe','gelb|gelb|Adjektiv|🟡|Endbuchstabe','lieb|lieb|Adjektiv|💚|Endbuchstabe','König|Kö-nig|Nomen|👑|Endbuchstabe','zwölf|zwölf|Zahlwort|1️⃣2️⃣|Merkwort'
];

window.BASE_WORDS = WORD_ROWS.map((row, index) => {
  const [word, syllables, pos, emoji, focus] = row.split('|');
  return { id: `b${index + 1}`, word, syllables: syllables.split('-'), pos, emoji, focus, level: index < 40 ? 1 : index < 85 ? 2 : index < 120 ? 3 : 4 };
});

/* Victorias aktuelle Lernwörter – bewusst getrennt vom allgemeinen Grundwortschatz. */
const CURRENT_WORD_ROWS = [
  'Apfelbirne|Ap-fel-bir-ne|Nomen|🍐|Lernwort','Brot|Brot|Nomen|🍞|Lernwort','Käse|Kä-se|Nomen|🧀|Lernwort','Tomate|To-ma-te|Nomen|🍅|Lernwort','Telefon|Te-le-fon|Nomen|☎️|Lernwort',
  'Zelt|Zelt|Nomen|⛺|Endbuchstabe','Tasse|Tas-se|Nomen|☕|Doppelkonsonant','Kleiderschrank|Klei-der-schrank|Nomen|👗|sch','Roller|Rol-ler|Nomen|🛴|Doppelkonsonant','Knopf|Knopf|Nomen|🔘|Endbuchstabe',
  'Wassermelone|Was-ser-me-lo-ne|Nomen|🍉|Doppelkonsonant','Kleber|Kle-ber|Nomen|🧴|Lernwort','Hose|Ho-se|Nomen|👖|Lernwort','Nudel|Nu-del|Nomen|🍝|Lernwort','Kino|Ki-no|Nomen|🎬|Lernwort',
  'Koch|Koch|Nomen|🧑‍🍳|ch','Kirsche|Kir-sche|Nomen|🍒|sch','Kaki|Ka-ki|Nomen|🟠|Lernwort','Koffer|Kof-fer|Nomen|🧳|Doppelkonsonant','Mango|Man-go|Nomen|🥭|Lernwort',
  'Mama|Ma-ma|Nomen|👩|Lernwort','Musik|Mu-sik|Nomen|🎵|Lernwort','mehr|mehr|Adverb|➕|Dehnungs-h','Mond|Mond|Nomen|🌙|Endbuchstabe','Pilz|Pilz|Nomen|🍄|Lernwort',
  'Paprika|Pa-pri-ka|Nomen|🫑|Lernwort','Pali|Pa-li|Nomen|🧱|Lernwort','Lolli|Lol-li|Nomen|🍭|Doppelkonsonant','Lineal|Li-ne-al|Nomen|📏|Lernwort'
];
window.CURRENT_WORDS = CURRENT_WORD_ROWS.map((row, index) => {
  const [word, syllables, pos, emoji, focus] = row.split('|');
  return { id: `a${index + 1}`, word, syllables: syllables.split('-'), pos, emoji, focus, level: 2, current: true };
});

window.SENTENCES = [
  'Die Biene fliegt über die Wiese.',
  'Der kleine Hund rennt schnell.',
  'Heute bauen wir ein Haus.',
  'Die Katze sitzt auf dem Sofa.',
  'Victoria liest ein gutes Buch.',
  'Der Vogel sitzt vor dem Fenster.',
  'Papa fährt mit dem Fahrrad.',
  'Die Eule sieht den hellen Stern.',
  'In der Pause spielen die Kinder.',
  'Der Frosch hüpft in die Pfütze.'
];

window.DICTATIONS = [
  {
    title: 'Das Baumhaus', level: 2, emoji: '🌳',
    sentences: ['Victoria baut ein Baumhaus.', 'Papa bringt Holz und eine Leiter.', 'Auf dem Dach sitzt ein kleiner Vogel.', 'Im Haus liegt eine weiche Decke.', 'Am Abend leuchtet dort eine Lampe.']
  },
  {
    title: 'Die Schatzmine', level: 2, emoji: '⛏️',
    sentences: ['Mila geht tief in die Mine.', 'An der Wand funkelt ein heller Stein.', 'Hinter einer Ecke steht eine Kiste.', 'Darin liegen Gold und ein alter Brief.', 'Mila bringt den Schatz sicher nach Hause.']
  },
  {
    title: 'Ein Tag am See', level: 3, emoji: '🏞️',
    sentences: ['Heute fahren wir mit dem Fahrrad zum See.', 'Auf der Wiese machen wir eine Pause.', 'Ein Frosch hüpft schnell in das Wasser.', 'Meine Schwester entdeckt eine kleine Schnecke.', 'Später essen wir Brot und saftige Melone.']
  },
  {
    title: 'Das Gewitter', level: 4, emoji: '⛈️',
    sentences: ['Über dem Wald ziehen dunkle Wolken auf.', 'Plötzlich blitzt es hinter dem hohen Berg.', 'Der Hund läuft schnell in das warme Haus.', 'Victoria schließt die Fenster und wartet.', 'Bald scheint wieder die helle Sonne.']
  }
];
