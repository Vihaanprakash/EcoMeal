import Database from "better-sqlite3";

export const db = new Database("foodsaver.db");

db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    original_price REAL NOT NULL,
    discount_percent INTEGER NOT NULL,
    pickup_time TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    waste_risk TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reserved_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RESERVED',
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );
`);

// db.exec(`
//   CREATE TABLE IF NOT EXISTS businesses (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     location TEXT NOT NULL,
//     description TEXT
//   );

//   CREATE TABLE IF NOT EXISTS listings (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     business_id INTEGER NOT NULL,
//     name TEXT NOT NULL,
//     category TEXT NOT NULL,
//     description TEXT,
//     quantity INTEGER NOT NULL,
//     original_price REAL NOT NULL,
//     discount_percent INTEGER NOT NULL,
//     pickup_time TEXT NOT NULL,
//     expires_at TEXT NOT NULL,
//     waste_risk TEXT NOT NULL,
//     status TEXT NOT NULL DEFAULT 'AVAILABLE',
//     FOREIGN KEY (business_id) REFERENCES businesses(id)
//   );

//   CREATE TABLE IF NOT EXISTS reservations (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     listing_id INTEGER NOT NULL,
//     customer_name TEXT NOT NULL,
//     quantity INTEGER NOT NULL,
//     reserved_at TEXT NOT NULL,
//     status TEXT NOT NULL DEFAULT 'RESERVED',
//     FOREIGN KEY (listing_id) REFERENCES listings(id)
//   );
//   CREATE TABLE IF NOT EXISTS businesses (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   name TEXT NOT NULL,
//   location TEXT NOT NULL,
//   address TEXT,
//   description TEXT
// );
// `);

const businessCount = db
  .prepare("SELECT COUNT(*) AS count FROM businesses")
  .get().count;

if (businessCount === 0) {
  const insertBusiness = db.prepare(`
    INSERT INTO businesses (name, location, address, description)
    VALUES (?, ?, ?, ?)
  `);

  insertBusiness.run(
    "Green Garden Cafe",
    "Boston, MA",
    "123 Main Street, Boston, MA",
    "Fresh meals and healthy food prepared daily."
  );

  insertBusiness.run(
    "Fresh Bites Bakery",
    "Cambridge, MA",
    "456 Massachusetts Ave, Cambridge, MA",
    "Bakery specializing in fresh pastries and breads."
  );

  insertBusiness.run(
    "Campus Kitchen",
    "Somerville, MA",
    "789 Highland Ave, Somerville, MA",
    "Affordable meals for students and local residents."
  );

  // insertBusiness.run(
  //   "Green Garden Cafe",
  //   "Boston, MA",
  //   "Fresh meals and healthy food prepared daily."
  // );

  // insertBusiness.run(
  //   "Fresh Bites Bakery",
  //   "Cambridge, MA",
  //   "Bakery specializing in fresh pastries and breads."
  // );

  // insertBusiness.run(
  //   "Campus Kitchen",
  //   "Somerville, MA",
  //   "Affordable meals for students and local residents."
  // );
}

const listingCount = db
  .prepare("SELECT COUNT(*) AS count FROM listings")
  .get().count;

if (listingCount === 0) {
  const insertListing = db.prepare(`
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
  `);

  insertListing.run(
    1,
    "Veggie Pasta Box",
    "Meals",
    "Fresh vegetable pasta meal.",
    8,
    12.0,
    40,
    "Today 6:00 PM - 8:00 PM",
    "Today 8:00 PM",
    "HIGH",
    "AVAILABLE"
  );

  insertListing.run(
    1,
    "Chicken Rice Bowl",
    "Meals",
    "Chicken, rice and seasonal vegetables.",
    5,
    14.0,
    30,
    "Today 6:00 PM - 8:00 PM",
    "Today 8:00 PM",
    "MEDIUM",
    "AVAILABLE"
  );

  insertListing.run(
    2,
    "Assorted Pastry Box",
    "Bakery",
    "A selection of fresh bakery pastries.",
    6,
    18.0,
    50,
    "Today 5:00 PM - 7:00 PM",
    "Today 7:00 PM",
    "HIGH",
    "AVAILABLE"
  );

  insertListing.run(
    2,
    "Chocolate Croissant",
    "Bakery",
    "Fresh chocolate-filled croissant.",
    10,
    5.0,
    35,
    "Today 5:00 PM - 7:00 PM",
    "Today 7:00 PM",
    "MEDIUM",
    "AVAILABLE"
  );

  insertListing.run(
    3,
    "Vegetarian Lunch Box",
    "Meals",
    "Vegetarian rice, vegetables and lentils.",
    12,
    11.0,
    25,
    "Today 4:00 PM - 6:00 PM",
    "Today 6:00 PM",
    "LOW",
    "AVAILABLE"
  );
}

export function getListing(id) {
  return db
    .prepare(
      `
      SELECT
        listings.*,
        businesses.name AS business_name,
        businesses.location AS business_location
      FROM listings
      JOIN businesses ON businesses.id = listings.business_id
      WHERE listings.id = ?
    `
    )
    .get(id);
}

export function getReservationRows() {
  return db
    .prepare(
      `
      SELECT
        reservations.*,
        listings.name AS listing_name,
        businesses.name AS business_name
      FROM reservations
      JOIN listings ON listings.id = reservations.listing_id
      JOIN businesses ON businesses.id = listings.business_id
      ORDER BY reservations.id DESC
    `
    )
    .all();
}
