// Sample study note images and presets for 1-click testing
export interface SampleStudyPreset {
  id: string;
  title: string;
  subject: string;
  topic: string;
  language: 'Bangla' | 'English';
  previewColor: string;
  description: string;
  svgImage: string;
}

function generateSvgDataUri(
  title: string,
  subject: string,
  contentLines: string[],
  accentColor: string,
  bgColor: string = '#fdfbf7'
): string {
  const linesSvg = contentLines
    .map(
      (line, i) =>
        `<text x="40" y="${140 + i * 28}" font-family="system-ui, sans-serif" font-size="14" fill="#2d3748">${line}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
    <rect width="600" height="420" rx="12" fill="${bgColor}" stroke="#e2e8f0" stroke-width="2"/>
    <rect x="0" y="0" width="600" height="12" fill="${accentColor}" rx="4"/>
    <line x1="30" y1="50" x2="570" y2="50" stroke="#cbd5e1" stroke-dasharray="4 4" stroke-width="1.5"/>
    <text x="40" y="85" font-family="system-ui, sans-serif" font-weight="bold" font-size="18" fill="#1a202c">${title}</text>
    <rect x="40" y="98" width="130" height="20" rx="4" fill="${accentColor}" fill-opacity="0.15"/>
    <text x="48" y="112" font-family="system-ui, sans-serif" font-weight="600" font-size="11" fill="${accentColor}">${subject}</text>
    <line x1="40" y1="125" x2="560" y2="125" stroke="#e2e8f0" stroke-width="1.5"/>
    ${linesSvg}
    <rect x="40" y="380" width="520" height="1" fill="#cbd5e1"/>
    <text x="40" y="400" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">ExamForge Study Note Capture • Page 1 of 1</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_STUDY_PRESETS: SampleStudyPreset[] = [
  {
    id: 'sample_bangla',
    title: 'বাংলা ব্যাকরণ: সন্ধি ও সমাসের নিয়মাবলী',
    subject: 'Bangla',
    topic: 'সন্ধি ও কর্মধারয় সমাস',
    language: 'Bangla',
    previewColor: '#10b981',
    description: 'স্বরসন্ধি, ব্যঞ্জনসন্ধি এবং প্রধান সমাসসমূহের নিয়ম ও উদাহরণ।',
    svgImage: generateSvgDataUri(
      'বাংলা ব্যাকরণ: সন্ধি ও সমাস',
      'বাংলা ১ম ও ২য় পত্র',
      [
        '১. গায়ক = গৈ + অক (ঐ-কারের পর অ থাকলে আয় হয়)',
        '২. তন্মেধ্যে = তৎ + মধ্যে (ত বর্গের পর ম থাকলে ন হয়)',
        '৩. নিপাতনে সিদ্ধ সন্ধি: পর + পর = পরস্পর, এক + দশ = একাদশ',
        '৪. সমাস: সিংহ চিহ্নিত আসন = সিংহাসন (মধ্যপদলোপী কর্মধারয়)',
        '৫. কারক: "পাপে বিরত হও" = অপাদানে ৭মী বিভক্তি',
        '৬. "মেঘে বৃষ্টি হয়" = অপাদান কারক (উৎপত্তি অর্থে)',
        '৭. প্রাচীন বাংলা সাহিত্যের আদি নিদর্শন: চর্যাপদ (হরপ্রসাদ শাস্ত্রী ১৯০৭)'
      ],
      '#10b981',
      '#f0fdf4'
    ),
  },
  {
    id: 'sample_math',
    title: 'বীজগণিত ও সূচকীয় সমীকরণ সূত্রাবলী',
    subject: 'Mathematics',
    topic: 'Algebra Formulas & Exponents',
    language: 'Bangla',
    previewColor: '#8b5cf6',
    description: 'বীজগণিতিক বর্গ, ঘন, পিথাগোরাস ও শতকরা মুনাফা সূত্রাবলী।',
    svgImage: generateSvgDataUri(
      'Mathematics: Core Formulas & Theorems',
      'Mathematics',
      [
        '• (a + b)^2 = a^2 + 2ab + b^2, ab = ((a+b)^2 - (a-b)^2) / 4',
        '• If x + 1/x = 3, then x^2 + 1/x^2 = 3^2 - 2 = 7',
        '• Indices: 2^(x+3) = 32 = 2^5  =>  x + 3 = 5  =>  x = 2',
        '• Pythagoras: c^2 = a^2 + b^2. Hypotenuse = 13, Base = 12 => Height = 5',
        '• Compound Interest: C = P(1 + r)^n. P=1000, r=10%, n=2 => C = 1210',
        '• Logarithm: log_2(x) = 5  =>  x = 2^5 = 32',
        '• Equilateral Triangle Area: (sqrt(3)/4) * a^2'
      ],
      '#8b5cf6',
      '#faf5ff'
    ),
  },
  {
    id: 'sample_english',
    title: 'English Grammar: Subject-Verb Agreement',
    subject: 'English',
    topic: 'Subject-Verb Concord & Vocabulary',
    language: 'English',
    previewColor: '#3b82f6',
    description: 'High-frequency competitive exam grammar rules and vocabulary.',
    svgImage: generateSvgDataUri(
      'English Grammar: High-Frequency Rules',
      'English Language',
      [
        '1. "Neither of" takes a singular verb: Neither of the candidates was selected.',
        '2. Noun of Multitude: The committee are divided in their opinions.',
        '3. Compound idea: Bread and butter is his favorite breakfast.',
        '4. Preposition: Proficient IN mathematics; Die OF disease, FROM overeating.',
        '5. Vocabulary: "Ephemeral" = transient, short-lived (Antonym: eternal)',
        '6. Vocabulary: "Meticulous" = extremely careful (Antonym: careless)',
        '7. Idiom: "A white elephant" = costly but useless possession'
      ],
      '#3b82f6',
      '#eff6ff'
    ),
  },
  {
    id: 'sample_gk',
    title: 'সাধারণ জ্ঞান: বাংলাদেশ মুক্তিযুদ্ধ ও সংবিধান',
    subject: 'General Knowledge',
    topic: 'মুক্তিযুদ্ধ ও রাষ্ট্রীয় মূলনীতি',
    language: 'Bangla',
    previewColor: '#f59e0b',
    description: 'মুজিবনগর সরকার, সংবিধান দিবস, বীরশ্রেষ্ঠ এবং মেগা প্রকল্পসমূহ।',
    svgImage: generateSvgDataUri(
      'সাধারণ জ্ঞান: বাংলাদেশ ও আন্তর্জাতিক',
      'General Knowledge',
      [
        '• মুজিবনগর সরকার: গঠন ১০ এপ্রিল ১৯৭১, শপথ ১৭ এপ্রিল ১৯৭১ (মেহেরপুর)',
        '• বাংলাদেশের সংবিধান: গৃহীত ৪ নভেম্বর ১৯৭২, কার্যকর ১৬ ডিসেম্বর ১৯৭২',
        '• বীরশ্রেষ্ঠ মতিউর রহমান: একমাত্র বিমান বাহিনী সদস্য',
        '• আন্তর্জাতিক আদালত (ICJ): দ্য হেগ, নেদারল্যান্ডস',
        '• বাংলাদেশের একমাত্র পাহাড়ি দ্বীপ: মহেশখালী (কক্সবাজার)',
        '• সূর্যোদয়ের দেশ: জাপান; মধ্যরাতের সূর্যের দেশ: নরওয়ে',
        '• সংবিধানের মূলনীতি ৪টি: জাতীয়তাবাদ, সমাজতন্ত্র, গণতন্ত্র, ধর্মনিরপেক্ষতা'
      ],
      '#f59e0b',
      '#fffbeb'
    ),
  },
  {
    id: 'sample_cs',
    title: 'Computer Science: Networking & OS Core',
    subject: 'Computer Science / IT',
    topic: 'OSI Model, Operating Systems & DBMS',
    language: 'English',
    previewColor: '#06b6d4',
    description: 'OSI layers, scheduling algorithms, IPv4/v6, and ACID properties.',
    svgImage: generateSvgDataUri(
      'Computer Science: Networking & OS Core',
      'Computer Science / IT',
      [
        '1. OSI Transport Layer (Layer 4): end-to-end reliable transmission & flow control.',
        '2. Addressing: IPv4 is 32-bit (4 octets), IPv6 is 128-bit.',
        '3. Scheduling: Standard Shortest Job First (SJF) is non-preemptive.',
        '4. Security Ports: HTTPS uses port 443; HTTP uses port 80; SSH uses port 22.',
        '5. DBMS: ACID properties (Atomicity, Consistency, Isolation, Durability).',
        '6. NoSQL: MongoDB is document-based; Redis is in-memory key-value cache.',
        '7. Time Complexity: Binary search on sorted array is O(log n).'
      ],
      '#06b6d4',
      '#ecfeff'
    ),
  },
];
