// ══════════════════════════════════════
//  GLOBALS
// ══════════════════════════════════════
let isSignupMode    = false;
let pendingUsername = "";
let Auth;
let Storage;


let selectedFiles = [];
async function testS3Upload() {
    try {
        if (!selectedFiles || selectedFiles.length === 0) {
            showToast("Please select a file first.", "warning");
            return;
        }

        const file = selectedFiles[0];

        if (!(file instanceof File)) {
            console.error("Invalid file object:", file);
            showToast("Invalid file selected.", "error");
            return;
        }

        const user = await Auth.currentAuthenticatedUser();

        await Storage.put(
            `uploads/${user.username}/${Date.now()}_${file.name}`,
            file,
            {
                contentType: file.type || "application/pdf",
                level: "private"
            }
        );

        showToast("Upload successful!", "success");

    } catch (err) {
        console.error("Upload error:", err);
        showToast(err.message || "Upload failed", "error");
    }
}





function showToast(message, type = "info") {
    let bg;

    switch (type) {
        case "success":
            bg = "linear-gradient(to right, #0d9e6e, #13c296)";
            break;
        case "error":
            bg = "linear-gradient(to right, #d63031, #ff7675)";
            break;
        case "warning":
            bg = "linear-gradient(to right, #c47b0a, #f39c12)";
            break;
        default:
            bg = "linear-gradient(to right, #4361ee, #6c63ff)";
    }

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: bg,
        stopOnFocus: true,
        close: true,
        style: {
            borderRadius: "8px",
            fontSize: "0.85rem",
            padding: "10px 14px"
        }
    }).showToast();
}


// ══════════════════════════════════════
//  INIT — single DOMContentLoaded
// ══════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

    // ── Amplify Auth (loaded via CDN script tag) ──
    if (!window.aws_amplify) {
    console.error("Amplify not loaded.");
    return;
}

    Auth = window.aws_amplify.Auth;
    Storage = window.aws_amplify.Storage;


    window.aws_amplify.Amplify.configure({
    Auth: {
        region: "ap-south-1",
        userPoolId: "ap-south-1_XtzwgaZoT",
        userPoolWebClientId: "2d0v585694p0fsfqvs78j7pl5q",
        authenticationFlowType: "USER_PASSWORD_AUTH",
        identityPoolId: "ap-south-1:8a6d8dfa-f792-46d8-8ac9-4b5cb4b32667",
    },
    Storage: {
        AWSS3: {
            bucket: "resume-parser-uploads-27",
            region: "ap-south-1"
        }
    }
});
 
checkUserSession();



    // ── Auth switch link ──
    const switchLink = document.getElementById("authSwitchLink");
    if (switchLink) {
        switchLink.addEventListener("click", (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }

    // Start in login mode
    showLoginFields();

    // ── File input ──
    const fileInput = document.getElementById("resumeFiles");
    if (fileInput) {
        fileInput.addEventListener("change", () => {
            for (const f of fileInput.files) {
                if (!selectedFiles.find(x => x.name === f.name && x.size === f.size)) {
                    selectedFiles.push(f);
                }
            }
            renderFileList();
        });
    }

    // ── Drag & drop ──
    const uploadZone = document.getElementById("uploadZone");
    if (uploadZone) {
        uploadZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadZone.classList.add("drag-over");
        });
        uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
        uploadZone.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadZone.classList.remove("drag-over");
            for (const f of e.dataTransfer.files) {
                if (!selectedFiles.find(x => x.name === f.name && x.size === f.size)) {
                    selectedFiles.push(f);
                }
            }
            renderFileList();
        });
    }

    // ── Character counter ──
    const jdTextarea = document.getElementById("jobDescription");
    const charCount  = document.getElementById("charCount");
    const JD_LIMIT   = 1000;

    if (jdTextarea) {
        const savedJD = localStorage.getItem("savedJD");
        if (savedJD) {
            jdTextarea.value = savedJD.slice(0, JD_LIMIT);
            updateCharCount(jdTextarea.value.length);
        }
        jdTextarea.addEventListener("input", () => updateCharCount(jdTextarea.value.length));
    }

    function updateCharCount(len) {
        if (!charCount) return;
        charCount.textContent = `${len.toLocaleString()} / ${JD_LIMIT.toLocaleString()} characters`;
        charCount.classList.remove("warn", "over");
        if (JD_LIMIT - len <= 0)        charCount.classList.add("over");
        else if (JD_LIMIT - len <= 100) charCount.classList.add("warn");
    }
});


