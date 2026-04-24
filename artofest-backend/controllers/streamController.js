const pool = require('../db/connection');


//  GET ALL STREAMS (grouped by festival + category)
exports.getAllStreams = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.url,
        s.platform,
        f.id AS festival_id,
        f.name AS festival_name,
        c.name AS category
      FROM streams s
      JOIN festivals f ON s.festival_id = f.id
      JOIN stream_categories c ON s.category_id = c.id
      ORDER BY f.name, c.name;
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


//  GET STREAMS BY FESTIVAL
exports.getStreamsByFestival = async (req, res) => {
  const { festivalId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.url,
        s.platform,
        c.name AS category
      FROM streams s
      JOIN stream_categories c ON s.category_id = c.id
      WHERE s.festival_id = $1
      ORDER BY c.name;
    `, [festivalId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};