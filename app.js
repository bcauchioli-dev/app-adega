/* App Adega · v1.0 · aplicativo de uma página, sem dependências externas.
   Fala direto com o Supabase (Auth, REST, RPC e Storage). */
(function () {
'use strict';

var VERSION = '1.1.0';
var CFG = window.APP_CONFIG || {};
var YEAR = new Date().getFullYear();
var STYLE_ORDER = ['tinto', 'branco', 'rosé', 'espumante', 'doce/fortificado'];
var STYLE_NAME = { 'tinto': 'Tintos', 'branco': 'Brancos', 'rosé': 'Rosés', 'espumante': 'Espumantes', 'doce/fortificado': 'Doces e fortificados' };
var STYLE_ONE = { 'tinto': 'Tinto', 'branco': 'Branco', 'rosé': 'Rosé', 'espumante': 'Espumante', 'doce/fortificado': 'Doce ou fortificado' };
var STYLE_COLOR = { 'tinto': '#B5485E', 'branco': '#CBB86A', 'rosé': '#D98A99', 'espumante': '#D4C27A', 'doce/fortificado': '#D9A441' };
var PAPEL_NOME = { admin: 'Administrador', dono: 'Dono', familia: 'Família', operador: 'Operador', consulta: 'Consulta' };
var NOTA_IMPORT = 'Importado da planilha AppSheet';
var NOTA_LEGADO = 'Consumo registrado na planilha antiga (sem data)';

/* ------------------------------------------------------------------ utilitários */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function nfmt(n) { return Number(n).toLocaleString('pt-BR'); }
function plural(n, a, b) { return nfmt(n) + ' ' + (n === 1 ? a : b); }
function cmp(a, b) { return String(a).localeCompare(String(b), 'pt', { sensitivity: 'base' }); }
function pad(n) { return String(n); }
function todayISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function dt(s) { return new Date(s); }
function fmtDate(s) { return dt(s).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, ''); }
function fmtTime(s) { return dt(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
function dayLabel(s) {
  var d = dt(s), t = new Date(); var a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  var diff = Math.round((b - a) / 86400000);
  if (diff === 0) return 'Hoje'; if (diff === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: d.getFullYear() === t.getFullYear() ? undefined : 'numeric' });
}
function money(v, m) { if (v == null || v === '') return ''; return (m === 'BRL' ? 'R$ ' : 'US$ ') + Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }
function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return undefined; } }
function strip(html) { return html.replace(/>\s+</g, '><').trim(); }

function svg(d, extra) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"' + (extra || '') + '>' + d + '</svg>'; }
var I = {
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  chev: svg('<path d="M9 6l6 6-6 6"/>'),
  clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
  glass: svg('<path d="M7.5 3h9l-.7 6a3.8 3.8 0 0 1-7.6 0z"/><path d="M12 13v7M8.5 21h7"/>'),
  bar: svg('<path d="M6 4h12l-1.6 15.2a1 1 0 0 1-1 .8H8.6a1 1 0 0 1-1-.8z"/><path d="M6.7 10h10.6"/>'),
  chart: svg('<path d="M5 20V10M10 20V4M15 20v-7M20 20v-4"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  img: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>'),
  eye: svg('<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff: svg('<path d="M3 3l18 18M10.6 6.1A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.2 3.9M6.3 7.3C3.7 9 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  out: svg('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5"/>'),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6"/>'),
  move: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  edit: svg('<path d="M4 20h4L19.5 8.5l-4-4L4 16z"/>'),
  wifi: svg('<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 4.3-2.4M15.4 10.4A10 10 0 0 1 19 12.6M2 9a14 14 0 0 1 3.3-2.3M12 20h.01"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>')
};

/* ------------------------------------------------------------------ API (Supabase) */
function ApiError(kind, message, status, code) { this.kind = kind; this.message = message; this.status = status; this.code = code; }
ApiError.prototype = Object.create(Error.prototype);

var MSG = {
  rede: 'Sem conexão. Confira a internet e tente de novo.',
  credenciais: 'E-mail ou senha incorretos.',
  limite: 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.',
  senha_fraca: 'A senha precisa ter pelo menos 8 caracteres.',
  sessao: 'Sua sessão terminou. Entre de novo.',
  permissao: 'Seu acesso não permite essa ação.',
  garrafa_indisponivel: 'Essa garrafa já saiu do estoque. A lista foi atualizada.',
  garrafa_inexistente: 'Essa garrafa não foi encontrada. A lista foi atualizada.',
  nao_pode_desfazer: 'Não dá mais para desfazer: essa garrafa já teve outro registro depois.',
  nicho_invalido: 'Número de nicho inválido.',
  mesmo_local: 'A garrafa já está nesse lugar.',
  destino_obrigatorio: 'Escolha para onde a garrafa vai.',
  quantidade_invalida: 'Quantidade inválida.',
  nome_obrigatorio: 'Informe o nome.',
  sem_permissao: 'Seu acesso não permite editar este item.',
  produto_inexistente: 'Este item não foi encontrado.',
  campo_nao_permitido: 'Campo não permitido.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  reauthentication_needed: 'Por segurança, saia e entre de novo antes de trocar a senha.',
  email_not_confirmed: 'Este e-mail ainda não foi confirmado. Fale com quem administra a sua adega.'
};

var API = (function () {
  var KEY = 'adega.sessao';
  var sess = store(KEY) || null;
  var refreshing = null;
  var onExpired = null;
  function persist(s) { sess = s; store(KEY, s || null); }
  function base() { return String(CFG.supabaseUrl || '').replace(/\/+$/, ''); }
  function toError(status, body) {
    var code = body && (body.error_code || (typeof body.code === 'string' ? body.code : null) || body.error || body.code);
    var msg = body && (body.message || body.msg || body.error_description || '');
    var known = msg && MSG[String(msg).trim()];
    if (known) return new ApiError(String(msg).trim(), known, status, code);
    if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return new ApiError('credenciais', MSG.credenciais, status, code);
    if (code && MSG[code] && /^(same_password|reauthentication_needed|email_not_confirmed)$/.test(code)) return new ApiError(code, MSG[code], status, code);
    if (status === 429 || code === 'over_request_rate_limit') return new ApiError('limite', MSG.limite, status, code);
    if (code === 'weak_password' || status === 422) return new ApiError('senha_fraca', MSG.senha_fraca, status, code);
    if (status === 401 || code === 'PGRST301' || code === 'PGRST303' || code === 'bad_jwt') return new ApiError('sessao', MSG.sessao, status, code);
    if (status === 403 || code === '42501' || /row-level security/i.test(msg)) return new ApiError('permissao', MSG.permissao, status, code);
    return new ApiError('erro', 'Algo deu errado (' + (code || status) + '). Tente de novo.', status, code);
  }
  function raw(path, opts) {
    return fetch(base() + path, opts).then(function (res) {
      return res.text().then(function (txt) {
        var body = null;
        if (txt) { try { body = JSON.parse(txt); } catch (e) { body = { message: txt }; } }
        if (!res.ok) throw toError(res.status, body);
        return body;
      });
    }, function () { throw new ApiError('rede', MSG.rede, 0); });
  }
  function hdr(extra, auth) {
    var h = { apikey: CFG.supabaseKey };
    if (auth !== false && sess) h.Authorization = 'Bearer ' + sess.access_token;
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function normSession(b) {
    return { access_token: b.access_token, refresh_token: b.refresh_token, user: b.user,
             expires_at: b.expires_at || Math.floor(Date.now() / 1000) + (b.expires_in || 3600) };
  }
  function refresh() {
    if (!sess) return Promise.reject(new ApiError('sessao', MSG.sessao, 401));
    if (!refreshing) {
      refreshing = raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: hdr({ 'Content-Type': 'application/json' }, false), body: JSON.stringify({ refresh_token: sess.refresh_token }) })
        .then(function (b) { persist(normSession(b)); return sess; })
        .catch(function (e) {
          if (e.kind !== 'rede') { persist(null); if (onExpired) onExpired(); throw new ApiError('sessao', MSG.sessao, 401); }
          throw e;
        })
        .finally(function () { refreshing = null; });
    }
    return refreshing;
  }
  function authed(path, opts, retried) {
    opts = opts || {};
    if (!sess) return Promise.reject(new ApiError('sessao', MSG.sessao, 401));
    var pre = (sess.expires_at - Date.now() / 1000 < 90) ? refresh() : Promise.resolve();
    return pre.then(function () {
      var o = { method: opts.method || 'GET', headers: hdr(opts.headers || {}), body: opts.body };
      return raw(path, o).catch(function (e) {
        if (e.kind === 'sessao' && !retried) return refresh().then(function () { return authed(path, opts, true); });
        throw e;
      });
    });
  }
  return {
    session: function () { return sess; },
    onExpired: function (fn) { onExpired = fn; },
    signIn: function (email, password) {
      return raw('/auth/v1/token?grant_type=password', { method: 'POST', headers: hdr({ 'Content-Type': 'application/json' }, false), body: JSON.stringify({ email: email, password: password }) })
        .then(function (b) { persist(normSession(b)); return sess; });
    },
    signOut: function () {
      var s = sess; persist(null);
      if (!s) return Promise.resolve();
      return fetch(base() + '/auth/v1/logout', { method: 'POST', headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + s.access_token } }).catch(function () {});
    },
    updatePassword: function (pw) { return authed('/auth/v1/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }); },
    select: function (table, query) { return authed('/rest/v1/' + table + '?' + query); },
    selectAll: function (table, query) {
      var out = [], page = 1000;
      function step(off) {
        return authed('/rest/v1/' + table + '?' + query + '&limit=' + page + '&offset=' + off).then(function (rows) {
          out = out.concat(rows || []);
          return (rows && rows.length === page) ? step(off + page) : out;
        });
      }
      return step(0);
    },
    rpc: function (fn, args) { return authed('/rest/v1/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) }); },
    upload: function (path, blob) { return authed('/storage/v1/object/fotos/' + path, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'false', 'cache-control': '31536000' }, body: blob }); },
    sign: function (paths) {
      if (!paths.length) return Promise.resolve([]);
      return authed('/storage/v1/object/sign/fotos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 3600, paths: paths }) });
    },
    signedUrl: function (rel) { return /^https?:/.test(rel) ? rel : base() + '/storage/v1' + rel; }
  };
})();

/* ------------------------------------------------------------------ estado */
var PREF_KEY = 'adega.pref';
var PREF = store(PREF_KEY) || {};
function savePref() { store(PREF_KEY, PREF); }

var S = {
  phase: 'boot', me: null, adegas: [], adegaId: null,
  route: { name: 'home' }, navDepth: 0, scroll: {},
  ui: { ver: PREF.ver || 'pais', barVer: PREF.barVer || 'cat', chips: {}, q: '', loginErr: null, loginBusy: false, showPw: false,
        offline: !navigator.onLine, syncedAt: null, syncing: false, bootErr: null, loadingAdega: false },
  modal: null, busy: null, ficha: {}
};
var D = { produtos: new Map(), garrafas: new Map(), locais: new Map(), movs: [], alts: [], nomes: new Map(), membros: [], fotos: {} };
var X = { byP: new Map(), adega: [], bar: [] };

function adegaAtual() { for (var i = 0; i < S.adegas.length; i++) if (S.adegas[i].id === S.adegaId) return S.adegas[i]; return null; }
function papel() { if (S.me && S.me.is_admin) return 'admin'; var a = adegaAtual(); return a ? a.papel : null; }
function canWrite() { return ['admin', 'dono', 'familia', 'operador'].indexOf(papel()) >= 0; }
function canManage() { return ['admin', 'dono'].indexOf(papel()) >= 0; }
function escala() { var a = adegaAtual(); return (a && a.escala && a.escala.length) ? a.escala : ['A+', 'A', 'B+', 'B', 'C']; }
function meuNome() {
  var m = D.membros.filter(function (x) { return S.me && x.user_id === S.me.id; })[0];
  return (m && m.nome_exibicao) || (S.me && S.me.nome) || '';
}

/* ------------------------------------------------------------------ derivados */
function derive() {
  var byP = new Map();
  D.garrafas.forEach(function (g) {
    if (g.status !== 'em_estoque') return;
    var a = byP.get(g.produto_id); if (!a) { a = []; byP.set(g.produto_id, a); } a.push(g);
  });
  var ad = [], br = [];
  D.produtos.forEach(function (p) { if (!byP.has(p.id)) return; (p.secao === 'bar' ? br : ad).push(p.id); });
  X = { byP: byP, adega: ad, bar: br };
}
function stock(id) { return X.byP.get(id) || []; }
function countB(ids) { var n = 0; for (var i = 0; i < ids.length; i++) n += stock(ids[i]).length; return n; }
function prod(id) { return D.produtos.get(id); }
function locOf(g) { return g && g.local_id ? D.locais.get(g.local_id) : null; }
function isNicho(L) { return !!L && L.tipo === 'nicho' && /^[0-9]+$/.test(L.nome); }
function nichoNum(L) { return parseInt(L.nome, 10); }
function locName(L) { return !L ? 'Sem local' : (isNicho(L) ? 'Nicho ' + pad(nichoNum(L)) : L.nome); }
function slotName(g) { return locName(locOf(g)); }
function deLoc(L) { return !L ? 'sem local' : (isNicho(L) ? 'do nicho ' + pad(nichoNum(L)) : 'de ' + L.nome); }
function paraLoc(L) { return !L ? 'sem local' : (isNicho(L) ? 'para o nicho ' + pad(nichoNum(L)) : 'para ' + L.nome); }
function locIdsLabel(ids) { return locLabel(ids.map(function (id) { return { local_id: id }; }), true); }
function safra(p) { return p.safra ? String(p.safra) : (p.sem_safra ? 'NV' : ''); }
function janela(p) {
  if (p.secao === 'bar' || p.tipo !== 'vinho') return { k: 'na', t: '' };
  var ji = p.janela_inicio, jf = p.janela_fim;
  if (!ji && !jf) return { k: 'sem', t: 'Sem janela informada' };
  if (ji && YEAR < ji) return { k: 'guardar', t: 'Guardar até ' + ji };
  if (jf && YEAR > jf) return { k: 'passou', t: 'Passou da janela (' + jf + ')' };
  if (jf && YEAR === jf) return { k: 'ultimo', t: 'Último ano da janela' };
  return { k: 'ponto', t: jf ? 'No ponto · até ' + jf : 'No ponto' };
}
function paraAbrir(p) { var k = janela(p).k; return k === 'passou' || k === 'ultimo'; }
function locLabel(gs, full) {
  var nums = [], areas = [], none = 0;
  gs.forEach(function (g) { var L = locOf(g); if (!L) { none++; return; } if (isNicho(L)) nums.push(nichoNum(L)); else if (areas.indexOf(L.nome) < 0) areas.push(L.nome); });
  nums.sort(function (a, b) { return a - b; });
  var parts = [], i = 0;
  while (i < nums.length) { var a = nums[i], b = a; while (i + 1 < nums.length && (nums[i + 1] === b + 1 || nums[i + 1] === b)) { i++; b = nums[i]; } parts.push(a === b ? pad(a) : pad(a) + '–' + pad(b)); i++; }
  var out = [];
  if (parts.length) out.push((full ? (nums.length > 1 ? 'nichos ' : 'nicho ') : '') + parts.join(', '));
  if (areas.length) out.push(areas.join(' · '));
  if (none) out.push('sem local');
  return out.join(' · ');
}
function locGroups(gs) {
  var m = new Map();
  gs.forEach(function (g) { var k = g.local_id || 'none'; if (!m.has(k)) m.set(k, []); m.get(k).push(g); });
  var arr = []; m.forEach(function (v, k) { arr.push({ key: k, L: k === 'none' ? null : D.locais.get(k), gs: v }); });
  arr.sort(function (a, b) {
    var an = isNicho(a.L), bn = isNicho(b.L);
    if (an && bn) return nichoNum(a.L) - nichoNum(b.L);
    if (an !== bn) return an ? -1 : 1;
    if (!a.L) return 1; if (!b.L) return -1;
    return cmp(a.L.nome, b.L.nome);
  });
  return arr;
}
function metaLine(p, ctx) {
  var a = [];
  if (safra(p)) a.push(safra(p));
  if (p.secao === 'bar') { if (p.categoria && ctx !== 'cat') a.push(p.categoria); if (p.pais) a.push(p.pais); }
  else if (ctx === 'pais') { if (p.regiao) a.push(p.regiao); }
  else { if (p.pais) a.push(p.pais); if (p.regiao) a.push(p.regiao); }
  return a.join(' · ');
}
function nomeUsuario(id) { if (!id) return 'Importação'; if (S.me && id === S.me.id) return meuNome() || 'Você'; return D.nomes.get(id) || 'Administração'; }
function bucketNicho(n) { var a = Math.floor(n / 100) * 100; return { key: 'n' + a, label: 'Nichos ' + pad(a || 1) + '–' + pad(a + 99), sort: a }; }

/* agrupamentos: lista de grupos com contagem de garrafas */
function groupsFor(mode, ids) {
  var map = new Map();
  function add(key, label, sort, id, n, extra) {
    var g = map.get(key);
    if (!g) { g = { key: key, label: label, sort: sort, ids: [], set: new Set(), n: 0 }; if (extra) for (var k in extra) g[k] = extra[k]; map.set(key, g); }
    if (!g.set.has(id)) { g.set.add(id); g.ids.push(id); }
    g.n += n;
  }
  var esc_ = escala();
  ids.forEach(function (id) {
    var p = prod(id), n = stock(id).length;
    if (mode === 'pais') add(p.pais || '—', p.pais || 'País não informado', p.pais ? 0 : 1, id, n);
    else if (mode === 'avaliacao') { var r = p.avaliacao || ''; var i = esc_.indexOf(r); add(r || '—', r || 'Sem avaliação', i < 0 ? 99 : i, id, n); }
    else if (mode === 'tipo') { var e = p.estilo || ''; var j = STYLE_ORDER.indexOf(e); add(j < 0 ? '—' : e, j < 0 ? 'Outros' : STYLE_NAME[e], j < 0 ? 99 : j, id, n, { color: STYLE_COLOR[e] }); }
    else if (mode === 'cat') add(p.categoria || '—', p.categoria || 'Sem categoria', p.categoria ? 0 : 1, id, n);
    else if (mode === 'local') {
      stock(id).forEach(function (g) {
        var L = locOf(g);
        if (isNicho(L)) { var b = bucketNicho(nichoNum(L)); add(b.key, b.label, b.sort, id, 1); }
        else if (L) add('a:' + L.id, L.nome, 100000, id, 1);
        else add('none', 'Sem local', 200000, id, 1);
      });
    }
  });
  var arr = []; map.forEach(function (g) { arr.push(g); });
  arr.sort(function (a, b) { return (a.sort - b.sort) || cmp(a.label, b.label); });
  return arr;
}
function idsInGroup(mode, key, pool) {
  if (mode === 'abrir') return pool.filter(function (id) { return paraAbrir(prod(id)); });
  if (mode === 'local') {
    return pool.filter(function (id) {
      return stock(id).some(function (g) {
        var L = locOf(g);
        if (key === 'none') return !L;
        if (key.indexOf('a:') === 0) return L && L.id === key.slice(2);
        return isNicho(L) && bucketNicho(nichoNum(L)).key === key;
      });
    });
  }
  return pool.filter(function (id) {
    var p = prod(id);
    if (mode === 'pais') return (p.pais || '—') === key;
    if (mode === 'avaliacao') return (p.avaliacao || '—') === key;
    if (mode === 'tipo') return (STYLE_ORDER.indexOf(p.estilo) < 0 ? '—' : p.estilo) === key;
    if (mode === 'cat') return (p.categoria || '—') === key;
    return false;
  });
}
function groupTitle(mode, key) {
  if (mode === 'abrir') return 'Para abrir logo';
  if (mode === 'pais') return key === '—' ? 'País não informado' : key;
  if (mode === 'avaliacao') return key === '—' ? 'Sem avaliação' : key;
  if (mode === 'tipo') return key === '—' ? 'Outros' : STYLE_NAME[key] || key;
  if (mode === 'cat') return key === '—' ? 'Sem categoria' : key;
  if (mode === 'local') { if (key === 'none') return 'Sem local'; if (key.indexOf('a:') === 0) { var L = D.locais.get(key.slice(2)); return L ? L.nome : 'Local'; } var a = parseInt(key.slice(1), 10); return 'Nichos ' + pad(a || 1) + '–' + pad(a + 99); }
  return '';
}
function sortProducts(ids) {
  return ids.slice().sort(function (a, b) { var pa = prod(a), pb = prod(b); return cmp(pa.nome, pb.nome) || (pa.safra || 0) - (pb.safra || 0); });
}
function firstNicho(id) { var m = 1e9; stock(id).forEach(function (g) { var L = locOf(g); if (isNicho(L)) m = Math.min(m, nichoNum(L)); }); return m; }
function freeNichos(n) {
  var used = new Set(); D.garrafas.forEach(function (g) { if (g.status === 'em_estoque' && g.local_id) used.add(g.local_id); });
  var arr = []; D.locais.forEach(function (L) { if (isNicho(L) && !used.has(L.id)) arr.push(nichoNum(L)); });
  arr.sort(function (a, b) { return a - b; });
  return arr.slice(0, n);
}
function areas() { var arr = []; D.locais.forEach(function (L) { if (!isNicho(L) && L.pai_id == null && L.nome !== 'Nichos numerados') arr.push(L); }); return arr.sort(function (a, b) { return cmp(a.nome, b.nome); }); }

/* ------------------------------------------------------------------ DOM: aplicar mudanças sem recriar a tela */
function morph(parent, html) {
  var tpl = document.createElement('template');
  tpl.innerHTML = strip(html);
  morphChildren(parent, tpl.content);
}
function keyOf(n) { return n.nodeType === 1 ? n.getAttribute('data-k') : null; }
function sameNode(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
  if (a.nodeType !== 1) return true;
  return a.getAttribute('id') === b.getAttribute('id') && a.getAttribute('data-f') === b.getAttribute('data-f');
}
function morphChildren(from, to) {
  var keyed = new Map();
  for (var c = from.firstChild; c; c = c.nextSibling) { var k = keyOf(c); if (k) keyed.set(k, c); }
  var cur = from.firstChild;
  var kids = Array.prototype.slice.call(to.childNodes);
  for (var i = 0; i < kids.length; i++) {
    var nk = kids[i], match = null, kk = keyOf(nk);
    if (kk) { match = keyed.get(kk) || null; if (match && match.nodeName !== nk.nodeName) match = null; }
    else if (cur && !keyOf(cur) && sameNode(cur, nk)) match = cur;
    if (match) {
      if (match === cur) cur = cur.nextSibling; else from.insertBefore(match, cur);
      if (kk) keyed.delete(kk);
      patch(match, nk);
    } else {
      from.insertBefore(nk, cur);
    }
  }
  while (cur) { var nx = cur.nextSibling; from.removeChild(cur); cur = nx; }
}
function patch(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  var i, at;
  for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i].name; if (!b.hasAttribute(at)) a.removeAttribute(at); }
  for (i = 0; i < b.attributes.length; i++) { at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
  if (a.nodeName === 'TEXTAREA' || a.nodeName === 'INPUT') return;
  morphChildren(a, b);
}

