# Learn Prisma: Concepts in Your `schema.prisma`

This guide explains all the database concepts used in your project's [schema.prisma](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma) file. We will walk through each concept, show where it is used in your code, explain it in plain English, and provide links to the official Prisma documentation for further learning.

---

## 1. Datasource & Generators

At the very top of [schema.prisma](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L4-L12):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

* **`datasource`**: Tells Prisma which database to connect to. `provider = "postgresql"` means PostgreSQL is your database, and `url` is loaded from your `.env` file via `env("DATABASE_URL")`.
* **`generator`**: Tells Prisma to generate the TypeScript client code so you can run queries like `prisma.user.findMany()`.
  * **`output`**: By default, Prisma puts this code inside `node_modules`. Here, the senior has configured it to be generated in [src/generated/prisma](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/src/generated/prisma), which keeps it organized inside your code.
* **Learn More**: [Prisma Datasources Docs](https://www.prisma.io/docs/concepts/components/prisma-schema/data-sources) & [Prisma Generators Docs](https://www.prisma.io/docs/concepts/components/prisma-schema/generators)

---

## 2. Enums and Database Mapping (`@map` and `@@map`)

Look at [schema.prisma:L14-L18](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L14-L18):
```prisma
enum AdminStatus {
  Active @map("active")

  @@map("admin_status")
}
```

* **`enum`**: A list of allowed values. In this case, `AdminStatus` can only be `Active`.
* **`@map("active")`**: In TypeScript, you write `AdminStatus.Active` (with a capital A). However, in PostgreSQL, it is stored as lowercase `"active"`. `@map` translates between the two.
* **`@@map("admin_status")`**: In TypeScript, the type is called `AdminStatus` (PascalCase). In the database, the enum type itself is named `"admin_status"` (snake_case).
  > [!TIP]
  > Rules of thumb: Single `@` maps a field or enum value. Double `@@` maps a whole table or enum type definition.
* **Learn More**: [Prisma Enums Docs](https://www.prisma.io/docs/orm/prisma-schema/data-model/models#enums)

---

## 3. Fields, Timestamps, and Types

Look at [schema.prisma:L20-L32](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L20-L32):
```prisma
model Admin {
  id           Int         @id @default(autoincrement())
  firstname    String
  lastname     String
  email        String      @unique
  profileImage String?     @map("profile_image")
  status       AdminStatus @default(Active)
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  meta         AdminMeta?

  @@map("admin")
}
```

* **`Int` & `String`**: Standard datatypes.
* **`String?`**: The question mark makes the field **optional** (nullable). The admin doesn't need to upload a profile image.
* **`@id`**: Marks the field as the primary key.
* **`@default(autoincrement())`**: Automatically increments the ID (e.g. 1, 2, 3...) when new records are created.
* **`@unique`**: Enforces that no two records can have the same email address.
* **`@default(now())`**: Automatically saves the exact date and time the record was created.
* **`@updatedAt`**: A special decorator that automatically updates this field with the current date/time whenever you update the record.
* **Learn More**: [Prisma Models & Fields Docs](https://www.prisma.io/docs/orm/prisma-schema/data-model/models)

---

## 4. Native Database Types

Look at [schema.prisma:L89](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L89):
```prisma
attempt          Int          @default(1) @db.SmallInt
```

* **`@db.SmallInt`**: By default, `Int` in Prisma maps to a 4-byte integer in PostgreSQL. If a number is small (like OTP attempts, which will never exceed 10), you can use `@db.SmallInt` to map it to a 2-byte integer in Postgres, saving storage space.
* **Learn More**: [Prisma Native Database Types](https://www.prisma.io/docs/orm/prisma-schema/data-model/database-mapping#native-types-mapping)

---

## 5. Composite Constraints (`@@unique`)

Look at [schema.prisma:L97](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L97):
```prisma
@@unique([transport, target])
```

* **`@@unique`**: This is a composite unique constraint. It means you can have multiple records with `transport = Email`, and multiple records with `target = "test@example.com"`. However, you can **never** have more than one record with the exact combination of `transport = Email` AND `target = "test@example.com"`.
* **Learn More**: [Prisma Composite Unique Constraints](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#unique-1)

---

## 6. Relationships (The Most Important Part)

Prisma represents relationships in code, and automatically builds foreign keys in the database.

### A. One-to-One Relationship (1:1)
An `Admin` has exactly one `AdminMeta` record. Let's look at [schema.prisma:L34-L41](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L34-L41):
```prisma
model AdminMeta {
  admin        Admin   @relation(fields: [adminId], references: [id])
  adminId      Int     @unique() @map("admin_id")
}
```
* **`fields: [adminId]`**: The field in `AdminMeta` that acts as the foreign key.
* **`references: [id]`**: The field in the `Admin` table it points to.
* **`@unique` on `adminId`**: This is what makes it a **One-to-One** relationship. Because `adminId` is unique, you cannot have two different `AdminMeta` records pointing to the same `Admin`.
* **Learn More**: [Prisma One-to-One Relations Docs](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-one-relations)

### B. One-to-Many Relationship (1:N)
A `Setting` has many `SettingOption` records. Let's look at [schema.prisma:L128](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L128) & [L136-L145](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L136-L145):
```prisma
model Setting {
  options          SettingOption[] // A list of options
}

model SettingOption {
  setting   Setting @relation(fields: [settingId], references: [id])
  settingId Int     @map("setting_id")
}
```
* **`SettingOption[]`**: Notice the brackets. It tells Prisma that one `Setting` points to multiple `SettingOption` records.
* **No `@unique`**: Notice that `settingId` in `SettingOption` does NOT have `@unique`. This is what makes it a **One-to-Many** relationship (many options can point to the same setting).
* **Learn More**: [Prisma One-to-Many Relations Docs](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-many-relations)

### C. Self-Relation (Recursive Relation)
A settings folder or configuration might depend on another configuration. In this case, a `Setting` can depend on another `Setting`.
Look at [schema.prisma:L125-L127](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L125-L127):
```prisma
  subSettings      Setting[]       @relation("SubSettings")
  dependsOn        Setting?        @relation("SubSettings", fields: [parentId], references: [id])
  parentId         Int?            @map("parent_id")
```
* **`@relation("SubSettings")`**: Since both lines point to the `Setting` model itself, Prisma needs a name string (like `"SubSettings"`) to match them together.
* **`parentId`**: Points to the parent setting's `id`. It is optional (`Int?`), meaning top-level settings do not have a parent.
* **Learn More**: [Prisma Self-Relations Docs](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations)

### D. Composite Primary Keys (`@@id`)
Look at [schema.prisma:L147-L156](file:///c:/Users/coc91/OneDrive/Desktop/CFT/nestjs-server-template/prisma/schema.prisma#L147-L156):
```prisma
model UserSetting {
  userId    Int     @map("user_id")
  settingId Int     @map("setting_id")

  @@id([userId, settingId])
}
```
* **`@@id([userId, settingId])`**: Instead of having a single `id Int @id` column, this table uses a composite primary key. The combination of `userId` and `settingId` uniquely identifies each record. This is standard in join tables (like matching a user to their settings).
* **Learn More**: [Prisma Composite ID Docs](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#id-1)

---

## 7. Recommended Resources to Learn Prisma

1. **Official Prisma Quickstart**: The absolute best place to start. Takes 5 minutes to set up a clean sqlite sample.
   * [Prisma Quickstart Guide](https://www.prisma.io/docs/getting-started/quickstart)
2. **Interactive Playground**: If you want to test Prisma queries directly in your browser without installing anything.
   * [Prisma Playground](https://playground.prisma.io/)
3. **Prisma Schema Reference**: A complete reference for all schema types, attributes, and generators.
   * [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
