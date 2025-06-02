// navigasi.js - File untuk navigasi seluruh halaman sistem Expressiv

// Fungsi untuk merender navigasi
function renderNavigation() {
    // Data navigasi
    const navigationItems = [
        { title: "Dashboard", url: "/dashboard.html", icon: "fa-tachometer-alt" },
        { title: "Approval Dashboard", url: "/approval-dashboard.html", icon: "fa-check-circle" },
        { title: "Register", url: "/register.html", icon: "fa-user-plus" },
        
        // Menu PR (Purchase Request)
        { title: "Menu PR", url: "/menuPR.html", icon: "fa-file-invoice" },
        { title: "PR Receive", url: "/menuPRReceive.html", icon: "fa-inbox" },
        { title: "PR Check", url: "/menuPRCheck.html", icon: "fa-clipboard-check" },
        { title: "PR Acknowledge", url: "/menuPRAcknow.html", icon: "fa-thumbs-up" },
        { title: "PR Approve", url: "/menuPRApprove.html", icon: "fa-check" },
        
        // Menu Reimbursement
        { title: "Menu Reimbursement", url: "/menuReim.html", icon: "fa-money-bill-wave" },
        { title: "Reimbursement Check", url: "/menuReimCheck.html", icon: "fa-clipboard-check" },
        { title: "Reimbursement Acknowledge", url: "/menuReimAcknow.html", icon: "fa-thumbs-up" },
        { title: "Reimbursement Approve", url: "/menuReimApprove.html", icon: "fa-check" },
        
        // Menu Cash Advance
        { title: "Menu Cash Advance", url: "/menuCash.html", icon: "fa-hand-holding-usd" },
        { title: "Cash Advance Check", url: "/menuCashCheck.html", icon: "fa-clipboard-check" },
        { title: "Cash Advance Acknowledge", url: "/menuCashAcknow.html", icon: "fa-thumbs-up" },
        { title: "Cash Advance Approve", url: "/menuCashApprove.html", icon: "fa-check" },
        
        // Menu Settlement
        { title: "Menu Settlement", url: "/menuSettle.html", icon: "fa-file-invoice-dollar" },
        { title: "Settlement Check", url: "/menuSettleCheck.html", icon: "fa-clipboard-check" },
        { title: "Settlement Acknowledge", url: "/menuSettleAcknow.html", icon: "fa-thumbs-up" },
        { title: "Settlement Approve", url: "/menuSettleApprove.html", icon: "fa-check" },
        
        // Admin Menu
        { title: "User Management", url: "/dashboard-users.html", icon: "fa-users" },
        { title: "Role Management", url: "/dashboard-roles.html", icon: "fa-user-tag" }
    ];

    // Fungsi untuk mendapatkan base URL
    function getBaseUrl() {
        // Mendapatkan base URL dari lokasi saat ini
        const pathArray = window.location.pathname.split('/');
        const baseUrl = window.location.protocol + '//' + window.location.host;
        return baseUrl;
    }

    // Mendapatkan halaman aktif
    const currentPage = window.location.pathname.split('/').pop();
    const baseUrl = getBaseUrl();

    // Membuat elemen navigasi
    let navHTML = `
    <div class="sidebar">
        <div class="sidebar-header">
            <h3>Expressiv System</h3>
        </div>
        <ul class="nav flex-column">
    `;

    // Menambahkan item navigasi
    navigationItems.forEach(item => {
        const isActive = currentPage === item.url.split('/').pop() ? 'active' : '';
        navHTML += `
            <li class="nav-item">
                <a class="nav-link ${isActive}" href="${baseUrl}${item.url}">
                    <i class="fas ${item.icon}"></i> ${item.title}
                </a>
            </li>
        `;
    });

    navHTML += `
        </ul>
    </div>
    `;

    return navHTML;
}

// Fungsi untuk menyisipkan navigasi ke dalam dokumen
function initNavigation() {
    // Mencari elemen dengan id "navigation" atau membuat elemen baru jika tidak ada
    let navElement = document.getElementById('navigation');
    
    if (!navElement) {
        navElement = document.createElement('div');
        navElement.id = 'navigation';
        document.body.insertBefore(navElement, document.body.firstChild);
    }
    
    // Menyisipkan HTML navigasi
    navElement.innerHTML = renderNavigation();
    
    // Menambahkan event listener untuk toggle mobile menu (jika diperlukan)
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.getElementById('navigation').classList.toggle('collapsed');
        });
    }
}

// CSS untuk navigasi
function addNavigationStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .sidebar {
            background-color: #343a40;
            color: #fff;
            min-height: 100vh;
            width: 250px;
            position: fixed;
            top: 0;
            left: 0;
            padding: 0;
            z-index: 1000;
            transition: all 0.3s;
        }
        
        .sidebar-header {
            padding: 20px;
            background: #212529;
        }
        
        .sidebar-header h3 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .nav-link {
            color: #f8f9fa;
            padding: 10px 20px;
            transition: all 0.3s;
        }
        
        .nav-link:hover {
            background: #495057;
            color: #fff;
        }
        
        .nav-link.active {
            background: #007bff;
            color: #fff;
        }
        
        .nav-link i {
            margin-right: 10px;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .sidebar {
                width: 80px;
                text-align: center;
            }
            
            .sidebar-header h3 {
                display: none;
            }
            
            .nav-link span {
                display: none;
            }
            
            .nav-link i {
                margin-right: 0;
                font-size: 1.2rem;
            }
            
            .sidebar.collapsed {
                margin-left: -80px;
            }
        }
        
        /* Adjust main content to make space for sidebar */
        body {
            padding-left: 250px;
        }
        
        @media (max-width: 768px) {
            body {
                padding-left: 80px;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Inisialisasi saat dokumen siap
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    addNavigationStyles();
});

// Ekspos fungsi ke global scope untuk digunakan di halaman lain jika diperlukan
window.renderNavigation = renderNavigation;
window.initNavigation = initNavigation; 