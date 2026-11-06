// SŁÓWKA — tematy. Każde słowo: [angielski, polski, obrazek].
// Obrazek: emoji, albo "color:#hex" (próbka koloru), albo "num:7" (cyfra).
// ZASADA KOMPATYBILNOŚCI: id tematu i angielskie słowo tworzą klucz postępu
// ("v:animals:dog"). Nie zmieniaj istniejących słów angielskich — dodawaj nowe.
// Literówkę w polskim tłumaczeniu albo emoji możesz poprawiać bez obaw.

export default {
  halloween: { name: "Halloween", icon: "🎃", words: [
    ["pumpkin", "dynia", "🎃"], ["ghost", "duch", "👻"], ["bat", "nietoperz", "🦇"],
    ["witch", "czarownica", "🧙‍♀️"], ["spider", "pająk", "🕷️"], ["spider web", "pajęczyna", "🕸️"],
    ["skull", "czaszka", "💀"], ["candy", "cukierek", "🍬"], ["lollipop", "lizak", "🍭"],
    ["moon", "księżyc", "🌕"], ["owl", "sowa", "🦉"], ["broom", "miotła", "🧹"],
    ["zombie", "zombie", "🧟"], ["vampire", "wampir", "🧛"], ["candle", "świeca", "🕯️"],
    ["haunted house", "nawiedzony dom", "🏚️"], ["monster", "potwór", "👾"], ["black cat", "czarny kot", "🐈‍⬛"],
  ]},
  animals: { name: "Animals", icon: "🐾", words: [
    ["dog", "pies", "🐶"], ["cat", "kot", "🐱"], ["horse", "koń", "🐴"], ["cow", "krowa", "🐮"],
    ["pig", "świnia", "🐷"], ["sheep", "owca", "🐑"], ["duck", "kaczka", "🦆"], ["rabbit", "królik", "🐰"],
    ["mouse", "mysz", "🐭"], ["fish", "ryba", "🐟"], ["bird", "ptak", "🐦"], ["frog", "żaba", "🐸"],
    ["lion", "lew", "🦁"], ["tiger", "tygrys", "🐯"], ["elephant", "słoń", "🐘"], ["monkey", "małpa", "🐵"],
    ["bear", "niedźwiedź", "🐻"], ["snake", "wąż", "🐍"], ["giraffe", "żyrafa", "🦒"], ["shark", "rekin", "🦈"],
  ]},
  food: { name: "Food", icon: "🍕", words: [
    ["apple", "jabłko", "🍎"], ["banana", "banan", "🍌"], ["bread", "chleb", "🍞"], ["cheese", "ser", "🧀"],
    ["egg", "jajko", "🥚"], ["milk", "mleko", "🥛"], ["pizza", "pizza", "🍕"], ["cake", "tort", "🎂"],
    ["ice cream", "lody", "🍦"], ["carrot", "marchewka", "🥕"], ["strawberry", "truskawka", "🍓"], ["orange", "pomarańcza", "🍊"],
    ["chicken", "kurczak", "🍗"], ["soup", "zupa", "🍲"], ["juice", "sok", "🧃"], ["chocolate", "czekolada", "🍫"],
    ["sandwich", "kanapka", "🥪"], ["grapes", "winogrona", "🍇"], ["tomato", "pomidor", "🍅"], ["water", "woda", "💧"],
  ]},
  colors: { name: "Colours", icon: "🎨", words: [
    ["red", "czerwony", "color:#e53935"], ["blue", "niebieski", "color:#1e88e5"], ["green", "zielony", "color:#43a047"],
    ["yellow", "żółty", "color:#fdd835"], ["orange", "pomarańczowy", "color:#fb8c00"], ["purple", "fioletowy", "color:#8e24aa"],
    ["pink", "różowy", "color:#f48fb1"], ["brown", "brązowy", "color:#795548"], ["black", "czarny", "color:#212121"],
    ["white", "biały", "color:#fafafa"], ["grey", "szary", "color:#9e9e9e"],
  ]},
  numbers: { name: "Numbers", icon: "🔢", words: [
    ["one", "jeden", "num:1"], ["two", "dwa", "num:2"], ["three", "trzy", "num:3"], ["four", "cztery", "num:4"],
    ["five", "pięć", "num:5"], ["six", "sześć", "num:6"], ["seven", "siedem", "num:7"], ["eight", "osiem", "num:8"],
    ["nine", "dziewięć", "num:9"], ["ten", "dziesięć", "num:10"], ["eleven", "jedenaście", "num:11"], ["twelve", "dwanaście", "num:12"],
    ["thirteen", "trzynaście", "num:13"], ["fifteen", "piętnaście", "num:15"], ["twenty", "dwadzieścia", "num:20"],
  ]},
  family: { name: "Family", icon: "👪", words: [
    ["mum", "mama", "👩"], ["dad", "tata", "👨"], ["sister", "siostra", "👧"], ["brother", "brat", "👦"],
    ["baby", "dzidziuś", "👶"], ["grandma", "babcia", "👵"], ["grandpa", "dziadek", "👴"], ["family", "rodzina", "👪"],
  ]},
  body: { name: "My body", icon: "✋", words: [
    ["eye", "oko", "👁️"], ["ear", "ucho", "👂"], ["nose", "nos", "👃"], ["mouth", "usta", "👄"],
    ["hand", "dłoń", "✋"], ["foot", "stopa", "🦶"], ["leg", "noga", "🦵"], ["arm", "ramię", "💪"],
    ["tooth", "ząb", "🦷"], ["tongue", "język", "👅"], ["brain", "mózg", "🧠"],
  ]},
  clothes: { name: "Clothes", icon: "👕", words: [
    ["T-shirt", "koszulka", "👕"], ["jeans", "dżinsy", "👖"], ["dress", "sukienka", "👗"], ["shoes", "buty", "👟"],
    ["hat", "kapelusz", "🎩"], ["cap", "czapka z daszkiem", "🧢"], ["socks", "skarpetki", "🧦"], ["scarf", "szalik", "🧣"],
    ["gloves", "rękawiczki", "🧤"], ["coat", "płaszcz", "🧥"], ["boots", "kozaki / wysokie buty", "👢"], ["glasses", "okulary", "👓"],
  ]},
  school: { name: "School", icon: "🎒", words: [
    ["book", "książka", "📕"], ["pencil", "ołówek", "✏️"], ["pen", "długopis", "🖊️"], ["ruler", "linijka", "📏"],
    ["scissors", "nożyczki", "✂️"], ["school bag", "plecak", "🎒"], ["teacher", "nauczyciel / nauczycielka", "🧑‍🏫"], ["school", "szkoła", "🏫"],
    ["computer", "komputer", "💻"], ["paintbrush", "pędzel", "🖌️"], ["notebook", "zeszyt", "📓"], ["clock", "zegar", "🕐"],
  ]},
  home: { name: "My home", icon: "🏠", words: [
    ["house", "dom", "🏠"], ["door", "drzwi", "🚪"], ["bed", "łóżko", "🛏️"], ["chair", "krzesło", "🪑"],
    ["sofa", "kanapa", "🛋️"], ["bath", "wanna", "🛁"], ["shower", "prysznic", "🚿"], ["toilet", "toaleta", "🚽"],
    ["key", "klucz", "🔑"], ["TV", "telewizor", "📺"], ["phone", "telefon", "📱"], ["light bulb", "żarówka", "💡"],
  ]},
  weather: { name: "Weather", icon: "🌦️", words: [
    ["sun", "słońce", "☀️"], ["rain", "deszcz", "🌧️"], ["snow", "śnieg", "❄️"], ["cloud", "chmura", "☁️"],
    ["wind", "wiatr", "🌬️"], ["storm", "burza", "⛈️"], ["rainbow", "tęcza", "🌈"], ["hot", "gorący / gorąco", "🥵"],
    ["cold", "zimny / zimno", "🥶"], ["fog", "mgła", "🌁"],
  ]},
  toys: { name: "Toys", icon: "🧸", words: [
    ["ball", "piłka", "⚽"], ["teddy bear", "miś", "🧸"], ["kite", "latawiec", "🪁"], ["robot", "robot", "🤖"],
    ["puzzle", "puzzle", "🧩"], ["video game", "gra wideo", "🎮"], ["balloon", "balon", "🎈"], ["yo-yo", "jo-jo", "🪀"],
    ["drum", "bęben", "🥁"], ["blocks", "klocki", "🧱"],
  ]},
  sports: { name: "Sports", icon: "⚽", words: [
    ["football", "piłka nożna", "⚽"], ["basketball", "koszykówka", "🏀"], ["tennis", "tenis", "🎾"], ["swimming", "pływanie", "🏊"],
    ["running", "bieganie", "🏃"], ["cycling", "jazda na rowerze", "🚴"], ["skiing", "narciarstwo", "⛷️"], ["volleyball", "siatkówka", "🏐"],
    ["ice skating", "łyżwiarstwo", "⛸️"], ["horse riding", "jazda konna", "🏇"], ["boxing", "boks", "🥊"], ["dancing", "taniec", "💃"],
  ]},
  transport: { name: "Transport", icon: "🚗", words: [
    ["car", "samochód", "🚗"], ["bus", "autobus", "🚌"], ["train", "pociąg", "🚆"], ["plane", "samolot", "✈️"],
    ["bike", "rower", "🚲"], ["boat", "łódka / żaglówka", "⛵"], ["ship", "statek", "🚢"], ["taxi", "taksówka", "🚕"],
    ["helicopter", "helikopter", "🚁"], ["rocket", "rakieta", "🚀"], ["tractor", "traktor", "🚜"], ["lorry", "ciężarówka", "🚚"],
  ]},
  jobs: { name: "Jobs", icon: "🧑‍🚒", words: [
    ["doctor", "lekarz", "🧑‍⚕️"], ["cook", "kucharz", "🧑‍🍳"], ["farmer", "rolnik", "🧑‍🌾"], ["police officer", "policjant", "👮"],
    ["firefighter", "strażak", "🧑‍🚒"], ["pilot", "pilot", "🧑‍✈️"], ["artist", "artysta / malarz", "🧑‍🎨"], ["singer", "piosenkarz / piosenkarka", "🧑‍🎤"],
    ["astronaut", "astronauta", "🧑‍🚀"], ["builder", "budowlaniec", "👷"], ["scientist", "naukowiec", "🧑‍🔬"],
  ]},
  nature: { name: "Nature", icon: "🌳", words: [
    ["tree", "drzewo", "🌳"], ["flower", "kwiat", "🌸"], ["mountain", "góra", "⛰️"], ["sea", "morze", "🌊"],
    ["forest", "las", "🌲"], ["leaf", "liść", "🍃"], ["star", "gwiazda", "⭐"], ["volcano", "wulkan", "🌋"],
    ["island", "wyspa", "🏝️"], ["mushroom", "grzyb", "🍄"], ["cactus", "kaktus", "🌵"],
  ]},
  feelings: { name: "Feelings", icon: "😀", words: [
    ["happy", "szczęśliwy", "😀"], ["sad", "smutny", "😢"], ["angry", "zły", "😠"], ["scared", "przestraszony", "😨"],
    ["tired", "zmęczony", "🥱"], ["surprised", "zaskoczony", "😲"], ["sick", "chory", "🤒"], ["excited", "podekscytowany", "🤩"],
    ["bored", "znudzony", "😑"],
  ]},
  actions: { name: "Actions", icon: "🏃", words: [
    ["run", "biegać", "🏃"], ["swim", "pływać", "🏊"], ["sing", "śpiewać", "🎤"], ["dance", "tańczyć", "💃"],
    ["read", "czytać", "📖"], ["write", "pisać", "✍️"], ["eat", "jeść", "🍽️"], ["sleep", "spać", "😴"],
    ["cook", "gotować", "🍳"], ["draw", "rysować", "🎨"], ["climb", "wspinać się", "🧗"], ["ride a bike", "jeździć na rowerze", "🚴"],
    ["watch TV", "oglądać telewizję", "📺"], ["play football", "grać w piłkę", "⚽"],
  ]},
  winter: { name: "Winter", icon: "⛄", words: [
    ["snowman", "bałwan", "⛄"], ["snowflake", "płatek śniegu", "❄️"], ["present", "prezent", "🎁"], ["Christmas tree", "choinka", "🎄"],
    ["Santa", "Mikołaj", "🎅"], ["star", "gwiazda", "⭐"], ["bell", "dzwonek", "🔔"], ["sledge", "sanki", "🛷"],
    ["hot chocolate", "gorąca czekolada", "☕"], ["deer", "jeleń", "🦌"], ["scarf", "szalik", "🧣"], ["cookie", "ciastko", "🍪"],
  ]},
  spring: { name: "Spring & Easter", icon: "🐣", words: [
    ["chick", "kurczaczek", "🐣"], ["egg", "jajko", "🥚"], ["bunny", "zajączek", "🐰"], ["flower", "kwiat", "🌷"],
    ["butterfly", "motyl", "🦋"], ["bee", "pszczoła", "🐝"], ["basket", "koszyk", "🧺"], ["rainbow", "tęcza", "🌈"],
    ["umbrella", "parasol", "☂️"], ["ladybird", "biedronka", "🐞"],
  ]},
  summer: { name: "Summer", icon: "🏖️", words: [
    ["beach", "plaża", "🏖️"], ["sea", "morze", "🌊"], ["sun", "słońce", "☀️"], ["sunglasses", "okulary przeciwsłoneczne", "🕶️"],
    ["shell", "muszelka", "🐚"], ["crab", "krab", "🦀"], ["ice cream", "lody", "🍦"], ["swimsuit", "strój kąpielowy", "👙"],
    ["tent", "namiot", "⛺"], ["watermelon", "arbuz", "🍉"], ["holiday", "wakacje", "🧳"],
  ]},

  // ===== ETAP 4: tematy wg podstawy programowej i podręczników kl. 1–6 (docs/curriculum/VOCAB-1-6.md) =====
  // klasa dla każdego tematu i kolejność nauki: data/curriculum.js

  // --- klasa 2 ---
  bugs: { name: "Minibeasts", icon: "🐞", words: [
    ["ant", "mrówka", "🐜"], ["beetle", "chrząszcz / żuk", "🪲"], ["fly", "mucha", "🪰"], ["snail", "ślimak", "🐌"],
    ["worm", "dżdżownica / robak", "🪱"], ["caterpillar", "gąsienica", "🐛"], ["mosquito", "komar", "🦟"],
    ["scorpion", "skorpion", "🦂"], ["bee", "pszczoła", "🐝"], ["butterfly", "motyl", "🦋"], ["ladybird", "biedronka", "🐞"],
    ["spider", "pająk", "🕷️"],
  ]},
  fruitveg: { name: "Fruit & veg", icon: "🍐", words: [
    ["pear", "gruszka", "🍐"], ["cherry", "wiśnia / czereśnia", "🍒"], ["lemon", "cytryna", "🍋"], ["pineapple", "ananas", "🍍"],
    ["kiwi", "kiwi", "🥝"], ["coconut", "kokos", "🥥"], ["blueberries", "borówki", "🫐"],
    ["potato", "ziemniak", "🥔"], ["onion", "cebula", "🧅"], ["garlic", "czosnek", "🧄"], ["cucumber", "ogórek", "🥒"],
    ["corn", "kukurydza", "🌽"], ["broccoli", "brokuł", "🥦"], ["pepper", "papryka", "🫑"],
  ]},
  fairytale: { name: "Fairy tales", icon: "🦄", words: [
    ["prince", "książę", "🤴"], ["princess", "księżniczka", "👸"], ["crown", "korona", "👑"], ["castle", "zamek", "🏰"],
    ["dragon", "smok", "🐉"], ["unicorn", "jednorożec", "🦄"], ["fairy", "wróżka", "🧚"], ["wizard", "czarodziej", "🧙‍♂️"],
    ["mermaid", "syrenka", "🧜‍♀️"], ["genie", "dżin", "🧞"], ["magic wand", "czarodziejska różdżka", "🪄"],
    ["diamond", "diament", "💎"], ["mirror", "lustro", "🪞"],
  ]},

  // --- klasa 3 (Bugs Team 3: U1 safari, U3 talent show, U4 my busy day, U5 shopping, U6 holiday; liczby 10–100) ---
  wild: { name: "Wild animals", icon: "🦁", words: [
    ["rhino", "nosorożec", "🦏"], ["whale", "wieloryb", "🐋"], ["gorilla", "goryl", "🦍"],
    ["leopard", "lampart", "🐆"], ["lizard", "jaszczurka", "🦎"], ["crocodile", "krokodyl", "🐊"],
    ["zebra", "zebra", "🦓"], ["camel", "wielbłąd", "🐫"], ["penguin", "pingwin", "🐧"], ["flamingo", "flaming", "🦩"],
    ["panda", "panda", "🐼"], ["koala", "koala", "🐨"], ["octopus", "ośmiornica", "🐙"], ["dolphin", "delfin", "🐬"],
    ["polar bear", "niedźwiedź polarny", "🐻‍❄️"], ["parrot", "papuga", "🦜"],
  ]},
  bignumbers: { name: "Numbers 13–100", icon: "💯", words: [
    ["thirteen", "trzynaście", "num:13"], ["fourteen", "czternaście", "num:14"], ["fifteen", "piętnaście", "num:15"], ["sixteen", "szesnaście", "num:16"],
    ["seventeen", "siedemnaście", "num:17"], ["eighteen", "osiemnaście", "num:18"], ["nineteen", "dziewiętnaście", "num:19"], ["twenty", "dwadzieścia", "num:20"],
    ["thirty", "trzydzieści", "num:30"], ["forty", "czterdzieści", "num:40"], ["fifty", "pięćdziesiąt", "num:50"], ["sixty", "sześćdziesiąt", "num:60"],
    ["seventy", "siedemdziesiąt", "num:70"], ["eighty", "osiemdziesiąt", "num:80"], ["ninety", "dziewięćdziesiąt", "num:90"], ["one hundred", "sto", "num:100"],
  ]},
  freetime: { name: "Free time", icon: "🎸", words: [
    ["play the guitar", "grać na gitarze", "🎸"], ["play the piano", "grać na pianinie", "🎹"], ["play the violin", "grać na skrzypcach", "🎻"],
    ["play the trumpet", "grać na trąbce", "🎺"], ["play the drums", "grać na perkusji", "🥁"], ["skateboard", "jeździć na deskorolce", "🛹"],
    ["roller-skate", "jeździć na wrotkach", "🛼"], ["play chess", "grać w szachy", "♟️"], ["juggle", "żonglować", "🤹"],
    ["listen to music", "słuchać muzyki", "🎧"], ["play computer games", "grać w gry komputerowe", "🎮"], ["paint", "malować", "🎨"],
  ]},
  myday: { name: "My day", icon: "⏰", words: [
    ["wake up", "budzić się", "⏰"], ["brush your teeth", "myć zęby", "🪥"],
    ["have a shower", "brać prysznic", "🚿"], ["have a bath", "brać kąpiel", "🛀"], ["have breakfast", "jeść śniadanie", "🥣"],
    ["go to school", "iść do szkoły", "🏫"], ["do homework", "odrabiać lekcje", "📝"], ["go to bed", "iść spać", "🛌"], ["have dinner", "jeść obiad / kolację", "🍽️"],
    ["morning", "rano / poranek", "🌅"], ["evening", "wieczór", "🌆"], ["night", "noc", "🌙"],
  ]},
  town: { name: "In town", icon: "🏙️", words: [
    ["hospital", "szpital", "🏥"], ["hotel", "hotel", "🏨"], ["bank", "bank", "🏦"], ["church", "kościół", "⛪"],
    ["castle", "zamek", "🏰"], ["stadium", "stadion", "🏟️"], ["factory", "fabryka", "🏭"], ["train station", "dworzec kolejowy", "🚉"],
    ["supermarket", "supermarket", "🛒"], ["shop", "sklep", "🏪"],
    ["funfair", "wesołe miasteczko", "🎡"], ["traffic lights", "światła (sygnalizacja)", "🚦"], ["petrol station", "stacja benzynowa", "⛽"], ["museum", "muzeum", "🏛️"],
  ]},
  holiday: { name: "Holiday fun", icon: "🏕️", words: [
    ["take photos", "robić zdjęcia", "📸"], ["fly a kite", "puszczać latawca", "🪁"], ["have a picnic", "urządzać piknik", "🧺"],
    ["go fishing", "łowić ryby", "🎣"], ["collect shells", "zbierać muszelki", "🐚"], ["go snorkelling", "nurkować z rurką", "🤿"],
    ["make a fire", "rozpalać ognisko", "🔥"], ["go camping", "jechać pod namiot", "🏕️"], ["go hiking", "wędrować po górach", "🥾"],
    ["go surfing", "surfować", "🏄"], ["go sailing", "żeglować", "⛵"], ["city", "miasto", "🏙️"],
  ]},

  // --- klasa 4 (English Class A1 / Brainy 4: my things, house, animals & pets, food products, liczebniki porządkowe) ---
  things: { name: "My things", icon: "🎧", words: [
    ["headphones", "słuchawki", "🎧"], ["watch", "zegarek", "⌚"], ["camera", "aparat fotograficzny", "📷"], ["purse", "portmonetka", "👛"],
    ["torch", "latarka", "🔦"], ["map", "mapa", "🗺️"], ["ticket", "bilet", "🎫"], ["compass", "kompas", "🧭"],
    ["money", "pieniądze", "💰"], ["coin", "moneta", "🪙"], ["magnifying glass", "lupa", "🔍"], ["crayon", "kredka (świecowa)", "🖍️"],
    ["paper clip", "spinacz", "📎"], ["umbrella", "parasol", "☂️"], ["key", "klucz", "🔑"],
  ]},
  household: { name: "Around the house", icon: "🪴", words: [
    ["picture", "obraz / obrazek", "🖼️"], ["plant", "roślina (doniczkowa)", "🪴"], ["mirror", "lustro", "🪞"], ["bucket", "wiadro", "🪣"],
    ["toilet paper", "papier toaletowy", "🧻"], ["box", "pudełko / karton", "📦"],
    ["bin", "kosz na śmieci", "🗑️"], ["ladder", "drabina", "🪜"], ["hammer", "młotek", "🔨"], ["letter", "list", "✉️"],
    ["newspaper", "gazeta", "📰"], ["battery", "bateria", "🔋"], ["calendar", "kalendarz", "📅"], ["spoon", "łyżka", "🥄"],
    ["teapot", "dzbanek do herbaty", "🫖"],
  ]},
  forest: { name: "Forest & pets", icon: "🦔", words: [
    ["hamster", "chomik", "🐹"], ["turtle", "żółw", "🐢"], ["hen", "kura", "🐔"],
    ["hedgehog", "jeż", "🦔"], ["squirrel", "wiewiórka", "🐿️"], ["fox", "lis", "🦊"], ["wolf", "wilk", "🐺"],
    ["swan", "łabędź", "🦢"], ["eagle", "orzeł", "🦅"], ["raccoon", "szop pracz", "🦝"],
    ["turkey", "indyk", "🦃"], ["peacock", "paw", "🦚"],
  ]},
  food2: { name: "Food 2", icon: "🍯", words: [
    ["rice", "ryż", "🍚"], ["honey", "miód", "🍯"], ["salt", "sól", "🧂"],
    ["pasta", "makaron", "🍝"], ["meat", "mięso", "🥩"], ["peanuts", "orzeszki ziemne", "🥜"], ["chips", "frytki", "🍟"],
    ["salad", "sałatka", "🥗"], ["burger", "hamburger", "🍔"], ["pancakes", "naleśniki / placki", "🥞"], ["croissant", "rogalik", "🥐"],
    ["pie", "placek / ciasto z nadzieniem", "🥧"], ["popcorn", "popcorn", "🍿"], ["doughnut", "pączek / donut", "🍩"], ["cupcake", "babeczka", "🧁"],
    ["hot dog", "hot dog", "🌭"],
  ]},
  ordinals: { name: "1st, 2nd, 3rd…", icon: "🥇", words: [
    ["first", "pierwszy", "num:1st"], ["second", "drugi", "num:2nd"], ["third", "trzeci", "num:3rd"], ["fourth", "czwarty", "num:4th"],
    ["fifth", "piąty", "num:5th"], ["sixth", "szósty", "num:6th"], ["seventh", "siódmy", "num:7th"], ["eighth", "ósmy", "num:8th"],
    ["ninth", "dziewiąty", "num:9th"],
  ]},

  // --- klasa 5 (Brainy 5/6: sport i sprzęt, zdrowie; nauka i technika — kosmos) ---
  sports2: { name: "Sports 2", icon: "🏆", words: [
    ["golf", "golf", "⛳"], ["bowling", "kręgle", "🎳"], ["table tennis", "tenis stołowy", "🏓"], ["badminton", "badminton", "🏸"],
    ["hockey", "hokej", "🏒"], ["rugby", "rugby", "🏉"], ["baseball", "baseball", "⚾"],
    ["snowboarding", "jazda na snowboardzie", "🏂"], ["weightlifting", "podnoszenie ciężarów", "🏋️"], ["cricket", "krykiet", "🏏"], ["medal", "medal", "🏅"], ["trophy", "puchar", "🏆"],
  ]},
  health: { name: "At the doctor's", icon: "🩺", words: [
    ["headache", "ból głowy", "🤕"], ["plaster", "plaster", "🩹"], ["pill", "tabletka", "💊"],
    ["thermometer", "termometr", "🌡️"], ["injection", "zastrzyk", "💉"], ["ambulance", "karetka", "🚑"], ["stethoscope", "stetoskop", "🩺"],
    ["mask", "maseczka", "😷"], ["hospital", "szpital", "🏥"], ["doctor", "lekarz", "🧑‍⚕️"], ["sick", "chory", "🤒"], ["tooth", "ząb", "🦷"],
  ]},
  space: { name: "Space", icon: "🪐", words: [
    ["planet", "planeta", "🪐"], ["Earth", "Ziemia", "🌍"], ["alien", "kosmita", "👽"],
    ["satellite", "satelita", "🛰️"], ["telescope", "teleskop", "🔭"], ["UFO", "UFO", "🛸"], ["rocket", "rakieta", "🚀"],
    ["astronaut", "astronauta", "🧑‍🚀"], ["moon", "księżyc", "🌕"], ["star", "gwiazda", "⭐"], ["sun", "słońce", "☀️"], ["shooting star", "spadająca gwiazda", "🌠"],
  ]},

  // --- klasa 6 (nauka i technika, świat przyrody) ---
  tech: { name: "Technology", icon: "🖨️", words: [
    ["keyboard", "klawiatura", "⌨️"], ["printer", "drukarka", "🖨️"], ["computer mouse", "myszka komputerowa", "🖱️"], ["plug", "wtyczka", "🔌"],
    ["radio", "radio", "📻"], ["video camera", "kamera", "📹"], ["joystick", "dżojstik", "🕹️"],
    ["satellite dish", "antena satelitarna", "📡"], ["microscope", "mikroskop", "🔬"], ["magnet", "magnes", "🧲"], ["email", "e-mail", "📧"],
    ["screen", "ekran / monitor", "🖥️"],
  ]},
  nature2: { name: "Wild nature", icon: "🌪️", words: [
    ["autumn", "jesień", "🍂"], ["lightning", "błyskawica", "⚡"], ["tornado", "tornado", "🌪️"], ["ice", "lód", "🧊"],
    ["desert", "pustynia", "🏜️"], ["sunflower", "słonecznik", "🌻"], ["rose", "róża", "🌹"], ["palm tree", "palma", "🌴"],
    ["wood", "drewno", "🪵"], ["feather", "pióro", "🪶"], ["chestnut", "kasztan", "🌰"], ["sunset", "zachód słońca", "🌇"],
  ]},
};

