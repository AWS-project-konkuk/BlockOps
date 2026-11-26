# BlockOps 커리큘럼 이전 계획

BlockML(MLOps)의 엔진을 그대로 쓰고, 강의·노드·실습 규칙을 3학년 2학기 DevOps 스터디 워크북(1~7차시 + Prometheus) 기준으로 교체한다.

- 원문 위치: Notion `학교 / 3학년 2학기 / AWS / DevOps`
- 원문 구성: 차시마다 **목표 → 핵심 키워드 → 질문 → 미션 → 구조적으로 정리해보기(다이어그램) → 트러블 슈팅**
- 변환 규칙

| 워크북 항목 | BlockOps에서 쓰는 곳 |
|---|---|
| 목표 | 강의 `summary`, 단원 소개 |
| 핵심 키워드 | MDX 본문, `concepts` |
| 이번 차시 질문 | 이해 확인 문제(`assessment`), 성찰 질문(`reflection`) |
| 미션 | 단원 종합 실습(주차 워크플로우) |
| 구조적으로 정리해보기 | 노드 실습의 목표 구성(정답 그래프) |
| 트러블 슈팅 | 실패 시나리오와 AI 조언 힌트 |

## 1. 단원 매핑

| 단원 | 제목 | 원문 | 핵심 개념 | 종합 실습 목표(다이어그램) |
|---|---|---|---|---|
| 0 | 클라우드와 EC2 | 1차시 | IaaS/PaaS/SaaS, Region·AZ, IAM(User·Group·Role·Policy, Deny 우선), EC2, EBS, AMI, 보안 그룹, EIP | IAM · EC2 · EBS · VPC 관계를 연결하고 SSH 접속 성공 |
| 1 | 스토리지와 CDN | 2차시 | S3 버킷·객체, 스토리지 클래스, 버킷 정책, Block Public Access, Versioning·Lifecycle, CloudFront, 캐시 키, TTL, Invalidation, OAC | User → CloudFront → Private S3(OAC), 캐시·권한 검사 위치 표시 |
| 2 | 네트워킹 | 3차시 | VPC, CIDR, 예약 IP, 퍼블릭·프라이빗 서브넷, IGW, 라우팅 테이블, NAT, Bastion, SG vs NACL, VPC Endpoint, Peering·TGW | 2개 AZ, 퍼블릭(IGW·0.0.0.0/0) + 프라이빗(S3 Gateway Endpoint) 서브넷 |
| 3 | 확장성과 고가용성 | 4차시 | 수직·수평 확장, ALB(리스너·타깃 그룹·헬스 체크), Launch Template, ASG(Min·Desired·Max, 정책, Cooldown), RDS Multi-AZ·Read Replica, SG 체이닝 | Internet-facing ALB → TG · ASG · EC2(멀티 AZ) → 프라이빗 RDS |
| 4 | 디커플링 | 5차시 | 동기·비동기, SQS Standard·FIFO, Visibility Timeout, Long Polling, SNS Pub/Sub·필터, Fan-out, Kinesis·Firehose, Amazon MQ | 주문 → SNS → SQS ×N(Fan-out) → 소비자, 스트림은 Kinesis |
| 5 | 컨테이너 | 6차시 | VM vs 컨테이너, Dockerfile·이미지 레이어, ECR, ECS(Task Def·Service·Launch Type), Fargate, EKS, Task Role, Capacity Provider | Image → ECR → ECS Service(Fargate) ← ALB, Task Role로 S3 접근 |
| 6 | 서버리스 | 7차시 | FaaS, Lambda(Handler·Layer·Cold Start·과금), API Gateway HTTP vs REST, DynamoDB(PK·SK, RCU·WCU, Streams, TTL) | API GW → Lambda → DynamoDB, S3 이벤트 → Lambda, EventBridge → Lambda |
| 7 | 관측 | Prometheus | Monitoring vs Observability, Metrics·Logs·Traces, Pull vs Push, TSDB(WAL·Head·Block) | 서비스 → Exporter → Prometheus(Pull) → 대시보드·알림 |
| 8 | 종합 | 7차시 보너스 | 1~7단원 전체 아키텍처 | EC2/ELB/ASG/RDS/S3/VPC/CloudFront/Lambda/API GW/DynamoDB 한 장 구성 |
| (9) | CI/CD·IaC (보강) | 워크북 없음 | GitHub Actions 빌드·배포, 이미지 태그, 배포 전략, Terraform | 커밋 → 빌드 → ECR → ECS 롤링/블루그린 배포 |

