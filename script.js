const nfaList = [
  {
    name: "Strings Ending with 01",
    desc: "Accepts all binary strings over Σ = {0,1} that end with the pattern '01'.",
    states: ["q0", "q1", "q2"],
    alphabet: ["0", "1"],
    start: "q0",
    finals: ["q2"],
    delta: {
      q0: { "0": ["q0", "q1"], "1": ["q0"] },
      q1: { "0": [], "1": ["q2"] },
      q2: { "0": [], "1": [] }
    },
    samples: {
      accept: ["01", "001", "101", "0101", "11001"],
      reject: ["10", "0", "1", "100", "110"]
    }
  },
  {
    name: "Strings Containing 101",
    desc: "Accepts all binary strings over Σ = {0,1} that contain '101' as a substring.",
    states: ["q0", "q1", "q2", "q3"],
    alphabet: ["0", "1"],
    start: "q0",
    finals: ["q3"],
    delta: {
      q0: { "0": ["q0"], "1": ["q0", "q1"] },
      q1: { "0": ["q2"], "1": [] },
      q2: { "0": [], "1": ["q3"] },
      q3: { "0": ["q3"], "1": ["q3"] }
    },
    samples: {
      accept: ["101", "0101", "1010", "11011", "1101"],
      reject: ["100", "010", "001", "0110", "11"]
    }
  },
  {
    name: "Even Number of 0s",
    desc: "Accepts all binary strings over Σ = {0,1} where the total count of '0's is even (0, 2, 4, ...).",
    states: ["q0", "q1"],
    alphabet: ["0", "1"],
    start: "q0",
    finals: ["q0"],
    delta: {
      q0: { "0": ["q1"], "1": ["q0"] },
      q1: { "0": ["q0"], "1": ["q1"] }
    },
    samples: {
      accept: ["", "11", "00", "1001", "0011"],
      reject: ["0", "010", "1110", "0001", "100"]
    }
  }
];

let chosenNFA = -1;
let currentDFA = null;