/* ------------------------------------------------------------------ tema */
var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
function applyTheme() {
  var t = PREF.theme || 'dark';
  var eff = t === 'system' ? (mq && mq.matches ? 'light' : 'dark') : t;
  document.documentElement.setAttribute('data-theme', eff);
  var m = document.getElementById('meta-theme'); if (m) m.setAttribute('content', eff === 'light' ? '#F6F5F1' : '#0E1110');
}
if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (PREF.theme === 'system') applyTheme(); });

/* ------------------------------------------------------------------ rotas, transições e voltar */
var DEPTH = { home: 0, bar: 0, painel: 0, grupo: 1, busca: 1, historico: 1, vinho: 2 };
function parseHash() {
  var h = location.hash.replace(/^#\/?/, '');
  var parts = h ? h.split('/').map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }) : [];
  switch (parts[0]) {
    case 'bar': return { name: 'bar' };
    case 'painel': return { name: 'painel' };
    case 'busca': return { name: 'busca' };
    case 'historico': return { name: 'historico' };
    case 'g': return { name: 'grupo', modo: parts[1] || 'pais', chave: parts.slice(2).join('/'), secao: parts[1] === 'cat' ? 'bar' : null };
    case 'b': return { name: 'grupo', modo: parts[1] || 'cat', chave: parts.slice(2).join('/'), secao: 'bar' };
    case 'v': return { name: 'vinho', id: parts[1] };
    default: return { name: 'home' };
  }
}
function routeKey(r) { return [r.name, r.modo || '', r.chave || '', r.id || '', r.secao || ''].join('|'); }
function hrefGroup(mode, key, secao) { return '#/' + (secao === 'bar' ? 'b' : 'g') + '/' + mode + '/' + encodeURIComponent(key); }
var navIntent = null;
function go(hash, intent) { navIntent = intent || 'fwd'; if (location.hash === hash) { navIntent = null; return; } location.hash = hash; }
function sameHash(h) { return location.hash === h || (h === '#/' && (!location.hash || location.hash === '#')); }
function goTab(hash) {
  if (sameHash(hash)) { if (layer.state === 'open' && !S.modal) renderLayer(); else window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  navIntent = 'tab'; location.replace(hash);
}
function goBack(fallback) { if (S.navDepth > 0) history.back(); else { navIntent = 'up'; location.replace(fallback || '#/'); } }
function transition(dir, fn, flat) {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (!document.startViewTransition || reduce || dir === 'none') {
    fn();
    var sc = document.getElementById('screen');
    if (sc && !reduce && dir !== 'none') { sc.classList.remove('enter-r', 'enter-l', 'enter-f'); void sc.offsetWidth; sc.classList.add(dir === 'fwd' ? 'enter-r' : dir === 'back' ? 'enter-l' : 'enter-f'); }
    return;
  }
  root.classList.add('vt-' + dir); if (flat) root.classList.add('vt-flat');
  var done = function () { root.classList.remove('vt-' + dir, 'vt-flat'); };
  var t;
  try { t = document.startViewTransition(fn); } catch (e) { done(); fn(); return; }
  t.finished.then(done, done);
}
window.addEventListener('hashchange', function () {
  var hadLayer = layer.state !== 'closed';
  S.modal = null;
  var prev = S.route, next = parseHash();
  S.scroll[routeKey(prev)] = document.body.classList.contains('locked') ? scrollLockY : window.scrollY;
  var dir;
  if (navIntent === 'tab') dir = 'fade';
  else if (navIntent === 'fwd') { dir = 'fwd'; S.navDepth++; }
  else if (navIntent === 'up') dir = 'back';
  else { dir = (DEPTH[next.name] || 0) <= (DEPTH[prev.name] || 0) ? 'back' : 'fwd'; if (dir === 'back') S.navDepth = Math.max(0, S.navDepth - 1); else S.navDepth++; }
  navIntent = null;
  S.route = next;
  if (S.phase !== 'app') { if (hadLayer) closeLayerNow(); return render(); }
  transition(dir, function () {
    if (hadLayer) closeLayerNow();
    render();
    window.scrollTo(0, dir === 'back' ? (S.scroll[routeKey(next)] || 0) : 0);
    if (next.name === 'busca') focusSoon('#q');
  }, hadLayer);
  if (next.name === 'vinho') loadFicha(next.id);
});
var afterPop = null;
window.addEventListener('popstate', function (e) {
  if (afterPop) { var f = afterPop; afterPop = null; f(); return; }
  if (S.modal && !(e.state && e.state.modal)) closeModal(true);
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function focusSoon(sel) { setTimeout(function () { var el = document.querySelector(sel); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } }, 260); }

/* ------------------------------------------------------------------ camadas (folhas e menu) */
var layer = { state: 'closed', type: null, timer: null, lastFocus: null };
var scrollLockY = 0;
function lockScroll() { if (document.body.classList.contains('locked')) return; scrollLockY = window.scrollY; document.body.style.top = (-scrollLockY) + 'px'; document.body.classList.add('locked'); }
function unlockScroll() { if (!document.body.classList.contains('locked')) return; document.body.classList.remove('locked'); document.body.style.top = ''; window.scrollTo(0, scrollLockY); }
function layerType(m) { return m.kind === 'menu' ? 'drawer' : m.kind === 'foto' ? 'viewer' : 'sheet'; }
function clearToasts() {
  var box = document.getElementById('toasts'); if (!box) return;
  Array.prototype.forEach.call(box.children, function (t) { t.classList.remove('in'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 220); });
}
function openModal(m) {
  var replacing = !!S.modal;
  clearToasts();
  S.modal = m; m.draft = m.draft || {}; m.step = m.step || 'form';
  try { if (replacing) history.replaceState({ modal: 1 }, ''); else history.pushState({ modal: 1 }, ''); } catch (e) {}
  if (!replacing) layer.lastFocus = document.activeElement;
  renderLayer();
}
function closeModal(fromHistory) {
  if (!S.modal) return;
  S.modal = null;
  if (!fromHistory && history.state && history.state.modal) { try { history.back(); } catch (e) {} }
  renderLayer();
  if (layer.lastFocus && layer.lastFocus.focus) { try { layer.lastFocus.focus({ preventScroll: true }); } catch (e) {} }
}
function renderLayer(opts) {
  var el = document.getElementById('layer'); if (!el) return;
  if (!S.modal) {
    if (layer.state === 'open') {
      layer.state = 'closing';
      var l = el.firstElementChild; if (l) { l.classList.remove('open'); l.classList.add('closing'); }
      clearTimeout(layer.timer);
      layer.timer = setTimeout(closeLayerNow, 300);
    }
    return;
  }
  clearTimeout(layer.timer);
  var t = layerType(S.modal), html = modalHtml(S.modal);
  if (layer.state !== 'open' || layer.type !== t) {
    var swap = layer.state === 'open';
    el.innerHTML = strip(html);
    layer.state = 'open'; layer.type = t;
    lockScroll();
    var node = el.firstElementChild;
    if (swap) node.classList.add('swap');
    void node.offsetWidth;
    requestAnimationFrame(function () { node.classList.add('open'); node.classList.remove('swap'); });
    var panel = node.querySelector('[data-panel]'); if (panel) { try { panel.focus({ preventScroll: true }); } catch (e) {} }
  } else {
    var sh = opts && opts.step ? el.querySelector('.sheet') : null, h0 = sh ? sh.offsetHeight : 0;
    morph(el, html.replace('class="layer ', 'class="layer open '));
    if (h0) animateStep(el, h0);
  }
}
function animateStep(el, h0) {
  var sh = el.querySelector('.sheet');
  if (!sh || !sh.animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var h1 = sh.offsetHeight, ease = 'cubic-bezier(.2,.8,.2,1)';
  if (Math.abs(h1 - h0) > 2) sh.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 280, easing: ease });
  Array.prototype.forEach.call(sh.children, function (c) { if (!c.classList.contains('grab')) c.animate([{ opacity: 0.2, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: ease }); });
}
function closeLayerNow() {
  clearTimeout(layer.timer);
  var el = document.getElementById('layer'); if (el) el.innerHTML = '';
  layer.state = 'closed'; layer.type = null;
  unlockScroll();
}
/* sai de uma folha ou do menu e só então navega (o voltar do aparelho continua coerente) */
function leaveModal(fn) {
  var popping = !!S.modal && history.state && history.state.modal;
  S.modal = null;
  var done = function () {
    if (fn) fn();
    setTimeout(function () { if (!S.modal && layer.state === 'open') renderLayer(); }, 700);
  };
  if (!popping) return done();
  afterPop = done;
  try { history.back(); } catch (e) { afterPop = null; return done(); }
  setTimeout(function () { if (afterPop === done) { afterPop = null; done(); } }, 600);
}

/* ------------------------------------------------------------------ avisos rápidos */
function toast(text, opts) {
  opts = opts || {};
  var box = document.getElementById('toasts'); if (!box) return;
  while (box.children.length >= 2) box.removeChild(box.firstChild);
  var el = document.createElement('div');
  el.className = 'toast' + (opts.err ? ' err' : '');
  el.setAttribute('role', opts.err ? 'alert' : 'status');
  el.innerHTML = '<span>' + esc(text) + '</span>' + (opts.action ? '<button type="button">' + esc(opts.action.label) + '</button>' : '');
  box.appendChild(el);
  var gone = false;
  function dismiss() { if (gone) return; gone = true; clearTimeout(t); el.classList.remove('in'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220); }
  if (opts.action) el.querySelector('button').addEventListener('click', function () { dismiss(); opts.action.run(); });
  requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
  var t = setTimeout(dismiss, opts.ms || (opts.action ? 7000 : 3600));
  return dismiss;
}

/* ------------------------------------------------------------------ dados */
var PCOLS = 'id,tipo,secao,categoria,nome,produtor,pais,regiao,estilo,safra,sem_safra,volume_ml,uvas,janela_inicio,janela_fim,avaliacao,pontuacoes,marcador,notas,foto_path';
var GCOLS = 'id,produto_id,local_id,status,observacao,preco_pago,preco_moeda';
var MCOLS = 'id,garrafa_id,tipo,de_local_id,para_local_id,ocorrido_em,criado_em,ocasiao,com_quem,nota,usuario_id';
var ACOLS = 'id,produto_id,campos,antes,depois,usuario_id,criado_em';
function cacheKey(k) { return 'adega.cache.v1.' + (S.me ? S.me.id : 'x') + '.' + k; }
function applyAdegaData(o) {
  D.produtos = new Map(o.produtos.map(function (p) { return [p.id, p]; }));
  D.garrafas = new Map(o.garrafas.map(function (g) { return [g.id, g]; }));
  D.locais = new Map(o.locais.map(function (l) { return [l.id, l]; }));
  D.movs = o.movs || []; D.alts = o.alts || [];
  D.nomes = new Map((o.nomes || []).map(function (n) { return [n.id, n.nome]; }));
  D.membros = o.membros || [];
  derive();
}
function snapshot() {
  store(cacheKey(S.adegaId), { at: S.ui.syncedAt, produtos: Array.from(D.produtos.values()), garrafas: Array.from(D.garrafas.values()), locais: Array.from(D.locais.values()),
    movs: D.movs, alts: D.alts, nomes: Array.from(D.nomes, function (e) { return { id: e[0], nome: e[1] }; }), membros: D.membros });
  store(cacheKey('meta'), { me: S.me, adegas: S.adegas, adegaId: S.adegaId });
}
function loadMe() {
  var s = API.session();
  return Promise.all([API.select('perfis', 'select=id,nome,is_admin&id=eq.' + s.user.id), API.rpc('resumo_adegas', {})]).then(function (r) {
    var p = r[0][0];
    S.me = { id: s.user.id, email: s.user.email, nome: (p && p.nome) || String(s.user.email || '').split('@')[0], is_admin: !!(p && p.is_admin) };
    S.adegas = r[1] || [];
  });
}
function pickAdega() {
  var last = PREF.adega && S.me ? PREF.adega[S.me.id] : null;
  if (last && S.adegas.some(function (a) { return a.id === last; })) return last;
  var withData = S.adegas.filter(function (a) { return a.garrafas > 0; })[0];
  return withData ? withData.id : (S.adegas[0] ? S.adegas[0].id : null);
}
function loadAdega(id) {
  var q = 'adega_id=eq.' + id;
  return Promise.all([
    API.selectAll('produtos', 'select=' + PCOLS + '&' + q + '&order=id.asc'),
    API.selectAll('garrafas', 'select=' + GCOLS + '&' + q + '&order=id.asc'),
    API.selectAll('locais', 'select=id,pai_id,nome,tipo,ordem&' + q + '&order=id.asc'),
    API.select('movimentos', 'select=' + MCOLS + '&' + q + '&order=criado_em.desc&limit=400'),
    API.select('alteracoes', 'select=' + ACOLS + '&' + q + '&order=criado_em.desc&limit=150'),
    API.rpc('nomes_da_adega', { a: id }),
    API.select('membros', 'select=user_id,papel,nome_exibicao&' + q)
  ]).then(function (r) {
    if (id !== S.adegaId) return;
    applyAdegaData({ produtos: r[0], garrafas: r[1], locais: r[2], movs: r[3], alts: r[4], nomes: r[5], membros: r[6] });
    S.ui.syncedAt = new Date().toISOString(); S.ui.offline = false;
    snapshot();
    signPhotos();
  });
}
function refreshResumo() { return API.rpc('resumo_adegas', {}).then(function (r) { S.adegas = r || S.adegas; }).catch(function () {}); }
function sync(silent) {
  if (!S.adegaId || S.ui.syncing) return Promise.resolve();
  S.ui.syncing = true; if (!silent) render();
  return Promise.all([loadAdega(S.adegaId), refreshResumo()]).then(function () { S.ui.syncing = false; render(); if (S.route.name === 'vinho') loadFicha(S.route.id); return true; })
    .catch(function (e) { S.ui.syncing = false; if (e.kind === 'rede') S.ui.offline = true; else if (e.kind === 'sessao') { toLogin(MSG.sessao); return false; } else if (!silent) toast(e.message, { err: true }); render(); return false; });
}
function thumbPath(path) { return String(path).replace(/\.jpe?g$/i, '') + '.p.jpg'; }
function signPhotos() {
  var paths = []; var now = Date.now();
  D.produtos.forEach(function (p) {
    if (!p.foto_path) return;
    [p.foto_path, thumbPath(p.foto_path)].forEach(function (k) { var f = D.fotos[k]; if (!f || f.exp < now + 60000) paths.push(k); });
  });
  if (!paths.length) return;
  var chunks = []; for (var i = 0; i < paths.length; i += 100) chunks.push(paths.slice(i, i + 100));
  Promise.all(chunks.map(function (c) { return API.sign(c).catch(function () { return []; }); })).then(function (all) {
    all.forEach(function (res) { (res || []).forEach(function (r) { D.fotos[r.path] = { url: r.signedURL ? API.signedUrl(r.signedURL) : null, exp: Date.now() + 3500000 }; }); });
    render(); if (S.modal) renderLayer();
  });
}
function fotoUrl(p, small) {
  if (!p || !p.foto_path) return null;
  var t = small && D.fotos[thumbPath(p.foto_path)];
  if (t && t.url) return t.url;
  var f = D.fotos[p.foto_path]; return f ? f.url : null;
}
function loadFicha(id) {
  var p = prod(id); if (!p) return;
  var gids = []; D.garrafas.forEach(function (g) { if (g.produto_id === id) gids.push(g.id); });
  var reqs = [API.select('produtos', 'select=id,extra&id=eq.' + id), API.select('alteracoes', 'select=' + ACOLS + '&produto_id=eq.' + id + '&order=criado_em.desc&limit=50')];
  if (gids.length) reqs.push(API.select('movimentos', 'select=' + MCOLS + '&garrafa_id=in.(' + gids.join(',') + ')&order=criado_em.desc&limit=200'));
  Promise.all(reqs).then(function (r) {
    S.ficha[id] = { extra: (r[0][0] && r[0][0].extra) || {}, alts: r[1] || [], movs: r[2] || [] };
    if (S.route.name === 'vinho' && S.route.id === id) render();
  }).catch(function () {});
}

/* ------------------------------------------------------------------ fluxo de entrada */
function toLogin(msg) {
  API.signOut();
  S.phase = 'login'; S.me = null; S.adegas = []; S.adegaId = null; S.ui.loginErr = msg || null; S.ui.loginBusy = false;
  S.modal = null; closeLayerNow();
  if (history.state && history.state.modal) { try { history.replaceState(null, ''); } catch (e) {} }
  D = { produtos: new Map(), garrafas: new Map(), locais: new Map(), movs: [], alts: [], nomes: new Map(), membros: [], fotos: {} };
  S.ficha = {}; S.ui.chips = {}; S.ui.q = ''; S.navDepth = 0;
  derive();
  transition('fade', render);
}
API.onExpired(function () { if (S.phase === 'app') toLogin(MSG.sessao); });
function enterApp() {
  S.phase = 'loading'; transition('fade', render);
  return loadMe().then(function () {
    S.adegaId = pickAdega();
    if (!S.adegaId) { S.phase = 'noadega'; transition('fade', render); return; }
    return loadAdega(S.adegaId).then(function () {
      S.phase = 'app'; S.route = parseHash();
      transition('fade', function () { render(); window.scrollTo(0, 0); });
      if (S.route.name === 'vinho') loadFicha(S.route.id);
    });
  }).catch(function (e) {
    if (e.kind === 'sessao') return toLogin(MSG.sessao);
    S.phase = 'erro'; S.ui.bootErr = e.message; render();
  });
}
function switchAdega(id) {
  if (id === S.adegaId) { closeModal(); return; }
  leaveModal(function () {
    S.adegaId = id; PREF.adega = PREF.adega || {}; PREF.adega[S.me.id] = id; savePref();
    var snap = store(cacheKey(id));
    S.ui.loadingAdega = !snap; S.ficha = {}; S.ui.chips = {}; S.navDepth = 0;
    applyAdegaData(snap || { produtos: [], garrafas: [], locais: [], movs: [], alts: [], nomes: [], membros: [] });
    if (snap) S.ui.syncedAt = snap.at;
    if (!sameHash('#/')) { navIntent = 'tab'; location.replace('#/'); }
    else transition('fade', function () { closeLayerNow(); render(); window.scrollTo(0, 0); }, true);
    loadAdega(id).then(function () { S.ui.loadingAdega = false; render(); }).catch(function (e) { S.ui.loadingAdega = false; toast(e.message, { err: true }); render(); });
  });
}

/* ------------------------------------------------------------------ peças de interface */
function thumb(p) {
  var u = fotoUrl(p, true);
  if (u) return '<span class="thumb"><img src="' + esc(u) + '" alt="" loading="lazy" decoding="async"></span>';
  var c = STYLE_COLOR[p.estilo] || (p.secao === 'bar' ? '#A97B4F' : '#8C948E');
  var ic = (p.secao === 'bar' && p.tipo !== 'vinho') ? '<path d="M7 4h10l-1.2 15.2a1 1 0 0 1-1 .8H9.2a1 1 0 0 1-1-.8z"/><path d="M7.5 10h9"/>' : '<path d="M7 3h10l-.6 6a4.4 4.4 0 0 1-8.8 0z"/><path d="M12 13.5V20M8.5 21h7"/>';
  return '<span class="thumb" aria-hidden="true"><span class="band" style="background:' + c + '"></span><span class="ic"><svg viewBox="0 0 24 24" style="stroke:' + c + '">' + ic + '</svg></span></span>';
}
function wineRow(id, ctx) {
  var p = prod(id), gs = stock(id), j = janela(p);
  var flag = j.k === 'ultimo' ? ' · <span class="flag">último ano</span>' : (j.k === 'passou' ? ' · <span class="flag late">passou da janela</span>' : '');
  var lab = locLabel(gs, false);
  return '<a class="row" data-k="' + id + '" href="#/v/' + id + '">' + thumb(p) +
    '<span class="info"><span class="nm">' + esc(p.nome) + '</span><span class="meta">' + esc(metaLine(p, ctx)) + flag + '</span>' + (lab ? '<span class="loc">' + esc(lab) + '</span>' : '') + '</span>' +
    '<span class="qty" aria-label="' + plural(gs.length, 'garrafa', 'garrafas') + '">' + gs.length + '</span></a>';
}
function topBar(left, title, sub, right, serif) {
  return '<header class="top" id="top"><div class="top-in wrap">' + left +
    '<div class="ttl">' + (serif ? '<h1>' + esc(title) + '</h1>' : '<span class="hello">' + esc(title) + '</span>') + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</div>' +
    (right || '') + '</div>' + offlineBar() + '</header>';
}
function btnMenu() { return '<button class="ib" type="button" data-a="menu" aria-label="Abrir menu">' + I.menu + '</button>'; }
function btnBack(fb) { return '<button class="ib" type="button" data-a="back" data-x="' + esc(fb || '#/') + '" aria-label="Voltar">' + I.back + '</button>'; }
function btnSearch() { return '<a class="ib" href="#/busca" aria-label="Buscar">' + I.search + '</a>'; }
function offlineBar() {
  if (!S.ui.offline) return '';
  return '<div class="offline" role="status">' + I.wifi + '<span>Sem internet · mostrando os dados ' + (S.ui.syncedAt ? 'de ' + fmtDate(S.ui.syncedAt) + ', ' + fmtTime(S.ui.syncedAt) : 'salvos neste aparelho') + '</span></div>';
}
function seg(name, opts, cur) {
  return '<div class="seg" role="group" aria-label="Ver por">' + opts.map(function (o) { return '<button type="button" data-a="' + name + '" data-x="' + o[0] + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>';
}
function skeletonRows(n) { var s = ''; for (var i = 0; i < n; i++) s += '<div class="sk" style="height:64px;margin-top:8px"></div>'; return s; }
function emptyState(title, text, cta) { return '<div class="empty"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' + (cta || '') + '</div>'; }

/* ------------------------------------------------------------------ telas */
function viewLogin() {
  return '<main class="login wrap"><h1>App Adega</h1>' +
    '<p class="lead">Entre com o e-mail e a senha que você recebeu.</p>' +
    '<form id="login-form" novalidate>' +
    '<label class="fld">E-mail<input id="l-email" name="email" type="email" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false" required></label>' +
    '<label class="fld">Senha<span class="pw"><input id="l-senha" name="senha" type="' + (S.ui.showPw ? 'text' : 'password') + '" autocomplete="current-password" required>' +
    '<button type="button" data-a="togglepw" aria-label="' + (S.ui.showPw ? 'Esconder senha' : 'Mostrar senha') + '">' + (S.ui.showPw ? I.eyeoff : I.eye) + '</button></span></label>' +
    (S.ui.loginErr ? '<p class="err" role="alert">' + esc(S.ui.loginErr) + '</p>' : '') +
    '<button class="btn primary block" type="submit"' + (S.ui.loginBusy ? ' disabled' : '') + '>' + (S.ui.loginBusy ? '<span class="spin" aria-hidden="true"></span>Entrando…' : 'Entrar') + '</button>' +
    '</form><p class="foot">Problemas para entrar? Fale com quem administra a sua adega.</p></main>';
}
function viewLoading() {
  return '<header class="top"><div class="top-in wrap"><div class="sk" style="width:44px;height:44px;border-radius:22px"></div><div class="ttl"><div class="sk" style="width:60%;height:20px"></div><div class="sk" style="width:80%;height:13px;margin-top:6px"></div></div></div></header>' +
    '<main class="wrap content"><div class="sk" style="height:58px;margin-top:6px"></div><div class="tiles"><div class="sk" style="height:70px"></div><div class="sk" style="height:70px"></div><div class="sk" style="height:70px"></div></div>' + skeletonRows(6) + '</main>';
}
function viewMessage(title, text, cta) { return '<main class="wrap login">' + emptyState(title, text, cta) + '</main>'; }

function noticeHtml() {
  var best = null, late = 0;
  X.adega.forEach(function (id) { var p = prod(id), k = janela(p).k; if (k === 'ultimo' && (!best || stock(id).length > stock(best).length)) best = id; if (k === 'passou') late += stock(id).length; });
  if (best) { var p = prod(best), n = stock(best).length; return '<a class="notice" href="#/v/' + best + '">' + I.clock + '<span>' + esc(p.nome) + (p.safra ? ' ' + p.safra : '') + ' está no último ano da janela. ' + (n === 1 ? 'Resta 1 garrafa.' : 'Restam ' + n + ' garrafas.') + '</span><b>Ver</b></a>'; }
  if (late) return '<a class="notice" href="' + hrefGroup('abrir', 'todos') + '">' + I.clock + '<span>' + plural(late, 'garrafa passou', 'garrafas passaram') + ' da janela indicada.</span><b>Ver</b></a>';
  return '';
}
function viewHome() {
  var total = countB(X.adega) + countB(X.bar);
  var a = adegaAtual();
  var head = topBar(btnMenu(), 'Olá, ' + (meuNome() || ''), (a ? a.nome : '') + ' · ' + plural(total, 'garrafa', 'garrafas'), btnSearch());
  if (S.ui.loadingAdega) return head + '<main class="wrap content">' + skeletonRows(7) + '</main>';
  if (!X.adega.length && !X.bar.length) {
    return head + '<main class="wrap content">' + emptyState('Nenhuma garrafa ainda', 'Esta adega ainda não tem garrafas cadastradas. A importação da planilha está pendente.',
      canWrite() ? '<button class="btn primary" type="button" data-a="entrada">Registrar a primeira entrada</button>' : '') + '</main>';
  }
  var ab = X.adega.filter(function (id) { return paraAbrir(prod(id)); });
  var ic = X.adega.filter(function (id) { return prod(id).avaliacao === 'Ícone'; });
  var ap = X.adega.filter(function (id) { return prod(id).avaliacao === 'A+'; });
  var tiles = '<div class="tiles">' +
    '<a class="tile gold" href="' + hrefGroup('abrir', 'todos') + '"><b>' + countB(ab) + '</b><span>Para abrir logo</span></a>' +
    (ic.length ? '<a class="tile" href="' + hrefGroup('avaliacao', 'Ícone') + '"><b>' + countB(ic) + '</b><span>Ícones</span></a>' : '') +
    (ap.length ? '<a class="tile" href="' + hrefGroup('avaliacao', 'A+') + '"><b>' + countB(ap) + '</b><span>A+</span></a>' : '') + '</div>';
  var mode = S.ui.ver;
  var groups = groupsFor(mode, X.adega);
  var list = '<div class="glist">' + groups.map(function (g) {
    return '<a class="grow" data-k="' + esc(mode + ':' + g.key) + '" href="' + hrefGroup(mode, g.key) + '" aria-label="' + esc(g.label + ', ' + plural(g.n, 'garrafa', 'garrafas')) + '">' + (g.color ? '<span class="dot" style="background:' + g.color + '"></span>' : '') +
      '<span class="gt"><span class="gn">' + esc(g.label) + '</span></span>' +
      '<span class="gc">' + nfmt(g.n) + '</span><span class="chev">' + I.chev + '</span></a>';
  }).join('') + '</div>';
  return head + '<main class="wrap content">' + noticeHtml() + (X.adega.length ? tiles : '') +
    '<p class="sect-label">Vinhos · ' + plural(countB(X.adega), 'garrafa', 'garrafas') + '</p>' +
    seg('ver', [['pais', 'País'], ['avaliacao', 'Avaliação'], ['tipo', 'Tipo'], ['local', 'Local']], mode) + (X.adega.length ? list : '<p class="hint" style="padding:16px 4px">Nenhum vinho em estoque.</p>') + '</main>';
}
function viewBar() {
  var a = adegaAtual();
  var head = topBar(btnMenu(), 'Bar e outros', plural(countB(X.bar), 'garrafa', 'garrafas') + ' · ' + plural(X.bar.length, 'item', 'itens'), btnSearch(), true);
  if (!X.bar.length) return head + '<main class="wrap content">' + emptyState('Bar vazio', 'Nenhum destilado ou outro item cadastrado em ' + (a ? a.nome : 'esta adega') + '.', canWrite() ? '<button class="btn primary" type="button" data-a="entrada" data-x="bar">Registrar entrada no bar</button>' : '') + '</main>';
  var mode = S.ui.barVer;
  var groups = groupsFor(mode, X.bar);
  return head + '<main class="wrap content"><p class="sect-label" style="margin-top:14px">Ver por</p>' + seg('barver', [['cat', 'Categoria'], ['local', 'Local']], mode) +
    '<div class="glist">' + groups.map(function (g) {
      return '<a class="grow" data-k="' + esc(mode + ':' + g.key) + '" href="' + hrefGroup(mode, g.key, 'bar') + '" aria-label="' + esc(g.label + ', ' + plural(g.n, 'garrafa', 'garrafas')) + '"><span class="gt"><span class="gn">' + esc(g.label) + '</span></span><span class="gc">' + nfmt(g.n) + '</span><span class="chev">' + I.chev + '</span></a>';
    }).join('') + '</div></main>';
}
function viewGroup(r) {
  var bar = r.secao === 'bar';
  var pool = bar ? X.bar : X.adega;
  var ids = idsInGroup(r.modo, r.chave, pool);
  var title = groupTitle(r.modo, r.chave);
  var head = topBar(btnBack(bar ? '#/bar' : '#/'), title, plural(ids.length, bar ? 'item' : 'rótulo', bar ? 'itens' : 'rótulos') + ' · ' + plural(countB(ids), 'garrafa', 'garrafas'), btnSearch(), true);
  if (!ids.length) return head + '<main class="wrap content">' + emptyState('Nada por aqui', 'Não há garrafas em estoque neste grupo agora.') + '</main>';
  var ck = routeKey(r), chip = S.ui.chips[ck] || 'todos';
  var chips = [['todos', 'Todos · ' + countB(ids)]];
  if (!bar && r.modo !== 'avaliacao') escala().forEach(function (e) { var f = ids.filter(function (id) { return prod(id).avaliacao === e; }); if (f.length) chips.push(['a:' + e, e + ' · ' + countB(f)]); });
  if (!bar && r.modo !== 'tipo') STYLE_ORDER.forEach(function (e) { var f = ids.filter(function (id) { return prod(id).estilo === e; }); if (f.length) chips.push(['t:' + e, STYLE_NAME[e] + ' · ' + countB(f)]); });
  if (!chips.some(function (c) { return c[0] === chip; })) chip = 'todos';
  var shown = ids.filter(function (id) { var p = prod(id); if (chip === 'todos') return true; if (chip.indexOf('a:') === 0) return p.avaliacao === chip.slice(2); if (chip.indexOf('t:') === 0) return p.estilo === chip.slice(2); return true; });
  var sections = [];
  if (r.modo === 'abrir') {
    var ul = shown.filter(function (id) { return janela(prod(id)).k === 'ultimo'; }), ps = shown.filter(function (id) { return janela(prod(id)).k === 'passou'; });
    ps.sort(function (a, b) { return (prod(a).janela_fim || 0) - (prod(b).janela_fim || 0) || cmp(prod(a).nome, prod(b).nome); });
    if (ul.length) sections.push({ t: 'Último ano da janela', ids: sortProducts(ul), gold: true });
    if (ps.length) sections.push({ t: 'Passaram da janela', ids: ps });
  } else if (r.modo === 'pais') {
    groupsFor('tipo', shown).forEach(function (g) { sections.push({ t: g.label, ids: sortProducts(g.ids) }); });
  } else if (r.modo === 'local' && r.chave.charAt(0) === 'n') {
    sections.push({ t: null, ids: shown.slice().sort(function (a, b) { return firstNicho(a) - firstNicho(b) || cmp(prod(a).nome, prod(b).nome); }) });
  } else if (bar || r.modo === 'local') {
    sections.push({ t: null, ids: sortProducts(shown) });
  } else {
    groupsFor('pais', shown).forEach(function (g) { sections.push({ t: g.label, ids: sortProducts(g.ids) }); });
  }
  var ctx = r.modo === 'pais' ? 'pais' : (bar ? 'cat' : '');
  var body = sections.map(function (s) {
    return (s.t ? '<div class="sub-h" data-k="h:' + esc(s.t) + '"><h2 class="' + (s.gold ? 'gold' : '') + '">' + esc(s.t) + '</h2><span>' + plural(countB(s.ids), 'garrafa', 'garrafas') + '</span></div>' : '<div style="height:10px"></div>') +
      '<div class="list" data-k="l:' + esc(s.t || '') + '">' + s.ids.map(function (id) { return wineRow(id, ctx); }).join('') + '</div>';
  }).join('');
  return head + '<main class="wrap content">' + (chips.length > 2 ? '<div class="chips" role="group" aria-label="Filtros">' + chips.map(function (c) { return '<button class="chip" type="button" data-a="chip" data-x="' + esc(c[0]) + '" data-ck="' + esc(ck) + '" aria-pressed="' + (chip === c[0]) + '">' + esc(c[1]) + '</button>'; }).join('') + '</div>' : '') + body + '</main>';
}
function feedIcon(t) {
  if (t === 'consumo') return '<span class="ico c">' + I.glass + '</span>';
  if (t === 'entrada') return '<span class="ico e">' + I.plus + '</span>';
  if (t === 'desfeito') return '<span class="ico">' + I.undo + '</span>';
  if (t === 'mudanca_local') return '<span class="ico mv">' + I.move + '</span>';
  return '<span class="ico">' + I.edit + '</span>';
}
var CAMPO_NOME = { nome: 'nome', produtor: 'produtor', pais: 'país', regiao: 'região', estilo: 'tipo', categoria: 'categoria', safra: 'safra', sem_safra: 'safra', volume_ml: 'volume', janela_inicio: 'janela', janela_fim: 'janela', avaliacao: 'avaliação', notas: 'notas', foto_path: 'foto', marcador: 'marcador' };
function feedItems(movs, alts, opts) {
  opts = opts || {};
  var items = [];
  var gp = function (gid) { var g = D.garrafas.get(gid); return g ? g.produto_id : null; };
  var lastKey = null, last = null;
  movs.forEach(function (m) {
    if (m.nota === NOTA_IMPORT && !opts.withImport) return;
    var pid = gp(m.garrafa_id); if (!pid) return;
    var tipo = (m.tipo === 'entrada' && /desfeito/i.test(m.nota || '')) || (m.tipo === 'mudanca_local' && /desfeita/i.test(m.nota || '')) ? 'desfeito' : m.tipo;
    var key = m.nota === NOTA_IMPORT ? 'imp|' + pid : [tipo, pid, m.usuario_id, (m.criado_em || '').slice(0, 16), m.nota || ''].join('|');
    if (tipo === 'entrada' && key === lastKey) { last.n++; if (m.para_local_id) last.paras.push(m.para_local_id); return; }
    last = { kind: 'mov', tipo: tipo, m: m, pid: pid, n: 1, at: m.criado_em, paras: m.para_local_id ? [m.para_local_id] : [], legado: m.nota === NOTA_LEGADO, imp: m.nota === NOTA_IMPORT };
    items.push(last); lastKey = key;
  });
  alts.forEach(function (a) { items.push({ kind: 'alt', a: a, pid: a.produto_id, at: a.criado_em }); });
  items.sort(function (x, y) { if (!!x.legado !== !!y.legado) return x.legado ? 1 : -1; return x.at < y.at ? 1 : x.at > y.at ? -1 : 0; });
  return items;
}
function feedHtml(items, showName) {
  var html = '', curDay = null;
  items.forEach(function (it, idx) {
    var p = prod(it.pid); if (!p) return;
    var dl = it.legado ? 'Planilha antiga, sem data' : dayLabel(it.at);
    if (showName && dl !== curDay) { html += '<div class="day" data-k="d:' + esc(dl) + idx + '">' + esc(dl) + '</div>'; curDay = dl; }
    var nm = showName ? '<b>' + esc(p.nome) + (p.safra ? ' ' + p.safra : '') + '</b> · ' : '';
    var t, meta = [], who, noAuthor = it.legado || it.imp;
    var when = it.legado ? (showName ? '' : 'sem data') : (showName ? fmtTime(it.at) : fmtDate(it.at));
    if (it.kind === 'alt') {
      var cs = []; (it.a.campos || []).forEach(function (c) { var n = CAMPO_NOME[c] || c; if (cs.indexOf(n) < 0) cs.push(n); });
      t = nm + 'Edição: ' + esc(cs.join(', ')); who = it.a.usuario_id;
    } else {
      var m = it.m; who = m.usuario_id;
      var deL = m.de_local_id ? D.locais.get(m.de_local_id) : null, paraL = m.para_local_id ? D.locais.get(m.para_local_id) : null;
      if (it.tipo === 'consumo') {
        t = nm + 'Garrafa aberta';
        if (deL) meta.push('saiu ' + deLoc(deL));
        if (m.ocasiao) meta.push(m.ocasiao);
        if (m.com_quem) meta.push('com ' + m.com_quem);
        if (it.legado) meta.push('registrado na planilha antiga');
        else if (m.nota) meta.push('“' + m.nota + '”');
        if (!it.legado && m.ocorrido_em && m.criado_em && m.ocorrido_em.slice(0, 10) !== m.criado_em.slice(0, 10)) meta.push('aberta em ' + fmtDate(m.ocorrido_em));
      }
      else if (it.tipo === 'desfeito') { t = nm + (m.tipo === 'entrada' ? 'Consumo desfeito' : 'Mudança desfeita'); if (paraL) meta.push('voltou ' + paraLoc(paraL)); }
      else if (it.tipo === 'entrada') {
        t = nm + (it.imp ? 'Importação da planilha' : 'Entrada de ' + plural(it.n, 'garrafa', 'garrafas'));
        if (it.imp) meta.push(plural(it.n, 'garrafa', 'garrafas'));
        if (it.paras.length) meta.push(locIdsLabel(it.paras));
      }
      else if (it.tipo === 'mudanca_local') { t = nm + 'Mudou de lugar'; meta.push((deL ? locName(deL) : 'Sem local') + ' → ' + (paraL ? locName(paraL) : 'sem local')); }
      else t = nm + it.tipo;
    }
    if (!noAuthor) meta.push('por ' + nomeUsuario(who));
    var tag = showName ? 'a' : 'div';
    html += '<' + tag + ' class="fi" data-k="f:' + (it.kind === 'alt' ? it.a.id : it.m.id) + '"' + (showName ? ' href="#/v/' + it.pid + '"' : '') + '>' + feedIcon(it.kind === 'alt' ? 'edit' : it.tipo) + '<span class="t">' + t + '</span><span class="d">' + esc(when) + '</span><span class="m">' + esc(meta.join(' · ')) + '</span></' + tag + '>';
  });
  return html;
}
function winLabel(pos, txt, cls) {
  var tx = pos < 8 ? '0' : pos > 92 ? '-100%' : '-50%';
  return '<span' + (cls ? ' class="' + cls + '"' : '') + ' style="left:' + pos.toFixed(1) + '%;transform:translateX(' + tx + ')">' + esc(txt) + '</span>';
}
function viewFicha(id) {
  var p = prod(id);
  if (!p) return topBar(btnBack('#/'), 'Não encontrado', '', '', true) + '<main class="wrap content">' + emptyState('Item não encontrado', 'Ele pode ter sido removido ou pertence a outra adega.') + '</main>';
  var gs = stock(id), j = janela(p), fx = S.ficha[id];
  var write = canWrite();
  var rating = p.avaliacao ? '<span class="badge ' + (p.avaliacao === 'Ícone' || p.avaliacao === 'A+' ? 'gold' : '') + '">' + esc(p.avaliacao) + '</span>' : '';
  var line2 = [p.produtor, [p.regiao, p.pais].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  var line3 = [safra(p), p.secao === 'bar' ? p.categoria : STYLE_ONE[p.estilo], p.volume_ml ? (p.volume_ml >= 1000 ? (p.volume_ml / 1000).toLocaleString('pt-BR') + ' L' : p.volume_ml + ' ml') : ''].filter(Boolean).join(' · ');
  var u = fotoUrl(p), c = STYLE_COLOR[p.estilo] || '#8C948E';
  var photo = '<button class="photo" type="button" data-a="foto" data-x="' + id + '" aria-label="' + (u ? 'Ampliar foto' : 'Foto da garrafa') + '">' +
    (u ? '<img src="' + esc(u) + '" alt="Foto da garrafa">' : '<span class="band" style="background:' + c + '"></span>' + I.img + '<span>' + (write ? 'Adicionar foto' : 'Sem foto') + '</span>') + '</button>';
  var groups = locGroups(gs);
  var slots = gs.length ? '<div class="slots">' + groups.map(function (g) { var L = g.L; var nm = !L ? 'Sem local' : (isNicho(L) ? pad(nichoNum(L)) : L.nome); return '<span class="slot">' + esc(nm) + (g.gs.length > 1 ? '<small>×' + g.gs.length + '</small>' : '') + '</span>'; }).join('') + '</div>' : '<p>Nenhuma garrafa em estoque.</p>';
  var obs = gs.filter(function (g) { return g.observacao; }).map(function (g) { return slotName(g) + ': ' + g.observacao; });
  var win = '';
  if (j.k !== 'na') {
    var bar = '';
    if (p.janela_inicio && p.janela_fim && p.janela_fim > p.janela_inicio) {
      var lo = Math.min(p.janela_inicio, YEAR) - 1, hi = Math.max(p.janela_fim, YEAR) + 1, span = hi - lo;
      var f0 = (p.janela_inicio - lo) / span * 100, f1 = (p.janela_fim - lo) / span * 100, nw = (YEAR - lo) / span * 100;
      bar = '<div class="win" role="img" aria-label="' + esc('Janela de ' + p.janela_inicio + ' a ' + p.janela_fim + '; hoje é ' + YEAR) + '"><div class="wl">' + winLabel(nw, 'hoje', 'now-l') + '</div>' +
        '<div class="track"><span class="fill" style="left:' + f0.toFixed(1) + '%;width:' + (f1 - f0).toFixed(1) + '%;background:' + (j.k === 'passou' ? 'var(--wine)' : j.k === 'ultimo' ? 'var(--gold)' : j.k === 'guardar' ? 'var(--blue)' : 'var(--ok)') + '"></span><span class="now" style="left:' + nw.toFixed(1) + '%"></span></div>' +
        '<div class="wl">' + (f1 - f0 < 16 ? winLabel((f0 + f1) / 2, p.janela_inicio + '–' + p.janela_fim) : winLabel(f0, p.janela_inicio) + winLabel(f1, p.janela_fim)) + '</div></div>';
    }
    var col = j.k === 'passou' ? 'var(--wine-fg)' : j.k === 'ultimo' ? 'var(--gold-fg)' : 'var(--muted)';
    win = '<section class="sec"><div class="sec-h"><h2>Janela de consumo</h2><span style="font-size:13.5px;color:' + col + '">' + esc(j.t) + '</span></div>' + bar +
      (!p.janela_inicio && !p.janela_fim ? '<p>' + (fx && fx.extra && fx.extra.guarda_original ? 'Na planilha: “' + esc(fx.extra.guarda_original) + '”. ' : '') + 'Sem janela cadastrada.' + (write ? ' Dá para informar em Editar.' : '') + '</p>' : (!p.janela_inicio ? '<p>Início da janela não informado.</p>' : '')) + '</section>';
  }
  var sc = (p.pontuacoes || []).map(function (x) { return esc(x.nota + ' · ' + (x.fonte || x.sigla || '')); }).join('<br>');
  var precos = gs.filter(function (g) { return g.preco_pago != null; }).map(function (g) { return money(g.preco_pago, g.preco_moeda); });
  var kv = '<div class="kv">' +
    '<div><span>Pontuação</span>' + (sc || '<em>não informada</em>') + '</div>' +
    '<div><span>Preço pago</span>' + (precos.length ? esc(precos[0]) + ' por garrafa' : '<em>não informado</em>') + '</div>' +
    (p.uvas && p.uvas.length ? '<div class="full"><span>Uvas</span>' + esc(p.uvas.join(', ')) + '</div>' : '') +
    (p.notas ? '<div class="full"><span>Notas</span>' + esc(p.notas) + '</div>' : '') +
    (obs.length ? '<div class="full"><span>Observações</span>' + esc(obs.join(' · ')) + '</div>' : '') +
    (p.marcador ? '<div class="full"><span>Marcador da planilha</span>' + esc(p.marcador) + '</div>' : '') +
    (fx && fx.extra && fx.extra.safra_original ? '<div class="full"><span>Safra na planilha</span>' + esc(fx.extra.safra_original) + '</div>' : '') + '</div>';
  var movs = fx ? fx.movs : D.movs.filter(function (m) { var g = D.garrafas.get(m.garrafa_id); return g && g.produto_id === id; });
  var alts = fx ? fx.alts : D.alts.filter(function (a) { return a.produto_id === id; });
  var items = feedItems(movs, alts, { withImport: true });
  var hist = items.length ? '<div class="feed">' + feedHtml(items, false) + '</div>' : (fx ? '<p>Nenhum registro ainda.</p>' : '<div class="sk" style="height:48px"></div>');
  var right = write ? '<button class="pill" type="button" data-a="editar" data-x="' + id + '">' + I.edit + 'Editar</button>' : '';
  var actions = fichaActions(id);
  return '<header class="top" id="top"><div class="top-in wrap">' + btnBack(p.secao === 'bar' ? '#/bar' : '#/') + '<div class="ttl"><span class="h1" aria-hidden="true">' + esc(p.nome) + (p.safra ? ' ' + p.safra : '') + '</span></div>' + right + '</div>' + offlineBar() + '</header>' +
    '<main class="wrap content' + (actions ? ' has-actions' : '') + '"><section class="hero">' + photo + '<div class="info">' + rating + '<h1>' + esc(p.nome) + '</h1>' + (line2 ? '<p class="m">' + esc(line2) + '</p>' : '') + '<p>' + esc(line3) + '</p></div></section>' +
    '<section class="sec"><div class="sec-h"><h2>' + plural(gs.length, 'garrafa', 'garrafas') + (gs.length ? ' · ' + esc(locLabel(gs, true)) : '') + '</h2>' + (write ? '<button class="link" type="button" data-a="adicionar" data-x="' + id + '">+ Adicionar</button>' : '') + '</div>' + slots + '</section>' +
    win + '<section class="sec">' + kv + '</section>' +
    '<section class="sec"><h2>Histórico</h2>' + hist + '</section>' +
    (!canWrite() ? '<p class="hint" style="padding:8px 0 24px">Seu acesso é somente de consulta.</p>' : '') + '</main>';
}
function fichaActions(id) {
  var p = prod(id);
  if (!p || !canWrite() || !stock(id).length) return '';
  return '<div class="actions"><button class="btn primary" type="button" data-a="consumir" data-x="' + id + '">Abrir uma garrafa</button><button class="btn" type="button" data-a="mover" data-x="' + id + '">Mover</button></div>';
}
function viewBusca() {
  var q = norm(S.ui.q).trim();
  var head = '<header class="top" id="top"><div class="top-in wrap"><label class="search">' + I.search + '<span class="sr">Buscar na adega</span><input id="q" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Vinho, produtor, nicho, nota…" value="' + esc(S.ui.q) + '"></label><button class="pill" type="button" style="border:0;background:none;padding:0 4px" data-a="back" data-x="#/">Cancelar</button></div>' + offlineBar() + '</header>';
  var body;
  if (!q) {
    var all = X.adega.concat(X.bar), nsl = 0, ret = null, nret = 0;
    D.locais.forEach(function (L) { if (/^retirada/i.test(L.nome)) ret = L; });
    D.garrafas.forEach(function (g) { if (g.status !== 'em_estoque') return; if (!g.local_id) nsl++; if (ret && g.local_id === ret.id) nret++; });
    var recent = (PREF.buscas || []).slice(0, 5);
    body = '<p class="hint" style="margin:4px 0 16px">Busca em tudo: nome, produtor, região, país, tipo, safra, nicho, local, notas e ocasiões de consumo.</p>' +
      '<p class="sect-label" style="margin-top:0">Atalhos</p><div class="tiles" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
      '<a class="tile gold" href="' + hrefGroup('abrir', 'todos') + '"><b>' + countB(X.adega.filter(function (id) { return paraAbrir(prod(id)); })) + '</b><span>Para abrir logo</span></a>' +
      (ret ? '<a class="tile" href="' + hrefGroup('local', 'a:' + ret.id) + '"><b>' + nret + '</b><span>' + esc(ret.nome) + '</span></a>' : '') +
      '<a class="tile" href="' + hrefGroup('local', 'none') + '"><b>' + nsl + '</b><span>Sem local</span></a>' +
      '<a class="tile" href="#/historico"><b>' + I.clock + '</b><span>Histórico</span></a></div>' +
      (recent.length ? '<p class="sect-label">Buscas recentes</p>' + recent.map(function (s) { return '<button class="res" type="button" data-a="try" data-x="' + esc(s) + '" style="grid-template-columns:1fr"><span class="meta" style="font-size:15px;color:var(--fg)">' + esc(s) + '</span></button>'; }).join('') : '');
  } else {
    var res = [], qn = q.replace(/^nicho\s*/, ''), isNum = /^\d{1,4}$/.test(qn);
    var ocas = new Map(); D.movs.forEach(function (m) { if (m.ocasiao || m.com_quem || (m.nota && m.nota !== NOTA_IMPORT)) { var g = D.garrafas.get(m.garrafa_id); if (g) { var t = norm([m.ocasiao, m.com_quem, m.nota].join(' ')); ocas.set(g.produto_id, (ocas.get(g.produto_id) || '') + ' ' + t); } } });
    D.produtos.forEach(function (p) {
      var gs = stock(p.id), hit = null;
      if (isNum) {
        var n = parseInt(qn, 10);
        if (gs.some(function (g) { var L = locOf(g); return isNicho(L) && nichoNum(L) === n; })) hit = 'nicho';
        else if (qn.length === 4 && p.safra === n) hit = 'safra';
      }
      if (!hit) {
        var f = [['nome', p.nome], ['produtor', p.produtor], ['região', p.regiao], ['país', p.pais], ['tipo', STYLE_ONE[p.estilo] || p.categoria], ['categoria', p.categoria], ['notas', p.notas]];
        for (var k = 0; k < f.length; k++) if (f[k][1] && norm(f[k][1]).indexOf(q) >= 0) { hit = f[k][0]; break; }
      }
      if (!hit && gs.some(function (g) { var L = locOf(g); return L && !isNicho(L) && norm(L.nome).indexOf(q) >= 0; })) hit = 'local';
      if (!hit && (ocas.get(p.id) || '').indexOf(q) >= 0) hit = 'histórico';
      if (hit && (gs.length || hit === 'histórico')) res.push({ id: p.id, h: hit, n: gs.length });
    });
    res.sort(function (a, b) { return ((b.n > 0) - (a.n > 0)) || cmp(prod(a.id).nome, prod(b.id).nome) || (prod(a.id).safra || 0) - (prod(b.id).safra || 0); });
    var tot = res.reduce(function (s, r) { return s + r.n; }, 0);
    body = res.length ? '<p class="sect-label" style="margin-top:4px">' + plural(res.length, 'resultado', 'resultados') + ' · ' + plural(tot, 'garrafa', 'garrafas') + '</p>' + res.slice(0, 80).map(function (r) {
      var p = prod(r.id), gs = stock(r.id);
      return '<a class="res" data-k="r:' + r.id + '" href="#/v/' + r.id + '" data-a="savequery"><span class="nm">' + esc(p.nome) + (safra(p) ? ' <span>' + esc(safra(p)) + '</span>' : '') + '</span><span class="q">' + r.n + '</span><span class="meta">' + esc([p.avaliacao, gs.length ? locLabel(gs, true) : 'sem estoque'].filter(Boolean).join(' · ')) + ' · <mark>' + esc(r.h) + '</mark></span></a>';
    }).join('') + (res.length > 80 ? '<p class="hint">Mostrando 80 de ' + res.length + '. Refine a busca.</p>' : '')
      : emptyState('Nada encontrado', 'Nada para “' + S.ui.q + '”. Tente o produtor, a região ou o número do nicho.');
  }
  return head + '<main class="wrap content">' + body + '</main>';
}
function viewPainel() {
  var A = X.adega, B = X.bar, nA = countB(A), nB = countB(B);
  var ic = A.filter(function (id) { return prod(id).avaliacao === 'Ícone'; }), ap = A.filter(function (id) { return prod(id).avaliacao === 'A+'; });
  var head = topBar(btnMenu(), 'Painel', (adegaAtual() || {}).nome, '', true);
  var w = { ponto: 0, ultimo: 0, passou: 0, guardar: 0, sem: 0 };
  A.forEach(function (id) { var k = janela(prod(id)).k; if (w[k] != null) w[k] += stock(id).length; });
  var segs = [['ponto', 'var(--ok)', 'no ponto'], ['ultimo', 'var(--gold)', 'último ano'], ['passou', 'var(--wine)', 'passaram'], ['guardar', 'var(--blue)', 'a guardar'], ['sem', 'var(--line2)', 'sem janela']];
  var stackH = segs.map(function (s) { return w[s[0]] ? '<span style="flex:' + w[s[0]] + ';background:' + s[1] + '"></span>' : ''; }).join('');
  var leg = segs.map(function (s) { return w[s[0]] ? '<span><i class="dot" style="background:' + s[1] + '"></i><b>' + w[s[0]] + '</b> ' + s[2] + '</span>' : ''; }).join('');
  var gp = groupsFor('pais', A).sort(function (a, b) { return b.n - a.n; }).slice(0, 8), mx = gp.length ? gp[0].n : 1;
  var bars = gp.map(function (g) { return '<a href="' + hrefGroup('pais', g.key) + '" style="display:contents"><span>' + esc(g.label) + '</span><span class="t"><i style="width:' + (100 * g.n / mx).toFixed(1) + '%"></i></span><span class="n"><b>' + g.n + '</b> · ' + Math.round(100 * g.n / (nA || 1)) + '%</span></a>'; }).join('');
  var cons = feedItems(D.movs.filter(function (m) { return m.tipo === 'consumo'; }), []).slice(0, 5);
  return head + '<main class="wrap content"><div class="cards">' +
    '<div class="card"><span class="k">Total</span><span class="v">' + nfmt(nA + nB) + '</span><span class="s">garrafas em estoque</span></div>' +
    '<a class="card" href="#/" data-a="tab" data-x="#/"><span class="k" style="color:var(--wine-fg)">Vinhos</span><span class="v">' + nfmt(nA) + '</span><span class="s">' + plural(A.length, 'rótulo', 'rótulos') + '</span></a>' +
    '<a class="card" href="#/bar" data-a="tab" data-x="#/bar"><span class="k">Bar e outros</span><span class="v">' + nfmt(nB) + '</span><span class="s">' + plural(B.length, 'item', 'itens') + '</span></a>' +
    '<a class="card gold" href="' + hrefGroup('avaliacao', 'Ícone') + '"><span class="k">Ícone e A+</span><span class="v">' + nfmt(countB(ic) + countB(ap)) + '</span><span class="s">' + ic.length + ' Ícones · ' + ap.length + ' A+</span></a></div>' +
    (nA ? '<section class="panel"><h2>Janela de consumo em ' + YEAR + '<small>garrafas de vinho</small></h2><div class="stack" role="img" aria-label="Garrafas por situação da janela de consumo">' + stackH + '</div><div class="legend">' + leg + '</div></section>' +
    '<section class="panel"><h2>Vinhos por país<small>garrafas</small></h2><div class="bars">' + bars + '</div></section>' : '') +
    '<section class="panel"><h2>Últimos consumos<a class="link" href="#/historico">Ver histórico</a></h2>' + (cons.length ? '<div class="feed">' + feedHtml(cons, true) + '</div>' : '<p class="hint">Nenhum consumo registrado ainda. Na ficha de um vinho, toque em “Abrir uma garrafa”.</p>') + '</section>' +
    '<p class="hint" style="padding:16px 2px 0">Dados de ' + (S.ui.syncedAt ? fmtDate(S.ui.syncedAt) + ', ' + fmtTime(S.ui.syncedAt) : '—') + '.</p></main>';
}
function viewHistorico() {
  var head = topBar(btnBack('#/painel'), 'Histórico', (adegaAtual() || {}).nome, '', true);
  var items = feedItems(D.movs, D.alts);
  return head + '<main class="wrap content">' + (items.length ? '<div class="feed">' + feedHtml(items, true) + '</div>' : emptyState('Sem registros ainda', 'Consumos, entradas, mudanças de lugar e edições aparecem aqui, com data e autor.')) +
    '<p class="hint" style="padding:18px 0 0">A base inicial veio da planilha AppSheet. Cada registro novo mostra data, hora e quem fez.</p></main>';
}

/* ------------------------------------------------------------------ menu e folhas */
function sheetOpen(label) { return '<div class="layer sheet-layer"><div class="scrim" data-a="close"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(label) + '" tabindex="-1" data-panel><span class="grab" aria-hidden="true"></span>'; }
var SHEET_END = '</section></div>';
function sheetHd(t, serif) { return '<div class="hd"><h2' + (serif ? ' class="serif"' : '') + '>' + esc(t) + '</h2><button class="ib ghost" type="button" data-a="close" aria-label="Fechar">' + I.close + '</button></div>'; }
function summary(p, meta) { return '<div class="summary">' + thumb(p) + '<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span class="nm">' + esc(p.nome) + '</span><span class="meta">' + esc(meta) + '</span></span></div>'; }
function busyBtn(action, label, busyLabel, cls) { var b = S.busy === action; return '<button class="btn primary block ' + (cls || '') + '" type="button" data-a="' + action + '"' + (b ? ' disabled' : '') + '>' + (b ? '<span class="spin" aria-hidden="true"></span>' + esc(busyLabel) : esc(label)) + '</button>'; }
function field(label, name, val, attrs) { return '<label class="fld">' + esc(label) + '<input data-f="' + name + '" value="' + esc(val == null ? '' : val) + '" ' + (attrs || '') + '></label>'; }
function errLine(m) { return m.err ? '<p class="err" role="alert">' + esc(m.err) + '</p>' : ''; }
function pickRow(action, opts, cur) { return '<div class="pick">' + opts.map(function (o) { return '<button type="button" data-a="' + action + '" data-x="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }

function modalHtml(m) {
  var p = m.pid ? prod(m.pid) : null, d = m.draft;
  if (m.kind === 'menu') return menuHtml();
  if (m.kind === 'foto') return fotoHtml(m);
  if (m.kind === 'consumir') {
    var gs = stock(m.pid), groups = locGroups(gs);
    if (!d.loc && groups.length === 1) d.loc = groups[0].key;
    if (m.step === 'conf') {
      var grp = groups.filter(function (g) { return g.key === d.loc; })[0];
      var rest = gs.length - 1;
      return sheetOpen('Confirmar consumo') + '<h2>Confirmar consumo?</h2><p class="lead">A garrafa sai do estoque e o registro entra no histórico da adega.</p>' +
        summary(p, [safra(p), grp ? 'sai ' + deLoc(grp.L) : '', rest === 0 ? 'última garrafa' : rest === 1 ? 'resta 1' : 'restam ' + rest].filter(Boolean).join(' · ')) +
        '<dl class="conf"><dt>Data</dt><dd>' + esc(fmtDate((d.data || todayISO()) + 'T12:00:00')) + '</dd><dt>Ocasião</dt><dd>' + (esc(d.oc) || '—') + '</dd><dt>Com quem</dt><dd>' + (esc(d.cq) || '—') + '</dd><dt>Como estava</dt><dd>' + (esc(d.nota) || '—') + '</dd><dt>Registrado por</dt><dd>' + esc(meuNome()) + '</dd></dl>' +
        errLine(m) + '<div class="stack-btn">' + busyBtn('doconsumir', 'Confirmar consumo', 'Registrando…') + '<button class="btn block" type="button" data-a="step" data-x="form">Voltar e corrigir</button></div>' + SHEET_END;
    }
    return sheetOpen('Abrir uma garrafa') + sheetHd('Abrir uma garrafa') + summary(p, [safra(p), plural(gs.length, 'garrafa', 'garrafas') + ' em estoque'].filter(Boolean).join(' · ')) +
      '<div class="fld"><span>De onde sai?</span>' + pickRow('pickloc', groups.map(function (g) { return [g.key, locName(g.L) + (g.gs.length > 1 ? ' · ' + g.gs.length : '')]; }), d.loc) + '</div>' +
      '<label class="fld">Data<input type="date" data-f="data" max="' + todayISO() + '" value="' + esc(d.data || todayISO()) + '"></label>' +
      field('Ocasião', 'oc', d.oc, 'maxlength="80" placeholder="Jantar, aniversário, presente…" autocapitalize="sentences"') +
      field('Com quem', 'cq', d.cq, 'maxlength="80" placeholder="Opcional"') +
      '<label class="fld">Como estava<textarea data-f="nota" rows="2" maxlength="280" placeholder="Uma linha basta">' + esc(d.nota || '') + '</textarea></label>' +
      errLine(m) + '<button class="btn primary block" type="button" data-a="revisar">Revisar</button>' + SHEET_END;
  }
  if (m.kind === 'mover') {
    var gs2 = stock(m.pid), g2 = locGroups(gs2);
    if (!d.loc && g2.length === 1) d.loc = g2[0].key;
    if (m.step === 'conf') {
      var from = g2.filter(function (g) { return g.key === d.loc; })[0];
      return sheetOpen('Confirmar mudança') + '<h2>Confirmar mudança?</h2><p class="lead">O novo endereço vale a partir de agora e fica no histórico.</p>' + summary(p, safra(p)) +
        '<dl class="conf"><dt>Sai de</dt><dd>' + esc(from ? locName(from.L) : '—') + '</dd><dt>Vai para</dt><dd><b>' + esc(m.destLabel) + '</b></dd><dt>Registrado por</dt><dd>' + esc(meuNome()) + '</dd></dl>' +
        errLine(m) + '<div class="stack-btn">' + busyBtn('domover', 'Confirmar mudança', 'Salvando…') + '<button class="btn block" type="button" data-a="step" data-x="form">Voltar e corrigir</button></div>' + SHEET_END;
    }
    var ar = areas();
    return sheetOpen('Mover garrafa') + sheetHd('Mover garrafa') + summary(p, safra(p)) +
      '<div class="fld"><span>Qual garrafa?</span>' + pickRow('pickloc', g2.map(function (g) { return [g.key, locName(g.L) + (g.gs.length > 1 ? ' · ' + g.gs.length : '')]; }), d.loc) + '</div>' +
      field('Para o nicho', 'nicho', d.nicho, 'inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="Número do nicho"') +
      (ar.length ? '<div class="fld"><span>Ou para uma área</span>' + pickRow('pickarea', ar.map(function (L) { return [L.id, L.nome]; }), d.area) + '</div>' : '') +
      (freeNichos(4).length ? '<p class="note">Nichos livres: ' + freeNichos(4).map(pad).join(', ') + '</p>' : '') +
      errLine(m) + '<button class="btn primary block" type="button" data-a="revisar">Revisar</button>' + SHEET_END;
  }
  if (m.kind === 'editar') {
    if (m.step === 'conf') {
      return sheetOpen('Salvar alterações') + '<h2>Salvar alterações?</h2>' + summary(p, safra(p)) +
        '<dl class="conf">' + m.changes.map(function (c) { return '<dt>' + esc(c[0]) + '</dt><dd>' + esc(c[1] == null || c[1] === '' ? '—' : c[1]) + ' → <b>' + esc(c[2] == null || c[2] === '' ? '—' : c[2]) + '</b></dd>'; }).join('') + '</dl>' +
        errLine(m) + '<div class="stack-btn">' + busyBtn('doeditar', 'Salvar alterações', 'Salvando…') + '<button class="btn block" type="button" data-a="step" data-x="form">Voltar e corrigir</button></div>' + SHEET_END;
    }
    var vinho = p.secao !== 'bar';
    return sheetOpen('Editar') + sheetHd('Editar') + summary(p, safra(p)) +
      (vinho ? '<div class="fld"><span>Avaliação</span>' + pickRow('pickrate', escala().map(function (e) { return [e, e]; }), d.avaliacao) + '</div>' +
        '<div class="grid2">' + field('Beber a partir de', 'janela_inicio', d.janela_inicio, 'inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="Ano"') + field('Beber até', 'janela_fim', d.janela_fim, 'inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="Ano"') + '</div>' : '') +
      '<label class="fld">Notas<textarea data-f="notas" rows="3" maxlength="600" placeholder="Observações da adega">' + esc(d.notas || '') + '</textarea></label>' +
      (m.more ? field('Nome', 'nome', d.nome, 'maxlength="140"') + '<div class="grid-ns">' + field('Produtor', 'produtor', d.produtor, 'maxlength="100"') + field('Safra', 'safra', d.safra, 'inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="NV"') + '</div>' +
        '<div class="grid2">' + field('País', 'pais', d.pais, 'maxlength="50"') + field('Região', 'regiao', d.regiao, 'maxlength="80"') + '</div>' +
        (vinho ? '<div class="fld"><span>Tipo</span>' + pickRow('pickstyle', STYLE_ORDER.map(function (s) { return [s, STYLE_ONE[s]]; }), d.estilo) + '</div>' : field('Categoria', 'categoria', d.categoria, 'maxlength="50"'))
        : '<button class="link" type="button" data-a="more" style="align-self:flex-start">Editar nome, produtor, safra e origem</button>') +
      errLine(m) + '<button class="btn primary block" type="button" data-a="revisar">Revisar</button>' + SHEET_END;
  }
  if (m.kind === 'entrada' || m.kind === 'adicionar') {
    var add = m.kind === 'adicionar', bar = add ? (p.secao === 'bar') : !!d.bar;
    if (m.step === 'conf') {
      return sheetOpen('Confirmar entrada') + '<h2>Confirmar entrada?</h2>' + (add ? summary(p, safra(p)) : '') +
        '<dl class="conf">' + (add ? '' : '<dt>' + (bar ? 'Item' : 'Vinho') + '</dt><dd>' + esc(d.nome) + '</dd><dt>Produtor</dt><dd>' + (esc(d.produtor) || '—') + '</dd><dt>Safra</dt><dd>' + (esc(d.safra) || 'NV') + '</dd>' +
          (bar ? '<dt>Categoria</dt><dd>' + (esc(d.categoria) || '—') + '</dd>' : '<dt>Tipo</dt><dd>' + esc(STYLE_ONE[d.estilo] || '—') + '</dd><dt>Avaliação</dt><dd>' + (esc(d.avaliacao) || '—') + '</dd>') +
          ((d.pais || d.regiao) ? '<dt>Origem</dt><dd>' + esc([d.regiao, d.pais].filter(Boolean).join(', ')) + '</dd>' : '')) +
        '<dt>Garrafas</dt><dd>' + (d.qtd || 1) + '</dd><dt>Onde</dt><dd><b>' + esc(m.destLabel) + '</b></dd>' + (d.preco ? '<dt>Preço pago</dt><dd>' + esc(money(d.preco, d.moeda || 'USD')) + ' por garrafa</dd>' : '') +
        '<dt>Registrado por</dt><dd>' + esc(meuNome()) + '</dd></dl>' +
        errLine(m) + '<div class="stack-btn">' + busyBtn('doentrada', 'Guardar ' + plural(d.qtd || 1, 'garrafa', 'garrafas'), 'Guardando…') + '<button class="btn block" type="button" data-a="step" data-x="form">Voltar e corrigir</button></div>' + SHEET_END;
    }
    var ar2 = areas(), livres = freeNichos(4);
    var cats = []; if (bar && !add) { var cc = {}; X.bar.forEach(function (id) { var c = prod(id).categoria; if (c) cc[c] = (cc[c] || 0) + 1; }); cats = Object.keys(cc).sort(function (a, b) { return cc[b] - cc[a]; }).slice(0, 8); }
    return sheetOpen(add ? 'Adicionar garrafas' : 'Nova entrada') + sheetHd(add ? 'Adicionar garrafas' : 'Nova entrada', !add) +
      (add ? summary(p, safra(p)) : '<div class="seg" role="group" aria-label="Seção"><button type="button" data-a="etype" data-x="0" aria-pressed="' + !bar + '">Vinho</button><button type="button" data-a="etype" data-x="1" aria-pressed="' + bar + '">Bar e outros</button></div>' +
        field(bar ? 'Item' : 'Vinho', 'nome', d.nome, 'maxlength="140" placeholder="Nome como está no rótulo" autocapitalize="words"') +
        '<div class="grid-ns">' + field('Produtor', 'produtor', d.produtor, 'maxlength="100" placeholder="Produtor"') + field('Safra', 'safra', d.safra, 'inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="NV"') + '</div>' +
        '<div class="grid2">' + field('País', 'pais', d.pais, 'maxlength="50" placeholder="País"') + field('Região', 'regiao', d.regiao, 'maxlength="80" placeholder="Região"') + '</div>' +
        (bar ? field('Categoria', 'categoria', d.categoria, 'maxlength="50" placeholder="Whisky, gin, licor…"') + (cats.length ? pickRow('pickcat', cats.map(function (c) { return [c, c]; }), d.categoria) : '')
          : '<div class="fld"><span>Tipo</span>' + pickRow('pickstyle', STYLE_ORDER.map(function (s) { return [s, STYLE_ONE[s]]; }), d.estilo) + '</div><div class="fld"><span>Avaliação</span>' + pickRow('pickrate', escala().map(function (e) { return [e, e]; }), d.avaliacao) + '</div>')) +
      '<div class="grid-ns" style="grid-template-columns:132px minmax(0,1fr)"><div class="fld"><span>Garrafas</span><div class="stepper"><button type="button" data-a="qty" data-x="-1" aria-label="Menos uma">−</button><b aria-live="polite">' + (d.qtd || 1) + '</b><button type="button" data-a="qty" data-x="1" aria-label="Mais uma">+</button></div></div>' +
      field('Nichos', 'nichos', d.nichos, 'inputmode="text" maxlength="40" placeholder="Ex.: 181 ou 432–434"') + '</div>' +
      (livres.length ? '<div class="fld"><span>Nichos livres</span>' + pickRow('picklivre', livres.map(function (n) { return [String(n), pad(n)]; }), null) + '</div>' : '') +
      (ar2.length ? '<div class="fld"><span>Ou numa área</span>' + pickRow('pickarea', ar2.map(function (L) { return [L.id, L.nome]; }), d.area) + '</div>' : '') +
      '<div class="grid2">' + field('Preço pago (por garrafa)', 'preco', d.preco, 'inputmode="decimal" maxlength="10" placeholder="Opcional"') +
      '<div class="fld"><span>Moeda</span>' + pickRow('pickmoeda', [['USD', 'US$'], ['BRL', 'R$']], d.moeda || 'USD') + '</div></div>' +
      errLine(m) + '<button class="btn primary block" type="button" data-a="revisar">Revisar</button>' + SHEET_END;
  }
  if (m.kind === 'fotos') {
    var r = m.run;
    var head = sheetOpen('Importar fotos') + sheetHd('Fotos do AppSheet');
    if (!r) return head + '<p class="lead">Escolha a pasta de imagens baixada do Drive. O app liga cada foto ao item certo pelo nome do arquivo na planilha, reduz o tamanho e guarda no Supabase. Itens que já têm foto ficam como estão.</p>' +
      '<label class="btn primary block" for="f-lote">' + I.img + 'Escolher a pasta</label><input id="f-lote" class="sr" type="file" webkitdirectory multiple>' +
      '<label class="btn block" for="f-lote2">Ou selecionar as fotos</label><input id="f-lote2" class="sr" type="file" accept="image/*" multiple>' +
      '<p class="note">Vale para ' + esc((adegaAtual() || {}).nome || 'a adega aberta') + '. Pode repetir com outra pasta, como a dos destilados. Deixe o app aberto até terminar.</p>' + SHEET_END;
    if (r.fase === 'lendo') return head + '<p class="lead">Conferindo ' + plural(r.arquivos, 'arquivo', 'arquivos') + ' com a planilha…</p><div class="sk" style="height:8px"></div>' + SHEET_END;
    if (r.fase === 'enviando') {
      var pct = r.total ? Math.round(100 * (r.feitos + r.erros) / r.total) : 0;
      return head + '<p class="lead">Enviando ' + r.feitos + ' de ' + r.total + ' fotos. Deixe o app aberto.</p>' +
        '<div class="win"><div class="track"><span class="fill" style="left:0;width:' + pct + '%;background:var(--gold)"></span></div></div>' +
        (r.erros ? '<p class="err">' + plural(r.erros, 'falha', 'falhas') + ' até agora. Dá para rodar de novo depois; o que já foi não se repete.</p>' : '') + SHEET_END;
    }
    if (r.fase === 'erro') return head + '<p class="err" role="alert">' + esc(r.msg || 'Não foi possível concluir.') + '</p><p class="note">O que já foi enviado fica salvo. Rode de novo para completar.</p><button class="btn block" type="button" data-a="close">Fechar</button>' + SHEET_END;
    return head + '<h2 class="serif" style="margin:0">' + (r.feitos ? plural(r.feitos, 'foto ligada', 'fotos ligadas') : 'Nenhuma foto nova') + '</h2>' +
      '<dl class="conf"><dt>Já tinham foto</dt><dd>' + r.ja + '</dd><dt>Sem arquivo na pasta</dt><dd>' + r.semFoto + '</dd><dt>Arquivos sem item</dt><dd>' + r.sobra + '</dd>' + (r.erros ? '<dt>Falhas</dt><dd>' + r.erros + '</dd>' : '') + '</dl>' +
      '<p class="note">"Arquivos sem item" são fotos antigas que a planilha não usa mais.</p><button class="btn primary block" type="button" data-a="close">Fechar</button>' + SHEET_END;
  }
  if (m.kind === 'senha') {
    return sheetOpen('Trocar senha') + sheetHd('Trocar senha') + '<p class="lead">Use pelo menos 8 caracteres. A nova senha vale para todos os aparelhos.</p>' +
      '<label class="fld">Nova senha<input data-f="s1" type="password" autocomplete="new-password" value="' + esc(d.s1 || '') + '"></label>' +
      '<label class="fld">Repita a nova senha<input data-f="s2" type="password" autocomplete="new-password" value="' + esc(d.s2 || '') + '"></label>' +
      errLine(m) + busyBtn('dosenha', 'Salvar nova senha', 'Salvando…') + SHEET_END;
  }
  if (m.kind === 'pessoas') {
    var a = adegaAtual();
    return sheetOpen('Pessoas com acesso') + sheetHd('Pessoas com acesso') + '<p class="lead">' + esc(a ? a.nome : '') + '</p>' +
      '<div class="feed">' + (D.membros.length ? D.membros.map(function (mb) { return '<div class="fi" style="grid-template-columns:40px 1fr auto"><span class="av" style="grid-row:span 1;width:36px;height:36px">' + esc((mb.nome_exibicao || '?').charAt(0).toUpperCase()) + '</span><span class="t" style="align-self:center">' + esc(mb.nome_exibicao || 'Sem nome') + (S.me && mb.user_id === S.me.id ? ' <span class="hint">(você)</span>' : '') + '</span><span class="role" style="align-self:center">' + esc(PAPEL_NOME[mb.papel] || mb.papel) + '</span></div>'; }).join('') : '<p class="hint">Ninguém além do administrador ainda.</p>') + '</div>' +
      '<p class="note">' + (S.me && S.me.is_admin ? 'O administrador vê todas as adegas. Novos acessos são criados no Supabase e ligados por convite de e-mail.' : 'Para dar acesso a mais alguém, fale com o administrador.') + '</p>' + SHEET_END;
  }
  return sheetOpen('') + sheetHd('') + SHEET_END;
}
function menuHtml() {
  var a = adegaAtual(), A = X.adega, B = X.bar;
  var ab = countB(A.filter(function (id) { return paraAbrir(prod(id)); }));
  var th = PREF.theme || 'dark', pl = papel();
  var adegasHtml = (S.me && S.me.is_admin && S.adegas.length) ? '<div class="dsec"><span class="lbl">Adegas</span>' + S.adegas.map(function (x) {
    return '<button class="adega-opt" type="button" data-a="adega" data-x="' + x.id + '" aria-current="' + (x.id === S.adegaId) + '"><i></i><span>' + esc(x.nome) + '</span><small>' + (x.garrafas ? plural(x.garrafas, 'garrafa', 'garrafas') : 'sem dados') + '</small></button>';
  }).join('') + '</div>' : '';
  return '<div class="layer drawer"><div class="scrim" data-a="close"></div><aside role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1" data-panel>' +
    '<div class="dsec" style="padding-top:20px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div style="min-width:0"><div style="font-family:var(--serif);font-size:24px;line-height:1.15">' + esc(a ? a.nome : 'App Adega') + '</div><div class="hint" style="margin-top:2px">' + plural(countB(A) + countB(B), 'garrafa', 'garrafas') + ' · ' + plural(A.length + B.length, 'rótulo', 'rótulos') + '</div></div><button class="ib ghost" type="button" data-a="close" aria-label="Fechar menu" style="margin:-8px -10px 0 0">' + I.close + '</button></div></div>' +
    adegasHtml +
    '<div class="dsec"><span class="lbl">Adega</span>' +
      '<a class="dlink" href="#/" data-a="tab" data-x="#/"><span>Vinhos</span><small>' + plural(A.length, 'rótulo', 'rótulos') + '</small></a>' +
      '<a class="dlink" href="#/bar" data-a="tab" data-x="#/bar"><span>Bar e outros</span><small>' + plural(B.length, 'item', 'itens') + '</small></a>' +
      '<a class="dlink" href="' + hrefGroup('abrir', 'todos') + '"><span>Para abrir logo</span>' + (ab ? '<span class="cnt">' + ab + '</span>' : '') + '</a>' +
      '<a class="dlink" href="#/historico"><span>Histórico</span></a>' +
      '<a class="dlink" href="#/painel" data-a="tab" data-x="#/painel"><span>Painel</span></a>' +
      (canManage() ? '<button class="dlink" type="button" data-a="pessoas"><span>Pessoas com acesso</span><small>' + plural(D.membros.length, 'pessoa', 'pessoas') + '</small></button>' : '') +
      (S.me && S.me.is_admin ? '<button class="dlink" type="button" data-a="fotoslote"><span>Importar fotos do AppSheet</span>' + I.img + '</button>' : '') +
    '</div>' +
    '<div class="dsec"><span class="lbl">Aparência</span>' + seg('theme', [['system', 'Sistema'], ['dark', 'Escuro'], ['light', 'Claro']], th) + '</div>' +
    '<div class="dsec"><span class="lbl">Conta</span><div class="me" style="padding:6px 0 8px"><span class="av">' + esc((meuNome() || '?').charAt(0).toUpperCase()) + '</span><span style="min-width:0;display:flex;flex-direction:column;gap:2px"><b style="font-size:14.5px">' + esc(meuNome()) + '</b><span class="hint" style="font-size:12.5px;overflow:hidden;text-overflow:ellipsis">' + esc(S.me ? S.me.email : '') + '</span></span><span class="role" style="margin-left:auto">' + esc(PAPEL_NOME[pl] || '—') + '</span></div>' +
      '<button class="dlink" type="button" data-a="senha"><span>Trocar senha</span>' + I.key + '</button>' +
      '<button class="dlink" type="button" data-a="sync"><span>Atualizar dados</span>' + (S.ui.syncing ? '<span class="spin" aria-hidden="true"></span>' : I.refresh) + '</button>' +
      '<button class="dlink" type="button" data-a="sair"><span style="color:var(--wine-fg)">Sair</span>' + I.out + '</button></div>' +
    '<div class="dsec" style="border-bottom:0;margin-top:auto"><p class="hint" style="margin:0;font-size:12px">App Adega ' + VERSION + (S.ui.syncedAt ? ' · dados de ' + fmtTime(S.ui.syncedAt) : '') + '</p></div>' +
    '</aside></div>';
}
function fotoHtml(m) {
  var p = prod(m.pid), u = fotoUrl(p), write = canWrite();
  var busy = S.busy === 'foto';
  return '<div class="layer viewer"><div class="scrim"></div><div class="vin" role="dialog" aria-modal="true" aria-label="Foto da garrafa" tabindex="-1" data-panel>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span style="font-family:var(--serif);font-size:19px;min-width:0">' + esc(p.nome) + (p.safra ? ' ' + p.safra : '') + '</span><button class="ib" type="button" data-a="close" aria-label="Fechar foto" style="background:#171B1A;border-color:#262C2A;color:#EEEAE2">' + I.close + '</button></div>' +
    '<div class="pic">' + (u ? '<img src="' + esc(u) + '" alt="Foto da garrafa">' : '<div class="ph">' + I.img + '<span>' + (write ? 'Ainda sem foto. Tire uma foto da garrafa ou do rótulo.' : 'Ainda sem foto.') + '</span></div>') + '</div>' +
    (write ? '<label class="btn block" for="f-foto" style="background:#171B1A;border-color:#262C2A;color:#EEEAE2' + (busy ? ';opacity:.6;pointer-events:none' : '') + '">' + (busy ? '<span class="spin" aria-hidden="true"></span>Enviando foto…' : I.camera + (u ? 'Trocar foto' : 'Adicionar foto')) + '</label><input id="f-foto" class="sr" type="file" accept="image/*" data-p="' + p.id + '">' : '') +
    errLine(m) + '</div></div>';
}

/* ------------------------------------------------------------------ render principal */
var shell = null;
function ensureShell() {
  var app = document.getElementById('app');
  if (shell && document.getElementById('screen')) return;
  app.innerHTML = '<div id="screen"></div><div id="dock"></div><div id="layer"></div><div class="toasts" id="toasts" aria-live="polite"></div>';
  shell = true;
}
function render() {
  ensureShell();
  var screen = document.getElementById('screen'), dock = document.getElementById('dock');
  var html, showDock = false, r = S.route;
  if (S.phase === 'boot') html = '<div class="boot">Carregando…</div>';
  else if (S.phase === 'config') html = viewMessage('Configuração incompleta', 'Falta a chave pública do Supabase no arquivo config.js.');
  else if (S.phase === 'login') html = viewLogin();
  else if (S.phase === 'loading') html = viewLoading();
  else if (S.phase === 'noadega') html = viewMessage('Nenhuma adega ligada', 'Sua conta ainda não está ligada a nenhuma adega. Fale com quem administra o app.', '<button class="btn" type="button" data-a="sair">Sair</button>');
  else if (S.phase === 'erro') html = viewMessage('Não foi possível carregar', S.ui.bootErr || 'Tente de novo em instantes.', '<button class="btn primary" type="button" data-a="retry">Tentar de novo</button>');
  else {
    if (r.name === 'home') { html = viewHome(); showDock = true; }
    else if (r.name === 'bar') { html = viewBar(); showDock = true; }
    else if (r.name === 'painel') { html = viewPainel(); showDock = true; }
    else if (r.name === 'grupo') html = viewGroup(r);
    else if (r.name === 'vinho') html = viewFicha(r.id);
    else if (r.name === 'busca') html = viewBusca();
    else if (r.name === 'historico') html = viewHistorico();
    else html = viewHome();
  }
  var screenKey = S.phase + ':' + routeKey(r);
  if (screen.getAttribute('data-route') !== screenKey) { screen.setAttribute('data-route', screenKey); screen.innerHTML = strip(html); }
  else morph(screen, html);
  var dockHtml = '';
  if (showDock) {
    var t = r.name, bar = t === 'bar';
    dockHtml = '<div class="dock"><nav aria-label="Seções">' +
      '<a href="#/" data-a="tab" data-x="#/"' + (t === 'home' ? ' aria-current="page"' : '') + '>' + I.glass + 'Adega</a>' +
      '<a href="#/bar" data-a="tab" data-x="#/bar"' + (bar ? ' aria-current="page"' : '') + '>' + I.bar + 'Bar</a>' +
      '<a href="#/painel" data-a="tab" data-x="#/painel"' + (t === 'painel' ? ' aria-current="page"' : '') + '>' + I.chart + 'Painel</a></nav>' +
      (canWrite() ? '<button class="fab" type="button" data-a="entrada" data-x="' + (bar ? 'bar' : '') + '" aria-label="' + (bar ? 'Nova entrada no bar' : 'Nova entrada de vinho') + '">' + I.plus + '</button>' : '') + '</div>';
  } else if (S.phase === 'app' && r.name === 'vinho') dockHtml = fichaActions(r.id);
  morph(dock, dockHtml);
  if (S.modal) renderLayer();
  onScroll();
}
function onScroll() {
  var t = document.getElementById('top'); if (!t) return;
  t.classList.toggle('scrolled', window.scrollY > 4);
  var h = t.querySelector('.h1') && document.querySelector('.hero h1');
  if (h) t.classList.toggle('show-title', h.getBoundingClientRect().bottom < t.getBoundingClientRect().bottom - 4);
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ------------------------------------------------------------------ ações */
function guardOnline() { if (S.ui.offline || !navigator.onLine) { toast('Sem internet. Tente de novo quando a conexão voltar.', { err: true }); return false; } return true; }
function fail(e, m) {
  if (e && e.kind === 'sessao') { toLogin(MSG.sessao); return; }
  var msg = (e && e.message) || 'Algo deu errado.';
  if (m && S.modal === m) { m.err = msg; S.busy = null; renderLayer(); } else toast(msg, { err: true });
  if (e && (e.kind === 'garrafa_indisponivel' || e.kind === 'garrafa_inexistente')) { closeModal(); sync(true); }
}
function run(name, fn) {
  if (S.busy) return;
  if (!guardOnline()) return;
  S.busy = name; if (S.modal) { S.modal.err = null; renderLayer(); }
  var m = S.modal;
  return Promise.resolve().then(fn).then(function (r) { S.busy = null; return r; }, function (e) { S.busy = null; fail(e, m); });
}
function pickGarrafa(pid, locKey) { var gs = stock(pid).filter(function (g) { return (g.local_id || 'none') === locKey; }); return gs[0] || null; }
function parseNichos(txt) {
  var out = [], bad = false;
  String(txt || '').split(/[,;/]+/).forEach(function (part) {
    var t = part.trim(); if (!t) return;
    var mm = t.match(/^(\d{1,4})\s*(?:[-–a]+\s*(\d{1,4}))?$/);
    if (!mm) { bad = true; return; }
    var a = +mm[1], b = +(mm[2] || mm[1]); if (b < a) { var x = a; a = b; b = x; }
    if (b - a > 119) { bad = true; return; }
    for (var k = a; k <= b; k++) out.push(k);
  });
  return bad ? null : out;
}
function yearOk(v) { return v === '' || v == null || (/^\d{4}$/.test(String(v)) && +v >= 1800 && +v <= 2200); }
function labelNichos(ns) { if (ns.length === 1) return 'Nicho ' + pad(ns[0]); return 'Nichos ' + ns.map(pad).join(', ').replace(/(\d+), (?:\d+, )*(\d+)$/, function (all, a, b) { return ns.every(function (n, i) { return i === 0 || n === ns[i - 1] + 1; }) ? a + '–' + b : all; }); }

function revisar() {
  var m = S.modal, d = m.draft, p = m.pid ? prod(m.pid) : null;
  m.err = null;
  if (m.kind === 'consumir') {
    if (!d.loc) { m.err = 'Escolha de onde sai a garrafa.'; return renderLayer(); }
    if (d.data && d.data > todayISO()) { m.err = 'A data não pode ser no futuro.'; return renderLayer(); }
    m.step = 'conf'; return renderLayer({ step: true });
  }
  if (m.kind === 'mover') {
    if (!d.loc) { m.err = 'Escolha qual garrafa vai mudar de lugar.'; return renderLayer(); }
    var n = String(d.nicho || '').trim();
    if (n) {
      if (!/^\d{1,4}$/.test(n) || +n < 1) { m.err = 'Digite só o número do nicho, como 181.'; return renderLayer(); }
      var cur = D.locais.get(d.loc); if (cur && isNicho(cur) && nichoNum(cur) === +n) { m.err = MSG.mesmo_local; return renderLayer(); }
      m.dest = { nicho: +n }; m.destLabel = 'Nicho ' + pad(+n);
    } else if (d.area) {
      if (d.area === d.loc) { m.err = MSG.mesmo_local; return renderLayer(); }
      m.dest = { local: d.area }; m.destLabel = (D.locais.get(d.area) || {}).nome;
    } else { m.err = 'Informe um nicho ou escolha uma área.'; return renderLayer(); }
    m.step = 'conf'; return renderLayer({ step: true });
  }
  if (m.kind === 'editar') {
    if (!yearOk(d.janela_inicio) || !yearOk(d.janela_fim)) { m.err = 'Use anos com quatro dígitos, como 2030.'; return renderLayer(); }
    if (d.janela_inicio && d.janela_fim && +d.janela_fim < +d.janela_inicio) { m.err = 'O fim da janela precisa ser igual ou depois do início.'; return renderLayer(); }
    if (m.more && !String(d.nome || '').trim()) { m.err = 'O nome não pode ficar vazio.'; return renderLayer(); }
    if (m.more && !yearOk(d.safra)) { m.err = 'Safra com quatro dígitos, ou em branco para NV.'; return renderLayer(); }
    var ch = [], patchObj = {};
    function cmpf(key, label, val, orig, show) { var a = (val == null ? '' : String(val).trim()), b = (orig == null ? '' : String(orig)); if (a !== b) { ch.push([label, show ? show(b) : b, show ? show(a) : a]); patchObj[key] = a; } }
    if (p.secao !== 'bar') { cmpf('avaliacao', 'Avaliação', d.avaliacao, p.avaliacao); cmpf('janela_inicio', 'Beber a partir de', d.janela_inicio, p.janela_inicio); cmpf('janela_fim', 'Beber até', d.janela_fim, p.janela_fim); }
    cmpf('notas', 'Notas', d.notas, p.notas);
    if (m.more) {
      cmpf('nome', 'Nome', d.nome, p.nome); cmpf('produtor', 'Produtor', d.produtor, p.produtor);
      var sOrig = p.safra ? String(p.safra) : '';
      if (String(d.safra || '').trim() !== sOrig) { ch.push(['Safra', sOrig || 'NV', String(d.safra || '').trim() || 'NV']); patchObj.safra = String(d.safra || '').trim(); patchObj.sem_safra = !String(d.safra || '').trim(); }
      cmpf('pais', 'País', d.pais, p.pais); cmpf('regiao', 'Região', d.regiao, p.regiao);
      if (p.secao !== 'bar') cmpf('estilo', 'Tipo', d.estilo, p.estilo, function (v) { return STYLE_ONE[v] || v; }); else cmpf('categoria', 'Categoria', d.categoria, p.categoria);
    }
    if (!ch.length) { m.err = 'Nada foi alterado.'; return renderLayer(); }
    m.changes = ch; m.patch = patchObj; m.step = 'conf'; return renderLayer({ step: true });
  }
  if (m.kind === 'entrada' || m.kind === 'adicionar') {
    if (m.kind === 'entrada') {
      if (!String(d.nome || '').trim()) { m.err = 'Informe o nome do ' + (d.bar ? 'item' : 'vinho') + '.'; return renderLayer(); }
      if (!yearOk(d.safra)) { m.err = 'Safra com quatro dígitos, ou em branco para NV.'; return renderLayer(); }
    }
    if (d.preco && !/^\d+([.,]\d{1,2})?$/.test(String(d.preco).trim())) { m.err = 'Preço em números, como 350 ou 89,90.'; return renderLayer(); }
    var ns = String(d.nichos || '').trim();
    if (ns) {
      var arr = parseNichos(ns);
      if (!arr || !arr.length) { m.err = 'Nichos no formato 181 ou 432–434.'; return renderLayer(); }
      m.dest = { nichos: arr }; m.destLabel = labelNichos(arr);
      if (arr.length > 1 && arr.length !== (d.qtd || 1)) m.destLabel += ' (' + arr.length + ' nichos para ' + plural(d.qtd || 1, 'garrafa', 'garrafas') + ')';
    } else if (d.area) { m.dest = { local: d.area }; m.destLabel = (D.locais.get(d.area) || {}).nome; }
    else { m.dest = {}; m.destLabel = 'Sem local (definir depois)'; }
    m.step = 'conf'; return renderLayer({ step: true });
  }
}

function doConsumir() {
  var m = S.modal, d = m.draft, g = pickGarrafa(m.pid, d.loc);
  if (!g) { m.err = MSG.garrafa_indisponivel; return renderLayer(); }
  return run('doconsumir', function () {
    return API.rpc('consumir_garrafa', { p_garrafa: g.id, p_data: d.data || todayISO(), p_ocasiao: d.oc || null, p_com_quem: d.cq || null, p_nota: d.nota || null }).then(function (mov) {
      var prev = g.local_id;
      g.status = 'consumida'; g.local_id = null; D.movs.unshift(mov); derive();
      if (S.ficha[m.pid]) S.ficha[m.pid].movs.unshift(mov);
      closeModal(); render(); snapshot();
      var p = prod(m.pid);
      toast('Consumo registrado: ' + p.nome + '.', { action: { label: 'Desfazer', run: function () { desfazer(mov, g, prev); } } });
      refreshResumo();
    });
  });
}
function desfazer(mov, g, prevLocal) {
  if (!guardOnline()) return;
  API.rpc('desfazer_movimento', { p_mov: mov.id }).then(function (nm) {
    g.status = 'em_estoque'; g.local_id = nm.para_local_id || prevLocal; D.movs.unshift(nm); derive();
    var pid = g.produto_id; if (S.ficha[pid]) S.ficha[pid].movs.unshift(nm);
    render(); snapshot(); toast('Desfeito.'); refreshResumo();
  }).catch(function (e) { fail(e); });
}
function doMover() {
  var m = S.modal, d = m.draft, g = pickGarrafa(m.pid, d.loc);
  if (!g) { m.err = MSG.garrafa_indisponivel; return renderLayer(); }
  return run('domover', function () {
    return API.rpc('mover_garrafa', { p_garrafa: g.id, p_local: m.dest.local || null, p_nicho: m.dest.nicho || null }).then(function (mov) {
      var prev = g.local_id;
      var known = D.locais.has(mov.para_local_id);
      var after = known ? Promise.resolve() : API.selectAll('locais', 'select=id,pai_id,nome,tipo,ordem&adega_id=eq.' + S.adegaId + '&order=id.asc').then(function (ls) { D.locais = new Map(ls.map(function (l) { return [l.id, l]; })); });
      return after.then(function () {
        g.local_id = mov.para_local_id; D.movs.unshift(mov); derive();
        if (S.ficha[m.pid]) S.ficha[m.pid].movs.unshift(mov);
        closeModal(); render(); snapshot();
        toast('Garrafa movida ' + paraLoc(D.locais.get(mov.para_local_id)) + '.', { action: { label: 'Desfazer', run: function () { desfazerMover(mov, g); } } });
      });
    });
  });
}
function desfazerMover(mov, g) {
  if (!guardOnline()) return;
  API.rpc('desfazer_movimento', { p_mov: mov.id }).then(function (nm) {
    g.local_id = nm.para_local_id; D.movs.unshift(nm); derive();
    if (S.ficha[g.produto_id]) S.ficha[g.produto_id].movs.unshift(nm);
    render(); snapshot(); toast('Desfeito.');
  }).catch(function (e) { fail(e); });
}
function doEditar() {
  var m = S.modal;
  return run('doeditar', function () {
    return API.rpc('editar_produto', { p_produto: m.pid, p_campos: m.patch }).then(function (np) {
      var old = prod(m.pid); var merged = {}; for (var k in old) merged[k] = old[k]; PCOLS.split(',').forEach(function (c) { if (c in np) merged[c] = np[c]; });
      D.produtos.set(m.pid, merged); derive();
      closeModal(); render(); snapshot(); loadFicha(m.pid);
      toast('Alterações salvas.');
    });
  });
}
function doEntrada() {
  var m = S.modal, d = m.draft;
  var preco = d.preco ? parseFloat(String(d.preco).replace(',', '.')) : null;
  return run('doentrada', function () {
    var call;
    if (m.kind === 'adicionar') {
      call = API.rpc('adicionar_garrafas', { p_produto: m.pid, p_qtd: d.qtd || 1, p_locais: m.dest.local ? [m.dest.local] : null, p_preco: preco, p_moeda: d.moeda || 'USD', p_nichos: m.dest.nichos || null }).then(function () { return m.pid; });
    } else {
      var bar = !!d.bar;
      var produto = { nome: String(d.nome).trim(), produtor: d.produtor || '', pais: d.pais || '', regiao: d.regiao || '', safra: String(d.safra || '').trim(),
        tipo: bar ? 'destilado' : 'vinho', secao: bar ? 'bar' : 'adega', estilo: bar ? '' : (d.estilo || ''), categoria: bar ? (d.categoria || '') : '', avaliacao: bar ? '' : (d.avaliacao || '') };
      call = API.rpc('registrar_entrada', { p_adega: S.adegaId, p_produto: produto, p_qtd: d.qtd || 1, p_locais: m.dest.local ? [m.dest.local] : null, p_preco: preco, p_moeda: d.moeda || 'USD', p_nichos: m.dest.nichos || null });
    }
    return call.then(function (pid) {
      var qtd = d.qtd || 1, kind = m.kind;
      return loadAdega(S.adegaId).then(function () {
        refreshResumo();
        if (kind === 'adicionar') { closeModal(); render(); loadFicha(pid); }
        else leaveModal(function () { go('#/v/' + pid); });
        toast(plural(qtd, 'garrafa guardada', 'garrafas guardadas') + '.');
      });
    });
  });
}
function doSenha() {
  var m = S.modal, d = m.draft;
  if (String(d.s1 || '').length < 8) { m.err = MSG.senha_fraca; return renderLayer(); }
  if (d.s1 !== d.s2) { m.err = 'As duas senhas não são iguais.'; return renderLayer(); }
  return run('dosenha', function () { return API.updatePassword(d.s1).then(function () { closeModal(); toast('Senha alterada.'); }); });
}
function uploadFoto(file, pid) {
  var m = S.modal;
  if (!file || !/^image\//.test(file.type || 'image/')) { if (m) { m.err = 'Escolha uma imagem.'; renderLayer(); } return; }
  run('foto', function () {
    renderLayer();
    return resizeImage(file, 1400, 0.84).then(function (blob) {
      var path = S.adegaId + '/' + pid + '/' + Date.now() + '.jpg';
      return API.upload(path, blob).then(function () { return resizeImage(file, 320, 0.8).then(function (tb) { return API.upload(thumbPath(path), tb).catch(function () {}); }); })
        .then(function () { return API.rpc('editar_produto', { p_produto: pid, p_campos: { foto_path: path } }); }).then(function (np) {
        var p = prod(pid); p.foto_path = np.foto_path;
        D.fotos[path] = { url: URL.createObjectURL(blob), exp: Date.now() + 3500000 };
        snapshot(); render(); if (S.modal) renderLayer(); loadFicha(pid);
        toast('Foto salva.');
        API.sign([path]).then(function (res) { var r = res && res[0]; if (r && r.signedURL) { D.fotos[path] = { url: API.signedUrl(r.signedURL), exp: Date.now() + 3500000 }; } }).catch(function () {});
      });
    });
  });
}
function safeName(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_'); }
function enviarFoto(path, file) {
  var dup = function (e) { if (e && (e.status === 409 || e.code === 'Duplicate' || e.code === '23505')) return; throw e; };
  return Promise.all([resizeImage(file, 1400, 0.84), resizeImage(file, 320, 0.8)]).then(function (b) {
    return API.upload(path, b[0]).catch(dup).then(function () { return API.upload(thumbPath(path), b[1]).catch(dup); });
  });
}
function importarFotos(files) {
  var m = S.modal; if (!m || m.kind !== 'fotos' || m.run) return;
  if (!guardOnline()) return;
  var byName = {};
  Array.prototype.forEach.call(files, function (f) { if (/^image\//.test(f.type || '') || /\.(jpe?g|png|webp)$/i.test(f.name)) byName[f.name] = f; });
  var adega = S.adegaId, r = m.run = { fase: 'lendo', arquivos: Object.keys(byName).length, total: 0, feitos: 0, erros: 0, ja: 0, semFoto: 0, sobra: 0 };
  renderLayer();
  var draw = function () { if (S.modal === m) renderLayer(); };
  API.selectAll('produtos', 'select=id,foto_path,extra&adega_id=eq.' + adega + '&order=id.asc').then(function (rows) {
    var fila = [], usados = {};
    rows.forEach(function (x) {
      var b = String((x.extra && x.extra.imagem_appsheet) || '').split('/').pop().trim();
      if (!b) return;
      if (x.foto_path) { r.ja++; usados[b] = 1; return; }
      if (byName[b]) { fila.push({ id: x.id, file: byName[b], base: b }); usados[b] = 1; } else r.semFoto++;
    });
    r.sobra = Object.keys(byName).filter(function (k) { return !usados[k]; }).length;
    r.total = fila.length; r.fase = 'enviando'; draw();
    var lote = [], i = 0;
    var flush = function () { if (!lote.length) return Promise.resolve(); var x = lote; lote = []; return API.rpc('definir_fotos', { p_fotos: x }); };
    var worker = function () {
      if (i >= fila.length) return Promise.resolve();
      var it = fila[i++];
      var path = adega + '/' + it.id + '/appsheet-' + safeName(it.base.replace(/\.[^.]+$/, '')) + '.jpg';
      return enviarFoto(path, it.file).then(function () { lote.push({ id: it.id, path: path }); r.feitos++; if (lote.length >= 20) return flush(); },
        function (e) { if (e && (e.kind === 'sessao' || e.kind === 'rede')) throw e; r.erros++; })
        .then(function () { draw(); return worker(); });
    };
    return Promise.all([worker(), worker(), worker()]).then(flush);
  }).then(function () {
    r.fase = 'fim'; draw();
    if (S.modal !== m) toast(plural(r.feitos, 'foto ligada', 'fotos ligadas') + ' aos itens.');
    return adega === S.adegaId ? loadAdega(adega).then(render) : null;
  }).catch(function (e) {
    if (e && e.kind === 'sessao') return toLogin(MSG.sessao);
    r.fase = 'erro'; r.msg = e && e.message; draw();
  });
}
function resizeImage(file, max, q) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { b ? resolve(b) : reject(new ApiError('erro', 'Não foi possível ler a imagem.')); }, 'image/jpeg', q);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new ApiError('erro', 'Não foi possível ler a imagem.')); };
    img.src = url;
  });
}

/* ------------------------------------------------------------------ eventos */
function saveQuery() { var q = S.ui.q.trim(); if (q) { PREF.buscas = [q].concat((PREF.buscas || []).filter(function (x) { return x !== q; })).slice(0, 6); savePref(); } }
document.addEventListener('click', function (ev) {
  var a = ev.target.closest('a[href^="#/"]');
  var m = S.modal;
  if (a) {
    ev.preventDefault();
    var href = a.getAttribute('href'), aact = a.getAttribute('data-a');
    if (aact === 'savequery') saveQuery();
    if (aact === 'tab') { if (m) leaveModal(function () { goTab(href); }); else goTab(href); return; }
    if (sameHash(href)) { if (m) closeModal(); else window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (m) leaveModal(function () { go(href); }); else go(href);
    return;
  }
  var el = ev.target.closest('[data-a]');
  if (!el) return;
  var act = el.getAttribute('data-a'), x = el.getAttribute('data-x');
  switch (act) {
    case 'menu': openModal({ kind: 'menu' }); break;
    case 'close': closeModal(); break;
    case 'back': goBack(x); break;
    case 'togglepw': S.ui.showPw = !S.ui.showPw; render(); var pw = document.getElementById('l-senha'); if (pw) pw.focus(); break;
    case 'retry': enterApp(); break;
    case 'ver': S.ui.ver = x; PREF.ver = x; savePref(); render(); break;
    case 'barver': S.ui.barVer = x; PREF.barVer = x; savePref(); render(); break;
    case 'chip': S.ui.chips[el.getAttribute('data-ck')] = x; render(); break;
    case 'try': S.ui.q = x; var qi = document.getElementById('q'); if (qi) qi.value = x; render(); break;
    case 'theme': PREF.theme = x; savePref(); applyTheme(); renderLayer(); break;
    case 'sync': sync(false).then(function (ok) { if (S.modal) renderLayer(); if (ok) toast('Dados atualizados.'); else if (S.ui.offline) toast(MSG.rede, { err: true }); }); renderLayer(); break;
    case 'sair': leaveModal(function () { closeLayerNow(); toLogin(null); if (!sameHash('#/')) { navIntent = 'tab'; location.replace('#/'); } }); break;
    case 'adega': switchAdega(x); break;
    case 'senha': openModal({ kind: 'senha' }); break;
    case 'pessoas': openModal({ kind: 'pessoas' }); break;
    case 'fotoslote': openModal({ kind: 'fotos' }); break;
    case 'foto': openModal({ kind: 'foto', pid: x }); break;
    case 'consumir': if (!guardOnline()) break; openModal({ kind: 'consumir', pid: x, draft: { data: todayISO() } }); break;
    case 'mover': if (!guardOnline()) break; openModal({ kind: 'mover', pid: x }); break;
    case 'editar': if (!guardOnline()) break; var pe = prod(x); openModal({ kind: 'editar', pid: x, draft: { avaliacao: pe.avaliacao || '', janela_inicio: pe.janela_inicio || '', janela_fim: pe.janela_fim || '', notas: pe.notas || '', nome: pe.nome, produtor: pe.produtor || '', safra: pe.safra || '', pais: pe.pais || '', regiao: pe.regiao || '', estilo: pe.estilo || '', categoria: pe.categoria || '' } }); break;
    case 'entrada': if (!canWrite() || !guardOnline()) return; openModal({ kind: 'entrada', draft: { bar: x === 'bar' || S.route.name === 'bar', qtd: 1, estilo: 'tinto', moeda: 'USD' } }); break;
    case 'adicionar': if (!guardOnline()) break; openModal({ kind: 'adicionar', pid: x, draft: { qtd: 1, moeda: 'USD' } }); break;
    case 'more': if (m) { m.more = true; renderLayer({ step: true }); } break;
    case 'step': if (m) { m.step = x; m.err = null; renderLayer({ step: true }); var sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; } break;
    case 'revisar': revisar(); var sh2 = document.querySelector('.sheet'); if (sh2) sh2.scrollTop = 0; break;
    case 'pickloc': if (m) { m.draft.loc = x; m.err = null; renderLayer(); } break;
    case 'pickarea': if (m) { m.draft.area = m.draft.area === x ? null : x; if (m.draft.area) { m.draft.nicho = ''; m.draft.nichos = ''; var fi = document.querySelector('[data-f="nicho"],[data-f="nichos"]'); if (fi) fi.value = ''; } m.err = null; renderLayer(); } break;
    case 'picklivre': if (m) { var cur = String(m.draft.nichos || '').trim(); m.draft.nichos = cur ? cur + ', ' + x : x; m.draft.area = null; var fn = document.querySelector('[data-f="nichos"]'); if (fn) fn.value = m.draft.nichos; renderLayer(); } break;
    case 'pickrate': if (m) { m.draft.avaliacao = m.draft.avaliacao === x ? '' : x; renderLayer(); } break;
    case 'pickstyle': if (m) { m.draft.estilo = x; renderLayer(); } break;
    case 'pickcat': if (m) { m.draft.categoria = x; var fc = document.querySelector('[data-f="categoria"]'); if (fc) fc.value = x; renderLayer(); } break;
    case 'pickmoeda': if (m) { m.draft.moeda = x; renderLayer(); } break;
    case 'etype': if (m) { m.draft.bar = x === '1'; renderLayer(); } break;
    case 'qty': if (m) { m.draft.qtd = Math.max(1, Math.min(120, (m.draft.qtd || 1) + (+x))); renderLayer(); } break;
    case 'doconsumir': doConsumir(); break;
    case 'domover': doMover(); break;
    case 'doeditar': doEditar(); break;
    case 'doentrada': doEntrada(); break;
    case 'dosenha': doSenha(); break;
  }
});
document.addEventListener('input', function (ev) {
  var t = ev.target;
  if (t.id === 'q') { S.ui.q = t.value; render(); return; }
  var f = t.getAttribute && t.getAttribute('data-f');
  if (f && S.modal) {
    S.modal.draft[f] = t.value;
    if (f === 'nicho' && t.value) { S.modal.draft.area = null; var on = document.querySelector('[data-a="pickarea"][aria-pressed="true"]'); if (on) on.setAttribute('aria-pressed', 'false'); }
    if (f === 'nichos' && t.value) { S.modal.draft.area = null; var on2 = document.querySelector('[data-a="pickarea"][aria-pressed="true"]'); if (on2) on2.setAttribute('aria-pressed', 'false'); }
  }
});
document.addEventListener('change', function (ev) {
  var t = ev.target;
  if (t.id === 'f-foto' && t.files && t.files[0]) uploadFoto(t.files[0], t.getAttribute('data-p'));
  if ((t.id === 'f-lote' || t.id === 'f-lote2') && t.files && t.files.length) importarFotos(t.files);
});
document.addEventListener('submit', function (ev) {
  if (ev.target.id !== 'login-form') return;
  ev.preventDefault();
  var email = document.getElementById('l-email').value.trim(), senha = document.getElementById('l-senha').value;
  if (!email || !senha) { S.ui.loginErr = 'Informe o e-mail e a senha.'; render(); return; }
  if (!navigator.onLine) { S.ui.loginErr = MSG.rede; render(); return; }
  S.ui.loginErr = null; S.ui.loginBusy = true; render();
  API.signIn(email, senha).then(function () { S.ui.loginBusy = false; S.navDepth = 0; return enterApp(); })
    .catch(function (e) { S.ui.loginBusy = false; S.ui.loginErr = e.message; render(); var pw = document.getElementById('l-senha'); if (pw) { pw.select && pw.select(); } });
});
document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape' && S.modal) closeModal();
  if (ev.key === 'Enter' && ev.target.id === 'q') ev.target.blur();
});
window.addEventListener('online', function () { S.ui.offline = false; render(); if (S.phase === 'app') sync(true); });
window.addEventListener('offline', function () { S.ui.offline = true; render(); });
var hiddenAt = 0;
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (S.phase === 'app' && Date.now() - hiddenAt > 120000) sync(true);
  if (S.phase === 'app') signPhotos();
});

/* ------------------------------------------------------------------ início */
function fontsReady() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  var all = Promise.all(['400 15px Manrope', '700 15px Manrope', '400 18px Spectral', '500 18px Spectral'].map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  return Promise.race([all, new Promise(function (r) { setTimeout(r, 500); })]);
}
function boot() {
  applyTheme();
  if (history.state && history.state.modal) { try { history.replaceState(null, ''); } catch (e) {} }
  S.route = parseHash();
  fontsReady().then(start);
}
function start() {
  if (!CFG.supabaseUrl || !CFG.supabaseKey || /COLE/.test(CFG.supabaseKey)) { S.phase = 'config'; return render(); }
  if (!API.session()) { S.phase = 'login'; return render(); }
  var meta = (function () { try { var s = API.session(); return JSON.parse(localStorage.getItem('adega.cache.v1.' + s.user.id + '.meta')); } catch (e) { return null; } })();
  if (meta && meta.me) {
    S.me = meta.me; S.adegas = meta.adegas || []; S.adegaId = meta.adegaId;
    var snap = S.adegaId ? store(cacheKey(S.adegaId)) : null;
    if (snap) { applyAdegaData(snap); S.ui.syncedAt = snap.at; S.phase = 'app'; render(); if (S.route.name === 'vinho') loadFicha(S.route.id); }
  }
  if (S.phase !== 'app') { S.phase = 'loading'; render(); }
  loadMe().then(function () {
    if (!S.adegaId || !S.adegas.some(function (a) { return a.id === S.adegaId; })) S.adegaId = pickAdega();
    if (!S.adegaId) { S.phase = 'noadega'; return render(); }
    return loadAdega(S.adegaId).then(function () { var was = S.phase; S.phase = 'app'; render(); if (was !== 'app' && S.route.name === 'vinho') loadFicha(S.route.id); });
  }).catch(function (e) {
    if (e.kind === 'sessao') return toLogin(MSG.sessao);
    if (S.phase === 'app') { if (e.kind === 'rede') S.ui.offline = true; else toast(e.message, { err: true }); render(); return; }
    if (e.kind === 'rede') { S.phase = 'erro'; S.ui.bootErr = MSG.rede; return render(); }
    S.phase = 'erro'; S.ui.bootErr = e.message; render();
  });
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || CFG.forceSW)) {
  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    reg.addEventListener('updatefound', function () {
      var nw = reg.installing; if (!nw) return;
      nw.addEventListener('statechange', function () {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('Nova versão do app disponível.', { action: { label: 'Atualizar', run: function () { location.reload(); } }, ms: 15000 });
      });
    });
  }).catch(function () {});
}
window.__adega = { S: S, D: D, X: function () { return X; }, API: API };
boot();
})();
