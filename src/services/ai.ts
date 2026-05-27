import type { AIMessage } from '@/types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a compassionate and supportive faith companion assistant. You help users deepen their relationship with God through prayer, scripture, and encouragement.

Important guidelines:
- You are NOT God. Never speak as if you are God or claim divine authority.
- You are a supportive faith companion who helps users pray, reflect, and grow spiritually.
- Be warm, empathetic, and encouraging.
- Suggest relevant Bible verses when appropriate.
- Help users craft prayers based on their feelings and situations.
- Provide gentle guidance without being preachy or judgmental.
- Respect diverse Christian traditions and denominations.
- Be sensitive to users who are struggling or in pain.
- Keep responses concise but meaningful.`;

export async function sendMessage(
  messages: AIMessage[],
  apiKey?: string,
): Promise<string> {
  const key = apiKey ?? process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!key) {
    return getFallbackResponse(messages[messages.length - 1]?.content ?? '');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? getFallbackResponse('');
  } catch {
    return getFallbackResponse(messages[messages.length - 1]?.content ?? '');
  }
}

export async function generateDevotional(
  mood?: string,
  recentPrayers?: string[],
  apiKey?: string,
): Promise<{
  title: string;
  content: string;
  scripture_reference: string;
  scripture_text: string;
  reflection_prompt: string;
  prayer_suggestion: string;
}> {
  const key = apiKey ?? process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  const prompt = `Generate a daily devotional${mood ? ` for someone feeling ${mood}` : ''}.${
    recentPrayers?.length
      ? ` Their recent prayers have been about: ${recentPrayers.join(', ')}.`
      : ''
  }

Return a JSON object with these exact fields:
- title: A short, inspiring title
- content: A 2-3 paragraph devotional reflection (about 150 words)
- scripture_reference: The Bible verse reference (e.g., "Philippians 4:6-7")
- scripture_text: The full text of the scripture
- reflection_prompt: A thought-provoking question for personal reflection
- prayer_suggestion: A suggested prayer (2-3 sentences)

Return ONLY the JSON object, no other text.`;

  if (!key) {
    return getDefaultDevotional();
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
    return getDefaultDevotional();
  } catch {
    return getDefaultDevotional();
  }
}

export async function generatePrayer(
  situation: string,
  category?: string,
  apiKey?: string,
): Promise<string> {
  const key = apiKey ?? process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!key) {
    return getDefaultPrayer(situation);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Help me write a prayer about: ${situation}${category ? ` (category: ${category})` : ''}. Write a heartfelt, personal prayer that I can use. Keep it to 3-5 sentences.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? getDefaultPrayer(situation);
  } catch {
    return getDefaultPrayer(situation);
  }
}

function getFallbackResponse(userMessage: string): string {
  const responses = [
    "I'm here with you in this moment. Remember, \"Cast all your anxiety on him because he cares for you.\" (1 Peter 5:7). Would you like to talk more about what's on your heart?",
    "Thank you for sharing that with me. God sees you and loves you. \"The Lord is close to the brokenhearted and saves those who are crushed in spirit.\" (Psalm 34:18)",
    "What a beautiful thought to bring before God. \"Be still, and know that I am God.\" (Psalm 46:10). Let's take a moment to reflect on His faithfulness.",
    "I hear you, and I want you to know that your feelings are valid. \"Peace I leave with you; my peace I give you.\" (John 14:27). How can I help you pray through this?",
  ];

  const index = userMessage.length % responses.length;
  return responses[index];
}

function getDefaultDevotional() {
  return {
    title: 'Finding Peace in His Presence',
    content:
      "In the midst of our busy lives, God invites us to pause and rest in His presence. Today, take a moment to breathe deeply and remember that the Creator of the universe cares about every detail of your life.\n\nWhen we feel overwhelmed, it's easy to forget that we are never alone. God promises to be our refuge and strength, an ever-present help in trouble. This isn't just a poetic phrase — it's a reality we can lean into every single day.\n\nToday, let go of what you cannot control and trust in the One who holds all things together.",
    scripture_reference: 'Psalm 46:1-2',
    scripture_text:
      'God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.',
    reflection_prompt:
      'What is one thing you are trying to control today that you can surrender to God?',
    prayer_suggestion:
      'Lord, I surrender my worries and fears to You today. Help me to trust in Your perfect plan and find peace in Your presence. Amen.',
  };
}

function getDefaultPrayer(situation: string): string {
  return `Dear Heavenly Father, I come before You with what is on my heart: ${situation}. I trust that You hear me and that You care deeply about every detail of my life. Give me strength, wisdom, and peace as I navigate this. I place my trust in You. In Jesus' name, Amen.`;
}
