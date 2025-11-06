// WealthBride Investment - client-side script
// Features:
// - MetaMask connect & signature verification flow (client-side only)
// - Investment form -> dashboard with live simulated growth to 6.5x over 7 days
// - Deposit and withdraw request UI (POSTs to /api endpoints - backend needed to process)
// - Support contact form
// - DOES NOT request or store seed phrases/private keys (never do this)

// -----------------------------
// DOM references
const connectMetaBtn = document.getElementById('connectMeta');
const connectWcBtn = document.getElementById('connectWC');
const walletInfo = document.getElementById('walletInfo');

const showFormBtn = document.getElementById('showForm');
const investmentForm = document.getElementById('investmentForm');
const submitInvestment = document.getElementById('submitInvestment');
const cancelForm = document.getElementById('cancelForm');

const dashboard = document.getElementById('dashboard');
const backBtn = document.getElementById('backBtn');

const dashName = document.getElementById('dashName');
const dashWallet = document.getElementById('dashWallet');
const dashType = document.getElementById('dashType');
const dashAmount = document.getElementById('dashAmount');
const liveCounterEl = document.getElementById('liveCounter');
const profitPercentEl = document.getElementById('profitPercent');
const timeRemainingEl = document.getElementById('timeRemaining');
const dashStatusEl = document.getElementById('dashStatus');

const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');

const depositModal = document.getElementById('depositModal');
const closeDeposit = document.getElementById('closeDeposit');
const startDeposit = document.getElementById('startDeposit');
const depositMsg = document.getElementById('depositMsg');

const withdrawModal = document.getElementById('withdrawModal');
const closeWithdraw = document.getElementById('closeWithdraw');
const submitWithdraw = document.getElementById('submitWithdraw');
const withdrawMsg = document.getElementById('withdrawMsg');

const supportBtn = document.getElementById('supportBtn');
const supportSection = document.getElementById('supportSection');
const sendSupport = document.getElementById('sendSupport');
const supportStatus = document.getElementById('supportStatus');

// Misc
let provider, signer, userAddress, walletType;
let liveInterval = null;
let simulation = null;

// -----------------------------
// Wallet connection (MetaMask)
async function connectMetaMask() {
  try {
    if (!window.ethereum) {
      alert('MetaMask not found. Please install MetaMask extension or use a mobile wallet with WalletConnect.');
      return;
    }
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    walletType = 'MetaMask';
    walletInfo.textContent = `${walletType} connected: ${userAddress}`;
    walletInfo.style.color = '#00ffb3';

    // OPTIONAL: verify ownership with server nonce flow:
    // getNonce -> signer.signMessage(nonce) -> POST to /api/auth/verify
    // (server-side endpoints are required)
  } catch (err) {
    console.error('MetaMask connect error', err);
    walletInfo.textContent = 'MetaMask connection failed';
    walletInfo.style.color = '#ff8b8b';
  }
}

// -----------------------------
// WalletConnect (placeholder)
// Full WalletConnect integration requires adding @walletconnect/web3-provider and wiring.
// For demo, we show a message and you can implement actual provider in production.
function connectWalletConnectPlaceholder() {
  alert('WalletConnect integration requires additional setup. See comments in script.js to implement using @walletconnect/web3-provider.');
}

// -----------------------------
// UI toggles
showFormBtn.addEventListener('click', () => {
  investmentForm.classList.toggle('hidden');
});
cancelForm.addEventListener('click', () => {
  investmentForm.classList.add('hidden');
});

// wire wallet buttons
connectMetaBtn.addEventListener('click', connectMetaMask);
connectWcBtn.addEventListener('click', connectWalletConnectPlaceholder);

