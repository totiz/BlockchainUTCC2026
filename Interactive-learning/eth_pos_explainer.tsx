import { useState, useEffect, useRef } from "react";

const PURPLE = "#8b5cf6";
const BLUE = "#3b82f6";
const GREEN = "#10b981";
const RED = "#ef4444";
const YELLOW = "#f59e0b";
const GRAY = "#6b7280";

const tabs = ["Overview","Validators","Slots & Epochs","Block Proposal","Finality","Slashing"];

const styles = {
  app: { fontFamily: "'Inter', sans-serif", background: "#0f0f1a", minHeight: "100vh", color: "#e2e8f0", padding: "0" },
  header: { background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)", borderBottom: "1px solid #312e81", padding: "24px 32px" },
  title: { margin: 0, fontSize: 28, fontWeight: 700, background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle: { margin: "4px 0 0", fontSize: 14, color: "#94a3b8" },
  tabs: { display: "flex", gap: 4, padding: "16px 32px 0", background: "#0f172a", borderBottom: "1px solid #1e293b", flexWrap: "wrap" },
  tab: (active) => ({ padding: "10px 18px", borderRadius: "8px 8px 0 0", cursor: "pointer", fontSize: 13, fontWeight: 600, border: "none", transition: "all 0.2s", background: active ? "#1e1b4b" : "transparent", color: active ? "#a78bfa" : "#64748b", borderBottom: active ? "2px solid #8b5cf6" : "2px solid transparent" }),
  content: { padding: "32px", maxWidth: 1000, margin: "0 auto" },
  card: { background: "#1e1b4b22", border: "1px solid #312e81", borderRadius: 16, padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#c4b5fd" },
  badge: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: color + "22", color, border: `1px solid ${color}66` }),
  btn: (color="#8b5cf6") => ({ padding: "10px 22px", borderRadius: 10, border: "none", background: color, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "opacity 0.2s" }),
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  statCard: (color) => ({ flex: "1 1 160px", background: color + "11", border: `1px solid ${color}44`, borderRadius: 12, padding: "16px 20px", textAlign: "center" }),
};

