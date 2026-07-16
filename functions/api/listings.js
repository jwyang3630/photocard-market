// GET /api/listings  -> 전체 매물 목록 조회
// POST /api/listings -> 새 매물 등록
//
// Cloudflare Pages 프로젝트 설정에서 D1 데이터베이스를 바인딩해야 합니다.
// 바인딩 변수명: DB

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB
      .prepare('SELECT id, type, brand, model, size, condition, price, description, contact, image_url AS imageUrl, created_at AS createdAt FROM listings ORDER BY created_at DESC LIMIT 500')
      .all();
    return jsonResponse({ listings: results });
  } catch (err) {
    return jsonResponse({ error: 'DB_READ_FAILED', message: String(err) }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return jsonResponse({ error: 'INVALID_JSON' }, 400);
  }

  const { type, brand, model, size, condition, price, description, contact, imageUrl } = body || {};

  if (type !== 'sell' && type !== 'wanted') {
    return jsonResponse({ error: 'INVALID_TYPE' }, 400);
  }
  if (!brand || typeof brand !== 'string' || !brand.trim()) {
    return jsonResponse({ error: 'BRAND_REQUIRED' }, 400);
  }
  if (!model || typeof model !== 'string' || !model.trim()) {
    return jsonResponse({ error: 'MODEL_REQUIRED' }, 400);
  }

  // 아주 단순한 스팸 방지: 설명/연락처/이미지URL 길이 제한
  const safeSize = (size || '').toString().slice(0, 20);
  const safeCondition = (condition || '').toString().slice(0, 30);
  const safeDesc = (description || '').toString().slice(0, 1000);
  const safeContact = (contact || '').toString().slice(0, 300);
  const safeImageUrl = (imageUrl || '').toString().slice(0, 500);
  const safePrice = price !== null && price !== undefined && price !== '' ? Number(price) : null;

  // 이미지 URL은 http(s)로 시작하는 경우만 허용 (그 외엔 저장하지 않음)
  const validImageUrl = /^https?:\/\//.test(safeImageUrl) ? safeImageUrl : '';

  const id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  const createdAt = Date.now();

  try {
    await env.DB
      .prepare(
        'INSERT INTO listings (id, type, brand, model, size, condition, price, description, contact, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, type, brand.trim(), model.trim(), safeSize, safeCondition, safePrice, safeDesc, safeContact, validImageUrl, createdAt)
      .run();

    return jsonResponse({
      listing: {
        id, type, brand: brand.trim(), model: model.trim(),
        size: safeSize, condition: safeCondition, price: safePrice,
        description: safeDesc, contact: safeContact, imageUrl: validImageUrl, createdAt,
      },
    }, 201);
  } catch (err) {
    return jsonResponse({ error: 'DB_WRITE_FAILED', message: String(err) }, 500);
  }
}
