// controllers/festivalController.js
const pool = require('../db/connection');
const getFestivals = async (req, res) => {
  try {
    const { country, genre,art_form, search } = req.query;

    let query = `
  SELECT DISTINCT f.*, af.name AS art_form
  FROM festivals f
  LEFT JOIN art_forms af ON f.art_form_id = af.id
  LEFT JOIN festival_genres fg ON f.id = fg.festival_id
  LEFT JOIN genres g ON fg.genre_id = g.id
  WHERE 1=1
`;

    const values = [];
    let index = 1;

    if (country) {
      query += ` AND f.country ILIKE $${index}`;
      values.push(`%${country}%`);
      index++;
    }

    if (genre) {
      query += ` AND g.name ILIKE $${index}`;
      values.push(`%${genre}%`);
      index++;
    }
    if (art_form) {
  query += ` AND af.name ILIKE $${index}`;
  values.push(`%${art_form}%`);
  index++;
    }

    if (search) {
      query += ` AND (
        f.name ILIKE $${index}
        OR f.city ILIKE $${index}
      )`;
      values.push(`%${search}%`);
      index++;
    }

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getFestivals };