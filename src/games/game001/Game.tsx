import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, usePublicClient } from "wagmi";
import {
  decodeEventLog,
  formatUnits,
  parseUnits,
  zeroHash,
  type Hex,
} from "viem";
import { GAME_ABI, GAME_ADDRESS } from "./contract";
import { useGame001 } from "./useGame001";
import { useGame001Actions } from "./useGame001Actions";
import { useWaitingRooms, type WaitingRoom } from "./useWaitingRooms";
import {
  clearReveal,
  createSecret,
  loadReveal,
  makeCommitment,
  RPS_CHOICE,
  saveReveal,
  type RpsChoice,
} from "./gameplay";
import "./Game.css";

const ROOM_STATE = ["None", "Waiting", "Active", "Closed"];

function shortAddress(value?: string) {
  if (!value) return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function fmt(value?: bigint) {
  if (value === undefined) return "0";
  const text = formatUnits(value, 18);
  const [whole, decimal = ""] = text.split(".");
  const trimmed = decimal.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export default function Game001() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [roomIdText, setRoomIdText] = useState("");
  const [stakeText, setStakeText] = useState("100");
  const [bankrollText, setBankrollText] = useState("500");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const roomId = useMemo(() => {
    try {
      const value = BigInt(roomIdText || "0");
      return value > 0n ? value : undefined;
    } catch {
      return undefined;
    }
  }, [roomIdText]);

  const state = useGame001(roomId);
  const lobby = useWaitingRooms();
  const actions = useGame001Actions();

  const room = state.room.data as
    | {
        token: `0x${string}`;
        stake: bigint;
        feeBps: number;
        host: `0x${string}`;
        challenger: `0x${string}`;
        hostSession: `0x${string}`;
        challengerSession: `0x${string}`;
        hostBalance: bigint;
        challengerBalance: bigint;
        waitingDeadline: bigint;
        choiceDeadline: bigint;
        revealDeadline: bigint;
        matchId: bigint;
        roundId: number;
        hostLeaveAfterRound: boolean;
        challengerLeaveAfterRound: boolean;
        state: number;
      }
    | undefined;

  const round = state.currentRound.data as
    | {
        hostCommit: Hex;
        challengerCommit: Hex;
        hostChoice: number;
        challengerChoice: number;
        hostRevealed: boolean;
        challengerRevealed: boolean;
      }
    | undefined;

  const allowance = state.allowance.data as bigint | undefined;
  const balance = state.balance.data as bigint | undefined;
  const claimable = state.claimable.data as bigint | undefined;
  const paused = state.paused.data as boolean | undefined;

  const bankroll = useMemo(() => {
    try {
      return parseUnits(bankrollText || "0", 18);
    } catch {
      return 0n;
    }
  }, [bankrollText]);

  const stake = useMemo(() => {
    try {
      return parseUnits(stakeText || "0", 18);
    } catch {
      return 0n;
    }
  }, [stakeText]);

  const isHost =
    !!address &&
    !!room &&
    room.host.toLowerCase() === address.toLowerCase();

  const isChallenger =
    !!address &&
    !!room &&
    room.challenger !== "0x0000000000000000000000000000000000000000" &&
    room.challenger.toLowerCase() === address.toLowerCase();

  const isPlayer = isHost || isChallenger;

  async function refreshAll() {
    await Promise.allSettled([
      state.nextRoomId.refetch(),
      state.paused.refetch(),
      state.room.refetch(),
      state.currentRound.refetch(),
      state.allowance.refetch(),
      state.balance.refetch(),
      state.claimable.refetch(),
      lobby.refetch(),
    ]);
  }

  async function runTx(
    label: string,
    send: () => Promise<Hex>,
    afterReceipt?: (receipt: Awaited<
      ReturnType<NonNullable<typeof publicClient>["waitForTransactionReceipt"]>
    >) => void,
  ) {
    if (!publicClient) {
      setMessage("RPC client chưa sẵn sàng.");
      return;
    }

    try {
      setBusy(true);
      setMessage(`${label}: chờ xác nhận ví...`);

      const hash = await send();

      setMessage(`${label}: đang chờ transaction xác nhận...`);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction reverted");
      }

      afterReceipt?.(receipt);

      await refreshAll();
      setMessage(`${label}: thành công.`);
    } catch (error) {
      const text =
        error instanceof Error ? error.message : String(error);
      setMessage(`${label}: ${text}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (bankroll <= 0n) {
      setMessage("Bankroll không hợp lệ.");
      return;
    }

    await runTx("Approve METOK", () => actions.approve(bankroll));
  }

  async function handleCreate() {
    if (!address) {
      setMessage("Hãy kết nối ví trước.");
      return;
    }

    if (stake <= 0n || bankroll < stake) {
      setMessage("Stake phải > 0 và bankroll phải >= stake.");
      return;
    }

    await runTx(
      "Tạo phòng",
      () => actions.createRoom(stake, bankroll, address),
      (receipt) => {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: GAME_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "RoomCreated") {
              const args = decoded.args as unknown as {
                roomId: bigint;
              };

              setRoomIdText(args.roomId.toString());
              break;
            }
          } catch {
            // Ignore logs from other contracts.
          }
        }
      },
    );
  }

  async function handleJoin() {
    if (!address || !roomId) return;

    if (bankroll < (room?.stake ?? 0n)) {
      setMessage("Bankroll phải >= stake của phòng.");
      return;
    }

    await runTx("Join phòng", () =>
      actions.joinRoom(roomId, bankroll, address),
    );
  }

  async function handleLobbyJoin(target: WaitingRoom) {
    if (!address) {
      setMessage("Hãy kết nối ví trước.");
      return;
    }

    setRoomIdText(target.roomId.toString());

    if ((allowance ?? 0n) < target.stake) {
      setBankrollText(formatUnits(target.stake, 18));
      setMessage(
        `Phòng #${target.roomId}: cần approve ít nhất ${fmt(target.stake)} METOK trước khi Join.`,
      );
      return;
    }

    await runTx(
      `Join phòng #${target.roomId}`,
      () => actions.joinRoom(target.roomId, target.stake, address),
      () => {
        setRoomIdText(target.roomId.toString());
      },
    );
  }

  async function handleChoice(choice: RpsChoice) {
    if (!address || !roomId || !room) return;

    const secret = createSecret();

    const commitment = makeCommitment(
      roomId,
      BigInt(room.matchId),
      BigInt(room.roundId),
      address,
      choice,
      secret,
    );

    saveReveal(
      roomId,
      BigInt(room.matchId),
      BigInt(room.roundId),
      address,
      {
        choice,
        secret,
        commitment,
      },
    );

    await runTx("Commit lựa chọn", () =>
      actions.confirmChoice(roomId, commitment),
    );
  }

  async function handleReveal() {
    if (!address || !roomId || !room) return;

    const saved = loadReveal(
      roomId,
      BigInt(room.matchId),
      BigInt(room.roundId),
      address,
    );

    if (!saved) {
      setMessage(
        "Không tìm thấy secret của round này trên trình duyệt.",
      );
      return;
    }

    await runTx(
      "Reveal lựa chọn",
      () =>
        actions.revealChoice(
          roomId,
          saved.choice,
          saved.secret,
        ),
      () => {
        clearReveal(
          roomId,
          BigInt(room.matchId),
          BigInt(room.roundId),
          address,
        );
      },
    );
  }

  async function handleChoiceTimeout() {
    if (!roomId || !room) return;

    if (address) {
      const saved = loadReveal(
        roomId,
        BigInt(room.matchId),
        BigInt(room.roundId),
        address,
      );

      if (saved) {
        await runTx("Settle choice timeout", () =>
          actions.settleChoiceTimeout(
            roomId,
            saved.choice,
            saved.secret,
          ),
        );
        return;
      }
    }

    await runTx("Settle choice timeout", () =>
      actions.settleChoiceTimeout(roomId, 0, zeroHash),
    );
  }

  async function handleImmediateLeave() {
    if (!roomId || !room) return;

    await runTx("Rời phòng an toàn", () =>
      actions.requestImmediateLeave(
        roomId,
        BigInt(room.matchId),
        Number(room.roundId),
      ),
    );
  }

  return (
    <main className="rps-page">
      <Link to="/">← Game Center</Link>

      <h1 className="rps-title">Rock · Paper · Scissors</h1>
      <p className="rps-subtitle">
        METOK RPS V6.3 · Monad Mainnet · fee 3% theo snapshot
        của phòng.
      </p>

      <div className="rps-grid">
        <section className="rps-card rps-card-wide">
          <h3>Phòng đang chờ ({lobby.waitingRooms.length})</h3>

          {lobby.isLoading ? (
            <p className="rps-help">Đang tải danh sách phòng...</p>
          ) : lobby.waitingRooms.length === 0 ? (
            <p className="rps-help">
              Hiện chưa có phòng nào đang chờ người chơi.
            </p>
          ) : (
            <div className="rps-status">
              {lobby.waitingRooms.map((waitingRoom) => {
                const secondsLeft = Math.max(
                  0,
                  Number(waitingRoom.waitingDeadline) -
                    Number(lobby.now),
                );

                return (
                  <article
                    className="rps-stat"
                    key={waitingRoom.roomId.toString()}
                  >
                    <span>Room #{waitingRoom.roomId.toString()}</span>
                    <strong>
                      Cược: {fmt(waitingRoom.stake)} METOK
                    </strong>

                    <span>
                      Bankroll host: {fmt(waitingRoom.hostBalance)} METOK
                    </span>

                    <span>
                      Host: {shortAddress(waitingRoom.host)}
                    </span>

                    <span>
                      Còn khoảng {secondsLeft}s
                    </span>

                    <button
                      className="rps-button"
                      disabled={
                        !isConnected ||
                        busy ||
                        paused === true ||
                        waitingRoom.host.toLowerCase() ===
                          address?.toLowerCase()
                      }
                      onClick={() => handleLobbyJoin(waitingRoom)}
                    >
                      Join {fmt(waitingRoom.stake)} METOK
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rps-card">
          <h3>Phòng game</h3>

          <div className="rps-fields">
            <div className="rps-field">
              <label>Room ID</label>
              <input
                value={roomIdText}
                onChange={(e) => setRoomIdText(e.target.value)}
                inputMode="numeric"
                placeholder="Nhập Room ID"
              />
            </div>

            <div className="rps-field">
              <label>Stake mỗi round (METOK)</label>
              <input
                value={stakeText}
                onChange={(e) => setStakeText(e.target.value)}
                inputMode="decimal"
              />
            </div>

            <div className="rps-field">
              <label>Bankroll (METOK)</label>
              <input
                value={bankrollText}
                onChange={(e) => setBankrollText(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="rps-actions">
            <button
              className="rps-button secondary"
              disabled={!isConnected || busy || bankroll <= 0n}
              onClick={handleApprove}
            >
              Approve {bankrollText || "0"} METOK
            </button>

            <button
              className="rps-button"
              disabled={
                !isConnected ||
                busy ||
                paused === true ||
                stake <= 0n ||
                bankroll < stake ||
                (allowance ?? 0n) < bankroll
              }
              onClick={handleCreate}
            >
              Tạo phòng
            </button>

            <button
              className="rps-button"
              disabled={
                !isConnected ||
                !roomId ||
                !room ||
                room.state !== 1 ||
                busy ||
                paused === true ||
                bankroll < room.stake ||
                (allowance ?? 0n) < bankroll
              }
              onClick={handleJoin}
            >
              Join phòng
            </button>
          </div>

          <p className="rps-help">
            Balance: <strong>{fmt(balance)} METOK</strong>
            {" · "}
            Allowance: <strong>{fmt(allowance)} METOK</strong>
          </p>
        </section>

        <section className="rps-card">
          <h3>Trạng thái on-chain</h3>

          <div className="rps-status">
            <div className="rps-stat">
              <span>System</span>
              <strong>{paused ? "Paused" : "Live"}</strong>
            </div>

            <div className="rps-stat">
              <span>Room</span>
              <strong>
                {room ? ROOM_STATE[room.state] ?? room.state : "-"}
              </strong>
            </div>

            <div className="rps-stat">
              <span>Room ID</span>
              <strong>{roomId?.toString() ?? "-"}</strong>
            </div>

            <div className="rps-stat">
              <span>Match</span>
              <strong>{room?.matchId?.toString() ?? "-"}</strong>
            </div>

            <div className="rps-stat">
              <span>Round</span>
              <strong>{room?.roundId?.toString() ?? "-"}</strong>
            </div>

            <div className="rps-stat">
              <span>Stake</span>
              <strong>{room ? `${fmt(room.stake)} METOK` : "-"}</strong>
            </div>

            <div className="rps-stat">
              <span>Host</span>
              <strong>{shortAddress(room?.host)}</strong>
            </div>

            <div className="rps-stat">
              <span>Host bankroll</span>
              <strong>
                {room ? `${fmt(room.hostBalance)} METOK` : "-"}
              </strong>
            </div>

            <div className="rps-stat">
              <span>Challenger</span>
              <strong>{shortAddress(room?.challenger)}</strong>
            </div>

            <div className="rps-stat">
              <span>Challenger bankroll</span>
              <strong>
                {room
                  ? `${fmt(room.challengerBalance)} METOK`
                  : "-"}
              </strong>
            </div>

            <div className="rps-stat">
              <span>Host committed</span>
              <strong>
                {round && round.hostCommit !== zeroHash ? "Yes" : "No"}
              </strong>
            </div>

            <div className="rps-stat">
              <span>Challenger committed</span>
              <strong>
                {round && round.challengerCommit !== zeroHash
                  ? "Yes"
                  : "No"}
              </strong>
            </div>
          </div>
        </section>

        <section className="rps-card rps-card-wide">
          <h3>Chơi round</h3>

          <div className="rps-choices">
            <button
              className="rps-button rps-choice"
              disabled={!isPlayer || room?.state !== 2 || busy}
              onClick={() => handleChoice(RPS_CHOICE.rock)}
            >
              ✊ Rock
            </button>

            <button
              className="rps-button rps-choice"
              disabled={!isPlayer || room?.state !== 2 || busy}
              onClick={() => handleChoice(RPS_CHOICE.paper)}
            >
              ✋ Paper
            </button>

            <button
              className="rps-button rps-choice"
              disabled={!isPlayer || room?.state !== 2 || busy}
              onClick={() => handleChoice(RPS_CHOICE.scissors)}
            >
              ✌️ Scissors
            </button>
          </div>

          <div className="rps-actions">
            <button
              className="rps-button"
              disabled={!isPlayer || room?.state !== 2 || busy}
              onClick={handleReveal}
            >
              Reveal
            </button>

            <button
              className="rps-button secondary"
              disabled={!roomId || room?.state !== 2 || busy}
              onClick={handleChoiceTimeout}
            >
              Settle choice timeout
            </button>

            <button
              className="rps-button secondary"
              disabled={!roomId || room?.state !== 2 || busy}
              onClick={() =>
                roomId &&
                runTx("Force settle choice timeout", () =>
                  actions.forceSettleChoiceTimeout(roomId),
                )
              }
            >
              Force settle
            </button>

            <button
              className="rps-button secondary"
              disabled={!roomId || room?.state !== 2 || busy}
              onClick={() =>
                roomId &&
                runTx("Settle reveal timeout", () =>
                  actions.settleRevealTimeout(roomId),
                )
              }
            >
              Settle reveal timeout
            </button>
          </div>

          <p className="rps-help">
            Secret reveal được tạo bằng Web Crypto và lưu local trên
            trình duyệt theo chain/room/match/round/player. Không gửi
            secret lên chain cho tới khi bạn bấm Reveal.
          </p>
        </section>

        <section className="rps-card rps-card-wide">
          <h3>Thoát & nhận tiền</h3>

          <div className="rps-actions">
            <button
              className="rps-button"
              disabled={!claimable || claimable === 0n || busy}
              onClick={() =>
                runTx("Claim METOK", () => actions.claim())
              }
            >
              Claim {fmt(claimable)} METOK
            </button>

            <button
              className="rps-button secondary"
              disabled={!roomId || !isPlayer || busy}
              onClick={() =>
                roomId &&
                runTx("Request leave", () =>
                  actions.requestLeave(roomId),
                )
              }
            >
              Request leave
            </button>

            <button
              className="rps-button secondary"
              disabled={!roomId || !isPlayer || room?.state !== 2 || busy}
              onClick={handleImmediateLeave}
            >
              Immediate leave
            </button>

            <button
              className="rps-button danger"
              disabled={!roomId || !isHost || room?.state !== 1 || busy}
              onClick={() =>
                roomId &&
                runTx("Hủy phòng", () =>
                  actions.cancelWaitingRoom(roomId),
                )
              }
            >
              Hủy phòng chờ
            </button>
          </div>

          <p className="rps-help">
            Claimable hiện tại: <strong>{fmt(claimable)} METOK</strong>
          </p>
        </section>
      </div>

      <p className={`rps-message ${message.includes(": ") && /revert|error|failed|denied|reject/i.test(message) ? "rps-error" : ""}`}>
        Contract: {GAME_ADDRESS}
        <br />
        {message || "Sẵn sàng."}
      </p>
    </main>
  );
}
