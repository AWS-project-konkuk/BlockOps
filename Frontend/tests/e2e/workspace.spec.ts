import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockops:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('목차와 과정 목록에서 노드 실습과 선택 활동을 구분한다', async ({ page }) => {
  await page.goto('/#/learn/container-isolation');
  const sidebar = page.getByRole('navigation', { name: '강의 목차' });
  await expect(sidebar.locator('a[href="#/learn/week6-workflow"]')).toContainText('노드 실습');
  await expect(sidebar.locator('a[href="#/learn/vm-container"]')).toContainText('선택 활동');
  await expect(sidebar.locator('a[href="#/learn/container-isolation"]')).not.toContainText('실습');
  await page.goto('/#/learn');
  await expect(page.getByTestId('lesson-card-week6-workflow')).toContainText('노드 실습');
  await expect(page.getByTestId('lesson-card-vm-container')).toContainText('선택 활동');
});
