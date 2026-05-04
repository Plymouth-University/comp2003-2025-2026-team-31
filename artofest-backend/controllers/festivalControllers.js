// controllers/festivalController.js
const pool = require('../db/connection');

const getFestivals = async (req, res) => {
  try {
    const { country, genre, art_form, search } = req.query;

    let query = `
      SELECT 
        f.*,
        af.name AS art_form,
        COALESCE(
          json_agg(DISTINCT fi.image_url) FILTER (WHERE fi.image_url IS NOT NULL),
          '[]'
        ) AS festival_images
      FROM festivals f
      LEFT JOIN art_forms af ON f.art_form_id = af.id
      LEFT JOIN festival_genres fg ON f.id = fg.festival_id
      LEFT JOIN genres g ON fg.genre_id = g.id
      LEFT JOIN festival_images fi ON f.id = fi.festival_id
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

    query += `
      GROUP BY f.id, af.name
      ORDER BY f.id
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};



const getFestivalById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        f.*,
        af.name AS art_form,
        COALESCE(
          json_agg(DISTINCT fi.image_url) FILTER (WHERE fi.image_url IS NOT NULL),
          '[]'
        ) AS festival_images
      FROM festivals f
      LEFT JOIN art_forms af ON f.art_form_id = af.id
      LEFT JOIN festival_images fi ON f.id = fi.festival_id
      WHERE f.id = $1
      GROUP BY f.id, af.name
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Festival not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// ✅ CREATE FESTIVAL (ADMIN)
// ===============================
const createFestival = async (req, res) => {
  const {
    name,
    city,
    country,
    website,
    art_form,
    genres,
    images
  } = req.body;

  // 🔐 INPUT VALIDATION
  if (!name || !city || !country || !art_form) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (genres && !Array.isArray(genres)) {
    return res.status(400).json({ message: "Genres must be an array" });
  }

  if (images && !Array.isArray(images)) {
    return res.status(400).json({ message: "Images must be an array" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ ART FORM
    let artFormRes = await client.query(
      "SELECT id FROM art_forms WHERE name = $1",
      [art_form]
    );

    let artFormId;

    if (artFormRes.rows.length === 0) {
      const insert = await client.query(
        "INSERT INTO art_forms (name) VALUES ($1) RETURNING id",
        [art_form]
      );
      artFormId = insert.rows[0].id;
    } else {
      artFormId = artFormRes.rows[0].id;
    }

    // 2️⃣ FESTIVAL INSERT
    const festivalRes = await client.query(
      `INSERT INTO festivals (name, city, country, website, art_form_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, city, country, website || null, artFormId]
    );

    const festivalId = festivalRes.rows[0].id;

    // 3️⃣ GENRES
    if (genres && genres.length > 0) {
      for (const genre of genres) {
        if (!genre) continue;

        let g = await client.query(
          "SELECT id FROM genres WHERE name = $1",
          [genre]
        );

        let genreId;

        if (g.rows.length === 0) {
          const insert = await client.query(
            "INSERT INTO genres (name) VALUES ($1) RETURNING id",
            [genre]
          );
          genreId = insert.rows[0].id;
        } else {
          genreId = g.rows[0].id;
        }

        await client.query(
          "INSERT INTO festival_genres (festival_id, genre_id) VALUES ($1, $2)",
          [festivalId, genreId]
        );
      }
    }

    // 4️⃣ IMAGES
    if (images && images.length > 0) {
      for (const img of images) {
        if (!img) continue;

        await client.query(
          "INSERT INTO festival_images (festival_id, image_url) VALUES ($1, $2)",
          [festivalId, img]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Festival created successfully",
      festival_id: festivalId
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Failed to create festival" });
  } finally {
    client.release();
  }
};

// ===============================
// UPDATE FESTIVAL (ADMIN)
// ===============================
const updateFestival = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    city,
    country,
    website,
    art_form,
    genres,
    images
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // check festival exists
    const existing = await client.query(
      "SELECT id FROM festivals WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Festival not found" });
    }

    // ART FORM
    let artFormRes = await client.query(
      "SELECT id FROM art_forms WHERE name = $1",
      [art_form]
    );

    let artFormId;
    if (artFormRes.rows.length === 0) {
      const insert = await client.query(
        "INSERT INTO art_forms (name) VALUES ($1) RETURNING id",
        [art_form]
      );
      artFormId = insert.rows[0].id;
    } else {
      artFormId = artFormRes.rows[0].id;
    }

    // UPDATE FESTIVAL
    await client.query(
      `UPDATE festivals
       SET name=$1, city=$2, country=$3, website=$4, art_form_id=$5
       WHERE id=$6`,
      [name, city, country, website, artFormId, id]
    );

    // CLEAR OLD RELATIONS
    await client.query("DELETE FROM festival_genres WHERE festival_id = $1", [id]);
    await client.query("DELETE FROM festival_images WHERE festival_id = $1", [id]);

    // REINSERT GENRES
    if (genres) {
      for (const genre of genres) {
        let g = await client.query("SELECT id FROM genres WHERE name=$1", [genre]);

        let genreId;
        if (g.rows.length === 0) {
          const insert = await client.query(
            "INSERT INTO genres (name) VALUES ($1) RETURNING id",
            [genre]
          );
          genreId = insert.rows[0].id;
        } else {
          genreId = g.rows[0].id;
        }

        await client.query(
          "INSERT INTO festival_genres (festival_id, genre_id) VALUES ($1,$2)",
          [id, genreId]
        );
      }
    }

    // REINSERT IMAGES
    if (images) {
      for (const img of images) {
        await client.query(
          "INSERT INTO festival_images (festival_id, image_url) VALUES ($1,$2)",
          [id, img]
        );
      }
    }

    await client.query("COMMIT");

    res.json({ message: "Festival updated successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Failed to update festival" });
  } finally {
    client.release();
  }
};

// ===============================
// DELETE FESTIVAL (ADMIN)
// ===============================
const deleteFestival = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM festivals WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Festival not found" });
    }

    res.json({ message: "Festival deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete festival" });
  }
};


module.exports = {
  getFestivals,
  getFestivalById,
  createFestival,
  updateFestival,
  deleteFestival
};