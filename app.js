import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";
import { CONFIG } from "./config.js";

const GAME_ABI = [
  "function METOK() view returns (address)",
  "function treasury() view returns (address)",
  "function feeBps() view returns (uint16)",
  "function availableBalance(address) view returns (uint256)",
  "function totalAvailable() view returns (uint256)",
  "function totalLocked() view returns (uint256)",
  "function protocolFees() view returns (uint256)",
  "function accountedAssets() view returns (uint256)",
  "function surplus() view returns (uint256)",
  "function isSolvent() view returns (bool)",
  "function nextRoomId() view returns (uint256)",
  "function activeRoomOf(address) view returns (uint256)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function withdrawAll()",
  "function createRoom(uint256 stake,uint256 bankroll) returns (uint256 roomId)",
  "function joinRoom(uint256 roomId)",
  "function cancelWaitingRoom(uint256 roomId)",
  "function expireRoom(uint256 roomId)",
  "function requestLeave(uint256 roomId)",
  "function requestImmediateLeave(uint256 roomId,uint64 expectedMatchId,uint32 expectedRoundId)",
  "function commitmentFor(uint256 roomId,uint64 matchId,uint32 roundId,address player,uint8 choice,bytes32 secret) view returns (bytes32)",
  "function confirmChoice(uint256 roomId,uint64 expectedMatchId,uint32 expectedRoundId,bytes32 commitment)",
  "function revealChoice(uint256 roomId,uint64 expectedMatchId,uint32 expectedRoundId,uint8 choice,bytes32 secret)",
  "function settleChoiceTimeout(uint256 roomId,uint64 expectedMatchId,uint32 expectedRoundId,uint8 choice,bytes32 secret)",
  "function forceSettleChoiceTimeout(uint256 roomId,uint64 expectedMatchId,uint32 expectedRoundId)",
  "function settleRevealTimeout(uint256 roomId,uint64 expectedMatchId,uint32 expectedRoundId)",
  "function getRoom(uint256 roomId) view returns (tuple(address host,address challenger,uint256 stake,uint256 initialBankroll,uint256 hostBalance,uint256 challengerBalance,uint256 hostRiskReserved,uint256 challengerRiskReserved,uint16 feeBpsSnapshot,uint64 waitingDeadline,uint64 choiceDeadline,uint64 revealDeadline,uint64 matchId,uint32 roundId,bool hostLeaveRequested,bool challengerLeaveRequested,uint8 state))",
  "function getCurrentRound(uint256 roomId) view returns (tuple(bytes32 hostCommitment,bytes32 challengerCommitment,uint8 hostChoice,uint8 challengerChoice,bool hostRevealed,bool challengerRevealed))",
  "function feeForWin(uint256 roomId) view returns (uint256)",
  "function activeSession(address) view returns (address)",
  "function sessions(address) view returns (address owner,uint256 maxRoomBankroll,uint64 expiresAt,bool active)",
  "function sessionNonces(address) view returns (uint256)",
  "function sessionRiskAvailable(address) view returns (uint256)",
  "function sessionRiskLimit(address) view returns (uint256)",
  "function isSessionUsable(address) view returns (bool)",
  "function setupSession(address session,uint256 maxRoomBankroll,uint256 riskLimit,uint64 expiresAt,bytes sessionProof)",
  "function replaceSession(address newSession,uint256 maxRoomBankroll,uint64 expiresAt,bytes sessionProof)",
  "function revokeSession()",
  "function resetSessionRisk(uint256 newRiskLimit)",
  "function fundSessionGas() payable",
  "function isProtocolOwner(address) view returns (bool)",
  "function protocolOwnerCount() view returns (uint256)",
  "function protocolOwners(uint256) view returns (address)",
  "function governanceThreshold() view returns (uint256)",
  "function ownerEpoch() view returns (uint64)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint8 proposalType,address account,uint256 value,uint64 eta,uint64 ownerEpoch,uint32 approvals,uint32 requiredApprovals,bool executed))",
  "function proposeAddOwner(address newOwner) returns (uint256 proposalId)",
  "function acceptOwner(uint256 proposalId)",
  "function proposeRemoveOwner(address ownerToRemove) returns (uint256 proposalId)",
  "function executeRemoveOwner(uint256 proposalId)",
  "function proposeFeeChange(uint16 newFeeBps) returns (uint256 proposalId)",
  "function executeFeeChange(uint256 proposalId)",
  "function proposeFeeWithdrawal(uint256 amount) returns (uint256 proposalId)",
  "function executeFeeWithdrawal(uint256 proposalId)",
  "function approveProposal(uint256 proposalId)",
  "event RoomCreated(uint256 indexed roomId,address indexed host,uint256 stake,uint256 bankroll,uint16 feeBpsSnapshot,uint64 waitingDeadline)",
  "event RoomJoined(uint256 indexed roomId,address indexed challenger,uint256 bankroll)",
  "event RoomClosed(uint256 indexed roomId,uint8 reason,uint256 hostReturned,uint256 challengerReturned)",
  "event RoundStarted(uint256 indexed roomId,uint64 indexed matchId,uint32 indexed roundId,uint64 choiceDeadline,uint64 revealDeadline)",
  "event ChoiceCommitted(uint256 indexed roomId,uint64 indexed matchId,uint32 indexed roundId,address player)",
  "event ChoiceRevealed(uint256 indexed roomId,uint64 indexed matchId,uint32 indexed roundId,address player,uint8 choice)",
  "event RoundSettled(uint256 indexed roomId,uint64 indexed matchId,uint32 indexed roundId,address winner,uint8 hostChoice,uint8 challengerChoice,uint8 reason,uint256 feePaid,uint256 hostBalance,uint256 challengerBalance)",
  "event GovernanceProposalCreated(uint256 indexed proposalId,uint8 indexed proposalType,address indexed proposer,address account,uint256 value,uint32 requiredApprovals,uint64 ownerEpoch)"
];

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)"
];

