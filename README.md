# 포토카드 마켓 - 배포 가이드

여행 계산기와 동일하게 GitHub + Cloudflare Pages 조합으로 배포해. 다른 점은 이번엔 백엔드(Functions)와 데이터베이스(D1)가 붙는다는 것.

## 1. GitHub 레포 생성

1. GitHub에서 새 레포 생성 (예: `포토카드-마켓` 또는 `photocard-market`)
2. 이 폴더 전체(index.html, functions/, schema.sql)를 그대로 push

```bash
cd photocard-site
git init
git add .
git commit -m "초기 커밋"
git branch -M main
git remote add origin https://github.com/jwyang3630/photocard-market.git
git push -u origin main
```

## 2. Cloudflare Pages 프로젝트 생성

1. Cloudflare 대시보드 → Workers & Pages → Create → Pages → GitHub 레포 연결
2. Build settings:
   - Framework preset: None
   - Build command: (비워둠)
   - Build output directory: `/`
3. Deploy 클릭 — `functions/api/listings.js`는 Cloudflare Pages가 자동으로 인식해서 서버리스 함수로 배포함

## 3. D1 데이터베이스 생성 및 연결

### 3-1. D1 데이터베이스 생성 (대시보드에서)

1. Cloudflare 대시보드 → Workers & Pages → D1 → Create database
2. 이름: `photocard-market-db` (원하는 이름으로)

### 3-2. 스키마 적용

로컬에서 wrangler CLI로 실행 (최초 1회):

```bash
npm install -g wrangler
wrangler login
wrangler d1 execute photocard-market-db --remote --file=./schema.sql
```

### 3-3. Pages 프로젝트에 D1 바인딩

1. Cloudflare 대시보드 → 방금 만든 Pages 프로젝트 → Settings → Functions → D1 database bindings
2. Variable name: `DB` (코드에서 `env.DB`로 참조하고 있으니 반드시 이 이름으로)
3. D1 database: 위에서 만든 `photocard-market-db` 선택
4. Save 후 재배포 (Deployments 탭 → Retry deployment 또는 새 커밋 push)

## 4. 확인

배포된 URL(`photocard-market.pages.dev` 등)로 접속해서:
- 매물 등록 후 새로고침해도 유지되는지 확인
- 다른 브라우저/시크릿 모드에서도 같은 매물이 보이는지 확인 (= 여러 사용자가 같은 DB를 보고 있다는 뜻)

## 참고 - 나중에 추가하면 좋은 것

- **매물 삭제/신고 기능**: 지금은 등록만 가능, 삭제는 아직 없음
- **스팸 방지**: 현재는 아무 제한 없이 누구나 등록 가능. 트래픽 늘면 Cloudflare Turnstile(캡차) 붙이는 게 좋음
- **커스텀 도메인**: travel-calculator처럼 원하는 도메인 연결 가능 (Pages 프로젝트 설정 → Custom domains)
