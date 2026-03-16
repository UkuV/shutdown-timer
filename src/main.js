import { toTotalSeconds, formatCountdown } from "./timer.js";
const { invoke } =  window.__TAURI__.core;

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
  cancelBtn.disabled = false;
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
      isTimerActive = false;
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

  try {
    await invoke("start_shutdown", { seconds: total });
  } catch {
    statusEl.classList.remove("hidden");
    statusEl.textContent = "Failed to schedule shutdown.";
    return;
  }
  setTimerActive(true);
  startCountdown(total);
});

cancelBtn.addEventListener("click", async () => {
  try {
    await invoke("cancel_shutdown");
  } catch {
    statusEl.classList.remove("hidden");
    statusEl.textContent = "Failed to cancel shutdown.";
    return;
  }
  clearInterval(countdownInterval);
  countdownInterval = null;
  setTimerActive(false);
  validateInputs();
});

function clampInput(el) {
  const max = parseInt(el.max, 10);
  const val = parseInt(el.value, 10);
  if (isNaN(val) || val < 0) el.value = 0;
  else if (val > max) el.value = max;
}

[hoursInput, minutesInput, secondsInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
  });
  el.addEventListener("input", () => {
    clampInput(el);
    validateInputs();
  });
});

// Initial validation
validateInputs();

// Expose for tray menu cancel action
window.__isTimerActive = () => isTimerActive;
window.__cancelTimer = async () => {
  try {
    await invoke("cancel_shutdown");
  } catch {
    return;
  }
  clearInterval(countdownInterval);
  countdownInterval = null;
  setTimerActive(false);
  validateInputs();
};