// -----------------------------
// Investment submission -> show dashboard with simulation
submitInvestment.addEventListener('click', () => {
  const name = document.getElementById('userName').value.trim();
  const type = document.getElementById('investmentType').value;
  const amount = parseFloat(document.getElementById('amount').value);

  if (!userAddress) {
    alert('Please connect your wallet first.');
    return;
  }
  if (!name) {
    alert('Please enter your name.');
    return;
  }
  if (!type) {
    alert('Please select an investment type.');
    return;
  }
  if (!amount || amount <= 0) {
    alert('Enter a valid investment amount.');
    return;
  }

  // Populate dashboard
  dashName.textContent = name;
  dashWallet.textContent = userAddress;
  dashType.textContent = type;
  dashAmount.textContent = amount.toFixed(2);

  // Start simulated growth to 6.5x over 7 days
  startSimulation(amount, 6.5, 7 * 24 * 60 * 60); // 7 days

  // Show dashboard and hide form
  dashboard.classList.remove('hidden');
  investmentForm.classList.add('hidden');
});

// Back button
backBtn.addEventListener('click', () => {
  dashboard.classList.add('hidden');
  stopSimulation();
});

// -----------------------------
// Simulation: linear progress per second toward target (client-side demo)
// amount: starting USD amount
// multiplier: e.g. 6.5 (for 650% final amount)
// durationSeconds: seconds to reach (e.g., 7 days = 604800)
function startSimulation(amount, multiplier, durationSeconds) {
  stopSimulation(); // clear old interval if any

  const start = Date.now();
  const totalSeconds = durationSeconds;
  const target = amount * multiplier;
  let elapsed = 0;

  liveCounterEl.textContent = amount.toFixed(2);
  profitPercentEl.textContent = '+0.00%';
  timeRemainingEl.textContent = formatTime(totalSeconds);

  dashStatusEl.textContent = 'Active';

  // update once per second
  simulation = {
    amount, target, totalSeconds, elapsed
  };

  liveInterval = setInterval(() => {
    simulation.elapsed++;
    const progress = simulation.elapsed / simulation.totalSeconds;
    if (progress >= 1) {
      liveCounterEl.textContent = simulation.target.toFixed(2);
      profitPercentEl.textContent = `+${(((simulation.target - simulation.amount) / simulation.amount) * 100).toFixed(2)}%`;
      timeRemainingEl.textContent = formatTime(0);
      dashStatusEl.textContent = 'Completed';
      stopSimulation();
      return;
    }
    const current = simulation.amount + (simulation.target - simulation.amount) * progress;
    const profitPercent = ((current - simulation.amount) / simulation.amount) * 100;

    liveCounterEl.textContent = current.toFixed(2);
    profitPercentEl.textContent = `+${profitPercent.toFixed(2)}%`;
    timeRemainingEl.textContent = formatTime(simulation.totalSeconds - simulation.elapsed);
  }, 1000);
}

function stopSimulation() {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = null;
  }
  simulation = null;
}

function formatTime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

// -----------------------------
// Deposit modal logic (front-end only - needs backend to process real payments)
depositBtn.addEventListener('click', () => {
  depositModal.classList.remove('hidden');
});
closeDeposit.addEventListener('click', () => {
  depositModal.classList.add('hidden');
});
startDeposit.addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('depositAmount').value);
  const method = document.getElementById('depositMethod').value;

  if (!amount || amount <= 0) {
    depositMsg.style.color = 'red';
    depositMsg.textContent = 'Enter a valid amount';
    return;
  }
  depositMsg.style.color = varOrDefault('--main-color', '#00ffb3');
  depositMsg.textContent = 'Creating payment (demo)...';

  // Example: POST to /api/deposits/create -> backend creates payment session (Stripe / crypto invoice)
  try {
    const resp = await fetch('/api/deposits/create', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ amount, method, wallet: userAddress })
    });
    const json = await resp.json();
    if (json.error) {
      depositMsg.style.color = 'red';
      depositMsg.textContent = json.error;
      return;
    }
    if (json.paymentUrl) {
      depositMsg.innerHTML = `Open payment: <a href="${json.paymentUrl}" target="_blank">Pay now</a>`;
    } else {
      depositMsg.textContent = 'Deposit request created (demo). Backend required to complete payment.';
    }
  } catch (err) {
    console.error(err);
    depositMsg.style.color = 'red';
    depositMsg.textContent = 'Network error (demo)';
  }
});

