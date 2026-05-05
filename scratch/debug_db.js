const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- DATABASE CHECK ---');
    console.log('Total Users:', users.length);
    users.forEach(u => console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email}`));
    console.log('----------------------');
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
