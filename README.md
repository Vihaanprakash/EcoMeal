# SmartFoodSave🍱

FoodSaver is a full-stack web application that helps restaurants, bakeries, and cafeterias reduce food waste by listing surplus food for customers to reserve at a discounted price.

## Real-world problem

Businesses often have food remaining near the end of the day. Throwing it away wastes food and money. FoodSaver creates a simple marketplace where businesses can list surplus items and customers can reserve them for pickup.

## Features

### Customer
- Browse surplus food listings
- Search and filter by category
- See original vs. discounted price
- Reserve available quantities
- View reservation status
- See savings and estimated meals rescued

### Business
- Add, edit, and delete surplus listings
- View inventory and reservations
- Mark reservations as picked up
- See waste-risk recommendations
- Get suggested discount pricing for high-risk inventory
- View business impact metrics

### Smart business logic

FoodSaver uses a transparent rule-based waste-risk engine. It considers:

- percentage of inventory remaining
- time remaining in the pickup window
- discount already applied

The application classifies listings as LOW, MEDIUM, or HIGH risk and suggests a stronger discount when inventory is high and pickup time is running out.

This is intentionally rule-based instead of ML because a new platform would not have enough historical data to train a reliable model.

## Tech stack

- React
- Vite
- Node.js
- Express
- SQLite
- better-sqlite3
- Axios
- Plain CSS

## Project structure

```text
foodsaver/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   └── package.json
├── server/
│   ├── src/
│   │   ├── db.js
│   │   ├── risk.js
│   │   └── server.js
│   └── package.json
├── package.json
└── README.md
```

## Run locally

Requirements:
- Node.js 18+
- npm

Install:

```bash
npm run install:all
```

Start both frontend and backend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:5001/api
```

Port 5001 is intentional because macOS systems may already have another service using port 5000.

## API

### Listings

```text
GET    /api/listings
POST   /api/listings
GET    /api/listings/:id
PUT    /api/listings/:id
DELETE /api/listings/:id
```

### Reservations

```text
GET  /api/reservations
POST /api/reservations
PUT  /api/reservations/:id/status
```

### Business

```text
GET /api/business/dashboard
GET /api/business/recommendations
```

### Customer

```text
GET /api/customer/dashboard
```

## Interview explanation

### Why React?

React makes it easy to break the UI into reusable components such as listing cards, metric cards, forms, and reservation tables.

### Why Express?

Express provides a lightweight way to expose REST APIs and keep the frontend independent from database logic.

### Why SQLite?

This is a prototype with a small relational dataset. SQLite is easy to run locally and supports the relationships between businesses, listings, and reservations without requiring a separate database server.

### Why rule-based recommendations instead of AI?

The application does not have enough historical demand data for meaningful machine learning. A transparent rules engine is easier to validate and explain.

### Waste-risk logic

The risk score is based on:

```text
inventory pressure × 40%
time pressure × 60%
```

Time receives more weight because an item close to its pickup deadline is more urgent.

### What would you improve in production?

- Authentication and role-based authorization
- PostgreSQL instead of SQLite
- Real payment processing
- SMS/push notifications
- Maps and location search
- WebSockets for real-time inventory
- Restaurant verification
- Historical demand data
- A trained demand/price prediction model
- Automated tests and CI/CD

## Demo accounts

The demo intentionally does not require authentication.

Use the navigation to switch between:
- Customer
- Business

Seed data is automatically inserted the first time the backend starts.

## License

MIT
