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
    ["moon", "księżyc", "🌙"], ["owl", "sowa", "🦉"], ["broom", "miotła", "🧹"],
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
    ["baby", "niemowlę", "👶"], ["grandma", "babcia", "👵"], ["grandpa", "dziadek", "👴"], ["family", "rodzina", "👪"],
  ]},
  body: { name: "My body", icon: "✋", words: [
    ["eye", "oko", "👁️"], ["ear", "ucho", "👂"], ["nose", "nos", "👃"], ["mouth", "usta", "👄"],
    ["hand", "dłoń", "✋"], ["foot", "stopa", "🦶"], ["leg", "noga", "🦵"], ["arm", "ramię", "💪"],
    ["tooth", "ząb", "🦷"], ["tongue", "język", "👅"], ["brain", "mózg", "🧠"],
  ]},
  clothes: { name: "Clothes", icon: "👕", words: [
    ["T-shirt", "koszulka", "👕"], ["jeans", "dżinsy", "👖"], ["dress", "sukienka", "👗"], ["shoes", "buty", "👟"],
    ["hat", "kapelusz", "🎩"], ["cap", "czapka z daszkiem", "🧢"], ["socks", "skarpetki", "🧦"], ["scarf", "szalik", "🧣"],
    ["gloves", "rękawiczki", "🧤"], ["coat", "płaszcz", "🧥"], ["boots", "kozaki", "👢"], ["glasses", "okulary", "👓"],
  ]},
  school: { name: "School", icon: "🎒", words: [
    ["book", "książka", "📕"], ["pencil", "ołówek", "✏️"], ["pen", "długopis", "🖊️"], ["ruler", "linijka", "📏"],
    ["scissors", "nożyczki", "✂️"], ["school bag", "plecak", "🎒"], ["teacher", "nauczyciel", "🧑‍🏫"], ["school", "szkoła", "🏫"],
    ["computer", "komputer", "💻"], ["paintbrush", "pędzel", "🖌️"], ["notebook", "zeszyt", "📓"], ["clock", "zegar", "🕐"],
  ]},
  home: { name: "My home", icon: "🏠", words: [
    ["house", "dom", "🏠"], ["door", "drzwi", "🚪"], ["bed", "łóżko", "🛏️"], ["chair", "krzesło", "🪑"],
    ["sofa", "kanapa", "🛋️"], ["bath", "wanna", "🛁"], ["shower", "prysznic", "🚿"], ["toilet", "toaleta", "🚽"],
    ["key", "klucz", "🔑"], ["TV", "telewizor", "📺"], ["phone", "telefon", "📱"], ["light bulb", "żarówka", "💡"],
  ]},
  weather: { name: "Weather", icon: "🌦️", words: [
    ["sun", "słońce", "☀️"], ["rain", "deszcz", "🌧️"], ["snow", "śnieg", "❄️"], ["cloud", "chmura", "☁️"],
    ["wind", "wiatr", "🌬️"], ["storm", "burza", "⛈️"], ["rainbow", "tęcza", "🌈"], ["hot", "gorąco", "🥵"],
    ["cold", "zimno", "🥶"], ["fog", "mgła", "🌫️"],
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
    ["bike", "rower", "🚲"], ["boat", "łódka", "⛵"], ["ship", "statek", "🚢"], ["taxi", "taksówka", "🚕"],
    ["helicopter", "helikopter", "🚁"], ["rocket", "rakieta", "🚀"], ["tractor", "traktor", "🚜"], ["lorry", "ciężarówka", "🚚"],
  ]},
  jobs: { name: "Jobs", icon: "🧑‍🚒", words: [
    ["doctor", "lekarz", "🧑‍⚕️"], ["cook", "kucharz", "🧑‍🍳"], ["farmer", "rolnik", "🧑‍🌾"], ["police officer", "policjant", "👮"],
    ["firefighter", "strażak", "🧑‍🚒"], ["pilot", "pilot", "🧑‍✈️"], ["artist", "artysta", "🧑‍🎨"], ["singer", "piosenkarz", "🧑‍🎤"],
    ["astronaut", "astronauta", "🧑‍🚀"], ["builder", "budowlaniec", "👷"], ["scientist", "naukowiec", "🧑‍🔬"],
  ]},
  nature: { name: "Nature", icon: "🌳", words: [
    ["tree", "drzewo", "🌳"], ["flower", "kwiat", "🌸"], ["mountain", "góra", "⛰️"], ["sea", "morze", "🌊"],
    ["forest", "las", "🌲"], ["leaf", "liść", "🍃"], ["star", "gwiazda", "⭐"], ["volcano", "wulkan", "🌋"],
    ["island", "wyspa", "🏝️"], ["mushroom", "grzyb", "🍄"], ["cactus", "kaktus", "🌵"],
  ]},
  feelings: { name: "Feelings", icon: "😀", words: [
    ["happy", "szczęśliwy", "😀"], ["sad", "smutny", "😢"], ["angry", "zły", "😠"], ["scared", "przestraszony", "😨"],
    ["tired", "zmęczony", "😴"], ["surprised", "zaskoczony", "😲"], ["sick", "chory", "🤒"], ["excited", "podekscytowany", "🤩"],
    ["bored", "znudzony", "😒"],
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
    ["chick", "kurczątko", "🐣"], ["egg", "jajko", "🥚"], ["bunny", "zajączek", "🐰"], ["flower", "kwiat", "🌷"],
    ["butterfly", "motyl", "🦋"], ["bee", "pszczoła", "🐝"], ["basket", "koszyk", "🧺"], ["rainbow", "tęcza", "🌈"],
    ["umbrella", "parasol", "☂️"], ["ladybird", "biedronka", "🐞"],
  ]},
  summer: { name: "Summer", icon: "🏖️", words: [
    ["beach", "plaża", "🏖️"], ["sea", "morze", "🌊"], ["sun", "słońce", "☀️"], ["sunglasses", "okulary przeciwsłoneczne", "🕶️"],
    ["shell", "muszelka", "🐚"], ["crab", "krab", "🦀"], ["ice cream", "lody", "🍦"], ["swimsuit", "strój kąpielowy", "👙"],
    ["tent", "namiot", "⛺"], ["watermelon", "arbuz", "🍉"], ["holiday", "wakacje", "✈️"],
  ]},
};
