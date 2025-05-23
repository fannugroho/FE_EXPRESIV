document.addEventListener('DOMContentLoaded', function() {
  // Initialize empty approvals array
  let approvals = [];

  // Check for registration data in localStorage
  let registrationData = null;
  let storedData = localStorage.getItem('registrationData');
  if (storedData) {
    try {
      registrationData = JSON.parse(storedData);
      // Add registration from localStorage to the list if it exists
      if (registrationData && registrationData.excelData && registrationData.excelData.length > 0) {
        const newUsers = registrationData.excelData.map((user, index) => {
          // Use the first user's data as an example
          const firstUser = user;
          return {
            id: `REG${index + 1}`.padStart(6, '0'),
            userId: firstUser[0] || `EMP${100 + index + 1}`,
            name: `${firstUser[2] || ''} ${firstUser[3] ? firstUser[3] + ' ' : ''}${firstUser[4] || ''}`.trim(),
            department: firstUser[5] || 'Not specified',
            position: firstUser[6] || 'Not specified',
            email: firstUser[8] || 'Not specified',
            phone: firstUser[7] || 'Not specified',
            status: 'pending',
            submittedDate: new Date().toISOString().split('T')[0],
            documents: registrationData.documents ? registrationData.documents.map(doc => doc.name) : []
          };
        });
        
        // Set the approvals to only include the new registrations
        approvals = newUsers;
      }
    } catch (error) {
      console.error('Error parsing registration data:', error);
    }
  }

  // If no users found in localStorage, check if we should add demo data
  if (approvals.length === 0) {
    // Create a single demo user if needed for demonstration purposes
    approvals.push({
      id: 'REG001',
      userId: 'DEMO101',
      name: 'Demo User',
      department: 'IT',
      position: 'Software Developer',
      email: 'demo.user@kansaipaint.com',
      phone: '+6281234567890',
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0],
      documents: []
    });
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
  
  // Update approval status
  function updateApprovalStatus(approvalId, newStatus) {
    const approval = approvals.find(a => a.id === approvalId);
    if (approval) {
      approval.status = newStatus;
      
      if (newStatus === 'approved') {
        approval.approvedDate = new Date().toISOString().split('T')[0];
        approval.approvedBy = 'Admin User';
      } else if (newStatus === 'rejected') {
        approval.rejectedDate = new Date().toISOString().split('T')[0];
        approval.rejectedBy = 'Admin User';
        approval.rejectionReason = 'Rejected by administrator';
      }
      
      // Update UI
      updateCounters();
      applyFilters();
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
      row.className = 'hover:bg-gray-50 transition-colors duration-150 ease-in-out';
      
      // Build row HTML
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i class="fas fa-user"></i>
              </div>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${approval.name}</div>
              <div class="text-sm text-gray-500">${approval.userId}</div>
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
    
    // Generate document list HTML
    const getDocumentsList = (documents) => {
      if (!documents || documents.length === 0) {
        return '<p class="text-sm text-gray-500 italic">No documents attached</p>';
      }
      
      let html = '<div class="document-list">';
      
      documents.forEach(doc => {
        let icon = 'fa-file';
        if (doc.endsWith('.pdf')) icon = 'fa-file-pdf';
        else if (doc.match(/\.(jpg|jpeg|png|gif)$/i)) icon = 'fa-file-image';
        
        html += `<span class="document-item">
          <i class="fas ${icon}"></i> ${doc}
        </span>`;
      });
      
      html += '</div>';
      return html;
    };
    
    // Build modal content
    modalContent.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <div>
          <h4 class="text-xl font-semibold text-gray-900">${approval.name}</h4>
          <p class="text-sm text-gray-600">${approval.department} - ${approval.position}</p>
        </div>
        <div>
          <span class="status-indicator ${approval.status === 'pending' ? 'status-pending' : approval.status === 'approved' ? 'status-approved' : 'status-rejected'}">
            <i class="fas ${approval.status === 'pending' ? 'fa-clock' : approval.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
            ${approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div class="modal-section">
        <h5 class="modal-section-title">Personal Information</h5>
        <div class="modal-grid">
          <div class="modal-data-item">
            <div class="data-label">Employee ID</div>
            <div class="data-value">${approval.userId}</div>
          </div>
          <div class="modal-data-item">
            <div class="data-label">Registration ID</div>
            <div class="data-value">${approval.id}</div>
          </div>
          <div class="modal-data-item">
            <div class="data-label">Email</div>
            <div class="data-value">${approval.email}</div>
          </div>
          <div class="modal-data-item">
            <div class="data-label">Phone</div>
            <div class="data-value">${approval.phone}</div>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h5 class="modal-section-title">Registration Information</h5>
        <div class="modal-grid">
          <div class="modal-data-item">
            <div class="data-label">Submitted Date</div>
            <div class="data-value">${formatDate(approval.submittedDate)}</div>
          </div>
    `;
    
    if (approval.status === 'approved') {
      modalContent.innerHTML += `
          <div class="modal-data-item">
            <div class="data-label">Approved Date</div>
            <div class="data-value">${formatDate(approval.approvedDate)}</div>
          </div>
          <div class="modal-data-item">
            <div class="data-label">Approved By</div>
            <div class="data-value">${approval.approvedBy || 'System'}</div>
          </div>
      `;
    } else if (approval.status === 'rejected') {
      modalContent.innerHTML += `
          <div class="modal-data-item">
            <div class="data-label">Rejected Date</div>
            <div class="data-value">${formatDate(approval.rejectedDate)}</div>
          </div>
          <div class="modal-data-item">
            <div class="data-label">Rejected By</div>
            <div class="data-value">${approval.rejectedBy || 'System'}</div>
          </div>
          <div class="modal-data-item col-span-2">
            <div class="data-label">Rejection Reason</div>
            <div class="data-value">${approval.rejectionReason || 'No reason provided'}</div>
          </div>
      `;
    }
    
    modalContent.innerHTML += `
        </div>
      </div>
    `;
    
    // Show modal
    approvalModal.classList.remove('hidden');
  };
  
  // Simple notification function
  function showNotification(message, type = 'info') {
    // Check if a notification container exists, create one if not
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-4 right-4 z-50 flex flex-col items-end space-y-2';
      document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `
      transform transition-all duration-300 ease-out
      translate-x-0 opacity-100 scale-100
      max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
      ring-1 ring-black ring-opacity-5 overflow-hidden
    `;
    
    // Set icon and color based on type
    let iconClass = 'fas fa-info-circle text-blue-500';
    let borderColor = 'border-blue-500';
    
    if (type === 'success') {
      iconClass = 'fas fa-check-circle text-green-500';
      borderColor = 'border-green-500';
    } else if (type === 'error') {
      iconClass = 'fas fa-exclamation-circle text-red-500';
      borderColor = 'border-red-500';
    } else if (type === 'warning') {
      iconClass = 'fas fa-exclamation-triangle text-yellow-500';
      borderColor = 'border-yellow-500';
    }
    
    // Build notification HTML
    notification.innerHTML = `
      <div class="p-4 border-l-4 ${borderColor}">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="${iconClass}"></i>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">${message}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
              <span class="sr-only">Close</span>
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add notification to container
    container.appendChild(notification);
    
    // Setup close button
    const closeBtn = notification.querySelector('button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        notification.classList.replace('opacity-100', 'opacity-0');
        notification.classList.replace('translate-x-0', 'translate-x-5');
        notification.classList.replace('scale-100', 'scale-95');
        
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.replace('opacity-100', 'opacity-0');
        notification.classList.replace('translate-x-0', 'translate-x-5');
        notification.classList.replace('scale-100', 'scale-95');
        
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 5000);
  }
}); 