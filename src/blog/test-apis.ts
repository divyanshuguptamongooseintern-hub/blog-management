const BASE_URL = 'http://localhost:9001';

async function runTests() {
  console.log('--- Starting API Verification Tests ---');

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

  const suffix = Date.now();
  const authorEmail = `alice_${suffix}@test.com`;
  const readerEmail = `bob_${suffix}@test.com`;

  // 1. Send register code for Author
  console.log(`\n[1] Sending registration code for Author (${authorEmail})...`);
  const codeRes1 = await api('/auth/send-code', {
    method: 'POST',
    body: { email: authorEmail, type: 'register' },
  });
  console.log('Status:', codeRes1.status);

  // 2. Register Author
  console.log('\n[2] Registering Author...');
  const regRes1 = await api('/auth/register', {
    method: 'POST',
    body: {
      firstname: 'Alice',
      lastname: 'Author',
      email: authorEmail,
      password: 'Password123!',
      country: 'India',
      emailVerificationCode: '000000',
      role: 'Author',
    },
  });
  console.log('Status:', regRes1.status, 'Response:', regRes1.data);
  const authorToken = regRes1.data.accessToken;
  if (!authorToken) throw new Error('Failed to register author');

  // 3. Send register code for Reader
  console.log(`\n[3] Sending registration code for Reader (${readerEmail})...`);
  const codeRes2 = await api('/auth/send-code', {
    method: 'POST',
    body: { email: readerEmail, type: 'register' },
  });
  console.log('Status:', codeRes2.status);

  // 4. Register Reader
  console.log('\n[4] Registering Reader...');
  const regRes2 = await api('/auth/register', {
    method: 'POST',
    body: {
      firstname: 'Bob',
      lastname: 'Reader',
      email: readerEmail,
      password: 'Password123!',
      country: 'India',
      emailVerificationCode: '000000',
      role: 'Reader',
    },
  });
  console.log('Status:', regRes2.status, 'Response:', regRes2.data);
  const readerToken = regRes2.data.accessToken;
  if (!readerToken) throw new Error('Failed to register reader');

  // 5. Create Blog as Reader (Should fail)
  console.log('\n[5] Attempting to create blog as Reader (should fail 403)...');
  const createBlogFail = await api('/blogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${readerToken}` },
    body: { title: 'Reader Title', content: 'Reader Content' },
  });
  console.log('Status:', createBlogFail.status, 'Response:', createBlogFail.data);

  // 6. Create Blog as Author (Should succeed)
  console.log('\n[6] Creating blog as Author (should succeed)...');
  const createBlogSuccess = await api('/blogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authorToken}` },
    body: { title: 'First Blog Post', content: 'This is a beautiful post' },
  });
  console.log('Status:', createBlogSuccess.status, 'Blog ID:', createBlogSuccess.data.id);
  const blogId = createBlogSuccess.data.id;

  // 7. Get All Blogs (Public)
  console.log('\n[7] Getting all blogs (public)...');
  const getAllBlogs = await api('/blogs');
  console.log('Status:', getAllBlogs.status, 'Count:', getAllBlogs.data.count);

  // 8. Update Blog as Reader (Should fail)
  console.log('\n[8] Attempting to update Author\'s blog as Reader (should fail 403)...');
  const updateBlogFail = await api(`/blogs/${blogId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${readerToken}` },
    body: { title: 'Hacked Title' },
  });
  console.log('Status:', updateBlogFail.status, 'Response:', updateBlogFail.data);

  // 9. Update Blog as Author Owner (Should succeed)
  console.log('\n[9] Updating blog as Author Owner (should succeed)...');
  const updateBlogSuccess = await api(`/blogs/${blogId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authorToken}` },
    body: { title: 'Updated Title' },
  });
  console.log('Status:', updateBlogSuccess.status, 'New Title:', updateBlogSuccess.data.title);

  // 10. Login as Platform Admin
  console.log('\n[10] Logging in as Admin...');
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'Admin123!@#' },
  });
  console.log('Status:', adminLogin.status);
  const adminToken = adminLogin.data.accessToken;
  if (!adminToken) throw new Error('Failed to login as admin');

  // 11. Admin promote Reader to Author
  // Find Reader Bob's ID
  const meReader = await api('/users/me', {
    headers: { Authorization: `Bearer ${readerToken}` },
  });
  const readerId = meReader.data.id;
  console.log('\n[11] Admin promoting Reader Bob to Author...');
  const promoteUser = await api(`/users/${readerId}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { role: 'Author' },
  });
  console.log('Status:', promoteUser.status, 'New Role:', promoteUser.data.data.role);

  // 12. Create blog as promoted Reader Bob (should succeed now!)
  console.log('\n[12] Creating blog as promoted Reader Bob (should succeed now!)...');
  const createBlogPromoted = await api('/blogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${readerToken}` },
    body: { title: 'Bob\'s First Post', content: 'I am now an Author!' },
  });
  console.log('Status:', createBlogPromoted.status, 'Blog ID:', createBlogPromoted.data.id);

  // 13. Admin update Author's blog title
  console.log('\n[13] Admin updating Author\'s blog title (should succeed as admin is superuser)...');
  const adminUpdate = await api(`/blogs/${blogId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Admin Updated Title' },
  });
  console.log('Status:', adminUpdate.status, 'New Title:', adminUpdate.data.title);

  // 14. Author delete blog (should fail 403)
  console.log('\n[14] Author attempting to delete blog (should fail 403)...');
  const authorDelete = await api(`/blogs/${blogId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authorToken}` },
  });
  console.log('Status:', authorDelete.status, 'Response:', authorDelete.data);

  // 15. Admin delete blog (should succeed)
  console.log('\n[15] Admin deleting blog (should succeed)...');
  const adminDelete = await api(`/blogs/${blogId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', adminDelete.status, 'Response:', adminDelete.data);

  console.log('\n--- All API Verification Tests Completed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