function selectNFA(index) {
  chosenNFA = index;

  const cards = document.querySelectorAll(".nfa-card");
  cards.forEach((card, i) => {
    if (i === index) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  document.getElementById("startBtn").disabled = false;
}

function startConversion() {
  if (chosenNFA < 0) return;

  const selected = nfaList[chosenNFA];

  document.getElementById("selectedLabel").textContent = selected.name;
  document.getElementById("nfaTitle").textContent = selected.name;
  document.getElementById("nfaDesc").textContent = selected.desc;

  showNFADetails(selected);
  showNFATable(selected);

  document.getElementById("stepsCard").classList.add("hidden");
  document.getElementById("dfaCard").classList.add("hidden");
  document.getElementById("simCard").classList.add("hidden");
  document.getElementById("convertBtn").disabled = false;

  currentDFA = null;
  changeScreen(2);
}

function goBack() {
  changeScreen(1);
}

function resetAll() {
  document.getElementById("stepsCard").classList.add("hidden");
  document.getElementById("dfaCard").classList.add("hidden");
  document.getElementById("simCard").classList.add("hidden");

  document.getElementById("simInput").value = "";
  document.getElementById("simError").classList.add("hidden");
  document.getElementById("simSteps").classList.add("hidden");

  document.getElementById("convertBtn").disabled = false;
  currentDFA = null;
}

function changeScreen(screenNumber) {
  const allScreens = document.querySelectorAll(".screen");
  allScreens.forEach(screen => screen.classList.remove("active"));

  document.getElementById("screen" + screenNumber).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showNFADetails(nfa) {
  const detailsBox = document.getElementById("nfaInfoGrid");

  detailsBox.innerHTML = `
    <div class="info-item"><label>Name</label><value>${nfa.name}</value></div>
    <div class="info-item"><label>States (Q)</label><value>{${nfa.states.join(", ")}}</value></div>
    <div class="info-item"><label>Alphabet (Σ)</label><value>{${nfa.alphabet.join(", ")}}</value></div>
    <div class="info-item"><label>Start State</label><value>${nfa.start}</value></div>
    <div class="info-item"><label>Final States</label><value>{${nfa.finals.join(", ")}}</value></div>
    <div class="info-item"><label>Total States</label><value>${nfa.states.length}</value></div>
  `;
}

function showNFATable(nfa) {
  let tableHtml = `<table><thead><tr><th>State</th>`;

  nfa.alphabet.forEach(symbol => {
    tableHtml += `<th>δ(q, ${symbol})</th>`;
  });

  tableHtml += `</tr></thead><tbody>`;

  nfa.states.forEach(state => {
    const isStart = state === nfa.start;
    const isFinal = nfa.finals.includes(state);

    let rowClass = "";
    if (isFinal) rowClass += " is-final";
    if (isStart) rowClass += " is-start";

    tableHtml += `<tr class="${rowClass}">`;
    tableHtml += `<td>${state}${isFinal ? '<span class="final-badge">Final</span>' : ""}</td>`;

    nfa.alphabet.forEach(symbol => {
      const nextStates = nfa.delta[state]?.[symbol] || [];
      tableHtml += `<td>{${nextStates.join(", ")}}</td>`;
    });

    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table>`;
  document.getElementById("nfaTableWrap").innerHTML = tableHtml;
}

function makeStateName(stateArray) {
  if (stateArray.length === 0) return "∅";
  return "{" + [...stateArray].sort().join(",") + "}";
}

function getClosure(states) {
  return [...states];
}

function getMove(states, symbol, nfa) {
  const next = new Set();

  states.forEach(state => {
    const moves = nfa.delta[state]?.[symbol] || [];
    moves.forEach(item => next.add(item));
  });

  return [...next];
}

function checkFinalState(stateArray, nfa) {
  return stateArray.some(state => nfa.finals.includes(state));
}

function buildDFA(nfa) {
  const steps = [];
  const dfaStates = [];
  const dfaTransitions = {};
  const finalStates = [];
  const queue = [];
  const visited = new Set();

  const startStates = getClosure([nfa.start]);
  const startName = makeStateName(startStates);

  queue.push(startStates);
  visited.add(startName);
  dfaStates.push(startStates);

  steps.push({
    type: "start",
    key: startName
  });

  while (queue.length > 0) {
    const currentStates = queue.shift();
    const currentName = makeStateName(currentStates);

    if (checkFinalState(currentStates, nfa)) {
      finalStates.push(currentName);
    }

    if (!dfaTransitions[currentName]) {
      dfaTransitions[currentName] = {};
    }

    nfa.alphabet.forEach(symbol => {
      const moved = getMove(currentStates, symbol, nfa);
      const nextStates = getClosure(moved);
      const nextName = makeStateName(nextStates);

      dfaTransitions[currentName][symbol] = nextName;

      steps.push({
        type: "transition",
        from: currentName,
        sym: symbol,
        to: nextName,
        isNew: !visited.has(nextName)
      });

      if (!visited.has(nextName)) {
        visited.add(nextName);
        dfaStates.push(nextStates);
        queue.push(nextStates);

        if (checkFinalState(nextStates, nfa)) {
          finalStates.push(nextName);
        }
      }
    });
  }

  return {
    states: dfaStates.map(makeStateName),
    alphabet: nfa.alphabet,
    start: startName,
    finals: [...new Set(finalStates)],
    delta: dfaTransitions,
    steps: steps
  };
}

function runConversion() {
  const selected = nfaList[chosenNFA];
  currentDFA = buildDFA(selected);

  showConversionSteps(currentDFA.steps);
  document.getElementById("stepsCard").classList.remove("hidden");

  showDFATable(currentDFA);
  document.getElementById("dfaCard").classList.remove("hidden");

  showSamples(selected);
  document.getElementById("simCard").classList.remove("hidden");

  document.getElementById("convertBtn").disabled = true;

  setTimeout(() => {
    document.getElementById("stepsCard").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 150);
}

function showConversionSteps(steps) {
  const stepsBox = document.getElementById("stepsWrap");
  let html = "";

  html += `<div class="step-box header-box">Start State: ${steps[0].key}</div>`;

  let number = 1;

  steps.forEach(step => {
    if (step.type !== "transition") return;

    let extraText = "";
    if (step.isNew) {
      extraText += ` <span style="color:var(--primary-light);font-size:0.75rem;margin-left:8px">[NEW]</span>`;
    }
    if (step.to === "∅") {
      extraText += ` <span style="color:var(--text-secondary);font-size:0.75rem">[dead state]</span>`;
    }

    html += `
      <div class="step-box${step.isNew ? " highlight" : ""}">
        <span class="step-num">${number}</span>
        <span class="step-label">${step.from}</span>
        <span class="step-arrow">--${step.sym}--></span>
        <span class="step-label">${step.to}</span>
        ${extraText}
      </div>
    `;

    number++;
  });

  stepsBox.innerHTML = html;
}

function showDFATable(dfa) {
  const statsBox = document.getElementById("dfaStats");

  statsBox.innerHTML = `
    <div class="stat-chip">Total States: <strong>${dfa.states.length}</strong></div>
    <div class="stat-chip">Start State: <strong>${dfa.start}</strong></div>
    <div class="stat-chip">Final States: <strong>${dfa.finals.join(", ") || "None"}</strong></div>
    <div class="stat-chip">Alphabet: <strong>{${dfa.alphabet.join(", ")}}</strong></div>
  `;

  let tableHtml = `<table><thead><tr><th>DFA State</th>`;

  dfa.alphabet.forEach(symbol => {
    tableHtml += `<th>δ(S, ${symbol})</th>`;
  });

  tableHtml += `</tr></thead><tbody>`;

  dfa.states.forEach(stateName => {
    const isStart = stateName === dfa.start;
    const isFinal = dfa.finals.includes(stateName);
    const isDead = stateName === "∅";

    let rowClass = "";
    if (isFinal) rowClass += " is-final";
    if (isStart) rowClass += " is-start";
    if (isDead) rowClass += " dead-state";

    tableHtml += `<tr class="${rowClass}">`;
    tableHtml += `<td>${stateName}${isFinal ? '<span class="final-badge">Final</span>' : ""}</td>`;

    dfa.alphabet.forEach(symbol => {
      const nextState = dfa.delta[stateName]?.[symbol] || "∅";
      tableHtml += `<td>${nextState}</td>`;
    });

    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table>`;
  document.getElementById("dfaTableWrap").innerHTML = tableHtml;
}

function showSamples(nfa) {
  const sampleBox = document.getElementById("sampleBtns");
  let html = "";

  nfa.samples.accept.slice(0, 3).forEach(sample => {
    html += `<button class="sample-btn" onclick="useSample('${sample}')">Try: ${sample || "ε"}</button>`;
  });

  nfa.samples.reject.slice(0, 3).forEach(sample => {
    html += `<button class="sample-btn" onclick="useSample('${sample}')">Try: ${sample || "ε"}</button>`;
  });

  sampleBox.innerHTML = html;
}

function useSample(sample) {
  document.getElementById("simInput").value = sample;
  runSimulation();
}

function runSimulation() {
  if (!currentDFA) return;

  const selected = nfaList[chosenNFA];
  const input = document.getElementById("simInput").value;
  const errorBox = document.getElementById("simError");
  const stepsArea = document.getElementById("simSteps");

  for (let ch of input) {
    if (!selected.alphabet.includes(ch)) {
      errorBox.innerHTML = `Invalid symbol '${ch}'. Use only {${selected.alphabet.join(", ")}}`;
      errorBox.classList.remove("hidden");
      stepsArea.classList.add("hidden");
      return;
    }
  }

  errorBox.classList.add("hidden");

  let currentState = currentDFA.start;
  let trace = [{ state: currentState, sym: null }];

  for (let symbol of input) {
    let nextState = currentDFA.delta[currentState]?.[symbol] || "∅";
    trace.push({
      state: nextState,
      sym: symbol,
      from: currentState
    });
    currentState = nextState;
  }

  const accepted = currentDFA.finals.includes(currentState);

  let html = "";

  trace.forEach((item, index) => {
    if (index === 0) {
      html += `<div class="step-box header-box">Initial State: <strong style="margin-left:6px">${item.state}</strong></div>`;
    } else {
      const lastStep = index === trace.length - 1;

      html += `
        <div class="step-box${lastStep ? " highlight" : ""}">
          <span class="step-num">${index}</span>
          <span class="step-label">${item.from}</span>
          <span class="step-arrow">--${item.sym}--></span>
          <span class="step-label">${item.state}</span>
          ${lastStep ? `<span style="margin-left:auto;font-size:0.72rem;color:var(--text-secondary)">final state</span>` : ""}
        </div>
      `;
    }
  });

  document.getElementById("simStepsWrap").innerHTML = html;

  const shownInput = input === "" ? "ε (empty string)" : `"${input}"`;

  document.getElementById("simResult").innerHTML = `
    <div class="result-box ${accepted ? "accepted" : "rejected"}">
      <div class="result-icon">${accepted ? "✓" : "✗"}</div>
      <div class="result-text">
        <h3>${accepted ? "ACCEPTED" : "REJECTED"}</h3>
        <p>Input: ${shownInput}<br>Final State: ${currentState}<br>${accepted ? "The string is accepted." : "The string is rejected."}</p>
      </div>
    </div>
  `;

  stepsArea.classList.remove("hidden");

  setTimeout(() => {
    stepsArea.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, 100);
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("simInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      runSimulation();
    }
  });
});