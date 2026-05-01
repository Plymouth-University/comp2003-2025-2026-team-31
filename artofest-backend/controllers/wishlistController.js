const pool = require("../db/connection");

exports.getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT f.* 
       FROM wishlist w
       JOIN festivals f ON f.id = w.festival_id
       WHERE w.profile_id = $1`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToWishlist = async (req, res) => {
  const userId = req.user.id;
  const { festival_id } = req.body;

  try {
    await pool.query(
      "INSERT INTO wishlist (profile_id, festival_id) VALUES ($1,$2)",
      [userId, festival_id]
    );

    res.json({ message: "Festival added to wishlist" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  const userId = req.user.id;
  const festivalId = req.params.festivalId;

  try {
    await pool.query(
      "DELETE FROM wishlist WHERE profile_id=$1 AND festival_id=$2",
      [userId, festivalId]
    );

    res.json({ message: "Festival removed from wishlist" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};