import React, { useEffect, useMemo, useState } from "react";
import {
  Leaf,
  Store,
  ShoppingBag,
  Search,
  Plus,
  PackageCheck,
  Clock3,
  DollarSign,
  Trash2,
  Edit3,
  Sparkles,
  X,
  CheckCircle2,
  MapPin,
  ChevronRight,
} from "lucide-react";
import {
  createListing,
  createReservation,
  deleteListing,
  getBusinessDashboard,
  getListings,
  getRecommendations,
  getReservations,
  updateListing,
  updateReservationStatus,
} from "./api";

const categories = ["All", "Meals", "Breakfast", "Bakery", "Healthy"];

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function riskClass(risk) {
  return risk?.toLowerCase() || "low";
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={19} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {detail && <div className="stat-detail">{detail}</div>}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Leaf size={20} />
      </div>
      <div>
        <div className="brand-name">EcoMeal</div>
        <div className="brand-tagline">Save food. Save money.</div>
      </div>
    </div>
  );
}

function Navbar({ mode, setMode }) {
  return (
    <header className="navbar">
      <Logo />
      <div className="mode-switch">
        <button
          className={mode === "customer" ? "active" : ""}
          onClick={() => setMode("customer")}
        >
          <ShoppingBag size={16} /> Customer
        </button>
        <button
          className={mode === "business" ? "active" : ""}
          onClick={() => setMode("business")}
        >
          <Store size={16} /> Business
        </button>
      </div>
    </header>
  );
}

function FoodCard({ listing, onReserve }) {
 

  const originalPrice = Number(listing.original_price || 0);
  const discountPercent = Number(listing.discount_percent || 0);

  const salePrice = originalPrice * (1 - discountPercent / 100);

  const percent = discountPercent;
  const risk = listing.risk?.risk || "LOW";

  return (
    <article className="food-card">
      <div className={`food-art ${listing.category.toLowerCase()}`}>
        <span>
          {listing.category === "Bakery"
            ? "🥐"
            : listing.category === "Healthy"
            ? "🥗"
            : listing.category === "Breakfast"
            ? "🥪"
            : "🍱"}
        </span>
        <span className="discount-badge">{percent}% off</span>
      </div>
      <div className="food-body">
        <div className="food-topline">
          <span className="category">{listing.category}</span>
          {risk !== "LOW" && (
            <span className={`risk-pill ${riskClass(risk)}`}>{risk} risk</span>
          )}
        </div>
        <h3>{listing.name}</h3>
        <p className="description">{listing.description}</p>
        <div className="business-line">
          <MapPin size={14} /> {listing.business_name}
        </div>
        <div className="price-row">
          <div>
            <span className="sale-price">{money(salePrice)}</span>
            <span className="original-price">
              {money(listing.original_price)}
            </span>
          </div>
          <span className="quantity">{listing.quantity} left</span>
        </div>
        <div className="pickup">
          <Clock3 size={14} /> Pickup until {listing.pickup_end}
        </div>
        <button className="primary full" onClick={() => onReserve(listing)}>
          Reserve <ChevronRight size={17} />
        </button>
      </div>
    </article>
  );
}