const readProvider = new ethers.JsonRpcProvider(CONFIG.rpcUrl, CONFIG.chainId, { staticNetwork: true });
const gameRead = new ethers.Contract(CONFIG.gameAddress, GAME_ABI, readProvider);
const tokenRead = new ethers.Contract(CONFIG.metokAddress, ERC20_ABI, readProvider);
const gameInterface = new ethers.Interface(GAME_ABI);

const ZERO = ethers.ZeroAddress;
const ZERO_HASH = ethers.ZeroHash;
const ROOM_STATE = ["None", "Waiting", "Active", "Closed"];
const CHOICE = ["None", "Rock", "Paper", "Scissors"];
const CHOICE_EMOJI = ["", "✊", "✋", "✌️"];
const PROPOSAL_TYPE = ["None", "Fee change", "Fee withdrawal", "Add owner", "Remove owner"];

const state = {
  browserProvider: null,
  signer: null,
  account: null,
  decimals: 18,
  selectedRoomId: null,
  selectedRoom: null,
  selectedRound: null,
  lobbyRooms: [],
  useSession: false,
  sessionWallet: null,
  currentProposal: null,
  refreshBusy: false,
};

const $ = id => document.getElementById(id);
const $$ = selector => [...document.querySelectorAll(selector)];
const short = a => !a ? "—" : `${a.slice(0, 6)}…${a.slice(-4)}`;
const now = () => Math.floor(Date.now() / 1000);
const toNum = value => Number(value ?? 0n);
const fmt = (value, digits = 3) => {
  try {
    const n = Number(ethers.formatUnits(value ?? 0n, state.decimals));
    return Number.isFinite(n) ? n.toLocaleString("vi-VN", { maximumFractionDigits: digits }) : "—";
  } catch { return "—"; }
};
const fmtMon = value => {
  try { return Number(ethers.formatEther(value ?? 0n)).toLocaleString("vi-VN", { maximumFractionDigits: 4 }); }
  catch { return "—"; }
};
const parseMetok = value => {
  const s = String(value ?? "").trim();
  if (!s || Number(s) <= 0) throw new Error("Nhập số METOK lớn hơn 0.");
  return ethers.parseUnits(s, state.decimals);
};
const isSame = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function toast(title, message = "", type = "info", txHash = null) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const link = txHash ? `<a href="${CONFIG.explorerUrl}/tx/${txHash}" target="_blank" rel="noopener noreferrer">Xem giao dịch ↗</a>` : "";
  el.innerHTML = `<strong>${escapeHtml(title)}</strong>${escapeHtml(message)} ${link}`;
  $("toastStack").appendChild(el);
  setTimeout(() => el.remove(), type === "error" ? 9000 : 6000);
}
function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function friendlyError(err) {
  const raw = [err?.shortMessage, err?.reason, err?.message].filter(Boolean).join(" · ");
  if (/user rejected|ACTION_REJECTED|denied/i.test(raw)) return "Bạn đã hủy yêu cầu trong ví.";
  if (/insufficient funds/i.test(raw)) return "Không đủ MON để trả gas.";
  if (/InsufficientAvailableBalance/i.test(raw)) return "Vault không đủ METOK khả dụng.";
  if (/SessionRiskExceeded/i.test(raw)) return "Room vượt quá risk còn lại của session.";
  if (/SessionRoomLimitExceeded/i.test(raw)) return "Bankroll vượt max room bankroll của session.";
  if (/ActiveRoomExists/i.test(raw)) return "Ví đang có một phòng hoạt động.";
  if (/WaitingWindowClosed/i.test(raw)) return "Phòng chờ đã hết hạn.";
  if (/StaleRound/i.test(raw)) return "Round đã đổi. DApp sẽ tải lại trạng thái.";
  return (err?.shortMessage || err?.reason || err?.message || "Giao dịch thất bại").slice(0, 260);
}

function showModal(title, html) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = html;
  $("modalBackdrop").hidden = false;
}
function closeModal() { $("modalBackdrop").hidden = true; }

async function switchToMonad() {
  if (!window.ethereum) throw new Error("Không tìm thấy ví EVM trong trình duyệt.");
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CONFIG.chainIdHex }] });
  } catch (err) {
    if (err?.code !== 4902 && !/Unrecognized chain/i.test(err?.message || "")) throw err;
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{
      chainId: CONFIG.chainIdHex,
      chainName: CONFIG.chainName,
      nativeCurrency: CONFIG.nativeCurrency,
      rpcUrls: [CONFIG.rpcUrl],
      blockExplorerUrls: [CONFIG.explorerUrl],
    }] });
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    const current = location.href.replace(/^https?:\/\//, "");
    showModal("Cần ví EVM", `<p>Mở trang này trong trình duyệt của MetaMask/Rabby/Phantom hoặc cài ví EVM hỗ trợ Monad.</p><a class="btn btn-primary full" href="https://metamask.app.link/dapp/${escapeHtml(current)}">Mở bằng MetaMask</a>`);
    return false;
  }
  try {
    await switchToMonad();
    state.browserProvider = new ethers.BrowserProvider(window.ethereum);
    await state.browserProvider.send("eth_requestAccounts", []);
    state.signer = await state.browserProvider.getSigner();
    state.account = await state.signer.getAddress();
    $("connectBtn").textContent = short(state.account);
    $("walletAddress").textContent = state.account;
    loadLocalSession();
    await refreshAll();
    toast("Ví đã kết nối", short(state.account), "success");
    return true;
  } catch (err) {
    toast("Không thể kết nối ví", friendlyError(err), "error");
    return false;
  }
}

