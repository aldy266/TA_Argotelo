document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const modal = document.getElementById("attendanceModal");
    const triggers = document.querySelectorAll(".js-attendance-trigger");
    if (!modal || !triggers.length) return;

    const el = {
        today: document.getElementById("attendanceTodayLabel"), name: document.getElementById("attendanceStaffName"),
        position: document.getElementById("attendanceStaffPosition"), shift: document.getElementById("attendanceShiftName"),
        shiftTime: document.getElementById("attendanceShiftTime"), in: document.getElementById("attendanceClockInBtn"),
        out: document.getElementById("attendanceClockOutBtn"), timeIn: document.getElementById("attendanceTimeIn"),
        timeOut: document.getElementById("attendanceTimeOut"), duration: document.getElementById("attendanceWorkDuration"),
        message: document.getElementById("attendanceMessage")
    };

    const formatTime = value => value ? new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
    const formatDuration = value => { const minutes = Math.max(Number(value || 0), 0); return `${String(Math.floor(minutes / 60)).padStart(2, "0")}h ${String(minutes % 60).padStart(2, "0")}m`; };
    const setMessage = (message = "", error = false) => { el.message.textContent = message; el.message.classList.toggle("error", error); };

    function render(data) {
        el.today.textContent = new Date(`${data.schedule_date || ""}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        el.name.textContent = data.staff_name || "-"; el.position.textContent = data.position || "-";
        el.shift.textContent = data.shift_name || "-"; el.shiftTime.textContent = data.start_time && data.end_time ? `${data.start_time} - ${data.end_time}` : "-";
        el.timeIn.textContent = formatTime(data.clock_in); el.timeOut.textContent = formatTime(data.clock_out); el.duration.textContent = formatDuration(data.work_minutes);
        el.in.disabled = !data.can_clock_in; el.out.disabled = !data.can_clock_out;
        setMessage(data.clock_in_locked_message || (data.clock_in ? data.clock_out_locked_message : ""));
    }

    async function api(url, options = {}) {
        const response = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
        const result = await response.json().catch(() => ({ success: false, message: "Respon server tidak valid" }));
        if (!response.ok || result.success === false) throw new Error(result.message || "Permintaan gagal");
        return result;
    }

    async function load() {
        try { render((await api("/api/staff/attendance/me")).data); }
        catch (error) { el.in.disabled = true; el.out.disabled = true; setMessage(error.message, true); }
    }
    function close() { modal.hidden = true; modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("attendance-modal-open"); }
    async function submit(url) {
        el.in.disabled = true; el.out.disabled = true;
        try { const result = await api(url, { method: "PATCH" }); render(result.data); setMessage(result.message); }
        catch (error) { setMessage(error.message, true); await load(); }
    }

    triggers.forEach(trigger => trigger.addEventListener("click", event => { event.preventDefault(); modal.hidden = false; modal.setAttribute("aria-hidden", "false"); document.body.classList.add("attendance-modal-open"); load(); }));
    modal.querySelectorAll("[data-attendance-close]").forEach(button => button.addEventListener("click", close));
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });
    el.in.addEventListener("click", () => submit("/api/staff/attendance/clock-in"));
    el.out.addEventListener("click", () => submit("/api/staff/attendance/clock-out"));
});
