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
    const attendanceTitleEl = document.getElementById("attendanceTitle");
    const todayDateEl = document.getElementById("today-date");
    const attendanceDateInput = document.getElementById("attendanceDateInput");
    const searchInput = document.querySelector(".attendance-search input");
    const attendanceTable = document.querySelector(".attendance-table tbody");
    const logoutBtn = document.querySelector(".logout");
    const importStaffBtn = document.getElementById("btn-import-staff");
    const staffImportModal = document.getElementById("staffImportModal");
    const closeImportModal = document.getElementById("closeImportModal");
    const cancelImport = document.getElementById("cancelImport");
    const staffExcelInput = document.getElementById("staffExcelInput");
    const selectedExcelName = document.getElementById("selectedExcelName");
    const submitImport = document.getElementById("submitImport");
    const importResultModal = document.getElementById("importResultModal");
    const closeImportResult = document.getElementById("closeImportResult");
    const closeImportResultButton = document.getElementById("closeImportResultButton");
    const resultTotal = document.getElementById("resultTotal");
    const resultImported = document.getElementById("resultImported");
    const resultSkipped = document.getElementById("resultSkipped");
    const resultFailed = document.getElementById("resultFailed");
    const importErrorSection = document.getElementById("importErrorSection");
    const importErrorList = document.getElementById("importErrorList");
    const viewAllStaff = document.getElementById("view-all-staff");
    const allStaffModal = document.getElementById("allStaffModal");
    const closeAllStaffModal = document.getElementById("closeAllStaffModal");
    const allStaffSearch = document.getElementById("allStaffSearch");
    const allStaffList = document.getElementById("allStaffList");
    const scheduleButtons = [
        document.getElementById("btn-top-schedule"),
        document.getElementById("btn-new-schedule")
    ].filter(Boolean);
    const scheduleModal = document.getElementById("scheduleModal");
    const scheduleModalTitle = document.getElementById("scheduleModalTitle");
    const closeScheduleModal = document.getElementById("closeScheduleModal");
    const cancelSchedule = document.getElementById("cancelSchedule");
    const saveSchedule = document.getElementById("saveSchedule");
    const scheduleStaffSelect = document.getElementById("scheduleStaffSelect");
    const scheduleShiftSelect = document.getElementById("scheduleShiftSelect");
    const scheduleRangeSelect = document.getElementById("scheduleRangeSelect");
    const scheduleRangeLabel = document.getElementById("scheduleRangeLabel");
    const scheduleEndDateInput = document.getElementById("scheduleEndDateInput");
    const scheduleRangeHelp = document.getElementById("scheduleRangeHelp");
    const scheduleDateInput = document.getElementById("scheduleDateInput");
    const shiftModal = document.getElementById("shiftModal");
    const shiftModalTitle = document.getElementById("shiftModalTitle");
    const closeShiftModal = document.getElementById("closeShiftModal");
    const cancelShift = document.getElementById("cancelShift");
    const saveShift = document.getElementById("saveShift");
    const shiftNameInput = document.getElementById("shiftNameInput");
    const shiftStartInput = document.getElementById("shiftStartInput");
    const shiftEndInput = document.getElementById("shiftEndInput");
    const shiftToleranceInput = document.getElementById("shiftToleranceInput");
    const leaveModal = document.getElementById("leaveModal");
    const closeLeaveModal = document.getElementById("closeLeaveModal");
    const cancelLeave = document.getElementById("cancelLeave");
    const saveLeave = document.getElementById("saveLeave");
    const leaveStaffId = document.getElementById("leaveStaffId");
    const leaveStaffName = document.getElementById("leaveStaffName");
    const leaveTypeSelect = document.getElementById("leaveTypeSelect");
    const leaveStartDateInput = document.getElementById("leaveStartDateInput");
    const leaveEndDateInput = document.getElementById("leaveEndDateInput");
    const leaveReasonInput = document.getElementById("leaveReasonInput");
    const leaveAutoApprove = document.getElementById("leaveAutoApprove");
    
    // Statistics
    const statPresent = document.getElementById("stat-present");
    const statRate = document.getElementById("stat-rate");
    const statLate = document.getElementById("stat-late");
    const statAvgLate = document.getElementById("stat-avg-late");
    const statLeave = document.getElementById("stat-leave");
    const statApproval = document.getElementById("stat-approval");
    
    // Month summary
    const monthRate = document.getElementById("month-rate");
    const monthAttended = document.getElementById("month-attended");
    const monthLeave = document.getElementById("month-leave");
    const progressFill = document.getElementById("progress-fill");
    
    // Containers
    const shiftContainer = document.getElementById("shift-container");
    const approvalContainer = document.getElementById("approval-container");



    // ===============================
    // NOTIFICATION ELEMENT
    // ===============================

    const notificationBtn =
        document.getElementById("notificationBtn");


    const notificationMenu =
        document.getElementById("notificationMenu");


    const notificationBadge =
        document.getElementById("notificationBadge");


    const notificationSubtitle =
        document.getElementById("notificationSubtitle");


    const notificationList =
        document.getElementById("notificationList");


    const viewAllNotification =
        document.getElementById("viewAllNotification");



    // MODAL LIHAT SEMUA NOTIFIKASI

    const stockNotificationModal =
        document.getElementById("stockNotificationModal");


    const allNotificationList =
        document.getElementById("allNotificationList");


    const allNotificationTotal =
        document.getElementById("allNotificationTotal");


    const closeStockNotification =
        document.getElementById("closeStockNotification");


    const closeStockNotificationBtn =
        document.getElementById("closeStockNotificationBtn");

    // =====================================
    // STATE
    // =====================================

    let attendanceData = [];
    let filteredData = [];
    let selectedImportFile = null;
    let allStaffData = [];
    let shiftData = [];
    let selectedScheduleId = null;
    let selectedShiftId = null;
    let selectedAttendanceDate = "";

    // =====================================
    // UTILITIES
    // =====================================

    function escapeHtml(value) {
        return String(value ?? "")
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
                headers: options.body instanceof FormData
                    ? { ...options.headers }
                    : {
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

    function getTodayInputValue() {
        const today = new Date();
        return formatDateInput(today);
    }

    function formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function parseDateInput(value) {
        const [year, month, day] = String(value || "").split("-").map(Number);
        if (!year || !month || !day) return new Date();
        return new Date(year, month - 1, day);
    }

    function addDays(date, days) {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    }

    function addMonths(date, months) {
        const next = new Date(date);
        const day = next.getDate();
        next.setMonth(next.getMonth() + months);
        if (next.getDate() < day) {
            next.setDate(0);
        }
        return next;
    }

    function getTomorrowInputValue() {
        return formatDateInput(addDays(new Date(), 1));
    }

    function isTodayValue(value) {
        return value === getTodayInputValue();
    }

    function updateAttendanceDateLabel() {
        const selectedDate = selectedAttendanceDate || getTodayInputValue();
        if (attendanceTitleEl) {
            attendanceTitleEl.textContent = isTodayValue(selectedDate)
                ? "Daftar Kehadiran Hari Ini"
                : "Daftar Jadwal Karyawan";
        }
        if (todayDateEl) {
            todayDateEl.textContent = formatDate(selectedDate);
        }
        if (attendanceDateInput && attendanceDateInput.value !== selectedDate) {
            attendanceDateInput.value = selectedDate;
        }
    }

    function toTimeInputValue(value) {
        return String(value || "").slice(0, 5);
    }

    function findAttendanceRecord(scheduleId) {
        return attendanceData.find(record => String(record.schedule_id) === String(scheduleId));
    }

    function updateScheduleRangeByPreset() {
        if (!scheduleRangeSelect || !scheduleDateInput || !scheduleEndDateInput) return;

        const preset = scheduleRangeSelect.value;
        const baseValue = scheduleDateInput.value || getTodayInputValue();
        let startDate = parseDateInput(baseValue);
        let endDate = new Date(startDate);

        if (preset === "tomorrow") {
            startDate = parseDateInput(getTomorrowInputValue());
            endDate = new Date(startDate);
        } else if (preset === "week") {
            endDate = addDays(startDate, 6);
        } else if (preset === "month") {
            endDate = addDays(addMonths(startDate, 1), -1);
        } else if (preset === "year") {
            endDate = addDays(startDate, 365);
        } else if (preset === "custom") {
            const currentEnd = scheduleEndDateInput.value
                ? parseDateInput(scheduleEndDateInput.value)
                : startDate;
            endDate = currentEnd < startDate ? startDate : currentEnd;
        }

        scheduleDateInput.value = formatDateInput(startDate);
        scheduleEndDateInput.value = formatDateInput(endDate);

        const totalDays = Math.round((endDate - startDate) / 86400000) + 1;
        if (scheduleRangeHelp) {
            scheduleRangeHelp.textContent = totalDays > 1
                ? `Akan membuat jadwal harian selama ${totalDays} hari. Tanggal yang sudah punya jadwal akan dilewati.`
                : "Akan membuat jadwal untuk 1 tanggal.";
        }
    }

    function setScheduleRangeVisibility(isEditing) {
        [scheduleRangeLabel, scheduleRangeHelp, scheduleEndDateInput?.closest("label")].forEach(element => {
            if (!element) return;
            element.style.display = isEditing ? "none" : "";
        });
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
                if (fullnameEl) fullnameEl.textContent = response.user.fullname || "User";
                if (roleEl) roleEl.textContent = response.user.role || "Role";
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
        const { total_scheduled, total_staff, present_count, attendance_rate, late_count, avg_late_minutes, leave_count } = stats;
        const staffTotal = Number.isFinite(Number(total_staff))
            ? Number(total_staff)
            : Number(total_scheduled || 0);
        
        statPresent.textContent = `${present_count} / ${staffTotal}`;
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

    async function loadAttendance(dateValue = selectedAttendanceDate || getTodayInputValue()) {
        try {
            selectedAttendanceDate = dateValue;
            updateAttendanceDateLabel();
            const response = await apiRequest(`/api/staff/attendance?date=${encodeURIComponent(selectedAttendanceDate)}`);
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
                    <td colspan="7" 
                    style="text-align:center; padding:40px;">
                        Belum ada data kehadiran.
                    </td>
                </tr>
            `;

            return;
        }


        attendanceTable.innerHTML = filteredData.map(record => {

            return `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(record.full_name)}
                    </strong>
                </td>


                <td>
                    ${formatTime(record.clock_in)}
                </td>


                <td>
                    ${formatTime(record.clock_out)}
                </td>


                <td>
                    <span class="shift-badge">
                        ${escapeHtml(record.shift_name)}
                    </span>
                </td>


                <td>

                    <span class="badge ${getStatusBadgeClass(record.status)}">

                        ${getStatusLabel(record.status)}

                    </span>

                </td>


                <td>

                    ${
                        record.work_minutes > 0 
                        ?
                        Math.floor(record.work_minutes / 60)
                        + "h " +
                        (record.work_minutes % 60)
                        + "m"

                        :

                        "00h 00m"
                    }

                </td>


                <td>

                    <div class="attendance-row-actions">


                        <button 
                        class="edit-btn schedule-edit-btn"
                        type="button"
                        data-schedule-id="${record.schedule_id}">

                            <i class="bi bi-pencil-square"></i>
                            Edit 

                        </button>


                        <button 
                        class="delete-btn schedule-delete-btn"
                        type="button"
                        data-schedule-id="${record.schedule_id}">

                            <i class="bi bi-trash3"></i>
                            Hapus

                        </button>


                    </div>

                </td>


            </tr>
            `;


        }).join("");


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

    attendanceTable?.addEventListener("click", async event => {
        const editButton = event.target.closest(".schedule-edit-btn");
        const leaveButton = event.target.closest(".leave-btn");
        const deleteButton = event.target.closest(".schedule-delete-btn");

        if (editButton) {
            const record = findAttendanceRecord(editButton.dataset.scheduleId);
            if (record) {
                openScheduleModal(record).catch(error => console.error(error));
            }
            return;
        }

        if (leaveButton) {
            const record = findAttendanceRecord(leaveButton.dataset.scheduleId);
            if (record) {
                openLeaveModal(record);
            }
            return;
        }

        if (deleteButton) {
            const record = findAttendanceRecord(deleteButton.dataset.scheduleId);
            const name = record?.full_name || "karyawan ini";
            if (!confirm(`Hapus jadwal ${name} hari ini?`)) return;

            deleteButton.disabled = true;
            try {
                const response = await apiRequest(`/api/staff/schedule/${deleteButton.dataset.scheduleId}`, {
                    method: "DELETE"
                });
                showToast(response.message || "Jadwal berhasil dihapus");
                await loadStatistics();
                await loadMonthStatistics();
                await loadAttendance();
            } finally {
                deleteButton.disabled = false;
            }
            return;
        } 
    });

    // =====================================
    // LEAVE / SICK MODAL
    // =====================================

    function openLeaveModal(record) {
        leaveStaffId.value = record.id;
        leaveStaffName.textContent = `${record.full_name} - ${record.shift_name}`;
        leaveTypeSelect.value = "PERMISSION";
        leaveStartDateInput.value = record.schedule_date || selectedAttendanceDate || getTodayInputValue();
        leaveEndDateInput.value = record.schedule_date || selectedAttendanceDate || getTodayInputValue();
        leaveReasonInput.value = "";
        leaveAutoApprove.checked = true;
        leaveModal?.classList.remove("hidden");
        leaveTypeSelect?.focus();
    }

    function closeLeave() {
        leaveModal?.classList.add("hidden");
        if (leaveStaffId) leaveStaffId.value = "";
        if (leaveStaffName) leaveStaffName.textContent = "-";
        if (leaveReasonInput) leaveReasonInput.value = "";
        if (leaveAutoApprove) leaveAutoApprove.checked = true;
    }

    async function saveLeaveData() {
        if (!leaveStaffId.value || !leaveTypeSelect.value || !leaveStartDateInput.value || !leaveEndDateInput.value) {
            showToast("Staff, jenis izin, dan tanggal wajib diisi", "error");
            return;
        }

        if (parseDateInput(leaveEndDateInput.value) < parseDateInput(leaveStartDateInput.value)) {
            showToast("Tanggal selesai tidak boleh sebelum tanggal mulai", "error");
            return;
        }

        saveLeave.disabled = true;
        try {
            const response = await apiRequest("/api/staff/leave-request", {
                method: "POST",
                body: JSON.stringify({
                    staff_id: Number(leaveStaffId.value),
                    leave_type: leaveTypeSelect.value,
                    start_date: leaveStartDateInput.value,
                    end_date: leaveEndDateInput.value,
                    reason: leaveReasonInput.value.trim(),
                    auto_approve: leaveAutoApprove.checked
                })
            });

            selectedAttendanceDate = leaveStartDateInput.value;
            if (attendanceDateInput) {
                attendanceDateInput.value = selectedAttendanceDate;
            }
            showToast(response.message || "Izin/Sakit berhasil disimpan");
            closeLeave();
            await loadStatistics();
            await loadMonthStatistics();
            await loadAttendance(selectedAttendanceDate);
            //await loadLeaveRequests()
        } finally {
            saveLeave.disabled = false;
        }
    }

    // =====================================
    // LOAD SHIFT DATA
    // =====================================

    async function loadShiftData() {
        try {
            const response = await apiRequest("/api/staff/shift");
            if (response.success && response.data.length > 0) {
                shiftData = response.data || [];
                const today = new Date();
                const dayNames = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
                const dayName = dayNames[today.getDay()];
                
                shiftContainer.innerHTML = `
                    <div class="shift-table">
                        <div class="shift-table-head">
                            <span>Shift</span>
                            <span>Jam</span>
                            <span>Toleransi</span>
                            <span>Aksi</span>
                        </div>
                        ${shiftData.map(shift => `
                            <div class="shift-table-row">
                                <div class="shift-name-cell">
                                    <span class="shift-day-pill">${dayName} ${today.getDate()}</span>
                                    <strong>${escapeHtml(shift.shift_name)}</strong>
                                </div>
                                <span>${shift.start_time} - ${shift.end_time}</span>
                                <span>${escapeHtml(shift.tolerance_minutes)} menit</span>
                                <div class="shift-action">
                                    <button class="edit-btn shift-edit-btn" type="button" data-shift-id="${shift.id}">
                                        <i class="bi bi-pencil-square"></i> Edit
                                    </button>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                `;
            } else {
                shiftData = [];
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
                if (statApproval) {
                    statApproval.textContent = `${response.data.length} perlu approval`;
                }
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
                if (statApproval) {
                    statApproval.textContent = "Tidak ada approval";
                }
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
                //await loadLeaveRequests();
                await loadStatistics();
                await loadMonthStatistics();
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
                //await loadLeaveRequests();
                await loadStatistics();
            } catch (error) {
                console.error("Error rejecting leave:", error);
            }
        });
    }

    // =====================================
    // STAFF LIST MODAL
    // =====================================

    async function loadAllStaff(includeInactive = true) {
        const suffix = includeInactive ? "?include_inactive=1" : "";
        const response = await apiRequest(`/api/staff${suffix}`);
        allStaffData = response.data || [];
        return allStaffData;
    }

    function renderAllStaffList() {
        const keyword = (allStaffSearch?.value || "").toLowerCase().trim();
        const data = allStaffData.filter(staff =>
            !keyword ||
            staff.employee_code.toLowerCase().includes(keyword) ||
            staff.full_name.toLowerCase().includes(keyword) ||
            staff.department.toLowerCase().includes(keyword) ||
            staff.position.toLowerCase().includes(keyword)
        );

        if (!data.length) {
            allStaffList.innerHTML = `
                <div style="padding: 28px; text-align: center; color: var(--text-light);">
                    Belum ada Staff yang terdaftar.
                </div>
            `;
            return;
        }

        allStaffList.innerHTML = data.map(staff => `
            <div class="staff-list-row">
                <strong>${escapeHtml(staff.employee_code)}</strong>
                <div>
                    <strong>${escapeHtml(staff.full_name)}</strong>
                    <span style="display:block;">${escapeHtml(staff.email || "-")}</span>
                </div>
                <span>${escapeHtml(staff.department)}</span>
                <span>${escapeHtml(staff.position)}</span>
                <span class="staff-status-pill ${staff.status === "ACTIVE" ? "active" : "inactive"}">
                    ${escapeHtml(staff.status)}
                </span>
            </div>
        `).join("");
    }

    async function openAllStaffModal() {
        await loadAllStaff(true);
        renderAllStaffList();
        allStaffModal.classList.remove("hidden");
        allStaffSearch?.focus();
    }

    function closeAllStaff() {
        allStaffModal?.classList.add("hidden");
    }

    // =====================================
    // SCHEDULE MODAL
    // =====================================

    async function openScheduleModal(record = null) {
        selectedScheduleId = record?.schedule_id ? Number(record.schedule_id) : null;

        const [staffResponse, shiftResponse] = await Promise.all([
            apiRequest("/api/staff"),
            apiRequest("/api/staff/shift")
        ]);

        const activeStaff = staffResponse.data || [];
        const shifts = shiftResponse.data || [];

        const allStaffOption = !selectedScheduleId && activeStaff.length
            ? `<option value="all">Semua Karyawan Aktif</option>`
            : "";

        scheduleStaffSelect.innerHTML = activeStaff.length
            ? allStaffOption + activeStaff.map(staff => `
                <option value="${staff.id}">
                    ${escapeHtml(staff.employee_code)} - ${escapeHtml(staff.full_name)}
                </option>
            `).join("")
            : `<option value="">Belum ada Staff ACTIVE</option>`;

        scheduleShiftSelect.innerHTML = shifts.length
            ? shifts.map(shift => `
                <option value="${shift.id}">
                    ${escapeHtml(shift.shift_name)} (${escapeHtml(shift.start_time)} - ${escapeHtml(shift.end_time)})
                </option>
            `).join("")
            : `<option value="">Belum ada Shift</option>`;

        if (scheduleModalTitle) {
            scheduleModalTitle.textContent = selectedScheduleId ? "Edit Penjadwalan" : "Tambah Penjadwalan";
        }
        if (saveSchedule) {
            saveSchedule.textContent = selectedScheduleId ? "Simpan Perubahan" : "Simpan Jadwal";
        }

        scheduleStaffSelect.value = record?.id
            ? String(record.id)
            : (activeStaff.length ? "all" : "");
        scheduleShiftSelect.value = record?.shift_id ? String(record.shift_id) : (shifts[0]?.id ? String(shifts[0].id) : "");
        scheduleDateInput.value = record?.schedule_date || getTomorrowInputValue();
        if (scheduleEndDateInput) {
            scheduleEndDateInput.value = record?.schedule_date || getTomorrowInputValue();
        }
        if (scheduleRangeSelect) {
            scheduleRangeSelect.value = selectedScheduleId ? "single" : "tomorrow";
        }
        setScheduleRangeVisibility(Boolean(selectedScheduleId));
        updateScheduleRangeByPreset();
        scheduleModal.classList.remove("hidden");
    }

    function closeSchedule() {
        scheduleModal?.classList.add("hidden");
        selectedScheduleId = null;
        if (scheduleModalTitle) {
            scheduleModalTitle.textContent = "Tambah Penjadwalan";
        }
        if (saveSchedule) {
            saveSchedule.textContent = "Simpan Jadwal";
        }
        setScheduleRangeVisibility(false);
    }

    async function saveScheduleData() {
        if (!scheduleStaffSelect.value || !scheduleShiftSelect.value || !scheduleDateInput.value || (!selectedScheduleId && !scheduleEndDateInput.value)) {
            showToast("Staff, Shift, dan tanggal jadwal wajib diisi", "error");
            return;
        }

        if (!selectedScheduleId && parseDateInput(scheduleEndDateInput.value) < parseDateInput(scheduleDateInput.value)) {
            showToast("Tanggal selesai tidak boleh sebelum tanggal mulai", "error");
            return;
        }

        saveSchedule.disabled = true;
        try {
            const endpoint = selectedScheduleId
                ? `/api/staff/schedule/${selectedScheduleId}`
                : "/api/staff/schedule";
            const method = selectedScheduleId ? "PATCH" : "POST";

            const staffValue = scheduleStaffSelect.value === "all"
                ? "all"
                : Number(scheduleStaffSelect.value);

            const payload = {
                staff_id: staffValue,
                shift_id: Number(scheduleShiftSelect.value),
                schedule_date: scheduleDateInput.value
            };
            if (!selectedScheduleId) {
                payload.end_date = scheduleEndDateInput.value;
            }

            const response = await apiRequest(endpoint, {
                method,
                body: JSON.stringify(payload)
            });
            showToast(response.message || (selectedScheduleId ? "Jadwal berhasil diperbarui" : "Jadwal berhasil ditambahkan"));
            selectedAttendanceDate = scheduleDateInput.value;
            if (attendanceDateInput) {
                attendanceDateInput.value = selectedAttendanceDate;
            }
            closeSchedule();
            await loadStatistics();
            await loadMonthStatistics();
            await loadAttendance(selectedAttendanceDate);
            await loadShiftData();
        } finally {
            saveSchedule.disabled = false;
        }
    }

    // =====================================
    // SHIFT EDIT MODAL
    // =====================================

   function openShiftModal(shiftId = null) {

        const shift = shiftData.find(
            item => String(item.id) === String(shiftId)
        );


    if (shift) {

        selectedShiftId = Number(shift.id);

        if (shiftModalTitle) {
                shiftModalTitle.textContent = "Edit Shift";
            }

            shiftNameInput.value = shift.shift_name || "";
            shiftStartInput.value = toTimeInputValue(shift.start_time);
            shiftEndInput.value = toTimeInputValue(shift.end_time);
            shiftToleranceInput.value = shift.tolerance_minutes ?? 0;

        } else {

            selectedShiftId = null;

            if (shiftModalTitle) {
                shiftModalTitle.textContent = "Tambah Shift Baru";
            }

            shiftNameInput.value = "";
            shiftStartInput.value = "";
            shiftEndInput.value = "";
            shiftToleranceInput.value = "10";

        }


        shiftModal?.classList.remove("hidden");
        shiftNameInput?.focus();

    }

    function closeShift() {
        shiftModal?.classList.add("hidden");
        selectedShiftId = null;
        if (shiftNameInput) shiftNameInput.value = "";
        if (shiftStartInput) shiftStartInput.value = "";
        if (shiftEndInput) shiftEndInput.value = "";
        if (shiftToleranceInput) shiftToleranceInput.value = "";
    }

    async function saveShiftData() {


        if (!shiftNameInput.value.trim() 
            || !shiftStartInput.value 
            || !shiftEndInput.value) {


            showToast(
                "Nama shift, jam mulai, dan jam selesai wajib diisi",
                "error"
            );


            return;

        }


        saveShift.disabled = true;


        try {


            const response = await apiRequest(

                selectedShiftId
                    ? `/api/staff/shift/${selectedShiftId}`
                    : "/api/staff/shift",

                {

                    method: selectedShiftId ? "PATCH" : "POST",


                    body: JSON.stringify({

                        shift_name: shiftNameInput.value.trim(),

                        start_time: shiftStartInput.value,

                        end_time: shiftEndInput.value,

                        tolerance_minutes:
                        Number(shiftToleranceInput.value || 0)

                    })

                }

            );


            showToast(
                response.message ||
                (selectedShiftId
                    ? "Shift berhasil diperbarui"
                    : "Shift berhasil dibuat")
            );


            closeShift();


            await loadShiftData();

            await loadAttendance();

            await loadStatistics();


        } finally {


            saveShift.disabled = false;


        }

    }

    // =====================================
    // IMPORT EXCEL
    // =====================================

    function openImportModal() {
        selectedImportFile = null;
        staffExcelInput.value = "";
        selectedExcelName.textContent = "Belum ada file dipilih";
        submitImport.disabled = true;
        staffImportModal.classList.remove("hidden");
    }

    function closeImport() {
        staffImportModal?.classList.add("hidden");
    }

    function showImportResult(data) {
        resultTotal.textContent = data.total_rows || 0;
        resultImported.textContent = data.imported || 0;
        resultSkipped.textContent = data.skipped || 0;
        resultFailed.textContent = data.failed || 0;

        const errors = data.errors || [];
        if (errors.length) {
            importErrorSection.classList.remove("hidden");
            importErrorList.innerHTML = errors.map(error => `
                <div class="import-error-item">
                    <strong>Baris ${escapeHtml(error.row)}</strong>
                    ${error.employee_code ? ` - ${escapeHtml(error.employee_code)}` : ""}
                    <br>
                    ${escapeHtml(error.message)}
                </div>
            `).join("");
        } else {
            importErrorSection.classList.add("hidden");
            importErrorList.innerHTML = "";
        }

        importResultModal.classList.remove("hidden");
    }

    function closeImportResultModal() {
        importResultModal?.classList.add("hidden");
    }

    async function submitImportFile() {
        if (!selectedImportFile) {
            showToast("File Excel belum dipilih.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedImportFile);

        submitImport.disabled = true;
        submitImport.textContent = "Mengimport...";

        try {
            const response = await apiRequest("/api/staff/import-excel", {
                method: "POST",
                body: formData
            });
            closeImport();
            showToast(response.message || "Import data Staff selesai");
            showImportResult(response.data || {});
            await loadStatistics();
            await loadMonthStatistics();
            await loadAttendance();
            await loadShiftData();
            if (!allStaffModal.classList.contains("hidden")) {
                await loadAllStaff(true);
                renderAllStaffList();
            }
        } finally {
            submitImport.disabled = false;
            submitImport.textContent = "Import Data";
        }
    }

    // =====================================
    // TODAY'S DATE
    // =====================================

    function updateTodayDate() {
        selectedAttendanceDate = selectedAttendanceDate || getTodayInputValue();
        updateAttendanceDateLabel();
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

    importStaffBtn?.addEventListener("click", openImportModal);
    closeImportModal?.addEventListener("click", closeImport);
    cancelImport?.addEventListener("click", closeImport);

    staffExcelInput?.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) {
            selectedImportFile = null;
            selectedExcelName.textContent = "Belum ada file dipilih";
            submitImport.disabled = true;
            return;
        }

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            selectedImportFile = null;
            staffExcelInput.value = "";
            selectedExcelName.textContent = "Format file harus .xlsx.";
            submitImport.disabled = true;
            showToast("Format file harus .xlsx.", "error");
            return;
        }

        selectedImportFile = file;
        selectedExcelName.textContent = file.name;
        submitImport.disabled = false;
    });

    submitImport?.addEventListener("click", () => {
        submitImportFile().catch(error => console.error(error));
    });

    closeImportResult?.addEventListener("click", closeImportResultModal);
    closeImportResultButton?.addEventListener("click", closeImportResultModal);

    viewAllStaff?.addEventListener("click", event => {
        event.preventDefault();
        openAllStaffModal().catch(error => console.error(error));
    });

    closeAllStaffModal?.addEventListener("click", closeAllStaff);
    allStaffSearch?.addEventListener("input", renderAllStaffList);

    attendanceDateInput?.addEventListener("change", event => {
        const selectedDate = event.target.value || getTodayInputValue();
        loadAttendance(selectedDate).catch(error => console.error(error));
    });

    scheduleButtons.forEach(button => {
        button.addEventListener("click", () => {
            openScheduleModal().catch(error => console.error(error));
        });
    });

    closeScheduleModal?.addEventListener("click", closeSchedule);
    cancelSchedule?.addEventListener("click", closeSchedule);
    saveSchedule?.addEventListener("click", () => {
        saveScheduleData().catch(error => console.error(error));
    });
    scheduleRangeSelect?.addEventListener("change", updateScheduleRangeByPreset);
    scheduleDateInput?.addEventListener("change", updateScheduleRangeByPreset);
    scheduleEndDateInput?.addEventListener("change", () => {
        if (scheduleRangeSelect?.value === "custom") {
            updateScheduleRangeByPreset();
        }
    });

    closeShiftModal?.addEventListener("click", closeShift);

    cancelShift?.addEventListener("click", closeShift);


    // ===============================
    // SHIFT BUTTON ACTION
    // ===============================

    document.addEventListener("click", function(e) {


        // tombol + kecil Manajemen Shift
        const addBtn = e.target.closest("#btn-add-shift");

        if (addBtn) {

            openShiftModal(null);

        }



        // tombol edit shift
        const editBtn = e.target.closest(".shift-edit-btn");

        if (editBtn) {

            openShiftModal(
                editBtn.dataset.shiftId
            );

        }


    });

    saveShift?.addEventListener("click", () => {

        saveShiftData().catch(error => console.error(error));

    });

    closeLeaveModal?.addEventListener("click", closeLeave);
    cancelLeave?.addEventListener("click", closeLeave);
    saveLeave?.addEventListener("click", () => {
        saveLeaveData().catch(error => console.error(error));
    });

    [staffImportModal, importResultModal, allStaffModal].forEach(modal => {
        modal?.addEventListener("click", event => {
            if (event.target !== modal) return;
            modal.classList.add("hidden");
        });
    });

    scheduleModal?.addEventListener("click", event => {
        if (event.target === scheduleModal) {
            closeSchedule();
        }
    });

    shiftModal?.addEventListener("click", event => {
        if (event.target === shiftModal) {
            closeShift();
        }
    });

    leaveModal?.addEventListener("click", event => {
        if (event.target === leaveModal) {
            closeLeave();
        }
    });

    // =====================================
    // INITIALIZE
    // =====================================

    async function init() {

            selectedAttendanceDate = getTodayInputValue();

            if (attendanceDateInput) {

                attendanceDateInput.value = selectedAttendanceDate;

            }


            updateTodayDate();


            await initUser();


            await loadStatistics();


            await loadMonthStatistics();


            await loadAttendance(selectedAttendanceDate);


            await loadShiftData();


            //await loadLeaveRequests();


            setupSearch();


        }

        init();

    // ===============================
    // REVIEW APPROVAL MODAL
    // ===============================


    const reviewModal = document.getElementById("reviewModal");

    const closeReviewModal = document.getElementById("closeReviewModal");


    document.addEventListener("click", (e)=>{


        if(e.target.classList.contains("review-btn")){


            reviewModal.classList.remove("hidden");


            document.getElementById("reviewName").value =
            "Maya Putri";


            document.getElementById("reviewType").value =
            "Izin Sakit";


            document.getElementById("reviewReason").value =
            "Tidak masuk karena sakit";


        }


    });



    closeReviewModal?.addEventListener("click",()=>{

        reviewModal.classList.add("hidden");

    });

    // ===============================
    // STOCK NOTIFICATION ALERT
    // ===============================

    let stockAlerts = [];
    let stockIndex = 0;


    async function loadNotifications(){


        try{


            const response = await fetch("/api/dashboard", {

                method:"POST",

                credentials:"include",

                headers:{
                    "Content-Type":"application/json"
                },

                body: JSON.stringify({
                    filter:"today"
                })

            });



            const result =
                await response.json();



            stockAlerts =
                result.data.notifications || [];



            stockIndex = 0;



            renderStockAlert();



        }catch(error){


            console.log(error);


        }


    }



    function renderStockAlert(){


        const alertText =
        document.getElementById("stockAlertText");


        const badge =
        document.querySelector(".notification-badge");


        if(!alertText) return;



        if(stockAlerts.length === 0){


            alertText.textContent =
            "Semua stok aman";


            if(badge){
                badge.textContent = "0";
            }


            return;

        }



        const currentStock =
        stockAlerts[stockIndex];



        alertText.textContent =
            `Stok ${currentStock.product} menipis`;



        if(badge){

            badge.textContent =
            stockAlerts.length;

        }



        // pindah stok berikutnya
        stockIndex++;


        if(stockIndex === stockAlerts.length){

            stockIndex = 0;

        }


    }


    // pertama buka halaman
    loadNotifications();


    // ganti stok setiap 3 detik
    setInterval(()=>{

        renderStockAlert();

    },3000);


    // update database setiap 30 detik
    setInterval(()=>{

        loadNotifications();

    },30000);


    // ===============================
    // DROPDOWN NOTIFIKASI (3 DATA)
    // ===============================

    function r9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8(){


        const list =
        document.getElementById("notificationList");


        const total =
        document.getElementById("notificationSubtitle");


        if(!list) return;


        list.innerHTML = "";


        if(total){

            total.textContent =
            `${stockAlerts.length} Notifikasi Aktif`;

        }



        if(stockAlerts.length === 0){

            list.innerHTML = `
                <div class="notification-item">
                    Semua stok aman
                </div>
            `;

            return;

        }



        stockAlerts.slice(0,3).forEach(item=>{


            list.innerHTML += `

            <div class="notification-item">

                <div class="notif-icon">

                    <i class="bi bi-exclamation-triangle-fill"></i>

                </div>


                <div>

                    <strong>
                        Stok ${item.product} Menipis
                    </strong>


                    <p>
                        Sisa : ${item.stock}
                    </p>


                    <small>
                        Real-time
                    </small>


                </div>


            </div>

            `;


        });


    }




    // ===============================
    // KLIK BELL
    // ===============================

    document
    .getElementById("notificationBtn")
    .addEventListener("click",function(e){


        e.stopPropagation();


        r9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8();


        document
        .getElementById("notificationMenu")
        .classList.toggle("active");


    });




    // ===============================
    // TUTUP KLIK LUAR
    // ===============================

    document.addEventListener("click",()=>{


        document
        .getElementById("notificationMenu")
        .classList.remove("active");


    });



    document
    .getElementById("notificationMenu")
    .addEventListener("click",(e)=>{


        e.stopPropagation();


    });


    // ===============================
    // LIHAT SEMUA MODAL
    // ===============================

    document
    .getElementById("viewAllNotification")
    .addEventListener("click",function(e){


    e.stopPropagation();


    document
    .getElementById("notificationMenu")
    .classList.remove("active");


    openStockNotificationModal();


    });

    // ===============================
    // MODAL SEMUA NOTIFIKASI
    // ===============================

    function openStockNotificationModal(){


        const modal =
        document.getElementById("stockNotificationModal");


        const list =
        document.getElementById("allNotificationList");


        const total =
        document.getElementById("allNotificationTotal");


        if(!modal || !list) return;



        list.innerHTML = "";



        if(total){

            total.textContent =
            `${stockAlerts.length} Notifikasi`;

        }



        if(stockAlerts.length === 0){


            list.innerHTML = `

                <div class="notification-item">

                    Semua stok aman

                </div>

            `;


        }else{


            stockAlerts.forEach(item=>{


                list.innerHTML += `


                <div class="notification-item">


                    <div class="notif-icon">

                        <i class="bi bi-exclamation-triangle-fill"></i>

                    </div>


                    <div>


                        <strong>

                            Stok ${item.product} Menipis

                        </strong>



                        <p>

                            Sisa : ${item.stock}

                        </p>



                        <small>

                            Real-time

                        </small>


                    </div>


                </div>


                `;


            });


        }



        modal.classList.remove("hidden");


    }



    // ===============================
    // CLOSE MODAL NOTIFIKASI
    // ===============================

    document
    .getElementById("closeStockNotification")
    .addEventListener("click",()=>{


        document
        .getElementById("stockNotificationModal")
        .classList.add("hidden");


    });



    document
    .getElementById("closeStockNotificationBtn")
    .addEventListener("click",()=>{


        document
        .getElementById("stockNotificationModal")
        .classList.add("hidden");


    });

    // ===============================
    // CLICK BELL
    // ===============================

    notificationBtn.addEventListener(
        "click",
        function(event){

            event.stopPropagation();

            notificationMenu.classList.toggle(
                "active"
            );

        }
    );


    // ===============================
    // LIHAT SEMUA
    // ===============================

    viewAllNotification.addEventListener(
        "click",
        function(){

            notificationMenu.classList.remove(
                "active"
            );


            notificationModal.classList.remove(
                "hidden"
            );

        }
    );


    // ===============================
    // CLOSE MODAL
    // ===============================

    closeNotification.addEventListener(
        "click",
        function(){

            notificationModal.classList.add(
                "hidden"
            );

        }
    );


    closeNotificationBtn.addEventListener(
        "click",
        function(){

            notificationModal.classList.add(
                "hidden"
            );

        }
    );

});

