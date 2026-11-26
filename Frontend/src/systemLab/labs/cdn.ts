import { defineAwsLab } from './aws/workflow';
import { wired } from './kit';

/** 1단원 종합 실습. 비공개 S3를 CloudFront(OAC)로만 배포하고 새 버전이 바로 보이게 한다. */
export const cdnLab = defineAwsLab({
  id: 'cdn-workflow',
  kinds: ['edge', 'storage', 'cloudfront', 's3'],
  tools: { edge: ['cloudfront'], storage: ['s3'] },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 150 }, { settings: { path: '/static/logo.png' } }),
      system('edge', 'edge', 'root', { x: 280, y: 0 }, 232, 190),
      node(
        'cloudfront',
        'cdn',
        'edge',
        { x: 24, y: 52 },
        { name: '정적 파일 배포', settings: { deploy: 'none' } },
      ),
      system('storage', 'storage', 'root', { x: 280, y: 230 }, 232, 230),
      node('s3', 'bucket', 'storage', { x: 24, y: 52 }, { name: '정적 파일 버킷' }),
      node('end', 'end', 'root', { x: 620, y: 150 }),
    ],
    connections: [
      wired('start', 'request', 'bucket', 'request'),
      wired('bucket', 'response', 'end', 'response'),
    ],
  }),
  starterTasks: [
    wired('start', 'request', 'cdn', 'request'),
    wired('cdn', 'request', 'bucket', 'request'),
    wired('cdn', 'response', 'end', 'response'),
  ],
  required: ['cdn', 'bucket'],
  observations: ['s3-blocked', 'stale-cache'],
});
