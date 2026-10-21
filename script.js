let waiting = read("gidicobQueue", []);
let served = read("gidicobServed", []);
let current = read("gidicobCurrent", null);
let ticketNumber = Number(localStorage.getItem("gidicobTicketNumber") || 1);
let toastTimer;

function read(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function save() {
  localStorage.setItem("gidicobQueue", JSON.stringify(waiting));
  localStorage.setItem("gidicobServed", JSON.stringify(served));
  localStorage.setItem("gidicobCurrent", JSON.stringify(current));
  localStorage.setItem("gidicobTicketNumber", String(ticketNumber));
}
function safe(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function time(iso) { return new Date(iso).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}); }
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function render() {
  const body = document.getElementById("queueBody");
  body.innerHTML = "";
  waiting.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><span class="ticket-mini">${safe(s.ticket)}</span></td>
      <td class="student-name">${safe(s.name)}</td><td class="service-name">${safe(s.service)}</td>
      <td>${time(s.joined)}</td><td><span class="badge-waiting">Waiting</span></td>
      <td><button class="row-action" data-remove="${i}" type="button">Remove</button></td>`;
    body.appendChild(tr);
  });
  document.getElementById("emptyState").style.display = waiting.length ? "none" : "block";
  document.getElementById("waitingTotal").textContent = waiting.length;
  document.getElementById("queueCount").textContent = `${waiting.length} student${waiting.length === 1 ? "" : "s"}`;
  document.getElementById("queueFoot").textContent = waiting.length ? `${waiting.length} request${waiting.length === 1 ? "" : "s"} waiting` : "Queue is empty";
  document.getElementById("servedTotal").textContent = served.length;
  document.getElementById("averageWait").textContent = served.length ? "Tracked" : "—";
  document.getElementById("currentTicket").textContent = current ? current.ticket : "—";
  document.getElementById("currentName").textContent = current ? current.name : "No student selected";
  document.getElementById("currentService").textContent = current ? current.service : "Ready for the next student";
  document.getElementById("serveBtn").disabled = waiting.length === 0;
  document.getElementById("serveBtn").style.opacity = waiting.length ? "1" : ".55";
  const next = waiting[0];
  document.getElementById("nextAvatar").textContent = next ? next.name.split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase() : "—";
  document.getElementById("nextName").textContent = next ? next.name : "No one waiting";
  document.getElementById("nextService").textContent = next ? `${next.ticket} · ${next.service}` : "Waiting for arrival";
  const list = document.getElementById("servedList");
  list.innerHTML = served.length ? served.slice(0,4).map(s => `<li><span><strong>${safe(s.name)}</strong><br><small>${safe(s.service)}</small></span><small>${safe(s.ticket)} · ${time(s.completed)}</small></li>`).join("") : '<li class="served-empty">No completed requests yet.</li>';
  save();
}
function addStudent(name, service) {
  const clean = name.trim();
  if (!clean) return showToast("Enter a student name first.");
  if (waiting.some(s => s.name.toLowerCase() === clean.toLowerCase()) || (current && current.name.toLowerCase() === clean.toLowerCase())) return showToast("That student is already active.");
  waiting.push({name:clean, service, joined:new Date().toISOString(), ticket:`A${String(ticketNumber++).padStart(3,"0")}`});
  render(); showToast(`${clean} added to the waiting queue.`);
}
document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  addStudent(document.getElementById("studentName").value, document.getElementById("serviceType").value);
  document.getElementById("studentName").value = "";
  document.getElementById("studentName").focus();
});
document.getElementById("serveBtn").addEventListener("click", () => {
  if (!waiting.length) return showToast("No students are waiting.");
  if (current && !confirm(`Mark ${current.name} complete before calling the next student?`)) return;
  if (current) served.unshift({...current, completed:new Date().toISOString()});
  current = waiting.shift(); render(); showToast(`Now serving ${current.name}.`);
});
document.getElementById("finishBtn").addEventListener("click", () => {
  if (!current) return showToast("There is no active student.");
  served.unshift({...current, completed:new Date().toISOString()});
  const name = current.name; current = null; render(); showToast(`${name}'s service marked complete.`);
});
document.getElementById("queueBody").addEventListener("click", e => {
  const btn = e.target.closest("[data-remove]"); if (!btn) return;
  const [removed] = waiting.splice(Number(btn.dataset.remove), 1); render(); showToast(`${removed.name} removed.`);
});
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!waiting.length) return showToast("The waiting queue is already empty.");
  if (!confirm("Remove all students currently waiting?")) return;
  waiting = []; render(); showToast("Waiting list cleared.");
});
document.getElementById("demoBtn").addEventListener("click", () => {
  const samples = [
    ["Ama Mensah","Course Registration"],
    ["Kofi Asare","Examinations"],
    ["Abena Owusu","Academic Records"]
  ];
  let added = 0;
  samples.forEach(([name, service]) => {
    if (!waiting.some(s => s.name.toLowerCase() === name.toLowerCase()) && !(current && current.name.toLowerCase() === name.toLowerCase())) {
      waiting.push({name,service,joined:new Date().toISOString(),ticket:`A${String(ticketNumber++).padStart(3,"0")}`}); added++;
    }
  });
  render(); showToast(added ? `${added} sample students added.` : "Sample students are already in the queue.");
});
function updateClock() {
  const now = new Date();
  document.getElementById("todayDate").textContent = now.toLocaleDateString([], {day:"numeric",month:"short",year:"numeric"});
  document.getElementById("todayTime").textContent = now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
updateClock(); setInterval(updateClock, 30000); render();
