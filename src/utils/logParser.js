/**
 * TraceX Fast Multi-Format Log Parser
 * 
 * Optimized for high throughput (10,000+ entries) without freezing the UI thread.
 */

import { analyzeLogCollection } from './anomalyDetector';

export function parseRawLogs(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();

  // 1. Check if JSON Array
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return normalizeParsedEntries(parsed);
      }
    } catch (e) {
      console.warn('Failed JSON array parsing, falling back to lines parser');
    }
  }

  // Split lines efficiently
  const lines = text.split('\n');
  if (lines.length === 0) return [];

  const firstLine = lines[0].trim();

  // 2. Check if NDJSON (first line starts with { and ends with })
  if (firstLine.startsWith('{') && firstLine.endsWith('}')) {
    const ndjsonEntries = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        ndjsonEntries.push(JSON.parse(line));
      } catch (e) {
        // ignore invalid line
      }
    }
    if (ndjsonEntries.length > 0) {
      return normalizeParsedEntries(ndjsonEntries);
    }
  }

  // 3. Check if CSV (comma-separated with headers)
  if (firstLine.includes(',') && (
    firstLine.toLowerCase().includes('ip') || 
    firstLine.toLowerCase().includes('status') || 
    firstLine.toLowerCase().includes('timestamp') || 
    firstLine.toLowerCase().includes('request') ||
    firstLine.toLowerCase().includes('agent')
  )) {
    const csvLogs = parseCSVLines(lines);
    if (csvLogs.length > 0) {
      return normalizeParsedEntries(csvLogs);
    }
  }

  // 4. Fallback: Parse Nginx / Apache / Syslog line by line
  const parsedLogs = [];
  const regexCombined = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+|-)(?: "([^"]*)" "([^"]*)")?/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(regexCombined);
    if (match) {
      parsedLogs.push({
        id: `LOG-UP-${i + 1}`,
        timestamp: match[2],
        ip: match[1],
        method: match[3],
        path: match[4],
        statusCode: parseInt(match[5], 10),
        statusText: getStatusText(parseInt(match[5], 10)),
        responseTime: Math.floor(Math.random() * 80 + 20),
        userAgent: match[8] || 'Generic Browser',
        message: `${match[3]} ${match[4]} returned ${match[5]}`,
        raw: line,
        source: 'Ingested-Log-File',
        clientLocation: 'External Client'
      });
    } else {
      // Fast CSV / Delimited line fallback
      const parts = line.split(',');
      if (parts.length >= 4) {
        parsedLogs.push({
          id: `LOG-UP-${i + 1}`,
          timestamp: parts[0] ? parts[0].trim() : new Date().toISOString(),
          ip: parts[1] ? parts[1].trim() : '192.168.1.1',
          method: parts[2] ? parts[2].trim() : 'GET',
          statusCode: parts[3] ? parseInt(parts[3].trim(), 10) || 200 : 200,
          path: parts[2] ? parts[2].trim() : '/',
          userAgent: parts[4] ? parts[4].trim() : 'Standard Client',
          clientLocation: parts[6] ? parts[6].trim() : 'Unknown Location',
          message: `Request ${parts[2] || 'GET'} returned ${parts[3] || '200'}`,
          raw: line,
          source: 'CSV-Stream'
        });
      } else {
        // Simple regex fallback
        const ipMatch = line.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        const statusMatch = line.match(/\b(200|201|400|401|403|404|429|500|502|503|504)\b/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 200;

        parsedLogs.push({
          id: `LOG-UP-${i + 1}`,
          timestamp: new Date().toISOString(),
          ip: ipMatch ? ipMatch[0] : '10.0.0.1',
          method: 'GET',
          path: '/api/v1/resource',
          statusCode: status,
          statusText: getStatusText(status),
          responseTime: Math.floor(Math.random() * 80 + 20),
          userAgent: 'Uploaded Client',
          message: line.substring(0, 120),
          raw: line,
          source: 'Raw-Stream',
          clientLocation: 'Uploaded Stream'
        });
      }
    }
  }

  return normalizeParsedEntries(parsedLogs);
}

function parseCSVLines(lines) {
  const headerLine = lines[0].trim();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const entries = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;
    
    // Fast split for simple CSV rows
    const values = rawLine.includes('"') || rawLine.includes("'") ? splitCsvLine(rawLine) : rawLine.split(',');
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const val = values[j] ? values[j].trim().replace(/^["']|["']$/g, '') : '';
      obj[headers[j]] = val;
    }
    entries.push(obj);
  }
  return entries;
}

function splitCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

function normalizeParsedEntries(rawEntries) {
  const timestamp = Date.now();
  
  const normalized = rawEntries.map((e, idx) => {
    // Map flexible CSV header field names
    const status = parseInt(
      e.statusCode || e.status_code || e.status || e.code || 200, 
      10
    );
    const ip = e.ip || e.ip_address || e.client_ip || e.remote_addr || e.source_ip || '192.168.1.1';
    const method = (e.method || e.request_type || e.http_method || 'GET').toUpperCase();
    const path = e.path || e.endpoint || e.url || e.uri || e.request_type || '/api/resource';
    const userAgent = e.userAgent || e.user_agent || e.agent || 'Standard Client';
    const location = e.location || e.clientLocation || e.geo || e.country || 'Unknown';
    const msg = e.message || e.msg || `${method} ${path} (${status})`;

    return {
      id: e.id || `LOG-UPL-${idx + 1}`,
      timestamp: e.timestamp || e.time || e['@timestamp'] || new Date(timestamp - (rawEntries.length - idx) * 1000).toISOString(),
      source: e.source || e.service || e.host || 'Uploaded-Ingest',
      ip,
      method,
      path,
      statusCode: status,
      statusText: getStatusText(status),
      responseTime: parseInt(e.responseTime || e.latency || e.duration || Math.floor(Math.random() * 80 + 20), 10),
      userAgent,
      message: msg,
      payload: e.payload || e.body || null,
      protocol: e.protocol || 'HTTP/1.1',
      clientLocation: location,
      raw: e.raw || JSON.stringify(e)
    };
  });

  // Perform single O(N) fast analysis pass on the normalized batch
  return analyzeLogCollection(normalized);
}

function getStatusText(code) {
  const map = {
    200: 'OK', 201: 'Created', 204: 'No Content', 304: 'Not Modified',
    301: 'Moved Permanently', 302: 'Found',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
    429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway',
    503: 'Service Unavailable', 504: 'Gateway Timeout'
  };
  return map[code] || 'Unknown';
}
