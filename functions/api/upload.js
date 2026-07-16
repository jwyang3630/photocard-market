// POST /api/upload -> 이미지 파일을 R2에 업로드하고 공개 URL을 반환
//
// Cloudflare Pages 프로젝트 설정에서 R2 버킷을 바인딩해야 합니다.
// 바인딩 변수명: IMAGES
// 그리고 환경변수(Environment variable, 시크릿 아님)로 PUBLIC_R2_URL을 설정해야 합니다.
// 예: https://pub-xxxxxxxxxxxx.r2.dev  (또는 R2에 연결한 커스텀 도메인)

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.IMAGES) {
    return jsonResponse({ error: 'R2_NOT_CONFIGURED', message: 'IMAGES 버킷이 바인딩되지 않았습니다.' }, 500);
  }
  if (!env.PUBLIC_R2_URL) {
    return jsonResponse({ error: 'PUBLIC_URL_NOT_CONFIGURED', message: 'PUBLIC_R2_URL 환경변수가 설정되지 않았습니다.' }, 500);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return jsonResponse({ error: 'INVALID_FORM_DATA' }, 400);
  }

  const file = formData.get('image');
  if (!file || typeof file === 'string') {
    return jsonResponse({ error: 'NO_FILE' }, 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonResponse({ error: 'INVALID_FILE_TYPE', message: 'jpg, png, webp, gif만 업로드 가능합니다.' }, 400);
  }
  if (file.size > MAX_SIZE) {
    return jsonResponse({ error: 'FILE_TOO_LARGE', message: '5MB 이하 파일만 업로드 가능합니다.' }, 400);
  }

  const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const key = 'uploads/' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10) + '.' + ext;

  try {
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (err) {
    return jsonResponse({ error: 'UPLOAD_FAILED', message: String(err) }, 500);
  }

  const publicUrl = env.PUBLIC_R2_URL.replace(/\/$/, '') + '/' + key;
  return jsonResponse({ url: publicUrl }, 201);
}
