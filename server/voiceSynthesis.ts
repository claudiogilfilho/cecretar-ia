export type VoiceProvider = "google_chirp" | "elevenlabs";

export type VoiceSynthesisInput = {
  text: string;
  provider: VoiceProvider;
  googleVoice?: string;
  elevenLabsVoiceId?: string | null;
  speechRatePercent?: number;
};

export function shouldReplyWithAudio(replyMode: "automatic" | "text_only" | "audio_only", inboundType: string) {
  if (replyMode === "audio_only") return true;
  if (replyMode === "text_only") return false;
  return inboundType === "audio" || inboundType === "voice";
}

export function getVoiceProviderReadiness() {
  return {
    google: Boolean(process.env.GOOGLE_CLOUD_TTS_API_KEY),
    elevenLabs: Boolean(process.env.ELEVENLABS_API_KEY),
    transcription: Boolean(process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY),
  };
}

async function synthesizeGoogle(input: VoiceSynthesisInput) {
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!key) throw new Error("Adicione GOOGLE_CLOUD_TTS_API_KEY para ativar o Google Chirp 3 HD.");
  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: input.text },
      voice: { languageCode: "pt-BR", name: input.googleVoice || "pt-BR-Chirp3-HD-Aoede" },
      audioConfig: { audioEncoding: "MP3", speakingRate: Math.min(2, Math.max(0.25, (input.speechRatePercent ?? 100) / 100)) },
    }),
  });
  if (!response.ok) throw new Error(`Google Chirp respondeu com ${response.status}.`);
  const data = await response.json() as { audioContent?: string };
  if (!data.audioContent) throw new Error("O Google Chirp não retornou áudio.");
  return Buffer.from(data.audioContent, "base64");
}

async function synthesizeElevenLabs(input: VoiceSynthesisInput) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Adicione ELEVENLABS_API_KEY para ativar a voz Premium.");
  if (!input.elevenLabsVoiceId) throw new Error("Informe o Voice ID da ElevenLabs.");
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.elevenLabsVoiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: input.text, model_id: "eleven_multilingual_v2" }),
  });
  if (!response.ok) throw new Error(`ElevenLabs respondeu com ${response.status}.`);
  return Buffer.from(await response.arrayBuffer());
}

export async function synthesizeVoice(input: VoiceSynthesisInput) {
  const text = input.text.trim();
  if (!text) throw new Error("Digite um texto para testar a voz.");
  if (text.length > 1200) throw new Error("O teste de voz aceita até 1.200 caracteres.");
  const audio = input.provider === "elevenlabs" ? await synthesizeElevenLabs({ ...input, text }) : await synthesizeGoogle({ ...input, text });
  return { audio, contentType: "audio/mpeg" as const };
}
