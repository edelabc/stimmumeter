import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { AIConfiguration, MoodEntryWithValues, Pseudonym, MoodIndicator } from './supabase';

export interface AIAnalysisRequest {
  pseudonym: Pseudonym;
  moodEntries: MoodEntryWithValues[];
  indicators: MoodIndicator[];
  timeframe?: string;
}

export interface AIAnalysisResponse {
  forecast: string;
  insights: string[];
  recommendations: string[];
  rawResponse?: string;
}

const createSystemPrompt = (pseudonym: Pseudonym, indicators: MoodIndicator[]): string => {
  const personalInfo = `
Persönliche Informationen:
- ${pseudonym.age ? `Alter: ${pseudonym.age} Jahre` : ''}
- ${pseudonym.gender ? `Geschlecht: ${pseudonym.gender}` : ''}
- ${pseudonym.weight ? `Gewicht: ${pseudonym.weight} kg` : ''}
- ${pseudonym.height ? `Körpergröße: ${pseudonym.height} cm` : ''}
- ${pseudonym.occupation ? `Beruf: ${pseudonym.occupation}` : ''}
`.trim();

  const indicatorInfo = indicators.map(ind =>
    `- ${ind.name}: Skala von ${ind.min_value} bis ${ind.max_value}`
  ).join('\n');

  return `Du bist ein hochspezialisierter KI-Assistent für psychologische Stimmungsanalyse und Prognosen.

DEINE AUFGABE:
Analysiere Stimmungsdaten präzise und erstelle fundierte Prognosen basierend auf historischen Mustern.

VERFÜGBARE INDIKATOREN:
${indicatorInfo}

${personalInfo ? `PERSONENPROFIL:\n${personalInfo}\n` : ''}

ANTWORT-FORMAT:
Strukturiere deine Antwort EXAKT in folgendem JSON-Format:
{
  "forecast": "Detaillierte Prognose für die kommenden Tage",
  "insights": ["Einsicht 1", "Einsicht 2", "Einsicht 3"],
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"]
}

WICHTIG:
- Antworte NUR mit valide JSON, keine zusätzlichen Texte
- Berücksichtige alle verfügbaren Daten inkl. Zeitstempel
- Identifiziere Muster, Trends und Anomalien
- Gib konkrete, umsetzbare Empfehlungen
- Sei empathisch aber objektiv`;
};

const formatMoodData = (entries: MoodEntryWithValues[]): string => {
  return entries.map(entry => {
    const date = new Date(entry.entry_date).toLocaleDateString('de-DE');
    const values = entry.values.map(v => `${v.indicator_name}: ${v.value}`).join(', ');
    const note = entry.note ? `\nNotiz: ${entry.note}` : '';
    return `${date} - ${values}${note}`;
  }).join('\n\n');
};

export class AIService {
  static async testConnection(config: AIConfiguration): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const testPrompt = 'Antworte mit "OK" wenn du diese Nachricht erhältst.';

