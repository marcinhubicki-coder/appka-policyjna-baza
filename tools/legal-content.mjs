import fs from "node:fs";
import vm from "node:vm";
import zlib from "node:zlib";
import "../linking-rules.js";

export function loadLegalData(path = "data.js") {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path, "utf8"), context, { filename: path });
  const base64 = (context.window.__POLICE_B64 || []).join("");
  if (!base64) throw new Error(`Brak window.__POLICE_B64 w ${path}`);
  return JSON.parse(zlib.gunzipSync(Buffer.from(base64, "base64")).toString("utf8"));
}

export function saveLegalData(data, path = "data.js") {
  const json = JSON.stringify(data);
  const base64 = zlib.gzipSync(Buffer.from(json), { level: 9, mtime: 0 }).toString("base64");
  fs.writeFileSync(path, `window.__POLICE_B64=[${JSON.stringify(base64)}];\n`);
}

export function buildIndex(data) {
  const idMap = new Map();
  const articleMap = new Map();
  const unitMap = new Map();

  for (const act of data) {
    for (const article of act[3]) {
      idMap.set(article[0], act[0]);
      articleMap.set(article[0], { act: act[0], row: article });
      article[4].forEach((unit, index) => {
        const key = unit[0] || `${article[0]}@@${index}`;
        unitMap.set(key, { act: act[0], article: article[0], unit, index });
        if (unit[0]) idMap.set(unit[0], act[0]);
      });
    }
  }

  return { idMap, articleMap, unitMap };
}

