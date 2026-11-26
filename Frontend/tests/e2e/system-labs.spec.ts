import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Connection } from '../../src/systemLab/lab';
import { introWorkflowLab } from '../../src/systemLab/labs/intro-workflow';
import { wired } from '../../src/systemLab/labs/kit';
import { transitionLab } from '../../src/systemLab/labs/transition';

async function openLab(page: Page, lesson: string, viewport = { width: 1680, height: 1000 }) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    localStorage.setItem(
      'blockops:preferences:v1',
      JSON.stringify({ theme: 'light', tour: 'skipped' }),
    );
  });
  await page.goto('/#/learn/' + lesson);
  await page.getByRole('button', { name: '실습 영역 확장', exact: true }).click();
  return page.getByTestId('system-lab');
}
/** 포트는 테스트 ID(처음 있던 노드) 또는 접근성 이름(학습자가 만든 노드)으로 찾는다. */
const handle = (lab: Locator, port: string) =>
  port.startsWith('port-') ? lab.getByTestId(port) : lab.getByLabel(port, { exact: true });
async function link(lab: Locator, from: string, to: string) {
  await handle(lab, from).click();
  await handle(lab, to).click();
}
async function connectTasks(lab: Locator, tasks: Connection[]) {
  for (const { from, to } of tasks)
    await link(lab, 'port-' + from.node + '-' + from.port, 'port-' + to.node + '-' + to.port);
}
async function fit(lab: Locator) {
  await lab.getByRole('button', { name: '전체 서비스', exact: true }).click();
}
async function run(lab: Locator) {
  await lab.getByRole('button', { name: '실습 실행', exact: true }).click();
  await expect(lab.getByRole('button', { name: '실습 실행', exact: true })).toBeVisible();
}
async function select(lab: Locator, node: string) {
  await lab
    .getByLabel('캔버스에서 항목 찾기')
    .selectOption(/\s\d$/.test(node) ? { label: node } : node);
}
async function choose(lab: Locator, node: string, label: string, value: string) {
  await select(lab, node);
  await lab.getByLabel(label, { exact: true }).selectOption(value);
}
async function addNode(lab: Locator, parent: string, name: string) {
  await select(lab, parent);
  await lab.getByRole('button', { name: name + ' 추가', exact: true }).click();
  const id = await lab.getByLabel('캔버스에서 항목 찾기').inputValue();
  await fit(lab);
  return id;
}
/** correct는 이해 확인에서 정답 보기의 위치다. 마지막 강의에는 다음 강의 링크가 없어서 완료 문구로 확인한다. */
async function answer(lab: Locator, page: Page, correct: number) {
  const showResults = lab.getByRole('button', { name: '실행 결과 펼치기' });
  if (await showResults.isVisible()) await showResults.click();
  await lab.getByRole('radio').nth(correct).check();
  await lab.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.getByText('목표 달성이 기록되었습니다.', { exact: true })).toBeVisible();
}
const edges = (lab: Locator) => lab.getByTestId('system-lab-canvas').locator('.react-flow__edge');

test('0단원 · Git의 코드와 S3의 파일을 연결해 EC2에서 리뷰 3건을 센다', async ({ page }) => {
  const lab = await openLab(page, introWorkflowLab.id);
  await expect(edges(lab)).toHaveCount(2);
  await connectTasks(lab, introWorkflowLab.starterTasks);
  await run(lab);
  await expect(lab.getByLabel('결과 지표').getByText('3건', { exact: true })).toBeVisible();
  await lab.getByRole('radio').nth(1).check();
  await lab.getByRole('button', { name: '정답 확인' }).click();
  await expect(page.getByRole('link', { name: '다음 강의', exact: true })).toHaveAttribute(
    'href',
    '#/learn/storage-compare',
  );
});

test('9단원 · 신규 모델 경로를 만들고 Shadow로 응답을 유지한다', async ({ page }) => {
  const lab = await openLab(page, transitionLab.id);
  const model = await addNode(lab, 'gateway', '모델 처리');
  await connectTasks(lab, [
    wired('router', 'new', model, 'request'),
    wired('start', 'new', model, 'model'),
    wired(model, 'prediction', 'observe', 'prediction'),
  ]);
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('20건이 실패했습니다');
  await choose(lab, 'router', '배포 전략', 'blue-green');
  await run(lab);
  await expect(lab.getByRole('status').first()).toContainText('이번 배포를 반려합니다');
  await choose(lab, 'router', '배포 전략', 'shadow');
  await run(lab);
  const metrics = lab.getByLabel('결과 지표');
  await expect(metrics.getByText('사용자 응답', { exact: true }).locator('..')).toContainText(
    '100건',
  );
  await expect(
    metrics.getByText('신규 모델 사용자 응답', { exact: true }).locator('..'),
  ).toHaveText(/응답0건$/);
  await expect(metrics.getByText('Shadow 비교 로그', { exact: true }).locator('..')).toContainText(
    '10건',
  );
  await answer(lab, page, 3);
});
