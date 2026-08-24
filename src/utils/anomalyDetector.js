/**
 * TraceX Fast & Human-Readable Anomaly Scoring Engine
 * 
 * Performance Optimized: O(N) single-pass evaluation for fast handling of 10,000+ logs.
 */

export function evaluateLogAnomaly(log, ipFrequencyCount = 1) {
  let scorePoints = 0;
  const rulesTriggered = [];

  const status = parseInt(log.statusCode || log.status || log.status_code || 200, 10);
  const path = (log.path || log.request_type || log.uri || log.endpoint || '').toLowerCase();
  const message = (log.message || log.msg || '').toLowerCase();
  const payload = (log.payload || '').toLowerCase();
  const userAgent = (log.userAgent || log.user_agent || '').toLowerCase();
  const combinedText = `${path} ${message} ${payload}`;

  // Rule 1: HTTP 500 Server Error (+40 points)
  if (status >= 500) {
    scorePoints += 40;
    rulesTriggered.push({
      rule: 'HTTP 500 Server Error',
      points: 40,
      description: `Server crash or backend unhandled error (HTTP ${status})`
    });
  } 
  // Rule 2: HTTP 403 Forbidden or 401 Unauthorized (+25 points)
  else if (status === 403 || status === 401) {
    scorePoints += 25;
    rulesTriggered.push({
      rule: 'HTTP Access Denied',
      points: 25,
      description: `Unauthorized access or permission failure (HTTP ${status})`
    });
  } 
  // Rule 2b: HTTP 429 Rate Limited (+25 points)
  else if (status === 429) {
    scorePoints += 25;
    rulesTriggered.push({
      rule: 'Rate Limit Exceeded',
      points: 25,
      description: 'Too many requests sent in short interval (HTTP 429)'
    });
  }

  // Rule 3: Suspicious Attack Keywords (+45 points)
  let foundKeyword = null;
  if (/union\s+select|select\s+.*\s+from|drop\s+table|or\s+1=1/i.test(combinedText)) {
    foundKeyword = 'SQL Injection (UNION / SELECT / 1=1)';
  } else if (/\.\.\/|\.env|\/etc\/passwd|wp-admin|actuator/i.test(combinedText)) {
    foundKeyword = 'Path Traversal / Secret Probe (../.. or .env)';
  } else if (/<script|javascript:|onerror=/i.test(combinedText)) {
    foundKeyword = 'Cross-Site Scripting (XSS)';
  } else if (/whoami|cat\s+\/etc|id\b/i.test(combinedText)) {
    foundKeyword = 'Command Execution Probe';
  }

  if (foundKeyword) {
    scorePoints += 45;
    rulesTriggered.push({
      rule: 'Attack Pattern Match',
      points: 45,
      description: `Detected malicious string signature: ${foundKeyword}`
    });
  }

  // Rule 4: High Request Frequency Burst (+30 points)
  if (ipFrequencyCount >= 5) {
    scorePoints += 30;
    rulesTriggered.push({
      rule: 'High Request Velocity',
      points: 30,
      description: `High request frequency (${ipFrequencyCount} requests from IP ${log.ip})`
    });
  }

  // Rule 5: Security Scanner User-Agent (+20 points)
  if (/sqlmap|nikto|nmap|gobuster|dirbuster|hydra|python-requests|bot/i.test(userAgent)) {
    scorePoints += 20;
    rulesTriggered.push({
      rule: 'Security Scanner / Bot User-Agent',
      points: 20,
      description: `Automated scanner or bot signature (${log.userAgent || log.user_agent})`
    });
  }

  // Rule 6: High Latency (>3000ms) (+15 points)
  const latency = parseInt(log.responseTime || log.latency || 0, 10);
  if (latency > 3000) {
    scorePoints += 15;
    rulesTriggered.push({
      rule: 'Response Latency Spike',
      points: 15,
      description: `Extreme response latency (${latency}ms indicates slow query or database lock)`
    });
  }

  // Cap final score at 100 points (1.00)
  const finalPoints = Math.min(100, scorePoints);
  const normalizedScore = Number((finalPoints / 100).toFixed(2));

  // Determine Classification
  let anomalyStatus = 'Normal';
  let severity = 'low';

  if (finalPoints >= 65) {
    anomalyStatus = 'Anomalous';
    severity = finalPoints >= 85 ? 'critical' : 'high';
  } else if (finalPoints >= 35) {
    anomalyStatus = 'Suspicious';
    severity = 'medium';
  } else {
    anomalyStatus = 'Normal';
    severity = 'low';
  }

  return {
    anomalyScore: normalizedScore,
    anomalyPoints: finalPoints,
    anomalyStatus,
    severity,
    rulesTriggered,
    flagReasons: rulesTriggered.length > 0 ? rulesTriggered.map(r => `${r.rule} (+${r.points} pts)`) : ['Baseline Normal Traffic'],
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Optimized O(N) Collection Analysis
 */
export function analyzeLogCollection(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return [];

  // O(N) pass to count requests per IP
  const ipCounts = new Map();
  for (let i = 0; i < logs.length; i++) {
    const ip = logs[i].ip || logs[i].ip_address || logs[i].client_ip;
    if (ip) {
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    }
  }

  // O(N) pass to evaluate anomaly for each log
  return logs.map(log => {
    const ip = log.ip || log.ip_address || log.client_ip;
    const freq = ip ? (ipCounts.get(ip) || 1) : 1;
    const analysis = evaluateLogAnomaly(log, freq);

    return {
      ...log,
      anomalyScore: analysis.anomalyScore,
      anomalyPoints: analysis.anomalyPoints,
      anomalyStatus: analysis.anomalyStatus,
      severity: log.severity || analysis.severity,
      detectionDetails: {
        rulesTriggered: analysis.rulesTriggered,
        flagReasons: analysis.flagReasons,
        evaluatedAt: analysis.evaluatedAt
      }
    };
  });
}
