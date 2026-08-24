/**
 * TraceX Realistic Enterprise Log Dataset & Threat Scenario Generator
 * 
 * Provides 120+ realistic web/API/system logs covering normal traffic baseline,
 * authenticated API requests, static assets, and distinct security incident vectors.
 */

// Preset Attack Scenarios for live demonstration
export const PRESET_SCENARIOS = {
  BALANCED: {
    id: 'BALANCED',
    name: 'Standard Production Baseline (Mixed)',
    description: 'Realistic production web traffic with typical normal requests and isolated security incidents.',
    icon: 'Activity'
  },
  BRUTE_FORCE: {
    id: 'BRUTE_FORCE',
    name: 'Credential Stuffing / Auth Attack',
    description: 'High-frequency burst of failed logins and token abuse targeting /api/v1/auth/login.',
    icon: 'ShieldAlert'
  },
  SQL_INJECTION: {
    id: 'SQL_INJECTION',
    name: 'SQL Injection & Data Exfiltration Probe',
    description: 'Automated vulnerability scanner (sqlmap) probing backend database with UNION SELECT payloads.',
    icon: 'Database'
  },
  INTERNAL_OUTAGE: {
    id: 'INTERNAL_OUTAGE',
    name: 'Payment Service 500 Outage Spike',
    description: 'Sudden cascade of HTTP 500 Internal Server Errors caused by database pool exhaustion.',
    icon: 'ServerCrash'
  },
  DIR_TRAVERSAL: {
    id: 'DIR_TRAVERSAL',
    name: 'Directory Traversal & Reconnaissance',
    description: 'Probing hidden configuration files (/.env, /etc/passwd, /actuator/env) by external scanner.',
    icon: 'Search'
  }
};

const BASE_IPS = {
  OFFICE: '192.168.1.105',
  NORMAL_USERS: [
    '203.0.113.19', '198.51.100.42', '198.51.100.89', '203.0.113.220',
    '172.56.21.89', '142.250.190.46', '104.244.42.1', '157.240.22.35',
    '185.199.108.153', '13.107.42.16', '52.95.120.34', '35.186.224.25'
  ],
  ATTACKER_IPS: [
    '45.143.221.19',  // Known bulletproof hosting
    '185.220.101.5',  // Tor exit node
    '103.251.167.21', // Suspicious foreign ISP
    '194.26.29.112',  // Port scanner host
    '91.240.118.82'   // Botnet node
  ]
};

