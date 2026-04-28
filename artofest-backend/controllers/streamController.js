const pool = require('../db/connection');


// ✅ GET ALL STREAMS (GROUPED)
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

    const grouped = {};

    result.rows.forEach(row => {
      const festId = row.festival_id;

      if (!grouped[festId]) {
        grouped[festId] = {
          festival_id: festId,
          festival_name: row.festival_name,
          categories: {}
        };
      }

      if (!grouped[festId].categories[row.category]) {
        grouped[festId].categories[row.category] = [];
      }

      grouped[festId].categories[row.category].push({
        id: row.id,
        title: row.title,
        url: row.url,
        platform: row.platform
      });
    });

    // convert categories object → array
    const response = Object.values(grouped).map(festival => ({
      festival_id: festival.festival_id,
      festival_name: festival.festival_name,
      categories: Object.entries(festival.categories).map(
        ([name, streams]) => ({
          name,
          streams
        })
      )
    }));

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// ✅ GET STREAMS BY FESTIVAL (GROUPED)
exports.getStreamsByFestival = async (req, res) => {
  const { festivalId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.url,
        s.platform,
        c.name AS category,
        f.name AS festival_name
      FROM streams s
      JOIN stream_categories c ON s.category_id = c.id
      JOIN festivals f ON s.festival_id = f.id
      WHERE s.festival_id = $1
      ORDER BY c.name;
    `, [festivalId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No streams found" });
    }

    const grouped = {
      festival_id: festivalId,
      festival_name: result.rows[0].festival_name,
      categories: {}
    };

    result.rows.forEach(row => {
      if (!grouped.categories[row.category]) {
        grouped.categories[row.category] = [];
      }

      grouped.categories[row.category].push({
        id: row.id,
        title: row.title,
        url: row.url,
        platform: row.platform
      });
    });

    grouped.categories = Object.entries(grouped.categories).map(
      ([name, streams]) => ({
        name,
        streams
      })
    );

    res.json(grouped);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};