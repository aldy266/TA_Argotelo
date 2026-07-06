// ======================================
// OWNER STAFF MANAGEMENT
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    const STORAGE_KEY = "argotelo_staff_members";
    const fullname = document.getElementById("fullname");
    const role = document.getElementById("role");
    const searchInput = document.querySelector(".attendance-search input");
    const attendanceTable = document.querySelector(".attendance-table tbody");
    const logoutBtn = document.querySelector(".logout");

    let staffMembers = loadStaff();
    let filteredData = [...staffMembers];

    // =====================================
    // UTILITIES
    // =====================================

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `staff-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showToast(message, type = "success") {
        const oldToast = document.querySelector(".toast");
        if (oldToast) oldToast.remove();

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="bi bi-${type === "success" ? "check-circle-fill" : "exclamation-circle-fill"}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 100);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // =====================================
    // STORAGE
    // =====================================

    function defaultStaff() {
        return [];
    }

    function loadStaff() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return defaultStaff();
        try {
            return Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : defaultStaff();
        } catch {
            return defaultStaff();
        }
    }

    function saveStaff() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(staffMembers));
    }

    // =====================================
    // RENDER TABLE
    // =====================================

    function renderTable() {
        if (filteredData.length === 0) {
            attendanceTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--text-light);">
                        <i class="bi bi-inbox" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
                        <p>Belum ada data staff. Klik tombol "Tambah Staff" untuk memulai.</p>
                    </td>
                </tr>
            `;
            return;
        }

        attendanceTable.innerHTML = filteredData.map(staff => `
            <tr>
                <td>
                    <div class="staff-info">
                        <img src="{{ url_for('static', filename='images/profile.png') }}" alt="Profile">
                        <div>
                            <h4>${escapeHtml(staff.name)}</h4>
                            <span>${escapeHtml(staff.role)}</span>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(staff.clockIn)}</td>
                <td><span class="shift-badge">${escapeHtml(staff.shift)}</span></td>
                <td>
                    <span class="badge ${staff.status === "HADIR" ? "success" : staff.status === "TERLAMBAT" ? "warning" : "danger"}">
                        ${escapeHtml(staff.status)}
                    </span>
                </td>
                <td>${escapeHtml(staff.workHours)}</td>
                <td style="display: flex; gap: 8px; justify-content: center;">
                    <button class="edit-btn" type="button" data-id="${staff.id}" style="background: #5A3718; color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: background 0.3s ease;">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="delete-btn" type="button" data-id="${staff.id}" style="background: #E5484D; color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: background 0.3s ease;">
                        <i class="bi bi-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `).join("");

        animateRows();
    }

    function animateRows() {
        const rows = document.querySelectorAll(".attendance-table tbody tr");
        if (rows.length === 0) return;
        
        rows.forEach((row, index) => {
            row.style.opacity = "0";
            row.style.transform = "translateY(12px)";
            setTimeout(() => {
                row.style.transition = ".35s ease";
                row.style.opacity = "1";
                row.style.transform = "translateY(0px)";
            }, index * 50);
        });
    }

    // =====================================
    // FORM MODAL
    // =====================================

    function openStaffForm(staff = null) {
        const modal = document.createElement("div");
        modal.className = "menu-modal-backdrop";
        modal.innerHTML = `
            <div class="menu-modal" role="dialog" aria-modal="true">
                <div class="menu-modal-header">
                    <h2>${staff ? "Edit Staff" : "Tambah Staff Baru"}</h2>
                    <button class="modal-close" type="button" aria-label="Tutup">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <form id="staffForm" class="menu-form">
                    <label>
                        Nama Staff
                        <input name="name" type="text" value="${escapeHtml(staff?.name || "")}" required>
                    </label>
                    <label>
                        Role / Jabatan
                        <input name="role" type="text" value="${escapeHtml(staff?.role || "")}" required>
                    </label>
                    <label>
                        Email
                        <input name="email" type="email" value="${escapeHtml(staff?.email || "")}" required>
                    </label>
                    <label>
                        No. Telepon
                        <input name="phone" type="tel" value="${escapeHtml(staff?.phone || "")}" required>
                    </label>
                    <label>
                        Shift
                        <select name="shift" required>
                            <option value="">-- Pilih Shift --</option>
                            <option value="Shift Pagi" ${staff?.shift === "Shift Pagi" ? "selected" : ""}>Shift Pagi</option>
                            <option value="Shift Sore" ${staff?.shift === "Shift Sore" ? "selected" : ""}>Shift Sore</option>
                            <option value="Shift Malam" ${staff?.shift === "Shift Malam" ? "selected" : ""}>Shift Malam</option>
                        </select>
                    </label>
                    <div class="menu-form-actions">
                        <button type="button" class="cancel-btn">Batal</button>
                        <button type="submit" class="save-btn">Simpan</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        modal.querySelector(".modal-close").addEventListener("click", close);
        modal.querySelector(".cancel-btn").addEventListener("click", close);
        modal.addEventListener("click", event => {
            if (event.target === modal) close();
        });

        modal.querySelector("#staffForm").addEventListener("submit", event => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);

            const name = formData.get("name").trim();
            const role = formData.get("role").trim();
            const email = formData.get("email").trim();
            const phone = formData.get("phone").trim();
            const shift = formData.get("shift").trim();

            if (!name || !role || !email || !phone || !shift) {
                showToast("Semua field harus diisi!", "error");
                return;
            }

            const payload = {
                id: staff?.id || makeId(),
                name: name,
                role: role,
                email: email,
                phone: phone,
                shift: shift,
                clockIn: staff?.clockIn || "-:-:-",
                status: staff?.status || "HADIR",
                workHours: staff?.workHours || "00h 00m"
            };

            if (staff) {
                staffMembers = staffMembers.map(item => item.id === staff.id ? payload : item);
                showToast(`${name} berhasil diupdate!`);
            } else {
                staffMembers.unshift(payload);
                showToast(`${name} berhasil ditambahkan!`);
            }

            saveStaff();
            filteredData = [...staffMembers];
            renderTable();
            close();
        });

        modal.querySelector("input[name='name']").focus();
    }

    // =====================================
    // SEARCH
    // =====================================

    if (searchInput) {
        searchInput.addEventListener("input", event => {
            const keyword = event.target.value.toLowerCase();
            filteredData = staffMembers.filter(staff =>
                staff.name.toLowerCase().includes(keyword) ||
                staff.role.toLowerCase().includes(keyword) ||
                staff.email.toLowerCase().includes(keyword)
            );
            renderTable();
        });
    }

    // =====================================
    // TABLE ACTIONS
    // =====================================

    attendanceTable.addEventListener("click", event => {
        const editBtn = event.target.closest(".edit-btn");
        if (editBtn) {
            const staffId = editBtn.dataset.id;
            const staff = staffMembers.find(s => s.id === staffId);
            if (staff) openStaffForm(staff);
            return;
        }

        const deleteBtn = event.target.closest(".delete-btn");
        if (deleteBtn) {
            const staffId = deleteBtn.dataset.id;
            const staff = staffMembers.find(s => s.id === staffId);
            if (staff && confirm(`Hapus ${staff.name}?`)) {
                staffMembers = staffMembers.filter(s => s.id !== staffId);
                saveStaff();
                filteredData = [...staffMembers];
                renderTable();
                showToast(`${staff.name} berhasil dihapus!`);
            }
        }
    });

    // =====================================
    // ADD BUTTONS
    // =====================================

    const addBtn = document.querySelector(".primary-button, .floating-button");
    if (addBtn) {
        addBtn.addEventListener("click", () => openStaffForm());
    }

    // =====================================
    // SIDEBAR ACTIVE
    // =====================================

    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.classList.toggle("active", link.pathname === window.location.pathname);
    });

    // =====================================
    // LOAD PROFILE
    // =====================================

    async function loadProfile() {
        try {
            const response = await fetch("/api/me", { credentials: "include" });
            const result = await response.json();

            if (result.success) {
                if (fullname) fullname.textContent = result.user.fullname || "User";
                if (role) role.textContent = result.user.role || "Owner";
            }
        } catch (error) {
            console.error(error);
        }
    }

    // =====================================
    // LOGOUT
    // =====================================

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async event => {
            event.preventDefault();
            try {
                await fetch("/api/logout", { method: "POST", credentials: "include" });
            } catch (error) {
                console.error(error);
            }
            window.location.href = "/";
        });
    }

    // =====================================
    // CARD ANIMATION
    // =====================================

    const cards = document.querySelectorAll(".stat-card, .attendance-card, .summary-card");
    cards.forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        setTimeout(() => {
            card.style.transition = ".45s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0px)";
        }, index * 120);
    });

    // =====================================
    // INITIALIZE
    // =====================================

    await loadProfile();
    renderTable();

});