/**
 * TraceX Tier-3 AI Incident Copilot
 * 
 * Invoked downstream ONLY after an anomaly has been flagged by our simple algorithm.
 * Supports:
 * 1. Live Google Gemini API (if user configures API Key)
 * 2. Live OpenAI / Groq / Custom REST API (if user configures API Key)
 * 3. Built-in Local Intelligent Reasoning Engine (if no API Key is set or on network error)
 */

export function getAIConfig() {
  try {
    const saved = localStorage.getItem('tracex_ai_config');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveAIConfig(config) {
  try {
    localStorage.setItem('tracex_ai_config', JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI config to localStorage', e);
  }
}

/**
 * Generates dynamic contextual AI explanation
 */
export async function generateAIExplanation(log, detectionDetails = {}) {
  const config = getAIConfig();

  // If user provided an API Key, attempt Live LLM API call
  if (config.apiKey) {
    try {
      if (config.provider === 'openai') {
        return await fetchOpenAIExplanation(log, detectionDetails, config);
      } else {
        return await fetchGeminiExplanation(log, detectionDetails, config);
      }
    } catch (apiError) {
      console.warn('Live AI API Error, using intelligent local engine:', apiError);
    }
  }

  // Fallback: Local Tier-3 Synthesis Engine
  return await generateLocalSynthesis(log, detectionDetails);
}

/**
 * Fetch from Live Google Gemini API
 */
async function fetchGeminiExplanation(log, detectionDetails, config) {
  const modelName = config.modelName || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`;

  const prompt = `You are a Senior Tier-3 Security Engineer. Analyze this server log anomaly:
Log Entry: ${JSON.stringify(log)}
Rules Triggered: ${JSON.stringify(detectionDetails.rulesTriggered || [])}

Respond ONLY with valid JSON in this structure:
{
  "whatHappened": "Plain-English summary of what occurred",
  "whyUnusual": "Plain-English explanation of why this deviates from baseline traffic",
  "rootCause": "Possible technical root cause or vulnerability",
  "recommendedNextSteps": ["Step 1 containment action", "Step 2 action", "Step 3 action"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  const parsed = JSON.parse(text);

  return {
    whatHappened: parsed.whatHappened || 'Anomalous event recorded.',
    whyUnusual: parsed.whyUnusual || 'Behavior deviates from normal traffic baseline.',
    rootCause: parsed.rootCause || 'Potential backend configuration or input vulnerability.',
    recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps) ? parsed.recommendedNextSteps : ['Inspect server logs.', 'Block suspicious IP.'],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Fetch from Live OpenAI compatible API
 */
async function fetchOpenAIExplanation(log, detectionDetails, config) {
  const modelName = config.modelName || 'gpt-4o-mini';
  const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;

  const prompt = `You are a Senior Tier-3 Security Engineer. Analyze this server log anomaly:
Log Entry: ${JSON.stringify(log)}
Rules Triggered: ${JSON.stringify(detectionDetails.rulesTriggered || [])}

Respond ONLY with valid JSON containing:
{
  "whatHappened": "Plain-English summary of what occurred",
  "whyUnusual": "Plain-English explanation of why this deviates from baseline traffic",
  "rootCause": "Possible technical root cause or vulnerability",
  "recommendedNextSteps": ["Step 1 containment action", "Step 2 action", "Step 3 action"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty OpenAI response');
  const parsed = JSON.parse(text);

  return {
    whatHappened: parsed.whatHappened || 'Anomalous event recorded.',
    whyUnusual: parsed.whyUnusual || 'Behavior deviates from normal traffic baseline.',
    rootCause: parsed.rootCause || 'Potential backend software vulnerability.',
    recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps) ? parsed.recommendedNextSteps : ['Inspect application logs.', 'Apply firewall ACL drop rule.'],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Built-in Local Tier-3 Synthesis Engine
 */
async function generateLocalSynthesis(log, detectionDetails = {}) {
  await new Promise(resolve => setTimeout(resolve, 300));

  const status = parseInt(log.statusCode || 200, 10);
  const ip = log.ip || '192.168.1.1';
  const path = log.path || '/';
  const method = log.method || 'GET';
  const userAgent = log.userAgent || 'Unknown';
  const message = log.message || '';
  const payload = log.payload || '';
  const latency = log.responseTime || 40;

  let whatHappened = '';
  let whyUnusual = '';
  let rootCause = '';
  const nextSteps = [];

  const isSqli = /union|select|sleep\(|1=1|--/i.test(path + message + payload);
  const isAuth = /login|auth|password|token/i.test(path) && (status === 401 || status === 403);
  const isTraversal = /\.\.\/|\.env|\/etc\/passwd|wp-admin|actuator/i.test(path);
  const isServerCrash = status >= 500;

  if (isSqli) {
    whatHappened = `At ${new Date(log.timestamp).toLocaleTimeString()}, an incoming HTTP ${method} request from IP ${ip} targeted endpoint '${path}' containing raw SQL query payloads ('UNION SELECT' / boolean logic).`;
    whyUnusual = `The request contained malicious SQL keywords attempting to bypass authentication and exfiltrate database table contents.`;
    rootCause = `Unsanitized user input concatenated directly into database query parameters in '${path}' without prepared statement parameter binding.`;
    nextSteps.push(`Immediately block attacker IP ${ip} in edge firewall / iptables rules.`);
    nextSteps.push(`Refactor query logic in '${path}' to use parameterized prepared statements.`);
    nextSteps.push(`Audit database query logs from IP ${ip} for potential data leaks.`);
  } else if (isAuth) {
    whatHappened = `An external client from IP ${ip} dispatched rapid authentication requests to '${path}', resulting in HTTP ${status} Access Denied.`;
    whyUnusual = `High velocity of failed login attempts using automated tools (${userAgent}) indicating password spraying or brute force abuse.`;
    rootCause = `Missing IP-based adaptive rate limiting (Redis token bucket) on the authentication route.`;
    nextSteps.push(`Enable strict rate limiting (max 5 attempts per 5 minutes per IP) on '${path}'.`);
    nextSteps.push(`Add temporary IP ban for ${ip} on reverse proxy.`);
    nextSteps.push(`Enforce multi-factor authentication (MFA) prompts.`);
  } else if (isTraversal) {
    whatHappened = `A client at IP ${ip} attempted to access sensitive internal server files '${path}' using scanner tool '${userAgent}'.`;
    whyUnusual = `Attempting to access restricted system dotfiles (.env, /etc/passwd) deviating from public application routes.`;
    rootCause = `Vulnerability scanner probing for unlinked sensitive environment files or Nginx root directory misconfiguration.`;
    nextSteps.push(`Configure Nginx/Apache to explicitly deny access to hidden files ('location ~ /\\. { deny all; }').`);
    nextSteps.push(`Add IP ${ip} to automated WAF drop list.`);
  } else if (isServerCrash) {
    whatHappened = `The backend service threw an unhandled internal server exception (HTTP ${status}) while processing a ${method} request on '${path}'.`;
    whyUnusual = `HTTP ${status} indicates backend microservice crash or database connection pool exhaustion (${latency}ms latency).`;
    rootCause = `Uncaught database connection pool timeout or backend unhandled null pointer exception.`;
    nextSteps.push(`Inspect backend application stack trace matching timestamp ${log.timestamp}.`);
    nextSteps.push(`Increase database connection pool capacity and set query timeouts.`);
  } else {
    whatHappened = `An anomalous HTTP ${method} request was received from ${ip} targeting '${path}' resulting in HTTP status code ${status}.`;
    whyUnusual = `Multiple point rules were triggered due to non-standard HTTP status code or frequency velocity.`;
    rootCause = `Unhandled edge case in API controller parameters.`;
    nextSteps.push(`Review server application error logs for endpoint '${path}'.`);
    nextSteps.push(`Verify client permission roles for IP ${ip}.`);
  }

  return {
    whatHappened,
    whyUnusual,
    rootCause,
    recommendedNextSteps: nextSteps,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Interactive Copilot Q&A (Supports Live LLM API + Smart Local Engine)
 */
export async function askCopilotQuestion(log, userQuestion, aiReport) {
  const config = getAIConfig();

  if (config.apiKey) {
    try {
      if (config.provider === 'openai') {
        const res = await fetchOpenAIChat(log, userQuestion, aiReport, config);
        if (res) return res;
      } else {
        const res = await fetchGeminiChat(log, userQuestion, aiReport, config);
        if (res) return res;
      }
    } catch (e) {
      console.warn('Live AI Chat Error, falling back to local reasoning:', e);
    }
  }

  // Local Intelligent Q&A Response Generator
  await new Promise(resolve => setTimeout(resolve, 350));
  const q = userQuestion.toLowerCase();

  if (q.includes('firewall') || q.includes('block') || q.includes('iptables') || q.includes('rule') || q.includes('ip')) {
    return `To block IP ${log.ip} across your network infrastructure:\n\n1. Linux iptables Firewall:\n\`\`\`bash\nsudo iptables -A INPUT -s ${log.ip} -j DROP\n\`\`\`\n\n2. Nginx Web Server Rule:\n\`\`\`nginx\ndeny ${log.ip};\n\`\`\`\n\n3. Cloudflare WAF:\nCreate an IP Access Rule to Block ${log.ip} across all zones.`;
  }

  if (q.includes('code') || q.includes('fix') || q.includes('patch') || q.includes('remediate') || q.includes('sql')) {
    return `To remediate the vulnerability on \`${log.path}\`:\n\n1. Use Parameterized Queries (Prepared Statements):\n\`\`\`javascript\n// DO NOT concatenate user input into queries\nconst result = fontQuery('SELECT * FROM users WHERE id = $1', [userId]);\n\`\`\`\n\n2. Input Validation:\nSanitize incoming query parameters using strict schema validators (e.g. Zod / Joi).`;
  }

  if (q.includes('why') || q.includes('explain') || q.includes('score') || q.includes('points') || q.includes('flag')) {
    return `Log ID ${log.id} was flagged with ${log.anomalyPoints || Math.round(log.anomalyScore * 100)} Anomaly Points based on:\n\n- HTTP Status: ${log.statusCode}\n- Target Route: ${log.path}\n- Source IP: ${log.ip}\n- Client Agent: ${log.userAgent || 'Standard Client'}\n\nOur deterministic algorithm scored this request as ${log.anomalyStatus.toUpperCase()} due to rule pattern violations.`;
  }

  return `Regarding Log ${log.id} (${log.method} ${log.path} [HTTP ${log.statusCode}] from ${log.ip}):\n\nThe recorded incident score is ${log.anomalyPoints || Math.round(log.anomalyScore * 100)} Points (${log.anomalyStatus}). Primary recommendation: Apply rate limiting on endpoint '${log.path}' and enforce an active IP drop rule for ${log.ip}.`;
}

async function fetchGeminiChat(log, question, report, config) {
  const modelName = config.modelName || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`;
  const prompt = `You are a Senior Cybersecurity Assistant. Answer the security engineer's question directly and concisely:
Log Entry: ${JSON.stringify(log)}
Incident Analysis: ${JSON.stringify(report)}
User Question: ${question}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!res.ok) {
    throw new Error(`Gemini Chat error: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function fetchOpenAIChat(log, question, report, config) {
  const modelName = config.modelName || 'gpt-4o-mini';
  const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;
  const prompt = `You are a Senior Cybersecurity Assistant. Answer the security engineer's question directly and concisely:
Log Entry: ${JSON.stringify(log)}
Incident Analysis: ${JSON.stringify(report)}
User Question: ${question}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI Chat error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}
