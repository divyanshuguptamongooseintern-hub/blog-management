# Blog Management System - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Blog Management System APIs using an API client like **Thunder Client** or **Postman**.

---

## 🚀 Environment Setup

* **Base URL**: `http://localhost:9001`
* **Default OTP Code**: `000000` (pre-configured for development)
* **Default Admin Credentials**:
  * **Email**: `admin@example.com`
  * **Password**: `Admin123!@#`

---

## 🔑 Phase 1: Register & Log In as an Author (Alice)

### 1. Request OTP Code for Alice
* **Method**: `POST`
* **URL**: `{{BaseURL}}/auth/send-code`
* **Headers**: `Content-Type: application/json`
* **Body (JSON)**:
  ```json
  {
    "email": "alice@test.com",
    "type": "register"
  }
  ```
* **Expected Response**: `201 Created`

### 2. Register Alice with "Author" Role
* **Method**: `POST`
* **URL**: `{{BaseURL}}/auth/register`
* **Headers**: `Content-Type: application/json`
* **Body (JSON)**:
  ```json
  {
    "firstname": "Alice",
    "lastname": "Author",
    "email": "alice@test.com",
    "password": "Password123!",
    "country": "India",
    "emailVerificationCode": "000000",
    "role": "Author"
  }
  ```
* **Expected Response**: `201 Created` containing `accessToken`.
* **Action**: **Copy this `accessToken`** to your clipboard. We'll call this **`ALICE_TOKEN`**.

---

## 🔑 Phase 2: Register & Log In as a Reader (Bob)

### 3. Request OTP Code for Bob
* **Method**: `POST`
* **URL**: `{{BaseURL}}/auth/send-code`
* **Headers**: `Content-Type: application/json`
* **Body (JSON)**:
  ```json
  {
    "email": "bob@test.com",
    "type": "register"
  }
  ```
* **Expected Response**: `201 Created`

### 4. Register Bob with "Reader" Role
* **Method**: `POST`
* **URL**: `{{BaseURL}}/auth/register`
* **Headers**: `Content-Type: application/json`
* **Body (JSON)**:
  ```json
  {
    "firstname": "Bob",
    "lastname": "Reader",
    "email": "bob@test.com",
    "password": "Password123!",
    "country": "India",
    "emailVerificationCode": "000000",
    "role": "Reader"
  }
  ```
* **Expected Response**: `201 Created` containing `accessToken`.
* **Action**: **Copy this `accessToken`** to your clipboard. We'll call this **`BOB_TOKEN`**.

---

## 📝 Phase 3: Test Create Blog Permissions

### 5. Create Blog as Reader Bob (Should Fail)
* **Method**: `POST`
* **URL**: `{{BaseURL}}/blogs`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer BOB_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "title": "Bob's Attempts",
    "content": "Readers shouldn't be allowed to post blogs."
  }
  ```
* **Expected Response**: `403 Forbidden` (`"Forbidden resource"`)

### 6. Create Blog as Author Alice (Should Succeed)
* **Method**: `POST`
* **URL**: `{{BaseURL}}/blogs`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer ALICE_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "title": "Alice's First Post",
    "content": "This is Alice's masterpiece blog post."
  }
  ```
* **Expected Response**: `201 Created` returning the new blog post object.
* **Action**: **Copy the `id`** of the created blog post (e.g. `1`). We'll call this **`BLOG_ID`**.

---

## 📝 Phase 4: Test Blog Ownership & Public Fetching

### 7. Try to Edit Alice's Blog as Reader Bob (Should Fail)
* **Method**: `PATCH`
* **URL**: `{{BaseURL}}/blogs/1` (replace `1` with `BLOG_ID` if different)
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer BOB_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "title": "Hacked Title"
  }
  ```
* **Expected Response**: `403 Forbidden` (`"You are not authorized to update this blog post"`)

### 8. Edit Own Blog as Author Alice (Should Succeed)
* **Method**: `PATCH`
* **URL**: `{{BaseURL}}/blogs/1`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer ALICE_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "title": "Alice's Updated Title"
  }
  ```
* **Expected Response**: `200 OK` showing the updated title.

### 9. Fetch All Blogs Publicly (Should Succeed)
* **Method**: `GET`
* **URL**: `{{BaseURL}}/blogs`
* **Headers**: *None*
* **Expected Response**: `200 OK` listing the blogs.

---

## 👑 Phase 5: Admin Authorization & Role Management

### 10. Log In as Platform Admin
* **Method**: `POST`
* **URL**: `{{BaseURL}}/auth/login`
* **Headers**: `Content-Type: application/json`
* **Body (JSON)**:
  ```json
  {
    "email": "admin@example.com",
    "password": "Admin123!@#"
  }
  ```
* **Expected Response**: `200 OK` containing `accessToken`.
* **Action**: **Copy this `accessToken`** to your clipboard. We'll call this **`ADMIN_TOKEN`**.

### 11. Find Reader Bob's User ID
* **Method**: `GET`
* **URL**: `{{BaseURL}}/users/me`
* **Headers**: `Authorization: Bearer BOB_TOKEN`
* **Expected Response**: `200 OK` containing Bob's profile, copy his `id` (e.g. `2`). We'll call this **`BOB_USER_ID`**.

### 12. Promote Bob from Reader to Author (Admin Only)
* **Method**: `PATCH`
* **URL**: `{{BaseURL}}/users/2/role` (replace `2` with `BOB_USER_ID`)
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer ADMIN_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "role": "Author"
  }
  ```
* **Expected Response**: `200 OK` showing role promoted to `Author`.

### 13. Test Promoted Bob Creating a Blog (Should Now Succeed!)
* **Method**: `POST`
* **URL**: `{{BaseURL}}/blogs`
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer BOB_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "title": "Bob's First Blog",
    "content": "Now that the Admin promoted me, I can write posts!"
  }
  ```
* **Expected Response**: `201 Created`

---

## 👑 Phase 6: Superuser Actions & Deleting Blogs

### 14. Admin Editing Author's Post (Should Succeed)
* **Method**: `PATCH`
* **URL**: `{{BaseURL}}/blogs/1` (Alice's blog ID)
* **Headers**:
  * `Content-Type: application/json`
  * `Authorization: Bearer ADMIN_TOKEN`
* **Body (JSON)**:
  ```json
  {
    "title": "Admin Moderated Title"
  }
  ```
* **Expected Response**: `200 OK` showing updated title.

### 15. Admin Deleting Blog Post (Should Succeed)
* **Method**: `DELETE`
* **URL**: `{{BaseURL}}/blogs/1`
* **Headers**: `Authorization: Bearer ADMIN_TOKEN`
* **Expected Response**: `200 OK` (`{"status": "success", "message": "Blog post 1 deleted successfully"}`).
