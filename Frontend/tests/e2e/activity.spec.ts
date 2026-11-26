import { expect, test } from '@playwright/test';
import { readLessons } from './readCurriculum';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'blockops:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    ),
  );
});

test('모든 강의에서 공통 프레임과 초기 펼침 상태를 확인한다', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/#/learn');
  const lessons = await readLessons(page);
  const openByDefault = new Set(['ec2-compute', 'vm-container', 'storage-compare']);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  expect(lessons).toHaveLength(23);
  expect(lessons.filter((lesson) => lesson.activityView)).toHaveLength(9);

  for (const lesson of lessons) {
    await page.goto(`/#/learn/${lesson.id}`);
    await expect(page.getByRole('heading', { level: 1, name: lesson.title })).toBeVisible();
    const frame = page.getByTestId('activity-frame');
    if (!lesson.activityView) {
      await expect(frame).toHaveCount(0);
      continue;
    }
    const summary = frame.locator('summary');
    await expect(summary).toContainText(lesson.activityView.title);
    expect(await frame.evaluate((details) => (details as HTMLDetailsElement).open)).toBe(
      openByDefault.has(lesson.id),
    );
    if (!openByDefault.has(lesson.id)) await summary.press('Enter');
    await expect(frame.getByTestId('inline-activity')).toBeVisible();
    await expect(
      frame.getByText('브라우저에서 관찰하는 교육용 모형입니다.', { exact: false }),
    ).toBeVisible();
    if ('cases' in lesson.activityView && lesson.activityView.cases?.length) {
      const example = lesson.activityView.cases.at(-1)!;
      await frame.getByRole('button', { name: example.label, exact: true }).click();
      await expect(frame.getByRole('status')).toHaveText(example.result);
    }
  }
  expect(errors).toEqual([]);
});

test('Prometheus의 수집 간격을 줄이면 짧은 지연을 찾는다', async ({ page }) => {
  await page.goto('/#/learn/prometheus');
  await page.getByTestId('activity-frame').locator('summary').press('Enter');
  const activity = page.getByTestId('inline-activity');
  const limit = activity.getByRole('spinbutton', { name: '지연 경고 기준 (ms)' });
  await limit.fill('200');
  await activity.getByRole('button', { name: '30초 간격' }).click();
  await expect(activity.getByRole('status')).toContainText('경고 기준 이내');
  await activity.getByRole('button', { name: '5초 간격' }).click();
  await expect(activity.getByRole('status')).toContainText('경고 기준을 넘었습니다');
  await expect(limit).toHaveValue('200');
});

test('VM을 늘려도 컨테이너가 공유하는 커널은 하나다', async ({ page }) => {
  await page.goto('/#/learn/vm-container');
  const activity = page.getByTestId('inline-activity');
  const add = activity.getByRole('button', { name: '앱 하나 추가' });
  await add.press('Enter');
  await add.press('Enter');
  await expect(activity.getByRole('status')).toContainText('게스트 커널도 3개');
  await expect(activity.getByRole('status')).toContainText('호스트 커널은 여전히 1개');
  await expect(add).toBeDisabled();
});

test('Shadow 복제 비율을 바꿔도 신규 모델의 사용자 응답은 0건이다', async ({ page }) => {
  await page.goto('/#/learn/shadow');
  await page.getByTestId('activity-frame').locator('summary').press('Enter');
  const activity = page.getByTestId('inline-activity');
  const traffic = activity.getByRole('spinbutton', { name: '복제 요청 비율 (%)' });
  await traffic.fill('0');
  await expect(activity.getByText('비교 로그로 보낸 복제 요청 0건')).toBeVisible();
  await traffic.fill('100');
  await expect(activity.getByText('비교 로그로 보낸 복제 요청 100건')).toBeVisible();
  await expect(activity.getByRole('status')).toContainText('신규 사용자 응답 0 / 100');
});
