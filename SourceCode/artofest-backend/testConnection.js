const pool = require('./db/connection');

async function testDB() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database Connected Successfully!');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('❌ Database Connection Failed');
    console.error(error);
  } finally {
    pool.end();
  }
}

testDB();