async function requireWallet() {
  if (state.signer && state.account) return true;
  return connectWallet();
}

function gameWriteWith(signer) { return new ethers.Contract(CONFIG.gameAddress, GAME_ABI, signer); }
function tokenWriteWith(signer) { return new ethers.Contract(CONFIG.metokAddress, ERC20_ABI, signer); }

async function gameplaySigner() {
  if (!await requireWallet()) throw new Error("Cần kết nối ví.");
  if (state.useSession && state.sessionWallet) {
    try {
      const active = await gameRead.activeSession(state.account);
      const usable = await gameRead.isSessionUsable(state.sessionWallet.address);
      if (usable && isSame(active, state.sessionWallet.address)) return state.sessionWallet;
    } catch {}
  }
  return state.signer;
}

async function runTx(label, action, { refresh = true } = {}) {
  try {
    toast(label, "Xác nhận giao dịch…");
    const tx = await action();
    toast(label, "Đã gửi. Đang chờ xác nhận…", "info", tx.hash);
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("Transaction reverted");
    toast(`${label} ✓`, `Block ${receipt.blockNumber}`, "success", tx.hash);
    if (refresh) await refreshAll();
    return receipt;
  } catch (err) {
    toast(`${label} thất bại`, friendlyError(err), "error");
    throw err;
  }
}

function setTab(name) {
  $$(".tab").forEach(el => el.classList.toggle("active", el.dataset.tab === name));
  $$(".tab-view").forEach(el => el.classList.toggle("active", el.id === `view-${name}`));
  if (name === "lobby") refreshLobby();
  if (name === "game") refreshSelectedRoom();
  if (name === "admin") refreshAdmin();
  history.replaceState(null, "", name === "game" && state.selectedRoomId ? `?room=${state.selectedRoomId}` : location.pathname);
}

async function refreshProtocol() {
  try {
    const [decimals, fee, solvent, totalAvailable, totalLocked, fees] = await Promise.all([
      tokenRead.decimals(), gameRead.feeBps(), gameRead.isSolvent(), gameRead.totalAvailable(), gameRead.totalLocked(), gameRead.protocolFees()
    ]);
    state.decimals = Number(decimals);
    $("feeLabel").textContent = `${(Number(fee) / 100).toFixed(2)}%`;
    $("solvencyLabel").textContent = solvent ? "✓ Vault solvent" : "⚠ Vault insolvent";
    $("solvencyLabel").style.color = solvent ? "var(--green)" : "var(--red)";
    $("totalAvailableLabel").textContent = `${fmt(totalAvailable)} METOK`;
    $("totalLockedLabel").textContent = `${fmt(totalLocked)} METOK`;
    $("protocolFeesLabel").textContent = `${fmt(fees)} METOK`;
    $("solventFullLabel").textContent = solvent ? "✓ TRUE" : "⚠ FALSE";
  } catch (err) {
    $("solvencyLabel").textContent = "RPC chưa sẵn sàng";
  }
}

async function refreshWallet() {
  if (!state.account) return;
  try {
    const [walletToken, vault, mon, activeRoom, isOwner] = await Promise.all([
      tokenRead.balanceOf(state.account), gameRead.availableBalance(state.account), readProvider.getBalance(state.account), gameRead.activeRoomOf(state.account), gameRead.isProtocolOwner(state.account)
    ]);
    $("walletMetok").textContent = `${fmt(walletToken)} METOK`;
    $("vaultBalance").textContent = `${fmt(vault)} METOK`;
    $("monBalance").textContent = `${fmtMon(mon)} MON`;
    $("vaultBig").textContent = fmt(vault, 5);
    $("walletBig").textContent = fmt(walletToken, 5);
    $("adminTab").hidden = !isOwner;
    if (activeRoom > 0n && !state.selectedRoomId) {
      state.selectedRoomId = activeRoom.toString();
      await refreshSelectedRoom();
    }
    await refreshSession();
  } catch (err) {
    console.warn("wallet refresh", err);
  }
}

async function refreshAll() {
  if (state.refreshBusy) return;
  state.refreshBusy = true;
  try {
    await refreshProtocol();
    await refreshWallet();
    if ($("view-lobby").classList.contains("active")) await refreshLobby();
    if (state.selectedRoomId) await refreshSelectedRoom();
  } finally { state.refreshBusy = false; }
}

function roomCard(roomId, room) {
  const stateName = ROOM_STATE[toNum(room.state)] || "Unknown";
  const badge = stateName === "Waiting" ? "state-waiting" : stateName === "Active" ? "state-active" : "";
  const waiting = stateName === "Waiting";
  return `<article class="room-card panel" data-room-id="${roomId}">
    <div class="room-top"><span class="room-id">Room #${roomId}</span><span class="state-badge ${badge}">${stateName}</span></div>
    <div class="room-stats"><div><span>Stake</span><strong>${fmt(room.stake)} METOK</strong></div><div><span>Bankroll</span><strong>${fmt(room.initialBankroll)} METOK</strong></div></div>
    <div class="room-host">${waiting ? "Đang chờ đối thủ · " : "Host · "}${short(room.host)}</div>
  </article>`;
}

