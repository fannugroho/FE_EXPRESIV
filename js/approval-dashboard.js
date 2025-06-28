document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  // Initialize empty approvals array
  let approvals = [];
  let selectedRejectedUsers = []; // Array to store selected rejected users
  let selectedApprovedUsers = []; // Array to store selected approved users
  
  // Set logged in user information in the header
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (loggedInUser) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = loggedInUser.name || 'Admin User';
    }
    // Avatar is already set to default image
  }

  // Element references
  const approvalTableBody = document.getElementById('approval-table-body');
  const approvalTable = document.getElementById('approval-table');
  const emptyState = document.getElementById('empty-state');
  const pendingCountEl = document.getElementById('pendingCount');
  const approvedCountEl = document.getElementById('approvedCount');
  const rejectedCountEl = document.getElementById('rejectedCount');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('approval-search');
  
  // Modal elements
  const approvalModal = document.getElementById('approvalModal');
  const modalContent = document.getElementById('modal-content');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const approveBtn = document.getElementById('approve-btn');
  const rejectBtn = document.getElementById('reject-btn');

  // Current filter
  let currentFilter = 'all';
  let currentApprovals = [...approvals];
  
  // Initialize the dashboard
  async function initDashboard() {
    try {
      await loadAllUsers();
      updateCounters();
      renderApprovalTable(currentApprovals);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      showNotification('Failed to load user data', 'error');
    }
  }

  // Load users by approval status from the backend
  async function loadUsersByStatus(status = 'all') {
    try {
      console.log(`Loading users with status: ${status}`);
      const response = await makeAuthenticatedRequest(`/api/users/by-approval-status?status=${status}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Handle different response formats - sometimes the API returns data directly
      let users = [];
      if (result.success === true || result.success === undefined) {
        // If result has success=true or no success field, check for data
        const userData = result.data || result || [];
        
        // Ensure userData is an array
        if (!Array.isArray(userData)) {
          console.warn('API returned non-array data:', userData);
          return [];
        }
        
        users = userData.map(user => {
          let userStatus = 'pending';
          if (user.approvalStatus) {
            switch(user.approvalStatus.toLowerCase()) {
              case 'approved': userStatus = 'approved'; break;
              case 'rejected': userStatus = 'rejected'; break;
              default: userStatus = 'pending'; break;
            }
          }
          
          return {
            id: user.id,
            userId: user.kansaiEmployeeId || user.username,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            department: user.department || 'Not specified',
            position: user.position || 'Not specified',
            email: user.email || 'Not specified',
            phone: user.phoneNumber || 'Not specified',
            status: userStatus,
            submittedDate: user.createdDate ? formatDate(user.createdDate) : formatDate(new Date().toISOString()),
            documents: user.documents || [],
            rejectionReason: user.rejectionReason,
            approvalDate: user.approvalDate,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            emailConfirmed: user.emailConfirmed
          };
        });
        return users;
      } else {
        // Only throw error if success is explicitly false
        throw new Error(result.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users', 'error');
      return [];
    }
  }

  // Load all users (for initial load and counters)
  async function loadAllUsers() {
    try {
      approvals = await loadUsersByStatus('all');
      currentApprovals = [...approvals];
    } catch (error) {
      console.error('Error loading all users:', error);
      approvals = [];
      currentApprovals = [];
    }
  }

  // Set up event listeners
  filterButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active-filter'));
      
      // Add active class to clicked button
      button.classList.add('active-filter');
      
      // Get filter value from button id
      currentFilter = button.id.replace('-btn', '');
      
      // Load data by specific status for better performance
      try {
        if (currentFilter === 'all') {
          await loadAllUsers();
        } else {
          const users = await loadUsersByStatus(currentFilter);
          currentApprovals = users;
        }
        
        // Apply search filter if there's a search term
        applyFilters();
      } catch (error) {
        console.error('Error loading filtered data:', error);
        showNotification('Failed to load filtered data', 'error');
      }
      // Apply filters
      applyFilters();
      
      // Show/hide bulk action buttons based on filter
      toggleBulkActionButtons();
    });
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  // Close modal handlers
  if (closeModalBtn && approvalModal) {
    // Close button handler
    closeModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !approvalModal.classList.contains('hidden')) {
        closeModal();
      }
    });
    
    // Close modal when clicking ONLY on the gray overlay background
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }
    
    // Prevent modal from closing when clicking inside the modal content
    const modalDialog = document.getElementById('modal-dialog');
    if (modalDialog) {
      modalDialog.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    // Prevent any clicks within the modal container from bubbling
    approvalModal.addEventListener('click', (e) => {
      // Only close if the click is directly on the modal container itself
      // (not on any child elements)
      if (e.target === approvalModal) {
        closeModal();
      }
    });
  }
  
  // Approve button
  if (approveBtn) {
    approveBtn.addEventListener('click', async () => {
      const userId = approveBtn.dataset.userId;
      if (userId) {
        showApproveConfirmDialog(userId);
      }
    });
  }
  
  // Reject button
  if (rejectBtn) {
    rejectBtn.addEventListener('click', async () => {
      const userId = rejectBtn.dataset.userId;
      if (userId) {
        // Show rejection reason dialog
        showRejectionDialog(userId);
      }
    });
  }
  
  // Add bulk action buttons to the page
  function addBulkActionButtons() {
    // Check if buttons already exist
    if (document.getElementById('bulk-actions-container')) {
      return;
    }
    
    const bulkActionsContainer = document.createElement('div');
    bulkActionsContainer.id = 'bulk-actions-container';
    bulkActionsContainer.className = 'bg-white p-4 rounded-lg shadow-sm mb-6 hidden';
    
    // Different content based on current filter
    if (currentFilter === 'rejected') {
      bulkActionsContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-700">Use checkboxes to select users</span>
            <span class="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full" id="selected-count">0 selected</span>
          </div>
          <div>
            <button id="restore-selected-btn" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2">
              <i class="fas fa-undo mr-2"></i> Restore to Pending
            </button>
            <button id="delete-selected-btn" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <i class="fas fa-trash-alt mr-2"></i> Delete Selected
            </button>
          </div>
        </div>
      `;
    } else if (currentFilter === 'approved') {
      bulkActionsContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-700">Use checkboxes to select users</span>
            <span class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full" id="selected-count">0 selected</span>
          </div>
          <div>
            <button id="submit-selected-btn" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <i class="fas fa-paper-plane mr-2"></i> Submit to User Management
            </button>
          </div>
        </div>
      `;
    }
    
    // Insert after filters
    const filtersContainer = document.querySelector('.bg-white.p-4.rounded-lg.shadow-sm.mb-6');
    if (filtersContainer && filtersContainer.parentNode) {
      filtersContainer.parentNode.insertBefore(bulkActionsContainer, filtersContainer.nextSibling);
      
      // Add event listeners based on current filter
      if (currentFilter === 'rejected') {
        const restoreSelectedBtn = document.getElementById('restore-selected-btn');
        const deleteSelectedBtn = document.getElementById('delete-selected-btn');
        
        if (restoreSelectedBtn) {
          restoreSelectedBtn.addEventListener('click', function() {
            if (selectedRejectedUsers.length === 0) {
              showNotification('Please select users first', 'warning');
              return;
            }
            
            // Confirm restoration
            if (confirm(`Are you sure you want to restore ${selectedRejectedUsers.length} user(s) to pending status?`)) {
              // Store the count before clearing
              const restoredCount = selectedRejectedUsers.length;
              
              // Restore each selected user
              selectedRejectedUsers.forEach(userId => {
                updateApprovalStatus(userId, 'pending');
              });
              
              // Clear selection array
              selectedRejectedUsers = [];
              
              // Show notification
              showNotification(`${restoredCount} user(s) restored to pending status`, 'success');
              
              // Re-render with current filter
              applyFilters();
            }
          });
        }
        
        if (deleteSelectedBtn) {
          deleteSelectedBtn.addEventListener('click', function() {
            if (selectedRejectedUsers.length === 0) {
              showNotification('Please select users first', 'warning');
              return;
            }
            
            // Confirm deletion
            if (confirm(`Are you sure you want to permanently delete ${selectedRejectedUsers.length} user(s)? This action cannot be undone.`)) {
              // Store the count before clearing
              const deletedCount = selectedRejectedUsers.length;
              
              // Remove each selected user
              approvals = approvals.filter(user => !selectedRejectedUsers.includes(user.id));
              
              // Update localStorage
              updateLocalStorage();
              
              // Clear selection array
              selectedRejectedUsers = [];
              
              // Show notification
              showNotification(`${deletedCount} user(s) permanently deleted`, 'success');
              
              // Re-render with current filter
              applyFilters();
              
              // Update counters
              updateCounters();
            }
          });
        }
      } else if (currentFilter === 'approved') {
        const submitSelectedBtn = document.getElementById('submit-selected-btn');
        
        if (submitSelectedBtn) {
          submitSelectedBtn.addEventListener('click', function() {
            if (selectedApprovedUsers.length === 0) {
              showNotification('Please select users first', 'warning');
              return;
            }
            
            // Confirm submission
            if (confirm(`Are you sure you want to submit ${selectedApprovedUsers.length} user(s) to User Management?`)) {
              // Transfer users to User Management
              transferUsersToUserManagement(selectedApprovedUsers);
              
              // Show notification
              showNotification(`${selectedApprovedUsers.length} user(s) submitted to User Management`, 'success');
              
              // Clear selection array
              selectedApprovedUsers = [];
              
              // Re-render with current filter
              applyFilters();
            }
          });
        }
      }
      
      // Update selected count display
      updateSelectedCount();
    }
  }
  
  // Update selected count display
  function updateSelectedCount() {
    const selectedCountEl = document.getElementById('selected-count');
    if (!selectedCountEl) return;
    
    if (currentFilter === 'rejected') {
      selectedCountEl.textContent = `${selectedRejectedUsers.length} selected`;
    } else if (currentFilter === 'approved') {
      selectedCountEl.textContent = `${selectedApprovedUsers.length} selected`;
    }
  }
  
  // Toggle bulk action buttons based on current filter
  function toggleBulkActionButtons() {
    // Remove existing bulk action buttons
    const existingContainer = document.getElementById('bulk-actions-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Only add bulk action buttons for rejected and approved filters
    if (currentFilter === 'rejected' || currentFilter === 'approved') {
      addBulkActionButtons();
      
      // Show the container
      const bulkActionsContainer = document.getElementById('bulk-actions-container');
      if (bulkActionsContainer) {
        bulkActionsContainer.classList.remove('hidden');
      }
    }
    
    // Update checkbox visibility in table
    const table = document.getElementById('approval-table');
    if (table) {
      // Show/hide the checkbox header column
      const headerCheckboxCell = table.querySelector('thead tr th:first-child');
      if (headerCheckboxCell) {
        if (currentFilter === 'rejected' || currentFilter === 'approved') {
          headerCheckboxCell.classList.remove('hidden');
        } else {
          headerCheckboxCell.classList.add('hidden');
        }
      }
      
      // Show/hide checkbox cells in rows
      const checkboxCells = table.querySelectorAll('tbody tr td:first-child');
      checkboxCells.forEach(cell => {
        if (currentFilter === 'rejected' || currentFilter === 'approved') {
          cell.classList.remove('hidden');
        } else {
          cell.classList.add('hidden');
        }
      });
    }
  }
  
  // Transfer users to User Management
  function transferUsersToUserManagement(userIds) {
    // Get existing user approvals from localStorage
    let userApprovals = [];
    const storedApprovals = localStorage.getItem('userApprovals');
    
    if (storedApprovals) {
      try {
        userApprovals = JSON.parse(storedApprovals);
      } catch (error) {
        console.error('Error parsing user approvals:', error);
        userApprovals = [];
      }
    }
    
    // Find users to transfer
    const usersToTransfer = approvals.filter(user => userIds.includes(user.id));
    
    // Mark users as transferred
    usersToTransfer.forEach(user => {
      const index = approvals.findIndex(a => a.id === user.id);
      if (index !== -1) {
        // Update status to is transfer
        approvals[index].status = 'is transfer';
        approvals[index].transferDate = new Date().toISOString().split('T')[0];
        approvals[index].transferredBy = JSON.parse(localStorage.getItem('loggedInUser'))?.name || 'Admin';
        
        // Add to userApprovals if not already there
        if (!userApprovals.some(a => a.id === user.id)) {
          userApprovals.push({...approvals[index]});
        }
      }
    });
    
    // Save updated approvals to localStorage
    updateLocalStorage();
    
    // Save user approvals to localStorage
    localStorage.setItem('userApprovals', JSON.stringify(userApprovals));
    
    // Store transfer information for notification in dashboard-users.html
    localStorage.setItem('lastTransfer', JSON.stringify({
      count: usersToTransfer.length,
      timestamp: new Date().toISOString()
    }));
    
    // Update counters
    updateCounters();
    
    // Redirect to dashboard-users.html after a short delay
    setTimeout(() => {
      window.location.href = 'dashboard-users.html?from=approval';
    }, 1500);
  }
  
  // API function to approve user
  async function approveUser(userId) {
    try {
      const response = await makeAuthenticatedRequest(`/api/users/${userId}/approve`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status) {
        // Find and update the user in local array
        const userIndex = approvals.findIndex(a => a.id === userId);
        if (userIndex !== -1) {
          approvals[userIndex].status = 'approved';
          approvals[userIndex].approvalDate = new Date().toISOString();
        }
        
        // Reload data to get updated status from server
        await loadAllUsers();
        applyFilters();
        updateCounters();
        
        showNotification(result.data || 'User approved successfully', 'success');
        closeModal();
      } else {
        throw new Error(result.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      showNotification(error.message || 'Failed to approve user', 'error');
    }
  }

  // API function to reject user
  async function rejectUser(userId, rejectionReason) {
    try {
      const response = await makeAuthenticatedRequest(`/api/users/${userId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          rejectionReason: rejectionReason
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status) {
        // Find and update the user in local array
        const userIndex = approvals.findIndex(a => a.id === userId);
        if (userIndex !== -1) {
          approvals[userIndex].status = 'rejected';
          approvals[userIndex].rejectionReason = rejectionReason;
          approvals[userIndex].approvalDate = new Date().toISOString();
        }
        
        // Reload data to get updated status from server
        await loadAllUsers();
        applyFilters();
        updateCounters();
        
        showNotification(result.data || 'User rejected successfully', 'success');
        closeModal();
      } else {
        throw new Error(result.message || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      showNotification(error.message || 'Failed to reject user', 'error');
    }
  }
  
  // Helper function to refresh data and update UI
  async function refreshData() {
    try {
      await loadAllUsers();
      applyFilters();
      updateCounters();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }
  
  // Apply search filter (status filtering is now done at backend level)
  function applyFilters() {
    let filtered = [...currentApprovals];
    
    // Apply search filter
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
      filtered = filtered.filter(approval => 
        approval.name.toLowerCase().includes(searchTerm) ||
        approval.userId.toLowerCase().includes(searchTerm) ||
        (approval.username && approval.username.toLowerCase().includes(searchTerm)) ||
        approval.department.toLowerCase().includes(searchTerm) ||
        approval.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Update UI
    renderApprovalTable(filtered);
    
    // Add bulk action buttons if not already added
    addBulkActionButtons();
    toggleBulkActionButtons();
  }
  
  // Update counter elements
  function updateCounters() {
    const pendingCount = approvals.filter(a => a.status === 'pending').length;
    const approvedCount = approvals.filter(a => a.status === 'approved').length;
    const rejectedCount = approvals.filter(a => a.status === 'rejected').length;
    
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (approvedCountEl) approvedCountEl.textContent = approvedCount;
    if (rejectedCountEl) rejectedCountEl.textContent = rejectedCount;
  }
  
  // Generate status badge HTML
  function getStatusBadge(status) {
    let className = '';
    let icon = '';
    
    switch(status) {
      case 'pending':
        className = 'bg-yellow-100 text-yellow-800';
        icon = 'fa-clock';
        break;
      case 'approved':
        className = 'bg-green-100 text-green-800';
        icon = 'fa-check-circle';
        break;
      case 'rejected':
        className = 'bg-red-100 text-red-800';
        icon = 'fa-times-circle';
        break;
      case 'is transfer':
        className = 'bg-blue-100 text-blue-800';
        icon = 'fa-paper-plane';
        break;
    }
    
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}">
      <i class="fas ${icon} mr-1"></i> ${status.charAt(0).toUpperCase() + status.slice(1)}
    </span>`;
  }
  
  // Render approval table
  function renderApprovalTable(approvals) {
    if (!approvalTableBody) return;
    
    // Clear the table body
    approvalTableBody.innerHTML = '';
    
    // Show empty state if no approvals
    if (approvals.length === 0) {
      if (approvalTable) approvalTable.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    
    // Show table if there are approvals
    if (approvalTable) approvalTable.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    
    // Render each approval row
    approvals.forEach(approval => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      // Add checkbox column for bulk actions
      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'px-6 py-4 whitespace-nowrap';
      
      // Only add checkbox for rejected or approved users
      if (approval.status === 'rejected' || approval.status === 'approved') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded';
        checkbox.dataset.userId = approval.id;
        checkbox.dataset.status = approval.status;
        
        // Add event listener to handle selection
        checkbox.addEventListener('change', function() {
          if (approval.status === 'rejected') {
            if (this.checked) {
              selectedRejectedUsers.push(approval.id);
            } else {
              const index = selectedRejectedUsers.indexOf(approval.id);
              if (index > -1) selectedRejectedUsers.splice(index, 1);
            }
          } else if (approval.status === 'approved') {
            if (this.checked) {
              selectedApprovedUsers.push(approval.id);
            } else {
              const index = selectedApprovedUsers.indexOf(approval.id);
              if (index > -1) selectedApprovedUsers.splice(index, 1);
            }
          }
          
          // Update header checkbox state
          updateHeaderCheckbox();
          
          // Update selected count display
          updateSelectedCount();
        });
        
        checkboxCell.appendChild(checkbox);
      }
      
      // Hide checkbox cell if not on rejected or approved filter
      if (currentFilter !== 'rejected' && currentFilter !== 'approved') {
        checkboxCell.classList.add('hidden');
      }
      
      row.appendChild(checkboxCell);
      
      // User information
      const userCell = document.createElement('td');
      userCell.className = 'px-6 py-4 whitespace-nowrap';
      userCell.innerHTML = `
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <i class="fas fa-user text-gray-500"></i>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${approval.name}</div>
            <div class="text-sm text-gray-500">${approval.userId}</div>
          </div>
        </div>
      `;
      row.appendChild(userCell);
      
      // Department/Position
      const deptCell = document.createElement('td');
      deptCell.className = 'px-6 py-4 whitespace-nowrap';
      deptCell.innerHTML = `
        <div class="text-sm text-gray-900">${approval.department}</div>
        <div class="text-sm text-gray-500">${approval.position}</div>
      `;
      row.appendChild(deptCell);
      
      // Contact information
      const contactCell = document.createElement('td');
      contactCell.className = 'px-6 py-4 whitespace-nowrap';
      contactCell.innerHTML = `
        <div class="text-sm text-gray-900">${approval.email}</div>
        <div class="text-sm text-gray-500">${approval.phone || 'No phone'}</div>
      `;
      row.appendChild(contactCell);
      
      // Status
      const statusCell = document.createElement('td');
      statusCell.className = 'px-6 py-4 whitespace-nowrap';
      statusCell.innerHTML = getStatusBadge(approval.status);
      row.appendChild(statusCell);
      
      // Submitted date
      const dateCell = document.createElement('td');
      dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      dateCell.textContent = formatDate(approval.submittedDate);
      row.appendChild(dateCell);
      
      // Actions
      const actionsCell = document.createElement('td');
      actionsCell.className = 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
      
      // Show different actions based on approval status
      let actionsHtml = `
        <button class="text-blue-600 hover:text-blue-900 mr-3 detail-btn" data-id="${approval.id}">
          <i class="fas fa-eye"></i> Detail
        </button>
      `;
      
      // Add approve/reject buttons only for pending users
      if (approval.status === 'pending') {
        actionsHtml += `
          <button class="text-green-600 hover:text-green-900 mr-3 approve-btn" data-id="${approval.id}">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="text-red-600 hover:text-red-900 mr-3 reject-btn" data-id="${approval.id}">
            <i class="fas fa-times"></i> Reject
          </button>
        `;
      }
      
      actionsCell.innerHTML = actionsHtml;
      row.appendChild(actionsCell);
      
      // Add the row to the table
      approvalTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.detail-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        showUserDetails(id);
      });
    });
    
    document.querySelectorAll('.approve-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        showApproveConfirmDialog(id);
      });
    });
    
    document.querySelectorAll('.reject-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        showRejectionDialog(id);
      });
    });
    
    // Add event listener to header checkbox
    const headerCheckbox = document.getElementById('select-all-header-checkbox');
    if (headerCheckbox) {
      headerCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-user-id]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = this.checked;
          
          // Trigger change event to update selected arrays
          const event = new Event('change');
          checkbox.dispatchEvent(event);
        });
      });
    }
    
    // Update the header checkbox state
    updateHeaderCheckbox();
  }
  
  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
  
  // Show user details in modal
  function showUserDetails(id) {
    const user = approvals.find(a => a.id === id);
    
    if (!user || !modalContent || !approvalModal) return;
    
    // Update modal title to include user's name
    const modalTitle = document.querySelector('#modal-title');
    if (modalTitle) {
      modalTitle.textContent = `User Registration Details: ${user.name}`;
    }
    
    // Hide approval actions in details modal since we have buttons in table
    const approvalActions = document.querySelector('.approval-actions');
    if (approvalActions) {
      approvalActions.classList.add('hidden');
    }
    
    // Build status info
    let statusInfo = '';
    if (user.status === 'approved') {
      statusInfo = `
        <div class="mt-4 p-3 bg-green-50 rounded-md">
          <p class="text-sm text-green-800"><strong>Status:</strong> Approved</p>
          ${user.approvalDate ? `<p class="text-sm text-green-800"><strong>Approved on:</strong> ${formatDate(user.approvalDate)}</p>` : ''}
        </div>
      `;
    } else if (user.status === 'rejected') {
      statusInfo = `
        <div class="mt-4 p-3 bg-red-50 rounded-md">
          <p class="text-sm text-red-800"><strong>Status:</strong> Rejected</p>
          ${user.approvalDate ? `<p class="text-sm text-red-800"><strong>Rejected on:</strong> ${formatDate(user.approvalDate)}</p>` : ''}
          ${user.rejectionReason ? `<p class="text-sm text-red-800"><strong>Reason:</strong> ${user.rejectionReason}</p>` : ''}
        </div>
      `;
    } else {
      statusInfo = `
        <div class="mt-4 p-3 bg-yellow-50 rounded-md">
          <p class="text-sm text-yellow-800"><strong>Status:</strong> Pending Approval</p>
        </div>
      `;
    }
    
    modalContent.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Full Name</p>
            <p class="mt-1 text-sm text-gray-900">${user.name || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Username</p>
            <p class="mt-1 text-sm text-gray-900">${user.username || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Kansai Employee ID (NIK)</p>
            <p class="mt-1 text-sm text-gray-900">${user.userId || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Email</p>
            <p class="mt-1 text-sm text-gray-900">${user.email || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Department</p>
            <p class="mt-1 text-sm text-gray-900">${user.department || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Position</p>
            <p class="mt-1 text-sm text-gray-900">${user.position || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Phone</p>
            <p class="mt-1 text-sm text-gray-900">${user.phone || 'Not specified'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Registration Date</p>
            <p class="mt-1 text-sm text-gray-900">${formatDate(user.submittedDate)}</p>
          </div>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Account Status</p>
          <div class="mt-1">${getStatusBadge(user.status)}</div>
        </div>
        
        ${statusInfo}
      </div>
    `;
    
    // Show modal
    approvalModal.classList.remove('hidden');
    
    // Prevent document body from receiving click events while modal is open
    document.body.style.pointerEvents = 'none';
    approvalModal.style.pointerEvents = 'auto';
  }

  // Function to close modal
  function closeModal() {
    if (approvalModal) {
      approvalModal.classList.add('hidden');
      document.body.style.pointerEvents = 'auto';
    }
  }
  
  // Show notification
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

  // Update the header checkbox state
  function updateHeaderCheckbox() {
    const headerCheckbox = document.getElementById('select-all-header-checkbox');
    if (!headerCheckbox) return;
    
    // Get all visible checkboxes for the current filter
    let checkboxes = [];
    if (currentFilter === 'rejected') {
      checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-status="rejected"]'));
    } else if (currentFilter === 'approved') {
      checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-status="approved"]'));
    }
    
    if (checkboxes.length === 0) {
      headerCheckbox.checked = false;
      headerCheckbox.indeterminate = false;
      return;
    }
    
    const allChecked = checkboxes.every(cb => cb.checked);
    const someChecked = checkboxes.some(cb => cb.checked);
    
    headerCheckbox.checked = allChecked;
    headerCheckbox.indeterminate = someChecked && !allChecked;
    
    // Add event listener to the header checkbox if not already added
    if (!headerCheckbox.hasEventListener) {
      headerCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-status="${currentFilter}"]`);
        
        checkboxes.forEach(checkbox => {
          checkbox.checked = this.checked;
          
          // Trigger change event to update selected arrays
          const event = new Event('change');
          checkbox.dispatchEvent(event);
        });
      });
      
      // Mark that we've added the event listener
      headerCheckbox.hasEventListener = true;
    }
  }
  
  // Show approve confirmation dialog
  function showApproveConfirmDialog(userId) {
    const user = approvals.find(a => a.id === userId);
    if (!user) return;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <i class="fas fa-check-circle text-green-600 text-xl"></i>
          </div>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-4 text-center">Approve User Registration</h3>
        <p class="text-sm text-gray-500 mb-4 text-center">
          Are you sure you want to approve the registration for <strong>${user.name}</strong>?
        </p>
        <div class="flex justify-end space-x-3">
          <button id="cancel-approve" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button id="confirm-approve" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
            <i class="fas fa-check mr-2"></i>Approve User
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Handle cancel
    overlay.querySelector('#cancel-approve').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Handle confirm
    overlay.querySelector('#confirm-approve').addEventListener('click', async () => {
      document.body.removeChild(overlay);
      await approveUser(userId);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  // Show rejection dialog
  function showRejectionDialog(userId) {
    const user = approvals.find(a => a.id === userId);
    if (!user) return;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <i class="fas fa-times-circle text-red-600 text-xl"></i>
          </div>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-4 text-center">Reject User Registration</h3>
        <p class="text-sm text-gray-500 mb-4 text-center">
          You are about to reject the registration for <strong>${user.name}</strong>.
        </p>
        <div class="mb-4">
          <label for="rejection-reason" class="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason (Required)
          </label>
          <textarea 
            id="rejection-reason" 
            rows="3" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Please provide a reason for rejection..."
            required
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button id="cancel-reject" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button id="confirm-reject" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
            <i class="fas fa-times mr-2"></i>Reject User
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Handle cancel
    overlay.querySelector('#cancel-reject').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Handle confirm
    overlay.querySelector('#confirm-reject').addEventListener('click', async () => {
      const reason = overlay.querySelector('#rejection-reason').value.trim();
      if (!reason) {
        showNotification('Please provide a reason for rejection.', 'warning');
        return;
      }
      
      document.body.removeChild(overlay);
      await rejectUser(userId, reason);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    // Auto-focus on textarea
    setTimeout(() => {
      const textarea = overlay.querySelector('#rejection-reason');
      if (textarea) textarea.focus();
    }, 100);
  }

  // Initialize dashboard on load
  initDashboard();
}); 