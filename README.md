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

## 4. 확인

- 매물 등록 후 새로고침해도 유지되는지
- 카드를 클릭하면 뒤집혀서 이미지 URL에 넣은 실물 사진이 나오는지
- 다른 브라우저/시크릿 모드에서도 같은 매물이 보이는지 (= 여러 사용자가 같은 DB를 공유)

## 지금 구조의 한계 (다음 단계로 고려할 것)

- **이미지는 URL만 저장**: 실제 파일 업로드 기능은 없어요. 네이버 블로그나 이미지 호스팅에 먼저 올리고 그 링크를 붙여넣는 방식이에요. 파일 업로드를 직접 받으려면 Cloudflare R2(오브젝트 스토리지)를 추가로 붙여야 하는데, 이건 초기 검증 끝나고 트래픽 생기면 붙여도 늦지 않아요.
- **매물 삭제/신고 기능 없음**: 등록만 가능, 삭제 기능은 아직 없음
- **스팸 방지 없음**: 트래픽 늘면 Cloudflare Turnstile(캡차) 붙이는 게 좋음
- **정품 인증 없음**: 리셀 특성상 정품 이슈가 민감한데, 지금은 "설명"란에 자율 기재하는 방식. 나중에 "정품 인증샷 필수" 같은 규칙을 공지문구로 추가하는 게 좋음
- **커스텀 도메인**: 여행 계산기처럼 원하는 도메인 연결 가능 (Pages 프로젝트 설정 → Custom domains)
