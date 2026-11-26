import type { Strategy } from '../../engine';
import { datum, received } from '../kit';

export interface RequestData extends Record<string, unknown> {
  /** 이 경로로 들어온 요청 수. */
  count: number;
  /** 사용자가 처음 보낸 요청 수. */
  total: number;
  protocol: 'https' | 'http';
  path: string;
  /** 지나온 노드 이름. */
  trace: string[];
  /** 지나온 노드 종류. 규칙이 경로(ALB를 거쳤는지 등)를 판단할 때 쓴다. */
  hops: string[];
  /** 메시지 중복 등 규칙이 덧붙이는 정보. */
  duplicates?: number;
}
export const requestSummary = (data: RequestData) =>
  data.protocol.toUpperCase() + ' 요청 ' + data.count + '건';
export const request = (data: RequestData) => datum('request', requestSummary(data), data);
export const requestsOf = (inputs: Parameters<Strategy>[0]['inputs']) =>
  received(inputs, 'request').map((item) => item.data as RequestData);

/** 여러 경로로 들어온 요청을 하나로 합친다. 들어온 요청이 없으면 오류를 낸다. */
export function incoming(ctx: Parameters<Strategy>[0], label = 'HTTP 요청'): RequestData {
  const list = requestsOf(ctx.inputs);
  if (!list.length) throw new Error(label + ' 입력이 없습니다.');
  const first = list[0];
  return {
    ...first,
    count: list.reduce((sum, item) => sum + item.count, 0),
    trace: [...first.trace, ctx.node.name],
    hops: [...(first.hops ?? []), ctx.node.kind],
  };
}
/** 출력 포트에 연결된 선 수. */
export const fanOut = (ctx: Parameters<Strategy>[0], portId: string) =>
  ctx.graph.connections.filter((e) => e.from.node === ctx.node.id && e.from.port === portId).length;

/** 응답 출력이 연결되어 있으면 처리한 요청 수만큼 응답을 보낸다. 단원 실습의 "응답 확인"이 받는다. */
export function respond(
  ctx: Parameters<Strategy>[0],
  count: number,
  total = count,
  extra: Record<string, unknown> = {},
) {
  if (!fanOut(ctx, 'out-response')) return;
  ctx.emit(
    datum('response', '응답 ' + count + '건', { count, total, from: ctx.node.name, ...extra }),
    'out-response',
  );
}
