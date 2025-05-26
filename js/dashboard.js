window.onload = function () {
    loadUserGreeting();
    loadDashboardAvatar();
    loadDashboard();
};

function loadUserGreeting() {
    const usersData = localStorage.getItem("users");
    const loggedInUserCode = localStorage.getItem("loggedInUserCode");
    console.log("Cek localStorage di menu.html:", usersData);
    if (usersData && loggedInUserCode) {
        try {
            const users = JSON.parse(usersData);
            console.log("Data users setelah parse:", users);
            const loggedInUser = users.find(user => user.usercode === loggedInUserCode);
            if (loggedInUser) {
                console.log("User ditemukan:", loggedInUser.usercode, loggedInUser.name);
                safeSetTextContent("greeting", `Hii ${loggedInUser.name} (${loggedInUser.usercode})`);
            } else {
                console.log("User tidak ditemukan dalam daftar users.");
                safeSetTextContent("greeting", "Hii Guest");
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            safeSetTextContent("greeting", "Hii Guest");
        }
    } else {
        console.log("Data users atau loggedInUserCode tidak ditemukan di localStorage!");
        safeSetTextContent("greeting", "Hii Vaphat");
    }
}


    // Tampilkan nama user dari localStorage
    function loadUserGreeting() {
        // const usersData = localStorage.getItem("users");
        const loggedInUserCode = localStorage.getItem("loggedInUser");
        console.log("Cek localStorage di menu.html:", loggedInUserCode);

        if (loggedInUserCode) {
            try {
                // const users = JSON.parse(usersData);
                // const loggedInUser = users.find(user => user.usercode === loggedInUserCode);

                // if (loggedInUser) {
                //     safeSetTextContent("greeting", `Hii ${loggedInUser.name} (${loggedInUser.usercode})`);
                //     document.getElementById("userNameDisplay").textContent = loggedInUser.name;
                // } else {
                    safeSetTextContent("greeting", "Hii " + loggedInUserCode);
                    document.getElementById("userNameDisplay").textContent = loggedInUserCode;
                // }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                safeSetTextContent("greeting", "Hii Guest");
                document.getElementById("userNameDisplay").textContent = "Guest";
            }
        } else {
            safeSetTextContent("greeting", "Hii Vaphat");
            document.getElementById("userNameDisplay").textContent = "Vaphat";
        }
    }

    // Toggle dropdown notifikasi
    document.getElementById("notificationBtn").addEventListener("click", function () {
        const dropdown = document.getElementById("notificationDropdown");
        dropdown.classList.toggle("hidden");
    });

    // Tutup dropdown jika klik di luar
    window.addEventListener("click", function (e) {
        const dropdown = document.getElementById("notificationDropdown");
        const btn = document.getElementById("notificationBtn");
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });

//</script>function loadDashboardAvatar() {
//    const savedAvatar = localStorage.getItem("userAvatar");
//    if (savedAvatar) {
//        document.getElementById("dashboardUserIcon").src = savedAvatar;
//    }
//}

function loadDashboard() {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    safeSetTextContent("totalDocs", documents.length);
    safeSetTextContent("openDocs", documents.filter(doc => doc.docStatus === "Open").length);
    safeSetTextContent("checkedDocs", documents.filter(doc => doc.docStatus === "Checked").length);
    safeSetTextContent("acknowledgeDocs", documents.filter(doc => doc.docStatus === "Acknowledge").length);
    safeSetTextContent("approvedDocs", documents.filter(doc => doc.docStatus === "Approved").length);
    safeSetTextContent("receivedDocs", documents.filter(doc => doc.docStatus === "Received").length);
}

function safeSetTextContent(id, value) {
    let el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function goToProfile() {
    window.location.href = "Profil.html";
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
}

function toggleSubMenu(menuId) {
    document.getElementById(menuId).classList.toggle("hidden");
}

// Fungsi Navigasi
function goToMenu() { window.location.href = "dashboard.html"; }
function goToAddDoc() { window.location.href = "AddDoc.html"; }
function goToAddReim() { window.location.href = "AddReim.html"; }
function goToAddCash() { window.location.href = "AddCash.html"; }
function goToAddSettle() { window.location.href = "AddSettle.html"; }
function goToAddPO() { window.location.href = "AddPO.html"; }
function goToMenuPR() { window.location.href = "MenuPR.html"; }
function goToMenuRegist() { window.location.href = "register.html"; }
function goToMenuUser() { window.location.href = "dashboard-users.html"; }
function goToMenuReim() { window.location.href = "MenuReim.html"; }
function goToMenuCash() { window.location.href = "MenuCash.html"; }
function goToMenuSettle() { window.location.href = "MenuSettle.html"; }
function goToApprovalReport() { window.location.href = "ApprovalReport.html"; }
function goToMenuPO() { window.location.href = "MenuPO.html"; }
function goToMenuInvoice() { window.location.href = "MenuInvoice.html"; }
function goToMenuBanking() { window.location.href = "MenuBanking.html"; }

function logout() { 
    localStorage.removeItem("loggedInUser"); 
    window.location.href = "Login.html"; 
}