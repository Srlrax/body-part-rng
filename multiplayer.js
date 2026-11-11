
const SUPABASE_URL = "https://mjkmxdfzcktzkwjbhxsi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_b9LZhqeD0p-MpkaWCcseUw_AcdiXZoG";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let currentChannel = null;
let currentRoom = null;

const playerId = crypto.randomUUID();
const playerName = "Player-" + Math.floor(1000 + Math.random() * 9000);

const lobbyStatus = document.getElementById("lobbyStatus");
const playerCount = document.getElementById("playerCount");

async function joinGameRoom(code) {
  if (currentChannel) {
    await supabaseClient.removeChannel(currentChannel);
    currentChannel = null;
  }

  currentRoom = code;

  lobbyStatus.textContent = "Connecting to room " + code + "...";

  currentChannel = supabaseClient.channel("room-" + code, {
    config: {
      presence: {
        key: playerId
      },
      broadcast: {
        self: false
      }
    }
  });

  currentChannel
    .on("presence", { event: "sync" }, () => {
      const state = currentChannel.presenceState();

      const players = Object.values(state).flat();

      playerCount.textContent =
        "Players online: " + players.length + "/10";

      const names = players.map(p => p.name);

      lobbyStatus.textContent =
        "Room: " + code + " | Players: " + names.join(", ");

      if (players.length > 10) {
        lobbyStatus.textContent = "Room is full!";
        supabaseClient.removeChannel(currentChannel);
        currentChannel = null;
      }
    })
    .subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await currentChannel.track({
          id: playerId,
          name: playerName
        });

        lobbyStatus.textContent =
          "Connected! Your name: " + playerName;
      }

      if (status === "CHANNEL_ERROR") {
        lobbyStatus.textContent =
          "Connection error. Check your Supabase settings.";
      }
    });
}

document.getElementById("createRoom").addEventListener("click", () => {
  const code = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  document.getElementById("roomCode").value = code;

  joinGameRoom(code);
});

document.getElementById("joinRoom").addEventListener("click", () => {
  const code = document.getElementById("roomCode").value.trim();

  if (!/^\d{6}$/.test(code)) {
    lobbyStatus.textContent =
      "Please enter a valid 6-digit room code.";
    return;
  }

  joinGameRoom(code);
});

window.addEventListener("beforeunload", () => {
  if (currentChannel) {
    currentChannel.unsubscribe();
  }
});
