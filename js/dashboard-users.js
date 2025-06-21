document.addEventListener('DOMContentLoaded', function() {
  // Initialize empty users array
  let users = [];
  let currentUserForReset = null;
  let fromApproval = false;
  let lastTransfer = null;
  
  // Set logged in user information in the header
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (loggedInUser) {
    document.getElementById('userName').textContent = loggedInUser.name || 'Admin User';
    document.getElementById('userAvatar').src = loggedInUser.avatar || '../image/profil.png';
  }
  
  // Get registered user data if available
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
              documents: parsedData.documents ? parsedData.documents.map(doc => doc.name) : []
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing stored data:', error);
    }
  }

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
              documents: []
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
  
  // Update UI elements
  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('totalItems').textContent = users.length;
  document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

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

  // Populate table with initial data
  populateTable(users);

  // Set up search functionality
  const searchInput = document.getElementById('search');
  const departmentFilter = document.getElementById('filter-department');
  const statusFilter = document.getElementById('filter-status');
  
  // Set default filter to 'is transfer' if coming from approval dashboard
  if (fromApproval && statusFilter) {
    statusFilter.value = 'is transfer';
    
    // Add a warning if user tries to change the status filter
    statusFilter.addEventListener('change', function() {
      if (fromApproval && this.value !== 'is transfer') {
        // Show confirmation dialog
        if (!confirm('You are viewing transferred users from Approval Dashboard. Changing the status filter will show all users. Continue?')) {
          // If user cancels, reset to 'is transfer'
          this.value = 'is transfer';
          return;
        }
        
        // If user confirms, remove the fromApproval flag
        fromApproval = false;
        
        // Remove the header notification
        const headerNotification = document.querySelector('.bg-blue-50.border-l-4.border-blue-400');
        if (headerNotification) {
          headerNotification.remove();
        }
      }
    });
  }
  
  function applyFilters() {
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const department = (departmentFilter?.value || '').toLowerCase();
    const status = (statusFilter?.value || '').toLowerCase();
    
    // Start with all users or only transferred users if coming from approval
    let filtered = fromApproval ? 
      users.filter(user => user.status === 'is transfer') : 
      [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.id.toLowerCase().includes(searchTerm) ||
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.department.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply department filter
    if (department) {
      filtered = filtered.filter(user => user.department.toLowerCase() === department);
    }
    
    // Apply status filter if not coming from approval or if explicitly changed
    if (status && (!fromApproval || status !== 'is transfer')) {
      filtered = filtered.filter(user => user.status.toLowerCase() === status);
    }
    
    populateTable(filtered);
    
    // Update displayed counts
    document.getElementById('startItem').textContent = filtered.length > 0 ? 1 : 0;
    document.getElementById('endItem').textContent = filtered.length;
    document.getElementById('totalItems').textContent = filtered.length;
  }
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  
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
    confirmResetBtn.addEventListener('click', function() {
      if (!currentUserForReset || !tempPasswordInput.value) {
        showNotification('Please generate a temporary password first', 'warning');
        return;
      }
      
      // Update user's password
      const userIndex = users.findIndex(u => u.id === currentUserForReset.id);
      if (userIndex !== -1) {
        users[userIndex].tempPassword = tempPasswordInput.value;
        users[userIndex].passwordReset = true;
        
        // Save to localStorage
        saveUsersToLocalStorage();
        
        // Show success notification
        showNotification('Password has been reset successfully. The user will be required to change it on next login.', 'success');
        
        // Close reset modal and show user details modal with updated info
        resetModal.classList.add('hidden');
        
        // Update current user for reset reference
        currentUserForReset = users[userIndex];
        
        // Show user details with updated password info
        showUserDetails(currentUserForReset);
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
    
    notification.className = `${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-md flex items-start transform transition-all duration-300 ease-in-out translate-x-full opacity-0`;
    
    notification.innerHTML = `
      <i class="fas ${icon} mt-0.5 mr-2"></i>
      <div class="flex-1">${message}</div>
      <button class="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none">
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
    
    // Format status display
    let statusDisplay = getStatusBadge(user.status);
    
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
            <div class="mt-1">${statusDisplay}</div>
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
            <span class="text-xs text-gray-500">Status</span>
            <p class="font-medium">${user.status === 'is transfer' ? 'Transferred' : user.status.charAt(0).toUpperCase() + user.status.slice(1)}</p>
          </div>
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
      if (user.status === 'is transfer') {
        row.className = 'bg-blue-50 hover:bg-blue-100 transition-colors duration-150';
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
      
      // Status
      const statusCell = document.createElement('td');
      statusCell.className = 'px-6 py-4 whitespace-nowrap';
      statusCell.innerHTML = getStatusBadge(user.status);
      row.appendChild(statusCell);
      
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
      
      // Only show Detail and Delete buttons
      actionsCell.innerHTML = `
        <button class="text-blue-600 hover:text-blue-900 mr-3 view-btn" data-id="${user.id}">
          <i class="fas fa-eye"></i> Detail
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
}); 