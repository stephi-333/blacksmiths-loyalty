import { useState, useEffect } from "react";

// ── Supabase Config ────────────────────────────────────────
const SUPABASE_URL = "https://gtqwdezynzdznenmbikj.supabase.co";
const SUPABASE_KEY = "sb_publishable_O7nEAuubB17xy-cyoMjeNQ_qhMmHiWr";

const db = {
  async query(path, options = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": options.prefer || "",
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Database error");
    }
    return options.method === "DELETE" || options.noBody ? null : res.json().catch(() => null);
  },

  async getCustomerByEmail(email) {
    const data = await db.query(`customers?email=eq.${encodeURIComponent(email)}&limit=1`);
    return data?.[0] || null;
  },

  async createCustomer(customer) {
    return db.query("customers", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(customer),
    });
  },

  async updateCustomer(id, updates) {
    return db.query(`customers?id=eq.${id}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify(updates),
    });
  },

  async getAllCustomers() {
    return db.query("customers?order=created_at.desc");
  },
};

// ── Constants ──────────────────────────────────────────────
const TOTAL_STAMPS = 10;
const SECRET_CODE = "THELOCAL2024";
const STAMP_URL = `https://blacksmithslocals.com/stamp?code=${SECRET_CODE}`;
const WHATSAPP_LINK = "https://chat.whatsapp.com/IjRf89aRBX7KJZVwOPafXs?mode=gi_t";
const today = () => new Date().toISOString().split("T")[0];

// ── Shared UI ──────────────────────────────────────────────
const Input = ({ label, type = "text", value, onChange, placeholder, icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>{icon}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: icon ? "12px 14px 12px 42px" : "12px 14px", color: "#fff", fontSize: 15,
        outline: "none", fontFamily: "'Courier New', monospace", transition: "border-color 0.2s", boxSizing: "border-box",
      }}
        onFocus={e => e.target.style.borderColor = "rgba(245,200,66,0.5)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
      />
    </div>
  </div>
);

const GoldButton = ({ onClick, children, disabled, secondary, green, loading }) => (
  <button onClick={onClick} disabled={disabled || loading} style={{
    width: "100%",
    background: green ? "linear-gradient(135deg,#1a8c3a,#25d366)" : secondary ? "rgba(255,255,255,0.06)" : disabled || loading ? "rgba(245,200,66,0.15)" : "linear-gradient(135deg,#c8972a,#f5c842)",
    color: green ? "#fff" : secondary ? "rgba(255,255,255,0.55)" : disabled || loading ? "rgba(255,255,255,0.25)" : "#1a1208",
    border: secondary ? "1px solid rgba(255,255,255,0.1)" : "none",
    borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 800,
    cursor: disabled || loading ? "not-allowed" : "pointer", fontFamily: "Georgia, serif",
    letterSpacing: "0.01em", transition: "opacity 0.2s",
  }}>{loading ? "⏳ Please wait..." : children}</button>
);

const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'Courier New', monospace", letterSpacing: "0.1em" }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
  </div>
);

const ErrorBox = ({ msg }) => msg ? (
  <div style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ff8080", fontFamily: "'Courier New', monospace" }}>⚠️ {msg}</div>
) : null;

// ── QR Code Display ────────────────────────────────────────
function QRDisplay({ value, size = 180 }) {
  const cells = 21; const cell = size / cells;
  const hash = value.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c >= cells - 8) || (r >= cells - 8 && c < 8);
      if (inFinder) {
        if (r >= cells - 8 && c >= cells - 8) return false;
        const fr = r < 8 ? r : r - (cells - 8); const fc = c < 8 ? c : c - (cells - 8);
        return (fr === 0 || fr === 6 || fc === 0 || fc === 6 || (fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4));
      }
      if (r === 6 || c === 6) return (r + c) % 2 === 0;
      return ((hash ^ (r * 31 + c * 17) ^ (r * c)) & 1) === 1;
    })
  );
  return (
    <div style={{ background: "#fff", padding: 14, borderRadius: 14, display: "inline-block", boxShadow: "0 0 40px rgba(245,200,66,0.15)" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((row, r) => row.map((dark, c) => dark ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1a1208" /> : null))}
      </svg>
      <div style={{ textAlign: "center", fontSize: 9, color: "#666", fontFamily: "'Courier New', monospace", marginTop: 5, letterSpacing: "0.15em" }}>BLACKSMITHS LOCALS · SCAN TO STAMP</div>
    </div>
  );
}

// ── Stamp Grid ─────────────────────────────────────────────
function StampGrid({ stamps, large }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: large ? 10 : 8 }}>
      {Array.from({ length: TOTAL_STAMPS }).map((_, i) => {
        const filled = i < stamps;
        return (
          <div key={i} style={{
            aspectRatio: "1", borderRadius: large ? 12 : 10,
            border: filled ? "2px solid #f5c842" : "2px dashed rgba(255,255,255,0.12)",
            background: filled ? "rgba(245,200,66,0.12)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: large ? 22 : 19, transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: filled ? "0 0 12px rgba(245,200,66,0.2)" : "none",
          }}>
            {filled ? "🍺" : <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 13 }}>·</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Stamp Page ─────────────────────────────────────────────
function StampPage({ onBack }) {
  const [phase, setPhase] = useState("enter");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);

  const handleClaim = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    try {
      const found = await db.getCustomerByEmail(email.trim());
      if (!found) { setError("We couldn't find that email. Have you registered yet?"); setLoading(false); return; }
      if (found.last_stamped === today()) { setCustomer(found); setPhase("already-stamped"); setLoading(false); return; }
      if (found.stamps >= TOTAL_STAMPS) { setCustomer(found); setPhase("already-full"); setLoading(false); return; }
      const updated = await db.updateCustomer(found.id, { stamps: found.stamps + 1, visits: found.visits + 1, last_stamped: today() });
      setCustomer(updated?.[0] || { ...found, stamps: found.stamps + 1 });
      setPhase("success");
    } catch (e) { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'Courier New', monospace" }}>← Back</button>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", fontFamily: "Georgia, serif" }}>Claim Your Stamp</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>blacksmithslocals.com/stamp</div></div>
      </div>

      {phase === "enter" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🍺</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800 }}>You're at Blacksmiths!</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "'Courier New', monospace", lineHeight: 1.6 }}>Enter your email to add today's stamp</p>
          </div>
          <Input label="Your Email" type="email" value={email} onChange={v => { setEmail(v); setError(""); }} placeholder="your@email.com" icon="✉️" />
          <ErrorBox msg={error} />
          <GoldButton onClick={handleClaim} loading={loading}>Claim My Stamp ✓</GoldButton>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>Not registered? </span>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#f5c842", fontSize: 12, cursor: "pointer", fontFamily: "'Courier New', monospace", textDecoration: "underline", padding: 0 }}>Join for free →</button>
          </div>
        </div>
      )}

      {phase === "success" && customer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 58 }}>✅</div>
          <div>
            <h3 style={{ margin: "0 0 4px", color: "#f5c842", fontFamily: "Georgia, serif", fontSize: 22 }}>Stamp Added, {customer.name?.split(" ")[0]}!</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "'Courier New', monospace" }}>{customer.stamps}/{TOTAL_STAMPS} stamps collected</p>
          </div>
          <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, boxSizing: "border-box" }}>
            <StampGrid stamps={customer.stamps} large />
          </div>
          {customer.stamps >= TOTAL_STAMPS ? (
            <div style={{ background: "rgba(245,200,66,0.12)", border: "1px solid #f5c842", borderRadius: 12, padding: "14px 18px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f5c842", fontFamily: "Georgia, serif" }}>🎉 Card Complete!</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace", marginTop: 4 }}>Show this screen to bar staff to claim your free drink</div>
            </div>
          ) : (
            <div style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.18)", borderRadius: 12, padding: "12px 16px", width: "100%", boxSizing: "border-box", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 22 }}>🎁</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", fontFamily: "Georgia, serif" }}>{TOTAL_STAMPS - customer.stamps} more {TOTAL_STAMPS - customer.stamps === 1 ? "stamp" : "stamps"} to go!</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>Keep visiting to earn your free drink</div>
              </div>
            </div>
          )}
          <button onClick={() => { setPhase("enter"); setEmail(""); setCustomer(null); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'Courier New', monospace", textDecoration: "underline" }}>← Back</button>
        </div>
      )}

      {phase === "already-stamped" && customer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🍺</div>
          <div>
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontFamily: "Georgia, serif", fontSize: 21 }}>Already stamped today,<br />{customer.name?.split(" ")[0]}!</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "'Courier New', monospace", lineHeight: 1.6 }}>You've already collected your stamp today.<br />Come back tomorrow! 😊</p>
          </div>
          <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, boxSizing: "border-box" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Courier New', monospace", marginBottom: 10 }}>Your card · {customer.stamps}/{TOTAL_STAMPS} stamps</div>
            <StampGrid stamps={customer.stamps} large />
          </div>
          <div style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.15)", borderRadius: 12, padding: "13px 16px", width: "100%", boxSizing: "border-box", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 24 }}>📅</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", fontFamily: "Georgia, serif" }}>{TOTAL_STAMPS - customer.stamps} more {TOTAL_STAMPS - customer.stamps === 1 ? "visit" : "visits"} to go!</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>One stamp per day — see you tomorrow 👋</div>
            </div>
          </div>
          <button onClick={() => { setPhase("enter"); setEmail(""); setCustomer(null); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'Courier New', monospace", textDecoration: "underline" }}>← Try another email</button>
        </div>
      )}

      {phase === "already-full" && customer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🎉</div>
          <div>
            <h3 style={{ margin: "0 0 4px", color: "#f5c842", fontFamily: "Georgia, serif", fontSize: 20 }}>Card Already Full!</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "'Courier New', monospace" }}>Show this to bar staff to redeem your free drink first</p>
          </div>
          <StampGrid stamps={TOTAL_STAMPS} large />
          <div style={{ background: "rgba(245,200,66,0.12)", border: "1px solid #f5c842", borderRadius: 12, padding: "14px 18px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f5c842", fontFamily: "Georgia, serif" }}>🍺 Free drink waiting for you!</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace", marginTop: 4 }}>Ask any member of staff to redeem it</div>
          </div>
          <button onClick={() => { setPhase("enter"); setEmail(""); setCustomer(null); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'Courier New', monospace", textDecoration: "underline" }}>← Back</button>
        </div>
      )}
    </div>
  );
}

