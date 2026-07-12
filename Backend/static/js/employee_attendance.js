document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const el = {
        todayLabel: document.getElementById("todayLabel"),
        staffName: document.getElementById("staffName"),
        staffPosition: document.getElementById("staffPosition"),
        shiftName: document.getElementById("shiftName"),
        shiftTime: document.getElementById("shiftTime"),
        clockInBtn: document.getElementById("clockInBtn"),
        clockOutBtn: document.getElementById("clockOutBtn"),
        timeIn: document.getElementById("timeIn"),
        timeOut: document.getElementById("timeOut"),
        workDuration: document.getElementById("workDuration"),
        message: document.getElementById("message"),
        logoutBtn: document.getElementById("logoutBtn")
    };

    function setMessage(message = "", type = "") {
        el.message.textContent = message;
        el.message.classList.toggle("error", type === "error");
    }

    function formatDate(value) {
        const date = value ? new Date(`${value}T00:00:00`) : new Date();
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function formatTime(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function formatWorkDuration(minutes) {
        const safeMinutes = Math.max(Number(minutes || 0), 0);
        const hours = Math.floor(safeMinutes / 60);
        const mins = safeMinutes % 60;
        return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
    }

    function render(data) {
        el.todayLabel.textContent = formatDate(data.schedule_date);
        el.staffName.textContent = data.staff_name || "-";
        el.staffPosition.textContent = data.position || "-";
        el.shiftName.textContent = data.shift_name || "-";
        el.shiftTime.textContent = data.start_time && data.end_time
            ? `${data.start_time} - ${data.end_time}`
            : "-";
        el.timeIn.textContent = formatTime(data.clock_in);
        el.timeOut.textContent = formatTime(data.clock_out);
        el.workDuration.textContent = formatWorkDuration(data.work_minutes);

        el.clockInBtn.disabled = !data.can_clock_in;
        el.clockOutBtn.disabled = !data.can_clock_out;
        el.clockInBtn.title = data.clock_in_locked_message || "";
        el.clockOutBtn.title = data.clock_out_locked_message || "";

        if (data.clock_in_locked_message) {
            setMessage(data.clock_in_locked_message);
        } else if (data.clock_out_locked_message && data.clock_in) {
            setMessage(data.clock_out_locked_message);
        } else {
            setMessage("");
        }
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });
        const result = await response.json().catch(() => ({
            success: false,
            message: "Respon server tidak valid"
        }));
        if (!response.ok || result.success === false) {
            throw new Error(result.message || "Permintaan gagal");
        }
        return result;
    }

    async function loadAttendance() {
        try {
            const result = await api("/api/staff/attendance/me");
            render(result.data);
        } catch (error) {
            el.clockInBtn.disabled = true;
            el.clockOutBtn.disabled = true;
            setMessage(error.message, "error");
        }
    }

    async function submitAttendance(url, successMessage) {
        setMessage("");
        el.clockInBtn.disabled = true;
        el.clockOutBtn.disabled = true;

        try {
            const result = await api(url, { method: "PATCH" });
            render(result.data);
            setMessage(result.message || successMessage);
        } catch (error) {
            setMessage(error.message, "error");
            await loadAttendance();
        }
    }

    el.clockInBtn.addEventListener("click", () => {
        submitAttendance("/api/staff/attendance/clock-in", "Absen masuk berhasil");
    });

    el.clockOutBtn.addEventListener("click", () => {
        submitAttendance("/api/staff/attendance/clock-out", "Absen pulang berhasil");
    });

    el.logoutBtn.addEventListener("click", async () => {
        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });
        const result = await response.json().catch(() => ({}));
        window.location.href = result.redirect_url || "/staff/login";
    });

    el.todayLabel.textContent = formatDate();
    loadAttendance();
});