// -----------------------------
// Withdraw request (user side) -> stored as request for admin to approve
withdrawBtn.addEventListener('click', () => {
  withdrawModal.classList.remove('hidden');
});
closeWithdraw.addEventListener('click', () => {
  withdrawModal.classList.add('hidden');
});
submitWithdraw.addEventListener('click', async () => {
  const wallet = document.getElementById('withdrawWallet').value.trim();
  const amount = parseFloat(document.getElementById('withdrawAmount').value);

  if (!userAddress) {
    withdrawMsg.style.color = 'red';
    withdrawMsg.textContent = 'Connect wallet first';
    return;
  }
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    withdrawMsg.style.color = 'red';
    withdrawMsg.textContent = 'Enter a valid Ethereum address (0x...)';
    return;
  }
  if (!amount || amount <= 0) {
    withdrawMsg.style.color = 'red';
    withdrawMsg.textContent = 'Enter a valid amount';
    return;
  }

  withdrawMsg.style.color = varOrDefault('--main-color', '#00ffb3');
  withdrawMsg.textContent = 'Submitting withdrawal request...';

  try {
    const resp = await fetch('/api/withdrawals/request', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ walletAddress: wallet, amount, requesterWallet: userAddress })
    });
    const json = await resp.json();
    if (json.error) {
      withdrawMsg.style.color = 'red';
      withdrawMsg.textContent = json.error;
    } else {
      withdrawMsg.style.color = varOrDefault('--main-color', '#00ffb3');
      withdrawMsg.textContent = 'Withdrawal request submitted. Admin will process it.';
      // optionally clear fields and close
      document.getElementById('withdrawWallet').value = '';
      document.getElementById('withdrawAmount').value = '';
      setTimeout(()=> withdrawModal.classList.add('hidden'), 1200);
    }
  } catch (err) {
    console.error(err);
    withdrawMsg.style.color = 'red';
    withdrawMsg.textContent = 'Network error (demo)';
  }
});

// -----------------------------
// Support contact
supportBtn.addEventListener('click', () => {
  supportSection.classList.toggle('hidden');
});
sendSupport.addEventListener('click', async () => {
  const name = document.getElementById('supportName').value.trim();
  const email = document.getElementById('supportEmail').value.trim();
  const msg = document.getElementById('supportMsg').value.trim();

  if (!name || !email || !msg) {
    supportStatus.style.color = 'red';
    supportStatus.textContent = 'Please fill all fields.';
    return;
  }

  supportStatus.style.color = varOrDefault('--main-color', '#00ffb3');
  supportStatus.textContent = 'Sending message (demo)...';

  try {
    const resp = await fetch('/api/support/send', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, msg, wallet: userAddress })
    });
    const json = await resp.json();
    if (json.error) {
      supportStatus.style.color = 'red';
      supportStatus.textContent = json.error;
    } else {
      supportStatus.style.color = varOrDefault('--main-color', '#00ffb3');
      supportStatus.textContent = 'Message sent. We will contact you shortly.';
      document.getElementById('supportName').value = '';
      document.getElementById('supportEmail').value = '';
      document.getElementById('supportMsg').value = '';
    }
  } catch (err) {
    console.error(err);
    supportStatus.style.color = 'red';
    supportStatus.textContent = 'Network error (demo)';
  }
});

// -----------------------------
// Helper: fallback for CSS var color usage in JS
function varOrDefault(name, fallback) {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name);
    return val ? val.trim() : fallback;
  } catch (e) {
    return fallback;
  }
}

/* -----------------------------
  Notes & next steps (important)
  - This is a front-end demo + UI. To process payments, deposits, withdrawals, and to verify signatures you must
    implement server-side endpoints (/api/...) and secure admin endpoints.
  - NEVER ask users for their seed phrase or private key. This code does not ask for that.
  - For WalletConnect: integrate @walletconnect/web3-provider on server/bundler side and replace placeholder.
  - For production, use HTTPS, a real backend, authentication, nonce-based signature verification, and audit logging.
----------------------------- */