// MYLĄCE SIĘ SŁOWA — nigdy nie pojawiają się razem jako opcje (ani jako cel + dystraktor).
// Grupa = słowa, z których przy danym obrazku / dźwięku więcej niż jedno mogłoby być "dobre"
// (synonimy, część–całość, podobne obrazki po pikselizacji, homofony TTS). Słowa angielskie, jak w tematach.
// Zwykła grupa = każde z każdym. Grupa zaczynająca się od "*słowo" = to słowo z każdym z reszty (reszta między sobą OK).
export const CONFUSABLE = [
  ["rain", "cloud", "storm", "fog", "wind"], ["snow", "snowflake", "cold", "snowman"], ["sun", "hot"],
  ["*ball", "football", "play football", "basketball", "volleyball", "tennis"], ["football", "play football"], ["cycling", "ride a bike", "bike"],
  ["running", "run"], ["swimming", "swim", "swimsuit"], ["dancing", "dance"], ["TV", "watch TV"], ["book", "read", "notebook"],
  ["chick", "egg", "chicken"], ["*bird", "owl", "duck", "chick"], ["fish", "shark"], ["rabbit", "bunny"],
  ["cat", "black cat"], ["bear", "teddy bear"], ["horse", "horse riding"], ["candy", "lollipop"], ["*chocolate", "candy", "hot chocolate"],
  ["hot chocolate", "milk"], ["bread", "sandwich"], ["apple", "tomato"], ["cake", "cookie"],
  ["hand", "arm"], ["foot", "leg"], ["mouth", "tongue", "tooth"], ["car", "taxi"], ["boat", "ship"], ["bus", "lorry"],
  ["tree", "forest", "Christmas tree"], ["mountain", "volcano"], ["sea", "beach", "island"], ["house", "haunted house"],
  ["spider", "spider web"], ["glasses", "sunglasses"], ["happy", "excited"], ["scared", "surprised"], ["tired", "sleep", "bored"],
  ["sad", "sick"], ["*family", "mum", "dad", "baby", "sister", "brother", "grandma", "grandpa"], ["mum", "grandma"], ["dad", "grandpa"],
  ["red", "read"], ["sing", "singer"], ["*draw", "artist", "paintbrush"], ["holiday", "beach"], ["star", "Christmas tree"],
  ["monster", "zombie", "ghost"], ["*witch", "hat", "broom"], ["pen", "pencil"], ["computer", "video game"], ["deer", "horse"],
  // --- etap 4 (nowe tematy) ---
  // ten sam obrazek co w starym temacie
  ["school", "go to school"], ["shower", "have a shower"], ["kite", "fly a kite"], ["video game", "play computer games", "joystick"],
  ["drum", "play the drums"], ["basket", "have a picnic"], ["shell", "collect shells"], ["headphones", "listen to music"],
  ["draw", "paint"], ["eat", "have dinner"], ["boat", "go sailing"], ["tooth", "brush your teeth"],
  // bugs, fruitveg, fairytale
  ["ant", "spider"], ["worm", "caterpillar"], ["fly", "mosquito"], ["beetle", "ladybird"], ["onion", "garlic"],
  ["prince", "princess", "crown"], ["wizard", "witch"],
  // wild, forest (ptaki: "bird" z każdym)
  ["whale", "dolphin"], ["lizard", "crocodile"], ["panda", "polar bear", "bear"], ["gorilla", "monkey"], ["leopard", "tiger"],
  ["*bird", "penguin", "flamingo", "parrot", "eagle", "swan", "hen", "peacock", "turkey"],
  ["fox", "wolf"], ["raccoon", "wolf"], ["hen", "turkey", "chicken", "chick"], ["swan", "duck"], ["hamster", "mouse"],
  // myday, town, holiday
  ["have a shower", "have a bath", "bath"], ["morning", "evening", "sunset"], ["night", "moon"], ["go to bed", "sleep", "bed"],
  ["have breakfast", "have dinner"], ["hospital", "hotel"], ["bank", "museum"], ["shop", "supermarket"],
  ["go camping", "tent"], ["take photos", "camera", "video camera"], ["go fishing", "fish"],
  // things, household, food2
  ["money", "coin", "purse"], ["watch", "clock", "compass"], ["bucket", "bin"], ["mirror", "picture"],
  ["*cake", "cupcake", "pie", "pancakes"], ["chips", "popcorn"], ["meat", "chicken"], ["croissant", "bread"],
  // sports2, health, space, tech, nature2
  ["*ball", "rugby", "baseball", "cricket"], ["tennis", "table tennis", "badminton"], ["medal", "trophy"], ["hockey", "cricket"],
  ["snowboarding", "skiing"], ["sick", "headache", "mask", "thermometer"], ["doctor", "stethoscope"],
  ["star", "shooting star"], ["planet", "Earth", "moon"], ["UFO", "alien"], ["satellite dish", "satellite"],
  ["screen", "computer", "TV", "keyboard"], ["computer mouse", "mouse"], ["microscope", "telescope"],
  ["autumn", "leaf"], ["ice", "cold", "snow"], ["lightning", "storm"], ["tornado", "wind", "storm"], ["wood", "tree"],
  ["*flower", "rose", "sunflower"], ["palm tree", "tree", "island"], ["desert", "cactus"],
];