async function refreshLobby() {
  try {
    const next = await gameRead.nextRoomId();
    const maxId = Number(next - 1n);
    const start = Math.max(1, maxId - 23);
    const ids = [];
    for (let i = maxId; i >= start; i--) ids.push(i);
    const settled = await Promise.allSettled(ids.map(id => gameRead.getRoom(id)));
    state.lobbyRooms = settled.map((r, i) => r.status === "fulfilled" ? { id: ids[i], room: r.value } : null).filter(Boolean);
    const display = state.lobbyRooms.filter(x => toNum(x.room.state) === 1 || toNum(x.room.state) === 2);
    $("roomCountLabel").textContent = `${display.length} phòng đang hiển thị · next #${next}`;
    $("roomsGrid").innerHTML = display.length ? display.map(x => roomCard(x.id, x.room)).join("") : `<div class="empty-state panel">Chưa có phòng Waiting/Active gần đây. Hãy tạo phòng đầu tiên.</div>`;
    $$(".room-card").forEach(el => el.addEventListener("click", () => selectRoom(el.dataset.roomId, true)));
  } catch (err) {
    $("roomsGrid").innerHTML = `<div class="empty-state panel">Không đọc được lobby. Kiểm tra RPC và thử lại.</div>`;
  }
}

async function selectRoom(roomId, goGame = false) {
  if (!roomId || Number(roomId) < 1) return;
  state.selectedRoomId = String(roomId);
  $("joinRoomInput").value = roomId;
  await refreshSelectedRoom();
  if (goGame) setTab("game");
}

