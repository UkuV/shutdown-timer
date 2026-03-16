import { invoke } from "@tauri-apps/api/core";
import { toTotalSeconds, formatCountdown } from "./timer.js";

const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds-input");
const startBtn = document.getElementById("start-btn");
const cancelBtn = document.getElementById("cancel-btn");
const statusEl = document.getElementById("status");

let countdownInterval = null;
let isTimerActive = false;

function getInputs() {
  return {
    hours: hoursInput.value,
    minutes: minutesInput.value,
    seconds: secondsInput.value,
  };
}

function validateInputs() {
  const { hours, minutes, seconds } = getInputs();
  const total = toTotalSeconds(hours, minutes, seconds);
  startBtn.disabled = total === 0;
}

function setTimerActive(active) {
  isTimerActive = active;
  [hoursInput, minutesInput, secondsInput].forEach((el) => {
    el.disabled = active;
  });
  startBtn.classList.toggle("hidden", active);
  cancelBtn.classList.toggle("hidden", !active);
  if (!active) {
    statusEl.classList.add("hidden");
    statusEl.textContent = "";
  }
}

function startCountdown(totalSeconds) {
  let remaining = totalSeconds;

  statusEl.classList.remove("hidden");
  statusEl.textContent = `Shutting down in ${formatCountdown(remaining)}...`;

  countdownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      statusEl.textContent = "Shutting down...";
      cancelBtn.disabled = true;
    } else {
      statusEl.textContent = `Shutting down in ${formatCountdown(remaining)}...`;
    }
  }, 1000);
}

startBtn.addEventListener("click", async () => {
  const { hours, minutes, seconds } = getInputs();
  const total = toTotalSeconds(hours, minutes, seconds);
  if (total === 0) return;

  await invoke("start_shutdown", { seconds: total });
  setTimerActive(true);
  startCountdown(total);
});

cancelBtn.addEventListener("click", async () => {
  await invoke("cancel_shutdown");
  clearInterval(countdownInterval);
  countdownInterval = null;
  setTimerActive(false);
  validateInputs();
});

// Disable start when inputs are all 0
[hoursInput, minutesInput, secondsInput].forEach((el) => {
  el.addEventListener("input", validateInputs);
});

// Initial validation
validateInputs();

// Expose for tray menu cancel action
window.__isTimerActive = () => isTimerActive;
window.__cancelTimer = async () => {
  await invoke("cancel_shutdown");
  clearInterval(countdownInterval);
  countdownInterval = null;
  setTimerActive(false);
  validateInputs();
};
