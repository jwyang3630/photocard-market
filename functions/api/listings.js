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
      .prepare('SELECT id, type, group_name AS "group", member, era, price, description, contact, created_at AS createdAt FROM listings ORDER BY created_at DESC LIMIT 500')
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

  const { type, group, member, era, price, description, contact } = body || {};

  if (type !== 'sell' && type !== 'wanted') {
    return jsonResponse({ error: 'INVALID_TYPE' }, 400);
  }
  if (!group || typeof group !== 'string' || !group.trim()) {
    return jsonResponse({ error: 'GROUP_REQUIRED' }, 400);
  }
  if (!member || typeof member !== 'string' || !member.trim()) {
    return jsonResponse({ error: 'MEMBER_REQUIRED' }, 400);
  }

  // 아주 단순한 스팸 방지: 설명/연락처 길이 제한
  const safeEra = (era || '').toString().slice(0, 200);
  const safeDesc = (description || '').toString().slice(0, 1000);
  const safeContact = (contact || '').toString().slice(0, 300);
  const safePrice = price !== null && price !== undefined && price !== '' ? Number(price) : null;

  const id = 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  const createdAt = Date.now();

  try {
    await env.DB
      .prepare(
        'INSERT INTO listings (id, type, group_name, member, era, price, description, contact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, type, group.trim(), member.trim(), safeEra, safePrice, safeDesc, safeContact, createdAt)
      .run();

    return jsonResponse({
      listing: {
        id, type, group: group.trim(), member: member.trim(),
        era: safeEra, price: safePrice, description: safeDesc,
        contact: safeContact, createdAt,
      },
    }, 201);
  } catch (err) {
    return jsonResponse({ error: 'DB_WRITE_FAILED', message: String(err) }, 500);
  }
}
