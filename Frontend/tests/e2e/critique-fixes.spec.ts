import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockops:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('본문 예제의 정상 연결을 키보드로 삭제하고 작은 캔버스를 확장한다', async ({ page }) => {
  await page.goto('/#/learn/s3-objects');
  const example = page.getByTestId('inline-node-s3-objects');
  await example.getByRole('button', { name: '직접 연결해 보기', exact: true }).click();
  await example.getByLabel('예제 출발 노드').selectOption('dataset');
  await example.getByLabel('예제 도착 노드').selectOption('training');
  await example.getByRole('button', { name: '선택한 노드 연결', exact: true }).click();
  const list = example.getByRole('list', { name: '예제 연결 목록' });
  await expect(list.getByRole('button')).toHaveCount(1);
  const remove = list.getByRole('button').first();
  await remove.focus();
  await page.keyboard.press('Enter');
  await expect(example.locator('.react-flow__edge')).toHaveCount(0);
  await expect(example.getByText('연결이 없습니다.', { exact: false })).toBeVisible();
  const canvas = example.locator('.react-flow').locator('..');
  expect((await canvas.boundingBox())!.height).toBeLessThanOrEqual(440);
  await example.getByRole('button', { name: '예제 높이 늘리기', exact: true }).click();
  expect((await canvas.boundingBox())!.height).toBe(840);
  await example.getByRole('button', { name: '기본 높이', exact: true }).click();
  await example.getByRole('button', { name: '다음 연결 따라가기', exact: true }).click();
  await expect(example.getByRole('status').filter({ hasText: '실행 성공' })).toBeVisible();
  await example.screenshot({ path: 'test-results/critique-inline.png' });
});
