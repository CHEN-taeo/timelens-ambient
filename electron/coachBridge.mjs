import { runCoach } from '../coach/coachHandler.js'

export async function runCoachEmbedded(body = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY
  return runCoach({
    intent: body.intent,
    answers: body.answers,
    mode: body.mode || 'fix',
    clientVague: body.clientVague,
    editorContext: body.editorContext,
    apiKey,
  })
}
