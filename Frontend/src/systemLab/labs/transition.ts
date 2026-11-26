import { defineAwsLab } from './aws/workflow';
import {
  choice,
  datum,
  need,
  numbers,
  plainPersistence,
  port,
  received,
  setting,
  wired,
} from './kit';

const requestIds = Array.from({ length: 100 }, (_, index) => index + 1);
export const previousVersion = 'app-v1';
export const candidateVersion = 'app-v2';

function matchesIds(expected: number[], actual: number[]) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === expected.length &&
    actual.every((id) => expected.includes(id))
  );
}

function trafficGroups(ids: number[], strategy: string, share: number) {
  if (strategy === 'recreate') return { old: ids.slice(0, 40), next: ids.slice(60), shadow: [] };
  // 이 실습의 라우터는 전체 대상을 한꺼번에 교체할 때 5건을 처리하지 못한다.
  if (strategy === 'blue-green') return { old: ids.slice(0, 40), next: ids.slice(45), shadow: [] };
  const count = Math.floor((ids.length * share) / 100);
  if (strategy === 'shadow') return { old: ids, next: [], shadow: ids.slice(0, count) };
  return { old: ids.slice(count), next: ids.slice(0, count), shadow: [] };
}

/** 9단원 종합 실습. 사용자 응답을 끊지 않고 앱 버전 v1을 v2로 바꾼다. */
export const transitionLab = {
  ...defineAwsLab({
    id: 'week6-workflow',
    kinds: [],
    tools: { gateway: ['routeTraffic', 'infer', 'observeResponses'] },
    materials: {
      request: '사용자 요청',
      'deployed-model': '배포 버전',
      'traffic-plan': '요청 분배 내역',
      prediction: '버전 응답',
      'serving-report': '운영 보고',
    },
    custom: {
      gateway: { label: '배포 환경', service: true },
      routeTraffic: {
        label: '요청 분배',
        ports: [
          port('in', 'request', 'request'),
          port('out', 'old', 'request', false, '기존 버전 요청'),
          port('out', 'new', 'request', false, '신규 버전 요청'),
          port('out', 'plan', 'traffic-plan'),
        ],
        settings: [
          choice('strategy', '배포 전략', 'recreate', [
            ['recreate', '중단 배포'],
            ['blue-green', 'Blue·Green 전환'],
            ['canary', 'Canary 전환'],
            ['shadow', 'Shadow 비교'],
          ]),
          choice('share', 'Canary 전환·Shadow 복제 비율', '10', [
            ['10', '10%'],
            ['50', '50%'],
          ]),
        ],
        run: (ctx) => {
          const ids = numbers(need(ctx, 'request').data, 'ids');
          const strategy = String(setting(ctx.node, 'strategy'));
          const share = Number(setting(ctx.node, 'share'));
          const groups = trafficGroups(ids, strategy, share);
          const next = strategy === 'shadow' ? groups.shadow : groups.next;
          const gap = ids.length - groups.old.length - groups.next.length;
          ctx.emit(
            datum('request', '기존 버전 요청 ' + groups.old.length + '건', {
              ids: groups.old,
              version: previousVersion,
              audience: 'user',
            }),
            'out-old',
          );
          ctx.emit(
            datum(
              'request',
              '신규 버전 ' + (strategy === 'shadow' ? '복제 ' : '사용자 ') + next.length + '건',
              {
                ids: next,
                version: candidateVersion,
                audience: strategy === 'shadow' ? 'shadow' : 'user',
              },
            ),
            'out-new',
          );
          ctx.emit(
            datum('traffic-plan', '사용자 요청 ' + ids.length + '건 · 전환 중 실패 ' + gap + '건', {
              ids,
              strategy,
              expectedShadowIds: groups.shadow,
              expectedNewIds: groups.next,
              gap,
            }),
          );
          return (
            '기존 응답 대상 ' +
            groups.old.length +
            '건 · 신규 응답 대상 ' +
            groups.next.length +
            '건 · 복제 ' +
            groups.shadow.length +
            '건 · 전환 중 실패 ' +
            gap +
            '건'
          );
        },
      },
      infer: {
        label: '버전 처리',
        ports: [
          port('in', 'request', 'request'),
          port('in', 'model', 'deployed-model', false, '배포 버전'),
          port('out', 'prediction', 'prediction'),
        ],
        run: (ctx) => {
          const requests = need(ctx, 'request').data;
          const release = need(ctx, 'deployed-model').data;
          if (requests.version && requests.version !== release.version)
            throw new Error('요청 분배가 지정한 버전을 연결하세요.');
          const ids = numbers(requests, 'ids');
          const shadow = requests.audience === 'shadow';
          const summary =
            release.version + ' · ' + (shadow ? '비교 결과 ' : '사용자 응답 ') + ids.length + '건';
          ctx.emit(
            datum('prediction', summary, {
              ids,
              version: release.version,
              audience: shadow ? 'shadow' : 'user',
            }),
          );
          return summary;
        },
      },
      observeResponses: {
        label: '결과 관측',
        ports: [
          port('in', 'prediction', 'prediction', true, '버전 응답'),
          port('in', 'plan', 'traffic-plan'),
          port('out', 'report', 'serving-report'),
        ],
        run: (ctx) => {
          const results = received(ctx.inputs, 'prediction').map((artifact) => artifact.data);
          if (!results.length) throw new Error('버전 응답을 연결하세요.');
          const users = results.filter((batch) => batch.audience === 'user');
          const userIds = users.flatMap((batch) => numbers(batch, 'ids'));
          const newIds = users
            .filter((batch) => batch.version === candidateVersion)
            .flatMap((batch) => numbers(batch, 'ids'));
          const shadowIds = results
            .filter((batch) => batch.audience === 'shadow')
            .flatMap((batch) => numbers(batch, 'ids'));
          const [plan] = received(ctx.inputs, 'traffic-plan');
          const summary =
            '사용자 응답 ' + userIds.length + '건 · 비교 로그 ' + shadowIds.length + '건';
          ctx.emit(
            datum('serving-report', summary, {
              ...plan?.data,
              userIds,
              newIds,
              shadowIds,
              versions: [...new Set(users.map((batch) => batch.version))],
            }),
          );
          return summary + ' · 다음 실행에 쓸 운영 보고를 남겼습니다.';
        },
      },
    },
    start: {
      label: '시작',
      ports: [
        port('out', 'request', 'request'),
        port('out', 'old', 'deployed-model', false, '기존 버전'),
        port('out', 'new', 'deployed-model', false, '신규 버전'),
      ],
      run: ({ emit }) => {
        emit(datum('request', '사용자 요청 100건', { ids: requestIds }));
        emit(datum('deployed-model', previousVersion, { version: previousVersion }), 'out-old');
        emit(datum('deployed-model', candidateVersion, { version: candidateVersion }), 'out-new');
        return '사용자 요청 100건과 전환에 쓸 두 버전을 보냈습니다.';
      },
    },
    end: {
      label: '도착',
      ports: [port('in', 'report', 'serving-report')],
      run: (ctx) => {
        const report = need(ctx, 'serving-report', '요청 결과를 모은 운영 보고').data;
        if (!report.strategy) throw new Error('요청 분배 내역도 결과 관측에 연결하세요.');
        const users = numbers(report, 'userIds');
        const newUsers = numbers(report, 'newIds');
        const shadow = numbers(report, 'shadowIds');
        const missed = requestIds.filter((id) => !users.includes(id)).length;
        const gap = Number(report.gap);
        const duplicates = users.length - new Set(users).size;
        ctx.report([
          { label: '사용자 응답', value: users.length + '건' },
          { label: '신규 버전 사용자 응답', value: newUsers.length + '건' },
          { label: 'Shadow 비교 로그', value: shadow.length + '건' },
          { label: '전환 중 실패', value: gap + '건' },
          { label: '누락 / 중복', value: missed + '건 / ' + duplicates + '건' },
        ]);
        if (gap > 0 && missed === gap && !duplicates) {
          if (report.strategy === 'recreate') {
            ctx.observe('release-gap');
            throw new Error('중단 배포에서 기존 버전을 내린 뒤 ' + gap + '건이 실패했습니다.');
          }
          if (report.strategy === 'blue-green') {
            ctx.observe('switch-gap');
            throw new Error(
              'Blue-Green은 두 환경을 준비해 한 번에 전환할 수 있는 전략입니다. 이 실습에서는 라우터가 대상을 바꾸는 동안 ' +
                gap +
                '건의 응답이 끊겼습니다. 응답 처리 중에는 단 한 번도 멈추면 안 되므로 이번 배포를 반려합니다.',
            );
          }
        }
        if (!matchesIds(requestIds, users))
          throw new Error(
            '사용자 응답 100건을 한 번씩 받아야 합니다. 누락 ' +
              missed +
              '건 · 중복 ' +
              duplicates +
              '건',
          );
        if (
          !matchesIds(numbers(report, 'expectedNewIds'), newUsers) ||
          !matchesIds(numbers(report, 'expectedShadowIds'), shadow)
        )
          throw new Error('신규 버전의 사용자 응답과 비교 로그가 분배 내역과 일치해야 합니다.');
        return '사용자 요청 100건에 누락·중복·실패 없이 응답했습니다.';
      },
    },
    initial: ({ system, node }) => ({
      entities: [
        node('start', 'start', 'root', { x: 0, y: 144 }),
        system('gateway', 'gateway', 'root', { x: 294, y: 0 }, 892, 374),
        node('routeTraffic', 'router', 'gateway', { x: 24, y: 131 }),
        node('infer', 'old', 'gateway', { x: 330, y: 54 }, { name: '기존 버전 처리' }),
        node('observeResponses', 'observe', 'gateway', { x: 659, y: 140 }),
        node('end', 'end', 'root', { x: 1290, y: 138 }),
      ],
      connections: [
        wired('start', 'request', 'router', 'request'),
        wired('start', 'old', 'old', 'model'),
        wired('router', 'old', 'old', 'request'),
        wired('router', 'plan', 'observe', 'plan'),
        wired('old', 'prediction', 'observe', 'prediction'),
        wired('observe', 'report', 'end', 'report'),
      ],
    }),
    starterTasks: [],
    required: ['router', 'old', 'observe'],
    observations: {
      'release-gap': '중단 배포에서 준비 공백으로 실패한 요청',
      'switch-gap': 'Blue-Green 일괄 전환 중 응답 누락',
    },
  }),
  toolPosition: (index: number) =>
    index === 3 ? { x: 330, y: 224 } : { x: 24, y: 52 + index * 150 },
  persistence: {
    ...plainPersistence,
    readEntity(item: Record<string, unknown>) {
      const settings = item.settings;
      if (
        item.kind !== 'routeTraffic' ||
        !settings ||
        typeof settings !== 'object' ||
        Array.isArray(settings)
      )
        return item;
      const updated = { ...settings };
      Reflect.deleteProperty(updated, 'ready');
      return { ...item, settings: updated };
    },
  },
};