// Generate realistic logs
export function generateScenarioLogs(scenarioId = 'BALANCED') {
  const baseTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
  const logs = [];
  let logId = 1001;

  const addLog = (entry) => {
    logs.push({
      id: `LOG-${logId++}`,
      timestamp: new Date(baseTime + entry.offsetMs).toISOString(),
      source: entry.source || 'NGINX-Edge-01',
      ip: entry.ip,
      method: entry.method || 'GET',
      path: entry.path,
      statusCode: entry.statusCode,
      statusText: getStatusText(entry.statusCode),
      responseTime: entry.responseTime || Math.floor(Math.random() * 80 + 20),
      userAgent: entry.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      message: entry.message,
      payload: entry.payload || null,
      protocol: 'HTTP/2.0',
      clientLocation: entry.location || 'United States',
      raw: `${new Date(baseTime + entry.offsetMs).toISOString()} [${entry.source || 'NGINX-Edge-01'}] ${entry.ip} "${entry.method || 'GET'} ${entry.path} HTTP/2.0" ${entry.statusCode} ${entry.responseTime || 45}ms "${entry.userAgent || 'Chrome'}"`
    });
  };

  // Normal Baseline Traffic (60+ items)
  const normalEndpoints = [
    { path: '/api/v1/health', method: 'GET', status: 200, msg: 'Health check OK' },
    { path: '/api/v1/products', method: 'GET', status: 200, msg: 'Fetch product catalog successful' },
    { path: '/api/v1/products/item-8492', method: 'GET', status: 200, msg: 'Fetched single product details' },
    { path: '/static/css/main.3f89a2.css', method: 'GET', status: 200, msg: 'Static asset served from edge cache' },
    { path: '/static/js/bundle.a810b3.js', method: 'GET', status: 200, msg: 'JavaScript bundle loaded' },
    { path: '/api/v1/cart/items', method: 'GET', status: 200, msg: 'User active cart fetched' },
    { path: '/api/v1/cart/add', method: 'POST', status: 201, msg: 'Item added to shopping cart' },
    { path: '/api/v1/user/profile', method: 'GET', status: 200, msg: 'User authenticated profile retrieved' },
    { path: '/api/v1/notifications', method: 'GET', status: 200, msg: 'Polling unread notifications' },
    { path: '/favicon.ico', method: 'GET', status: 200, msg: 'Favicon requested' },
    { path: '/api/v1/search?q=wireless+headphones', method: 'GET', status: 200, msg: 'Product search executed with 24 results' },
    { path: '/api/v1/categories', method: 'GET', status: 200, msg: 'Categories listing returned' },
    { path: '/api/v1/recommendations', method: 'GET', status: 200, msg: 'ML recommendations returned' },
    { path: '/api/v1/auth/session/refresh', method: 'POST', status: 200, msg: 'JWT session refreshed cleanly' },
    { path: '/images/hero-banner.webp', method: 'GET', status: 304, msg: 'Not Modified (Cached)' }
  ];

  let currentOffset = 0;
  for (let i = 0; i < 70; i++) {
    currentOffset += Math.floor(Math.random() * 45000 + 10000); // 10s to 55s gap
    const ep = normalEndpoints[i % normalEndpoints.length];
    const ip = BASE_IPS.NORMAL_USERS[i % BASE_IPS.NORMAL_USERS.length];
    addLog({
      offsetMs: currentOffset,
      ip,
      method: ep.method,
      path: ep.path,
      statusCode: ep.status,
      message: ep.msg,
      location: i % 3 === 0 ? 'Germany' : (i % 2 === 0 ? 'United Kingdom' : 'United States')
    });
  }

  // Inject Scenario Specific Logs
  if (scenarioId === 'BALANCED' || scenarioId === 'BRUTE_FORCE') {
    // 1. Auth Brute Force Incident
    const attackerIp = BASE_IPS.ATTACKER_IPS[0];
    const bruteTimeOffset = 15 * 60 * 1000;
    for (let j = 0; j < 8; j++) {
      addLog({
        offsetMs: bruteTimeOffset + (j * 1200), // Rapid 1.2s intervals
        ip: attackerIp,
        source: 'Auth-Service-02',
        method: 'POST',
        path: '/api/v1/auth/login',
        statusCode: 401,
        message: `Authentication failure: Invalid password attempt for user admin_${j}`,
        payload: `{"username":"admin_${j}","attempt":${j + 1}}`,
        userAgent: 'python-requests/2.28.1',
        location: 'Russia (Bulletproof AS4932)',
        responseTime: 410
      });
    }
  }

  if (scenarioId === 'BALANCED' || scenarioId === 'SQL_INJECTION') {
    // 2. SQL Injection Exfiltration Wave
    const sqliAttacker = BASE_IPS.ATTACKER_IPS[1];
    const sqliTime = 28 * 60 * 1000;
    const payloads = [
      { path: "/api/v1/users?id=1%20OR%201=1", status: 200, msg: "Suspicious SQL syntax in query param: 1 OR 1=1" },
      { path: "/api/v1/users?id=1'%20UNION%20SELECT%20username,password_hash%20FROM%20admin_users--", status: 500, msg: "Database exception: Syntax error near 'UNION SELECT' at line 1" },
      { path: "/api/v1/orders/search?ref=ORD'--%20AND%20SLEEP(5)", status: 500, msg: "Database lock timeout: Query execution exceeded 5000ms", resp: 5200 },
      { path: "/api/v1/products?cat=electronics'%20AND%201=CAST((SELECT%20version())%20AS%20int)--", status: 500, msg: "PostgreSQL syntax error: Cannot cast string to integer" }
    ];

    payloads.forEach((item, idx) => {
      addLog({
        offsetMs: sqliTime + (idx * 3000),
        ip: sqliAttacker,
        source: 'API-Gateway-01',
        method: 'GET',
        path: item.path,
        statusCode: item.status,
        message: item.msg,
        userAgent: 'sqlmap/1.7.2#stable (https://sqlmap.org)',
        location: 'Netherlands (Tor Exit Node)',
        responseTime: item.resp || 820
      });
    });
  }

  if (scenarioId === 'BALANCED' || scenarioId === 'INTERNAL_OUTAGE') {
    // 3. Payment Gateway 500 Error Storm
    const outageTime = 42 * 60 * 1000;
    for (let k = 0; k < 6; k++) {
      const userIp = BASE_IPS.NORMAL_USERS[k % 4];
      addLog({
        offsetMs: outageTime + (k * 2500),
        ip: userIp,
        source: 'Payment-Processor-01',
        method: 'POST',
        path: '/api/v1/payments/process',
        statusCode: 500,
        message: 'Internal Server Error: PostgreSQL connection pool exhausted [Active: 100/100, Timeout: 30000ms]',
        payload: '{"amount": 149.99, "currency": "USD", "gateway": "Stripe"}',
        responseTime: 4850,
        location: 'United States'
      });
    }
    // Gateway Timeout 504
    addLog({
      offsetMs: outageTime + 18000,
      ip: BASE_IPS.NORMAL_USERS[1],
      source: 'NGINX-Edge-01',
      method: 'POST',
      path: '/api/v1/payments/process',
      statusCode: 504,
      message: 'Gateway Timeout: Upstream Payment-Processor-01 timed out after 60.00s',
      responseTime: 60000,
      location: 'United States'
    });
  }

  if (scenarioId === 'BALANCED' || scenarioId === 'DIR_TRAVERSAL') {
    // 4. Directory Traversal & Scanner Reconnaissance
    const scannerIp = BASE_IPS.ATTACKER_IPS[3];
    const scanTime = 50 * 60 * 1000;
    const scanPaths = [
      { path: '/.env', status: 404, msg: 'File probe: Sensitive environment variable file requested' },
      { path: '/.git/config', status: 404, msg: 'File probe: Git repository configuration requested' },
      { path: '/../../etc/passwd', status: 403, msg: 'Path traversal attempt blocked by Web Application Firewall (WAF)' },
      { path: '/actuator/env', status: 403, msg: 'Spring Actuator environment endpoint access blocked' },
      { path: '/wp-admin/install.php', status: 404, msg: 'Wordpress vulnerability scanner probe' },
      { path: '/api/v1/admin/roles/grant', status: 403, msg: 'Privilege escalation: Sudo role grant rejected for unauthorized session' }
    ];

    scanPaths.forEach((sp, idx) => {
      addLog({
        offsetMs: scanTime + (idx * 1500),
        ip: scannerIp,
        source: 'Edge-WAF-01',
        method: 'GET',
        path: sp.path,
        statusCode: sp.status,
        message: sp.msg,
        userAgent: 'Nikto/2.5.0 (Vulnerability Scanner)',
        location: 'Bulgaria',
        responseTime: 18
      });
    });
  }

  // Sort chronologically (most recent first for SOC view)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getStatusText(code) {
  const map = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return map[code] || 'Unknown';
}
