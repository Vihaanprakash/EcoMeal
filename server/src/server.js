import express from "express";
import cors from "cors";
import { db, getListing, getReservationRows } from "./db.js";
import { calculateRisk } from "./risk.js";

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "FoodSaver API" });
});

// app.get("/api/listings", (req, res) => {
//   const { search = "", category = "All", businessId } = req.query;

//   let sql = `
//     SELECT l.*, b.name AS business_name, b.address AS business_address
//     FROM listings l
//     JOIN businesses b ON b.id = l.business_id
//     WHERE l.status = 'ACTIVE'
//   `;
//   const params = [];

//   if (search) {
//     sql += " AND (LOWER(l.name) LIKE LOWER(?) OR LOWER(l.description) LIKE LOWER(?) OR LOWER(b.name) LIKE LOWER(?))";
//     const term = `%${search}%`;
//     params.push(term, term, term);
//   }

//   if (category && category !== "All") {
//     sql += " AND l.category = ?";
//     params.push(category);
//   }

//   if (businessId) {
//     sql += " AND l.business_id = ?";
//     params.push(Number(businessId));
//   }

//   sql += " ORDER BY l.created_at DESC";

//   const rows = db.prepare(sql).all(...params);
//   res.json(rows.map((row) => ({ ...row, risk: calculateRisk(row) })));
// });
app.get("/api/listings", (req, res) => {
  const { search = "", category = "All", businessId } = req.query;

  let sql = `
    SELECT
      l.*,
      b.name AS business_name,
      b.location AS business_location
    FROM listings l
    JOIN businesses b ON b.id = l.business_id
    WHERE l.status = 'AVAILABLE'
  `;

  const params = [];

  if (search) {
    sql += `
      AND (
        LOWER(l.name) LIKE LOWER(?)
        OR LOWER(l.description) LIKE LOWER(?)
        OR LOWER(b.name) LIKE LOWER(?)
      )
    `;

    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (category && category !== "All") {
    sql += " AND l.category = ?";
    params.push(category);
  }

  if (businessId) {
    sql += " AND l.business_id = ?";
    params.push(Number(businessId));
  }

  sql += " ORDER BY l.id DESC";

  const rows = db.prepare(sql).all(...params);

  res.json(
    rows.map((row) => ({
      ...row,
      risk: calculateRisk(row),
    }))
  );
});
app.get("/api/listings/:id", (req, res) => {
  const listing = getListing(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json({ ...listing, risk: calculateRisk(listing) });
});

// app.post("/api/listings", (req, res) => {
//   const {
//     businessId = 1,
//     name,
//     description,
//     category,
//     originalPrice,
//     discountPrice,
//     quantity,
//     pickupStart,
//     pickupEnd,
//   } = req.body;

//   if (
//     !name ||
//     !description ||
//     !category ||
//     !originalPrice ||
//     !discountPrice ||
//     quantity === undefined ||
//     !pickupStart ||
//     !pickupEnd
//   ) {
//     return res.status(400).json({ error: "All listing fields are required." });
//   }

//   const result = db
//     .prepare(
//       `
//     INSERT INTO listings
//       (business_id, name, description, category, original_price, discount_price,
//        quantity, pickup_start, pickup_end, status)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
//   `
//     )
//     .run(
//       Number(businessId),
//       name,
//       description,
//       category,
//       Number(originalPrice),
//       Number(discountPrice),
//       Number(quantity),
//       pickupStart,
//       pickupEnd
//     );

//   res.status(201).json(getListing(result.lastInsertRowid));
// });

app.post("/api/listings", (req, res) => {
  const {
    businessId = 1,
    name,
    description,
    category,
    originalPrice,
    discountPrice,
    quantity,
    pickupStart,
    pickupEnd,
  } = req.body;

  if (
    !name ||
    !description ||
    !category ||
    originalPrice === undefined ||
    discountPrice === undefined ||
    quantity === undefined ||
    !pickupStart ||
    !pickupEnd
  ) {
    return res.status(400).json({
      error: "All listing fields are required.",
    });
  }

  const original = Number(originalPrice);
  const discounted = Number(discountPrice);
  const qty = Number(quantity);

  if (
    !Number.isFinite(original) ||
    !Number.isFinite(discounted) ||
    !Number.isInteger(qty) ||
    original <= 0 ||
    discounted <= 0 ||
    discounted > original ||
    qty < 1
  ) {
    return res.status(400).json({
      error: "Please provide valid price and quantity values.",
    });
  }

  const discountPercent = Math.round(
    ((original - discounted) / original) * 100
  );

  const pickupTime = `${pickupStart} - ${pickupEnd}`;

  const result = db
    .prepare(
      `
    INSERT INTO listings (
      business_id,
      name,
      category,
      description,
      quantity,
      original_price,
      discount_percent,
      pickup_time,
      expires_at,
      waste_risk,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      Number(businessId),
      name,
      category,
      description,
      qty,
      original,
      discountPercent,
      pickupTime,
      pickupEnd,
      "MEDIUM",
      "AVAILABLE"
    );

  res.status(201).json(getListing(result.lastInsertRowid));
});

// app.put("/api/listings/:id", (req, res) => {
//   const existing = getListing(req.params.id);
//   if (!existing) return res.status(404).json({ error: "Listing not found" });

//   const {
//     name,
//     description,
//     category,
//     originalPrice,
//     discountPrice,
//     quantity,
//     pickupStart,
//     pickupEnd,
//   } = req.body;

//   db.prepare(
//     `
//     UPDATE listings
//     SET name = ?, description = ?, category = ?, original_price = ?,
//         discount_price = ?, quantity = ?, pickup_start = ?, pickup_end = ?
//     WHERE id = ?
//   `
//   ).run(
//     name,
//     description,
//     category,
//     Number(originalPrice),
//     Number(discountPrice),
//     Number(quantity),
//     pickupStart,
//     pickupEnd,
//     req.params.id
//   );

//   res.json(getListing(req.params.id));
// });

app.put("/api/listings/:id", (req, res) => {
  const existing = getListing(req.params.id);

  if (!existing) {
    return res.status(404).json({
      error: "Listing not found",
    });
  }

  const {
    name,
    description,
    category,
    originalPrice,
    discountPrice,
    quantity,
    pickupStart,
    pickupEnd,
  } = req.body;

  if (
    !name ||
    !description ||
    !category ||
    originalPrice === undefined ||
    discountPrice === undefined ||
    quantity === undefined ||
    !pickupStart ||
    !pickupEnd
  ) {
    return res.status(400).json({
      error: "All listing fields are required.",
    });
  }

  const original = Number(originalPrice);
  const discounted = Number(discountPrice);
  const qty = Number(quantity);

  if (
    !Number.isFinite(original) ||
    !Number.isFinite(discounted) ||
    !Number.isInteger(qty) ||
    original <= 0 ||
    discounted <= 0 ||
    discounted > original ||
    qty < 1
  ) {
    return res.status(400).json({
      error: "Please provide valid price and quantity values.",
    });
  }

  const discountPercent = Math.round(
    ((original - discounted) / original) * 100
  );

  const pickupTime = `${pickupStart} - ${pickupEnd}`;

  db.prepare(
    `
    UPDATE listings
    SET
      name = ?,
      description = ?,
      category = ?,
      original_price = ?,
      discount_percent = ?,
      quantity = ?,
      pickup_time = ?,
      expires_at = ?
    WHERE id = ?
  `
  ).run(
    name,
    description,
    category,
    original,
    discountPercent,
    qty,
    pickupTime,
    pickupEnd,
    req.params.id
  );

  res.json(getListing(req.params.id));
});
app.delete("/api/listings/:id", (req, res) => {
  const existing = getListing(req.params.id);
  if (!existing) return res.status(404).json({ error: "Listing not found" });

  db.prepare("UPDATE listings SET status = 'REMOVED' WHERE id = ?").run(
    req.params.id
  );
  res.json({ success: true });
});

app.get("/api/reservations", (req, res) => {
  res.json(getReservationRows());
});

// app.post("/api/reservations", (req, res) => {
//   const { listingId, customerName, quantity = 1 } = req.body;
//   const listing = getListing(listingId);

//   if (!listing) return res.status(404).json({ error: "Listing not found." });
//   if (!customerName?.trim())
//     return res.status(400).json({ error: "Customer name is required." });

//   const requested = Number(quantity);
//   if (!Number.isInteger(requested) || requested < 1) {
//     return res.status(400).json({ error: "Quantity must be at least 1." });
//   }

//   if (requested > listing.quantity) {
//     return res.status(400).json({ error: "Not enough quantity available." });
//   }

//   const transaction = db.transaction(() => {
//     const reservation = db
//       .prepare(
//         `
//       INSERT INTO reservations (listing_id, customer_name, quantity)
//       VALUES (?, ?, ?)
//     `
//       )
//       .run(listingId, customerName.trim(), requested);

//     db.prepare(
//       `
//       UPDATE listings
//       SET quantity = quantity - ?
//       WHERE id = ?
//     `
//     ).run(requested, listingId);

//     return reservation.lastInsertRowid;
//   });

//   const id = transaction();
//   res
//     .status(201)
//     .json(getReservationRows().find((reservation) => reservation.id === id));
// });
app.post("/api/reservations", (req, res) => {
  const { listingId, customerName, quantity = 1 } = req.body;

  const listing = getListing(listingId);

  if (!listing) {
    return res.status(404).json({
      error: "Listing not found.",
    });
  }

  if (!customerName?.trim()) {
    return res.status(400).json({
      error: "Customer name is required.",
    });
  }

  const requested = Number(quantity);

  if (!Number.isInteger(requested) || requested < 1) {
    return res.status(400).json({
      error: "Quantity must be at least 1.",
    });
  }

  if (requested > listing.quantity) {
    return res.status(400).json({
      error: "Not enough quantity available.",
    });
  }

  const transaction = db.transaction(() => {
    const reservation = db
      .prepare(
        `
      INSERT INTO reservations (
        listing_id,
        customer_name,
        quantity,
        reserved_at,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        Number(listingId),
        customerName.trim(),
        requested,
        new Date().toISOString(),
        "RESERVED"
      );

    const newQuantity = listing.quantity - requested;

    db.prepare(
      `
      UPDATE listings
      SET
        quantity = ?,
        status = ?
      WHERE id = ?
    `
    ).run(
      newQuantity,
      newQuantity === 0 ? "SOLD_OUT" : "AVAILABLE",
      Number(listingId)
    );

    return reservation.lastInsertRowid;
  });

  const id = transaction();

  const reservation = getReservationRows().find((item) => item.id === id);

  res.status(201).json(reservation);
});
app.put("/api/reservations/:id/status", (req, res) => {
  const { status } = req.body;
  const allowed = ["RESERVED", "PICKED_UP", "CANCELLED"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid reservation status." });
  }

  const result = db
    .prepare(
      `
    UPDATE reservations SET status = ? WHERE id = ?
  `
    )
    .run(status, req.params.id);

  if (!result.changes) {
    return res.status(404).json({ error: "Reservation not found." });
  }

  res.json(
    getReservationRows().find(
      (reservation) => reservation.id === Number(req.params.id)
    )
  );
});

// app.get("/api/business/dashboard", (req, res) => {
//   const businessId = Number(req.query.businessId || 1);

//   const listings = db
//     .prepare(
//       `
//     SELECT l.*, b.name AS business_name, b.address AS business_address
//     FROM listings l
//     JOIN businesses b ON b.id = l.business_id
//     WHERE l.business_id = ? AND l.status = 'ACTIVE'
//     ORDER BY l.created_at DESC
//   `
//     )
//     .all(businessId);

//   const reservationCount = db
//     .prepare(
//       `
//     SELECT COUNT(*) AS count
//     FROM reservations r
//     JOIN listings l ON l.id = r.listing_id
//     WHERE l.business_id = ? AND r.status != 'CANCELLED'
//   `
//     )
//     .get(businessId).count;

//   const pickedUp = db
//     .prepare(
//       `
//     SELECT COALESCE(SUM(r.quantity), 0) AS count
//     FROM reservations r
//     JOIN listings l ON l.id = r.listing_id
//     WHERE l.business_id = ? AND r.status = 'PICKED_UP'
//   `
//     )
//     .get(businessId).count;

//   const revenue = db
//     .prepare(
//       `
//     SELECT COALESCE(SUM(r.quantity * l.discount_price), 0) AS revenue
//     FROM reservations r
//     JOIN listings l ON l.id = r.listing_id
//     WHERE l.business_id = ? AND r.status != 'CANCELLED'
//   `
//     )
//     .get(businessId).revenue;

//   res.json({
//     businessId,
//     listings: listings.map((listing) => ({
//       ...listing,
//       risk: calculateRisk(listing),
//     })),
//     metrics: {
//       activeListings: listings.length,
//       reservations: reservationCount,
//       itemsRescued: pickedUp,
//       revenue: Number(revenue.toFixed(2)),
//     },
//   });
// });
app.get("/api/business/dashboard", (req, res) => {
  const businessId = Number(req.query.businessId || 1);

  const listings = db
    .prepare(
      `
    SELECT
      l.*,
      b.name AS business_name,
      b.location AS business_location
    FROM listings l
    JOIN businesses b ON b.id = l.business_id
    WHERE l.business_id = ?
      AND l.status = 'AVAILABLE'
    ORDER BY l.id DESC
  `
    )
    .all(businessId);

  const reservationCount = db
    .prepare(
      `
    SELECT COUNT(*) AS count
    FROM reservations r
    JOIN listings l ON l.id = r.listing_id
    WHERE l.business_id = ?
      AND r.status != 'CANCELLED'
  `
    )
    .get(businessId).count;

  const pickedUp = db
    .prepare(
      `
    SELECT COALESCE(SUM(r.quantity), 0) AS count
    FROM reservations r
    JOIN listings l ON l.id = r.listing_id
    WHERE l.business_id = ?
      AND r.status = 'PICKED_UP'
  `
    )
    .get(businessId).count;

  const revenue = db
    .prepare(
      `
    SELECT COALESCE(
      SUM(
        r.quantity *
        (l.original_price * (1 - l.discount_percent / 100.0))
      ),
      0
    ) AS revenue
    FROM reservations r
    JOIN listings l ON l.id = r.listing_id
    WHERE l.business_id = ?
      AND r.status != 'CANCELLED'
  `
    )
    .get(businessId).revenue;

  res.json({
    businessId,
    listings: listings.map((listing) => ({
      ...listing,
      risk: calculateRisk(listing),
    })),
    metrics: {
      activeListings: listings.length,
      reservations: reservationCount,
      itemsRescued: pickedUp,
      revenue: Number(revenue.toFixed(2)),
    },
  });
});
app.get("/api/business/recommendations", (req, res) => {
  const businessId = Number(req.query.businessId || 1);

  const listings = db
    .prepare(
      `
    SELECT l.*, b.name AS business_name
    FROM listings l
    JOIN businesses b ON b.id = l.business_id
    WHERE l.business_id = ? AND l.status = 'ACTIVE'
  `
    )
    .all(businessId);

  const recommendations = listings
    .map((listing) => ({ ...listing, recommendation: calculateRisk(listing) }))
    .filter((listing) => listing.recommendation.risk !== "LOW")
    .sort((a, b) => b.recommendation.score - a.recommendation.score);

  res.json(recommendations);
});

app.get("/api/customer/dashboard", (req, res) => {
  const reservations = getReservationRows();
  const customerReservations = reservations.filter(
    (reservation) => reservation.customer_name === "Alex Johnson"
  );

  const totalSaved = customerReservations.reduce(
    (sum, r) => sum + Number(r.discount_price) * Number(r.quantity),
    0
  );

  res.json({
    customer: "Alex Johnson",
    reservations: customerReservations,
    totalSaved: Number(totalSaved.toFixed(2)),
  });
});

app.listen(PORT, () => {
  console.log(`FoodSaver API running on http://localhost:${PORT}`);
});
