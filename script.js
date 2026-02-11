const STORAGE_KEY = "party-members";
const SESSION_KEY = "party-session";
const UNIT_NAME = "Chi bộ Sinh viên 6";

const ACCOUNTS = [
  { username: "dang_admin", password: "123456", role: "Đảng", displayName: "Đảng - Quản trị" },
  { username: "chiuy_01", password: "123456", role: "Chi ủy", displayName: "Chi ủy 01" },
  { username: "dangvien_01", password: "123456", role: "Đảng viên", displayName: "Đảng viên 01" },
];

const PERMISSIONS = {
  "Đảng": { canView: true, canCreate: true, canEdit: true, canDelete: true },
  "Chi ủy": { canView: true, canCreate: true, canEdit: true, canDelete: false },
  "Đảng viên": { canView: true, canCreate: false, canEdit: false, canDelete: false },
};

const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const authMessage = document.querySelector("#auth-message");
const sessionBox = document.querySelector("#session-box");
const currentUserText = document.querySelector("#current-user");
const logoutButton = document.querySelector("#logout");

const memberCard = document.querySelector("#member-card");
const tableCard = document.querySelector("#table-card");
const actionHeader = document.querySelector("#action-header");

const form = document.querySelector("#member-form");
const memberIdInput = document.querySelector("#member-id");
const fullNameInput = document.querySelector("#full-name");
const birthDateInput = document.querySelector("#birth-date");
const unitInput = document.querySelector("#unit");
const joinDateInput = document.querySelector("#join-date");
const positionInput = document.querySelector("#position");
const statusInput = document.querySelector("#status");
const searchInput = document.querySelector("#search");
const tableBody = document.querySelector("#member-table");
const rowTemplate = document.querySelector("#row-template");
const cancelEditButton = document.querySelector("#cancel-edit");

let members = loadMembers();
let currentSession = loadSession();

applySession();
renderTable(filterMembers(searchInput.value));

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const matched = ACCOUNTS.find((account) => account.username === username && account.password === password);

  if (!matched) {
    authMessage.textContent = "Sai tài khoản hoặc mật khẩu.";
    authMessage.classList.add("danger-text");
    return;
  }

  currentSession = {
    username: matched.username,
    role: matched.role,
    displayName: matched.displayName,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
  passwordInput.value = "";
  authMessage.classList.remove("danger-text");
  authMessage.textContent = `Đăng nhập thành công với vai trò ${matched.role}.`;

  applySession();
  renderTable(filterMembers(searchInput.value));
});

logoutButton.addEventListener("click", () => {
  currentSession = null;
  localStorage.removeItem(SESSION_KEY);
  authMessage.classList.remove("danger-text");
  authMessage.textContent = "Đã đăng xuất. Vui lòng đăng nhập lại.";
  resetForm();
  applySession();
  renderTable([]);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPermission("canCreate") && !hasPermission("canEdit")) {
    return;
  }

  const payload = {
    id: memberIdInput.value || crypto.randomUUID(),
    fullName: fullNameInput.value.trim(),
    birthDate: birthDateInput.value,
    unit: UNIT_NAME,
    joinDate: joinDateInput.value,
    position: positionInput.value.trim() || "-",
    status: statusInput.value,
  };

  if (!payload.fullName || !payload.birthDate || !payload.unit || !payload.joinDate) {
    return;
  }

  const index = members.findIndex((member) => member.id === payload.id);

  if (index >= 0 && hasPermission("canEdit")) {
    members[index] = payload;
  } else if (index < 0 && hasPermission("canCreate")) {
    members.push(payload);
  }

  persistMembers();
  resetForm();
  renderTable(filterMembers(searchInput.value));
});

searchInput.addEventListener("input", () => {
  renderTable(filterMembers(searchInput.value));
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
});

tableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !currentSession) {
    return;
  }

  const row = target.closest("tr");
  if (!row?.dataset.id) {
    return;
  }

  const selectedMember = members.find((member) => member.id === row.dataset.id);
  if (!selectedMember) {
    return;
  }

  if (target.classList.contains("delete") && hasPermission("canDelete")) {
    members = members.filter((member) => member.id !== selectedMember.id);
    persistMembers();
    renderTable(filterMembers(searchInput.value));
    if (memberIdInput.value === selectedMember.id) {
      resetForm();
    }
  }

  if (target.classList.contains("edit") && hasPermission("canEdit")) {
    memberIdInput.value = selectedMember.id;
    fullNameInput.value = selectedMember.fullName;
    birthDateInput.value = selectedMember.birthDate;
    unitInput.value = UNIT_NAME;
    joinDateInput.value = selectedMember.joinDate;
    positionInput.value = selectedMember.position === "-" ? "" : selectedMember.position;
    statusInput.value = selectedMember.status;
    cancelEditButton.hidden = false;
    fullNameInput.focus();
  }
});

function applySession() {
  if (!currentSession) {
    sessionBox.hidden = true;
    memberCard.hidden = true;
    tableCard.hidden = true;
    actionHeader.hidden = false;
    return;
  }

  sessionBox.hidden = false;
  currentUserText.textContent = `${currentSession.displayName} (${currentSession.role})`;

  tableCard.hidden = !hasPermission("canView");
  memberCard.hidden = !(hasPermission("canCreate") || hasPermission("canEdit"));
  actionHeader.hidden = !hasAnyActionPermission();

  if (!memberCard.hidden) {
    unitInput.value = UNIT_NAME;
  }
}

function hasPermission(permissionKey) {
  if (!currentSession) {
    return false;
  }

  const rolePermission = PERMISSIONS[currentSession.role];
  return Boolean(rolePermission?.[permissionKey]);
}

function hasAnyActionPermission() {
  return hasPermission("canEdit") || hasPermission("canDelete");
}

function renderTable(rows) {
  tableBody.innerHTML = "";

  if (!currentSession) {
    return;
  }

  if (!rows.length) {
    const empty = document.createElement("tr");
    empty.className = "empty-row";
    empty.innerHTML = '<td colspan="7">Chưa có dữ liệu đảng viên phù hợp.</td>';
    tableBody.append(empty);
    return;
  }

  rows.forEach((member) => {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");
    row.dataset.id = member.id;

    fragment.querySelectorAll("[data-key]").forEach((cell) => {
      const key = cell.getAttribute("data-key");
      cell.textContent = member[key] || "-";
    });

    const actionCell = fragment.querySelector(".row-actions");
    const editButton = actionCell.querySelector(".edit");
    const deleteButton = actionCell.querySelector(".delete");

    if (!hasPermission("canEdit")) {
      editButton.hidden = true;
    }

    if (!hasPermission("canDelete")) {
      deleteButton.hidden = true;
    }

    if (!hasAnyActionPermission()) {
      actionCell.textContent = "Chỉ xem";
      actionCell.classList.add("muted");
    }

    tableBody.append(fragment);
  });
}

function loadMembers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.username || !parsed?.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistMembers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function resetForm() {
  form.reset();
  memberIdInput.value = "";
  unitInput.value = UNIT_NAME;
  cancelEditButton.hidden = true;
}

function filterMembers(keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return members;
  }

  return members.filter((member) => {
    return [member.fullName, member.unit, member.status, member.position]
      .join(" ")
      .toLowerCase()
      .includes(normalizedKeyword);
  });
}
