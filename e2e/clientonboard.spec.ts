import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

const TRANSCRIPT =
  'My firstname is Jed My lastname is Jefferies and my email is jedjeff@gmail.com';

const mockClient = {
  client_id: 'e2e-client-1',
  first_name: 'Jed',
  last_name: 'Jefferies',
  email: 'jedjeff@gmail.com',
};

type MockClientState = typeof mockClient & {
  initial_consult_notes?: string;
  requested_counsellor?: string;
  urgency?: string;
};

/** Pause between sequential clicks (stability / visible pacing in recordings). */
const BETWEEN_CLICKS_MS = 2990;

const commonConcernLabel = "I'm feeling anxious and overwhelmed";

const mockRecommendationsResponse = {
  success: true,
  format: 'structured',
  recommendations: [
    {
      practitioner: {
        name: 'Dr. Jane Example',
        title: 'Clinical Psychologist',
        contact: { phone: '555-0100', email: 'jane@example.com' },
      },
      matchScore: 0.92,
      urgency: 'soon',
      nextSteps: ['Book an intake session'],
    },
    {
      practitioner: {
        name: 'Dr. Sam Other',
        title: 'Registered Counsellor',
        contact: { phone: '555-0200', email: 'sam@example.com' },
      },
      matchScore: 0.78,
      urgency: 'routine',
      nextSteps: ['Intro call'],
    },
  ],
};

test.describe('Client onboarding (logged in)', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['microphone'], { origin: baseURL });
    await context.addCookies([
      {
        name: 'authToken',
        value: 'e2e-test-token',
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'loginTime',
        value: String(Date.now()),
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  });

  test('voice capture, save, find counsellor, and completed tasks', async ({ page }) => {
    const betweenClicks = () => page.waitForTimeout(BETWEEN_CLICKS_MS);

    let mockClientState: MockClientState = { ...mockClient };

    await page.route('**/api/transcribe', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transcript: TRANSCRIPT }),
      });
    });

    await page.route('**/api/agent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          result: {
            first_name: 'Jed',
            last_name: 'Jefferies',
            email: 'jedjeff@gmail.com',
            rawOutput: JSON.stringify({
              first_name: 'Jed',
              last_name: 'Jefferies',
              email: 'jedjeff@gmail.com',
            }),
          },
        }),
      });
    });

    await page.route('**/api/counselling/recommend', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecommendationsResponse),
      });
    });

    await page.route('**/api/client', async (route) => {
      const request = route.request();
      const method = request.method();

      if (method === 'POST') {
        mockClientState = { ...mockClient };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockClientState,
            client: mockClientState,
          }),
        });
        return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockClientState),
        });
        return;
      }

      if (method === 'PUT') {
        const raw = request.postData();
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        if (typeof body.note === 'string') {
          mockClientState = {
            ...mockClientState,
            initial_consult_notes: body.note,
          };
        }
        if (typeof body.requested_counsellor === 'string') {
          mockClientState = {
            ...mockClientState,
            requested_counsellor: body.requested_counsellor,
            ...(typeof body.urgency === 'string' && { urgency: body.urgency }),
          };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, client: mockClientState }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Create Account Assistant' })).toBeVisible();

    await page.getByRole('button', { name: 'Start' }).click();
    await betweenClicks();

    await page.getByRole('button', { name: 'Stop' }).click();

    const reviewHeading = page.getByRole('heading', { name: /Detected Details \(Review\)/ });
    await expect(reviewHeading).toBeVisible({ timeout: 30_000 });

    const reviewPanel = page.locator('div').filter({ has: reviewHeading }).first();
    await expect(reviewPanel.getByText('First name: Jed')).toBeVisible();
    await expect(reviewPanel.getByText('Last name: Jefferies')).toBeVisible();
    await expect(reviewPanel.getByText('Email: jedjeff@gmail.com')).toBeVisible();
    await betweenClicks();

    await page.getByRole('button', { name: 'Save Details' }).click();

    await expect(page.getByRole('heading', { name: 'Create Account Assistant' })).toHaveCount(0);

    await expect(page.getByRole('heading', { name: 'Completed tasks' })).toBeVisible();
    const createAccountRow = page.getByRole('listitem').filter({ hasText: 'Create account' });
    await expect(createAccountRow).toBeVisible();
    await expect(createAccountRow.locator('.bg-green-500').first()).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Find Your Counsellor' })).toBeVisible();
    await betweenClicks();

    await page.getByRole('button', { name: commonConcernLabel }).click();

    await page.waitForTimeout(5000);
    await betweenClicks();

    await page.getByRole('button', { name: 'Find' }).click();

    await expect(
      page.getByRole('heading', { name: mockRecommendationsResponse.recommendations[0].practitioner.name }),
    ).toBeVisible({ timeout: 15_000 });
    await betweenClicks();

    await page
      .getByRole('button', { name: new RegExp(mockRecommendationsResponse.recommendations[0].practitioner.name) })
      .click();

    await expect(page.getByRole('heading', { name: 'Find Your Counsellor' })).toHaveCount(0);

    const findCounsellorRow = page.getByRole('listitem').filter({ hasText: 'Find your counsellor' });
    await expect(findCounsellorRow).toBeVisible();
    await expect(findCounsellorRow.locator('.bg-green-500').first()).toBeVisible();
  });
});