      switch (config.provider) {
        case 'openai': {
          const client = new OpenAI({
            apiKey: config.api_key,
            dangerouslyAllowBrowser: true
          });
          const response = await client.chat.completions.create({
            model: config.model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 10
          });
          return {
            success: true,
            message: 'Verbindung erfolgreich! API-Key ist gültig.',
            details: { model: config.model, response: response.choices[0]?.message?.content }
          };
        }

        case 'gemini': {
          const genAI = new GoogleGenerativeAI(config.api_key);
          const model = genAI.getGenerativeModel({ model: config.model });
          const result = await model.generateContent(testPrompt);
          return {
            success: true,
            message: 'Verbindung erfolgreich! API-Key ist gültig.',
            details: { model: config.model, response: result.response.text() }
          };
        }

        case 'claude': {
          const client = new Anthropic({
            apiKey: config.api_key,
            dangerouslyAllowBrowser: true
          });
          const response = await client.messages.create({
            model: config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: testPrompt }]
          });
          return {
            success: true,
            message: 'Verbindung erfolgreich! API-Key ist gültig.',
            details: { model: config.model, response: response.content[0] }
          };
        }

        case 'xai': {
          const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.api_key}`
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: testPrompt }],
              max_tokens: 10
            })
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || response.statusText);
          }
          const data = await response.json();
          return {
            success: true,
            message: 'Verbindung erfolgreich! API-Key ist gültig.',
            details: { model: config.model, response: data.choices[0]?.message?.content }
          };
        }

        case 'manus': {
          const response = await fetch('https://api.manus.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.api_key}`
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: testPrompt }],
              max_tokens: 10
            })
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || response.statusText);
          }
          const data = await response.json();
          return {
            success: true,
            message: 'Verbindung erfolgreich! API-Key ist gültig.',
            details: { model: config.model, response: data.choices[0]?.message?.content }
          };
        }

        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Verbindung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`,
        details: error
      };
    }
  }
  static async analyzeWithOpenAI(
    config: AIConfiguration,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    const client = new OpenAI({
      apiKey: config.api_key,
      dangerouslyAllowBrowser: true
    });

    const systemPrompt = config.system_prompt || createSystemPrompt(request.pseudonym, request.indicators);
    const moodData = formatMoodData(request.moodEntries);

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analysiere folgende Stimmungsdaten:\n\n${moodData}` }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '{}';
    return this.parseAIResponse(content);
  }

  static async analyzeWithGemini(
    config: AIConfiguration,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    const genAI = new GoogleGenerativeAI(config.api_key);
    const model = genAI.getGenerativeModel({ model: config.model });

    const systemPrompt = config.system_prompt || createSystemPrompt(request.pseudonym, request.indicators);
    const moodData = formatMoodData(request.moodEntries);

    const prompt = `${systemPrompt}\n\nAnalysiere folgende Stimmungsdaten:\n\n${moodData}`;
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return this.parseAIResponse(content);
  }

  static async analyzeWithClaude(
    config: AIConfiguration,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    const client = new Anthropic({
      apiKey: config.api_key,
      dangerouslyAllowBrowser: true
    });

    const systemPrompt = config.system_prompt || createSystemPrompt(request.pseudonym, request.indicators);
    const moodData = formatMoodData(request.moodEntries);

    const response = await client.messages.create({
      model: config.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analysiere folgende Stimmungsdaten:\n\n${moodData}`
        }
      ]
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '{}';

    return this.parseAIResponse(content);
  }

  static async analyzeWithXAI(
    config: AIConfiguration,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    const systemPrompt = config.system_prompt || createSystemPrompt(request.pseudonym, request.indicators);
    const moodData = formatMoodData(request.moodEntries);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analysiere folgende Stimmungsdaten:\n\n${moodData}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`XAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    return this.parseAIResponse(content);
  }

  static async analyzeWithManus(
    config: AIConfiguration,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    const systemPrompt = config.system_prompt || createSystemPrompt(request.pseudonym, request.indicators);
    const moodData = formatMoodData(request.moodEntries);

    const response = await fetch('https://api.manus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analysiere folgende Stimmungsdaten:\n\n${moodData}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Manus API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    return this.parseAIResponse(content);
  }

  static async analyze(
    config: AIConfiguration,
    request: AIAnalysisRequest
  ): Promise<AIAnalysisResponse> {
    switch (config.provider) {
      case 'openai':
        return this.analyzeWithOpenAI(config, request);
      case 'gemini':
        return this.analyzeWithGemini(config, request);
      case 'claude':
        return this.analyzeWithClaude(config, request);
      case 'xai':
        return this.analyzeWithXAI(config, request);
      case 'manus':
        return this.analyzeWithManus(config, request);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  private static parseAIResponse(content: string): AIAnalysisResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          forecast: parsed.forecast || 'Keine Prognose verfügbar',
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || [],
          rawResponse: content
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    return {
      forecast: content.substring(0, 500),
      insights: ['Antwort konnte nicht strukturiert werden'],
      recommendations: [],
      rawResponse: content
    };
  }
}
