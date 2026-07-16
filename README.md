# 슈마켓 (신발 리셀 직거래) - 배포 가이드

포토카드 마켓과 동일하게 GitHub + Cloudflare Pages 조합으로 배포해요. 구조도 거의 동일 (Functions + D1).

## 1. GitHub 레포 생성

```bash
cd sneaker-resell
git init
git add .
git commit -m "초기 커밋"
git branch -M main
git remote add origin https://github.com/jwyang3630/sneaker-resell.git
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

### 3-1. D1 데이터베이스 생성

1. Cloudflare 대시보드 → Workers & Pages → D1 → Create database
2. 이름: `sneaker-resell-db` (원하는 이름으로)

### 3-2. 스키마 적용

```bash
npm install -g wrangler
wrangler login
wrangler d1 execute sneaker-resell-db --remote --file=./schema.sql
```

### 3-3. Pages 프로젝트에 D1 바인딩

1. Pages 프로젝트 → Settings → Functions → D1 database bindings
2. Variable name: `DB` (코드에서 `env.DB`로 참조)
3. D1 database: 위에서 만든 `sneaker-resell-db` 선택
4. Save 후 재배포

## 4. R2 버킷 생성 및 연결 (이미지 업로드용)

### 4-1. R2 버킷 생성

1. Cloudflare 대시보드 → R2 → Create bucket
2. 이름: `sneaker-resell-images` (원하는 이름으로)

### 4-2. 공개 접근(Public Access) 켜기

1. 방금 만든 버킷 → Settings → Public access → Allow Access 활성화
   - 이러면 `pub-xxxxxxxxxxxx.r2.dev` 형태의 공개 URL이 생성됨 (버킷 설정 화면에 표시됨)
   - 원하면 커스텀 도메인도 연결 가능 (Settings → Custom Domains)

### 4-3. Pages 프로젝트에 R2 바인딩

1. Pages 프로젝트 → Settings → Functions → R2 bucket bindings
2. Variable name: `IMAGES` (코드에서 `env.IMAGES`로 참조하고 있으니 반드시 이 이름으로)
3. R2 bucket: 위에서 만든 `sneaker-resell-images` 선택

### 4-4. 환경변수(Environment Variable) 추가

1. Pages 프로젝트 → Settings → Environment variables → Production
2. 이름: `PUBLIC_R2_URL`
3. 값: 4-2에서 확인한 공개 URL (예: `https://pub-xxxxxxxxxxxx.r2.dev`, 끝에 슬래시(/) 없이)
4. Save 후 재배포

이 세 가지(버킷 생성 → 바인딩 → 환경변수)가 다 돼야 매물 등록 모달에서 사진을 선택했을 때 실제로 업로드되고, 카드 뒷면에 그 사진이 나와요.

## 5. 확인

- 매물 등록 후 새로고침해도 유지되는지
- 카드를 클릭하면 뒤집혀서 이미지 URL에 넣은 실물 사진이 나오는지
- 다른 브라우저/시크릿 모드에서도 같은 매물이 보이는지 (= 여러 사용자가 같은 DB를 공유)

## 지금 구조의 한계 (다음 단계로 고려할 것)

- **이미지 용량 제한 5MB, jpg/png/webp/gif만 허용**: 그 이상이거나 다른 형식이면 업로드가 거부돼요.
- **매물 삭제/신고 기능 없음**: 등록만 가능, 삭제 기능은 아직 없음
- **스팸 방지 없음**: 트래픽 늘면 Cloudflare Turnstile(캡차) 붙이는 게 좋음
- **정품 인증 없음**: 리셀 특성상 정품 이슈가 민감한데, 지금은 "설명"란에 자율 기재하는 방식. 나중에 "정품 인증샷 필수" 같은 규칙을 공지문구로 추가하는 게 좋음
- **커스텀 도메인**: 여행 계산기처럼 원하는 도메인 연결 가능 (Pages 프로젝트 설정 → Custom domains)