export function createReferenceResolver(data) {
  const { idMap, articleMap } = buildIndex(data);

  function actBy(code) {
    return data.find((act) => act[0] === code) || data[0];
  }

  function contextPrefix(articleId, unitId, kind) {
    if (kind === "u") return `${articleId}-ust-`;
    if (kind === "par") return `${articleId}-par-`;
    if (kind === "p") {
      if (unitId) {
        let match = unitId.match(/^(.*-(?:ust|par)-[^-]+)-pkt-[^-]+/);
        if (match) return `${match[1]}-pkt-`;
        match = unitId.match(/^(.*-(?:ust|par)-[^-]+)$/);
        if (match) return `${match[1]}-pkt-`;
      }
      return `${articleId}-pkt-`;
    }
    if (kind === "i") {
      if (unitId) {
        let match = unitId.match(/^(.*-pkt-[^-]+)-lit-[^-]+/);
        if (match) return `${match[1]}-lit-`;
        match = unitId.match(/^(.*-pkt-[^-]+)$/);
        if (match) return `${match[1]}-lit-`;
      }
      return `${articleId}-lit-`;
    }
    return `${articleId}-`;
  }

  function uniqueSuffix(articleId, suffix) {
    const article = articleMap.get(articleId)?.row;
    if (!article) return null;
    const rows = article[4].filter((unit) => unit[0] && unit[0].endsWith(suffix));
    return rows.length === 1 ? rows[0][0] : null;
  }

  function resolveLocal(articleId, unitId, kind, value) {
    const val = String(value).toLowerCase();
    let id = null;
    if (kind === "u") id = `${articleId}-ust-${val}`;
    else if (kind === "par") id = `${articleId}-par-${val}`;
    else if (kind === "p") {
      id = contextPrefix(articleId, unitId, "p") + val;
      if (!idMap.has(id)) id = uniqueSuffix(articleId, `-pkt-${val}`);
    } else if (kind === "i") {
      id = contextPrefix(articleId, unitId, "i") + val;
      if (!idMap.has(id)) id = uniqueSuffix(articleId, `-lit-${val}`);
    }
    return id && idMap.has(id) ? id : null;
  }

  function resolveArticleChain(actCode, article, subKind, sub, point, letter) {
    const base = actCode.startsWith("z")
      ? `${actCode}-par-${article}`
      : `${actCode}-art-${article}`;
    if (!idMap.has(base)) return null;
    let id = base;
    if (sub) {
      id += `-${subKind === "par" ? "par" : "ust"}-${sub}`;
      if (!idMap.has(id)) return base;
    }
    if (point) {
      id += `-pkt-${point}`;
      if (!idMap.has(id)) {
        return sub ? `${base}-${subKind === "par" ? "par" : "ust"}-${sub}` : base;
      }
    }
    if (letter) {
      id += `-lit-${letter}`;
      if (!idMap.has(id)) return point ? id.replace(/-lit-[^-]+$/, "") : id;
    }
    return idMap.has(id) ? id : base;
  }

  function markerOrder(articleId, kind, unitId) {
    const article = articleMap.get(articleId)?.row;
    if (!article) return [];
    const prefix = contextPrefix(articleId, unitId, kind);
    const re = kind === "u"
      ? /-ust-([^-]+)$/
      : kind === "par"
        ? /-par-([^-]+)$/
        : kind === "p"
          ? /-pkt-([^-]+)$/
          : /-lit-([^-]+)$/;
    let rows = article[4]
      .filter((unit) => unit[0] && unit[0].startsWith(prefix))
      .map((unit) => {
        const match = unit[0].match(re);
        return match ? { id: unit[0], value: match[1] } : null;
      })
      .filter(Boolean);
    if (kind === "p" || kind === "i") {
      rows = rows.filter((row) => row.id.slice(prefix.length).indexOf("-") < 0);
    }
    return rows;
  }

  function rowsAtPrefix(articleId, kind, prefix) {
    const article = articleMap.get(articleId)?.row;
    if (!article) return [];
    const re = kind === "u"
      ? /-ust-([^-]+)$/
      : kind === "par"
        ? /-par-([^-]+)$/
        : kind === "p"
          ? /-pkt-([^-]+)$/
          : /-lit-([^-]+)$/;
    return article[4]
      .filter((unit) => unit[0] && unit[0].startsWith(prefix))
      .map((unit) => {
        const match = unit[0].match(re);
        return match ? { id: unit[0], value: match[1] } : null;
      })
      .filter(Boolean)
      .filter((row) => row.id.slice(prefix.length).indexOf("-") < 0);
  }

  function expandRows(rows, expression) {
    const byValue = new Map(rows.map((row) => [row.value.toLowerCase(), row]));
    const itemRe = /([0-9]+[a-z]?|[a-z])(?:\s*[–-]\s*([0-9]+[a-z]?|[a-z]))?/gi;
    const out = [];
    for (const match of expression.matchAll(itemRe)) {
      const first = match[1].toLowerCase();
      const last = (match[2] || "").toLowerCase();
      if (!last) {
        if (byValue.has(first)) out.push(byValue.get(first));
        continue;
      }
      if (/^\d+$/.test(first) && /^\d+$/.test(last)) {
        for (let n = Number(first); n <= Number(last); n += 1) {
          const value = String(n);
          if (byValue.has(value)) out.push(byValue.get(value));
        }
      } else {
        const start = rows.findIndex((row) => row.value.toLowerCase() === first);
        const end = rows.findIndex((row) => row.value.toLowerCase() === last);
        if (start >= 0 && end >= 0) {
          out.push(...rows.slice(Math.min(start, end), Math.max(start, end) + 1));
        }
      }
    }
    const seen = new Set();
    return out.filter((row) => !seen.has(row.id) && seen.add(row.id));
  }

  function expandExpression(articleId, unitId, kind, expression) {
    return expandRows(markerOrder(articleId, kind, unitId), expression);
  }

  return {
    actBy,
    contextPrefix,
    expandExpression,
    expandRows,
    idMap,
    articleMap,
    markerOrder,
    resolveArticleChain,
    resolveLocal,
    rowsAtPrefix,
  };
}

const MARKER_RUN = /^\s+((?:\d+[a-z]?|[a-z])(?:\s+(?:\d+[a-z]?|[a-z])){1,40})(?=\s*(?:[,;:.§)]|\b(?:lub|oraz|i|albo|ani|stosuje|nie|może|mogą|podlega|w|we|na|do|przepisy|Policja|sąd|minister|osoba|osoby|który|która|które|których|jeżeli|za|przy|od|z|ze|dla|wykonywania|wykonuje|wykonując|udzielenie|utrwala|przeprowadza|otrzymuje|oskarżyciel|niniejszej)\b))/i;

function externalAfter(text, end) {
  return /^\s*(?:ustawy\s+z\s+dnia|ustawy\s+o\b|rozporządzenia\b|dyrektywy\b|rozporządzenia\s*\(UE\))/i
    .test(text.slice(end, end + 90));
}

function continuesList(text, end, letters = false) {
  const atom = letters ? "[a-z]" : "\\d+[a-z]?";
  return new RegExp(`^\\s*(?:[–-]\\s*|,\\s*|(?:i|lub|oraz)\\s+)${atom}`, "i")
    .test(text.slice(end, end + 30));
}

