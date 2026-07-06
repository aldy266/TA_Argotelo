// ======================================
// ARGOTELO STAFF MODULE - API BASED
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    // =====================================
    // ELEMENTS
    // =====================================

    const fullnameEl = document.getElementById("fullname");
    const roleEl = document.getElementById("role");
    const todayDateEl = document.getElementById("today-date");
    const searchInput = document.querySelector(".attendance-search input");
    const attendanceTable = document.querySelector(".attendance-table tbody");
    const logoutBtn = document.querySelector(".logout");
    
    // Statistics
    const statPresent = document.getElementById("stat-present");
    const statRate = document.getElementById("stat-rate");
    const statLate = document.getElementById("stat-late");
    const statAvgLate = document.getElementById("stat-avg-late");
    const statLeave = document.getElementById("stat-leave");
    
    // Month summary
    const monthRate = document.getElementById("month-rate");
    const monthAttended = document.getElementById("month-attended");
    const monthLeave = document.getElementById("month-leave");
    const progressFill = document.getElementById("progress-fill");
    
    // Containers
    const shiftContainer = document.getElementById("shift-container");
    const approvalContainer = document.getElementById("approval-container");

    // =====================================
    // STATE
    // =====================================

    let attendanceData = [];
    let filteredData = [];

    // =====================================
    // UTILITIES
    // =====================================

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

    async function apiRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                },
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            showToast(error.message, "error");
            throw error;
        }
    }

    function formatTime(isoString) {
        if (!isoString) return "--:--";
        const date = new Date(isoString);
        return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }

    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString + "T00:00:00");
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    function getStatusBadgeClass(status) {
        const statusMap = {
            "PRESENT": "success",
            "LATE": "warning",
            "LEAVE": "info",
            "SICK": "danger",
            "ABSENT": "danger",
            "NOT_CHECKED_IN": "secondary"
        };
        return statusMap[status] || "secondary";
    }

    function getStatusLabel(status) {
        const labelMap = {
            "PRESENT": "HADIR",
            "LATE": "TERLAMBAT",
            "LEAVE": "IZIN",
            "SICK": "SAKIT",
            "ABSENT": "TIDAK HADIR",
            "NOT_CHECKED_IN": "BELUM HADIR",
            "COMPLETED": "SELESAI"
        };
        return labelMap[status] || status;
    }

    // =====================================
    // INIT - LOAD USER INFO
    // =====================================

    async function initUser() {
        try {
            const response = await apiRequest("/api/me");
            if (response.success) {
                fullnameEl.textContent = response.user.fullname || "User";
                roleEl.textContent = response.user.role || "Role";
            }
        } catch (error) {
            console.error("Error loading user:", error);
        }
    }

    // =====================================
    // LOAD STATISTICS
    // =====================================

    async function loadStatistics() {
        try {
            const response = await apiRequest("/api/staff/statistics/today");
            if (response.success) {
                updateStatisticsUI(response.data);
            }
        } catch (error) {
            console.error("Error loading statistics:", error);
        }
    }

    function updateStatisticsUI(stats) {
        const { total_scheduled, present_count, attendance_rate, late_count, avg_late_minutes, leave_count } = stats;
        
        statPresent.textContent = `${present_count} / ${total_scheduled}`;
        statRate.textContent = `${attendance_rate}% Attendance`;
        
        if (late_count === 0) {
            statLate.textContent = "0 Staff";
            statAvgLate.textContent = "Tidak ada keterlambatan";
        } else {
            statLate.textContent = `${late_count} Staff`;
            statAvgLate.textContent = `Rata-rata ${Math.round(avg_late_minutes)} menit`;
            statAvgLate.classList.add("danger");
        }
        
        if (leave_count === 0) {
            statLeave.textContent = "0 Staff";
        } else {
            statLeave.textContent = `${leave_count} Staff`;
        }
    }

    // =====================================
    // LOAD MONTH STATISTICS
    // =====================================

    async function loadMonthStatistics() {
        try {
            const response = await apiRequest("/api/staff/statistics/month");
            if (response.success) {
                updateMonthStatisticsUI(response.data);
            }
        } catch (error) {
            console.error("Error loading month statistics:", error);
        }
    }

    function updateMonthStatisticsUI(stats) {
        const { total_attended, total_leave, attendance_rate } = stats;
        
        monthRate.textContent = `${attendance_rate}%`;
        monthAttended.textContent = total_attended;
        monthLeave.textContent = total_leave;
        progressFill.style.width = `${Math.min(attendance_rate, 100)}%`;
    }

    // =====================================
    // LOAD ATTENDANCE TABLE
    // =====================================

    async function loadAttendance() {
        try {
            const response = await apiRequest("/api/staff/attendance/today");
            if (response.success) {
                attendanceData = response.data;
                filteredData = [...attendanceData];
                renderAttendanceTable();
            }
        } catch (error) {
            console.error("Error loading attendance:", error);
        }
    }

    function renderAttendanceTable() {
        if (filteredData.length === 0) {
            attendanceTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--text-light);">
                        <i class="bi bi-inbox" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
                        <p>Belum ada staff yang dijadwalkan hari ini.</p>
                    </td>
                </tr>
            `;
            return;
        }

        attendanceTable.innerHTML = filteredData.map(record => `
            <tr>
                <td>
                    <div class="staff-info">
                        <img src="{{ url_for('static', filename='images/profile.png') }}" alt="Profile">
                        <div>
                            <h4>${escapeHtml(record.full_name)}</h4>
                            <span>${escapeHtml(record.position)}</span>
                        </div>
                    </div>
                </td>
                <td>${formatTime(record.clock_in)}</td>
                <td><span class="shift-badge">${escapeHtml(record.shift_name)}</span></td>
                <td>
                    <span class="badge ${getStatusBadgeClass(record.status)}">
                        ${getStatusLabel(record.status)}
                    </span>
                </td>
                <td>${record.work_minutes > 0 ? Math.floor(record.work_minutes / 60) + 'h ' + (record.work_minutes % 60) + 'm' : '00h 00m'}</td>
                <td style="display: flex; gap: 8px; justify-content: center;">
                    <button class="edit-btn" type="button" data-id="${record.id}" style="background: #5A3718; color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: background 0.3s ease;">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="delete-btn" type="button" data-id="${record.id}" style="background: #E5484D; color: white; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: background 0.3s ease;">
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
    // SEARCH
    // =====================================

    function setupSearch() {
        if (searchInput) {
            searchInput.addEventListener("input", event => {
                const keyword = event.target.value.toLowerCase();
                filteredData = attendanceData.filter(record =>
                    record.full_name.toLowerCase().includes(keyword) ||
                    record.employee_code.toLowerCase().includes(keyword) ||
                    record.position.toLowerCase().includes(keyword)
                );
                renderAttendanceTable();
            });
        }
    }

    // =====================================
    // LOAD SHIFT DATA
    // =====================================

    async function loadShiftData() {
        try {
            const response = await apiRequest("/api/staff/shift");
            if (response.success && response.data.length > 0) {
                const today = new Date();
                const dayNames = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
                const dayName = dayNames[today.getDay()];
                
                shiftContainer.innerHTML = response.data.map(shift => `
                    <div class="shift-item">
                        <div class="shift-date">
                            <span>${dayName}</span>
                            <strong>${today.getDate()}</strong>
                        </div>
                        <div class="shift-detail">
                            <h4>${escapeHtml(shift.shift_name)}</h4>
                            <span>${shift.start_time} - ${shift.end_time}</span>
                        </div>
                        <i class="bi bi-chevron-right"></i>
                    </div>
                `).join("");
            } else {
                shiftContainer.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-light);">
                        <p>Tidak ada shift yang terdaftar</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error loading shifts:", error);
        }
    }

    // =====================================
    // LOAD LEAVE REQUESTS
    // =====================================

    async function loadLeaveRequests() {
        try {
            const response = await apiRequest("/api/staff/leave-request");
            if (response.success && response.data.length > 0) {
                const leaveTypeMap = {
                    "SICK": { icon: "file-earmark-medical", label: "Izin Sakit" },
                    "LEAVE": { icon: "calendar", label: "Cuti" },
                    "PERMISSION": { icon: "person", label: "Izin" }
                };

                approvalContainer.innerHTML = response.data.map(req => {
                    const typeInfo = leaveTypeMap[req.leave_type] || { icon: "file-earmark", label: req.leave_type };
                    const createdAt = new Date(req.created_at);
                    const timeDiff = Math.floor((new Date() - createdAt) / 60000);
                    let timeLabel = `${timeDiff} menit yang lalu`;
                    if (timeDiff >= 60) timeLabel = `${Math.floor(timeDiff / 60)} jam yang lalu`;
                    
                    return `
                        <div class="approval-item">
                            <div class="approval-left">
                                <div class="approval-icon ${req.leave_type === 'SICK' ? 'warning' : 'primary'}">
                                    <i class="bi bi-${typeInfo.icon}"></i>
                                </div>
                                <div>
                                    <h5>${typeInfo.label} - ${escapeHtml(req.staff_name)}</h5>
                                    <span>${timeLabel}</span>
                                </div>
                            </div>
                            <button class="review-btn" data-id="${req.id}">
                                Review
                            </button>
                        </div>
                    `;
                }).join("");

                approvalContainer.querySelectorAll(".review-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const requestId = btn.dataset.id;
                        showLeaveReviewModal(requestId, response.data.find(r => r.id == requestId));
                    });
                });
            } else {
                approvalContainer.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-light);">
                        <p>Tidak ada permohonan menunggu persetujuan</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error loading leave requests:", error);
        }
    }

    // =====================================
    // LEAVE REVIEW MODAL
    // =====================================

    function showLeaveReviewModal(requestId, leaveReq) {
        const modal = document.createElement("div");
        modal.className = "menu-modal-backdrop";
        
        const leaveTypeMap = {
            "SICK": "Izin Sakit",
            "LEAVE": "Cuti",
            "PERMISSION": "Izin"
        };

        modal.innerHTML = `
            <div class="menu-modal" role="dialog" aria-modal="true">
                <div class="menu-modal-header">
                    <h2>Detail Permohonan</h2>
                    <button class="modal-close" type="button" aria-label="Tutup">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="menu-form" style="gap: 12px;">
                    <div>
                        <label><strong>Nama Staff</strong></label>
                        <p style="margin: 0; color: var(--text-light);">${escapeHtml(leaveReq.staff_name)}</p>
                    </div>
                    <div>
                        <label><strong>Jenis Pengajuan</strong></label>
                        <p style="margin: 0; color: var(--text-light);">${leaveTypeMap[leaveReq.leave_type] || leaveReq.leave_type}</p>
                    </div>
                    <div>
                        <label><strong>Tanggal Mulai</strong></label>
                        <p style="margin: 0; color: var(--text-light);">${formatDate(leaveReq.start_date)}</p>
                    </div>
                    <div>
                        <label><strong>Tanggal Selesai</strong></label>
                        <p style="margin: 0; color: var(--text-light);">${formatDate(leaveReq.end_date)}</p>
                    </div>
                    <div>
                        <label><strong>Alasan</strong></label>
                        <p style="margin: 0; color: var(--text-light);">${escapeHtml(leaveReq.reason || '-')}</p>
                    </div>
                    ${leaveReq.document_url ? `
                    <div>
                        <label><strong>Lampiran</strong></label>
                        <a href="${leaveReq.document_url}" target="_blank" class="btn-link" style="color: var(--primary); text-decoration: none;">
                            <i class="bi bi-download"></i> Unduh Dokumen
                        </a>
                    </div>
                    ` : ''}
                    <div class="menu-form-actions" style="margin-top: 12px;">
                        <button type="button" class="cancel-btn" id="btn-reject-leave">Tolak</button>
                        <button type="button" class="save-btn" id="btn-approve-leave">Setujui</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        modal.querySelector(".modal-close").addEventListener("click", close);
        modal.querySelector(".cancel-btn").addEventListener("click", close);
        
        modal.addEventListener("click", event => {
            if (event.target === modal) close();
        });

        document.getElementById("btn-approve-leave").addEventListener("click", async () => {
            try {
                await apiRequest(`/api/staff/leave-request/${requestId}/approve`, { method: "PATCH" });
                showToast("Permohonan disetujui");
                close();
                await loadLeaveRequests();
                await loadAttendance();
            } catch (error) {
                console.error("Error approving leave:", error);
            }
        });

        document.getElementById("btn-reject-leave").addEventListener("click", async () => {
            try {
                await apiRequest(`/api/staff/leave-request/${requestId}/reject`, { method: "PATCH" });
                showToast("Permohonan ditolak");
                close();
                await loadLeaveRequests();
            } catch (error) {
                console.error("Error rejecting leave:", error);
            }
        });
    }

    // =====================================
    // TODAY'S DATE
    // =====================================

    function updateTodayDate() {
        todayDateEl.textContent = formatDate(new Date().toISOString().split('T')[0]);
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
                console.error("Error logging out:", error);
            }
            window.location.href = "/";
        });
    }

    // =====================================
    // INITIALIZE
    // =====================================

    async function init() {
        updateTodayDate();
        await initUser();
        await loadStatistics();
        await loadMonthStatistics();
        await loadAttendance();
        await loadShiftData();
        await loadLeaveRequests();
        setupSearch();
    }

    init();

    // Refresh data every 30 seconds
    setInterval(async () => {
        await loadStatistics();
        await loadMonthStatistics();
        await loadAttendance();
    }, 30000);

});