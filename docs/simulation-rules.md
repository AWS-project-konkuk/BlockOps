# 시뮬레이션 규칙

AWS 노드 실습이 성공·실패를 판정하는 규칙입니다. 워크북(3학년 2학기 DevOps 1~7차시, Prometheus)의 "이번 차시 질문"과 "트러블 슈팅"에서 실패 상황을 골랐습니다. 구현은 `Frontend/src/systemLab/labs/aws/rules.ts`, 테스트는 `Frontend/tests/awsRules.test.ts`에 있습니다.

## 흐름

- 사용자 노드가 HTTP 요청을 보내고, 요청은 연결된 노드를 따라 흐릅니다. 요청은 지나온 노드 종류(`hops`)를 기록해서, 규칙이 "ALB를 거쳤는가", "CloudFront를 거쳤는가"를 판단합니다.
- 노드 위치도 규칙에 쓰입니다. VPC → 서브넷 → EC2처럼 담긴 서비스의 설정(서브넷 종류, 라우팅, NACL, 가용 영역)을 따라 올라가며 확인합니다.
- 규칙을 어기면 그 노드가 실패하고, 하류 노드는 차단됩니다. 실패 메시지에는 원인과 고칠 방향을 함께 적습니다.
- 규칙이 남기는 관찰 태그(`awsObservations`)는 실습의 완료 조건(실패를 직접 겪어 보기)과 AI 조언에 씁니다.
- 수치는 교육용 모형입니다. 실제 AWS의 한도와 다릅니다.

| 교육용 수치 | 값 |
|---|---|
| 인스턴스·태스크 하나의 처리 용량 | 요청 100건 |
| CloudFront 캐시 적중률(캐시 키를 경로로만 잡았을 때) | 90% |
| RDS 한 대의 쿼리 한도 | 500건, 읽기 복제본이 있으면 1,000건 |
| 표준 SQS 중복 전달 | 2%, 가시성 제한 시간이 처리보다 짧으면 20% |
| DynamoDB 프로비저닝 한 파티션 | 쓰기 10건 |

## 규칙

