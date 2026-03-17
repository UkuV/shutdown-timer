import { toTotalSeconds, formatCountdown, clampValue, actionLabels } from "./timer.js";
const { invoke } =  window.__TAURI__.core;

const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds-input");
const actionSelect = document.getElementById("action");
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
  [hoursInput, minutesInput, secondsInput, actionSelect].forEach((el) => {
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

function startCountdown(totalSeconds, action) {
  let remaining = totalSeconds;
  const label = actionLabels[action] ?? "Shutting down";

  statusEl.classList.remove("hidden");
  statusEl.textContent = `${label} in ${formatCountdown(remaining)}...`;

  countdownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      isTimerActive = false;
      statusEl.textContent = `${label}...`;
      cancelBtn.disabled = true;
    } else {
      statusEl.textContent = `${label} in ${formatCountdown(remaining)}...`;
    }
  }, 1000);
}

startBtn.addEventListener("click", async () => {
  const { hours, minutes, seconds } = getInputs();
  const total = toTotalSeconds(hours, minutes, seconds);
  if (total === 0) return;
  const action = actionSelect.value;

  localStorage.setItem("default_hours", hours);
  localStorage.setItem("default_minutes", minutes);
  localStorage.setItem("default_seconds", seconds);
  localStorage.setItem("default_action", action);

  try {
    await invoke("start_shutdown", { seconds: total, action });
  } catch {
    statusEl.classList.remove("hidden");
    statusEl.textContent = "Failed to schedule action.";
    return;
  }
  setTimerActive(true);
  startCountdown(total, action);
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
  el.value = clampValue(el.value, 0, parseInt(el.max, 10));
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

// Restore saved defaults
hoursInput.value = localStorage.getItem("default_hours") ?? hoursInput.value;
minutesInput.value = localStorage.getItem("default_minutes") ?? minutesInput.value;
secondsInput.value = localStorage.getItem("default_seconds") ?? secondsInput.value;
const savedAction = localStorage.getItem("default_action");
if (savedAction) actionSelect.value = savedAction;

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
