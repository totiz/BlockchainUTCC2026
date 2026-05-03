import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Layers, Zap, Code2, ArrowRight, Check, X, Activity, Box, Coins, Anchor, Sparkles, Hash, Plus, Minus, RefreshCw, GitBranch, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const PINK = '#FF007A';
const PURPLE = '#7B61FF';
const PINK_DIM = 'rgba(255, 0, 122, 0.15)';
const PINK_GLOW = 'rgba(255, 0, 122, 0.4)';

// ============ NAV ============
function Nav() {
  const items = [
    { id: 'hero', label: 'Intro' },
    { id: 'singleton', label: 'Singleton' },
    { id: 'flash', label: 'Flash Accounting' },
    { id: 'hooks', label: 'Hooks' },
    { id: 'amm', label: 'AMM Curve' },
    { id: 'native', label: 'Native ETH' },
    { id: 'sim', label: 'Simulator' },
    { id: 'compare', label: 'V3 vs V4' },
  ];
  const scroll = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-zinc-800/50" style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${PINK}, #8B0048)` }} />
          <span className="font-semibold text-sm tracking-wide">Uniswap V4</span>
        </div>
        <div className="hidden md:flex gap-1 text-xs text-zinc-400 flex-wrap justify-end">
          {items.map(i => (
            <button key={i.id} onClick={() => scroll(i.id)} className="px-2.5 py-1.5 rounded-md hover:text-white hover:bg-zinc-800/50 transition">
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============ HERO ============
function Hero() {
  const cards = [
    { icon: Box, title: 'Singleton', desc: 'One contract holds every pool' },
    { icon: Zap, title: 'Flash Accounting', desc: 'Net deltas, settle once' },
    { icon: Code2, title: 'Hooks', desc: 'Programmable pool lifecycle' },
  ];
  return (
    <section id="hero" className="relative max-w-6xl mx-auto px-6 pt-20 pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30" style={{
        background: `radial-gradient(circle at 70% 20%, ${PINK_DIM}, transparent 50%), radial-gradient(circle at 20% 80%, rgba(123, 97, 255, 0.1), transparent 50%)`
      }} />
      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">An interactive deep dive</div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
        How <span style={{ color: PINK, textShadow: `0 0 40px ${PINK_GLOW}` }}>Uniswap V4</span><br />actually works
      </h1>
      <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
        V4 isn't a parameter tweak — it's an architectural rewrite. A singleton replaces per-pool contracts, transient storage replaces ERC-20 ping-pong, and hooks turn pools into programmable surfaces.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="group relative p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-all">
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition" style={{
              background: `linear-gradient(135deg, ${PINK_DIM}, transparent 60%)`
            }} />
            <div className="relative">
              <c.icon size={20} style={{ color: PINK }} className="mb-3" />
              <div className="font-semibold mb-1">{c.title}</div>
              <div className="text-sm text-zinc-400">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============ SINGLETON ============
function Singleton() {
  const [v, setV] = useState('v4');
  const pools = [
    { a: 'USDC', b: 'ETH', fee: '0.05%' },
    { a: 'USDC', b: 'DAI', fee: '0.01%' },
    { a: 'WBTC', b: 'ETH', fee: '0.30%' },
    { a: 'ETH', b: 'DAI', fee: '0.30%' },
  ];

  return (
    <section id="singleton" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="01" title="Singleton Architecture" subtitle="Every pool now lives inside one contract." />

      <div className="flex gap-2 mb-8">
        {['v3', 'v4'].map(k => (
          <button key={k} onClick={() => setV(k)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={v === k ? { background: PINK_DIM, border: `1px solid ${PINK}`, color: PINK } : { border: '1px solid #27272a', color: '#71717a' }}>
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="relative min-h-[320px]">
        {v === 'v3' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
            {pools.map((p, i) => (
              <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Contract {i + 1}</div>
                <div className="font-mono text-xs text-zinc-400 mb-3 truncate">0x{(i * 1234567).toString(16).padStart(8, '0')}...</div>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <span>{p.a}</span><span className="text-zinc-600">/</span><span>{p.b}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">{p.fee}</div>
              </div>
            ))}
          </div>
        )}
        {v === 'v4' && (
          <div className="rounded-xl border-2 p-6 animate-fadeIn" style={{ borderColor: PINK, background: `linear-gradient(180deg, ${PINK_DIM}, transparent)` }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: PINK }}>Singleton</div>
                <div className="font-bold text-lg">PoolManager</div>
              </div>
              <div className="font-mono text-xs text-zinc-500">mapping(PoolId =&gt; Pool.State)</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pools.map((p, i) => (
                <div key={i} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
                  <div className="text-[10px] text-zinc-500 mb-1">PoolId #{i}</div>
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <span>{p.a}</span><span className="text-zinc-600">/</span><span>{p.b}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{p.fee}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <InfoCard title="Why it matters" items={[
          'Pool deployment ≈ a storage write, not a CREATE2 (∼99% cheaper).',
          'Multi-hop swaps stay inside one contract — no external calls between hops.',
          'Flash accounting (next section) is only possible because deltas live in one place.',
        ]} />
        <InfoCard title="Under the hood" items={[
          'PoolKey = (currency0, currency1, fee, tickSpacing, hooks)',
          'PoolId = keccak256(PoolKey) — deterministic, no contract needed.',
          'All state lives in PoolManager.pools[PoolId].',
        ]} mono />
      </div>
    </section>
  );
}

// ============ FLASH ACCOUNTING ============
function FlashAccounting() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('v4');

  const steps = [
    { label: 'Start', desc: 'User wants to swap 1000 USDC → DAI via ETH (multi-hop).' },
    { label: 'Hop 1', desc: 'Swap 1000 USDC → 0.4 ETH in USDC/ETH pool.' },
    { label: 'Hop 2', desc: 'Swap 0.4 ETH → 998 DAI in ETH/DAI pool.' },
    { label: 'Settle', desc: 'Net out balances. ETH cancels — only USDC pays in, DAI pays out.' },
    { label: 'Done', desc: mode === 'v4' ? 'unlock() returns. All deltas net to zero.' : 'Final transfer complete.' },
  ];

  const v4Deltas = [
    {},
    { USDC: -1000, ETH: +0.4 },
    { USDC: -1000, ETH: 0, DAI: +998 },
    { USDC: -1000, ETH: 0, DAI: +998 },
    { USDC: 0, ETH: 0, DAI: 0 },
  ];

  const v3Transfers = [
    [],
    ['user → pool1: 1000 USDC', 'pool1 → router: 0.4 WETH'],
    ['user → pool1: 1000 USDC', 'pool1 → router: 0.4 WETH', 'router → pool2: 0.4 WETH', 'pool2 → user: 998 DAI'],
    ['user → pool1: 1000 USDC', 'pool1 → router: 0.4 WETH', 'router → pool2: 0.4 WETH', 'pool2 → user: 998 DAI'],
    ['user → pool1: 1000 USDC', 'pool1 → router: 0.4 WETH', 'router → pool2: 0.4 WETH', 'pool2 → user: 998 DAI'],
  ];

  const reset = () => setStep(0);
  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));

  const deltas = v4Deltas[step] || {};
  const transfers = v3Transfers[step] || [];

  return (
    <section id="flash" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="02" title="Flash Accounting" subtitle="Track owed-to-whom in transient storage. Settle exactly once." />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          {['v3', 'v4'].map(k => (
            <button key={k} onClick={() => { setMode(k); setStep(0); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition"
              style={mode === k ? { background: PINK_DIM, border: `1px solid ${PINK}`, color: PINK } : { border: '1px solid #27272a', color: '#71717a' }}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="px-3 py-2 rounded-lg text-sm border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-1.5">
            <RefreshCw size={14} /> Reset
          </button>
          <button onClick={next} disabled={step === steps.length - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-30"
            style={{ background: PINK, color: 'white' }}>
            Next step <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{
            background: i <= step ? PINK : '#27272a'
          }} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Step {step + 1} / {steps.length}</div>
          <div className="font-bold text-xl mb-2">{steps[step].label}</div>
          <div className="text-zinc-400 text-sm leading-relaxed mb-6">{steps[step].desc}</div>

          <div className="font-mono text-xs space-y-1 text-zinc-500">
            {mode === 'v4' ? (
              <>
                <div>PoolManager.unlock(data) {`{`}</div>
                <div className={step >= 1 ? '' : 'opacity-30'}>  swap(USDC/ETH, +1000 USDC)</div>
                <div className={step >= 2 ? '' : 'opacity-30'}>  swap(ETH/DAI, +0.4 ETH)</div>
                <div className={step >= 3 ? '' : 'opacity-30'}>  settle(USDC); take(DAI)</div>
                <div className={step >= 4 ? '' : 'opacity-30'}>{`}`} ← deltas must = 0</div>
              </>
            ) : (
              <>
                <div>router.exactInput([USDC, ETH, DAI]) {`{`}</div>
                <div className={step >= 1 ? '' : 'opacity-30'}>  pool1.swap() → 2 transfers</div>
                <div className={step >= 2 ? '' : 'opacity-30'}>  pool2.swap() → 2 transfers</div>
                <div className={step >= 4 ? '' : 'opacity-30'}>{`}`} ← 4 ERC-20 transfers total</div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          {mode === 'v4' ? (
            <>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <Activity size={12} /> Transient ledger (EIP-1153)
              </div>
              <div className="space-y-2">
                {Object.keys(deltas).length === 0 ? (
                  <div className="text-sm text-zinc-600 italic">No deltas yet — unlock() not called.</div>
                ) : Object.entries(deltas).map(([tok, val]) => (
                  <div key={tok} className="flex items-center justify-between p-3 rounded-lg" style={{
                    background: val === 0 ? 'rgba(34, 197, 94, 0.08)' : val < 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 0, 122, 0.08)',
                    border: `1px solid ${val === 0 ? 'rgba(34, 197, 94, 0.3)' : val < 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 0, 122, 0.3)'}`
                  }}>
                    <span className="font-mono text-sm">{tok}</span>
                    <span className="font-mono text-sm font-bold" style={{
                      color: val === 0 ? '#22c55e' : val < 0 ? '#ef4444' : PINK
                    }}>
                      {val === 0 ? '✓ settled' : val > 0 ? `+${val}` : val}
                    </span>
                  </div>
                ))}
              </div>
              {step === 4 && (
                <div className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#4ade80' }}>
                  <Check size={14} /> All deltas net to zero — unlock() succeeds.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <Coins size={12} /> ERC-20 transfers fired
              </div>
              <div className="space-y-1.5">
                {transfers.length === 0 ? (
                  <div className="text-sm text-zinc-600 italic">None yet.</div>
                ) : transfers.map((t, i) => (
                  <div key={i} className="font-mono text-xs p-2 rounded bg-zinc-950/60 text-zinc-400 border border-zinc-800">
                    {t}
                  </div>
                ))}
              </div>
              {transfers.length > 0 && (
                <div className="mt-4 text-xs text-zinc-500">
                  ↑ {transfers.length} separate ERC-20 transfers, each with its own gas overhead and re-entrancy surface.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="text-sm leading-relaxed text-zinc-400">
          <span className="text-white font-semibold">The trick:</span> the caller doesn't actually move tokens during the swap. Instead, <span style={{ color: PINK }}>balance deltas</span> accumulate in transient storage. The caller is free to do anything inside <code className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-xs">unlockCallback</code> — chain swaps, rebalance, even flash-loan — as long as every delta is zero by the time control returns to <code className="px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-xs">unlock()</code>. The intermediate ETH never moves on-chain.
        </div>
      </div>
    </section>
  );
}

// ============ HOOKS ============
function Hooks() {
  const [preset, setPreset] = useState('dynamic');

  const lifecycle = [
    { phase: 'Initialize', hooks: ['beforeInitialize', 'afterInitialize'] },
    { phase: 'Liquidity', hooks: ['beforeAddLiquidity', 'afterAddLiquidity', 'beforeRemoveLiquidity', 'afterRemoveLiquidity'] },
    { phase: 'Swap', hooks: ['beforeSwap', 'afterSwap'] },
    { phase: 'Donate', hooks: ['beforeDonate', 'afterDonate'] },
  ];

  const presets = {
    dynamic: { name: 'Dynamic Fees', desc: 'Adjusts fee based on volatility before each swap.', hooks: ['beforeSwap'], color: PINK },
    twamm: { name: 'TWAMM', desc: 'Executes long-term orders pro-rata across blocks before swaps and on liquidity events.', hooks: ['beforeSwap', 'beforeAddLiquidity', 'beforeRemoveLiquidity'], color: PURPLE },
    limit: { name: 'Limit Orders', desc: 'Checks if price crossed an order threshold after each swap.', hooks: ['afterSwap', 'afterInitialize'], color: '#22d3ee' },
    lvr: { name: 'LVR-Aware Fees', desc: 'Auctions arb opportunity into the pool around each swap.', hooks: ['beforeSwap', 'afterSwap'], color: '#fbbf24' },
  };

  const active = presets[preset];

  const flagMap = {
    beforeInitialize: 13, afterInitialize: 12,
    beforeAddLiquidity: 11, afterAddLiquidity: 10,
    beforeRemoveLiquidity: 9, afterRemoveLiquidity: 8,
    beforeSwap: 7, afterSwap: 6,
    beforeDonate: 5, afterDonate: 4,
  };
  const flagBits = active.hooks.reduce((acc, h) => acc | (1 << flagMap[h]), 0);
  const addrSuffix = flagBits.toString(16).padStart(4, '0').toLowerCase();

  return (
    <section id="hooks" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="03" title="Hooks" subtitle="Programmable entry points around every pool lifecycle event." />

      <div className="flex flex-wrap gap-2 mb-10">
        {Object.entries(presets).map(([k, p]) => (
          <button key={k} onClick={() => setPreset(k)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition border"
            style={preset === k
              ? { background: `${p.color}22`, borderColor: p.color, color: p.color }
              : { borderColor: '#27272a', color: '#a1a1aa' }
            }>
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Pool lifecycle</div>
          <div className="space-y-4">
            {lifecycle.map((phase, i) => (
              <div key={i}>
                <div className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  {phase.phase}
                </div>
                <div className="grid grid-cols-2 gap-2 ml-3">
                  {phase.hooks.map(h => {
                    const isActive = active.hooks.includes(h);
                    return (
                      <div key={h} className="px-3 py-2 rounded-md text-xs font-mono transition-all border"
                        style={isActive
                          ? { background: `${active.color}15`, borderColor: active.color, color: active.color, boxShadow: `0 0 20px ${active.color}30` }
                          : { borderColor: '#27272a', color: '#52525b' }
                        }>
                        {h}{isActive && ' ●'}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">{active.name}</div>
          <div className="text-sm text-zinc-300 leading-relaxed mb-5">{active.desc}</div>
          <div className="text-xs text-zinc-500 mb-2">Triggers on:</div>
          <div className="space-y-1">
            {active.hooks.map(h => (
              <div key={h} className="font-mono text-xs px-2 py-1 rounded" style={{ background: `${active.color}10`, color: active.color }}>
                {h}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
          <Hash size={12} /> Hook address encoding
        </div>
        <div className="text-sm text-zinc-400 mb-4 leading-relaxed">
          V4 reads which hooks are enabled from the lower 14 bits of the contract address itself. Deployers mine an address (via CREATE2 salt) so its trailing bits match the hook permissions. No registry, no on-chain lookup.
        </div>
        <div className="font-mono text-sm md:text-base p-4 rounded-lg bg-zinc-950 border border-zinc-800 break-all">
          <span className="text-zinc-600">0x</span>
          <span className="text-zinc-400">A1B2C3D4E5F6789012345678901234567890</span>
          <span style={{ color: active.color, fontWeight: 'bold', textShadow: `0 0 12px ${active.color}` }}>{addrSuffix}</span>
        </div>
        <div className="mt-3 text-xs text-zinc-500 font-mono">
          flags = 0x{addrSuffix} = {active.hooks.map(h => h).join(' | ')}
        </div>
      </div>
    </section>
  );
}

// ============ AMM PLAYGROUND ============
function AmmPlayground() {
  const [amountIn, setAmountIn] = useState(150);
  const [rangePct, setRangePct] = useState(40);

  // Starting reserves (fixed for clarity)
  const x0 = 1000, y0 = 1000;
  const P0 = 1;

  // CP (V2 / full-range)
  const Lcp = Math.sqrt(x0 * y0); // 1000

  // CL: symmetric range [1/r, r] in price space, sized by slider
  // rangePct 5% → very tight, rangePct 100% → wide
  const r = 1.05 + (rangePct / 100) ** 1.5 * 8;
  const Pa = 1 / r, Pb = r;
  const sqrtPa = Math.sqrt(Pa), sqrtPb = Math.sqrt(Pb);

  // L for CL such that starting reserves match (1000, 1000)
  // y0 = L*(sqrt(P0) - sqrtPa) → L = y0 / (1 - sqrtPa)
  const Lcl = y0 / (1 - sqrtPa);

  // CP swap math
  const xCp1 = x0 + amountIn;
  const yCp1 = (Lcp * Lcp) / xCp1;
  const cpOut = y0 - yCp1;
  const cpPrice1 = yCp1 / xCp1;

  // CL swap math (using virtual reserves: x_virt = L/sqrt(P), y_virt = L*sqrt(P))
  let sqrtP1 = Lcl / (Lcl + amountIn);
  let saturated = false;
  if (sqrtP1 < sqrtPa) {
    sqrtP1 = sqrtPa;
    saturated = true;
  }
  const clPrice1 = sqrtP1 * sqrtP1;
  const clOut = Lcl * (1 - sqrtP1);
  const xCl1 = Lcl * (1 / sqrtP1 - 1 / sqrtPb);
  const yCl1 = Lcl * (sqrtP1 - sqrtPa);

  // SVG dimensions
  const W = 460, H = 380, PAD = 38;
  const axMax = 2400, ayMax = 2400;
  const sx = v => PAD + (v / axMax) * (W - 2 * PAD);
  const sy = v => H - PAD - (v / ayMax) * (H - 2 * PAD);

  // CP curve path
  const cpPts = [];
  for (let i = 0; i <= 80; i++) {
    const xx = 80 + (axMax - 80) * (i / 80);
    const yy = (Lcp * Lcp) / xx;
    if (yy <= ayMax * 1.05) cpPts.push([sx(xx), sy(Math.min(yy, ayMax))]);
  }
  const cpPath = cpPts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  // CL curve path
  const clPts = [];
  for (let i = 0; i <= 80; i++) {
    const sqp = sqrtPa + (sqrtPb - sqrtPa) * (i / 80);
    const xx = Lcl * (1 / sqp - 1 / sqrtPb);
    const yy = Lcl * (sqp - sqrtPa);
    if (xx <= axMax && yy <= ayMax) clPts.push([sx(xx), sy(yy)]);
  }
  const clPath = clPts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  // CL curve fill (area under curve to origin) for visual emphasis
  const clFillPath = clPts.length
    ? clPath + ` L${sx(0).toFixed(1)},${sy(0).toFixed(1)} Z`
    : '';

  // Range bound endpoints
  const xMaxCL = Lcl * (1 / sqrtPa - 1 / sqrtPb);
  const yMaxCL = Lcl * (sqrtPb - sqrtPa);

  const advantage = cpOut > 0 ? ((clOut / cpOut - 1) * 100) : 0;

  return (
    <section id="amm" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="04" title="AMM Curve Playground" subtitle="Same starting capital, two liquidity curves. Move the sliders." />

      {/* Sliders */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <SliderCard
          label="Trade size — send X tokens in"
          value={amountIn}
          onChange={setAmountIn}
          min={0} max={2000} step={5}
          display={`${amountIn}`}
          unit="X"
        />
        <SliderCard
          label="Concentrated range width"
          sub={`P ∈ [${Pa.toFixed(3)}, ${Pb.toFixed(3)}]`}
          value={rangePct}
          onChange={setRangePct}
          min={5} max={100} step={1}
          display={rangePct < 25 ? 'tight' : rangePct < 65 ? 'medium' : 'wide'}
        />
      </div>

      {/* Plot + Stats */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* SVG plot */}
        <div className="lg:col-span-3 p-5 rounded-xl border border-zinc-800 bg-zinc-950">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 460 }}>
            {/* Grid */}
            {[500, 1000, 1500, 2000].map(g => (
              <g key={g} opacity="0.15">
                <line x1={sx(g)} y1={PAD} x2={sx(g)} y2={H - PAD} stroke="#52525b" strokeDasharray="2 3" />
                <line x1={PAD} y1={sy(g)} x2={W - PAD} y2={sy(g)} stroke="#52525b" strokeDasharray="2 3" />
              </g>
            ))}
            {/* Tick labels */}
            {[500, 1000, 1500, 2000].map(g => (
              <g key={`t-${g}`}>
                <text x={sx(g)} y={H - PAD + 14} fontSize="9" fill="#52525b" textAnchor="middle">{g}</text>
                <text x={PAD - 6} y={sy(g) + 3} fontSize="9" fill="#52525b" textAnchor="end">{g}</text>
              </g>
            ))}

            {/* Axes */}
            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#52525b" strokeWidth="1" />
            <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#52525b" strokeWidth="1" />

            {/* Axis labels */}
            <text x={W - PAD} y={H - 8} fontSize="10" fill="#71717a" textAnchor="end">Token X reserves →</text>
            <text x={PAD - 26} y={PAD - 6} fontSize="10" fill="#71717a">↑ Token Y</text>

            {/* CL fill */}
            {clFillPath && <path d={clFillPath} fill={PINK} opacity="0.06" />}

            {/* CP curve */}
            <path d={cpPath} fill="none" stroke={PURPLE} strokeWidth="2" opacity="0.7" />

            {/* CL curve */}
            <path d={clPath} fill="none" stroke={PINK} strokeWidth="2.5" />

            {/* Range bound markers (axes intersections) */}
            <circle cx={sx(xMaxCL)} cy={sy(0)} r="3" fill={PINK} opacity="0.6" />
            <circle cx={sx(0)} cy={sy(yMaxCL)} r="3" fill={PINK} opacity="0.6" />
            <text x={sx(xMaxCL)} y={sy(0) - 6} fontSize="9" fill={PINK} textAnchor="middle" opacity="0.8">P=Pa</text>
            <text x={sx(0) + 8} y={sy(yMaxCL) + 4} fontSize="9" fill={PINK} opacity="0.8">P=Pb</text>

            {/* Trade move arrows */}
            {amountIn > 0 && (
              <>
                <line x1={sx(x0)} y1={sy(y0)} x2={sx(xCp1)} y2={sy(yCp1)} stroke={PURPLE} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
                <line x1={sx(x0)} y1={sy(y0)} x2={sx(xCl1)} y2={sy(yCl1)} stroke={PINK} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7" />
              </>
            )}

            {/* After-swap markers */}
            <circle cx={sx(xCp1)} cy={sy(yCp1)} r="4.5" fill={PURPLE} stroke="#0a0a0c" strokeWidth="1.5" />
            <circle cx={sx(xCl1)} cy={sy(yCl1)} r="4.5" fill={PINK} stroke="#0a0a0c" strokeWidth="1.5" />

            {/* Starting point (drawn last so it's on top) */}
            <circle cx={sx(x0)} cy={sy(y0)} r="6" fill="white" stroke="#0a0a0c" strokeWidth="2" />
            <text x={sx(x0) + 10} y={sy(y0) - 8} fontSize="10" fill="#fafafa">start</text>

            {/* Legend */}
            <g transform={`translate(${W - 168}, ${PAD + 8})`}>
              <rect x="0" y="0" width="158" height="58" fill="#0a0a0c" stroke="#27272a" rx="6" />
              <line x1="10" y1="18" x2="32" y2="18" stroke={PURPLE} strokeWidth="2.5" />
              <text x="38" y="22" fontSize="10" fill="#a1a1aa">Constant product</text>
              <line x1="10" y1="40" x2="32" y2="40" stroke={PINK} strokeWidth="2.5" />
              <text x="38" y="44" fontSize="10" fill="#a1a1aa">Concentrated</text>
            </g>
          </svg>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-3">
          <ResultCard
            label="Constant Product (V2)"
            color={PURPLE}
            out={cpOut}
            priceTo={cpPrice1}
            L={Lcp}
          />
          <ResultCard
            label="Concentrated (V3 / V4)"
            color={PINK}
            out={clOut}
            priceTo={clPrice1}
            L={Lcl}
            badge={saturated ? 'range exhausted' : null}
          />
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
              <TrendingDown size={12} /> Slippage comparison
            </div>
            <div className="space-y-1.5 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">CP impact</span>
                <span style={{ color: PURPLE }}>{((1 - cpPrice1) * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">CL impact</span>
                <span style={{ color: PINK }}>{((1 - clPrice1) * 100).toFixed(2)}%</span>
              </div>
            </div>
            {amountIn > 0 && !saturated && (
              <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                CL gives <span className="font-bold" style={{ color: PINK }}>{advantage > 0 ? '+' : ''}{advantage.toFixed(1)}%</span> more output. Same capital, narrower range, ~{(Lcl / Lcp).toFixed(1)}× the liquidity at center.
              </div>
            )}
            {saturated && (
              <div className="mt-3 pt-3 border-t border-zinc-800 text-xs leading-relaxed flex items-start gap-2" style={{ color: '#fbbf24' }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>Trade pushed price to lower bound P=Pa. Position is now 100% token X. In V3/V4 the swap router would route the rest into the next tick range.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Math + intuition */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <InfoCard title="The math" items={[
          'CP invariant: x · y = L²',
          'CL invariant: same, but on virtual reserves x_v = L/√P and y_v = L·√P',
          'CL position only owns liquidity in [Pa, Pb] — outside, it\'s 100% one token',
          'Same capital + narrower range → higher L → less slippage',
        ]} mono />
        <InfoCard title="What V4 changes" items={[
          'V4 keeps V3\'s concentrated liquidity model (same tick math).',
          'But hooks can override fees, add custom curves, or run async logic at swap time.',
          'A hook-modified pool can quote a different price than the base curve — useful for TWAMM, RFQ, oracle-aware pricing.',
          'The default behavior without hooks is exactly the pink curve above.',
        ]} />
      </div>
    </section>
  );
}

function SliderCard({ label, sub, value, onChange, min, max, step, display, unit }) {
  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">{label}</div>
          {sub && <div className="text-xs text-zinc-600 mt-1 font-mono">{sub}</div>}
        </div>
        <div className="font-mono text-base font-semibold" style={{ color: PINK }}>
          {display}{unit && <span className="text-zinc-500 ml-1 text-sm font-normal">{unit}</span>}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: PINK }}
      />
    </div>
  );
}

function ResultCard({ label, color, out, priceTo, L, badge }) {
  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: `${color}55`, background: `${color}08` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color }}>{label}</div>
        {badge && (
          <div className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: '#fbbf2422', color: '#fbbf24' }}>
            {badge}
          </div>
        )}
      </div>
      <div className="space-y-1 font-mono text-sm">
        <div className="flex justify-between"><span className="text-zinc-500">Y received</span><span className="font-semibold">{out.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Price after</span><span>{priceTo.toFixed(4)}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Liquidity L</span><span className="text-zinc-400">{L.toFixed(0)}</span></div>
      </div>
    </div>
  );
}

// ============ NATIVE ETH ============
function NativeEth() {
  return (
    <section id="native" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="05" title="Native ETH + Custom Accounting" subtitle="No more wrapping. Tokens are a Currency, not just an ERC-20." />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">V3</div>
          <pre className="font-mono text-xs text-zinc-400 leading-relaxed overflow-x-auto">
{`// Wrap ETH first, every time
WETH.deposit{value: 1 ether}();
WETH.approve(router, 1 ether);
router.exactInputSingle({
  tokenIn: WETH,
  ...
});`}
          </pre>
        </div>
        <div className="p-6 rounded-xl border-2 bg-zinc-900/40" style={{ borderColor: PINK_DIM }}>
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: PINK }}>V4</div>
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
{`// ETH is just Currency.wrap(0)
PoolKey memory key = PoolKey({
  currency0: Currency.wrap(address(0)),
  currency1: USDC,
  ...
});
manager.swap{value: 1 ether}(key, ...);`}
          </pre>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
        <Bullet label="No WETH overhead" desc="Saves ~6k gas per ETH-leg swap." />
        <Bullet label="take / settle pattern" desc="Hooks can mint/burn claims tokens to do custom accounting without moving real tokens." />
        <Bullet label="Currency type" desc="Unified abstraction over ETH and ERC-20s — fewer code paths, fewer bugs." />
      </div>
    </section>
  );
}

// ============ SIMULATOR ============
function SwapSimulator() {
  const [opts, setOpts] = useState({ beforeSwap: false, afterSwap: false, dynamicFee: false });
  const toggle = k => setOpts(o => ({ ...o, [k]: !o[k] }));

  const baseGas = 118000;
  const gasAdd = (opts.beforeSwap ? 22000 : 0) + (opts.afterSwap ? 18000 : 0) + (opts.dynamicFee ? 8000 : 0);
  const totalGas = baseGas + gasAdd;

  const trace = [
    { d: 0, t: 'PoolManager.unlock(data)', kind: 'core' },
    { d: 1, t: 'Router.unlockCallback(data)', kind: 'core' },
    ...(opts.beforeSwap ? [{ d: 2, t: 'hooks.beforeSwap(sender, key, params)', kind: 'hook' }] : []),
    ...(opts.dynamicFee ? [{ d: 3, t: '↳ updateDynamicLPFee(key, computed)', kind: 'hook' }] : []),
    { d: 2, t: 'PoolManager.swap(key, params)', kind: 'core' },
    { d: 3, t: '↳ Pool.swap → tick traversal, fee accrual', kind: 'core' },
    ...(opts.afterSwap ? [{ d: 2, t: 'hooks.afterSwap(sender, key, params, delta)', kind: 'hook' }] : []),
    { d: 2, t: 'PoolManager.settle()  // pay token in', kind: 'core' },
    { d: 2, t: 'PoolManager.take()    // receive token out', kind: 'core' },
    { d: 1, t: 'return  // deltas must = 0', kind: 'core' },
  ];

  return (
    <section id="sim" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="06" title="Swap Simulator" subtitle="Toggle hooks, watch the call trace and gas shift." />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Pool config</div>
          <div className="space-y-3">
            {[
              { k: 'beforeSwap', label: 'beforeSwap hook', g: '+22k' },
              { k: 'afterSwap', label: 'afterSwap hook', g: '+18k' },
              { k: 'dynamicFee', label: 'Dynamic fee', g: '+8k' },
            ].map(o => (
              <label key={o.k} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 cursor-pointer hover:bg-zinc-900 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-5 rounded-full relative transition" style={{ background: opts[o.k] ? PINK : '#3f3f46' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: opts[o.k] ? '18px' : '2px' }} />
                  </div>
                  <span className="text-sm">{o.label}</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">{o.g}</span>
                <input type="checkbox" checked={opts[o.k]} onChange={() => toggle(o.k)} className="hidden" />
              </label>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ background: PINK_DIM, border: `1px solid ${PINK}` }}>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: PINK }}>Estimated gas</div>
            <div className="text-2xl font-bold font-mono">{totalGas.toLocaleString()}</div>
            <div className="text-xs text-zinc-400 mt-1">base {baseGas.toLocaleString()} + hooks {gasAdd.toLocaleString()}</div>
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
            <GitBranch size={12} /> Call trace
          </div>
          <div className="font-mono text-xs space-y-1.5">
            {trace.map((line, i) => (
              <div key={i} className="flex items-start gap-2 transition-all" style={{ paddingLeft: `${line.d * 18}px` }}>
                <span className="text-zinc-700 select-none">{i.toString().padStart(2, '0')}</span>
                <span style={{ color: line.kind === 'hook' ? PINK : '#d4d4d8' }}>{line.t}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-800 text-xs text-zinc-500 leading-relaxed">
            Note: gas figures illustrative. Real costs depend on hook implementation, tick traversal, and warm/cold storage. The shape of the trace is the key takeaway.
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ COMPARISON ============
function Comparison() {
  const rows = [
    { feat: 'Pool deployment', v3: 'CREATE2 deploys new contract', v4: 'Single SSTORE in PoolManager' },
    { feat: 'Multi-hop swap', v3: 'External calls between pool contracts', v4: 'In-contract, deltas only' },
    { feat: 'Token transfers per swap', v3: '2 ERC-20 transfers per hop', v4: 'Net settle once at unlock end' },
    { feat: 'Native ETH', v3: 'Wrap to WETH first', v4: 'Direct via Currency type' },
    { feat: 'Custom logic', v3: 'Limited to fee tier choice', v4: 'Hooks at every lifecycle point' },
    { feat: 'Fee model', v3: 'Static (0.01 / 0.05 / 0.30 / 1.00)', v4: 'Static OR dynamic (via hook)' },
    { feat: 'Singleton', v3: 'No', v4: 'Yes — PoolManager' },
    { feat: 'Transient storage', v3: 'N/A', v4: 'EIP-1153 for flash accounting' },
  ];

  return (
    <section id="compare" className="max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900">
      <SectionHeader num="07" title="V3 vs V4" subtitle="Reference card." />
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-3 bg-zinc-900/60 border-b border-zinc-800">
          <div className="p-4 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Feature</div>
          <div className="p-4 text-xs uppercase tracking-widest text-zinc-500 font-semibold">V3</div>
          <div className="p-4 text-xs uppercase tracking-widest font-semibold" style={{ color: PINK }}>V4</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-3 border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 transition">
            <div className="p-4 text-sm font-medium">{r.feat}</div>
            <div className="p-4 text-sm text-zinc-400">{r.v3}</div>
            <div className="p-4 text-sm">{r.v4}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-xl border text-center" style={{ borderColor: PINK_DIM, background: `linear-gradient(135deg, ${PINK_DIM}, transparent)` }}>
        <Sparkles size={24} style={{ color: PINK }} className="mx-auto mb-3" />
        <div className="font-bold text-xl mb-2">The mental model</div>
        <div className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
          V3 was a great AMM. V4 is a <span style={{ color: PINK }}>platform for AMMs</span> — a singleton that handles accounting and pool plumbing, with hooks letting builders ship custom liquidity behavior without forking a codebase.
        </div>
      </div>

      <div className="mt-8 text-xs text-zinc-600 text-center">
        Built for explanation. Numbers illustrative. Read the <a href="https://github.com/Uniswap/v4-core" className="underline hover:text-zinc-400" target="_blank" rel="noopener noreferrer">v4-core source</a> for ground truth.
      </div>
    </section>
  );
}

// ============ HELPERS ============
function SectionHeader({ num, title, subtitle }) {
  return (
    <div className="mb-10">
      <div className="text-xs font-mono mb-2" style={{ color: PINK }}>/ {num}</div>
      <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{title}</h2>
      <div className="text-zinc-400 text-base">{subtitle}</div>
    </div>
  );
}

function InfoCard({ title, items, mono }) {
  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">{title}</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className={`text-sm text-zinc-300 leading-relaxed flex gap-2 ${mono ? 'font-mono text-xs' : ''}`}>
            <span style={{ color: PINK }} className="mt-1">›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bullet({ label, desc }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
      <div className="font-semibold text-sm mb-1" style={{ color: PINK }}>{label}</div>
      <div className="text-sm text-zinc-400 leading-relaxed">{desc}</div>
    </div>
  );
}

// ============ MAIN ============
export default function App() {
  return (
    <div className="min-h-screen text-zinc-100" style={{
      background: 'radial-gradient(ellipse at top, #1a0a14, #0a0a0c 50%)',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        ::selection { background: ${PINK}; color: white; }
      `}</style>
      <Nav />
      <Hero />
      <Singleton />
      <FlashAccounting />
      <Hooks />
      <AmmPlayground />
      <NativeEth />
      <SwapSimulator />
      <Comparison />
      <div className="h-20" />
    </div>
  );
}