function ReserveModal({ listing, onClose, onSuccess }) {
  const [name, setName] = useState("Alex Johnson");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createReservation({
        listingId: listing.id,
        customerName: name,
        quantity: Number(quantity),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Could not reserve this item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-button close" onClick={onClose}>
          <X size={19} />
        </button>
        <div className="modal-icon">🍱</div>
        <div className="modal-title">Reserve {listing.name}</div>
        <p className="modal-subtitle">
          {listing.business_name} · {listing.quantity} available
        </p>
        <form onSubmit={submit}>
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Quantity
            <select
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            >
              {Array.from({ length: Math.min(5, listing.quantity) }, (_, i) => (
                <option key={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
          <div className="reservation-total">
            <span>Total</span>
            {/* <strong>{money(listing.discount_price * quantity)}</strong> */}
            <strong>
              {money(
                Number(listing.original_price || 0) *
                  (1 - Number(listing.discount_percent || 0) / 100) *
                  Number(quantity)
              )}
            </strong>
          </div>
          {error && <div className="error-box">{error}</div>}
          <button className="primary full" disabled={saving}>
            {saving ? "Reserving..." : "Confirm Reservation"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CustomerView({ refreshKey, setRefreshKey }) {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [reservations, setReservations] = useState([]);

  async function load() {
    const [food, reservationsData] = await Promise.all([
      getListings({ search, category }),
      getReservations(),
    ]);
    setListings(food);
    setReservations(
      reservationsData.filter((r) => r.customer_name === "Alex Johnson")
    );
  }

  useEffect(() => {
    load();
  }, [search, category, refreshKey]);


  const saved = reservations.reduce((sum, r) => {
    const original = Number(r.original_price || 0);
    const discount = Number(r.discount_percent || 0);
    const quantity = Number(r.quantity || 0);

    const salePrice = original * (1 - discount / 100);
    const savingsPerItem = original - salePrice;

    return sum + savingsPerItem * quantity;
  }, 0);
  const rescued = reservations.reduce((sum, r) => sum + Number(r.quantity), 0);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            <Leaf size={14} /> SURPLUS FOOD MARKETPLACE
          </div>
          <h1>
            Good food deserves
            <br />
            <span>another chance.</span>
          </h1>
          <p>
            Rescue delicious surplus food from local businesses at a fraction of
            the original price.
          </p>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-number">127</div>
          <div>meals rescued by our community</div>
        </div>
      </section>

      <section className="stats-grid compact">
        <StatCard
          icon={PackageCheck}
          label="Items rescued"
          value={rescued}
          detail="from your reservations"
        />
        <StatCard
          icon={DollarSign}
          label="Your savings"
          value={money(saved)}
          detail="vs. original prices"
        />
        <StatCard
          icon={Leaf}
          label="Community impact"
          value="127 meals"
          detail="rescued this week"
        />
      </section>

      <section className="section-head">
        <div>
          <h2>Available near you</h2>
          <p>Fresh surplus, ready for pickup.</p>
        </div>
        <div className="filters">
          <div className="search">
            <Search size={17} />
            <input
              placeholder="Search food or business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>

      {listings.length ? (
        <div className="food-grid">
          {listings.map((listing) => (
            <FoodCard
              key={listing.id}
              listing={listing}
              onReserve={setSelected}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={30} />
          <h3>No food found</h3>
          <p>Try a different search or category.</p>
        </div>
      )}

      <section className="reservations-section">
        <div className="section-head">
          <div>
            <h2>Your reservations</h2>
            <p>Keep track of food you've rescued.</p>
          </div>
        </div>
        <div className="table-card">
          {reservations.length === 0 ? (
            <div className="empty-small">
              Your reservations will appear here.
            </div>
          ) : (
            reservations.map((r) => (
              <div className="reservation-row" key={r.id}>
                <div className="reservation-icon">🍱</div>
                <div className="reservation-info">
                  <strong>{r.listing_name}</strong>
                  <span>
                    {r.business_name} · Qty {r.quantity}
                  </span>
                </div>
                <div className="reservation-price">
                  {/* {money(r.discount_price * r.quantity)} */}
                  {money(
                    Number(r.original_price || 0) *
                      (1 - Number(r.discount_percent || 0) / 100) *
                      Number(r.quantity || 0)
                  )}
                </div>
                <span className={`status ${r.status.toLowerCase()}`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {selected && (
        <ReserveModal
          listing={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => setRefreshKey((v) => v + 1)}
        />
      )}
    </main>
  );
}

function ListingForm({ editing, onClose, onSaved }) {
  const initial = editing || {
    name: "",
    description: "",
    category: "Meals",
    original_price: "",
    discount_price: "",
    quantity: 5,
    pickup_start: new Date().toISOString(),
    pickup_end: new Date(Date.now() + 2 * 3600000).toISOString(),
  };

 

  const [form, setForm] = useState({
    name: initial.name,
    description: initial.description,
    category: initial.category,
    originalPrice: initial.original_price,
    discountPrice: initial.discount_percent
      ? Number(initial.original_price) *
        (1 - Number(initial.discount_percent) / 100)
      : "",
    quantity: initial.quantity,
    pickupStart: "",
    pickupEnd: "",
  });
  const [saving, setSaving] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        businessId: 1,
        quantity: Number(form.quantity),
      };
      if (editing) await updateListing(editing.id, payload);
      else await createListing(payload);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal wide" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-button close" onClick={onClose}>
          <X size={19} />
        </button>
        <div className="modal-icon">🥗</div>
        <div className="modal-title">
          {editing ? "Edit surplus listing" : "Add surplus food"}
        </div>
        <p className="modal-subtitle">
          Tell customers what is available for pickup.
        </p>
        <form onSubmit={submit} className="form-grid">
          <label className="span-2">
            Food name
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Pasta Dinner"
              required
            />
          </label>
          <label className="span-2">
            Description
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What's included?"
              required
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories
                .filter((c) => c !== "All")
                .map((c) => (
                  <option key={c}>{c}</option>
                ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              required
            />
          </label>
          <label>
            Original price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
              required
            />
          </label>
          <label>
            Discount price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              required
            />
          </label>
          <label>
            Pickup starts
            <input
              type="datetime-local"
              value={form.pickupStart}
              onChange={(e) => set("pickupStart", e.target.value)}
              required
            />
          </label>
          <label>
            Pickup ends
            <input
              type="datetime-local"
              value={form.pickupEnd}
              onChange={(e) => set("pickupEnd", e.target.value)}
              required
            />
          </label>
          <div className="form-actions span-2">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editing
                ? "Save Changes"
                : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BusinessView({ refreshKey, setRefreshKey }) {
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    const [data, recs, reservationData] = await Promise.all([
      getBusinessDashboard(),
      getRecommendations(),
      getReservations(),
    ]);
    setDashboard(data);
    setRecommendations(recs);
    setReservations(reservationData);
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function remove(id) {
    if (!window.confirm("Remove this listing?")) return;
    await deleteListing(id);
    setRefreshKey((v) => v + 1);
  }

  async function markPickedUp(id) {
    await updateReservationStatus(id, "PICKED_UP");
    setRefreshKey((v) => v + 1);
  }

  if (!dashboard)
    return (
      <main className="page">
        <div className="loading">Loading dashboard...</div>
      </main>
    );

  const totalAvailable = dashboard.listings.reduce(
    (sum, l) => sum + Number(l.quantity),
    0
  );

  return (
    <main className="page">
      <section className="business-hero">
        <div>
          <div className="eyebrow">
            <Store size={14} /> BUSINESS CONSOLE
          </div>
          <h1>
            Good afternoon, <span>Green Bean.</span>
          </h1>
          <p>Turn today's surplus into tomorrow's impact.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={18} /> Add surplus food
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={PackageCheck}
          label="Active listings"
          value={dashboard.metrics.activeListings}
          detail={`${totalAvailable} items available`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Reservations"
          value={dashboard.metrics.reservations}
          detail="all active reservations"
        />
        <StatCard
          icon={Leaf}
          label="Items rescued"
          value={dashboard.metrics.itemsRescued}
          detail="confirmed pickups"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={money(dashboard.metrics.revenue)}
          detail="from rescued food"
        />
      </section>

      <div className="business-layout">
        <section>
          <div className="section-head">
            <div>
              <h2>Active listings</h2>
              <p>Manage your surplus inventory.</p>
            </div>
          </div>
          <div className="table-card listing-table">
            {dashboard.listings.map((listing) => (
              <div className="listing-row" key={listing.id}>
                <div className="mini-food">🥗</div>
                <div className="listing-main">
                  <strong>{listing.name}</strong>
                  <span>
                    {listing.category} · {listing.quantity} remaining ·{" "}
                    {/* {money(listing.discount_price)} */}
                    {money(
                      Number(listing.original_price || 0) *
                        (1 - Number(listing.discount_percent || 0) / 100)
                    )}
                  </span>
                </div>
                <span className={`risk-pill ${riskClass(listing.risk.risk)}`}>
                  {listing.risk.risk} risk
                </span>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    title="Edit"
                    onClick={() => {
                      setEditing(listing);
                      setShowForm(true);
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    title="Remove"
                    onClick={() => remove(listing.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="recommendation-panel">
          <div className="panel-title">
            <Sparkles size={18} /> Smart recommendations
          </div>
          <p className="panel-subtitle">
            Rule-based suggestions from inventory and pickup urgency.
          </p>
          {recommendations.length === 0 ? (
            <div className="recommendation-empty">
              <CheckCircle2 size={22} />
              <strong>Inventory looks healthy</strong>
              <span>No urgent discount recommendations.</span>
            </div>
          ) : (
            recommendations.map((item) => (
              <div className="recommendation" key={item.id}>
                <div
                  className={`rec-dot ${riskClass(item.recommendation.risk)}`}
                ></div>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.recommendation.reason}</p>
                  <div className="rec-action">
                    Consider {item.recommendation.suggestedDiscount}% off →{" "}
                    <strong>{money(item.recommendation.suggestedPrice)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </aside>
      </div>

      <section className="reservations-section">
        <div className="section-head">
          <div>
            <h2>Recent reservations</h2>
            <p>Confirm pickups as customers collect their food.</p>
          </div>
        </div>
        <div className="table-card">
          {reservations.length === 0 ? (
            <div className="empty-small">No reservations yet.</div>
          ) : (
            reservations.slice(0, 8).map((r) => (
              <div className="reservation-row" key={r.id}>
                <div className="reservation-icon">👤</div>
                <div className="reservation-info">
                  <strong>{r.customer_name}</strong>
                  <span>
                    {r.listing_name} · Qty {r.quantity}
                  </span>
                </div>
                <div className="reservation-price">
                  {/* {money(r.discount_price * r.quantity)} */}
                  {money(
                    Number(r.original_price || 0) *
                      (1 - Number(r.discount_percent || 0) / 100) *
                      Number(r.quantity || 0)
                  )}
                </div>
                {r.status === "RESERVED" ? (
                  <button
                    className="small-primary"
                    onClick={() => markPickedUp(r.id)}
                  >
                    Mark picked up
                  </button>
                ) : (
                  <span className={`status ${r.status.toLowerCase()}`}>
                    {r.status.replace("_", " ")}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {showForm && (
        <ListingForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setRefreshKey((v) => v + 1);
          }}
        />
      )}
    </main>
  );
}

export default function App() {
  const [mode, setMode] = useState("customer");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Navbar mode={mode} setMode={setMode} />
      {mode === "customer" ? (
        <CustomerView refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
      ) : (
        <BusinessView refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
      )}
      <footer className="footer">
        <div>
          <Logo />
        </div>
        <span>Built to make surplus food easier to rescue.</span>
      </footer>
    </>
  );
}