// ── Register ───────────────────────────────────────────────
function RegisterView({ onBack, onSuccess }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.includes("@")) return "Please enter a valid email address.";
    if (phone.replace(/\s/g, "").length < 10) return "Please enter a valid phone number.";
    if (!agreed) return "Please tick the box to continue.";
    return null;
  };

  const handleRegister = async () => {
    const err = validate(); if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      const existing = await db.getCustomerByEmail(email.trim());
      if (existing) { setError("That email is already registered!"); setLoading(false); return; }
      const nc = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), stamps: 0, visits: 0, joined: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }), last_stamped: null };
      const result = await db.createCustomer(nc);
      setDone(result?.[0] || nc);
    } catch (e) { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
      <div style={{ padding: "16px 0 4px" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <h3 style={{ margin: "0 0 6px", color: "#f5c842", fontFamily: "Georgia, serif", fontSize: 22 }}>Welcome to Blacksmiths!</h3>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontFamily: "'Courier New', monospace", fontSize: 13, lineHeight: 1.6 }}>Your loyalty card is ready.<br />Scan the QR code at the bar for your first stamp!</p>
      </div>
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#1a8c3a,#25d366)", color: "#fff", borderRadius: 14, padding: "16px", textDecoration: "none", fontWeight: 800, fontSize: 15, fontFamily: "Georgia, serif", boxShadow: "0 0 24px rgba(37,211,102,0.25)" }}>
        <span style={{ fontSize: 22 }}>💬</span>
        <div style={{ textAlign: "left" }}><div>Join The Inner Circle</div><div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, fontFamily: "'Courier New', monospace" }}>Exclusive deals, events & offers</div></div>
        <span style={{ marginLeft: "auto" }}>→</span>
      </a>
      <button style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "'Courier New', monospace", textDecoration: "underline" }} onClick={() => onSuccess(done)}>Skip for now → View my card</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>Join Blacksmiths Locals</h2><p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>Free to join. Free drink on your 10th visit.</p></div>
      <Input label="Your Name" value={name} onChange={setName} placeholder="e.g. James Harris" icon="👤" />
      <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="your@email.com" icon="✉️" />
      <Input label="Mobile Number" type="tel" value={phone} onChange={setPhone} placeholder="07700 900 000" icon="📱" />
      <div style={{ background: "rgba(245,200,66,0.05)", border: "1px solid rgba(245,200,66,0.12)", borderRadius: 10, padding: 12, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }} onClick={() => setAgreed(a => !a)}>
        <div style={{ width: 20, height: 20, minWidth: 20, borderRadius: 5, border: agreed ? "2px solid #f5c842" : "2px solid rgba(255,255,255,0.2)", background: agreed ? "rgba(245,200,66,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#f5c842", transition: "all 0.2s", marginTop: 1 }}>{agreed ? "✓" : ""}</div>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace", lineHeight: 1.5 }}>I'm happy to receive loyalty updates, offers and event news from Blacksmiths Locals via email and WhatsApp.</p>
      </div>
      <ErrorBox msg={error} />
      <GoldButton onClick={handleRegister} loading={loading}>Create My Card →</GoldButton>
      <GoldButton secondary onClick={onBack}>← Back</GoldButton>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────
