import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
// youtube-transcript 패키지의 ESM 빌드를 직접 참조 (패키지 exports 필드 미지원으로 인한 우회)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js'
import { prisma } from '../../db/index.js'
import type { SummaryProvider } from '@app/shared'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function getGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
}

const PROMPT = (transcript: string) =>
  `다음은 유튜브 영상의 자막입니다. 핵심 내용을 한국어로 명확하고 구조적으로 요약해주세요.

중요한 포인트는 불릿 포인트(•)로 정리하고, 전체 요약은 300-500자 내외로 작성해주세요.

자막:
${transcript.slice(0, 12000)}`

async function callAI(provider: SummaryProvider, prompt: string): Promise<string> {
  if (provider === 'CLAUDE') {
    const message = await getAnthropic().messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    return message.content[0].type === 'text' ? message.content[0].text : ''
  } else if (provider === 'OPENAI') {
    const message = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    return message.choices[0].message.content ?? ''
  } else {
    // GEMINI
    const model = getGemini().getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  }
}

export async function summarize(id: string, url: string, provider: SummaryProvider): Promise<void> {
  try {
    // 1. PROCESSING으로 상태 변경
    await prisma.summary.update({
      where: { id },
      data: { status: 'PROCESSING' },
    })

    // 2. YouTube 자막 추출
    const videoId = extractVideoId(url)
    if (!videoId) throw new Error('유효하지 않은 유튜브 URL입니다.')

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
    const transcript = transcriptItems.map((item: any) => item.text).join(' ')

    if (!transcript.trim()) throw new Error('이 영상에는 자막이 없습니다.')

    // 3. 영상 제목 추출 (YouTube oEmbed API)
    let title = url
    try {
      const oEmbedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      )
      if (oEmbedRes.ok) {
        const oEmbedData = (await oEmbedRes.json()) as { title: string }
        title = oEmbedData.title
      }
    } catch {
      // 제목 추출 실패는 무시
    }

    // 4. AI 요약 생성 (provider에 따라 분기)
    const summaryText = await callAI(provider, PROMPT(transcript))

    // 5. DONE으로 업데이트
    await prisma.summary.update({
      where: { id },
      data: { title, summary: summaryText, status: 'DONE' },
    })
  } catch (err) {
    await prisma.summary.update({
      where: { id },
      data: {
        status: 'ERROR',
        errorMsg: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
      },
    })
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}
