import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockops:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('본문 그림·캡션과 코드 복사가 동작한다', async ({ page, context }) => {
  await page.goto('/#/learn/container-isolation');
  const diagram = page.getByRole('img', {
    name: '가상 머신별 게스트 커널과 컨테이너의 공유 호스트 커널 비교',
    exact: true,
  });
  await diagram.scrollIntoViewIfNeeded();
  await expect.poll(() => diagram.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(960);
  await expect(diagram.locator('xpath=ancestor::figure').locator('figcaption')).toContainText(
    'BlockOps 작성',
  );
  await page.goto('/#/learn/docker-commands');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: '코드 복사', exact: true }).first().click();
  await expect(page.getByRole('status').filter({ hasText: '코드를 복사했습니다.' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('docker');
});

test('이미지 오류에서도 대체 설명을 제공한다', async ({ page }) => {
  await page.route('**/images/container-layers.svg', (route) => route.abort());
  await page.goto('/#/learn/container-isolation');
  await page
    .getByRole('heading', { name: '그림으로 비교하는 VM과 컨테이너' })
    .scrollIntoViewIfNeeded();
  await expect(page.getByText(/이미지를 불러오지 못했습니다/)).toBeVisible();
});
