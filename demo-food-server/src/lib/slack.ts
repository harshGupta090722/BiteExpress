import { logger } from './logger'

// Lightweight Slack Incoming Webhook notifier. Fire-and-forget: a failed
// notification should never break an order mutation, so errors are only logged.
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export async function notifySlack(text: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    logger.debug('Slack webhook not configured, skipping notification', { text })
    return
  }

  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      logger.warn('Slack notification failed', { status: res.status })
    }
  } catch (err) {
    logger.warn('Slack notification error', { error: (err as Error).message })
  }
}