/* ── OVERVIEW ── */
function Overview() {
  const stats = [
    { label: "Min Stake", value: "32 ETH", color: PURPLE },
    { label: "Slot Duration", value: "12 sec", color: BLUE },
    { label: "Slots / Epoch", value: "32", color: GREEN },
    { label: "Epoch Duration", value: "~6.4 min", color: YELLOW },
    { label: "Active Validators", value: "1M+", color: PURPLE },
    { label: "Energy vs PoW", value: "−99.95%", color: GREEN },
  ];
  const compare = [
    { aspect: "Security Mechanism", pow: "Computational Work", pos: "Economic Stake" },
    { aspect: "Block Producer", pow: "Miner", pos: "Validator" },
    { aspect: "Energy Use", pow: "Extremely High", pos: "Minimal" },
    { aspect: "Hardware Need", pow: "ASICs/GPUs", pos: "Consumer PC" },
    { aspect: "Attack Cost", pow: "51% hash power", pos: "33%+ of staked ETH" },
    { aspect: "Finality", pow: "Probabilistic", pos: "Deterministic" },
  ];
  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>What is Proof of Stake?</div>
        <p style={{ color: "#94a3b8", lineHeight: 1.8, margin: 0 }}>
          Ethereum's Proof of Stake (PoS) replaced Proof of Work in September 2022 ("The Merge"). Instead of competing with computation, validators <strong style={{ color: "#a78bfa" }}>lock up (stake) 32 ETH</strong> as collateral. They are then randomly selected to propose and attest to blocks. Honest behavior earns rewards; dishonest behavior results in <strong style={{ color: RED }}>slashing</strong> — losing part or all of their stake.
        </p>
      </div>
      <div style={{ ...styles.row, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={styles.statCard(s.color)}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>PoW vs PoS</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#64748b", fontWeight: 600 }}>Aspect</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: RED, fontWeight: 600 }}>⛏ Proof of Work</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: GREEN, fontWeight: 600 }}>🔒 Proof of Stake</th>
            </tr>
          </thead>
          <tbody>
            {compare.map((r, i) => (
              <tr key={r.aspect} style={{ background: i % 2 === 0 ? "#ffffff08" : "transparent" }}>
                <td style={{ padding: "10px 12px", color: "#cbd5e1", fontWeight: 600 }}>{r.aspect}</td>
                <td style={{ padding: "10px 12px", color: "#fca5a5" }}>{r.pow}</td>
                <td style={{ padding: "10px 12px", color: "#86efac" }}>{r.pos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── VALIDATORS ── */
const validatorStates = [
  { id: "deposited", label: "Deposited", color: BLUE, icon: "💰", desc: "32 ETH sent to deposit contract. Waiting for inclusion in beacon chain.", next: ["pending"] },
  { id: "pending", label: "Pending", color: YELLOW, icon: "⏳", desc: "Validator is in the activation queue. Ethereum limits how many activate per epoch to prevent large swings in stake.", next: ["active"] },
  { id: "active", label: "Active", color: GREEN, icon: "✅", desc: "Validator proposes and attests to blocks. Earns staking rewards (currently ~3-4% APR). Can be chosen as block proposer via RANDAO.", next: ["exiting", "slashed"] },
  { id: "exiting", label: "Exiting", color: YELLOW, icon: "🚪", desc: "Validator submitted voluntary exit. Must wait in exit queue before funds are withdrawable.", next: ["withdrawn"] },
  { id: "withdrawn", label: "Withdrawn", color: GRAY, icon: "🏦", desc: "Validator has fully exited. ETH + rewards are returned to the withdrawal address.", next: [] },
  { id: "slashed", label: "Slashed", color: RED, icon: "⚡", desc: "Validator was caught misbehaving (double vote, surround vote). Penalized, force-exited, and shamed on the network for ~36 days.", next: ["withdrawn"] },
];

function Validators() {
  const [selected, setSelected] = useState("active");
  const sel = validatorStates.find(v => v.id === selected);
  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Validator Lifecycle</div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>Click any state to learn more. Arrows show possible transitions.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
          {validatorStates.map(v => (
            <div key={v.id} onClick={() => setSelected(v.id)}
              style={{ cursor: "pointer", padding: "14px 20px", borderRadius: 14, border: `2px solid ${selected === v.id ? v.color : v.color + "44"}`, background: selected === v.id ? v.color + "22" : "#ffffff08", textAlign: "center", minWidth: 100, transition: "all 0.2s", transform: selected === v.id ? "scale(1.05)" : "scale(1)" }}>
              <div style={{ fontSize: 28 }}>{v.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: v.color, marginTop: 6 }}>{v.label}</div>
              {v.next.length > 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>→ {v.next.join(", ")}</div>}
            </div>
          ))}
        </div>
        {sel && (
          <div style={{ background: sel.color + "11", border: `1px solid ${sel.color}44`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{sel.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: sel.color }}>{sel.label}</span>
              <span style={styles.badge(sel.color)}>State</span>
            </div>
            <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.8 }}>{sel.desc}</p>
          </div>
        )}
      </div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Validator Duties</div>
        <div style={styles.row}>
          {[
            { icon: "📦", title: "Block Proposer", desc: "Randomly selected once per epoch via RANDAO. Proposes a new block with transactions.", color: PURPLE },
            { icon: "✍️", title: "Attester", desc: "All validators attest (vote) each epoch on the head of the chain and checkpoint validity.", color: BLUE },
            { icon: "🔄", title: "Sync Committee", desc: "512 validators randomly selected every ~27 hours to support light clients.", color: GREEN },
          ].map(d => (
            <div key={d.title} style={{ flex: "1 1 200px", background: d.color + "11", border: `1px solid ${d.color}44`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{d.icon}</div>
              <div style={{ fontWeight: 700, color: d.color, marginBottom: 6 }}>{d.title}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── SLOTS & EPOCHS ── */
function SlotsEpochs() {
  const [currentSlot, setCurrentSlot] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setCurrentSlot(s => (s + 1) % 32);
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, speed]);

  const epoch = Math.floor(currentSlot / 32);
  const slotInEpoch = currentSlot % 32;

  const slotColors = ["empty","attested","attested","proposed","attested","attested","attested","attested",
    "missed","attested","attested","proposed","attested","attested","attested","attested",
    "attested","attested","proposed","attested","attested","attested","attested","attested",
    "attested","proposed","attested","attested","attested","attested","attested","attested"];

  const colorOf = (i, active) => {
    if (active) return PURPLE;
    const t = slotColors[i];
    if (t === "proposed") return GREEN;
    if (t === "missed") return RED;
    return "#1e293b";
  };

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Slots & Epochs Explained</div>
        <div style={styles.row}>
          {[
            { title: "Slot", color: PURPLE, desc: "A 12-second window in which one validator can propose a block. Not every slot produces a block (proposer may be offline)." },
            { title: "Epoch", color: BLUE, desc: "A group of 32 consecutive slots (~6.4 minutes). At epoch boundaries, validators are shuffled, rewards distributed, and finality is considered." },
          ].map(i => (
            <div key={i.title} style={{ flex: 1, background: i.color + "11", border: `1px solid ${i.color}44`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: i.color, fontSize: 16, marginBottom: 8 }}>{i.title}</div>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{i.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={styles.sectionTitle}>Epoch Visualizer</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Slot <strong style={{ color: PURPLE }}>{slotInEpoch + 1}</strong> / 32 &nbsp;|&nbsp; Epoch <strong style={{ color: BLUE }}>N</strong></div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}>
              <option value={1000}>Slow</option>
              <option value={600}>Normal</option>
              <option value={200}>Fast</option>
            </select>
            <button style={styles.btn(running ? RED : GREEN)} onClick={() => setRunning(r => !r)}>
              {running ? "⏸ Pause" : "▶ Play"}
            </button>
            <button style={styles.btn(GRAY)} onClick={() => { setRunning(false); setCurrentSlot(0); }}>↺ Reset</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 32 }, (_, i) => {
            const active = i === slotInEpoch;
            const past = i < slotInEpoch;
            return (
              <div key={i} style={{
                borderRadius: 10, padding: "10px 4px", textAlign: "center", cursor: "default",
                background: active ? PURPLE + "33" : past ? colorOf(i, false) + "22" : "#ffffff05",
                border: `2px solid ${active ? PURPLE : past ? colorOf(i, false) : "#1e293b"}`,
                transition: "all 0.3s",
                transform: active ? "scale(1.08)" : "scale(1)",
              }}>
                <div style={{ fontSize: 16 }}>
                  {active ? "🔮" : past ? (slotColors[i] === "missed" ? "❌" : slotColors[i] === "proposed" ? "📦" : "✅") : "⬜"}
                </div>
                <div style={{ fontSize: 10, color: active ? PURPLE : past ? colorOf(i, false) : "#475569", marginTop: 4, fontWeight: 700 }}>
                  S{i + 1}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[["🔮", PURPLE, "Current Slot"], ["📦", GREEN, "Block Proposed"], ["✅", BLUE, "Attested"], ["❌", RED, "Missed"], ["⬜", GRAY, "Upcoming"]].map(([icon, color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span>{icon}</span><span style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── BLOCK PROPOSAL ── */
const proposalSteps = [
  { icon: "🎲", title: "RANDAO Selection", color: PURPLE, desc: "At the start of each epoch, a RANDAO-based shuffle assigns one validator per slot as the block proposer. RANDAO is a commit-reveal randomness beacon: each proposer mixes in a BLS signature to update the shared randomness." },
  { icon: "📦", title: "Build the Block", color: BLUE, desc: "The selected proposer collects pending transactions from the mempool, bundles them with metadata (parent hash, state root, timestamp), and computes the new state root after applying all transactions." },
  { icon: "📡", title: "Broadcast Block", color: YELLOW, desc: "The proposer broadcasts the block over the p2p gossip network. Other nodes propagate it to peers. The block must arrive within 4 seconds of the slot start (attestation deadline)." },
  { icon: "✍️", title: "Committee Attestation", color: GREEN, desc: "A committee of validators (randomly assigned per slot) checks the block's validity: correct parent, valid state transition, no slashable conditions. Each attests with a BLS signature. Attestations are aggregated." },
  { icon: "🔗", title: "Include in Chain", color: BLUE, desc: "Aggregated attestations are included in the next block. The LMD-GHOST fork choice rule uses these votes to determine the canonical chain head." },
  { icon: "🏁", title: "Finality (Casper FFG)", color: GREEN, desc: "After 2 epochs, if ≥ 2/3 of validators have attested to a checkpoint, it becomes JUSTIFIED. The previous justified checkpoint then becomes FINALIZED — irreversible without burning 1/3 of all staked ETH." },
];

function BlockProposal() {
  const [step, setStep] = useState(0);
  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Block Proposal Pipeline</div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>Step through the lifecycle of a single block from selection to finality.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {proposalSteps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              padding: "8px 14px", borderRadius: 20, border: `2px solid ${i === step ? s.color : "#334155"}`,
              background: i === step ? s.color + "22" : "transparent", color: i === step ? s.color : "#64748b",
              cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s"
            }}>
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        {/* timeline */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32, overflowX: "auto", paddingBottom: 8 }}>
          {proposalSteps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div onClick={() => setStep(i)} style={{
                width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, cursor: "pointer", border: `3px solid ${i <= step ? s.color : "#1e293b"}`,
                background: i === step ? s.color + "33" : i < step ? s.color + "11" : "#ffffff08",
                transition: "all 0.3s", flexShrink: 0
              }}>{s.icon}</div>
              {i < proposalSteps.length - 1 && (
                <div style={{ height: 3, width: 40, flexShrink: 0, background: i < step ? proposalSteps[i + 1].color : "#1e293b", transition: "background 0.4s", margin: "0 2px" }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ background: proposalSteps[step].color + "11", border: `1px solid ${proposalSteps[step].color}55`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 36 }}>{proposalSteps[step].icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: proposalSteps[step].color }}>{proposalSteps[step].title}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Step {step + 1} of {proposalSteps.length}</div>
            </div>
          </div>
          <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.8 }}>{proposalSteps[step].desc}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button style={styles.btn(GRAY)} onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Prev</button>
          <button style={styles.btn(PURPLE)} onClick={() => setStep(s => Math.min(proposalSteps.length - 1, s + 1))} disabled={step === proposalSteps.length - 1}>Next →</button>
        </div>
      </div>
    </div>
  );
}

/* ── FINALITY ── */
function Finality() {
  const [epoch, setEpoch] = useState(0);
  const maxEpoch = 4;

  const checkpoints = [
    { id: "N", label: "Epoch N", status: epoch >= 1 ? "justified" : "proposed" },
    { id: "N+1", label: "Epoch N+1", status: epoch >= 2 ? "justified" : epoch >= 1 ? "proposed" : "future" },
    { id: "N+2", label: "Epoch N+2", status: epoch >= 3 ? "justified" : epoch >= 2 ? "proposed" : "future" },
    { id: "N+3", label: "Epoch N+3", status: epoch >= 4 ? "justified" : epoch >= 3 ? "proposed" : "future" },
  ];

  const finalized = epoch >= 3 ? "Epoch N is now FINALIZED — irreversible!" : epoch >= 2 ? "Epoch N is justified. Waiting for N+1 to be justified to finalize N..." : epoch >= 1 ? "Epoch N is justified. Need N+1 justification..." : "Waiting for 2/3 of validators to vote on checkpoint N...";

  const statusColor = { proposed: YELLOW, justified: BLUE, future: GRAY, finalized: GREEN };

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Casper FFG Finality</div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px", lineHeight: 1.8 }}>
          Casper FFG (Friendly Finality Gadget) provides <strong style={{ color: "#a78bfa" }}>economic finality</strong>. Blocks become finalized in two steps: <span style={{ color: BLUE }}>Justified</span> (≥ 2/3 votes) then <span style={{ color: GREEN }}>Finalized</span> (next checkpoint justified). Reversing finality requires burning ≥ 1/3 of all staked ETH.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {checkpoints.map((cp, i) => {
            const st = epoch >= 3 && cp.id === "N" ? "finalized" : cp.status;
            const col = statusColor[st];
            return (
              <div key={cp.id} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 14, border: `3px solid ${col}`, background: col + "22", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {st === "finalized" ? "🏁" : st === "justified" ? "✅" : st === "proposed" ? "📋" : "⬜"}
                    <div style={{ fontSize: 10, color: col, fontWeight: 700, marginTop: 4 }}>{cp.label}</div>
                  </div>
                  <div style={{ ...styles.badge(col), marginTop: 8, fontSize: 11 }}>{st.toUpperCase()}</div>
                </div>
                {i < checkpoints.length - 1 && <div style={{ width: 32, height: 3, background: epoch > i ? BLUE : "#1e293b", margin: "0 8px 24px", transition: "background 0.4s" }} />}
              </div>
            );
          })}
        </div>

        <div style={{ background: epoch >= 3 ? GREEN + "11" : BLUE + "11", border: `1px solid ${epoch >= 3 ? GREEN : BLUE}44`, borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14, color: "#cbd5e1" }}>
          {epoch >= 3 ? "🏁 " : "ℹ️ "}{finalized}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button style={styles.btn(GRAY)} onClick={() => setEpoch(e => Math.max(0, e - 1))} disabled={epoch === 0}>← Back</button>
          <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(epoch / maxEpoch) * 100}%`, background: epoch >= 3 ? GREEN : BLUE, transition: "all 0.4s", borderRadius: 3 }} />
          </div>
          <button style={styles.btn(PURPLE)} onClick={() => setEpoch(e => Math.min(maxEpoch, e + 1))} disabled={epoch === maxEpoch}>Next Epoch →</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Why does this matter?</div>
        <div style={styles.row}>
          {[
            { icon: "🔒", title: "Irreversibility", desc: "Finalized blocks cannot be reorganized without destroying 1/3 of all staked ETH (~$10B+), making attacks economically irrational.", color: PURPLE },
            { icon: "⚡", title: "Speed", desc: "Finality is achieved in 2 epochs (~12.8 min). PoW offered only probabilistic finality that took hours to be 'safe'.", color: BLUE },
            { icon: "🌉", title: "Bridge Security", desc: "Cross-chain bridges and L2s wait for finalized checkpoints before releasing funds, preventing double-spend attacks.", color: GREEN },
          ].map(c => (
            <div key={c.title} style={{ flex: "1 1 180px", background: c.color + "11", border: `1px solid ${c.color}33`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: c.color, marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── SLASHING ── */
const slashingTypes = [
  {
    icon: "🗳️", title: "Double Voting (Equivocation)", color: RED,
    what: "A validator proposes or attests to two different blocks for the same slot.",
    why: "Attempting to create a fork — supporting two competing chain heads to double-spend.",
    penalty: "Immediate penalty of ~0.5-1 ETH, correlated penalty based on how many were slashed around the same time, forced exit after ~36 days.",
    proof: "Any node can submit a 'slashing proof' containing both conflicting messages. The reporter gets a small reward.",
  },
  {
    icon: "🌀", title: "Surround Voting", color: YELLOW,
    what: "An attester submits votes where one attestation 'surrounds' another in epoch range.",
    why: "This can be used to attack Casper FFG's finality mechanism by creating conflicting views of justified checkpoints.",
    penalty: "Same as double voting: immediate penalty, correlated slash, forced exit.",
    proof: "Slashing proof includes both attestations showing the epoch range overlap.",
  },
  {
    icon: "💤", title: "Inactivity Leak", color: GRAY,
    what: "Not a slashing event — but validators that are offline during a non-finalizing period slowly lose ETH.",
    why: "If finality stalls (network can't reach 2/3 supermajority), offline validators are penalized until active validators regain the 2/3 threshold.",
    penalty: "Quadratic leak: the longer the network fails to finalize, the faster offline validators lose stake.",
    proof: "No proof needed — inactivity is detected automatically by missed attestations.",
  },
];

function Slashing() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Slashing & Penalties</div>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px", lineHeight: 1.8 }}>
          Slashing is Ethereum's <strong style={{ color: RED }}>crypto-economic punishment</strong> mechanism. Validators that act dishonestly lose part of their 32 ETH stake and are forcibly ejected. This makes attacks economically irrational.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {slashingTypes.map((s, i) => (
            <div key={s.title} style={{ border: `1px solid ${open === i ? s.color : s.color + "44"}`, borderRadius: 14, overflow: "hidden", transition: "all 0.2s" }}>
              <div onClick={() => setOpen(open === i ? null : i)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", cursor: "pointer", background: open === i ? s.color + "11" : "#ffffff05" }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: s.color, fontSize: 16 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{s.what}</div>
                </div>
                <span style={{ color: s.color, fontSize: 20, transform: open === i ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
              </div>
              {open === i && (
                <div style={{ padding: "0 22px 22px", background: s.color + "08" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
                    {[["🎯 Why it's Malicious", s.why], ["💸 Penalty", s.penalty], ["📜 Proof Mechanism", s.proof]].map(([label, text]) => (
                      <div key={label} style={{ background: "#ffffff08", borderRadius: 10, padding: 16 }}>
                        <div style={{ fontWeight: 700, color: s.color, fontSize: 13, marginBottom: 8 }}>{label}</div>
                        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Correlated Slashing</div>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
          The slashing penalty is <strong style={{ color: RED }}>correlated</strong> with how many validators were slashed in the same time window. If only 1 validator is slashed, they lose a small fraction. If 1/3 of all validators are slashed simultaneously (coordinated attack), they lose <strong style={{ color: RED }}>up to 100% of their stake</strong>. This makes coordinated attacks uniquely costly.
        </p>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[["1 validator", "~0.5–1 ETH", GREEN], ["1% slashed", "~1–10%", YELLOW], ["10% slashed", "~10–50%", YELLOW], ["33% slashed", "~100%", RED]].map(([label, penalty, col]) => (
            <div key={label} style={{ flex: "1 1 120px", background: col + "11", border: `1px solid ${col}44`, borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
              <div style={{ fontWeight: 800, color: col, fontSize: 20 }}>{penalty}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>stake lost</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const sections = [Overview, Validators, SlotsEpochs, BlockProposal, Finality, Slashing];
  const Section = sections[activeTab];

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>Ethereum Proof of Stake</h1>
        <p style={styles.subtitle}>Interactive explainer — validators, slots, finality & slashing</p>
      </div>
      <div style={styles.tabs}>
        {tabs.map((t, i) => (
          <button key={t} style={styles.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>
      <div style={styles.content}>
        <Section />
      </div>
    </div>
  );
}
