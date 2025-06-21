document.addEventListener('DOMContentLoaded', function() {
  // Initialize empty approvals array
  let approvals = [];
  let selectedRejectedUsers = []; // Array to store selected rejected users
  let selectedApprovedUsers = []; // Array to store selected approved users
  
  // Set logged in user information in the header
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  if (loggedInUser) {
    document.getElementById('userName').textContent = loggedInUser.name || 'Admin User';
    // Avatar is already set to default image
  }

  // Check for pending registrations in localStorage
  let pendingRegistrations = localStorage.getItem('pendingRegistrations');
  if (pendingRegistrations) {
    try {
      const registrationData = JSON.parse(pendingRegistrations);
      // Process the registration data
      if (registrationData && registrationData.excelData && registrationData.excelData.length > 0) {
        // Map Excel data to user objects
        const newUsers = registrationData.excelData.map((user, index) => {
          // Get column data based on expected Excel format
          // Assuming columns: Username, Email, Password, First Name, Last Name, Kansai Employee ID, Position, Department Name
          return {
            id: `REG${Date.now()}${index}`.substring(0, 10),
            userId: user[5] || `EMP${100 + index}`, // Kansai Employee ID
            username: user[0] || '', // Username
            email: user[1] || '', // Email
            firstName: user[3] || '', // First Name
            lastName: user[4] || '', // Last Name
            name: `${user[3] || ''} ${user[4] || ''}`.trim(), // Full name
            department: user[7] || 'Not specified', // Department
            position: user[6] || 'Not specified', // Position
            phone: '', // Phone (not in Excel)
            status: 'pending',
            submittedDate: new Date().toISOString().split('T')[0],
            originalData: user // Store original data for reference
          };
        });
        
        // Add the new registrations to approvals array
        approvals = [...newUsers];
      }
    } catch (error) {
      console.error('Error parsing pending registrations:', error);
    }
  }

  // If no users found in localStorage, check if we should add demo data
  if (approvals.length === 0) {
    // Create demo users for demonstration purposes
    approvals = [
      {
        id: 'REG001',
        userId: 'EMP101',
        username: 'johndoe',
        email: 'john.doe@kansaipaint.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        department: 'IT',
        position: 'Software Developer',
        phone: '+6281234567890',
        status: 'pending',
        submittedDate: new Date().toISOString().split('T')[0]
      },
      {
        id: 'REG002',
        userId: 'EMP102',
        username: 'janedoe',
        email: 'jane.doe@kansaipaint.com',
        firstName: 'Jane',
        lastName: 'Doe',
        name: 'Jane Doe',
        department: 'Finance',
        position: 'Accountant',
        phone: '+6281234567891',
        status: 'approved',
        submittedDate: '2023-06-15',
        approvedDate: '2023-06-16',
        approvedBy: 'Admin User'
      },
      {
        id: 'REG003',
        userId: 'EMP103',
        username: 'bobsmith',
        email: 'bob.smith@kansaipaint.com',
        firstName: 'Bob',
        lastName: 'Smith',
        name: 'Bob Smith',
        department: 'Sales',
        position: 'Sales Manager',
        phone: '+6281234567892',
        status: 'rejected',
        submittedDate: '2023-06-14',
        rejectedDate: '2023-06-15',
        rejectedBy: 'Admin User',
        rejectionReason: 'Duplicate user account'
      }
    ];
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
  updateCounters();
  renderApprovalTable(currentApprovals);
  
  // Set up event listeners
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active-filter'));
      
      // Add active class to clicked button
      button.classList.add('active-filter');
      
      // Get filter value from button id
      currentFilter = button.id.replace('-btn', '');
      
      // Apply filters
      applyFilters();
      
      // Show/hide bulk action buttons based on filter
      toggleBulkActionButtons();
    });
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  // Close modal
  if (closeModalBtn && approvalModal) {
    closeModalBtn.addEventListener('click', () => {
      approvalModal.classList.add('hidden');
    });
  }
  
  // Approve button
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      const userId = approveBtn.dataset.userId;
      if (userId) {
        updateApprovalStatus(userId, 'approved');
        approvalModal.classList.add('hidden');
        
        // Show success message
        showNotification('User approved successfully!', 'success');
      }
    });
  }
  
  // Reject button
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      const userId = rejectBtn.dataset.userId;
      if (userId) {
        updateApprovalStatus(userId, 'rejected');
        approvalModal.classList.add('hidden');
        
        // Show success message
        showNotification('User rejected', 'error');
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
  
  // Update approval status
  function updateApprovalStatus(approvalId, newStatus) {
    // Find the approval in the array
    const index = approvals.findIndex(a => a.id === approvalId);
    if (index === -1) return;
    
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const adminName = loggedInUser?.name || 'Admin User';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Update status based on the new status
    if (newStatus === 'approved') {
      approvals[index].status = 'approved';
      approvals[index].approvedDate = currentDate;
      approvals[index].approvedBy = adminName;
      
      // Show success notification
      showNotification(`User ${approvals[index].name} has been approved`, 'success');
    } else if (newStatus === 'rejected') {
      // Rejection is now handled in the showUserDetails function with reason
      // This is kept for backward compatibility
      approvals[index].status = 'rejected';
      approvals[index].rejectedDate = currentDate;
      approvals[index].rejectedBy = adminName;
      
      // Show notification
      showNotification(`User ${approvals[index].name} has been rejected`, 'error');
    } else if (newStatus === 'pending') {
      // Restore from rejected to pending
      approvals[index].status = 'pending';
      delete approvals[index].rejectedDate;
      delete approvals[index].rejectedBy;
      delete approvals[index].rejectionReason;
      
      // Show notification
      showNotification(`User ${approvals[index].name} has been restored to pending status`, 'info');
    }
    
    // Update localStorage
    updateLocalStorage();
    
    // Re-render the table with current filter
    applyFilters();
    
    // Update counters
    updateCounters();
  }
  
  // Update localStorage with current approval data
  function updateLocalStorage() {
    // Store the updated approvals in localStorage
    localStorage.setItem('userApprovals', JSON.stringify(approvals));
    
    // Update the pending registrations in localStorage
    const pendingUsers = approvals.filter(user => user.status === 'pending');
    if (pendingUsers.length > 0) {
      // Keep the original pendingRegistrations format but update with current pending users
      const pendingRegistrations = {
        excelData: pendingUsers.map(user => user.originalData || []),
        timestamp: new Date().toISOString(),
        status: "pending"
      };
      localStorage.setItem('pendingRegistrations', JSON.stringify(pendingRegistrations));
    } else {
      // If no pending users, remove the pendingRegistrations from localStorage
      localStorage.removeItem('pendingRegistrations');
    }
  }
  
  // Apply filters (search and status)
  function applyFilters() {
    let filtered = [...approvals];
    
    // Apply status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(approval => approval.status === currentFilter);
    }
    
    // Apply search filter
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
      filtered = filtered.filter(approval => 
        approval.name.toLowerCase().includes(searchTerm) ||
        approval.userId.toLowerCase().includes(searchTerm) ||
        approval.department.toLowerCase().includes(searchTerm)
      );
    }
    
    // Update UI
    currentApprovals = filtered;
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
      
      // Replace the existing actions with just Detail and Delete buttons
      actionsCell.innerHTML = `
        <button class="text-blue-600 hover:text-blue-900 mr-3 detail-btn" data-id="${approval.id}">
          <i class="fas fa-eye"></i> Detail
        </button>
        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${approval.id}">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      `;
      
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
    
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        if (confirm('Are you sure you want to delete this user?')) {
          // Find user index
          const index = approvals.findIndex(approval => approval.id === id);
          if (index !== -1) {
            // Remove from array
            approvals.splice(index, 1);
            // Update local storage
            updateLocalStorage();
            // Re-render table
            applyFilters();
            // Update counters
            updateCounters();
            // Show notification
            showNotification('User deleted successfully', 'success');
          }
        }
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
  function showUserDetails(id, action = null) {
    const user = approvals.find(a => a.id === id);
    
    // Update modal title to include user's name
    if (user) {
      document.querySelector('#modal-title').textContent = `User Registration Details: ${user.name}`;
    }
    if (!user || !modalContent || !approvalModal) return;
    
    // Set user ID for approve/reject buttons
    if (approveBtn) approveBtn.dataset.userId = id;
    if (rejectBtn) rejectBtn.dataset.userId = id;
    
    // Show/hide approval actions based on status
    const approvalActions = document.querySelector('.approval-actions');
    if (approvalActions) {
      if (user.status === 'pending') {
        approvalActions.classList.remove('hidden');
      } else {
        approvalActions.classList.add('hidden');
      }
    }
    
    // Highlight specific action if provided
    if (action === 'approve' && approveBtn) {
      approveBtn.classList.add('animate-pulse', 'ring-2', 'ring-green-500');
      setTimeout(() => approveBtn.classList.remove('animate-pulse', 'ring-2', 'ring-green-500'), 1500);
    } else if (action === 'reject' && rejectBtn) {
      rejectBtn.classList.add('animate-pulse', 'ring-2', 'ring-red-500');
      setTimeout(() => rejectBtn.classList.remove('animate-pulse', 'ring-2', 'ring-red-500'), 1500);
    }
    
    // Generate HTML for user details
    let statusInfo = '';
    if (user.status === 'approved') {
      statusInfo = `
        <div class="mt-2 p-2 bg-green-50 rounded-md">
          <p class="text-sm text-green-800">
            <i class="fas fa-check-circle mr-1"></i> Approved on ${formatDate(user.approvedDate)} by ${user.approvedBy || 'Admin'}
          </p>
        </div>
      `;
    } else if (user.status === 'rejected') {
      statusInfo = `
        <div class="mt-2 p-2 bg-red-50 rounded-md">
          <p class="text-sm text-red-800">
            <i class="fas fa-times-circle mr-1"></i> Rejected on ${formatDate(user.rejectedDate)} by ${user.rejectedBy || 'Admin'}
          </p>
          <p class="text-sm text-red-700 mt-1">Reason: ${user.rejectionReason || 'No reason provided'}</p>
        </div>
      `;
    }
    
    modalContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-gray-700 mb-2">User Information</h4>
          <div class="space-y-2">
            <div>
              <span class="text-xs text-gray-500">Full Name</span>
              <p class="font-medium">${user.name}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Employee ID</span>
              <p>${user.userId}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Username</span>
              <p>${user.username}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Email</span>
              <p>${user.email}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Phone</span>
              <p>${user.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-700 mb-2">Position Details</h4>
          <div class="space-y-2">
            <div>
              <span class="text-xs text-gray-500">Department</span>
              <p>${user.department}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Position</span>
              <p>${user.position}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Submission Date</span>
              <p>${formatDate(user.submittedDate)}</p>
            </div>
            <div>
              <span class="text-xs text-gray-500">Status</span>
              <p>${getStatusBadge(user.status)}</p>
            </div>
          </div>
        </div>
      </div>
      
      ${statusInfo}
      
      ${user.status === 'pending' ? `
        <div class="mt-4">
          <div id="rejection-reason-container" class="hidden mt-3">
            <label for="rejection-reason" class="block text-sm font-medium text-gray-700">Rejection Reason</label>
            <textarea id="rejection-reason" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Please provide a reason for rejection..."></textarea>
          </div>
        </div>
      ` : ''}
    `;
    
    // Show modal
    approvalModal.classList.remove('hidden');
    
    // Add event listener for reject button to show rejection reason field
    if (rejectBtn && user.status === 'pending') {
      rejectBtn.addEventListener('click', function() {
        const rejectionContainer = document.getElementById('rejection-reason-container');
        if (rejectionContainer) {
          rejectionContainer.classList.remove('hidden');
          document.getElementById('rejection-reason').focus();
        }
      });
      
      // Update the reject button click handler
      rejectBtn.onclick = function() {
        const rejectionContainer = document.getElementById('rejection-reason-container');
        
        if (rejectionContainer && rejectionContainer.classList.contains('hidden')) {
          // First click - show the rejection reason field
          rejectionContainer.classList.remove('hidden');
          document.getElementById('rejection-reason').focus();
        } else {
          // Second click - process the rejection
          const rejectionReason = document.getElementById('rejection-reason').value.trim();
          
          if (!rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
          }
          
          // Update user status to rejected with reason
          const userId = this.dataset.userId;
          const userIndex = approvals.findIndex(a => a.id === userId);
          
          if (userIndex !== -1) {
            approvals[userIndex].status = 'rejected';
            approvals[userIndex].rejectedDate = new Date().toISOString().split('T')[0];
            approvals[userIndex].rejectedBy = JSON.parse(localStorage.getItem('loggedInUser'))?.name || 'Admin';
            approvals[userIndex].rejectionReason = rejectionReason;
            
            // Update local storage
            updateLocalStorage();
            
            // Close modal
            approvalModal.classList.add('hidden');
            
            // Re-render table
            applyFilters();
            
            // Update counters
            updateCounters();
            
            // Show notification
            showNotification('User rejected successfully', 'success');
          }
        }
      };
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
}); 