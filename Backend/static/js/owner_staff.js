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
    const viewAllStaff = document.getElementById("view-all-staff");
    const allStaffModal = document.getElementById("allStaffModal");
    const closeAllStaffModal = document.getElementById("closeAllStaffModal");
    const allStaffSearch = document.getElementById("allStaffSearch");
    const allStaffList = document.getElementById("allStaffList");
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
    const leaveDocumentInput = document.getElementById("leaveDocumentInput");
    const leaveDocumentName = document.getElementById("leaveDocumentName");
    const leaveDocumentsCard = document.getElementById("leaveDocumentsCard");
    const refreshLeaveDocuments = document.getElementById("refreshLeaveDocuments");
    const leaveDocumentSearch = document.getElementById("leaveDocumentSearch");
    const leaveDocumentStatus = document.getElementById("leaveDocumentStatus");
    const leaveDocumentsTable = document.getElementById("leaveDocumentsTable");
    
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

    const btnAddEmployee = document.getElementById("btnAddEmployee");

    const employeeModal = document.getElementById("employeeModal");

    const closeEmployeeModal =
    document.getElementById("closeEmployeeModal");

    const cancelEmployee =
    document.getElementById("cancelEmployee");

    const saveEmployee =
    document.getElementById("saveEmployee");


    // =====================================
    // STATE
    // =====================================

    let attendanceData = [];
    let filteredData = [];
    let allStaffData = [];
    let shiftData = [];
    let selectedScheduleId = null;
    let selectedShiftId = null;
    let selectedAttendanceDate = "";
    let currentUserRole = "";
    let leaveDocumentsData = [];
    let editingLeaveRequestId = null;
    let accountRoleOptions = [];
    let employeeData = [];
    let filteredEmployeeData = [];
    let employeeCurrentPage = 1;
    let editingUserId = null;
    const employeeRowsPerPage = 6;


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
                cache: "no-store",
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

    function calculateWorkMinutes(record) {
        const storedMinutes = Number(record?.work_minutes || 0);
        if (storedMinutes > 0) return storedMinutes;
        if (!record?.clock_in || !record?.clock_out) return 0;

        const start = new Date(record.clock_in);
        const end = new Date(record.clock_out);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

        return Math.max(Math.floor((end - start) / 60000), 0);
    }

    function formatWorkDuration(record) {
        const minutes = calculateWorkMinutes(record);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${String(hours).padStart(2, "0")}h ${String(remainingMinutes).padStart(2, "0")}m`;
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
            "PRESENT": "Hadir",
            "LATE": "Terlambat",
            "LEAVE": "Izin",
            "SICK": "Sakit",
            "ABSENT": "Tidak Hadir",
            "NOT_CHECKED_IN": "Belum Hadir",
            "COMPLETED": "Selesai"
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
                currentUserRole = String(response.user.role || "").toUpperCase();
            }
        } catch (error) {
            console.error("Error loading user:", error);
        }
    }

    function isFinanceRole() {
        return ["FINANCE", "TIM_FINANCE"].includes(currentUserRole);
    }

    function isOwnerRole() {
        return currentUserRole === "OWNER";
    }

    function roleDisplayName(item) {
        return item?.role_label || item?.role || "-";
    }

    function buildGroupedRoleOptions(options, includeAll = false) {
        const groups = new Map();
        options.forEach(role => {
            const group = role.group || "Operasional";
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push(role);
        });

        const html = [];
        if (includeAll) {
            html.push(`<option value="">Semua Role</option>`);
        }

        groups.forEach((roles, group) => {
            html.push(`<optgroup label="${escapeHtml(group)}">`);
            roles.forEach(role => {
                html.push(`<option value="${escapeHtml(role.code)}">${escapeHtml(role.label)}</option>`);
            });
            html.push(`</optgroup>`);
        });

        return html.join("");
    }

    async function loadAccountRoles() {
        try {
            const response = await apiRequest("/api/staff/roles");
            accountRoleOptions = response.data || [];

            const roleSelect = document.getElementById("employeeRole");
            const roleFilter = document.getElementById("employeeRoleFilter");

            if (roleSelect) {
                roleSelect.innerHTML = buildGroupedRoleOptions(accountRoleOptions, false);
            }
            if (roleFilter) {
                roleFilter.innerHTML = buildGroupedRoleOptions([
                    { code: "OWNER", label: "Owner & Agency Service", group: "Manajemen" },
                    ...accountRoleOptions
                ], true);
            }
        } catch (error) {
            console.error("Error loading account roles:", error);
        }
    }

    function setHidden(selector, hidden) {
        document.querySelectorAll(selector).forEach(element => {
            element.hidden = hidden;
        });
    }

    function applyRoleCapabilities() {
        const financeMode = isFinanceRole();
        const ownerMode = isOwnerRole();
        const managementMode = financeMode || ownerMode;

        document.body.dataset.staffMode = ownerMode
            ? "owner-management"
            : (financeMode ? "operational" : "readonly");

        document.querySelector(".staff-layout")?.classList.toggle("approval-only", false);

        setHidden(".statistics", !managementMode);
        setHidden(".attendance-card", !managementMode);
        setHidden(".summary-card", !managementMode);
        setHidden(".shift-card", !ownerMode);
        setHidden(".approval-card", !ownerMode);
        setHidden(".employee-card", !ownerMode);
        setHidden("#leaveDocumentsCard", !financeMode);
        setHidden("#btn-top-schedule", !managementMode);
        setHidden("#btn-add-shift", !ownerMode);

        if (financeMode && statApproval) {
            statApproval.textContent = "Menunggu approval Owner";
        }
    }

    // =====================================
    // LOAD STATISTICS
    // =====================================

    async function loadStatistics(dateValue = selectedAttendanceDate || getTodayInputValue()) {
        try {
            const response = await apiRequest(
                `/api/staff/statistics/today?date=${encodeURIComponent(dateValue)}`
            );
            if (response.success && dateValue === selectedAttendanceDate) {
                updateStatisticsUI(response.data);
            }
        } catch (error) {
            console.error("Error loading statistics:", error);
        }
    }

    function updateStatisticsUI(stats) {
        const { total_scheduled, present_count, attendance_rate, late_count, avg_late_minutes, leave_count } = stats;
        const scheduledTotal = Number(total_scheduled || 0);
        
        statPresent.textContent = `${present_count} / ${scheduledTotal}`;
        statRate.textContent = `${attendance_rate}% Attendance`;
        
        if (late_count === 0) {
            statLate.textContent = "0 Staff";
            statAvgLate.textContent = "Tidak ada keterlambatan";
            statAvgLate.classList.remove("danger");
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
            if (dateValue !== selectedAttendanceDate) return;
            if (response.success) {
                attendanceData = response.data;
                filteredData = [...attendanceData];
                renderAttendanceTable();
            }
            await loadStatistics(selectedAttendanceDate);
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
                        Belum ada Staff yang dijadwalkan hari ini.
                    </td>
                </tr>
            `;

            return;
        }


        attendanceTable.innerHTML = filteredData.map(record => {
            const lockedStatuses = ["LEAVE", "SICK", "ABSENT"];
            const canClockOut = isFinanceRole()
                && record.clock_in
                && !record.clock_out
                && !lockedStatuses.includes(record.status)
                && record.status !== "COMPLETED";
            const canManageSchedule = isFinanceRole() || isOwnerRole();
            const actionButtons = canManageSchedule ? `
                        <button 
                        class="edit-btn schedule-edit-btn action-icon"
                        type="button"
                        title="Edit jadwal"
                        aria-label="Edit jadwal ${escapeHtml(record.full_name)}"
                        data-schedule-id="${record.schedule_id}">

                            <i class="bi bi-pencil-square"></i>

                        </button>


                        ${isFinanceRole() && canClockOut ? `
                        <button 
                        class="secondary-button clock-out-btn action-icon"
                        type="button"
                        title="Clock out"
                        aria-label="Clock out ${escapeHtml(record.full_name)}"
                        data-schedule-id="${record.schedule_id}">

                            <i class="bi bi-box-arrow-right"></i>

                        </button>
                        ` : ""}


                        ${isFinanceRole() ? `
                        <button 
                        class="secondary-button leave-btn action-icon"
                        type="button"
                        title="Izin / sakit"
                        aria-label="Ajukan izin atau sakit untuk ${escapeHtml(record.full_name)}"
                        data-schedule-id="${record.schedule_id}">

                            <i class="bi bi-file-earmark-medical"></i>

                        </button>
                        ` : ""}


                        <button 
                        class="delete-btn schedule-delete-btn action-icon"
                        type="button"
                        title="Hapus jadwal"
                        aria-label="Hapus jadwal ${escapeHtml(record.full_name)}"
                        data-schedule-id="${record.schedule_id}">

                            <i class="bi bi-trash3"></i>

                        </button>
            ` : `<span class="readonly-action">Read-only</span>`;

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

                    ${formatWorkDuration(record)}

                </td>


                <td>

                    <div class="attendance-row-actions">
                        ${actionButtons}

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
        const clockOutButton = event.target.closest(".clock-out-btn");

        if (editButton) {
            const record = findAttendanceRecord(editButton.dataset.scheduleId);
            if (record) {
                openScheduleModal(record).catch(error => console.error(error));
            }
            return;
        }

        if (leaveButton) {
            if (!isFinanceRole()) return;
            const record = findAttendanceRecord(leaveButton.dataset.scheduleId);
            if (record) {
                openLeaveModal(record);
            }
            return;
        }

        if (clockOutButton) {
            if (!isFinanceRole()) return;
            clockOutButton.disabled = true;
            try {
                const response = await apiRequest(`/api/staff/attendance/${clockOutButton.dataset.scheduleId}/clock-out`, {
                    method: "PATCH"
                });
                showToast(response.message || "Clock out berhasil");
                await loadStatistics();
                await loadMonthStatistics();
                await loadAttendance(selectedAttendanceDate);
                await loadShiftData();
            } finally {
                clockOutButton.disabled = false;
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
        editingLeaveRequestId = null;
        leaveStaffId.value = record.id;
        leaveStaffName.textContent = `${record.full_name} - ${record.shift_name}`;
        leaveTypeSelect.value = "PERMISSION";
        leaveStartDateInput.value = record.schedule_date || selectedAttendanceDate || getTodayInputValue();
        leaveEndDateInput.value = record.schedule_date || selectedAttendanceDate || getTodayInputValue();
        leaveReasonInput.value = "";
        leaveAutoApprove.checked = false;
        resetLeaveDocumentInput();
        leaveModal?.classList.remove("hidden");
        leaveTypeSelect?.focus();
    }

    function openEditLeaveModal(requestItem) {
        editingLeaveRequestId = requestItem.id;
        leaveStaffId.value = requestItem.staff_id;
        leaveStaffName.textContent = requestItem.staff_name || "-";
        leaveTypeSelect.value = requestItem.leave_type || "PERMISSION";
        leaveStartDateInput.value = requestItem.start_date || getTodayInputValue();
        leaveEndDateInput.value = requestItem.end_date || requestItem.start_date || getTodayInputValue();
        leaveReasonInput.value = requestItem.reason || "";
        resetLeaveDocumentInput();
        if (leaveDocumentName) {
            leaveDocumentName.textContent = requestItem.document_url
                ? "Lampiran lama tetap dipakai"
                : "Pilih file surat";
        }
        leaveModal?.classList.remove("hidden");
        leaveTypeSelect?.focus();
    }

    function closeLeave() {
        leaveModal?.classList.add("hidden");
        editingLeaveRequestId = null;
        if (leaveStaffId) leaveStaffId.value = "";
        if (leaveStaffName) leaveStaffName.textContent = "-";
        if (leaveReasonInput) leaveReasonInput.value = "";
        if (leaveAutoApprove) leaveAutoApprove.checked = false;
        resetLeaveDocumentInput();
    }

    function resetLeaveDocumentInput() {
        if (leaveDocumentInput) leaveDocumentInput.value = "";
        if (leaveDocumentName) leaveDocumentName.textContent = "Pilih file surat";
    }

    function validateLeaveDocument(file) {
        if (!file) return true;

        const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"];
        const extension = file.name.split(".").pop().toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            showToast("Format surat izin harus PDF, gambar, DOC, atau DOCX.", "error");
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Ukuran surat izin maksimal 5 MB.", "error");
            return false;
        }

        return true;
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

        const documentFile = leaveDocumentInput?.files?.[0] || null;
        if (!validateLeaveDocument(documentFile)) return;

        const formData = new FormData();
        formData.append("staff_id", Number(leaveStaffId.value));
        formData.append("leave_type", leaveTypeSelect.value);
        formData.append("start_date", leaveStartDateInput.value);
        formData.append("end_date", leaveEndDateInput.value);
        formData.append("reason", leaveReasonInput.value.trim());
        formData.append("auto_approve", "false");
        if (documentFile) {
            formData.append("document", documentFile);
        }

        saveLeave.disabled = true;
        try {
            const url = editingLeaveRequestId
                ? `/api/staff/leave-request/${editingLeaveRequestId}`
                : "/api/staff/leave-request";
            const response = await apiRequest(url, {
                method: editingLeaveRequestId ? "PATCH" : "POST",
                body: formData
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
            if (isFinanceRole()) {
                await loadLeaveDocuments();
            }
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
                            <span>Terjadwal</span>
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
                                <span>${escapeHtml(shift.today_staff_count || 0)} Staff Hari Ini</span>
                                <div class="shift-action">
                                    ${isOwnerRole() ? `
                                    <button class="edit-btn shift-edit-btn" type="button" data-shift-id="${shift.id}">
                                        <i class="bi bi-pencil-square"></i> Edit
                                    </button>
                                    ` : `<span class="readonly-action">Read-only</span>`}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                `;
            } else {
                shiftData = [];
                shiftContainer.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-light);">
                        <p>Tidak ada shift yang terdaftar.</p>
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
                                <div class="approval-icon ${req.leave_type === 'SICK' ? 'sick' : 'leave'}">
                                    <i class="bi bi-${typeInfo.icon}"></i>
                                </div>
                                <div class="approval-info">
                                    <strong>${typeInfo.label} - ${escapeHtml(req.staff_name)}</strong>
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

    function getLeaveTypeLabel(type) {
        const leaveTypeMap = {
            "SICK": "Sakit",
            "LEAVE": "Cuti",
            "PERMISSION": "Izin"
        };
        return leaveTypeMap[type] || type || "-";
    }

    function getLeaveStatusLabel(status) {
        const statusMap = {
            "PENDING": "Menunggu",
            "APPROVED": "Disetujui",
            "REJECTED": "Ditolak"
        };
        return statusMap[status] || status || "-";
    }

    function renderLeaveDocuments() {
        if (!leaveDocumentsTable) return;

        const keyword = (leaveDocumentSearch?.value || "").toLowerCase().trim();
        const selectedStatus = leaveDocumentStatus?.value || "";
        const rows = leaveDocumentsData.filter(item => {
            const searchable = [
                item.staff_name,
                item.reason,
                getLeaveTypeLabel(item.leave_type),
                getLeaveStatusLabel(item.status)
            ].join(" ").toLowerCase();
            const matchKeyword = !keyword || searchable.includes(keyword);
            const matchStatus = !selectedStatus || item.status === selectedStatus;
            return matchKeyword && matchStatus;
        });

        if (!rows.length) {
            leaveDocumentsTable.innerHTML = `
                <tr>
                    <td colspan="7" class="table-loading">
                        Belum ada surat izin yang sesuai.
                    </td>
                </tr>
            `;
            return;
        }

        leaveDocumentsTable.innerHTML = rows.map(item => {
            const dateRange = item.start_date === item.end_date
                ? formatDate(item.start_date)
                : `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`;
            const attachment = item.document_url
                ? `<a class="leave-document-link" href="${escapeHtml(item.document_url)}" target="_blank" rel="noopener">
                        <i class="bi bi-paperclip"></i>
                        Lihat
                   </a>`
                : `<span class="leave-document-empty">Belum ada</span>`;
            const action = item.status === "PENDING"
                ? `<button class="leave-document-edit" type="button" data-id="${item.id}">
                        <i class="bi bi-pencil-square"></i>
                        Edit
                   </button>`
                : `<span class="readonly-action">-</span>`;

            return `
                <tr data-leave-id="${item.id}">
                    <td>
                        <strong>${escapeHtml(item.staff_name || "-")}</strong>
                        <span>${escapeHtml(item.created_at ? formatDate(String(item.created_at).slice(0, 10)) : "-")}</span>
                    </td>
                    <td>${escapeHtml(getLeaveTypeLabel(item.leave_type))}</td>
                    <td>${dateRange}</td>
                    <td>${escapeHtml(item.reason || "-")}</td>
                    <td>${attachment}</td>
                    <td>
                        <span class="leave-status ${String(item.status || "").toLowerCase()}">
                            ${escapeHtml(getLeaveStatusLabel(item.status))}
                        </span>
                    </td>
                    <td>${action}</td>
                </tr>
            `;
        }).join("");
    }

    async function loadLeaveDocuments() {
        if (!isFinanceRole() || !leaveDocumentsTable) return;

        leaveDocumentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading">
                    Memuat surat izin...
                </td>
            </tr>
        `;

        try {
            const response = await apiRequest("/api/staff/leave-request/manage");
            leaveDocumentsData = response.data || [];
            renderLeaveDocuments();
        } catch (error) {
            console.error("Error loading leave documents:", error);
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
                        <button type="button" class="delete-btn" id="btn-reject-leave">Tolak</button>
                        <button type="button" class="save-btn" id="btn-approve-leave">Setujui</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        modal.querySelector(".modal-close").addEventListener("click", close);
        
        modal.addEventListener("click", event => {
            if (event.target === modal) close();
        });

        document.getElementById("btn-approve-leave").addEventListener("click", async () => {
            try {
                await apiRequest(`/api/staff/leave-request/${requestId}/approve`, { method: "PATCH" });
                showToast("Permohonan disetujui");
                close();
                await loadLeaveRequests();
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
                await loadLeaveRequests();
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
        if (!isFinanceRole() && !isOwnerRole()) {
            showToast("Anda tidak memiliki akses untuk mengelola jadwal", "error");
            return;
        }

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
            scheduleModalTitle.textContent = selectedScheduleId ? "Edit Jadwal Staff" : "Tambah Jadwal Staff";
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
            scheduleModalTitle.textContent = "Tambah Jadwal Staff";
        }
        if (saveSchedule) {
            saveSchedule.textContent = "Simpan Jadwal";
        }
        setScheduleRangeVisibility(false);
    }

    async function saveScheduleData() {
        if (!isFinanceRole() && !isOwnerRole()) {
            showToast("Anda tidak memiliki akses untuk menyimpan jadwal", "error");
            return;
        }

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
                shiftModalTitle.textContent = "Tambah Shift";
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

        if (!isOwnerRole()) {
            showToast("Hanya owner yang dapat mengelola shift", "error");
            return;
        }

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

    document.addEventListener("click", event => {
        const scheduleButtonTarget = event.target.closest("#btn-top-schedule");
        if (!scheduleButtonTarget) return;

        event.preventDefault();
        event.stopPropagation();
        openScheduleModal().catch(error => console.error(error));
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
            if (!isOwnerRole()) return;

            openShiftModal(null);

        }



        // tombol edit shift
        const editBtn = e.target.closest(".shift-edit-btn");

        if (editBtn) {
            if (!isOwnerRole()) return;

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
    leaveDocumentInput?.addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (!file) {
            resetLeaveDocumentInput();
            return;
        }

        if (!validateLeaveDocument(file)) {
            resetLeaveDocumentInput();
            return;
        }

        if (leaveDocumentName) {
            leaveDocumentName.textContent = file.name;
        }
    });
    refreshLeaveDocuments?.addEventListener("click", () => {
        loadLeaveDocuments().catch(error => console.error(error));
    });
    leaveDocumentSearch?.addEventListener("input", renderLeaveDocuments);
    leaveDocumentStatus?.addEventListener("change", renderLeaveDocuments);
    leaveDocumentsTable?.addEventListener("click", event => {
        const editButton = event.target.closest(".leave-document-edit");
        if (!editButton) return;

        const requestItem = leaveDocumentsData.find(item => String(item.id) === String(editButton.dataset.id));
        if (!requestItem) {
            showToast("Data surat izin tidak ditemukan", "error");
            return;
        }

        openEditLeaveModal(requestItem);
    });

    [allStaffModal].forEach(modal => {
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

            applyRoleCapabilities();

            if (isFinanceRole() || isOwnerRole()) {
                await loadStatistics();


                await loadMonthStatistics();


                await loadAttendance(selectedAttendanceDate);


                await loadShiftData();

                if (isFinanceRole()) {
                    await loadLeaveDocuments();
                }


                setupSearch();
            }


            if (isOwnerRole()) {
                await loadAccountRoles();
                await loadLeaveRequests();
                await loadEmployees();
            }


        }

        init();

    /* ==========================================================
        MODAL RIWAYAT KEHADIRAN
    ========================================================== */

    const attendanceModal =
        document.getElementById("attendanceModal");

    const btnViewAttendance =
        document.getElementById("btnViewAttendance");

    const closeAttendanceModal =
        document.getElementById("closeAttendanceModal");

    console.log(attendanceModal);
    console.log(btnViewAttendance);
    console.log(closeAttendanceModal);

    let attendanceHistoryData = [];

   async function loadAttendanceHistory() {

        const tbody = document.getElementById("attendanceHistoryTable");

        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">
                    Memuat data...
                </td>
            </tr>
        `;

        try {

            const response = await fetch("/api/staff/attendance/history", {
                credentials: "include"
            });

            const result = await response.json();

            console.log("Attendance History:", result);

            if (!result.success) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center;color:red">
                            ${result.message || "Gagal memuat data"}
                        </td>
                    </tr>
                `;
                return;
            }

            if (!result.data || result.data.length === 0) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center">
                            Belum ada data kehadiran
                        </td>
                    </tr>
                `;
                return;
            }

            attendanceHistoryData = result.data;

            renderAttendanceHistory(attendanceHistoryData);

        } catch (err) {

            console.error(err);

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:red">
                        Error mengambil data
                    </td>
                </tr>
            `;

        }

    }

    function renderAttendanceHistory(data){

        const tbody =
            document.getElementById("attendanceHistoryTable");

        tbody.innerHTML = "";

        if(data.length===0){

            tbody.innerHTML=`
                <tr>
                    <td colspan="6" style="text-align:center">
                        Tidak ada data
                    </td>
                </tr>
            `;

            return;
        }

        data.forEach(item=>{

            tbody.innerHTML+=`

                <tr>

                    <td>${item.name}</td>

                    <td>${item.date}</td>

                    <td>${item.clock_in ?? "-"}</td>

                    <td>${item.clock_out ?? "-"}</td>

                    <td>${item.shift ?? "-"}</td>

                    <td>${formatAttendanceStatus(item.status)}</td>

                </tr>

            `;

        });

    }

    function filterAttendanceHistory(){

        const keyword =
            document.getElementById("historySearch").value.toLowerCase();

        const startDate =
            document.getElementById("historyStartDate").value;

        const endDate =
            document.getElementById("historyEndDate").value;

        const status =
            document.getElementById("historyStatus").value;

        let filtered=[...attendanceHistoryData];

        if(keyword){

            filtered=filtered.filter(item=>

                (item.name || "")
                .toLowerCase()
                .includes(keyword)

            );

        }

        if(startDate){

            filtered=filtered.filter(item=>

                item.date>=startDate

            );

        }

        if(endDate){

            filtered=filtered.filter(item=>

                item.date<=endDate

            );

        }

        if(status){

            filtered=filtered.filter(item=>

                (item.status || "").toUpperCase() === status

            );

        }

        renderAttendanceHistory(filtered);

    }

    function formatAttendanceStatus(status){

        switch(status){

            case "PRESENT":
                return '<span class="badge badge-success">Hadir</span>';

            case "LATE":
                return '<span class="badge badge-warning">Terlambat</span>';

            case "LEAVE":
                return '<span class="badge badge-info">Izin</span>';

            case "SICK":
                return '<span class="badge badge-purple">Sakit</span>';

            case "NOT_CHECKED_IN":
                return '<span class="badge badge-danger">Belum Hadir</span>';

            default:
                return `<span class="badge badge-danger">${status}</span>`;
        }

    }

    async function loadEmployees() {

        const tbody =
            document.getElementById("employeeTable");
        const employeeInfo =
            document.getElementById("employeeInfo");
        const employeePage =
            document.getElementById("employeePage");
        const employeePrev =
            document.getElementById("employeePrev");
        const employeeNext =
            document.getElementById("employeeNext");

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading">
                    Memuat data...
                </td>
            </tr>
        `;

        try {

            const response = await fetch(
                "/api/staff/accounts",
                {
                    credentials: "include"
                }
            );

            const result = await response.json();

            if (!result.success) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            Gagal memuat data
                        </td>
                    </tr>
                `;

                if (employeeInfo) employeeInfo.textContent = "Menampilkan 0 data";
                if (employeePage) employeePage.textContent = "1 / 1";
                if (employeePrev) employeePrev.disabled = true;
                if (employeeNext) employeeNext.disabled = true;

                return;
            }

            employeeData = Array.isArray(result.data) ? result.data : [];
            filteredEmployeeData = [...employeeData];
            employeeCurrentPage = 1;

            renderEmployees();

        }

        catch (err) {

            console.error(err);

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Error mengambil data
                    </td>
                </tr>
            `;

            if (employeeInfo) employeeInfo.textContent = "Menampilkan 0 data";
            if (employeePage) employeePage.textContent = "1 / 1";
            if (employeePrev) employeePrev.disabled = true;
            if (employeeNext) employeeNext.disabled = true;

        }

    }

    function renderEmployees() {

        const tbody =
            document.getElementById("employeeTable");
        const employeeInfo =
            document.getElementById("employeeInfo");
        const employeePage =
            document.getElementById("employeePage");
        const employeePrev =
            document.getElementById("employeePrev");
        const employeeNext =
            document.getElementById("employeeNext");

        tbody.innerHTML = "";
        const totalData = filteredEmployeeData.length;
        const totalPages = Math.max(
            1,
            Math.ceil(totalData / employeeRowsPerPage)
        );
        employeeCurrentPage = Math.min(
            Math.max(employeeCurrentPage, 1),
            totalPages
        );

        if (totalData === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-loading">

                        Tidak ada data

                    </td>
                </tr>
            `;

            if (employeeInfo) employeeInfo.textContent = "Menampilkan 0 data";
            if (employeePage) employeePage.textContent = "1 / 1";
            if (employeePrev) employeePrev.disabled = true;
            if (employeeNext) employeeNext.disabled = true;

            return;

        }

        const startIndex = (employeeCurrentPage - 1) * employeeRowsPerPage;
        const endIndex = Math.min(startIndex + employeeRowsPerPage, totalData);
        const currentRows = filteredEmployeeData.slice(startIndex, endIndex);

        tbody.innerHTML = currentRows.map(item => `
                <tr>

                    <td>${escapeHtml(item.name || "-")}</td>

                    <td>${escapeHtml(item.username || "-")}</td>

                    <td>${escapeHtml(roleDisplayName(item))}</td>

                    <td>

                        <span class="employee-status ${item.status === 'ACTIVE' ? 'active' : 'inactive'}">

                            ${escapeHtml(item.status || "-")}

                        </span>

                    </td>

                    <td>

                        ${escapeHtml(item.last_login ?? "-")}

                    </td>

                    <td>

                        <div class="employee-action">

                            <button
                                class="edit"
                                data-id="${item.id}">

                                <i class="bi bi-pencil"></i>

                            </button>

                            <button
                                class="disable"
                                data-id="${item.id}">

                                <i class="bi bi-person-lock"></i>

                            </button>

                            <button
                                class="delete"
                                data-id="${item.id}">

                                <i class="bi bi-trash3"></i>

                            </button>

                        </div>

                    </td>

                </tr>

            `).join("");

        if (employeeInfo) {
            employeeInfo.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalData} data`;
        }
        if (employeePage) {
            employeePage.textContent = `${employeeCurrentPage} / ${totalPages}`;
        }
        if (employeePrev) {
            employeePrev.disabled = employeeCurrentPage <= 1;
        }
        if (employeeNext) {
            employeeNext.disabled = employeeCurrentPage >= totalPages;
        }

    }

    function filterEmployees(){

        const keyword =
            document.getElementById("employeeSearch")
            .value
            .toLowerCase();

        const role =
            document.getElementById("employeeRoleFilter")
            .value;

        filteredEmployeeData = employeeData.filter(item=>{
            const name = String(item.name || "").toLowerCase();
            const username = String(item.username || "").toLowerCase();
            const itemRole = String(item.role || "");
            const itemRoleLabel = String(roleDisplayName(item)).toLowerCase();

            const matchKeyword =

                name.includes(keyword)

                ||

                username.includes(keyword)

                ||

                itemRoleLabel.includes(keyword);

            const matchRole =

                role===""
                ||

                itemRole===role;

            return matchKeyword && matchRole;

        });

        employeeCurrentPage = 1;
        renderEmployees();

    }

    function openEmployeeModal() {
        employeeModal.classList.remove("hidden");
    }

    function closeEmployee() {
        employeeModal.classList.add("hidden");
    }

    btnAddEmployee?.addEventListener(
        "click",
        openEmployeeForm
    );
        
    closeEmployeeModal?.addEventListener(
        "click",
        closeEmployee
    );

    cancelEmployee?.addEventListener(
        "click",
        closeEmployee
    );


    // ======================
    // BUKA MODAL
    // ======================

    if (btnViewAttendance) {

        btnViewAttendance.addEventListener("click", async () => {

            attendanceModal.classList.remove("hidden");

            await loadAttendanceHistory();

        });

    }


    // ======================
    // TUTUP MODAL
    // ======================

    if (closeAttendanceModal) {

        closeAttendanceModal.addEventListener("click", () => {

            attendanceModal.classList.add("hidden");

        });

    }


    // ======================
    // KLIK AREA GELAP
    // ======================

    if (attendanceModal) {

        attendanceModal.addEventListener("click", (e) => {

            if (e.target === attendanceModal) {

                attendanceModal.classList.add("hidden");

            }

        });

    }

    // ===============================
    // FILTER RIWAYAT KEHADIRAN
    // ===============================

    const historySearch =
        document.getElementById("historySearch");

    const historyStartDate =
        document.getElementById("historyStartDate");

    const historyEndDate =
        document.getElementById("historyEndDate");

    const historyStatus =
        document.getElementById("historyStatus");

    const resetHistoryFilter =
        document.getElementById("resetHistoryFilter");

    if (historySearch) {

        historySearch.addEventListener(
            "keyup",
            filterAttendanceHistory
        );

    }

    if (historyStartDate) {

        historyStartDate.addEventListener(
            "change",
            filterAttendanceHistory
        );

    }

    if (historyEndDate) {

        historyEndDate.addEventListener(
            "change",
            filterAttendanceHistory
        );

    }

    if (historyStatus) {

        historyStatus.addEventListener(
            "change",
            filterAttendanceHistory
        );

    }

    if (resetHistoryFilter) {

        resetHistoryFilter.addEventListener("click", () => {

            if (historySearch)
                historySearch.value = "";

            if (historyStartDate)
                historyStartDate.value = "";

            if (historyEndDate)
                historyEndDate.value = "";

            if (historyStatus)
                historyStatus.value = "";

            renderAttendanceHistory(attendanceHistoryData);

        });

    }

    const employeeSearch =
        document.getElementById("employeeSearch");

        if(employeeSearch){

            employeeSearch.addEventListener(
                "input",
                filterEmployees
            );

        }

        const employeeRoleFilter =
            document.getElementById("employeeRoleFilter");

        if(employeeRoleFilter){

            employeeRoleFilter.addEventListener(
                "change",
                filterEmployees
            );

        }

        const employeePrev =
            document.getElementById("employeePrev");
        const employeeNext =
            document.getElementById("employeeNext");

        employeePrev?.addEventListener("click", () => {
            if (employeeCurrentPage <= 1) return;
            employeeCurrentPage -= 1;
            renderEmployees();
        });

        employeeNext?.addEventListener("click", () => {
            const totalPages = Math.max(
                1,
                Math.ceil(filteredEmployeeData.length / employeeRowsPerPage)
            );
            if (employeeCurrentPage >= totalPages) return;
            employeeCurrentPage += 1;
            renderEmployees();
        });

    saveEmployee?.addEventListener("click", async () => {

        const fullname =
            document.getElementById("employeeName").value.trim();

        const username =
            document.getElementById("employeeUsername").value.trim();

        const password =
            document.getElementById("employeePassword").value.trim();

        const role =
            document.getElementById("employeeRole").value;

        if (!fullname || !username || !role) {

            alert("Nama, Username, dan Role wajib diisi.");

            return;

        }

        if (!editingUserId && !password) {

            alert("Password wajib diisi.");

            return;

        }

        try {

            const url = editingUserId
                ? `/api/staff/accounts/${editingUserId}`
                : "/api/staff/accounts";

            const method = editingUserId
                ? "PUT"
                : "POST";

            const response = await fetch(url, {

                method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    fullname,
                    username,
                    password,
                    role

                })

            });

            const result = await response.json();

            alert(result.message);

            if (result.success) {

                editingUserId = null;

                closeEmployeeForm();

                loadEmployees();

            }

            } catch (err) {

                console.error(err);

                alert("Terjadi kesalahan.");

            }

            });

            function openEmployeeForm() {

        editingUserId = null;

        document.getElementById("employeeModalTitle").textContent = "Tambah Akun";

        saveEmployee.textContent = "Simpan";

        document.getElementById("employeeName").value = "";
        document.getElementById("employeeUsername").value = "";
        document.getElementById("employeePassword").value = "";
        document.getElementById("employeeRole").value = accountRoleOptions[0]?.code || "TIM_TOKO";

        employeeModal.classList.remove("hidden");

    }

    function closeEmployeeForm() {

        employeeModal.classList.add("hidden");

    }

    document.addEventListener("click", async (e) => {

        const btnDisable = e.target.closest(".disable");

        if (!btnDisable) return;

        const id = btnDisable.dataset.id;

        if (!confirm("Nonaktifkan akun ini?")) return;

        const response = await fetch(`/api/staff/accounts/${id}`, {

            method: "DELETE"

        });

        const result = await response.json();

        alert(result.message);

        if (result.success) {

            loadEmployees();

        }

    });

    document.addEventListener("click", async (e) => {

        const btnDelete = e.target.closest(".delete");

        if (!btnDelete) return;

        const id = btnDelete.dataset.id;

        if (!confirm("Hapus akun ini secara permanen?\n\nData tidak dapat dikembalikan.")) {
            return;
        }

        const response = await fetch(`/api/staff/accounts/${id}/permanent`, {

            method: "DELETE"

        });

        const result = await response.json();

        alert(result.message);

        if (result.success) {

            loadEmployees();

        }

    });

    document.addEventListener("click", async (e) => {

        const btnEdit = e.target.closest(".edit");

        if (!btnEdit) return;

        const id = btnEdit.dataset.id;

            editingUserId = id;

        const response = await fetch(`/api/staff/accounts/${id}`);

        const result = await response.json();

        if (!result.success) {

            alert(result.message);

            return;

        }

        document.getElementById("employeeName").value =
            result.data.fullname;

        document.getElementById("employeeUsername").value =
            result.data.username;

        document.getElementById("employeeRole").value =
            result.data.role;

        document.getElementById("employeePassword").value = "";

        document.getElementById("employeeModalTitle").textContent = "Edit Akun";

        saveEmployee.textContent = "Update";

        employeeModal.classList.remove("hidden");

    });

});

