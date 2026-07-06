import 'dotenv/config';

const BASE_URL = 'http://localhost:9001';

async function testDelete() {
  console.log('--- Testing Delete API ---');

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

  // 2. Fetch all blogs to find one to delete
  const blogsRes = await api('/blogs');
  console.log('Blogs list status:', blogsRes.status, 'Blogs count:', blogsRes.data.count);
  if (blogsRes.data.count === 0) {
    console.log('No blogs found to delete.');
    return;
  }
  const targetBlogId = blogsRes.data.data[0].id;

  // 3. Delete the blog as Admin
  console.log(`Deleting blog with ID ${targetBlogId} as Admin...`);
  const deleteRes = await api(`/blogs/${targetBlogId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Delete API status:', deleteRes.status, 'Response:', deleteRes.data);
}

testDelete().catch(console.error);
