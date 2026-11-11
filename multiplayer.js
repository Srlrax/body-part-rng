
const lobbyStatus = document.getElementById("lobbyStatus");

document.getElementById("createRoom").addEventListener("click", () => {
  lobbyStatus.textContent =
    "Multiplayer connection is being set up!";
});

document.getElementById("joinRoom").addEventListener("click", () => {
  const code = document.getElementById("roomCode").value.trim();

  if (!code) {
    lobbyStatus.textContent = "Enter a room code!";
    return;
  }

  lobbyStatus.textContent =
    "Room " + code + " is waiting for multiplayer setup.";
});
