document.addEventListener('DOMContentLoaded', function() {
  // Initialize empty users array
  let users = [];
  let currentUserForReset = null;
  let currentUserForRoles = null;
  let fromApproval = false;
  let lastTransfer = null;
  let departments = [];
  let roles = [];
  
  // Initialize page by loading users from API
  initializePage();
  
  // API Integration Functions
  async function initializePage() {
    try {
      showLoadingState();
      
      // Load data in parallel
      await Promise.all([
        loadUsersFromAPI(),
        loadDepartmentsFromAPI(),
        loadRolesFromAPI()
      ]);
      
      updateUICounters();
      populateDepartmentFilter();
      populateTable(users);
      hideLoadingState();
    } catch (error) {
      console.error('Error initializing page:', error);
      hideLoadingState();
      showNotification('Failed to load data from server. Falling back to local data.', 'warning');
      // Fall back to existing localStorage logic
      loadUsersFromLocalStorage();
    }
  }

  // Load users from API
  async function loadUsersFromAPI() {
    try {
      const response = await makeAuthenticatedRequest('/api/users', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const result = await response.json();
      const apiUsers = result.data || [];
      
      // Convert API users to frontend format
      users = await Promise.all(apiUsers.map(async user => ({
        id: user.kansaiEmployeeId || user.id || 'N/A',
        nik: user.kansaiEmployeeId || '',
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        fullName: user.fullName || `${user.firstName || ''} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName || ''}`.trim(),
        department: user.department || '',
        position: user.position || '',
        phone: user.phoneNumber || '',
        email: user.email || '',
        // Three separate status fields
        approvalStatus: user.approvalStatus || 'Pending',
        activeStatus: user.isActive ? 'Active' : 'Inactive',
        transferStatus: user.isTransfer ? 'Transferred' : 'Not Transferred',
        registeredDate: user.createdDate ? new Date(user.createdDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        password: '',
        tempPassword: '',
        passwordReset: false,
        documents: user.documents || [],
        // Additional API fields
        userId: user.id,
        isActive: user.isActive,
        isTransfer: user.isTransfer,
        emailConfirmed: user.emailConfirmed,
        // Fetch user roles
        userRoles: await getUserRoles(user.id).catch(() => [])
      })));
      
      console.log('Loaded users from API:', users);
      
    } catch (error) {
      console.error('Error loading users from API:', error);
      throw error;
    }
  }

  // Load departments from API
  async function loadDepartmentsFromAPI() {
    try {
      const response = await makeAuthenticatedRequest('/api/department', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const result = await response.json();
      if (result.status) {
        departments = result.data || [];
        console.log('Loaded departments from API:', departments);
      }
    } catch (error) {
      console.error('Error loading departments from API:', error);
      // Use fallback departments if API fails
      departments = [
        { id: '1', name: 'IT' },
        { id: '2', name: 'Finance' },
        { id: '3', name: 'Sales' },
        { id: '4', name: 'Marketing' },
        { id: '5', name: 'HR' }
      ];
    }
  }

  // Load roles from API
  async function loadRolesFromAPI() {
    try {
      const response = await makeAuthenticatedRequest('/api/roles', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const result = await response.json();
      if (result.status) {
        roles = result.data || [];
        console.log('Loaded roles from API:', roles);
      }
    } catch (error) {
      console.error('Error loading roles from API:', error);
      // Use fallback roles if API fails
      roles = ['Admin', 'User', 'Manager'];
    }
  }

  // Populate department filter dropdown
  function populateDepartmentFilter() {
    const departmentFilter = document.getElementById('filter-department');
    if (!departmentFilter) return;

    // Clear existing options except the first one ("All Departments")
    while (departmentFilter.children.length > 1) {
      departmentFilter.removeChild(departmentFilter.lastChild);
    }

    // Add departments from API
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = typeof dept === 'string' ? dept : dept.name;
      option.textContent = typeof dept === 'string' ? dept : dept.name;
      departmentFilter.appendChild(option);
    });
  }

  // Status badge helper functions for the three status types
  function getApprovalStatusBadge(status) {
    let className, icon;
    switch(status) {
      case 'Approved': 
        className = 'bg-green-100 text-green-800'; 
        icon = 'fa-check-circle'; 
        break;
      case 'Pending': 
        className = 'bg-yellow-100 text-yellow-800'; 
        icon = 'fa-clock'; 
        break;
      case 'Rejected':
        className = 'bg-red-100 text-red-800';
        icon = 'fa-times-circle';
        break;
      default: 
        className = 'bg-gray-100 text-gray-800'; 
        icon = 'fa-question-circle';
    }
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}">
              <i class="fas ${icon} mr-1"></i> ${status}
            </span>`;
  }

  function getActiveStatusBadge(status) {
    let className, icon;
    switch(status) {
      case 'Active': 
        className = 'bg-blue-100 text-blue-800'; 
        icon = 'fa-power-off'; 
        break;
      case 'Inactive': 
        className = 'bg-gray-100 text-gray-800'; 
        icon = 'fa-ban'; 
        break;
      default: 
        className = 'bg-gray-100 text-gray-800'; 
        icon = 'fa-question-circle';
    }
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}">
              <i class="fas ${icon} mr-1"></i> ${status}
            </span>`;
  }

  function getTransferStatusBadge(status) {
    let className, icon;
    switch(status) {
      case 'Transferred': 
        className = 'bg-purple-100 text-purple-800'; 
        icon = 'fa-paper-plane'; 
        break;
      case 'Not Transferred': 
        className = 'bg-gray-100 text-gray-800'; 
        icon = 'fa-home'; 
        break;
      default: 
        className = 'bg-gray-100 text-gray-800'; 
        icon = 'fa-question-circle';
    }
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}">
              <i class="fas ${icon} mr-1"></i> ${status}
            </span>`;
  }

  // Role badges helper function
  function getRoleBadges(userRoles) {
    if (!userRoles || userRoles.length === 0) {
      return '<span class="text-gray-400 text-xs italic">No roles</span>';
    }
    
    // Limit visible roles to prevent overflow
    const visibleRoles = userRoles.slice(0, 2);
    let badges = '';
    
    visibleRoles.forEach(role => {
      let className, icon;
      switch(role.toLowerCase()) {
        case 'admin':
          className = 'bg-red-100 text-red-800';
          icon = 'fa-crown';
          break;
        case 'manager':
          className = 'bg-blue-100 text-blue-800';
          icon = 'fa-user-tie';
          break;
        case 'user':
          className = 'bg-green-100 text-green-800';
          icon = 'fa-user';
          break;
        case 'hr':
          className = 'bg-purple-100 text-purple-800';
          icon = 'fa-users';
          break;
        case 'finance':
          className = 'bg-yellow-100 text-yellow-800';
          icon = 'fa-dollar-sign';
          break;
        default:
          className = 'bg-gray-100 text-gray-800';
          icon = 'fa-user-tag';
      }
      
      badges += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className} mr-1 mb-1">
                  <i class="fas ${icon} mr-1"></i> ${role}
                </span>`;
    });
    
    if (userRoles.length > 2) {
      badges += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +${userRoles.length - 2} more
                </span>`;
    }
    
    return badges;
  }

  // Show loading state
  function showLoadingState() {
    const tableBody = document.getElementById('userTableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" class="px-6 py-10 text-center text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <div>Loading users...</div>
          </td>
        </tr>
      `;
    }
  }

  // Hide loading state
  function hideLoadingState() {
    // Loading state will be replaced by actual data in populateTable
  }

  // Update UI counters
  function updateUICounters() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalItems').textContent = users.length;
    document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  // Load users from localStorage (fallback)
  function loadUsersFromLocalStorage() {
    // Existing localStorage logic...
    const storedData = localStorage.getItem('registrationData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.excelData) {
          parsedData.excelData.forEach((row, index) => {
            if (row && row.length >= 7) {
              users.push({
                id: row[0] || `NEW${index + 1}`,
                nik: row[1] || '',
                firstName: row[2] || '',
                middleName: row[3] || '',
                lastName: row[4] || '',
                fullName: `${row[2] || ''} ${row[3] ? row[3] + ' ' : ''}${row[4] || ''}`.trim(),
                department: row[5] || '',
                position: row[6] || '',
                phone: row[7] || '',
                email: row[8] || '',
                status: row[9] || 'pending',
                registeredDate: row[10] || new Date().toISOString().split('T')[0],
                password: row[11] || '',
                tempPassword: row[12] || '',
                passwordReset: row[13] || false,
                documents: parsedData.documents ? parsedData.documents.map(doc => doc.name) : [],
                userRoles: [] // Initialize empty roles for localStorage users
              });
            }
          });
        }
      } catch (error) {
        console.error('Error parsing stored data:', error);
      }
    }
    
    // Update UI after loading from localStorage
    updateUICounters();
    populateTable(users);
  }
  
  // Set logged in user information in the header
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (loggedInUser) {
    document.getElementById('userName').textContent = loggedInUser.name || 'Admin User';
    document.getElementById('userAvatar').src = loggedInUser.avatar || '../image/profil.png';
  }
  
  // Legacy localStorage logic moved to loadUsersFromLocalStorage() function

  // Check for transferred users from approval dashboard
  const userApprovals = localStorage.getItem('userApprovals');
  let newTransferredUsers = 0;
  
  if (userApprovals) {
    try {
      const approvalData = JSON.parse(userApprovals);
      const transferredUsers = approvalData.filter(user => user.status === 'is transfer');
      
      if (transferredUsers && transferredUsers.length > 0) {
        transferredUsers.forEach(user => {
          // Check if user already exists
          const existingUser = users.find(u => u.id === user.userId);
          if (!existingUser) {
            newTransferredUsers++;
            
            // Split name into parts (assuming format is "First Middle Last")
            const nameParts = user.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
            
            users.push({
              id: user.userId,
              nik: '',
              firstName: firstName,
              middleName: middleName,
              lastName: lastName,
              fullName: user.name,
              department: user.department,
              position: user.position,
              phone: user.phone || '',
              email: user.email || '',
              status: 'is transfer',
              registeredDate: user.transferDate || new Date().toISOString().split('T')[0],
              password: '',
              tempPassword: '',
              passwordReset: false,
              documents: [],
              userRoles: [] // Initialize empty roles for transferred users
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing approval data:', error);
    }
  }
  
  // Check if we came from approval dashboard with transferred users
  fromApproval = new URLSearchParams(window.location.search).get('from') === 'approval';
  lastTransfer = localStorage.getItem('lastTransfer');
  
  // UI elements will be updated in initializePage()

  // Check if we should show notification for transferred users
  if (fromApproval && lastTransfer) {
    try {
      const transferData = JSON.parse(lastTransfer);
      const transferTime = new Date(transferData.timestamp);
      const now = new Date();
      
      // If the transfer happened in the last 10 seconds, show notification
      if ((now - transferTime) < 10000) {
        showNotification(`${transferData.count} user berhasil ditransfer ke User Management`, 'success');
        
        // Clear the lastTransfer data to prevent showing the notification again
        localStorage.removeItem('lastTransfer');
        
        // Automatically set filter to show transferred users
        if (statusFilter) {
          statusFilter.value = 'is transfer';
        }
      }
    } catch (error) {
      console.error('Error parsing last transfer data:', error);
    }
  }

  // If coming from approval dashboard, only show transferred users
  if (fromApproval) {
    // Filter to only show transferred users
    users = users.filter(user => user.status === 'is transfer');
    
    // Update counts
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalItems').textContent = users.length;
    
    // Set status filter to "is transfer"
    if (statusFilter) {
      statusFilter.value = 'is transfer';
    }
    
    // Show a header notification
    const headerNotification = document.createElement('div');
    headerNotification.className = 'bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-md';
    headerNotification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-info-circle text-blue-400"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700">
            Showing ${users.length} transferred user(s) from Approval Dashboard.
            <a href="dashboard-users.html" class="font-medium underline text-blue-700 hover:text-blue-600">
              View all users
            </a>
          </p>
        </div>
      </div>
    `;
    
    // Insert notification at the top of the content
    const contentContainer = document.querySelector('.max-w-7xl.mx-auto.py-6');
    if (contentContainer && contentContainer.firstChild) {
      contentContainer.insertBefore(headerNotification, contentContainer.firstChild);
    }
  }

  // Table will be populated in initializePage()

  // Set up search functionality
  const searchInput = document.getElementById('search');
  const departmentFilter = document.getElementById('filter-department');
  const approvalStatusFilter = document.getElementById('filter-approval-status');
  const activeStatusFilter = document.getElementById('filter-active-status');
  const transferStatusFilter = document.getElementById('filter-transfer-status');
  
  // Legacy transfer logic removed - now handled by API
  
  function applyFilters() {
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const department = (departmentFilter?.value || '').toLowerCase();
    const approvalStatus = approvalStatusFilter?.value || '';
    const activeStatus = activeStatusFilter?.value || '';
    const transferStatus = transferStatusFilter?.value || '';
    
    // Start with all users
    let filtered = [...users];
    
    // Apply search filter (search by name, NIK, department)
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.id.toLowerCase().includes(searchTerm) ||
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.nik.toLowerCase().includes(searchTerm) ||
        user.department.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply department filter
    if (department) {
      filtered = filtered.filter(user => user.department.toLowerCase() === department);
    }
    
    // Apply approval status filter
    if (approvalStatus) {
      filtered = filtered.filter(user => user.approvalStatus === approvalStatus);
    }
    
    // Apply active status filter
    if (activeStatus) {
      filtered = filtered.filter(user => user.activeStatus === activeStatus);
    }
    
    // Apply transfer status filter
    if (transferStatus) {
      filtered = filtered.filter(user => user.transferStatus === transferStatus);
    }
    
    populateTable(filtered);
    
    // Update displayed counts
    document.getElementById('startItem').textContent = filtered.length > 0 ? 1 : 0;
    document.getElementById('endItem').textContent = filtered.length;
    document.getElementById('totalItems').textContent = filtered.length;
  }
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
  if (approvalStatusFilter) approvalStatusFilter.addEventListener('change', applyFilters);
  if (activeStatusFilter) activeStatusFilter.addEventListener('change', applyFilters);
  if (transferStatusFilter) transferStatusFilter.addEventListener('change', applyFilters);
  
  // User modal functionality
  const modal = document.getElementById('userDetailsModal');
  const resetModal = document.getElementById('resetPasswordModal');
  const closeModalBtn = document.getElementById('closeModal');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');
  const generatePasswordBtn = document.getElementById('generatePasswordBtn');
  const tempPasswordInput = document.getElementById('tempPassword');
  
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', () => {
      if (!currentUserForReset) return;
      
      // Generate a random temporary password
      const tempPassword = generateRandomPassword();
      document.getElementById('resetUserName').textContent = currentUserForReset.fullName;
      tempPasswordInput.value = tempPassword;
      
      // Show the temporary password input section
      const tempPasswordSection = document.querySelector('#tempPassword').closest('.mb-4');
      if (tempPasswordSection) {
        tempPasswordSection.style.display = 'block';
      }
      
      // Show reset password modal
      modal.classList.add('hidden');
      resetModal.classList.remove('hidden');
    });
  }
  
  if (cancelResetBtn && resetModal) {
    cancelResetBtn.addEventListener('click', () => {
      resetModal.classList.add('hidden');
      modal.classList.remove('hidden');
    });
  }
  
  if (generatePasswordBtn && tempPasswordInput) {
    generatePasswordBtn.addEventListener('click', () => {
      tempPasswordInput.value = generateRandomPassword();
    });
  }
  
  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', async function() {
      if (!currentUserForReset) {
        showNotification('No user selected for password reset', 'warning');
        return;
      }
      
      try {
        // Show loading state
        const originalText = confirmResetBtn.innerHTML;
        confirmResetBtn.disabled = true;
        confirmResetBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Resetting...';
        
        // Get the temporary password from the input
        const tempPassword = tempPasswordInput.value;
        if (!tempPassword) {
          showNotification('Please generate a temporary password first', 'warning');
          return;
        }
        
        // Call API to reset password with temporary password
        const response = await makeAuthenticatedRequest('/api/authentication/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            targetUserId: currentUserForReset.userId,
            tempPassword: tempPassword
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to reset password');
        }
        
        const result = await response.json();
        
        if (result.status && result.code === 200) {
          // Update user's local data
          const userIndex = users.findIndex(u => u.id === currentUserForReset.id);
          if (userIndex !== -1) {
            users[userIndex].passwordReset = true;
            users[userIndex].tempPassword = tempPassword;
          }
          
          // Show success notification
          showNotification('Password has been reset successfully. The user will be required to create a new password on next login.', 'success');
          
          // Close reset modal and show user details modal with updated info
          resetModal.classList.add('hidden');
          
          // Update current user for reset reference
          if (userIndex !== -1) {
            currentUserForReset = users[userIndex];
          }
          
          // Show user details with updated password info
          showUserDetails(currentUserForReset);
        } else {
          throw new Error(result.message || 'Password reset failed');
        }
        
        // Restore button state
        confirmResetBtn.disabled = false;
        confirmResetBtn.innerHTML = originalText;
        
      } catch (error) {
        console.error('Password reset error:', error);
        showNotification('Failed to reset password. Please try again.', 'error');
        
        // Restore button state
        confirmResetBtn.disabled = false;
        confirmResetBtn.innerHTML = 'Reset Password';
      }
    });
  }
  
  // Function to generate a random password
  function generateRandomPassword() {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one character from each category
    password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // lowercase
    password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // uppercase
    password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // number
    password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // special
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    return password;
  }
  
  // Function to save users to localStorage
  function saveUsersToLocalStorage() {
    // Convert users array to excelData format
    const excelData = users.map(user => [
      user.id,
      user.nik,
      user.firstName,
      user.middleName,
      user.lastName,
      user.department,
      user.position,
      user.phone,
      user.email,
      user.status,
      user.registeredDate,
      user.password,
      user.tempPassword,
      user.passwordReset
    ]);
    
    // Create registration data object
    const registrationData = {
      excelData: excelData,
      documents: users.map(user => ({ name: user.documents.join(', ') }))
    };
    
    // Save to localStorage
    localStorage.setItem('registrationData', JSON.stringify(registrationData));
  }
  
  // Status badge helper function
  function getStatusBadge(status) {
    let className, icon;
    switch(status.toLowerCase()) {
      case 'active': 
        className = 'bg-green-100 text-green-800'; 
        icon = 'fa-check-circle'; 
        break;
      case 'pending': 
        className = 'bg-yellow-100 text-yellow-800'; 
        icon = 'fa-clock'; 
        break;
      case 'inactive': 
        className = 'bg-red-100 text-red-800'; 
        icon = 'fa-ban'; 
        break;
      case 'rejected':
        className = 'bg-red-100 text-red-800';
        icon = 'fa-times-circle';
        break;
      case 'is transfer':
        className = 'bg-blue-100 text-blue-800';
        icon = 'fa-paper-plane';
        break;
      default: 
        className = 'bg-gray-100 text-gray-800'; 
        icon = 'fa-question-circle';
    }
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}">
              <i class="fas ${icon} mr-1"></i> ${status === 'is transfer' ? 'Transferred' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>`;
  }
  
  // Document badges helper function
  function getDocBadges(docs) {
    if (!docs || docs.length === 0) return '<span class="text-gray-400 text-xs italic">No documents</span>';
    
    const visibleDocs = docs.slice(0, 2);
    let badges = '';
    
    visibleDocs.forEach(doc => {
      let icon = 'fa-file';
      if (doc.endsWith('.pdf')) icon = 'fa-file-pdf';
      else if (doc.match(/\.(jpg|jpeg|png|gif)$/i)) icon = 'fa-file-image';
      
      badges += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1">
                  <i class="fas ${icon} mr-1"></i> ${doc.split('.')[0]}
                </span>`;
    });
    
    if (docs.length > 2) {
      badges += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +${docs.length - 2} more
                </span>`;
    }
    
    return badges;
  }
  
  function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    
    // Set classes based on type
    let bgColor, textColor, icon;
    console.log(type);
    switch (type) {
      case 'success':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = 'fa-check-circle';
        break;
      case 'error':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        icon = 'fa-times-circle';
        break;
      case 'warning':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = 'fa-exclamation-triangle';
        break;
      default:
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        icon = 'fa-info-circle';
    }
    
    // Set close button color based on type
    let closeButtonColor = 'text-gray-400 hover:text-gray-600';
    if (type === 'success') {
      closeButtonColor = 'text-green-400 hover:text-green-600';
    } else if (type === 'error') {
      closeButtonColor = 'text-red-400 hover:text-red-600';
    } else if (type === 'warning') {
      closeButtonColor = 'text-yellow-400 hover:text-yellow-600';
    }
    
    notification.className = `${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-md flex items-start transform transition-all duration-300 ease-in-out translate-x-full opacity-0`;
    
    notification.innerHTML = `
      <i class="fas ${icon} mt-0.5 mr-2"></i>
      <div class="flex-1">${message}</div>
      <button class="ml-4 ${closeButtonColor} focus:outline-none">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Add click listener to close button
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => {
      closeNotification(notification);
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
      closeNotification(notification);
    }, 5000);
  }
  
  function closeNotification(notification) {
    notification.classList.add('opacity-0', 'translate-x-full');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  
  // Function to show user details in a modal
  function showUserDetails(user) {
    if (!user || !modal) return;
    
    // Set current user for reset password functionality
    currentUserForReset = user;
    
    // Update modal title to include user's name
    document.querySelector('#modal-title').textContent = `User Details: ${user.fullName}`;
    
    // Update modal content
    const userDetailsContent = document.getElementById('userDetailsContent');
    if (!userDetailsContent) return;
    
    // Format status displays
    let statusDisplays = `
      <div class="flex flex-wrap gap-2">
        ${getApprovalStatusBadge(user.approvalStatus)}
        ${getActiveStatusBadge(user.activeStatus)}
        ${getTransferStatusBadge(user.transferStatus)}
      </div>
    `;
    
    // Format documents display
    let documentsDisplay = '';
    if (user.documents && user.documents.length > 0) {
      documentsDisplay = '<div class="mt-3"><h5 class="text-sm font-medium text-gray-700 mb-1">Documents</h5><div class="flex flex-wrap">';
      user.documents.forEach(doc => {
        let icon = 'fa-file';
        if (doc.endsWith('.pdf')) icon = 'fa-file-pdf';
        else if (doc.match(/\.(jpg|jpeg|png|gif)$/i)) icon = 'fa-file-image';
        
        documentsDisplay += `
          <a href="#" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2 mb-2 hover:bg-gray-200">
            <i class="fas ${icon} mr-1"></i> ${doc}
          </a>
        `;
      });
      documentsDisplay += '</div></div>';
    }
    
    // Password reset status
    let passwordResetInfo = '';
    if (user.passwordReset) {
      passwordResetInfo = `
        <div class="mt-4 p-3 bg-yellow-50 rounded-md">
          <p class="text-sm text-yellow-700">
            <i class="fas fa-exclamation-triangle mr-1"></i> This user's password has been reset. They will be required to change it on next login.
          </p>
          <p class="text-sm text-yellow-700 mt-1">
            <strong>Temporary password:</strong> ${user.tempPassword || '[Hidden]'}
          </p>
        </div>
      `;
    }
    
    // Create HTML content for the modal
    userDetailsContent.innerHTML = `
      <div class="bg-gray-50 p-4 rounded-lg mb-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-gray-500 text-2xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-medium text-gray-900">${user.fullName}</h3>
            <p class="text-sm text-gray-500">${user.position} at ${user.department}</p>
            <div class="mt-1">${statusDisplays}</div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Personal Information</h5>
          <div class="space-y-2">
            <div>
              <span class="text-xs text-gray-500">Employee ID</span>
              <p class="font-medium">${user.id}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">NIK</span>
              <p class="font-medium">${user.nik || '-'}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Full Name</span>
              <p class="font-medium">${user.fullName}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-2">Contact Information</h5>
          <div class="space-y-2">
            <div>
              <span class="text-xs text-gray-500">Email</span>
              <p class="font-medium">${user.email}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Phone</span>
              <p class="font-medium">${user.phone || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      
              <div class="mt-4">
          <h5 class="text-sm font-medium text-gray-700 mb-2">Employment Details</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span class="text-xs text-gray-500">Department</span>
              <p class="font-medium">${user.department}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Position</span>
              <p class="font-medium">${user.position}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Registered Date</span>
              <p class="font-medium">${formatDate(user.registeredDate)}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Approval Status</span>
              <p class="font-medium">${user.approvalStatus}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Active Status</span>
              <p class="font-medium">${user.activeStatus}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Transfer Status</span>
              <p class="font-medium">${user.transferStatus}</p>
            </div>
          </div>
        </div>
        
        <div class="mt-4">
          <h5 class="text-sm font-medium text-gray-700 mb-2">User Roles</h5>
          <div class="flex flex-wrap">
            ${getRoleBadges(user.userRoles)}
          </div>
        </div>
      
      ${documentsDisplay}
      
      ${passwordResetInfo}
    `;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Enable reset password button
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) {
      resetPasswordBtn.classList.remove('hidden');
      resetPasswordBtn.disabled = false;
    }
  }
  
  // Helper function to format date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  // Function to populate the table with user data
  function populateTable(data) {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Update pagination info
    document.getElementById('startItem').textContent = data.length > 0 ? 1 : 0;
    document.getElementById('endItem').textContent = data.length;
    document.getElementById('totalItems').textContent = data.length;
    
    // Add data rows
    data.forEach(user => {
      const row = document.createElement('tr');
      
      // Add special class for transferred users
      if (user.transferStatus === 'Transferred') {
        row.className = 'bg-purple-50 hover:bg-purple-100 transition-colors duration-150';
      } else {
        row.className = 'hover:bg-gray-50 transition-colors duration-150';
      }
      
      // Employee ID
      const idCell = document.createElement('td');
      idCell.className = 'px-6 py-4 whitespace-nowrap';
      idCell.innerHTML = `<div class="text-sm font-medium text-gray-900">${user.id}</div>`;
      row.appendChild(idCell);
      
      // Name
      const nameCell = document.createElement('td');
      nameCell.className = 'px-6 py-4 whitespace-nowrap';
      nameCell.innerHTML = `
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <i class="fas fa-user text-gray-500"></i>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${user.fullName}</div>
          </div>
        </div>
      `;
      row.appendChild(nameCell);
      
      // NIK
      const nikCell = document.createElement('td');
      nikCell.className = 'px-6 py-4 whitespace-nowrap';
      nikCell.innerHTML = `<div class="text-sm text-gray-900">${user.nik || '-'}</div>`;
      row.appendChild(nikCell);
      
      // Department
      const deptCell = document.createElement('td');
      deptCell.className = 'px-6 py-4 whitespace-nowrap';
      deptCell.innerHTML = `<div class="text-sm text-gray-900">${user.department}</div>`;
      row.appendChild(deptCell);
      
      // Position
      const posCell = document.createElement('td');
      posCell.className = 'px-6 py-4 whitespace-nowrap';
      posCell.innerHTML = `<div class="text-sm text-gray-900">${user.position}</div>`;
      row.appendChild(posCell);
      
      // Phone
      const phoneCell = document.createElement('td');
      phoneCell.className = 'px-6 py-4 whitespace-nowrap';
      phoneCell.innerHTML = `<div class="text-sm text-gray-500">${user.phone || '-'}</div>`;
      row.appendChild(phoneCell);
      
      // Email
      const emailCell = document.createElement('td');
      emailCell.className = 'px-6 py-4 whitespace-nowrap';
      emailCell.innerHTML = `<div class="text-sm text-gray-500">${user.email}</div>`;
      row.appendChild(emailCell);
      
      // Approval Status
      const approvalStatusCell = document.createElement('td');
      approvalStatusCell.className = 'px-6 py-4 whitespace-nowrap';
      approvalStatusCell.innerHTML = getApprovalStatusBadge(user.approvalStatus);
      row.appendChild(approvalStatusCell);
      
      // Active Status
      const activeStatusCell = document.createElement('td');
      activeStatusCell.className = 'px-6 py-4 whitespace-nowrap';
      activeStatusCell.innerHTML = getActiveStatusBadge(user.activeStatus);
      row.appendChild(activeStatusCell);
      
      // Transfer Status
      const transferStatusCell = document.createElement('td');
      transferStatusCell.className = 'px-6 py-4 whitespace-nowrap';
      transferStatusCell.innerHTML = getTransferStatusBadge(user.transferStatus);
      row.appendChild(transferStatusCell);
      
      // Roles
      const rolesCell = document.createElement('td');
      rolesCell.className = 'px-6 py-4 whitespace-nowrap';
      rolesCell.innerHTML = getRoleBadges(user.userRoles);
      row.appendChild(rolesCell);
      
      // Registered Date
      const dateCell = document.createElement('td');
      dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      dateCell.textContent = formatDate(user.registeredDate);
      row.appendChild(dateCell);
      
      // Documents
      const docsCell = document.createElement('td');
      docsCell.className = 'px-6 py-4 whitespace-nowrap';
      docsCell.innerHTML = getDocBadges(user.documents);
      row.appendChild(docsCell);
      
      // Actions
      const actionsCell = document.createElement('td');
      actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
      
      // Show Detail, Assign Roles, and Delete buttons
      actionsCell.innerHTML = `
        <button class="text-blue-600 hover:text-blue-900 mr-3 view-btn" data-id="${user.id}">
          <i class="fas fa-eye"></i> Detail
        </button>
        <button class="text-purple-600 hover:text-purple-900 mr-3 roles-btn" data-id="${user.id}" data-user-id="${user.userId}">
          <i class="fas fa-user-shield"></i> Assign Roles
        </button>
        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${user.id}">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      `;
      
      row.appendChild(actionsCell);
      
      // Add the row to the table
      tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-btn').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.dataset.id;
        const user = users.find(u => u.id === userId);
        if (user) {
          showUserDetails(user);
        }
      });
    });
    
    document.querySelectorAll('.roles-btn').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.dataset.id;
        const apiUserId = this.dataset.userId;
        const user = users.find(u => u.id === userId);
        if (user) {
          showRoleAssignmentModal(user, apiUserId);
        }
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.dataset.id;
        if (confirm('Are you sure you want to delete this user?')) {
          const index = users.findIndex(u => u.id === userId);
          if (index !== -1) {
            users.splice(index, 1);
            saveUsersToLocalStorage();
            populateTable(users);
            document.getElementById('totalUsers').textContent = users.length;
            showNotification('User deleted successfully', 'success');
          }
        }
      });
    });
  }

  // Role assignment functions
  async function getUserRoles(userId) {
    try {
      const response = await makeAuthenticatedRequest(`/api/roles/user/${userId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }
      
      const result = await response.json();
      return result.status ? result.data || [] : [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }

  // Refresh user roles for all users
  async function refreshAllUserRoles() {
    try {
      showLoadingState();
      
      // Update roles for all users
      for (let i = 0; i < users.length; i++) {
        if (users[i].userId) {
          users[i].userRoles = await getUserRoles(users[i].userId);
        }
      }
      
      // Refresh the table
      applyFilters();
      hideLoadingState();
      
      showNotification('User roles refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing user roles:', error);
      hideLoadingState();
      showNotification('Failed to refresh user roles', 'error');
    }
  }

  async function assignRolesToUser(userId, rolesToAssign, rolesToRemove) {
    try {
      const promises = [];
      
      // Assign new roles
      if (rolesToAssign.length > 0) {
        const assignResponse = await makeAuthenticatedRequest(`/api/roles/user/${userId}/assign-multiple`, {
          method: 'POST',
          body: JSON.stringify(rolesToAssign)
        });
        promises.push(assignResponse);
      }
      
      // Remove roles
      if (rolesToRemove.length > 0) {
        const removeResponse = await makeAuthenticatedRequest(`/api/roles/user/${userId}/remove-multiple`, {
          method: 'POST',
          body: JSON.stringify(rolesToRemove)
        });
        promises.push(removeResponse);
      }
      
      const responses = await Promise.all(promises);
      
      // Check if all operations were successful
      for (const response of responses) {
        if (!response.ok) {
          throw new Error(`Role assignment failed: ${response.status}`);
        }
        const result = await response.json();
        if (!result.status) {
          throw new Error(result.message || 'Role assignment failed');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error assigning roles:', error);
      throw error;
    }
  }

  function showRoleAssignmentModal(user, apiUserId) {
    currentUserForRoles = { ...user, apiUserId };
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'role-assignment-modal';
    overlay.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center';
    
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
            <i class="fas fa-user-shield text-purple-600 text-xl"></i>
          </div>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-4 text-center">Assign Roles</h3>
        <p class="text-sm text-gray-500 mb-4 text-center">
          Manage roles for <strong>${user.fullName}</strong>
        </p>
        
        <div id="roles-loading" class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-gray-400"></i>
          <p class="text-sm text-gray-500 mt-2">Loading roles...</p>
        </div>
        
        <div id="roles-content" class="hidden">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Available Roles</label>
            <div id="roles-list" class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              <!-- Roles will be populated here -->
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button id="cancel-roles" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button id="save-roles" class="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700">
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    // Load user roles and populate modal
    loadUserRolesForModal(apiUserId);

    // Handle cancel
    overlay.querySelector('#cancel-roles').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Handle save
    overlay.querySelector('#save-roles').addEventListener('click', async () => {
      await saveRoleChanges(overlay, apiUserId);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  async function loadUserRolesForModal(apiUserId) {
    const loadingDiv = document.getElementById('roles-loading');
    const contentDiv = document.getElementById('roles-content');
    const rolesList = document.getElementById('roles-list');
    
    try {
      // Get user's current roles
      const userRoles = await getUserRoles(apiUserId);
      
      // Hide loading, show content
      loadingDiv.classList.add('hidden');
      contentDiv.classList.remove('hidden');
      
      // Populate roles list
      rolesList.innerHTML = '';
      
      roles.forEach(role => {
        const roleItem = document.createElement('div');
        roleItem.className = 'flex items-center';
        
        const isChecked = userRoles.includes(role);
        
        roleItem.innerHTML = `
          <input type="checkbox" id="role-${role}" class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" ${isChecked ? 'checked' : ''}>
          <label for="role-${role}" class="ml-2 text-sm text-gray-700">${role}</label>
        `;
        
        rolesList.appendChild(roleItem);
      });
      
    } catch (error) {
      console.error('Error loading user roles:', error);
      loadingDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle text-red-400"></i>
        <p class="text-sm text-red-500 mt-2">Failed to load roles</p>
      `;
    }
  }

  async function saveRoleChanges(overlay, apiUserId) {
    const saveBtn = overlay.querySelector('#save-roles');
    const originalText = saveBtn.innerHTML;
    
    try {
      // Show loading state
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
      saveBtn.disabled = true;
      
      // Get current selections
      const checkboxes = overlay.querySelectorAll('input[type="checkbox"]');
      const selectedRoles = [];
      const userRoles = await getUserRoles(apiUserId);
      
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const role = checkbox.id.replace('role-', '');
          selectedRoles.push(role);
        }
      });
      
      // Determine what needs to be added/removed
      const rolesToAssign = selectedRoles.filter(role => !userRoles.includes(role));
      const rolesToRemove = userRoles.filter(role => !selectedRoles.includes(role));
      
      if (rolesToAssign.length === 0 && rolesToRemove.length === 0) {
        showNotification('No changes to save', 'info');
        document.body.removeChild(overlay);
        return;
      }
      
      // Save changes
      await assignRolesToUser(apiUserId, rolesToAssign, rolesToRemove);
      
      // Update user roles in the local users array
      const userIndex = users.findIndex(u => u.userId === apiUserId);
      if (userIndex !== -1) {
        users[userIndex].userRoles = selectedRoles;
      }
      
      // Refresh the table to show updated roles
      applyFilters();
      
      // Show success message
      const changeCount = rolesToAssign.length + rolesToRemove.length;
      showNotification(`Role assignment updated successfully (${changeCount} changes)`, 'success');
      
      // Close modal
      document.body.removeChild(overlay);
      
    } catch (error) {
      console.error('Error saving role changes:', error);
      showNotification('Failed to update role assignment', 'error');
      
      // Restore button state
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  }
}); 