function LoginView({ onBack, onSuccess }) {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    try {
      const c = await db.getCustomerByEmail(email.trim());
      if (!c) { setError("We couldn't find that email. Have you registered?"); setLoading(false); return; }
      onSuccess(c);
    } catch (e) { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div><h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>Welcome Back</h2><p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>Enter your email to view your card</p></div>
      <Input label="Email Address" type="email" value={email} onChange={v => { setEmail(v); setError(""); }} placeholder="your@email.com" icon="✉️" />
      <ErrorBox msg={error} />
      <GoldButton onClick={handleLogin} loading={loading}>View My Card →</GoldButton>
      <GoldButton secondary onClick={onBack}>← Back</GoldButton>
    </div>
  );
}

// ── Customer Card ──────────────────────────────────────────
function CardView({ customer: initial, onBack }) {
  const [customer, setCustomer] = useState(initial);
  const [redeemed, setRedeemed] = useState(false);
  const [loading, setLoading] = useState(false);
  const stamps = customer?.stamps ?? 0;

  const redeem = async () => {
    setLoading(true);
    try {
      await db.updateCustomer(customer.id, { stamps: 0, last_stamped: null });
      setCustomer(c => ({ ...c, stamps: 0, last_stamped: null }));
      setRedeemed(true);
      setTimeout(() => setRedeemed(false), 3000);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>Hey, {customer?.name?.split(" ")[0]}! 👋</h2>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>Member since {customer?.joined}</p>
        </div>
        <div style={{ background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.2)", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f5c842", fontFamily: "Georgia, serif", lineHeight: 1 }}>{customer?.visits}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "'Courier New', monospace", marginTop: 2 }}>VISITS</div>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{stamps}/{TOTAL_STAMPS} stamps</span>
          <span style={{ fontSize: 12, color: "#f5c842", fontFamily: "'Courier New', monospace" }}>{TOTAL_STAMPS - stamps > 0 ? `${TOTAL_STAMPS - stamps} until free drink 🎁` : "🎉 Ready to redeem!"}</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(stamps / TOTAL_STAMPS) * 100}%`, background: "linear-gradient(90deg,#c8972a,#f5c842)", borderRadius: 99, transition: "width 0.6s ease", boxShadow: "0 0 10px rgba(245,200,66,0.35)" }} />
        </div>
      </div>
      <StampGrid stamps={stamps} large />
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 28 }}>📷</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>Scan to get your stamp</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace", marginTop: 2 }}>Point your camera at the QR code on the bar</div>
        </div>
      </div>
      {redeemed ? (
        <div style={{ background: "rgba(245,200,66,0.12)", border: "2px solid #f5c842", borderRadius: 14, padding: "18px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🍺</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f5c842", fontFamily: "Georgia, serif" }}>Enjoy your free drink!</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'Courier New', monospace", marginTop: 4 }}>Show this screen to bar staff · Cheers! 🥂</div>
        </div>
      ) : stamps >= TOTAL_STAMPS ? (
        <GoldButton onClick={redeem} loading={loading}>🎉 Redeem My Free Drink!</GoldButton>
      ) : (
        <div style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.15)", borderRadius: 12, padding: "13px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24 }}>🎁</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", fontFamily: "Georgia, serif" }}>Collect {TOTAL_STAMPS} stamps</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>Earn a FREE drink on us</div>
          </div>
        </div>
      )}
      <GoldButton secondary onClick={onBack}>← Sign Out</GoldButton>
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────
function AdminView({ onBack }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("customers");
  const [loading, setLoading] = useState(true);
  const [stamping, setStamping] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try { setCustomers(await db.getAllCustomers() || []); }
      catch (e) { setError("Couldn't load customers. Check your connection."); }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const addStamp = async id => {
    setStamping(id);
    const c = customers.find(x => x.id === id);
    try {
      await db.updateCustomer(id, { stamps: Math.min((c.stamps || 0) + 1, TOTAL_STAMPS), visits: (c.visits || 0) + 1, last_stamped: today() });
      setCustomers(prev => prev.map(x => x.id === id ? { ...x, stamps: Math.min((x.stamps || 0) + 1, TOTAL_STAMPS), visits: (x.visits || 0) + 1, last_stamped: today() } : x));
    } catch (e) {}
    setStamping(null);
  };

  const redeem = async id => {
    try {
      await db.updateCustomer(id, { stamps: 0, last_stamped: null });
      setCustomers(prev => prev.map(x => x.id === id ? { ...x, stamps: 0, last_stamped: null } : x));
    } catch (e) {}
  };

  const emails = customers.map(c => c.email).join(", ");
  const phones = customers.map(c => c.phone).join(", ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'Courier New', monospace" }}>← Back</button>
        <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>Staff Dashboard</h2><p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Courier New', monospace" }}>{customers.length} members registered</p></div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[["customers","👥 Members"],["qr","📷 QR Code"],["marketing","📣 Marketing"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, background: tab === key ? "rgba(245,200,66,0.15)" : "rgba(255,255,255,0.04)", border: tab === key ? "1px solid rgba(245,200,66,0.4)" : "1px solid rgba(255,255,255,0.07)", color: tab === key ? "#f5c842" : "rgba(255,255,255,0.35)", borderRadius: 9, padding: "9px 4px", fontSize: 11, cursor: "pointer", fontFamily: "'Courier New', monospace", fontWeight: tab === key ? 700 : 400 }}>{label}</button>
        ))}
      </div>

      {tab === "customers" && <>
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace", fontSize: 13 }}>⏳ Loading members...</div>
        ) : <>
          <ErrorBox msg={error} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[["Members", customers.length],["Ready 🎉", customers.filter(c => c.stamps >= TOTAL_STAMPS).length],["Visits", customers.reduce((a,c)=>a+(c.visits||0),0)]].map(([label,val]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f5c842", fontFamily: "Georgia, serif" }}>{val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>{label}</div>
              </div>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email or phone..." style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'Courier New', monospace", width: "100%", boxSizing: "border-box" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.25)", fontFamily: "'Courier New', monospace", fontSize: 13 }}>No members found</div>}
            {filtered.map(c => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: c.stamps >= TOTAL_STAMPS ? "1px solid rgba(245,200,66,0.35)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "13px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {c.name}
                      {c.stamps >= TOTAL_STAMPS && <span style={{ color: "#f5c842" }}>★</span>}
                      {c.last_stamped === today() && <span style={{ fontSize: 10, background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", borderRadius: 20, padding: "2px 7px", fontFamily: "'Courier New', monospace", fontWeight: 400 }}>✓ today</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>{c.email}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'Courier New', monospace" }}>{c.phone} · {c.visits || 0} visits · since {c.joined}</div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 40 }}>
                    <div style={{ fontSize: 14, color: "#f5c842", fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{c.stamps}/{TOTAL_STAMPS}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>{Array.from({ length: TOTAL_STAMPS }).map((_, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < c.stamps ? "#f5c842" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />)}</div>
                {c.stamps < TOTAL_STAMPS
                  ? <button onClick={() => addStamp(c.id)} style={{ width: "100%", background: stamping === c.id ? "rgba(245,200,66,0.15)" : "linear-gradient(135deg,#c8972a,#f5c842)", color: stamping === c.id ? "#f5c842" : "#1a1208", border: stamping === c.id ? "1px solid #f5c842" : "none", borderRadius: 7, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', monospace", transition: "all 0.3s" }}>{stamping === c.id ? "✓ Stamped!" : "+ Add Stamp Manually"}</button>
                  : <button onClick={() => redeem(c.id)} style={{ width: "100%", background: "rgba(245,200,66,0.12)", color: "#f5c842", border: "1px solid #f5c842", borderRadius: 7, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>🍺 Redeem Free Drink & Reset</button>
                }
              </div>
            ))}
          </div>
        </>}
      </>}

      {tab === "qr" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.18)", borderRadius: 12, padding: "13px 16px", width: "100%", boxSizing: "border-box" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", fontFamily: "Georgia, serif", marginBottom: 3 }}>📍 Your Stamp QR Code</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace", lineHeight: 1.5 }}>Print this and place it on the bar, tables, and menus. Customers scan it to claim a stamp.</div>
          </div>
          <QRDisplay value={STAMP_URL} size={200} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <button onClick={() => window.print()} style={{ width: "100%", background: "linear-gradient(135deg,#c8972a,#f5c842)", color: "#1a1208", border: "none", borderRadius: 10, padding: "13px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>🖨️ Print QR Code</button>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Courier New', monospace", width: "100%", boxSizing: "border-box", lineHeight: 1.7 }}>
            💡 <strong style={{ color: "rgba(255,255,255,0.5)" }}>Placement tips:</strong><br />
            · Laminate one for the bar top<br />
            · Add one to each table<br />
            · Print on the back of your menu<br />
            · Put one near the entrance
          </div>
        </div>
      )}

      {tab === "marketing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", marginBottom: 4 }}>✉️ Email List <span style={{ color: "#f5c842" }}>({customers.length})</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace", lineHeight: 1.7, wordBreak: "break-all", marginBottom: 10 }}>{emails || "No members yet"}</div>
            <button onClick={() => navigator.clipboard?.writeText(emails)} style={{ background: "linear-gradient(135deg,#c8972a,#f5c842)", color: "#1a1208", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>Copy All Emails</button>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", marginBottom: 4 }}>📱 WhatsApp Numbers <span style={{ color: "#f5c842" }}>({customers.length})</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace", lineHeight: 1.7, wordBreak: "break-all", marginBottom: 10 }}>{phones || "No members yet"}</div>
            <button onClick={() => navigator.clipboard?.writeText(phones)} style={{ background: "linear-gradient(135deg,#c8972a,#f5c842)", color: "#1a1208", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>Copy All Numbers</button>
          </div>
          <div style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", fontFamily: "Georgia, serif", marginBottom: 8 }}>📊 Insights</div>
            {[["Total Members", customers.length],["Ready to Redeem", customers.filter(c=>c.stamps>=TOTAL_STAMPS).length],["Stamped Today", customers.filter(c=>c.last_stamped===today()).length],["Total Visits", customers.reduce((a,c)=>a+(c.visits||0),0)]].map(([label,val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Courier New', monospace" }}>{label}</span>
                <span style={{ fontSize: 12, color: "#fff", fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home");
  const [loggedInCustomer, setLoggedInCustomer] = useState(null);

  const handleLoginSuccess = customer => { setLoggedInCustomer(customer); setView("card"); };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0a05", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(180,120,20,0.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(100,55,10,0.1) 0%, transparent 55%)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px 48px" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: rgba(255,255,255,0.2); } @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn 0.4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍺</div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1 }}>Blacksmiths Locals</h1>
          <p style={{ margin: "6px 0 0", fontSize: 11, letterSpacing: "0.2em", color: "#f5c842", textTransform: "uppercase", fontFamily: "'Courier New', monospace", opacity: 0.85 }}>Loyalty Programme</p>
          <div style={{ width: 50, height: 1, background: "linear-gradient(90deg,transparent,#f5c842,transparent)", margin: "12px auto 0" }} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: 22, backdropFilter: "blur(12px)" }}>
          {view === "home" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7, fontFamily: "'Courier New', monospace" }}>Visit {TOTAL_STAMPS} times, earn a <span style={{ color: "#f5c842" }}>FREE drink</span>.</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Courier New', monospace" }}>Scan the QR code at the bar on every visit.</p>
              </div>
              <GoldButton onClick={() => setView("login")}>🍺 I'm Already a Member</GoldButton>
              <Divider label="or" />
              <GoldButton secondary onClick={() => setView("register")}>✨ Join for Free</GoldButton>
              <Divider label="demo" />
              <button onClick={() => setView("stamp")} style={{ width: "100%", background: "rgba(245,200,66,0.07)", border: "1px solid rgba(245,200,66,0.2)", color: "rgba(245,200,66,0.7)", borderRadius: 12, padding: "11px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>📷 Preview: What customers see after scanning</button>
              <button onClick={() => setView("admin")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.18)", fontSize: 11, cursor: "pointer", fontFamily: "'Courier New', monospace", textDecoration: "underline", padding: "2px 0" }}>Staff Login →</button>
            </div>
          )}
          {view === "login"    && <LoginView    onBack={() => setView("home")} onSuccess={handleLoginSuccess} />}
          {view === "register" && <RegisterView onBack={() => setView("home")} onSuccess={handleLoginSuccess} />}
          {view === "card"     && <CardView     customer={loggedInCustomer} onBack={() => { setLoggedInCustomer(null); setView("home"); }} />}
          {view === "stamp"    && <StampPage    onBack={() => setView("home")} />}
          {view === "admin"    && <AdminView    onBack={() => setView("home")} />}
        </div>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "'Courier New', monospace" }}>Blacksmiths Locals · Loyalty Programme · blacksmithslocals.com</p>
      </div>
    </div>
  );
}
