document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const topbarRight = document.querySelector(".topbar-right");
    if (!topbarRight) return;

    let notifications = [];

    function ensureNotificationControls() {
        let stockAlertText = document.getElementById("stockAlertText");
        const stockAlert = document.querySelector(".stock-alert");
        if (!stockAlertText && stockAlert) {
            stockAlertText = stockAlert.querySelector("span");
            if (stockAlertText) {
                stockAlertText.id = "stockAlertText";
            }
        }

        if (document.querySelector(".notification-dropdown")) return;

        const bellButton = Array.from(topbarRight.querySelectorAll(".icon-button"))
            .find(button => button.querySelector(".bi-bell-fill"));

        const dropdown = document.createElement("div");
        dropdown.className = "notification-dropdown";
        dropdown.innerHTML = `
            <button class="icon-button notification-btn" id="notificationBtn" type="button">
                <i class="bi bi-bell-fill"></i>
                <span class="notification-badge" id="notificationBadge">0</span>
            </button>
            <div class="notification-menu" id="notificationMenu">
                <div class="notification-title">
                    <h4>Notifikasi</h4>
                    <small id="notificationSubtitle">0 Notifikasi Aktif</small>
                </div>
                <div class="notification-list" id="notificationList"></div>
                <div class="notification-footer" id="notificationFooter">
                    <button type="button">Lihat Semua</button>
                </div>
            </div>
        `;

        if (bellButton) {
            bellButton.replaceWith(dropdown);
        } else {
            const stockAlertNode = document.querySelector(".stock-alert");
            if (stockAlertNode?.parentElement === topbarRight) {
                stockAlertNode.after(dropdown);
            } else {
                topbarRight.prepend(dropdown);
            }
        }
    }

    function ensureAccountControls() {
        let settingsDropdown = document.querySelector(".settings-dropdown");
        let profile = document.querySelector(".profile");

        if (!settingsDropdown) {
            settingsDropdown = document.createElement("div");
            settingsDropdown.className = "settings-dropdown";
            settingsDropdown.innerHTML = `
                <button class="icon-button" id="settingBtn" type="button">
                    <i class="bi bi-gear-fill"></i>
                </button>
                <div class="settings-menu" id="settingsMenu">
                    <div class="settings-title">Pengaturan Akun</div>
                    <a href="#" id="editProfileBtn">
                        <i class="bi bi-person-circle"></i>
                        <span>Edit Profil</span>
                    </a>
                    <a href="#" id="changePasswordBtn">
                        <i class="bi bi-key"></i>
                        <span>Ubah Password</span>
                    </a>
                    <hr>
                    <a href="/logout" class="logout-setting">
                        <i class="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                    </a>
                </div>
            `;
            if (profile) {
                topbarRight.insertBefore(settingsDropdown, profile);
            } else {
                topbarRight.appendChild(settingsDropdown);
            }
        }

        settingsDropdown.hidden = false;

        if (!profile) {
            profile = document.createElement("div");
            profile.className = "profile";
            profile.innerHTML = `
                <div class="profile-info">
                    <h4 id="fullname">Loading...</h4>
                    <span id="role">OWNER</span>
                </div>
            `;
            topbarRight.appendChild(profile);
        }

        profile.hidden = false;
    }

    function ensureAccountModals() {
        if (!document.getElementById("editProfileModal")) {
            document.body.insertAdjacentHTML("beforeend", `
                <div class="account-modal" id="editProfileModal">
                    <div class="account-modal-content">
                        <div class="account-modal-header">
                            <h3>Edit Profil</h3>
                            <button class="account-close" id="closeProfileModal" type="button">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div class="account-modal-body">
                            <div class="account-field">
                                <label>Nama Lengkap</label>
                                <input id="editFullname" type="text">
                            </div>
                            <div class="account-field">
                                <label>Username</label>
                                <input id="editUsername" type="text">
                            </div>
                            <div class="account-field">
                                <label>Email</label>
                                <input id="editEmail" type="email">
                            </div>
                            <div class="account-field">
                                <label>No. HP</label>
                                <input id="editPhone" type="text">
                            </div>
                        </div>
                        <div class="account-modal-footer">
                            <button class="account-cancel" id="cancelProfile" type="button">Batal</button>
                            <button class="account-save" id="saveProfile" type="button">Simpan</button>
                        </div>
                    </div>
                </div>
            `);
        }

        if (!document.getElementById("passwordModal")) {
            document.body.insertAdjacentHTML("beforeend", `
                <div class="account-modal" id="passwordModal">
                    <div class="account-modal-content">
                        <div class="account-modal-header">
                            <h3>Ubah Password</h3>
                            <button class="account-close" id="closePasswordModal" type="button">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div class="account-modal-body">
                            <div class="account-field">
                                <label>Password Lama</label>
                                <input id="oldPassword" type="password">
                            </div>
                            <div class="account-field">
                                <label>Password Baru</label>
                                <input id="newPassword" type="password">
                            </div>
                            <div class="account-field">
                                <label>Konfirmasi Password</label>
                                <input id="confirmPassword" type="password">
                            </div>
                        </div>
                        <div class="account-modal-footer">
                            <button class="account-cancel" id="cancelPassword" type="button">Batal</button>
                            <button class="account-save" id="savePassword" type="button">Simpan</button>
                        </div>
                    </div>
                </div>
            `);
        }
    }

    function getElements() {
        return {
            fullname: document.getElementById("fullname"),
            role: document.getElementById("role"),
            notificationBtn: document.getElementById("notificationBtn"),
            notificationMenu: document.getElementById("notificationMenu"),
            notificationBadge: document.getElementById("notificationBadge"),
            notificationSubtitle: document.getElementById("notificationSubtitle"),
            notificationList: document.getElementById("notificationList"),
            notificationFooter: document.getElementById("notificationFooter"),
            stockAlertText: document.getElementById("stockAlertText"),
            settingBtn: document.getElementById("settingBtn"),
            settingsMenu: document.getElementById("settingsMenu"),
            editProfileBtn: document.getElementById("editProfileBtn"),
            editProfileModal: document.getElementById("editProfileModal"),
            closeProfileModal: document.getElementById("closeProfileModal"),
            cancelProfile: document.getElementById("cancelProfile"),
            saveProfile: document.getElementById("saveProfile"),
            editFullname: document.getElementById("editFullname"),
            editUsername: document.getElementById("editUsername"),
            editEmail: document.getElementById("editEmail"),
            editPhone: document.getElementById("editPhone"),
            changePasswordBtn: document.getElementById("changePasswordBtn"),
            passwordModal: document.getElementById("passwordModal"),
            closePasswordModal: document.getElementById("closePasswordModal"),
            cancelPassword: document.getElementById("cancelPassword"),
            savePassword: document.getElementById("savePassword"),
            oldPassword: document.getElementById("oldPassword"),
            newPassword: document.getElementById("newPassword"),
            confirmPassword: document.getElementById("confirmPassword")
        };
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
                ...options.headers
            }
        });
        const data = await response.json();
        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Request gagal");
        }
        return data;
    }

    let user = null;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");
    }

    function renderNotifications() {
        const el = getElements();
        if (el.notificationBadge) el.notificationBadge.textContent = notifications.length;
        if (el.notificationSubtitle) {
            el.notificationSubtitle.textContent = `${notifications.length} Notifikasi Aktif`;
        }
        if (el.stockAlertText) {
            el.stockAlertText.textContent = notifications.length
                ? `Stok ${notifications[0].product} menipis`
                : "Semua stok aman";
        }
        if (!el.notificationList) return;
        if (!notifications.length) {
            el.notificationList.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-icon"><i class="bi bi-check-circle-fill"></i></div>
                    <span>Tidak ada notifikasi.</span>
                </div>
            `;
            if (el.notificationFooter) el.notificationFooter.style.display = "none";
            return;
        }
        el.notificationList.innerHTML = notifications.slice(0, 4).map(item => `
            <div class="notification-item">
                <div class="notification-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
                <div class="notification-info">
                    <h5>Stok ${escapeHtml(item.product)} Menipis</h5>
                    <span>Sisa: ${escapeHtml(item.stock)}</span>
                    <small>${escapeHtml(item.time || "")}</small>
                </div>
            </div>
        `).join("");
        if (el.notificationFooter) el.notificationFooter.style.display = notifications.length > 4 ? "block" : "none";
    }

    async function loadNotifications() {
        try {
            const result = await api("/api/notification");
            notifications = result.data || [];
        } catch (error) {
            notifications = [];
        }
        renderNotifications();
    }

    function renderUser() {
        const el = getElements();
        if (!user) return;
        if (el.fullname) el.fullname.textContent = user.fullname || user.username || "User";
        if (el.role) el.role.textContent = user.role || "OWNER";
    }

    async function loadUser() {
        const result = await api("/api/me");
        user = result.user;
        renderUser();
    }

    function closeProfile() {
        const el = getElements();
        el.editProfileModal?.classList.remove("show");
    }

    function openProfile() {
        const el = getElements();
        if (!user) return;
        if (el.editFullname) el.editFullname.value = user.fullname || "";
        if (el.editUsername) el.editUsername.value = user.username || "";
        if (el.editEmail) el.editEmail.value = user.email || "";
        if (el.editPhone) el.editPhone.value = user.phone || "";
        el.settingsMenu?.classList.remove("active");
        el.editProfileModal?.classList.add("show");
    }

    async function saveProfile() {
        const el = getElements();
        const fullname = el.editFullname?.value.trim() || "";
        const username = el.editUsername?.value.trim() || "";

        if (!fullname || !username) {
            alert("Nama lengkap dan username wajib diisi");
            return;
        }

        const formData = new FormData();
        formData.append("fullname", fullname);
        formData.append("username", username);
        formData.append("email", el.editEmail?.value.trim() || "");
        formData.append("phone", el.editPhone?.value.trim() || "");

        const result = await api("/api/update-profile", {
            method: "POST",
            body: formData
        });

        user = {
            ...user,
            ...result.user,
            role: user?.role
        };
        renderUser();
        closeProfile();
        alert(result.message || "Profil berhasil diperbarui");
    }

    function closePassword() {
        const el = getElements();
        el.passwordModal?.classList.remove("show");
        if (el.oldPassword) el.oldPassword.value = "";
        if (el.newPassword) el.newPassword.value = "";
        if (el.confirmPassword) el.confirmPassword.value = "";
    }

    function openPassword() {
        const el = getElements();
        el.settingsMenu?.classList.remove("active");
        el.passwordModal?.classList.add("show");
    }

    async function savePassword() {
        const el = getElements();
        const oldPassword = el.oldPassword?.value || "";
        const newPassword = el.newPassword?.value || "";
        const confirmPassword = el.confirmPassword?.value || "";

        if (!oldPassword || !newPassword) {
            alert("Password lama dan password baru wajib diisi");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Konfirmasi password tidak sama");
            return;
        }

        const result = await api("/api/change-password", {
            method: "POST",
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });

        closePassword();
        alert(result.message || "Password berhasil diperbarui");
    }

    function bind() {
        const el = getElements();

        el.settingBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.notificationMenu?.classList.remove("active");
            el.settingsMenu?.classList.toggle("active");
        });
        el.notificationBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.settingsMenu?.classList.remove("active");
            el.notificationMenu?.classList.toggle("active");
        });

        document.addEventListener("click", () => {
            el.settingsMenu?.classList.remove("active");
            el.notificationMenu?.classList.remove("active");
        });

        el.settingsMenu?.addEventListener("click", event => event.stopPropagation());
        el.notificationMenu?.addEventListener("click", event => event.stopPropagation());
        el.editProfileBtn?.addEventListener("click", event => {
            event.preventDefault();
            openProfile();
        });
        el.changePasswordBtn?.addEventListener("click", event => {
            event.preventDefault();
            openPassword();
        });
        el.closeProfileModal?.addEventListener("click", closeProfile);
        el.cancelProfile?.addEventListener("click", closeProfile);
        el.saveProfile?.addEventListener("click", () => {
            saveProfile().catch(error => alert(error.message));
        });
        el.closePasswordModal?.addEventListener("click", closePassword);
        el.cancelPassword?.addEventListener("click", closePassword);
        el.savePassword?.addEventListener("click", () => {
            savePassword().catch(error => alert(error.message));
        });
        el.editProfileModal?.addEventListener("click", event => {
            if (event.target === el.editProfileModal) closeProfile();
        });
        el.passwordModal?.addEventListener("click", event => {
            if (event.target === el.passwordModal) closePassword();
        });

        document.querySelectorAll(".logout-setting").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                await fetch("/api/logout", { method: "POST", credentials: "include" });
                window.location.href = "/";
            });
        });
    }

    ensureNotificationControls();
    ensureAccountControls();
    ensureAccountModals();
    bind();
    loadUser().catch(() => {
        window.location.href = "/";
    });
    loadNotifications();
    setInterval(loadNotifications, 30000);
});