export function referenceCandidates(text, articleId, unitId, actCode, resolver) {
  const candidates = [];
  const linkRules = globalThis.__LEGAL_LINK_RULES__;
  const externalRanges = linkRules?.externalReferenceRanges(text) || [];
  const add = (start, end, priority) => {
    if (!linkRules?.overlapsRange(externalRanges, start, end)) {
      candidates.push({ start, end, priority });
    }
  };
  const {
    actBy,
    articleMap,
    expandExpression,
    expandRows,
    idMap,
    resolveArticleChain,
    resolveLocal,
    rowsAtPrefix,
  } = resolver;

  const chain = /\bart\.\s*(\d+[a-z]*)(?:\s+(§|ust\.)\s*(\d+[a-z]*))?(?:\s+pkt\s*(\d+[a-z]*))?(?:\s+lit\.\s*([a-z]))?/gi;
  for (const match of text.matchAll(chain)) {
    if (externalAfter(text, match.index + match[0].length)
      || continuesList(text, match.index + match[0].length)) continue;
    const subKind = match[2] === "§" ? "par" : "u";
    const id = resolveArticleChain(actCode, match[1], subKind, match[3], match[4], match[5]);
    if (id) add(match.index, match.index + match[0].length, 5);
  }

  const localChain = /(ust\.|§)\s*(\d+[a-z]*)(?:\s+pkt\s*(\d+[a-z]*))?(?:\s+lit\.\s*([a-z]))?/gi;
  for (const match of text.matchAll(localChain)) {
    if (continuesList(text, match.index + match[0].length)) continue;
    const kind = match[1] === "§" ? "par" : "u";
    let id = resolveLocal(articleId, unitId, kind, match[2]);
    if (match[3]) {
      const parent = id || articleId;
      let candidate = `${parent}-pkt-${match[3]}`;
      if (idMap.has(candidate)) id = candidate;
      if (match[4]) {
        candidate = `${id}-lit-${match[4]}`;
        if (idMap.has(candidate)) id = candidate;
      }
    }
    if (id) add(match.index, match.index + match[0].length, 4);
  }

  const numExpr = String.raw`((?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?)(?:\s*(?:,|i|lub|oraz)\s*(?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?))*)`;
  const letExpr = String.raw`((?:[a-z](?:\s*[–-]\s*[a-z])?)(?:\s*(?:,|i|lub|oraz)\s*(?:[a-z](?:\s*[–-]\s*[a-z])?))*)(?![a-z])`;

  const localScopes = [...text.matchAll(/(ust\.|§)\s*(\d+[a-z]*)/gi)];
  for (let scopeIndex = 0; scopeIndex < localScopes.length; scopeIndex += 1) {
    const scope = localScopes[scopeIndex];
    const before = text.slice(Math.max(0, scope.index - 30), scope.index);
    if (/\bart\.\s*\d+[a-z]*\s*$/i.test(before)) continue;

    let end = scopeIndex + 1 < localScopes.length
      ? localScopes[scopeIndex + 1].index
      : text.length;
    const tail = text.slice(scope.index + scope[0].length, end);
    const sentenceEnd = tail.search(/[.;](?=\s+[A-ZĄĆĘŁŃÓŚŹŻ])/);
    if (sentenceEnd >= 0) end = scope.index + scope[0].length + sentenceEnd + 1;
    const body = text.slice(scope.index + scope[0].length, end);
    const pointRe = new RegExp(String.raw`\bpkt\s+${numExpr}`, "gi");
    for (const point of body.matchAll(pointRe)) {
      const expression = point[1];
      if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
      if (/\bart\.\s*\d+[a-z]*/i.test(body.slice(0, point.index))) continue;
      const segment = scope[1] === "§" ? "par" : "ust";
      const parent = `${articleId}-${segment}-${scope[2].toLowerCase()}`;
      const rows = rowsAtPrefix(articleId, "p", `${parent}-pkt-`);
      if (expandRows(rows, expression).length) {
        const start = scope.index + scope[0].length + point.index;
        add(start, start + point[0].length, 8);
      }
    }
  }

  const articleSubRange = new RegExp(String.raw`art\.\s*(\d+[a-z]*)\s+(ust\.|§)\s*${numExpr}`, "gi");
  for (const match of text.matchAll(articleSubRange)) {
    const expression = match[3];
    if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
    const targetArticle = actCode.startsWith("z")
      ? `${actCode}-par-${match[1].toLowerCase()}`
      : `${actCode}-art-${match[1].toLowerCase()}`;
    if (!articleMap.has(targetArticle)) continue;
    const kind = match[2] === "§" ? "par" : "u";
    const segment = kind === "par" ? "par" : "ust";
    const rows = rowsAtPrefix(targetArticle, kind, `${targetArticle}-${segment}-`);
    if (expandRows(rows, expression).length) add(match.index, match.index + match[0].length, 7);
  }

  const articlePointRange = new RegExp(String.raw`art\.\s*(\d+[a-z]*)\s+pkt\s*${numExpr}`, "gi");
  for (const match of text.matchAll(articlePointRange)) {
    const expression = match[2];
    if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
    const targetArticle = actCode.startsWith("z")
      ? `${actCode}-par-${match[1].toLowerCase()}`
      : `${actCode}-art-${match[1].toLowerCase()}`;
    if (!articleMap.has(targetArticle)) continue;
    const rows = rowsAtPrefix(targetArticle, "p", `${targetArticle}-pkt-`);
    if (expandRows(rows, expression).length) add(match.index, match.index + match[0].length, 7);
  }

  const subPoint = new RegExp(String.raw`(ust\.|§)\s*(\d+[a-z]*)\s+pkt\s+${numExpr}`, "gi");
  for (const match of text.matchAll(subPoint)) {
    const expression = match[3];
    if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
    const segment = match[1] === "§" ? "par" : "ust";
    const parent = `${articleId}-${segment}-${match[2].toLowerCase()}`;
    const rows = rowsAtPrefix(articleId, "p", `${parent}-pkt-`);
    if (expandRows(rows, expression).length) add(match.index, match.index + match[0].length, 6);
  }

  const pointLetter = new RegExp(String.raw`pkt\s*(\d+[a-z]*)\s+lit\.\s+${letExpr}`, "gi");
  for (const match of text.matchAll(pointLetter)) {
    const expression = match[2];
    if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
    const pointId = resolveLocal(articleId, unitId, "p", match[1]);
    if (!pointId) continue;
    const rows = rowsAtPrefix(articleId, "i", `${pointId}-lit-`);
    if (expandRows(rows, expression).length) add(match.index, match.index + match[0].length, 6);
  }

  const articleSubPoint = new RegExp(String.raw`art\.\s*(\d+[a-z]*)\s+(ust\.|§)\s*(\d+[a-z]*)\s+pkt\s+${numExpr}`, "gi");
  for (const match of text.matchAll(articleSubPoint)) {
    if (externalAfter(text, match.index + match[0].length)) continue;
    const expression = match[4];
    if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
    const targetArticle = actCode.startsWith("z")
      ? `${actCode}-par-${match[1].toLowerCase()}`
      : `${actCode}-art-${match[1].toLowerCase()}`;
    if (!articleMap.has(targetArticle)) continue;
    const segment = match[2] === "§" ? "par" : "ust";
    const parent = `${targetArticle}-${segment}-${match[3].toLowerCase()}`;
    const rows = rowsAtPrefix(targetArticle, "p", `${parent}-pkt-`);
    if (expandRows(rows, expression).length) add(match.index, match.index + match[0].length, 7);
  }

  const rangeDefinitions = [
    ["p", /\bpkt\s+((?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?)(?:\s*(?:,|i|lub|oraz)\s*(?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?))*)/gi],
    ["u", /\bust\.\s+((?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?)(?:\s*(?:,|i|lub|oraz)\s*(?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?))*)/gi],
    ["par", /§\s+((?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?)(?:\s*(?:,|i|lub|oraz)\s*(?:\d+[a-z]?(?:\s*[–-]\s*\d+[a-z]?)?))*)/g],
    ["i", /\blit\.\s+((?:[a-z](?:\s*[–-]\s*[a-z])?)(?:\s*(?:,|i|lub|oraz)\s*(?:[a-z](?:\s*[–-]\s*[a-z])?))*)(?![a-z])/gi],
  ];
  for (const [kind, re] of rangeDefinitions) {
    for (const match of text.matchAll(re)) {
      const expression = match[1];
      if (!/[–-]|,|\s(?:i|lub|oraz)\s/i.test(expression)) continue;
      if (expandExpression(articleId, unitId, kind, expression).length) {
        add(match.index, match.index + match[0].length, 3);
      }
    }
  }

  const articleRange = /\bart\.\s*(\d+[a-z]*)\s*[–-]\s*(\d+[a-z]*)/gi;
  for (const match of text.matchAll(articleRange)) {
    if (externalAfter(text, match.index + match[0].length)) continue;
    const rows = [];
    if (/^\d+$/.test(match[1]) && /^\d+$/.test(match[2])) {
      for (let n = Number(match[1]); n <= Number(match[2]); n += 1) {
        const id = actCode.startsWith("z") ? `${actCode}-par-${n}` : `${actCode}-art-${n}`;
        if (idMap.has(id)) rows.push(id);
      }
    } else {
      const articles = actBy(actCode)[3];
      const first = articles.findIndex((row) => row[2].replace(/^(Art\.|§)\s*/, "").toLowerCase() === match[1].toLowerCase());
      const last = articles.findIndex((row) => row[2].replace(/^(Art\.|§)\s*/, "").toLowerCase() === match[2].toLowerCase());
      if (first >= 0 && last >= 0) rows.push(...articles.slice(Math.min(first, last), Math.max(first, last) + 1));
    }
    if (rows.length) add(match.index, match.index + match[0].length, 6);
  }

  for (const [kind, re] of [
    ["p", /\bpkt\s+(\d+[a-z]*)/gi],
    ["i", /\blit\.\s+([a-z])/gi],
  ]) {
    for (const match of text.matchAll(re)) {
      if (resolveLocal(articleId, unitId, kind, match[1])) {
        add(match.index, match.index + match[0].length, 1);
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority
    || a.start - b.start
    || (b.end - b.start) - (a.end - a.start));
  const chosen = [];
  for (const candidate of candidates) {
    if (!chosen.some((other) => candidate.start < other.end && candidate.end > other.start)) {
      chosen.push(candidate);
    }
  }
  return chosen;
}

function repairSplitArticles(text, actCode, resolver) {
  const prefix = actCode.startsWith("z") ? `${actCode}-par-` : `${actCode}-art-`;
  return text.replace(/\bart\.\s*(\d+)\s+((?:\d+\s+){0,3}\d+[a-z]{1,4})\b/gi, (whole, first, tail) => {
    const parts = tail.trim().split(/\s+/);
    const candidates = [first + parts.join("")];
    for (let index = 0; index < parts.length; index += 1) {
      candidates.push(parts.slice(index).join(""));
    }
    const hit = candidates.find((candidate) => resolver.idMap.has(prefix + candidate.toLowerCase()));
    if (hit) return `art. ${hit}`;
    if (parts.length === 1 && /^\d+[a-z]{1,4}$/i.test(parts[0])) {
      return `art. ${first}${parts[0]}`;
    }
    return whole;
  });
}

export function repairSplitArticleData(data) {
  const resolver = createReferenceResolver(data);
  let repairedSplitArticles = 0;
  for (const row of iterateUnits(data)) {
    const joined = repairSplitArticles(row.unit[3], row.act[0], resolver)
      .replace(/\s+([,.;:])/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    if (joined === row.unit[3]) continue;
    row.unit[3] = joined;
    repairedSplitArticles += 1;
  }
  return { repairedSplitArticles };
}

export function cleanLegacyText(text, articleId, unitId, actCode, resolver) {
  let value = String(text ?? "");
  let removedMarkerRuns = 0;
  let repairedSplitArticles = 0;

  for (let pass = 0; pass < 12; pass += 1) {
    const candidates = referenceCandidates(value, articleId, unitId, actCode, resolver)
      .sort((a, b) => b.end - a.end);
    let changed = false;
    for (const candidate of candidates) {
      const match = value.slice(candidate.end).match(MARKER_RUN);
      if (!match) continue;
      value = value.slice(0, candidate.end) + value.slice(candidate.end + match[0].length);
      removedMarkerRuns += 1;
      changed = true;
    }
    if (!changed) break;
  }

  const joined = repairSplitArticles(value, actCode, resolver);
  if (joined !== value) repairedSplitArticles += 1;
  value = joined
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return { value, removedMarkerRuns, repairedSplitArticles };
}

export function cleanLegacyData(data) {
  const resolver = createReferenceResolver(data);
  const stats = { changedUnits: 0, removedMarkerRuns: 0, repairedSplitArticles: 0 };

  for (const act of data) {
    for (const article of act[3]) {
      article[4].forEach((unit, index) => {
        const unitId = unit[0] || `${article[0]}@@${index}`;
        const result = cleanLegacyText(unit[3], article[0], unitId, act[0], resolver);
        if (result.value !== unit[3]) stats.changedUnits += 1;
        stats.removedMarkerRuns += result.removedMarkerRuns;
        stats.repairedSplitArticles += result.repairedSplitArticles;
        unit[3] = result.value;
      });
    }
  }

  return stats;
}

export function iterateUnits(data) {
  const rows = [];
  for (const act of data) {
    for (const article of act[3]) {
      article[4].forEach((unit, index) => {
        rows.push({
          act,
          article,
          unit,
          key: unit[0] || `${article[0]}@@${index}`,
          text: String(unit[3] || ""),
        });
      });
    }
  }
  return rows;
}
