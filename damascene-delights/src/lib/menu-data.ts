import coldImg from "@/assets/cat-cold.jpg";
import hotImg from "@/assets/cat-hot.jpg";
import saladImg from "@/assets/cat-salad.jpg";
import shawarmaImg from "@/assets/cat-shawarma.jpg";

export type MenuItem = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  calories: number;
};

export type MenuCategory = {
  id: string;
  category_en: string;
  category_ar: string;
  image: string;
  items: MenuItem[];
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const raw: Omit<MenuCategory, "id" | "items"> & { items: Omit<MenuItem, "id">[] }[] | any = [
  {
    category_en: "Appetizers",
    category_ar: "المقبلات",
    image: coldImg,
    items: [
      { name_en: "Mutabal", name_ar: "متبل", description_en: "Smoked eggplant blended with yogurt, lemon, and tahini (sesame paste).", description_ar: "اللبن الشامي مع الباذنجان المشوي الممزوج مع الليمون وطحينة السمسم", price: 21, calories: 529 },
      { name_en: "Baba Ghanouj", name_ar: "بابا غنوج", description_en: "Smoked eggplant mixed with tomatoes and onions, garnished with walnuts and pomegranate molasses.", description_ar: "الباذنجان المشوي مع الطماطم والبصل المزينة بالجوز ودبس الرمان", price: 21, calories: 443 },
      { name_en: "Muhammara", name_ar: "محمرة", description_en: "Fresh walnuts blended with tomato paste and chili paste.", description_ar: "الجوز الطازج الممزوج مع دبس الطماطم ودبس الفلفل الحار", price: 21, calories: 490 },
      { name_en: "Beiruti Hummus", name_ar: "حمص بيروتي", description_en: "Mashed chickpeas blended with parsley, garlic, and tahini.", description_ar: "حبوب الحمص المطهوة مع البقدونس والثوم والممزوجة مع طحينة السمسم", price: 21, calories: 335 },
      { name_en: "Hummus with Meat", name_ar: "حمص باللحمة", description_en: "Mashed chickpeas blended with tahini, topped with diced \"Ras Asfour\" meat.", description_ar: "حبوب الحمص المطهوة والممزوجة مع طحينة السمسم ولحم رأس العصفور", price: 32, calories: 529 },
      { name_en: "Eggplant Moussaka", name_ar: "مسقعة باذنجان", description_en: "Crispy pita slices mixed with tomato sauce, garlic, and eggplant chunks.", description_ar: "شرائح الخبز المقرمش الممزوجة مع صلصة الطماطم والثوم وقطع الباذنجان", price: 22, calories: 438 },
      { name_en: "Stuffed Grape Leaves", name_ar: "ورق عنب", description_en: "Rice rolled in vine leaves, cooked with pomegranate molasses and Damascene spices.", description_ar: "أرز ملفوف بورق العنب المطبوخة مع دبس الرمان والتوابل الدمشقية", price: 18, calories: 425 },
    ],
  },
  {
    category_en: "Salads",
    category_ar: "السلطات",
    image: saladImg,
    items: [
      { name_en: "Fattoush", name_ar: "فتوش", description_en: "A mix of fresh vegetables, onions, and pomegranate, topped with crispy pita slices.", description_ar: "خليط من الخضار الطازجة والبصل والرمان الممزوج بشرائح الخبز المقرمش", price: 24, calories: 529 },
      { name_en: "Rocca (Arugula) Salad", name_ar: "سلطة جرجير", description_en: "A mix of arugula, onions, and tomatoes with pomegranate and a special Damascene vinaigrette.", description_ar: "خليط من الجرجير والبصل والطماطم مع الرمان وتتبيلة الخال الدمشقي المميزة", price: 24, calories: 443 },
      { name_en: "Chopped Salad", name_ar: "سلطة ناعمة", description_en: "A fine mix of cucumber, tomatoes, and lettuce dressed with olive oil and lemon.", description_ar: "خليط من الخيار والطماطم والخس المضاف إليها زيت الزيتون والليمون", price: 24, calories: 490 },
      { name_en: "Russian Salad", name_ar: "سلطة روسية", description_en: "A mix of boiled peas, corn, and potatoes with mayonnaise and a special Russian dressing.", description_ar: "خليط من البازيلاء والذرة والبطاطا المسلوقة مع المايونيز والصلصة الروسية المميزة", price: 18, calories: 529 },
    ],
  },
  {
    category_en: "Chicken Shawarma",
    category_ar: "شاورما دجاج",
    image: shawarmaImg,
    items: [
      { name_en: "Chicken Shawarma Sandwich", name_ar: "ساندويتش شاورما دجاج", description_en: "Chicken shawarma slices topped with garlic sauce and pickles, wrapped in fresh saj bread.", description_ar: "ساندويتش من شرحات شاورما الدجاج مغطاة بالثوم والمخلل الملفوفة بخبز الصاج الطازج", price: 13, calories: 575 },
      { name_en: "Arabic Chicken Shawarma", name_ar: "شاورما دجاج عربي", description_en: "6 pieces of sliced chicken shawarma wraps, served with french fries, garlic sauce, and pickles.", description_ar: "6 قطع من شاورما الدجاج تقدم مع شرحات البطاطس المقلية والثوم والمخلل", price: 24, calories: 726 },
      { name_en: "Chicken Majnouna", name_ar: "مجنونة دجاج", description_en: "Crispy pita slices mixed with chicken shawarma and a special Damascene vinaigrette.", description_ar: "شرائح الخبز المقرمش الممزوجة مع شرائح شاورما الدجاج وصلصة الخال الدمشقي", price: 12, calories: 510 },
      { name_en: "Chicken Shawarma Platter", name_ar: "شاورما دجاج فرط", description_en: "A generous portion of loose chicken shawarma served with garlic sauce, pickles, and french fries.", description_ar: "شرائح من شاورما الدجاج تقدم مع الثوم والمخلل وشرحات البطاطس المقلية", price: 38, calories: 1250 },
      { name_en: "1/2 Kilo Chicken Shawarma", name_ar: "½ كيلو شاورما دجاج", description_en: "Half a kilogram of chicken shawarma served with pickles and french fries.", description_ar: "نصف كيلو من شرائح شاورما الدجاج تقدم مع المخللات وشرحات البطاطس المقلية", price: 62, calories: 2523 },
      { name_en: "1 Kilo Chicken Shawarma", name_ar: "1 كيلو شاورما دجاج", description_en: "One kilogram of chicken shawarma served with pickles and french fries.", description_ar: "كيلو من شرائح شاورما الدجاج تقدم مع المخللات وشرحات البطاطس المقلية", price: 105, calories: 5059 },
    ],
  },
  {
    category_en: "Mixed Shawarma",
    category_ar: "شاورما مكس",
    image: shawarmaImg,
    items: [
      { name_en: "Mixed Shawarma Rolls", name_ar: "أصابع شاورما مكس", description_en: "5 mini chicken and beef shawarma wraps in fresh saj bread.", description_ar: "5 ميني ساندويتش من شاورما دجاج ولحم الممزوجة بخبز الصاج الطازج", price: 29, calories: 210 },
      { name_en: "Arabic Mixed Shawarma", name_ar: "شاورما عربي مكس", description_en: "12 pieces of sliced chicken and beef shawarma wraps, served with french fries, garlic sauce, tahini, and pickles.", description_ar: "12 قطعة من شاورما الدجاج واللحم مع شرحات البطاطس المقلية والثوم والطحينة والمخلل", price: 49, calories: 1301 },
      { name_en: "Mixed Shawarma Platter", name_ar: "شاورما فرط مكس", description_en: "A portion of loose chicken and beef shawarma served with pickles and french fries.", description_ar: "شرائح من شاورما الدجاج واللحم مع المخلل وشرحات البطاطس المقلية", price: 46, calories: 1230 },
    ],
  },
  {
    category_en: "Beef Shawarma",
    category_ar: "شاورما لحم",
    image: shawarmaImg,
    items: [
      { name_en: "Arabic Beef Shawarma", name_ar: "شاورما لحم عربي", description_en: "6 pieces of sliced beef shawarma wraps, served with french fries, tahini, and pickles.", description_ar: "6 قطع من شاورما اللحم تقدم مع شرحات البطاطس المقلية والطحينة والمخلل", price: 30, calories: 926 },
      { name_en: "Double Arabic Beef Shawarma", name_ar: "شاورما لحم عربي دبل", description_en: "12 pieces of sliced beef shawarma wraps, served with french fries, tahini, and pickles.", description_ar: "12 قطعة من شاورما اللحم تقدم مع شرحات البطاطس المقلية والطحينة والمخلل", price: 52, calories: 1501 },
      { name_en: "Beef Shawarma in Samoon", name_ar: "سمون شاورما لحم", description_en: "Beef shawarma slices topped with tahini, served in fresh samoon bread.", description_ar: "ساندويتش من شرحات شاورما اللحم مغطاة بالطحينة الملفوفة بخبز السمون الطازج", price: 22, calories: 650 },
      { name_en: "Beef Shawarma Rolls", name_ar: "أصابع شاورما لحم", description_en: "5 mini beef shawarma wraps topped with tahini, wrapped in fresh saj bread.", description_ar: "5 ميني ساندويتش من شاورما اللحم مغطاة بالطحينة الملفوفة بخبز الصاج الطازج", price: 30, calories: 223 },
      { name_en: "Beef Shawarma Fatteh", name_ar: "فتة شاورما لحم", description_en: "Beef shawarma layered over crispy pita bread, tahini, and Damascene spices.", description_ar: "فتة من شاورما اللحم مع الخبز المقرمش والطحينة وتوابل الخال الدمشقي", price: 43, calories: 1326 },
      { name_en: "Beef Majnouna", name_ar: "مجنونة لحم", description_en: "Crispy pita slices mixed with beef shawarma and a special Damascene vinaigrette.", description_ar: "شرائح الخبز المقرمش الممزوجة مع شرائح شاورما اللحم وصلصة الخال الدمشقي", price: 15, calories: 530 },
      { name_en: "Beef Shawarma Platter", name_ar: "شاورما لحم فرط", description_en: "A generous portion of loose beef shawarma served with tahini, pickles, and french fries.", description_ar: "شرائح من شاورما اللحم تقدم مع الطحينة والمخلل وشرحات البطاطس المقلية", price: 52, calories: 1322 },
    ],
  },
  {
    category_en: "Grilled Chicken",
    category_ar: "الفروج المشوي",
    image: hotImg,
    items: [
      { name_en: "Whole Grilled Chicken", name_ar: "فروج مشوي", description_en: "Whole grilled chicken marinated in Damascene spices, served with french fries and garlic sauce.", description_ar: "فروج مشوي كامل بالتتبيلة الدمشقية يقدم مع شرحات البطاطس المقلية والثوم", price: 64, calories: 2930 },
      { name_en: "Half Grilled Chicken", name_ar: "نصف فروج مشوي", description_en: "Half a grilled chicken in a special marinade, served with french fries and garlic sauce.", description_ar: "نصف فروج مشوي كامل بالتتبيلة الخاصة يقدم مع شرحات البطاطس المقلية والثوم", price: 32, calories: 1560 },
      { name_en: "Spicy Half Grilled Chicken", name_ar: "نصف فروج سبايسي", description_en: "Half a grilled chicken marinated in spicy seasonings, served with french fries and spicy garlic paste.", description_ar: "نصف فروج مشوي متبل بالتوابل الحارة يقدم مع شرحات البطاطس المقلية والثوم الحار", price: 32, calories: 1860 },
      { name_en: "Chicken Stuffed with Rice", name_ar: "فروج محشي رز", description_en: "Marinated grilled chicken stuffed with rice, served with a side of yogurt salad.", description_ar: "فروج مشوي بالتتبيلة الخاصة محشي بالرز يقدم مع سلطة الروب", price: 65, calories: 2500 },
      { name_en: "Chicken Stuffed with Freekeh", name_ar: "فروج محشي فريكة", description_en: "Marinated grilled chicken stuffed with freekeh (roasted green wheat), served with a side of yogurt salad.", description_ar: "فروج مشوي بالتتبيلة الخاصة محشي بالفريكة يقدم مع سلطة الروب", price: 65, calories: 2500 },
    ],
  },
  {
    category_en: "Western Meals & Sandwiches",
    category_ar: "الغربي",
    image: hotImg,
    items: [
      { name_en: "Shish Tawook Meal", name_ar: "وجبة شيش طاووق", description_en: "Grilled chicken breasts in a Damascene marinade, served with french fries and Russian salad.", description_ar: "صدور دجاج مشوية متبلة بالخلطة الدمشقية مع البطاطس المقلية والسلطة الروسية", price: 41, calories: 500 },
      { name_en: "Shish Tawook Sandwich", name_ar: "ساندويتش شيش طاووق", description_en: "Grilled marinated chicken breast sandwich with french fries and Russian salad.", description_ar: "ساندويتش صدور دجاج مشوية متبلة بالخلطة مع البطاطس المقلية والسلطة الروسية", price: 23, calories: 350 },
      { name_en: "French Fries Sandwich", name_ar: "ساندويتش بطاطا مقلية", description_en: "French fries wrapped with Russian salad and ketchup.", description_ar: "ساندويتش من أصابع البطاطس المقلية مع السلطة الروسية وصلصة الكاتشب", price: 12, calories: 380 },
      { name_en: "Kids Meal", name_ar: "وجبة أطفال", description_en: "Crispy chicken balls stuffed with cheese, served with french fries and a fun toy.", description_ar: "كرات الدجاج المقرمشة المحشوة بالجبنة تقدم مع شرائح البطاطس المقلية ولعبة هدية ممتعة", price: 22, calories: 603 },
    ],
  },
  {
    category_en: "Fruit Salads & Smoothies",
    category_ar: "سلطات فواكه",
    image: coldImg,
    items: [
      { name_en: "Classic Emperor", name_ar: "إمبراطور كلاسيك", description_en: "A rich cocktail of kiwi, strawberries, banana, and avocado, topped with Damascene clotted cream (Qishta), nuts, and honey.", description_ar: "إمبراطور من الكيوي والفراولة والموز وكوكتيل الأفوكادو المضاف عليها القشطة الدمشقية والمزينة بالمكسرات والعسل", price: 38, calories: 1079 },
      { name_en: "Mango Emperor", name_ar: "إمبراطور مانجو", description_en: "A rich cocktail of kiwi, strawberries, banana, and fresh mango, topped with Damascene clotted cream, nuts, and honey.", description_ar: "إمبراطور من الكيوي والفراولة والموز وكوكتيل المانجو الطازج المضاف عليها القشطة الدمشقية والمزينة بالمكسرات والعسل", price: 38, calories: 1050 },
      { name_en: "Al-Khal Al-Dimashqi Emperor", name_ar: "إمبراطور الخال الدمشقي", description_en: "A cocktail of strawberries, banana, pineapple, and chocolate, topped with Damascene clotted cream, nuts, and chocolate drizzle.", description_ar: "إمبراطور من الفراولة والموز والأناناس وكوكتيل الشوكولا المضاف عليها القشطة الدمشقية والمزينة بالمكسرات والشوكولا", price: 38, calories: 1200 },
      { name_en: "Classic Fruit Salad", name_ar: "سلطة كلاسيك", description_en: "Mango, kiwi, and pineapple chunks with sliced strawberries, topped with Damascene clotted cream, nuts, and honey.", description_ar: "سلطة من المانجو والكيوي والأناناس مع شرائح الفراولة المضاف عليها القشطة الدمشقية والمزينة بالمكسرات والعسل", price: 38, calories: 750 },
    ],
  },
  {
    category_en: "Fresh Juices",
    category_ar: "العصائر الطازجة",
    image: coldImg,
    items: [
      { name_en: "Guava", name_ar: "جوافة", description_en: "Fresh guava juice.", description_ar: "عصير جوافة طازج", price: 16, calories: 523 },
      { name_en: "Avocado", name_ar: "أفوكادو", description_en: "Fresh avocado juice.", description_ar: "عصير أفوكادو طازج", price: 16, calories: 580 },
      { name_en: "Mixed Fruit Cocktail", name_ar: "كوكتيل", description_en: "A blend of fresh mixed fruits.", description_ar: "مزيج من الفواكه الطازجة", price: 16, calories: 443 },
      { name_en: "Lemon Mint", name_ar: "ليمون نعناع", description_en: "Fresh lemon and mint juice.", description_ar: "عصير ليمون ونعناع طازج", price: 16, calories: 320 },
    ],
  },
  {
    category_en: "Beverages",
    category_ar: "المشروبات",
    image: coldImg,
    items: [
      { name_en: "Kinza Cola", name_ar: "كينزا كولا", description_en: "Refreshing cola soft drink.", description_ar: "مشروب كولا منعش", price: 6, calories: 168 },
      { name_en: "Kinza Cola Diet", name_ar: "كينزا كولا دايت", description_en: "Sugar-free cola soft drink.", description_ar: "مشروب كولا خالي من السكر", price: 6, calories: 0 },
      { name_en: "Kinza Lemon", name_ar: "كينزا ليمون", description_en: "Refreshing lemon soft drink.", description_ar: "مشروب ليمون منعش", price: 6, calories: 164 },
      { name_en: "Kinza Lemon Diet", name_ar: "كينزا ليمون دايت", description_en: "Sugar-free lemon soft drink.", description_ar: "مشروب ليمون خالي من السكر", price: 6, calories: 0 },
      { name_en: "Kinza Orange", name_ar: "كينزا برتقال", description_en: "Refreshing orange soft drink.", description_ar: "مشروب برتقال منعش", price: 6, calories: 176 },
      { name_en: "Kinza Citrus", name_ar: "كينزا حمضيات", description_en: "Refreshing citrus soft drink.", description_ar: "مشروب حمضيات منعش", price: 6, calories: 160 },
      { name_en: "Kinza Mixed Berries", name_ar: "كينزا توت بري", description_en: "Refreshing mixed berries soft drink.", description_ar: "مشروب توت بري منعش", price: 6, calories: 165 },
      { name_en: "Ayran (Yogurt Drink)", name_ar: "لبن عيران", description_en: "Traditional cold yogurt drink.", description_ar: "مشروب اللبن البارد التقليدي", price: 12, calories: 200 },
      { name_en: "Bottled Water", name_ar: "مياه", description_en: "Still bottled water.", description_ar: "مياه معبأة", price: 3, calories: 0 },
    ],
  },
];

export const menu: MenuCategory[] = raw.map((c: any) => ({
  id: slug(c.category_en),
  category_en: c.category_en,
  category_ar: c.category_ar,
  image: c.image,
  items: c.items.map((it: any) => ({ ...it, id: slug(c.category_en) + "-" + slug(it.name_en) })),
}));
