import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs'
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const LOG_GROUP = process.env.LOG_GROUP ?? '/whats-the-score/project-frontend'

class Logger {
  private sqs: SQSClient | null = null
  private logs: CloudWatchLogsClient | null = null
  private sequenceToken: string | undefined
  private ensuredStream: string | null = null

  private getCredentials() {
    return process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.ACCESS_KEY_ID,
          secretAccessKey: process.env.SECRET_ACCESS_KEY,
          sessionToken: process.env.SESSION_TOKEN,
        }
      : undefined
  }

  private getRegion() {
    return process.env.REGION ?? 'us-east-1'
  }

  private getSqsClient(): SQSClient {
    if (!this.sqs) {
      this.sqs = new SQSClient({
        region: this.getRegion(),
        credentials: this.getCredentials(),
      })
    }
    return this.sqs
  }

  private getLogsClient(): CloudWatchLogsClient {
    if (!this.logs) {
      this.logs = new CloudWatchLogsClient({
        region: this.getRegion(),
        credentials: this.getCredentials(),
      })
    }
    return this.logs
  }

  private logStreamName() {
    return new Date().toISOString().slice(0, 10)
  }

  private async ensureLogStream(logStreamName: string) {
    if (this.ensuredStream === logStreamName) {
      return
    }

    const client = this.getLogsClient()

    try {
      await client.send(new CreateLogGroupCommand({ logGroupName: LOG_GROUP }))
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : ''
      if (name !== 'ResourceAlreadyExistsException') {
        throw error
      }
    }

    try {
      await client.send(
        new CreateLogStreamCommand({
          logGroupName: LOG_GROUP,
          logStreamName,
        })
      )
      this.sequenceToken = undefined
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : ''
      if (name !== 'ResourceAlreadyExistsException') {
        throw error
      }

      const streams = await client.send(
        new DescribeLogStreamsCommand({
          logGroupName: LOG_GROUP,
          logStreamNamePrefix: logStreamName,
          limit: 1,
        })
      )
      this.sequenceToken = streams.logStreams?.[0]?.uploadSequenceToken
    }

    this.ensuredStream = logStreamName
  }

  private async writeCloudWatch(
    level: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    const logStreamName = this.logStreamName()

    try {
      await this.ensureLogStream(logStreamName)

      const result = await this.getLogsClient().send(
        new PutLogEventsCommand({
          logGroupName: LOG_GROUP,
          logStreamName,
          sequenceToken: this.sequenceToken,
          logEvents: [
            {
              timestamp: Date.now(),
              message: JSON.stringify({
                level,
                message,
                timestamp: new Date().toISOString(),
                ...details,
              }),
            },
          ],
        })
      )

      this.sequenceToken = result.nextSequenceToken
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error)
      console.error('[logger] CloudWatch write failed:', errMessage)
    }
  }

  public async log(
    level: string,
    event_type: string,
    service_type: string,
    provider: string,
    model: string,
    output?: string
  ): Promise<void> {
    const queueUrl = process.env.SQS_QUEUE_URL
    if (!queueUrl) {
      await this.writeCloudWatch('warn', 'SQS_QUEUE_URL is not set; skipping SQS send', {
        event_type,
      })
      return
    }

    try {
      const result = await this.getSqsClient().send(
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

      await this.writeCloudWatch('info', 'SQS message sent', {
        event_type,
        service_type,
        provider,
        model,
        messageId: result.MessageId,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      await this.writeCloudWatch('error', 'SQS send failed', {
        event_type,
        service_type,
        provider,
        model,
        error: message,
      })
    }
  }
}

export const logger = new Logger()
