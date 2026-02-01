const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_vjuqDml2Mp9i@ep-flat-fire-a1qb7tmi.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = fs.readFileSync(path.join(__dirname, '../prisma/init.sql'), 'utf8');

async function init() {
  const client = new Client(connectionString);
  await client.connect();
  
  console.log('Connected to database, executing SQL...');
  
  try {
    await client.query(sql);
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  await client.end();
}

init();
