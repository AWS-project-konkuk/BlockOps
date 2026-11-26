# BlockOps 작업 안내

- 작업 전에 `docs/pitfalls.md`를 읽고, 이전 프로젝트(BlockML)에서 반복된 실수를 되풀이하지 않는다. PR 전에 문서 끝의 체크리스트를 확인한다.
- 커리큘럼 이전 작업은 `docs/curriculum-plan.md`의 단원 매핑과 작업 순서를 따른다.
- 작업은 이슈를 먼저 만들고, `main`에서 브랜치를 따서 PR로 병합한다. PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 형식을 따른다.
- 프론트엔드 확인: `cd Frontend && npm run typecheck && npm run lint && npm test && npm run build`
