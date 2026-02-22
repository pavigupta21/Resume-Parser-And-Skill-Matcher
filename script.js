// ══════════════════════════════════════
//  GLOBALS
// ══════════════════════════════════════
let isSignupMode    = false;
let pendingUsername = "";
let Auth;
let Storage;
const JOB_API_URL = "https://0w7yht93fh.execute-api.ap-south-1.amazonaws.com/job";


let selectedFiles = [];
let resumesExtracted = false;
let jobSaved = false;
async function waitForProcessingCompletion() {

    const jobId = localStorage.getItem("savedJobId");
    const expected = parseInt(localStorage.getItem("expectedResumeCount"), 10);

    if (!jobId || !expected) return;

    const analyzeBtn = document.getElementById("analyzeBtn");

    const interval = setInterval(async () => {

        try {
            const response = await fetch(
                `https://0w7yht93fh.execute-api.ap-south-1.amazonaws.com/job-status?job_id=${jobId}`
            );

            const data = await response.json();
            const processed = data.processed_count;

            console.log("Processed:", processed, "Expected:", expected);

            if (processed >= expected) {
                const extractBtn = document.getElementById("extractBtn");
                if (extractBtn) {
                    extractBtn.classList.remove("loading");
                    extractBtn.innerHTML = `✔&nbsp; Extracted & Saved!`;
                }

                clearInterval(interval);

                resumesExtracted = true;
                updateAnalyzeButtonState();

                showToast("All resumes processed successfully!", "success");

                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                }
            }

        } catch (err) {
            console.error("Status check failed:", err);
        }

    }, 5000); // check every 5 seconds
}
function updateAnalyzeButtonState() {
    const analyzeBtn = document.getElementById("analyzeBtn");

    if (resumesExtracted && jobSaved) {
        analyzeBtn.disabled = false;
    } else {
        analyzeBtn.disabled = true;
    }
}
async function uploadAllFiles() {
    if (!selectedFiles || selectedFiles.length === 0) {
        showToast("Please select at least one file.", "warning");
        return false;
    }

    try {
        const user = await Auth.currentAuthenticatedUser();

        const uploadPromises = selectedFiles.map(file => {
            if (!(file instanceof File)) return Promise.resolve();
            const jobId = localStorage.getItem("savedJobId");
            return Storage.put(
                 `uploads/${user.username}/${jobId}/${Date.now()}_${file.name}`,
                file,
                {
                    contentType: file.type || "application/pdf",
                    level: "private"
                }
            );
        });

        await Promise.all(uploadPromises);

        return true;

    } catch (err) {
        console.error("Upload error:", err);
        showToast(err.message || "Upload failed", "error");
        return false;
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
        userPoolId: "ap-south-1_XtZwgaZoT",
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
    // ── Character counter (NO LIMIT) ──
const jdTextarea = document.getElementById("jobDescription");
const charCount  = document.getElementById("charCount");

if (jdTextarea) {

    jdTextarea.addEventListener("input", () => {
        updateCharCount(jdTextarea.value.length);
    });
}
    // jdTextarea.value = "";
    // updateCharCount(0);
    if (jdTextarea) {
    jdTextarea.value = "";
    updateCharCount(0);
}

function updateCharCount(len) {
    if (!charCount) return;

    charCount.textContent = `${len.toLocaleString()} characters`;
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

        // 🔥 Clear job-related data
        localStorage.removeItem("savedJD");
        localStorage.removeItem("savedJobId");
        localStorage.removeItem("expectedResumeCount");
        localStorage.removeItem("results");

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

async function saveJobDescription() {

    const btn = document.getElementById("saveJdBtn");
    const textarea = document.getElementById("jobDescription");
    const description = textarea ? textarea.value.trim() : "";

    if (!description) {
        showToast("Please enter a job description.", "warning");
        return;
    }

    btn.classList.add("loading");
    btn.innerHTML = `<span class="spinner">⟳</span>&nbsp; Saving...`;

    try {

        const response = await fetch(JOB_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: "Job Posting",   // optional
                description: description
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to save job");
        }

        // Save job_id locally for matching later
        localStorage.setItem("savedJobId", data.job_id);
        localStorage.setItem("savedJD", description);
        jobSaved = true;
        updateAnalyzeButtonState();

        const warning = document.getElementById("jdWarning");
        if (warning) warning.style.display = "none";

        btn.classList.remove("loading");
        btn.innerHTML = "✔&nbsp; Saved!";
        showToast("Job description saved successfully!", "success");

    } catch (err) {
        console.error(err);
        btn.classList.remove("loading");
        btn.innerHTML = "💾&nbsp; Save Job Description";
        showToast("Error saving job description.", "error");
    }
}

// ══════════════════════════════════════
//  EXTRACT & ANALYZE
// ══════════════════════════════════════

async function extractResumes() {
    // 🚨 Guard: JD must be saved first
    if (!jobSaved) {
        showToast("Please save the Job Description before extracting resumes.", "warning");
        return;
    }
    localStorage.setItem("expectedResumeCount", selectedFiles.length);
    const btn = document.getElementById("extractBtn");
    if (!btn) return;

    btn.classList.add("loading");

    // Step 1: Upload all files
    btn.innerHTML = `<span class="spinner">⟳</span>&nbsp; Uploading...`;
    const uploadSuccess = await uploadAllFiles();

    if (!uploadSuccess) {
        btn.classList.remove("loading");
        btn.innerHTML = `⬆&nbsp; Extract & Save Resumes`;
        return;
    }

    // Step 2: Countdown extraction time
    // let remaining = 120; // 120 seconds

    btn.innerHTML = `<span class="spinner">⟳</span>&nbsp; Extracting & Saving...`;

    if (uploadSuccess) {
    waitForProcessingCompletion();
}
}

async function analyzeResumes() {

    const btn = document.getElementById("analyzeBtn");
    btn.classList.add("loading");
    btn.innerHTML = `<span class="spinner">⟳</span>&nbsp; Analyzing…`;

    try {

        const jobId = localStorage.getItem("savedJobId");

        if (!jobId) {
            showToast("No job selected.", "error");
            return;
        }

        const response = await fetch("https://0w7yht93fh.execute-api.ap-south-1.amazonaws.com/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                job_id: jobId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Analyze failed");
        }

        // Transform backend response to UI format
        const formatted = data.results.map(r => ({
            name: r.candidate_name || r.resume_id,  // ✅ Use name first
            resumeId: r.resume_id, 
            score: r.score,
            skills: r.matched_skills,
             s3key: r.s3_key
        }));

        localStorage.setItem("results", JSON.stringify(formatted));

        window.location.href = "results.html";

    } catch (err) {
        console.error(err);
        showToast("Analysis failed.", "error");
    } finally {
        btn.classList.remove("loading");
        btn.innerHTML = `✦&nbsp; Analyze & Match Resumes`;
    }
}
function goBack() { window.location.href = "index.html"; }

// ══════════════════════════════════════
//  RESULTS PAGE
// ══════════════════════════════════════
async function downloadResume(e, key) {
    e.stopPropagation();

    try {
        const url = await Storage.get(key, { level: "private" });
        window.open(url, "_blank");
    } catch (err) {
        console.error(err);
        showToast("Failed to download resume", "error");
    }
}

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
            <button class="download-btn"
                onclick="downloadResume(event,'${r.s3key}')">
                📄 Resume
            </button>
            <button class="download-btn"
    onclick="downloadReport(event,'${r.resumeId}')">
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

async function downloadReport(e, resumeId) {
    e.stopPropagation();

    try {
        const jobId = localStorage.getItem("savedJobId");

        const response = await fetch("https://0w7yht93fh.execute-api.ap-south-1.amazonaws.com/generate-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resume_id: resumeId,
                job_id: jobId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(data);
            throw new Error("Report generation failed");
        }

        window.open(data.download_url, "_blank");

    } catch (err) {
        console.error(err);
        showToast("Failed to generate report", "error");
    }
}
function filterResults() {
    const query = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const order = document.getElementById("sortSelect")?.value || "highest";
    let filtered = allResults.filter(r => r.name.toLowerCase().includes(query));
    filtered.sort((a, b) => order === "highest" ? b.score - a.score : a.score - b.score);
    renderCards(filtered);
}