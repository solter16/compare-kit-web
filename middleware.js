const BOT_UA_PATTERN = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman|insomnia|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt|ccbot|anthropic|facebook|twitter|linkedin|whatsapp|telegram|discord|slack/i;

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  // 봇 User-Agent 차단
  if (BOT_UA_PATTERN.test(ua)) {
    return new Response('Forbidden', { status: 403 });
  }

  // User-Agent 없는 요청 차단
  if (!ua || ua.length < 10) {
    return new Response('Forbidden', { status: 403 });
  }
}

export const config = {
  matcher: ['/((?!robots\\.txt|favicon\\.ico).*)']
};