| 단원 | 노드 | 실패 조건 | 메시지 요지 | 관찰 태그 | 워크북 근거 |
|---|---|---|---|---|---|
| 0·2 | EC2 | 인터넷에서 ALB 없이 들어오는데 서브넷 라우팅이 인터넷 게이트웨이가 아님 | 0.0.0.0/0 → IGW 경로가 없어 닿지 않음 | `no-public-route` | 3차시 "SSH가 안 붙으면 어디부터 의심할까", 퍼블릭/프라이빗 서브넷 |
| 0 | EC2 | 인터넷에서 바로 들어오는데 퍼블릭 IP 없음 | 퍼블릭 IP를 할당하세요 | `no-public-ip` | 1차시 트러블 슈팅 "public IP 안 연결하고 접속" |
| 0·2 | EC2 | 보안 그룹 인바운드가 요청 포트(HTTPS 443, HTTP 80)를 허용하지 않음 | N번 포트 요청이 막힘 | `sg-blocked` | 1차시 보안 그룹, 3차시 SG vs NACL |
| 2 | 서브넷 안 자원 | 서브넷 NACL이 80·443 거부 | 보안 그룹이 허용해도 NACL이 먼저 막음 | `nacl-deny` | 3차시 NACL 규칙 번호·Stateless |
| 0·3·5 | EC2·ASG·ECS | 받은 요청이 처리 용량(대수 × 100)을 넘음 | 넘친 N건 실패 | `overload` | 4차시 수평 확장 |
| 1 | S3 | 퍼블릭 액세스 차단 버킷에 CloudFront 없이 바로 요청 | CloudFront(OAC)를 거치게 하세요 | `s3-blocked` | 2차시 Block Public Access |
| 1 | S3 | 공개 버킷을 CloudFront 뒤에 둠 | CloudFront를 우회할 수 있음 | `s3-public` | 2차시 "Private S3 + CloudFront" |
| 1 | CloudFront | 정적 파일, TTL 24시간, 배포 후 무효화·버전 없음 | 엣지 캐시가 이전 파일을 줌 | `stale-cache` | 2차시 TTL·Invalidation 질문 |
| 1 | CloudFront | 캐시 키에 쿼리·쿠키·헤더 모두 포함 | (성공) 모든 요청이 오리진으로 감 | `cache-miss` | 2차시 캐시 키와 적중률 |
| 3 | ALB | 헬스 체크 경로에 앱이 응답하지 않음 | 대상이 모두 Unhealthy | `health-failed` | 4차시 "헬스 체크가 실패하면 ALB·ASG는" |
| 3 | ALB | 리스너 프로토콜과 요청 프로토콜이 다름 | 리스너가 없는 포트 | `listener-mismatch` | 4차시 리스너·타깃 그룹 |
| 3 | ASG | 대상 추적 정책이면 최대 수까지 늘림. 최대를 넘으면 실패 | 최대를 넘은 N건 실패 | `scaled-out`, `overload` | 4차시 Min·Desired·Max |
| 3 | ASG | 한 가용 영역에만 두었는데 그 영역 장애 | 두 가용 영역에 분산하세요 | `az-outage` | 4차시 "수평 확장만으로 막기 어려운 장애" |
| 3 | ASG | 두 가용 영역 분산 + 영역 장애 | (성공) 남은 영역이 처리 | `az-survived` | 4차시 Multi-AZ |
| 3 | RDS | 단일 AZ DB의 가용 영역 장애 | Multi-AZ를 켜세요 | `az-outage` | 4차시 Multi-AZ vs Read Replica |
| 3 | RDS | Multi-AZ + 영역 장애 | (성공) 대기 복제본 승격 | `db-failover` | 4차시 Multi-AZ |
| 3 | RDS | 인터넷 경로가 있는 퍼블릭 서브넷 | 프라이빗 서브넷으로 옮기세요 | `db-exposed` | 4차시 "RDS를 VPC·보안 그룹 관점에서" |
| 3·4 | RDS | 쿼리가 한도를 넘음 | 읽기 복제본이나 큐 | `db-overload` | 4차시 Read Replica, 5차시 디커플링 |
| 2·3 | 서브넷 안 자원 | VPC 장애 실험의 가용 영역과 서브넷 가용 영역이 같음 | 그 영역의 자원에 닿을 수 없음 | `az-outage` | 3·4차시 AZ |
| 4 | SQS | 표준 큐 | (성공) 중복 전달 가능 | `duplicate-delivery` | 5차시 표준 vs FIFO |
| 4 | DynamoDB | 파티션 키가 날짜 + 프로비저닝 용량 초과 | 고르게 퍼지는 키를 쓰세요 | `hot-partition` | 7차시 Partition Key |
| 4 | SNS | 구독자 없음 | 구독자를 연결하세요 | - | 5차시 Fan-out |
| 5 | ECS | 서브넷에 외부 경로가 없는데 ECR 이미지를 받음 | NAT 게이트웨이 경로를 추가하세요 | `image-pull-failed` | 3차시 NAT, 6차시 ECR |
| 5 | ECS | Fargate + 인스턴스 프로파일 | 태스크 역할로 권한을 주세요 | `shared-role` | 6차시 ECS IAM Roles |
| 5 | ECS | 태스크 0개 | 태스크 수를 1 이상으로 | - | 6차시 ECS Service |
| 6 | Lambda | Java 런타임 | (성공) 콜드 스타트가 김 | `cold-start` | 7차시 Cold Start |
| 7 | Prometheus | Lambda 지표를 Pull로 수집 | CloudWatch로 보내세요(Push) | `pull-mismatch` | Prometheus "Push vs Pull" |
| 7 | CloudWatch | 지표가 경보 기준을 넘음 | (성공) 경보 | `alarm` | Prometheus·7차시 |
| 9 | GitHub Actions | 테스트 없이 빌드 | (성공) 테스트 없는 이미지 | `untested-build` | (보강) CI/CD |

"(성공)"으로 적은 규칙은 실행을 막지 않고 관찰만 남깁니다. 단원 실습은 이 관찰을 완료 조건으로 써서, 예를 들어 "표준 큐의 중복 전달을 확인한 뒤 FIFO로 바꾸기" 같은 비교를 요구할 수 있습니다.

## 규칙을 추가할 때

1. `rules.ts`의 `awsRules`에 노드 종류별 규칙을 더합니다. 기본 동작(`catalog.ts`의 `run`)을 감싸고, 실패하면 원인과 고칠 방향을 담아 `Error`를 던집니다.
2. 새 관찰 태그는 `awsObservations`에 설명과 함께 등록합니다.
3. `tests/awsRules.test.ts`에 성공 구성과 실패 구성을 함께 테스트합니다.
4. 이 문서의 표에 근거가 된 워크북 항목과 함께 추가합니다.
5. Playground 예시 5단계(`playground-example.ts`)가 계속 성공하는지 확인합니다(`tests/playground.test.ts`).
