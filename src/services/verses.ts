import type { DailyVerse } from '@/types';

const VERSES: DailyVerse[] = [
  {
    reference: 'Philippians 4:6-7',
    text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
    date: '',
  },
  {
    reference: 'Jeremiah 29:11',
    text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
    date: '',
  },
  {
    reference: 'Psalm 46:10',
    text: 'He says, "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."',
    date: '',
  },
  {
    reference: 'Isaiah 41:10',
    text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
    date: '',
  },
  {
    reference: 'Romans 8:28',
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    date: '',
  },
  {
    reference: 'Psalm 23:1-3',
    text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    date: '',
  },
  {
    reference: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    date: '',
  },
  {
    reference: 'Matthew 11:28',
    text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
    date: '',
  },
  {
    reference: 'Psalm 34:18',
    text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
    date: '',
  },
  {
    reference: '2 Corinthians 12:9',
    text: 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness."',
    date: '',
  },
  {
    reference: 'Joshua 1:9',
    text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    date: '',
  },
  {
    reference: 'Psalm 91:1-2',
    text: 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, "He is my refuge and my fortress, my God, in whom I trust."',
    date: '',
  },
  {
    reference: 'Lamentations 3:22-23',
    text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
    date: '',
  },
  {
    reference: '1 Peter 5:7',
    text: 'Cast all your anxiety on him because he cares for you.',
    date: '',
  },
  {
    reference: 'John 14:27',
    text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
    date: '',
  },
  {
    reference: 'Romans 15:13',
    text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
    date: '',
  },
  {
    reference: 'Psalm 119:105',
    text: 'Your word is a lamp for my feet, a light on my path.',
    date: '',
  },
  {
    reference: 'Isaiah 40:31',
    text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
    date: '',
  },
  {
    reference: 'Ephesians 3:20',
    text: 'Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us.',
    date: '',
  },
  {
    reference: 'Psalm 27:1',
    text: 'The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?',
    date: '',
  },
  {
    reference: 'Hebrews 11:1',
    text: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
    date: '',
  },
  {
    reference: 'Psalm 37:4',
    text: 'Take delight in the Lord, and he will give you the desires of your heart.',
    date: '',
  },
  {
    reference: 'Matthew 6:33',
    text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.',
    date: '',
  },
  {
    reference: 'Colossians 3:15',
    text: 'Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful.',
    date: '',
  },
  {
    reference: '2 Timothy 1:7',
    text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.',
    date: '',
  },
  {
    reference: 'Psalm 139:14',
    text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.',
    date: '',
  },
  {
    reference: 'Galatians 5:22-23',
    text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.',
    date: '',
  },
  {
    reference: 'Psalm 16:11',
    text: 'You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.',
    date: '',
  },
  {
    reference: 'James 1:5',
    text: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.',
    date: '',
  },
  {
    reference: 'Psalm 121:1-2',
    text: 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.',
    date: '',
  },
];

export function getDailyVerse(): DailyVerse {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const index = dayOfYear % VERSES.length;
  return {
    ...VERSES[index],
    date: today.toISOString().split('T')[0],
  };
}

export function getRandomVerse(): DailyVerse {
  const index = Math.floor(Math.random() * VERSES.length);
  return {
    ...VERSES[index],
    date: new Date().toISOString().split('T')[0],
  };
}