// ══════════════════════════════════════
//  AUTH MODAL
// ══════════════════════════════════════
function openAuth() {
    document.getElementById("authModal").classList.remove("hidden");
}

function closeAuth() {
    document.getElementById("authModal").classList.add("hidden");
}

function toggleAuthMode() {
    isSignupMode = !isSignupMode;

    document.getElementById("authTitle").textContent       = isSignupMode ? "Create Account" : "Login";
    document.getElementById("authBtn").textContent         = isSignupMode ? "Create Account"  : "Login";
    document.getElementById("authSwitchText").textContent  = isSignupMode ? "Already have an account?" : "Don't have an account?";
    document.getElementById("authSwitchLink").textContent  = isSignupMode ? "Login" : "Create account";

    isSignupMode ? showSignupFields() : showLoginFields();
}

function showSignupFields() {
    document.querySelectorAll(".signup-only").forEach(el => el.style.display = "block");
}

function showLoginFields() {
    document.querySelectorAll(".signup-only").forEach(el => el.style.display = "none");
}


function setLoggedInUI(username, email) {
    const loginBtn = document.getElementById("loginBtn");
    const accountMenu = document.getElementById("accountMenu");
    const overlay = document.getElementById("loginOverlay");
    const appContent = document.getElementById("appContent");

    if (loginBtn) loginBtn.style.display = "none";
    if (accountMenu) accountMenu.classList.remove("hidden");

    document.getElementById("accountUsername").textContent = username;
    document.getElementById("accountAvatar").textContent =
        username.charAt(0).toUpperCase();

    // 🔥 NEW LINE
    const emailEl = document.getElementById("accountEmail");
    if (emailEl) emailEl.textContent = email;

    if (overlay) overlay.style.display = "none";
    if (appContent) appContent.classList.remove("app-disabled");
}


function setLoggedOutUI() {
    const loginBtn = document.getElementById("loginBtn");
    const accountMenu = document.getElementById("accountMenu");
    const dropdown = document.getElementById("accountDropdown");
    const overlay = document.getElementById("loginOverlay");
    const appContent = document.getElementById("appContent");

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (accountMenu) accountMenu.classList.add("hidden");
    if (dropdown) dropdown.classList.add("hidden");

    if (overlay) overlay.style.display = "flex";
    if (appContent) appContent.classList.add("app-disabled");
}



async function checkUserSession() {
    try {
        const user = await Auth.currentAuthenticatedUser();
        setLoggedInUI(user.username,user.attributes.email);
    } catch (err) {
        setLoggedOutUI();
        if (window.location.pathname.includes("results.html")) {
        window.location.href = "index.html";
}

    }
}


async function handleAuth() {
    if (!Auth) {
        showToast("Auth service unavailable. Please refresh the page and try again.", "error");

        return;
    }

    const username = document.getElementById("authUsername").value.trim();
    const email    = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const confirm  = document.getElementById("authConfirmPassword").value;

    if (!username || !password) {
        showToast("Please enter your username and password.", "warning");
        return;
    }

    try {
        if (isSignupMode) {
            if (password !== confirm) { showToast("Passwords do not match.", "warning"); return; }

            await Auth.signUp({ username, password, attributes: { email } });
            pendingUsername = username;
            closeAuth();
            document.getElementById("otpModal").classList.remove("hidden");

        } else {
            const user = await Auth.signIn(username, password);

            closeAuth();
            setLoggedInUI(user.username,user.attributes.email);
            showToast("Login successful!", "success");


        }

    } catch (err) {
        showToast(err.message || "Authentication failed. Please try again.", "error");
    }
}

