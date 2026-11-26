# 강의 MDX 본문 목록

각 `.mdx` 파일에서 본문과 실습 배치를 수정합니다. 제목·순서·평가·실습 구성은 같은 이름의 `.lesson.ts`에서 수정합니다.

| 단원 | 순서 | 문서 | 제목 |
| --- | --- | --- | --- |
| 0 | 1 | [ec2-compute](lessons/00-cloud/ec2-compute.mdx) | EC2는 코드를 실행하는 컴퓨터 |
| 0 | 2 | [s3-objects](lessons/00-cloud/s3-objects.mdx) | S3는 객체를 보관하는 저장소 |
| 0 | 3 | [git-basics](lessons/00-cloud/git-basics.mdx) | Git으로 코드의 버전 기록하기 |
| 0 | 4 | [intro-workflow](lessons/00-cloud/intro-workflow.mdx) | 첫 노드 실습 · EC2에서 리뷰 수 세기 |
| 1 | 1 | [storage-compare](lessons/01-storage/storage-compare.mdx) | Block·File·Object의 접근 방식 |
| 1 | 2 | [s3-security](lessons/01-storage/s3-security.mdx) | S3 버킷 권한과 퍼블릭 액세스 차단 |
| 1 | 3 | [cloudfront-cache](lessons/01-storage/cloudfront-cache.mdx) | CloudFront 캐시: 캐시 키·TTL·무효화 |
| 1 | 4 | [cdn-workflow](lessons/01-storage/cdn-workflow.mdx) | 실습 · 비공개 S3를 CloudFront로 배포하기 |
| 2 | 1 | [vpc-subnet](lessons/02-network/vpc-subnet.mdx) | VPC와 서브넷: 내 네트워크의 경계 나누기 |
| 2 | 2 | [route-igw-nat](lessons/02-network/route-igw-nat.mdx) | 라우팅 테이블로 퍼블릭·프라이빗 나누기 |
| 2 | 3 | [sg-nacl](lessons/02-network/sg-nacl.mdx) | 보안 그룹과 NACL: 어디서 무엇을 검사할까 |
| 2 | 4 | [network-workflow](lessons/02-network/network-workflow.mdx) | 실습 · 퍼블릭 서브넷의 웹 서버에 닿게 하기 |
| 5 | 1 | [runtime-overview](lessons/05-container/runtime-overview.mdx) | 단원 개요 |
| 5 | 2 | [vm-container](lessons/05-container/vm-container.mdx) | VM과 컨테이너의 차이 |
| 5 | 3 | [docker-commands](lessons/05-container/docker-commands.mdx) | Docker란? |
| 5 | 4 | [container-isolation](lessons/05-container/container-isolation.mdx) | 커널을 공유하면서 어떻게 격리할까 |
| 5 | 5 | [docker-image](lessons/05-container/docker-image.mdx) | 이미지와 컨테이너의 관계 |
| 5 | 6 | [k8s-basics](lessons/05-container/k8s-basics.mdx) | Kubernetes란? |
| 5 | 7 | [k8s-control-traffic](lessons/05-container/k8s-control-traffic.mdx) | Pod 배치와 요청 전달의 경로 나누기 |
| 5 | 8 | [storage-lifecycle](lessons/05-container/storage-lifecycle.mdx) | 파일의 lifecycle과 공유 조건 판단하기 |
| 5 | 9 | [pv-pvc](lessons/05-container/pv-pvc.mdx) | PV와 PVC로 Pod 밖의 데이터 연결 |
| 5 | 10 | [week2-workflow](lessons/05-container/week2-workflow.mdx) | 실습 · 학습된 모델을 Pod 안에서 서비스하기 |
| 6 | 1 | [serving-protocols](lessons/06-serverless/serving-protocols.mdx) | HTTP와 gRPC는 무엇을 바꿀까 |
| 7 | 1 | [observability-signals](lessons/07-observability/observability-signals.mdx) | 지표·로그·트레이스로 하나의 요청 조사하기 |
| 7 | 2 | [prometheus](lessons/07-observability/prometheus.mdx) | Prometheus로 지표를 수집하기 |
| 9 | 1 | [recreate-release](lessons/09-delivery/recreate-release.mdx) | 중단 배포에서 요청은 어떻게 될까 |
| 9 | 2 | [blue-green](lessons/09-delivery/blue-green.mdx) | Blue·Green: 준비 후 한 번에 전환 |
| 9 | 3 | [canary](lessons/09-delivery/canary.mdx) | Canary: 일부 실제 요청부터 |
| 9 | 4 | [shadow](lessons/09-delivery/shadow.mdx) | Shadow: 요청은 복제, 응답은 기존 모델 |
| 9 | 5 | [week6-workflow](lessons/09-delivery/week6-workflow.mdx) | 사용자 응답을 지키며 모델 전환하기 |
