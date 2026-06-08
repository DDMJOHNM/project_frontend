import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

class Logger {
  private sqs: SQSClient | null = null

  private getClient(): SQSClient {
    if (!this.sqs) {
      this.sqs = new SQSClient({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials:
          process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN,
              }
            : undefined,
      })
    }
    return this.sqs
  }

  public log(
    level: string,
    event_type: string,
    service_type: string,
    provider: string,
    model: string,
    output?: string
  ) {
    const queueUrl = process.env.AWS_SQS_QUEUE_URL
    if (!queueUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[logger] AWS_SQS_QUEUE_URL is not set; skipping SQS send')
      }
      return
    }

    void this.getClient()
      .send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            schema_version: '1.0.0',
            event_id: crypto.randomUUID(),
            event_type,
            severity: level,
            occurred_at: new Date().toISOString(),
            project_id: 'project-12345',
            user_id: 'user-67890',
            service_type,
            request_id: crypto.randomUUID(),
            tokens_used: 0,
            latency_ms: 0,
            has_correction: false,
            has_recommended: true,
            has_appointment: false,
            provider,
            model,
            ...(output !== undefined && { output }),
          }),
        })
      )
      .then((result) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[logger] SQS message sent:', result.MessageId)
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[logger] SQS send failed:', message)
      })
  }
}

export const logger = new Logger()