function localChoiceKey(room) {
  if (!state.account || !room) return null;
  return `metokrps.choice.${CONFIG.chainId}.${CONFIG.gameAddress.toLowerCase()}.${state.account.toLowerCase()}.${state.selectedRoomId}.${room.matchId}.${room.roundId}`;
}
function getLocalChoice(room = state.selectedRoom) {
  try { const raw = localStorage.getItem(localChoiceKey(room)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveLocalChoice(room, data) {
  localStorage.setItem(localChoiceKey(room), JSON.stringify(data));
}

async function refreshSelectedRoom() {
  if (!state.selectedRoomId) return renderNoRoom();
  try {
    const room = await gameRead.getRoom(state.selectedRoomId);
    state.selectedRoom = room;
    state.selectedRound = toNum(room.state) === 2 ? await gameRead.getCurrentRound(state.selectedRoomId) : null;
    renderRoom();
  } catch {
    renderNoRoom();
  }
}

function renderNoRoom() {
  state.selectedRoom = null; state.selectedRound = null;
  $("gameEmpty").hidden = false; $("gameArena").hidden = true;
}

function renderRoom() {
  const r = state.selectedRoom;
  if (!r) return renderNoRoom();
  $("gameEmpty").hidden = true; $("gameArena").hidden = false;
  const stateName = ROOM_STATE[toNum(r.state)];
  $("gameSubtitle").textContent = `Room #${state.selectedRoomId} · ${stateName}`;
  $("hostName").textContent = short(r.host);
  $("challengerName").textContent = r.challenger === ZERO ? "Đang chờ…" : short(r.challenger);
  $("hostBankroll").textContent = `${fmt(r.hostBalance)} METOK`;
  $("challengerBankroll").textContent = `${fmt(r.challengerBalance)} METOK`;
  $("roomIdLabel").textContent = `#${state.selectedRoomId}`;
  $("matchIdLabel").textContent = r.matchId.toString();
  $("roundPill").textContent = `ROUND ${r.roundId}`;
  $("stakeLabel").textContent = `${fmt(r.stake)} METOK`;
  $("roomFeeLabel").textContent = `${(Number(r.feeBpsSnapshot) / 100).toFixed(2)}%`;

  const active = toNum(r.state) === 2;
  $$(".choice-btn").forEach(b => b.disabled = !active || !state.account || !isParticipant(r, state.account));
  $("leaveBtn").disabled = !state.account || !isParticipant(r, state.account) && !(toNum(r.state) === 1 && isSame(r.host, state.account));

  if (toNum(r.state) === 1) {
    $("timerLabel").textContent = countdown(r.waitingDeadline);
    $("phaseLabel").textContent = "Chờ đối thủ";
    $("choiceTitle").textContent = "Phòng đang chờ người chơi thứ hai";
    $("commitState").textContent = "Waiting";
    $("revealBox").hidden = true;
    $("resolveTimeoutBtn").hidden = true;
    return;
  }
  if (!active) {
    $("timerLabel").textContent = "DONE"; $("phaseLabel").textContent = "Phòng đã đóng"; $("choiceTitle").textContent = "Trận đấu đã kết thúc";
    $("commitState").textContent = "Closed"; $("revealBox").hidden = true; $("resolveTimeoutBtn").hidden = true; return;
  }

  const round = state.selectedRound;
  const t = now();
  const choiceEnd = Number(r.choiceDeadline);
  const revealEnd = Number(r.revealDeadline);
  const inChoice = t < choiceEnd;
  const inReveal = t >= choiceEnd && t < revealEnd;
  const timedOut = t >= revealEnd;
  $("timerLabel").textContent = countdown(inChoice ? choiceEnd : revealEnd);
  $("phaseLabel").textContent = inChoice ? "COMMIT PHASE" : inReveal ? "REVEAL PHASE" : "TIMEOUT";
  $("choiceTitle").textContent = inChoice ? "Rock, Paper hay Scissors?" : inReveal ? "Reveal lựa chọn" : "Round cần được xử lý";

  const mineHost = state.account && isSame(r.host, state.account);
  const mineChallenger = state.account && isSame(r.challenger, state.account);
  const myCommit = mineHost ? round.hostCommitment : mineChallenger ? round.challengerCommitment : ZERO_HASH;
  const myRevealed = mineHost ? round.hostRevealed : mineChallenger ? round.challengerRevealed : false;
  const local = getLocalChoice(r);
  const committed = myCommit && myCommit !== ZERO_HASH;
  $("commitState").textContent = myRevealed ? "✓ Revealed" : committed ? "✓ Committed" : "Chưa commit";
  $("commitState").style.color = myRevealed ? "var(--green)" : committed ? "#d7baff" : "var(--muted)";

  $$(".choice-btn").forEach(btn => {
    const c = Number(btn.dataset.choice);
    btn.classList.toggle("selected", !!local && Number(local.choice) === c);
    btn.disabled = !inChoice || committed || !state.account || !isParticipant(r, state.account);
  });

  const canReveal = inReveal && committed && !myRevealed && local;
  $("revealBox").hidden = !canReveal;
  if (local) $("savedChoiceLabel").textContent = `${CHOICE_EMOJI[local.choice]} ${CHOICE[local.choice]} đã lưu an toàn trên thiết bị`;
  $("backupSecretBtn").hidden = !local || myRevealed;
  $("resolveTimeoutBtn").hidden = !(t >= choiceEnd);
  if (timedOut) $("resolveTimeoutBtn").textContent = "⏱ Xử lý timeout";
}

function countdown(unix) {
  const delta = Number(unix) - now();
  if (delta <= 0) return "00:00";
  const m = Math.floor(delta / 60), s = delta % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function isParticipant(room, account) { return isSame(room.host, account) || isSame(room.challenger, account); }

async function createRoom() {
  if (!await requireWallet()) return;
  const stake = parseMetok($("stakeInput").value);
  const bankroll = parseMetok($("bankrollInput").value);
  if (bankroll < stake) throw new Error("Bankroll phải lớn hơn hoặc bằng stake.");
  const signer = await gameplaySigner();
  const receipt = await runTx("Tạo phòng", () => gameWriteWith(signer).createRoom(stake, bankroll), { refresh: false });
  let roomId;
  for (const log of receipt.logs) {
    try { const parsed = gameInterface.parseLog(log); if (parsed?.name === "RoomCreated") { roomId = parsed.args.roomId.toString(); break; } } catch {}
  }
  await refreshAll();
  if (roomId) { await selectRoom(roomId, true); toast("Phòng đã sẵn sàng", `Room #${roomId} — gửi link cho đối thủ.`, "success"); }
}

async function joinRoom() {
  if (!await requireWallet()) return;
  const id = $("joinRoomInput").value.trim();
  if (!id) throw new Error("Nhập Room ID.");
  const signer = await gameplaySigner();
  await runTx(`Vào Room #${id}`, () => gameWriteWith(signer).joinRoom(id));
  await selectRoom(id, true);
}

async function commitChoice(choice) {
  if (!await requireWallet() || !state.selectedRoom || !state.selectedRound) return;
  const r = state.selectedRoom;
  if (!isParticipant(r, state.account)) throw new Error("Ví này không phải người chơi của phòng.");
  const secret = ethers.hexlify(ethers.randomBytes(32));
  const commitment = await gameRead.commitmentFor(state.selectedRoomId, r.matchId, r.roundId, state.account, choice, secret);
  saveLocalChoice(r, { choice, secret, commitment, createdAt: Date.now() });
  try {
    const signer = await gameplaySigner();
    await runTx(`${CHOICE_EMOJI[choice]} Commit ${CHOICE[choice]}`, () => gameWriteWith(signer).confirmChoice(state.selectedRoomId, r.matchId, r.roundId, commitment));
  } catch (err) {
    await refreshSelectedRoom();
    throw err;
  }
}

async function revealChoice() {
  if (!state.selectedRoom) return;
  const local = getLocalChoice(state.selectedRoom);
  if (!local) throw new Error("Không tìm thấy secret trên thiết bị này.");
  const r = state.selectedRoom;
  const signer = await gameplaySigner();
  await runTx("Reveal lựa chọn", () => gameWriteWith(signer).revealChoice(state.selectedRoomId, r.matchId, r.roundId, local.choice, local.secret));
}

async function smartTimeout() {
  if (!state.selectedRoom || !state.selectedRound) return;
  const r = state.selectedRoom, round = state.selectedRound;
  const hostCommitted = round.hostCommitment !== ZERO_HASH;
  const challengerCommitted = round.challengerCommitment !== ZERO_HASH;
  const signer = await gameplaySigner();
  const game = gameWriteWith(signer);
  const t = now();
  if (t < Number(r.choiceDeadline)) throw new Error("Choice window chưa kết thúc.");

  if (!hostCommitted && !challengerCommitted) {
    if (t >= Number(r.revealDeadline)) return runTx("Đóng room inactivity", () => game.forceSettleChoiceTimeout(state.selectedRoomId, r.matchId, r.roundId));
    return runTx("Xử lý no-commit timeout", () => game.settleChoiceTimeout(state.selectedRoomId, r.matchId, r.roundId, 0, ZERO_HASH));
  }
  if (hostCommitted && challengerCommitted) {
    if (t < Number(r.revealDeadline)) throw new Error("Đang trong reveal window. Hãy reveal nếu bạn đã commit.");
    return runTx("Xử lý reveal timeout", () => game.settleRevealTimeout(state.selectedRoomId, r.matchId, r.roundId));
  }
  const local = getLocalChoice(r);
  const mineIsCommitted = (isSame(r.host, state.account) && hostCommitted) || (isSame(r.challenger, state.account) && challengerCommitted);
  if (t < Number(r.revealDeadline) && local && mineIsCommitted) {
    return runTx("Chứng minh commit & settle", () => game.settleChoiceTimeout(state.selectedRoomId, r.matchId, r.roundId, local.choice, local.secret));
  }
  if (t >= Number(r.revealDeadline)) return runTx("Force settle timeout", () => game.forceSettleChoiceTimeout(state.selectedRoomId, r.matchId, r.roundId));
  throw new Error("Đang chờ preimage hoặc hết reveal grace.");
}

async function leaveRoom() {
  if (!state.selectedRoom || !await requireWallet()) return;
  const r = state.selectedRoom;
  const signer = await gameplaySigner();
  const game = gameWriteWith(signer);
  if (toNum(r.state) === 2 && state.selectedRound && now() < Number(r.choiceDeadline) && state.selectedRound.hostCommitment === ZERO_HASH && state.selectedRound.challengerCommitment === ZERO_HASH) {
    return runTx("Rời phòng ngay", () => game.requestImmediateLeave(state.selectedRoomId, r.matchId, r.roundId));
  }
  return runTx("Yêu cầu rời phòng", () => game.requestLeave(state.selectedRoomId));
}

async function deposit() {
  if (!await requireWallet()) return;
  const amount = parseMetok($("depositInput").value);
  const allowance = await tokenRead.allowance(state.account, CONFIG.gameAddress);
  if (allowance < amount) {
    await runTx("Approve METOK", () => tokenWriteWith(state.signer).approve(CONFIG.gameAddress, amount), { refresh: false });
  }
  await runTx("Nạp METOK vào Vault", () => gameWriteWith(state.signer).deposit(amount));
}
async function withdraw(all = false) {
  if (!await requireWallet()) return;
  if (all) return runTx("Rút toàn bộ METOK", () => gameWriteWith(state.signer).withdrawAll());
  const amount = parseMetok($("withdrawInput").value);
  return runTx("Rút METOK", () => gameWriteWith(state.signer).withdraw(amount));
}

function sessionStorageKey() { return state.account ? `metokrps.session.${CONFIG.chainId}.${CONFIG.gameAddress.toLowerCase()}.${state.account.toLowerCase()}` : null; }
function loadLocalSession() {
  state.sessionWallet = null;
  if (!state.account) return;
  try {
    const raw = sessionStorage.getItem(sessionStorageKey());
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj.privateKey) state.sessionWallet = new ethers.Wallet(obj.privateKey, readProvider);
  } catch {}
  const pref = localStorage.getItem(`${sessionStorageKey()}.enabled`);
  state.useSession = pref === "true";
  $("useSessionToggle").checked = state.useSession;
}
function saveSessionWallet(wallet) {
  sessionStorage.setItem(sessionStorageKey(), JSON.stringify({ privateKey: wallet.privateKey, address: wallet.address, createdAt: Date.now() }));
  state.sessionWallet = wallet.connect(readProvider);
}
function clearLocalSession() { if (sessionStorageKey()) sessionStorage.removeItem(sessionStorageKey()); state.sessionWallet = null; }

async function refreshSession() {
  if (!state.account) return;
  try {
    const active = await gameRead.activeSession(state.account);
    if (active === ZERO) {
      $("sessionStatus").textContent = "Chưa cấu hình"; $("sessionAddress").textContent = "—"; $("sessionMon").textContent = "—"; $("sessionRisk").textContent = "—"; $("sessionExpiry").textContent = "—"; return;
    }
    const [s, risk, mon, usable] = await Promise.all([gameRead.sessions(active), gameRead.sessionRiskAvailable(state.account), readProvider.getBalance(active), gameRead.isSessionUsable(active)]);
    const localMatch = state.sessionWallet && isSame(state.sessionWallet.address, active);
    $("sessionStatus").textContent = usable ? (localMatch ? "✓ Fast Play sẵn sàng" : "On-chain · thiếu key local") : "Không khả dụng";
    $("sessionStatus").style.color = usable && localMatch ? "var(--green)" : "#ffc978";
    $("sessionAddress").textContent = short(active);
    $("sessionAddress").title = active;
    $("sessionMon").textContent = `${fmtMon(mon)} MON`;
    $("sessionRisk").textContent = `${fmt(risk)} METOK`;
    $("sessionExpiry").textContent = new Date(Number(s.expiresAt) * 1000).toLocaleString("vi-VN");
    $("sessionGasLabel").textContent = state.useSession && localMatch ? `Session ${short(active)}` : "Ví chính";
  } catch (err) { console.warn("session refresh", err); }
}

async function setupOrReplaceSession() {
  if (!await requireWallet()) return;
  const maxRoom = parseMetok($("sessionMaxBankroll").value);
  const risk = parseMetok($("sessionRiskLimit").value);
  const hours = Number($("sessionHours").value);
  if (!Number.isFinite(hours) || hours < 1 || hours > 720) throw new Error("Thời hạn phải từ 1 đến 720 giờ.");
  const expiresAt = BigInt(now() + Math.floor(hours * 3600));
  const gasMon = $("sessionGas").value.trim();
  const fresh = ethers.Wallet.createRandom();
  saveSessionWallet(fresh);
  const nonce = await gameRead.sessionNonces(state.account);
  const active = await gameRead.activeSession(state.account);
  const domain = { name: "METOK RPS", version: "6.4.5", chainId: CONFIG.chainId, verifyingContract: CONFIG.gameAddress };
  let proof;
  if (active === ZERO) {
    proof = await fresh.signTypedData(domain, {
      SessionSetup: [
        { name:"owner", type:"address" }, { name:"session", type:"address" }, { name:"maxRoomBankroll", type:"uint256" }, { name:"riskLimit", type:"uint256" }, { name:"expiresAt", type:"uint64" }, { name:"nonce", type:"uint256" }
      ]
    }, { owner: state.account, session: fresh.address, maxRoomBankroll: maxRoom, riskLimit: risk, expiresAt, nonce });
    await runTx("Cấu hình Fast Play", () => gameWriteWith(state.signer).setupSession(fresh.address, maxRoom, risk, expiresAt, proof), { refresh: false });
  } else {
    proof = await fresh.signTypedData(domain, {
      SessionReplace: [
        { name:"owner", type:"address" }, { name:"session", type:"address" }, { name:"maxRoomBankroll", type:"uint256" }, { name:"expiresAt", type:"uint64" }, { name:"nonce", type:"uint256" }
      ]
    }, { owner: state.account, session: fresh.address, maxRoomBankroll: maxRoom, expiresAt, nonce });
    await runTx("Thay Fast Play session", () => gameWriteWith(state.signer).replaceSession(fresh.address, maxRoom, expiresAt, proof), { refresh: false });
    const activeRoom = await gameRead.activeRoomOf(state.account);
    if (activeRoom === 0n) {
      await runTx("Reset session risk", () => gameWriteWith(state.signer).resetSessionRisk(risk), { refresh: false });
    }
  }
  if (gasMon && Number(gasMon) > 0) {
    await runTx("Cấp MON cho session", () => gameWriteWith(state.signer).fundSessionGas({ value: ethers.parseEther(gasMon) }), { refresh: false });
  }
  state.useSession = true;
  localStorage.setItem(`${sessionStorageKey()}.enabled`, "true");
  $("useSessionToggle").checked = true;
  await refreshAll();
  showModal("Fast Play đã sẵn sàng", `<p>Session <strong>${escapeHtml(fresh.address)}</strong> đã được cấu hình. Private key chỉ lưu trong sessionStorage của tab này.</p><p>Đóng tab có thể làm mất key. Nếu mất, dùng ví chính để Replace hoặc Revoke session.</p>`);
}

async function revokeSession() {
  if (!await requireWallet()) return;
  await runTx("Revoke session", () => gameWriteWith(state.signer).revokeSession(), { refresh: false });
  clearLocalSession(); state.useSession = false; localStorage.removeItem(`${sessionStorageKey()}.enabled`); $("useSessionToggle").checked = false; await refreshAll();
}

async function refreshAdmin() {
  if (!state.account) return;
  try {
    const [isOwner, count, threshold, epoch, fees] = await Promise.all([
      gameRead.isProtocolOwner(state.account), gameRead.protocolOwnerCount(), gameRead.governanceThreshold(), gameRead.ownerEpoch(), gameRead.protocolFees()
    ]);
    if (!isOwner) return;
    $("ownerCountLabel").textContent = count.toString(); $("thresholdLabel").textContent = `${threshold}/${count}`; $("ownerEpochLabel").textContent = epoch.toString(); $("adminFeesLabel").textContent = `${fmt(fees)} METOK`;
    const owners = await Promise.all(Array.from({ length: Number(count) }, (_, i) => gameRead.protocolOwners(i)));
    $("ownersList").innerHTML = `<div class="subhead" style="margin:0 0 8px"><h3>Protocol owners</h3><span>${owners.length} địa chỉ</span></div>` + owners.map((o,i) => `<div class="owner-row"><span>#${i+1}</span><strong>${escapeHtml(o)}</strong></div>`).join("");
  } catch (err) { console.warn("admin refresh", err); }
}

async function propose(kind) {
  if (!await requireWallet()) return;
  const game = gameWriteWith(state.signer);
  if (kind === "add") { const a = $("ownerTargetInput").value.trim(); if (!ethers.isAddress(a)) throw new Error("Địa chỉ owner không hợp lệ."); return runTx("Đề xuất thêm owner", () => game.proposeAddOwner(a)); }
  if (kind === "remove") { const a = $("ownerTargetInput").value.trim(); if (!ethers.isAddress(a)) throw new Error("Địa chỉ owner không hợp lệ."); return runTx("Đề xuất xóa owner", () => game.proposeRemoveOwner(a)); }
  if (kind === "fee") { const bps = Number($("newFeeInput").value); if (!Number.isInteger(bps) || bps < 0 || bps > 500) throw new Error("Fee phải 0–500 bps."); return runTx("Đề xuất đổi phí", () => game.proposeFeeChange(bps)); }
  if (kind === "withdraw") { const amount = parseMetok($("feeWithdrawInput").value); return runTx("Đề xuất rút protocol fee", () => game.proposeFeeWithdrawal(amount)); }
}

async function loadProposal() {
  const id = $("proposalIdInput").value.trim(); if (!id) throw new Error("Nhập Proposal ID.");
  const p = await gameRead.getProposal(id); state.currentProposal = { id, p };
  const eta = Number(p.eta) ? new Date(Number(p.eta) * 1000).toLocaleString("vi-VN") : "Chưa đạt quorum/timelock";
  $("proposalDetail").textContent = `Type: ${PROPOSAL_TYPE[Number(p.proposalType)]}\nAccount: ${p.account}\nValue: ${p.value}\nApprovals: ${p.approvals}/${p.requiredApprovals}\nETA: ${eta}\nEpoch: ${p.ownerEpoch}\nExecuted: ${p.executed}`;
}
async function approveProposal() {
  if (!await requireWallet()) return; const id = $("proposalIdInput").value.trim(); if (!id) throw new Error("Nhập Proposal ID."); await runTx(`Approve proposal #${id}`, () => gameWriteWith(state.signer).approveProposal(id)); await loadProposal();
}
async function executeProposal() {
  if (!await requireWallet()) return; if (!state.currentProposal) await loadProposal();
  const { id, p } = state.currentProposal; const game = gameWriteWith(state.signer); const t = Number(p.proposalType);
  if (t === 1) await runTx(`Execute fee change #${id}`, () => game.executeFeeChange(id));
  else if (t === 2) await runTx(`Execute fee withdrawal #${id}`, () => game.executeFeeWithdrawal(id));
  else if (t === 3) await runTx(`Accept owner #${id}`, () => game.acceptOwner(id));
  else if (t === 4) await runTx(`Execute remove owner #${id}`, () => game.executeRemoveOwner(id));
  else throw new Error("Proposal type không thể execute.");
  await loadProposal();
}

function bindEvents() {
  $$(".tab").forEach(t => t.addEventListener("click", () => setTab(t.dataset.tab)));
  $("connectBtn").addEventListener("click", connectWallet);
  $("quickPlayBtn").addEventListener("click", async () => { if (!state.account) await connectWallet(); setTab("lobby"); });
  $("openVaultBtn").addEventListener("click", () => setTab("vault"));
  $("refreshLobbyBtn").addEventListener("click", refreshLobby);
  $("createRoomBtn").addEventListener("click", () => safe(createRoom));
  $("inspectRoomBtn").addEventListener("click", () => safe(() => selectRoom($("joinRoomInput").value, true)));
  $("joinRoomBtn").addEventListener("click", () => safe(joinRoom));
  $$(".choice-btn").forEach(b => b.addEventListener("click", () => safe(() => commitChoice(Number(b.dataset.choice)))));
  $("revealBtn").addEventListener("click", () => safe(revealChoice));
  $("resolveTimeoutBtn").addEventListener("click", () => safe(smartTimeout));
  $("leaveBtn").addEventListener("click", () => safe(leaveRoom));
  $("depositBtn").addEventListener("click", () => safe(deposit));
  $("withdrawBtn").addEventListener("click", () => safe(() => withdraw(false)));
  $("withdrawAllBtn").addEventListener("click", () => safe(() => withdraw(true)));
  $("copyRoomBtn").addEventListener("click", () => safe(async () => { if (!state.selectedRoomId) throw new Error("Chưa chọn room."); const url = `${location.origin}${location.pathname}?room=${state.selectedRoomId}`; await navigator.clipboard.writeText(url); toast("Đã copy link mời", `Room #${state.selectedRoomId}`, "success"); }));
  $("backupSecretBtn").addEventListener("click", () => safe(async () => { const local = getLocalChoice(); if (!local) throw new Error("Không có secret."); await navigator.clipboard.writeText(JSON.stringify({ roomId:state.selectedRoomId, matchId:state.selectedRoom.matchId.toString(), roundId:state.selectedRoom.roundId.toString(), choice:local.choice, secret:local.secret })); showModal("Secret đã copy", "<p>Giữ bản sao này riêng tư cho tới khi round kết thúc. Người có secret có thể biết lựa chọn commit của bạn.</p>"); }));
  $("setupSessionBtn").addEventListener("click", () => safe(setupOrReplaceSession));
  $("revokeSessionBtn").addEventListener("click", () => safe(revokeSession));
  $("useSessionToggle").addEventListener("change", e => { state.useSession = e.target.checked; if (sessionStorageKey()) localStorage.setItem(`${sessionStorageKey()}.enabled`, String(state.useSession)); refreshSession(); });
  $("proposeAddOwnerBtn").addEventListener("click", () => safe(() => propose("add")));
  $("proposeRemoveOwnerBtn").addEventListener("click", () => safe(() => propose("remove")));
  $("proposeFeeBtn").addEventListener("click", () => safe(() => propose("fee")));
  $("proposeWithdrawFeeBtn").addEventListener("click", () => safe(() => propose("withdraw")));
  $("loadProposalBtn").addEventListener("click", () => safe(loadProposal));
  $("approveProposalBtn").addEventListener("click", () => safe(approveProposal));
  $("executeProposalBtn").addEventListener("click", () => safe(executeProposal));
  $("copyContractBtn").addEventListener("click", () => navigator.clipboard.writeText(CONFIG.gameAddress).then(() => toast("Đã copy contract", short(CONFIG.gameAddress), "success")));
  $("modalCloseBtn").addEventListener("click", closeModal);
  $("modalBackdrop").addEventListener("click", e => { if (e.target === $("modalBackdrop")) closeModal(); });
  window.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

async function safe(fn) { try { return await fn(); } catch (err) { toast("Không thể thực hiện", friendlyError(err), "error"); } }

async function init() {
  bindEvents();
  $("contractExplorerLink").href = `${CONFIG.explorerUrl}/address/${CONFIG.gameAddress}`;
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam && /^\d+$/.test(roomParam)) { state.selectedRoomId = roomParam; setTab("game"); }
  await refreshProtocol();
  await refreshLobby();

  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts?.length) {
        await switchToMonad(); state.browserProvider = new ethers.BrowserProvider(window.ethereum); state.signer = await state.browserProvider.getSigner(); state.account = await state.signer.getAddress(); $("connectBtn").textContent = short(state.account); $("walletAddress").textContent = state.account; loadLocalSession(); await refreshAll();
      }
    } catch {}
    window.ethereum.on?.("accountsChanged", () => location.reload());
    window.ethereum.on?.("chainChanged", () => location.reload());
  }

  setInterval(() => { if (state.selectedRoom) renderRoom(); }, 1000);
  setInterval(() => refreshAll().catch(() => {}), 5000);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("./sw.js").catch(() => {});
}

init().catch(err => toast("Khởi động DApp thất bại", friendlyError(err), "error"));
