import 'dotenv/config';

const BASE_URL = 'http://localhost:9001';

async function testPromote() {
  console.log('--- Testing Promote API ---');

  // Helper for JSON requests
  async function api(path: string, options: any = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    return { status: response.status, data };
  }

  // 1. Log in as Admin
  console.log('Logging in as Admin...');
  const loginRes = await api('/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'Admin123!@#' },
  });
  console.log('Admin login status:', loginRes.status);
  if (loginRes.status !== 200) {
    console.error('Failed to log in as Admin:', loginRes.data);
    return;
  }
  const adminToken = loginRes.data.accessToken;

  // 2. Query Bob's ID
  const usersRes = await api('/users'); // Let's try getting all users or filter
  console.log('Users list status:', usersRes.status);
  
  // 3. Promote Bob (id: 2) to Author
  console.log('Promoting Bob (ID 2) to Author...');
  const promoteRes = await api('/users/2/role', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { role: 'Author' },
  });
  console.log('Promote API status:', promoteRes.status, 'Response:', promoteRes.data);
}

testPromote().catch(console.error);
