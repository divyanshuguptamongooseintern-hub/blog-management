import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

async function check() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany();
  console.log('--- Current Registered Users ---');
  console.log(users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  await prisma.$disconnect();
}

check().catch(console.error);