9단원은 워크북에 없으므로 자료를 따로 만들어야 한다. DevOps 과정의 대표 실습이므로 추가를 권장한다.

## 2. 노드 카탈로그(초안)

| 분류 | 노드 | 주요 설정(Inspector) |
|---|---|---|
| 사용자·진입 | User, Route 53, CloudFront, API Gateway | 캐시 정책·TTL, Viewer Protocol, HTTP/REST |
| 네트워크 | VPC, Subnet(퍼블릭/프라이빗), IGW, NAT Gateway, Route Table, VPC Endpoint, Security Group, NACL | CIDR, AZ, 라우트, 인/아웃바운드 규칙, 규칙 번호 |
| 컴퓨팅 | EC2, Launch Template, ASG, ALB/Target Group, Lambda | 인스턴스 유형, AMI, Min·Desired·Max, 헬스 체크, 런타임·메모리 |
| 컨테이너 | Docker Image, ECR, ECS Service, Fargate, EKS | Launch Type, Task 수, Task Role |
| 저장 | S3, EBS, EFS, RDS, DynamoDB | 스토리지 클래스, 버킷 정책·BPA, Multi-AZ, Read Replica, PK·SK, 용량 모드 |
| 메시징 | SQS, SNS, Kinesis, Firehose | Standard/FIFO, Visibility Timeout, 필터 정책, 샤드 |
| 권한 | IAM User, IAM Role, Policy | Effect·Action·Resource |
| 관측 | CloudWatch, Prometheus, Exporter | 지표, 스크랩 간격, 알림 임계값 |

## 3. 시뮬레이션 규칙 후보

워크북의 질문과 트러블 슈팅에서 실패 시나리오를 뽑았다. 확정한 규칙과 구현 위치는 [시뮬레이션 규칙](simulation-rules.md)에 있다.

| 단원 | 실패 시나리오 | 학습자가 고쳐야 할 것 |
|---|---|---|
| 0 | EC2 접속 불가 | 퍼블릭 IP·EIP 연결, SG 22번 포트, 키 권한 |
| 0 | Billing 접근 거부 | IAM Role·Policy 부여, Deny 우선 규칙 |
| 1 | 버킷 공개 경고 / 원본 직접 노출 | Private S3 + CloudFront OAC |
| 1 | 배포했는데 이전 파일이 보임 | TTL 이해, Invalidation 또는 파일 버저닝 |
| 1 | 캐시 적중률 낮음 | 캐시 키에서 쿠키·헤더·쿼리 제외 |
| 2 | 인터넷 연결 안 됨 | IGW Attach + 라우트 `0.0.0.0/0 → IGW` Associate |
| 2 | 프라이빗 서브넷에서 패키지 설치 실패 | NAT Gateway, S3는 Gateway Endpoint로 대체 |
| 2 | SG는 열었는데 차단됨 | NACL 규칙 번호·Stateless·임시 포트 |
| 2 | 서브넷 생성 실패 | CIDR 겹침, `/28` 최소 크기, 예약 IP 5개 |
| 3 | 트래픽 급증 시 응답 실패 | ALB + ASG, Max 설정, Target Tracking |
| 3 | AZ 하나 장애 | 멀티 AZ 서브넷, RDS Multi-AZ |
| 3 | 비정상 인스턴스가 계속 트래픽 받음 | 헬스 체크 경로·임계값 → ASG 교체 |
| 4 | 주문 몰림 시 요청 유실 | SQS 버퍼, 소비자 수 조절 |
| 4 | 같은 주문이 두 번 처리 | FIFO 큐, Visibility Timeout |
| 4 | 알림 서비스 지연이 결제까지 막음 | SNS Fan-out으로 분리 |
| 5 | 컨테이너가 S3 권한을 공유 | Instance Profile 대신 Task Role |
| 5 | 이미지 롤백 불가 | ECR 태그 보존 |
| 6 | 첫 요청만 느림 | Cold Start, 런타임 선택 |
| 6 | Lambda를 외부에서 호출 못 함 | API Gateway 연결 |
| 6 | 특정 파티션에 쓰기 몰림 | Partition Key 설계 |
| 7 | 장애 원인 특정 불가 | Metrics·Logs·Traces 구분, Pull 스크랩 대상 등록 |

