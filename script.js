// === WealthBride Investment Script ===
// Simulated + real MetaMask connection with safety

const connectBtn = document.getElementById("connectMeta");
const walletInfo = document.getElementById("walletInfo");
const noWallet = document.getElementById("no-wallet");

async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const wallet = accounts[0];
      window.__WB_userWallet = wallet;
      walletInfo.textContent = `Connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
      noWallet.classList.add("hidden");
    } catch (err) {
      walletInfo.textContent = "Connection rejected.";
    }
  } else {
    // fallback simulated wallet
    const fakeWallet = "0x" + Math.random().toString(16).substring(2, 14) + "DEMO";
    window.__WB_userWallet = fakeWallet;
    walletInfo.textContent = `Demo wallet: ${fakeWallet}`;
    noWallet.classList.remove("hidden");
  }
}

connectBtn.addEventListener("click", connectWallet);

// === Investment Form Logic ===

const showFormBtn = document.getElementById("showForm");
const formEl = document.getElementById("investmentForm");
const cancelForm = document.getElementById("cancelForm");
const submitInvestment = document.getElementById("submitInvestment");
const dash = document.getElementById("dashboard");

const dashName = document.getElementById("dashName");
const dashType = document.getElementById("dashType");
const dashAmount = document.getElementById("dashAmount");
const dashWallet = document.getElementById("dashWallet");
const liveCounter = document.getElementById("liveCounter");
const profitPercent = document.getElementById("profitPercent");
const timeRemaining = document.getElementById("timeRemaining");

showFormBtn.onclick = () => formEl.classList.remove("hidden");
cancelForm.onclick = () => formEl.classList.add("hidden");

let investment = null;
let growthTimer = null;

submitInvestment.onclick = () => {
  const name = document.getElementById("userName").value.trim();
  const type = document.getElementById("investmentType").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if (!name || !type || !amount || amount <= 0) {
    alert("Fill in all fields correctly.");
    return;
  }

  investment = { name, type, amount, start: Date.now() };
  dashName.textContent = name;
  dashType.textContent = type;
  dashAmount.textContent = amount.toFixed(2);
  dashWallet.textContent = window.__WB_userWallet || "Not connected";

  formEl.classList.add("hidden");
  dash.classList.remove("hidden");

  startGrowthSimulation(amount);
};

function startGrowthSimulation(amount) {
  const totalTarget = amount * 6.5; // ~550% total over 7 days
  const duration = 7 * 24 * 60 * 60 * 1000;
  const start = Date.now();

  clearInterval(growthTimer);
  growthTimer = setInterval(() => {
    const elapsed = Date.now() - start;
    if (elapsed >= duration) {
      clearInterval(growthTimer);
      liveCounter.textContent = totalTarget.toFixed(2);
      profitPercent.textContent = "+550%";
      timeRemaining.textContent = "Completed";
      return;
    }
    const progress = elapsed / duration;
    const value = amount + (totalTarget - amount) * progress;
    const profit = (progress * 550).toFixed(1);
    liveCounter.textContent = value.toFixed(2);
    profitPercent.textContent = `+${profit}%`;

    const remaining = duration - elapsed;
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((remaining / (1000 * 60)) % 60);
    timeRemaining.textContent = `${days}d ${hours}h ${mins}m`;
  }, 1000);
}

// === Modals ===
const depositModal = document.getElementById("depositModal");
const withdrawModal = document.getElementById("withdrawModal");

document.getElementById("depositBtn").onclick = () => depositModal.classList.remove("hidden");
document.getElementById("withdrawBtn").onclick = () => withdrawModal.classList.remove("hidden");
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.onclick = e => {
    if (e.target.dataset.close === "deposit") depositModal.classList.add("hidden");
    if (e.target.dataset.close === "withdraw") withdrawModal.classList.add("hidden");
  };
});

// === Support ===
document.getElementById("supportBtn").onclick = () => {
  document.getElementById("supportSection").classList.remove("hidden");
};

document.getElementById("sendSupport").onclick = () => {
  const msg = document.getElementById("supportMsg").value.trim();
  document.getElementById("supportStatus").textContent =
    msg ? "Support request sent successfully." : "Please write a message.";
};

// === Deposit & Withdraw Buttons ===
document.getElementById("startDeposit").onclick = () => {
  const amt = document.getElementById("depositAmount").value;
  document.getElementById("depositMsg").textContent = amt
    ? `Deposit request of $${amt} created.`
    : "Enter an amount.";
};

document.getElementById("submitWithdraw").onclick = () => {
  const amt = document.getElementById("withdrawAmount").value;
  const addr = document.getElementById("withdrawWallet").value;
  document.getElementById("withdrawMsg").textContent =
    amt && addr ? `Withdrawal request of $${amt} sent.` : "Fill all fields.";
};