async function confirmOTP() {
    if (!Auth) { showToast("Auth service unavailable.", "error"); return; }

    const code = document.getElementById("otpCode").value.trim();
    if (!code) { showToast("Please enter the verification code.", "warning"); return; }

    try {
        await Auth.confirmSignUp(pendingUsername, code);
        document.getElementById("otpModal").classList.add("hidden");
        showToast("Account verified! Please log in.", "success");
        // Force back to login mode
        if (isSignupMode) toggleAuthMode();
        openAuth();
    } catch (err) {
        showToast(err.message || "Verification failed. Please try again.", "error");
    }
}
function toggleAccountDropdown() {
    const dropdown = document.getElementById("accountDropdown");
    if (dropdown) dropdown.classList.toggle("hidden");
}

async function logoutUser() {
    try {
        await Auth.signOut();
        window.location.href = "index.html";
    } catch (err) {
        showToast("Logout failed.", "error");
    }
}

// ══════════════════════════════════════
//  FILE MANAGEMENT
// ══════════════════════════════════════
function renderFileList() {
    const fileList   = document.getElementById("fileList");
    const header     = document.getElementById("fileListHeader");
    const countEl    = document.getElementById("fileCount");
    const analyzeRow = document.getElementById("analyzeRow");
    const extractBtn = document.getElementById("extractBtn");

    if (!fileList) return;
    fileList.innerHTML = "";

    if (selectedFiles.length === 0) {
        if (header)     header.style.display = "none";
        if (analyzeRow) analyzeRow.style.display = "none";
        return;
    }

    if (header) {
        header.style.display = "flex";
        countEl.textContent  = `${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""}`;
    }
    if (analyzeRow) analyzeRow.style.display = "flex";

    // Reset extract button on new upload
    if (extractBtn) {
        extractBtn.classList.remove("loading");
        extractBtn.innerHTML         = `⬆&nbsp; Extract &amp; Save Resumes`;
        extractBtn.style.background  = "";
        extractBtn.style.color       = "";
        extractBtn.style.borderColor = "";
    }

    selectedFiles.forEach((file, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
            <button class="delete-file-btn" title="Remove" onclick="removeFile(${idx})">✕</button>
        `;
        fileList.appendChild(li);
    });
}

function removeFile(idx) {
    selectedFiles.splice(idx, 1);
    renderFileList();
}

function clearAllFiles() {
    selectedFiles = [];
    const fi = document.getElementById("resumeFiles");
    if (fi) fi.value = "";
    renderFileList();
}

function formatBytes(b) {
    if (b < 1024)    return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
}

// ══════════════════════════════════════
//  JOB DESCRIPTION
// ══════════════════════════════════════
function saveJobDescription() {
    const btn      = document.getElementById("saveJdBtn");
    const textarea = document.getElementById("jobDescription");
    const val      = textarea ? textarea.value.trim() : "";

    if (!val) {
        btn.textContent       = "⚠ Nothing to save";
        btn.style.color       = "var(--danger)";
        btn.style.borderColor = "rgba(214,48,49,0.3)";
        setTimeout(() => {
            btn.textContent       = "💾\u00a0 Save Job Description";
            btn.style.color       = "";
            btn.style.borderColor = "";
        }, 2200);
        return;
    }

    localStorage.setItem("savedJD", val);
    btn.classList.add("saved");
    btn.textContent = "✔\u00a0 Saved!";
    setTimeout(() => {
        btn.classList.remove("saved");
        btn.textContent = "💾\u00a0 Save Job Description";
    }, 2400);
}

// ══════════════════════════════════════
//  EXTRACT & ANALYZE
// ══════════════════════════════════════
// function extractResumes() {
//     const btn = document.getElementById("extractBtn");
//     btn.classList.add("loading");
//     btn.innerHTML = `<span class="spinner">⟳</span>&nbsp; Extracting…`;

//     setTimeout(() => {
//         btn.classList.remove("loading");
//         btn.innerHTML            = `✔&nbsp; Extracted &amp; Saved!`;
//         btn.style.background     = "var(--success-bg)";
//         btn.style.color          = "var(--success)";
//         btn.style.borderColor    = "rgba(13,158,110,0.3)";
//     }, 1400);
// }
function extractResumes() {
    testS3Upload();
}
function analyzeResumes() {
    const btn = document.getElementById("analyzeBtn");
    btn.classList.add("loading");
    btn.innerHTML = `<span class="spinner">⟳</span>&nbsp; Analyzing…`;

    setTimeout(() => {
        const results = [
            { name: "Daenerys Targaryen", score: 91, skills: ["Python","ML","TensorFlow","SQL","Data Analysis"] },
            { name: "John Snow",          score: 86, skills: ["Python","React","Node.js","REST APIs","Git"] },
            { name: "Arya Stark",         score: 72, skills: ["Java","Spring Boot","Microservices","Docker"] },
            { name: "Tyrion Lannister",   score: 65, skills: ["JavaScript","Vue.js","CSS","HTML","Figma"] },
            { name: "Sansa Stark",        score: 48, skills: ["Excel","PowerPoint","Project Management"] },
            { name: "Jon Targaryen",      score: 38, skills: ["C++","Embedded Systems","RTOS"] }
        ];
        localStorage.setItem("results", JSON.stringify(results));
        window.location.href = "results.html";
    }, 950);
}

function goBack() { window.location.href = "index.html"; }

// ══════════════════════════════════════
//  RESULTS PAGE
// ══════════════════════════════════════
let allResults = [];

if (window.location.pathname.includes("results.html")) {
    allResults = JSON.parse(localStorage.getItem("results") || "[]");

    const container = document.getElementById("resultsContainer");
    const summary   = document.getElementById("resultsSummary");

    if (!allResults.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>No results found.<br>Go back and upload resumes to get started.</p>
            </div>`;
    } else {
        if (summary) {
            summary.textContent =
                `${allResults.length} candidate${allResults.length !== 1 ? "s" : ""} ranked by skill compatibility`;
        }
        renderCards(allResults.slice().sort((a, b) => b.score - a.score));
    }
}

function renderCards(list) {
    const container = document.getElementById("resultsContainer");
    const noMsg     = document.getElementById("noResultsMsg");
    if (!container) return;

    container.querySelectorAll(".result-card").forEach(c => c.remove());

    if (!list.length) {
        if (noMsg) noMsg.style.display = "block";
        return;
    }
    if (noMsg) noMsg.style.display = "none";

    const ranked = allResults.slice().sort((a, b) => b.score - a.score);

    list.forEach((r) => {
        const globalRank = ranked.findIndex(x => x.name === r.name);
        const rankClass  = globalRank === 0 ? "gold" : globalRank === 1 ? "silver" : globalRank === 2 ? "bronze" : "";
        const rankLabel  = `#${globalRank + 1}`;
        const scoreClass = r.score >= 75 ? "high" : r.score >= 50 ? "medium" : "low";
        const scoreWord  = r.score >= 75 ? "Strong" : r.score >= 50 ? "Fair" : "Low";

        const div = document.createElement("div");
        div.className = "result-card";
        div.innerHTML = `
            <div class="rank-badge ${rankClass}">${rankLabel}</div>
            <div class="result-info">
                <div class="result-name">${r.name}</div>
                <div class="progress-bar">
                    <div class="progress-fill" data-score="${r.score}"></div>
                </div>
            </div>
            <div class="score-col">
                <span class="score-badge ${scoreClass}">${r.score}%</span>
                <span class="score-label ${scoreClass}">${scoreWord}</span>
            </div>
            <button class="download-btn" onclick="downloadReport(event,'${r.name}',${r.score},'${(r.skills||[]).join(",")}')">
                <svg viewBox="0 0 24 24"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg>
                Report
            </button>
        `;
        container.appendChild(div);
    });

    requestAnimationFrame(() => {
        setTimeout(() => {
            document.querySelectorAll(".progress-fill").forEach(bar => {
                bar.style.width = bar.dataset.score + "%";
            });
        }, 80);
    });
}

function downloadReport(e, name, score, skillsStr) {
    e.stopPropagation();
    const skills    = skillsStr ? skillsStr.split(",") : [];
    const scoreWord = score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Low Match";
    const jd        = localStorage.getItem("savedJD") || "No job description saved.";
    const now       = new Date().toLocaleString();
    const scoreColor = score >= 75 ? "#0d9e6e" : score >= 50 ? "#c47b0a" : "#d63031";
    const scoreBg    = score >= 75 ? "#e6f7f2"  : score >= 50 ? "#fef6e4" : "#fdecea";

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>SkillFit Report — ${name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#f7f8fc;color:#16172b;padding:40px}
  .card{background:#fff;border-radius:16px;padding:36px;max-width:680px;margin:0 auto;box-shadow:0 4px 20px rgba(67,97,238,.1)}
  .logo{font-size:1rem;font-weight:800;color:#4361ee;margin-bottom:28px}
  h1{font-size:1.7rem;font-weight:800;margin-bottom:4px}
  .sub{color:#8a8da8;font-size:.85rem;margin-bottom:28px}
  .score-box{display:flex;align-items:center;gap:18px;background:#eef1fd;border-radius:12px;padding:20px 24px;margin-bottom:24px}
  .score-num{font-size:3rem;font-weight:800;color:${scoreColor};line-height:1}
  .score-detail h3{font-size:.95rem;font-weight:700;margin-bottom:4px}
  .score-detail p{font-size:.82rem;color:#8a8da8}
  .badge{display:inline-block;font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:50px;text-transform:uppercase;background:${scoreBg};color:${scoreColor};margin-top:6px}
  section{margin-bottom:22px}
  section h2{font-size:.78rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#8a8da8;margin-bottom:10px}
  .skill-list{display:flex;flex-wrap:wrap;gap:8px}
  .skill{background:#eef1fd;color:#4361ee;font-size:.8rem;font-weight:600;padding:4px 12px;border-radius:6px}
  .jd-box{background:#f7f8fc;border-radius:10px;padding:14px 16px;font-size:.83rem;color:#3d3f5c;line-height:1.7;max-height:200px;overflow:auto}
  .footer{margin-top:28px;padding-top:18px;border-top:1px solid #e0e3f0;font-size:.75rem;color:#8a8da8;display:flex;justify-content:space-between}
</style></head>
<body><div class="card">
  <div class="logo">🎯 SkillFit</div>
  <h1>${name}</h1><p class="sub">Candidate Skill Match Report</p>
  <div class="score-box">
    <div class="score-num">${score}%</div>
    <div class="score-detail">
      <h3>Skill Compatibility Score</h3>
      <p>Compared against the provided job description</p>
      <span class="badge">${scoreWord}</span>
    </div>
  </div>
  ${skills.length ? `<section><h2>Detected Skills</h2><div class="skill-list">${skills.map(s=>`<span class="skill">${s.trim()}</span>`).join("")}</div></section>` : ""}
  <section><h2>Job Description</h2><div class="jd-box">${jd}</div></section>
  <div class="footer"><span>Generated by SkillFit</span><span>${now}</span></div>
</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `SkillFit_Report_${name.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function filterResults() {
    const query = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const order = document.getElementById("sortSelect")?.value || "highest";
    let filtered = allResults.filter(r => r.name.toLowerCase().includes(query));
    filtered.sort((a, b) => order === "highest" ? b.score - a.score : a.score - b.score);
    renderCards(filtered);
}