## 4. 기존 BlockML 강의 정리

1단계(ML 콘텐츠 제거)에서 확정한 배치다. 폴더 번호는 단원 번호와 같다. 남긴 강의의 본문에는 아직 모델 학습·서빙 예시가 남아 있어서 5단계에서 DevOps 예시로 바꾼다.

| 단원 | 남긴 강의 |
|---|---|
| 0 `00-cloud` | `ec2-compute`, `s3-objects`, `git-basics`, `intro-workflow`(Git·S3·EC2 첫 노드 실습이라 유지) |
| 1 `01-storage` | `storage-compare` |
| 5 `05-container` | `runtime-overview`, `vm-container`, `docker-commands`, `container-isolation`, `docker-image`, `k8s-basics`, `k8s-control-traffic`, `storage-lifecycle`, `pv-pvc`, `week2-workflow` |
| 6 `06-serverless` | `serving-protocols`(API Gateway의 REST·HTTP와 연결) |
| 7 `07-observability` | `observability-signals`, `prometheus` |
| 9 `09-delivery` | `recreate-release`, `blue-green`, `canary`, `shadow`, `week6-workflow` |

제거한 강의: `mlops-overview`, `object-mlops`, `io-starvation`, `week3-workflow`, `04-reproducibility/*`, `05-gpu/*`, `06-features/*`, `07-rag/*`, `serving-modes`, `model-drift`, `monitor-improve`, `week7-workflow`, `10-capstone/*`

## 5. 작업 순서

1. **ML 콘텐츠 제거**: 제거 대상 강의·lab(`systemLab/labs/gpu`, `rag`, `reproduce`, `features` 등)·도해·테스트를 지우고, `content/course.ts`의 단원 정의를 위 1번 표로 교체한다. 빌드와 테스트가 통과하는 상태를 유지한다.
2. **엔진 일반화**: `systemLab/engine.ts`의 산출물 종류(`model | image | control`)와 `model.pkl` 표기를 인프라 리소스 기준으로 바꾼다. 게시판 워크플로우 스키마 버전을 올린다(프론트 `readWorkflow`, 백엔드 `WorkflowValidator`).
3. **노드 카탈로그 교체**: 2번 표의 노드와 아이콘·Inspector 설정을 만든다.
4. **시뮬레이션 규칙 설계**: 3번 표를 바탕으로 단원별 규칙을 확정한다.
5. **단원별 강의·실습 작성**: 0단원부터 차례로 MDX 본문, 이해 확인, 노드 실습을 만든다. 재사용 후보 강의는 ML 맥락을 걷어내 옮긴다.
6. **AI 조언 프롬프트 교체**: 백엔드 `VllmClient`의 시스템 프롬프트와 `llm/` 응답 형식 테스트셋을 DevOps 기준으로 바꾼다.
7. **배포 확인**: GHCR 이미지 이름(`ghcr.io/aws-project-konkuk/blockops`)과 Helm 차트, EKS 값을 새 레포 기준으로 점검한다.
