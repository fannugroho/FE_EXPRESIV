document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  // Initialize empty approvals array
  let approvals = [];

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
  let currentApprovals = [];
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
            submittedDate: new Date().toISOString().split('T')[0],
            documents: [],
            rejectionReason: user.rejectionReason,
            approvalDate: user.approvalDate
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
    approveBtn.addEventListener('click', async () => {
      const userId = approveBtn.dataset.userId;
      if (userId) {
        await approveUser(userId);
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

  // Approve user function
  async function approveUser(userId) {
    try {
      const response = await makeAuthenticatedRequest(`/api/users/${userId}/approve`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.code == 200) {
        // Update local approval status
        const approval = approvals.find(a => a.id === userId);
        if (approval) {
          approval.status = 'approved';
          approval.approvedDate = new Date().toISOString().split('T')[0];
          approval.approvedBy = 'Admin User';
        }

        // Close modal and refresh
        approvalModal.classList.add('hidden');
        updateCounters();
        applyFilters();
        showNotification('User approved successfully!', 'success');
      } else {
        throw new Error(result.message || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      showNotification('Failed to approve user: ' + error.message, 'error');
    }
  }

  // Reject user function
  async function rejectUser(userId, rejectionReason = null) {
    try {
      const body = rejectionReason ? 
        JSON.stringify({ rejectionReason: rejectionReason }) : 
        JSON.stringify({});
        
      const response = await makeAuthenticatedRequest(`/api/users/${userId}/reject`, {
        method: 'POST',
        body: body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.code == 200) {
        // Update local approval status
        const approval = approvals.find(a => a.id === userId);
        if (approval) {
          approval.status = 'rejected';
          approval.rejectedDate = new Date().toISOString().split('T')[0];
          approval.rejectedBy = 'Admin User';
          approval.rejectionReason = rejectionReason || 'Rejected by administrator';
        }

        // Close modal and refresh
        approvalModal.classList.add('hidden');
        updateCounters();
        applyFilters();
        showNotification('User rejected successfully', 'warning');
      } else {
        throw new Error(result.message || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      showNotification('Failed to reject user: ' + error.message, 'error');
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
        approval.department.toLowerCase().includes(searchTerm)
      );
    }
    
    // Update UI
    renderApprovalTable(filtered);
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
    }
    
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}">
      <i class="fas ${icon} mr-1"></i> ${status.charAt(0).toUpperCase() + status.slice(1)}
    </span>`;
  }
  
  // Generate document list HTML
  function getDocumentsList(documents) {
    if (!documents || documents.length === 0) {
      return '<span class="text-gray-400 italic">None</span>';
    }
    
    let html = '<div class="flex flex-wrap gap-1">';
    
    documents.forEach(doc => {
      let icon = 'fa-file';
      if (doc.endsWith('.pdf')) icon = 'fa-file-pdf';
      else if (doc.match(/\.(jpg|jpeg|png|gif)$/i)) icon = 'fa-file-image';
      
      html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        <i class="fas ${icon} mr-1"></i> ${doc}
      </span>`;
    });
    
    html += '</div>';
    return html;
  }

  // Render approval table
  function renderApprovalTable(approvals) {
    if (!approvalTableBody) return;
    
    approvalTableBody.innerHTML = '';
    
    if (approvals.length === 0) {
      if (approvalTable) approvalTable.parentElement.parentElement.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    
    if (approvalTable) approvalTable.parentElement.parentElement.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    
    approvals.forEach(approval => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <i class="fas fa-user text-blue-600"></i>
              </div>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${approval.name}</div>
              <div class="text-sm text-gray-500">ID: ${approval.userId}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${approval.department}</div>
          <div class="text-sm text-gray-500">${approval.position}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${approval.email}</div>
          <div class="text-sm text-gray-500">${approval.phone}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${getStatusBadge(approval.status)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${formatDate(approval.submittedDate)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end space-x-3">
      `;
      
      // Add appropriate action buttons based on status
      if (approval.status === 'pending') {
        row.innerHTML += `
            <button type="button" class="inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" onclick="showApprovalDetails('${approval.id}', 'reject')">
              <i class="fas fa-times mr-1"></i> Reject
            </button>
            <button type="button" class="inline-flex items-center px-2.5 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" onclick="showApprovalDetails('${approval.id}', 'approve')">
              <i class="fas fa-check mr-1"></i> Approve
            </button>
        `;
      }
      
      row.innerHTML += `
            <button type="button" class="inline-flex items-center px-2.5 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onclick="showApprovalDetails('${approval.id}', 'view')">
              <i class="fas fa-eye mr-1"></i> View
            </button>
          </div>
        </td>
      `;
      
      approvalTableBody.appendChild(row);
    });
  }
  
  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Global function to show approval details
  window.showApprovalDetails = function(approvalId, mode = 'view') {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval || !approvalModal || !modalContent) return;
    
    // Set data attributes for action buttons
    if (approveBtn) {
      approveBtn.dataset.userId = approvalId;
      approveBtn.style.display = (mode === 'view' || approval.status !== 'pending') ? 'none' : 'inline-flex';
    }
    
    if (rejectBtn) {
      rejectBtn.dataset.userId = approvalId;
      rejectBtn.style.display = (mode === 'view' || approval.status !== 'pending') ? 'none' : 'inline-flex';
    }
    
    // Build modal content
    let statusInfo = '';
    if (approval.status === 'approved') {
      statusInfo = `
        <div class="mt-4 p-3 bg-green-50 rounded-md">
          <p class="text-sm text-green-800"><strong>Approved on:</strong> ${approval.approvedDate}</p>
          <p class="text-sm text-green-800"><strong>Approved by:</strong> ${approval.approvedBy}</p>
        </div>
      `;
    } else if (approval.status === 'rejected') {
      statusInfo = `
        <div class="mt-4 p-3 bg-red-50 rounded-md">
          <p class="text-sm text-red-800"><strong>Rejected on:</strong> ${approval.rejectedDate}</p>
          <p class="text-sm text-red-800"><strong>Rejected by:</strong> ${approval.rejectedBy}</p>
          ${approval.rejectionReason ? `<p class="text-sm text-red-800"><strong>Reason:</strong> ${approval.rejectionReason}</p>` : ''}
        </div>
      `;
    }
    
    modalContent.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Full Name</p>
            <p class="mt-1 text-sm text-gray-900">${approval.name}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Employee ID</p>
            <p class="mt-1 text-sm text-gray-900">${approval.userId}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Department</p>
            <p class="mt-1 text-sm text-gray-900">${approval.department}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Position</p>
            <p class="mt-1 text-sm text-gray-900">${approval.position}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Email</p>
            <p class="mt-1 text-sm text-gray-900">${approval.email}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Phone</p>
            <p class="mt-1 text-sm text-gray-900">${approval.phone}</p>
          </div>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Status</p>
          <div class="mt-1">${getStatusBadge(approval.status)}</div>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Submitted Date</p>
          <p class="mt-1 text-sm text-gray-900">${formatDate(approval.submittedDate)}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Documents</p>
          <div class="mt-1">${getDocumentsList(approval.documents)}</div>
        </div>
        
        ${statusInfo}
      </div>
    `;
    
    // Show modal
    approvalModal.classList.remove('hidden');
  };
  
  // Show notification function
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg max-w-sm`;
    
    // IMPORTANT: Set very high z-index inline to override everything
    notification.style.zIndex = '99999';
    notification.style.position = 'fixed';
    
    // Set colors based on type
    let bgColor = 'bg-blue-500';
    let icon = 'fa-info-circle';
    
    switch(type) {
      case 'success':
        bgColor = 'bg-green-500';
        icon = 'fa-check-circle';
        break;
      case 'error':
        bgColor = 'bg-red-500';
        icon = 'fa-exclamation-circle';
        break;
      case 'warning':
        bgColor = 'bg-yellow-500';
        icon = 'fa-exclamation-triangle';
        break;
    }
    
    notification.className += ` ${bgColor} text-white`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icon} mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
  
  // Show rejection dialog
  function showRejectionDialog(userId) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Reject User Registration</h3>
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
            Reject User
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
        alert('Please provide a reason for rejection.');
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
  }

  // Initialize dashboard on load
  initDashboard();
}); 