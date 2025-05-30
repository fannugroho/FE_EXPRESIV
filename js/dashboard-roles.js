document.addEventListener('DOMContentLoaded', function() {
  // Initialize roles array
  let roles = [];
  let currentRoleId = null;
  
  // Permission groups and pages
  const websitePages = [
    // Dashboard & Administration
    { id: 'dashboard', name: 'Dashboard', group: 'Dashboard & Administration' },
    { id: 'dashboard-users', name: 'User Management', group: 'Dashboard & Administration' },
    { id: 'dashboard-roles', name: 'Role Management', group: 'Dashboard & Administration' },
    { id: 'approval-dashboard', name: 'Approval Dashboard', group: 'Dashboard & Administration' },
    { id: 'profil', name: 'User Profile', group: 'Dashboard & Administration' },
    { id: 'register', name: 'Registration', group: 'Dashboard & Administration' },
    
    // Menu Access
    { id: 'menuReim', name: 'Reimbursement Menu', group: 'Menu Access' },
    { id: 'menuSettle', name: 'Settlement Menu', group: 'Menu Access' },
    { id: 'menuCash', name: 'Cash Advance Menu', group: 'Menu Access' },
    { id: 'menuPR', name: 'Purchase Request Menu', group: 'Menu Access' },
    
    // Detail Access
    { id: 'detailReim', name: 'Reimbursement Details', group: 'Detail Access' },
    { id: 'detailSettle', name: 'Settlement Details', group: 'Detail Access' },
    { id: 'detailCash', name: 'Cash Advance Details', group: 'Detail Access' },
    { id: 'detailPR', name: 'Purchase Request Details', group: 'Detail Access' },
    
    // Creation Access
    { id: 'addReim', name: 'Create Reimbursement', group: 'Creation Access' },
    { id: 'addSettle', name: 'Create Settlement', group: 'Creation Access' },
    { id: 'addCash', name: 'Create Cash Advance', group: 'Creation Access' },
    { id: 'addPR', name: 'Create Purchase Request', group: 'Creation Access' },
    
    // PR Processing
    { id: 'menuPRReceive', name: 'PR Receiving Menu', group: 'PR Processing' },
    { id: 'receivePR', name: 'Receive PR', group: 'PR Processing' },
    
    // Checking Process
    { id: 'menuPRCheck', name: 'PR Check Menu', group: 'Checking Process' },
    { id: 'menuSettleCheck', name: 'Settlement Check Menu', group: 'Checking Process' },
    { id: 'menuCashCheck', name: 'Cash Advance Check Menu', group: 'Checking Process' },
    { id: 'menuReimCheck', name: 'Reimbursement Check Menu', group: 'Checking Process' },
    { id: 'checkedPR', name: 'Checked PR', group: 'Checking Process' },
    { id: 'checkedSettle', name: 'Checked Settlement', group: 'Checking Process' },
    { id: 'checkedCash', name: 'Checked Cash Advance', group: 'Checking Process' },
    { id: 'checkedReim', name: 'Checked Reimbursement', group: 'Checking Process' },
    
    // Acknowledgement Process
    { id: 'menuPRAcknow', name: 'PR Acknowledgement Menu', group: 'Acknowledgement Process' },
    { id: 'menuSettleAcknow', name: 'Settlement Acknowledgement Menu', group: 'Acknowledgement Process' },
    { id: 'menuCashAcknow', name: 'Cash Advance Acknowledgement Menu', group: 'Acknowledgement Process' },
    { id: 'menuReimAcknow', name: 'Reimbursement Acknowledgement Menu', group: 'Acknowledgement Process' },
    { id: 'acknowledgePR', name: 'Acknowledge PR', group: 'Acknowledgement Process' },
    { id: 'acknowledgeSettle', name: 'Acknowledge Settlement', group: 'Acknowledgement Process' },
    { id: 'acknowledgeCash', name: 'Acknowledge Cash Advance', group: 'Acknowledgement Process' },
    { id: 'acknowledgeReim', name: 'Acknowledge Reimbursement', group: 'Acknowledgement Process' },
    
    // Approval Process
    { id: 'menuPRApprove', name: 'PR Approval Menu', group: 'Approval Process' },
    { id: 'menuSettleApprove', name: 'Settlement Approval Menu', group: 'Approval Process' },
    { id: 'menuCashApprove', name: 'Cash Advance Approval Menu', group: 'Approval Process' },
    { id: 'menuReimApprove', name: 'Reimbursement Approval Menu', group: 'Approval Process' },
    { id: 'approvePR', name: 'Approve PR', group: 'Approval Process' },
    { id: 'approveSettle', name: 'Approve Settlement', group: 'Approval Process' },
    { id: 'approveCash', name: 'Approve Cash Advance', group: 'Approval Process' },
    { id: 'approveReim', name: 'Approve Reimbursement', group: 'Approval Process' }
  ];
  
  // Get stored roles data if available
  const storedRoles = localStorage.getItem('rolesData');
  if (storedRoles) {
    try {
      roles = JSON.parse(storedRoles);
    } catch (error) {
      console.error('Error parsing stored roles:', error);
    }
  }
  
  // If no roles exist, create a default Admin role
  if (roles.length === 0) {
    const adminRole = {
      id: generateId(),
      name: 'Administrator',
      createdDate: formatDate(new Date()),
      lastModified: formatDate(new Date()),
      permissions: websitePages.map(page => page.id) // Admin has access to all pages
    };
    roles.push(adminRole);
    saveRolesToStorage();
  }

  // Update UI elements
  updateUICounters();
  populateRolesTable();
  
  // Add event listeners
  const addRoleBtn = document.getElementById('addRoleBtn');
  const saveRoleBtn = document.getElementById('saveRoleBtn');
  const cancelRoleBtn = document.getElementById('cancelRoleBtn');
  const roleModal = document.getElementById('roleModal');
  const searchInput = document.getElementById('search');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const presetRolesBtn = document.getElementById('presetRolesBtn');
  const presetRolesMenu = document.getElementById('presetRolesMenu');
  
  // Preset Roles dropdown
  if (presetRolesBtn) {
    presetRolesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      presetRolesMenu.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!presetRolesBtn.contains(e.target) && !presetRolesMenu.contains(e.target)) {
        presetRolesMenu.classList.add('hidden');
      }
    });
    
    // Preset role item click
    const presetRoleItems = document.querySelectorAll('.preset-role-item');
    presetRoleItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const preset = this.getAttribute('data-preset');
        createPresetRole(preset);
        presetRolesMenu.classList.add('hidden');
      });
    });
  }
  
  // Add Role button click
  if (addRoleBtn) {
    addRoleBtn.addEventListener('click', function() {
      openRoleModal();
    });
  }
  
  // Save Role button click
  if (saveRoleBtn) {
    saveRoleBtn.addEventListener('click', function() {
      saveRole();
    });
  }
  
  // Cancel Role button click
  if (cancelRoleBtn) {
    cancelRoleBtn.addEventListener('click', function() {
      closeRoleModal();
    });
  }
  
  // Cancel Delete button click
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', function() {
      closeDeleteModal();
    });
  }
  
  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = searchInput.value.toLowerCase();
      const filteredRoles = roles.filter(role => 
        role.name.toLowerCase().includes(searchTerm)
      );
      populateRolesTable(filteredRoles);
    });
  }
  
  // Functions
  function updateUICounters() {
    document.getElementById('totalRoles').textContent = roles.length;
    document.getElementById('totalItems').textContent = roles.length;
    document.getElementById('lastUpdated').textContent = formatDate(new Date(), true);
  }
  
  function populateRolesTable(data = roles) {
    const tableBody = document.getElementById('roleTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-10 text-center text-gray-500">
            No roles found. Please add a new role.
          </td>
        </tr>
      `;
    } else {
      data.forEach((role, index) => {
        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        tr.dataset.roleId = role.id;
        
        // Format permissions for display
        const permissionBadges = getPermissionBadges(role.permissions);
        
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${role.name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${role.createdDate}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${role.lastModified}</td>
          <td class="px-6 py-4">${permissionBadges}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex justify-end">
              <button type="button" class="action-btn edit-btn" title="Edit Role" onclick="editRole('${role.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="action-btn delete-btn" title="Delete Role" onclick="deleteRole('${role.id}')">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        `;
        
        tableBody.appendChild(tr);
      });
    }
    
    // Update pagination info
    document.getElementById('startItem').textContent = data.length > 0 ? 1 : 0;
    document.getElementById('endItem').textContent = data.length;
    document.getElementById('totalItems').textContent = data.length;
  }
  
  function getPermissionBadges(permissions) {
    if (!permissions || permissions.length === 0) {
      return '<span class="text-gray-400 text-xs italic">No permissions</span>';
    }
    
    // Count permissions by group
    const groupCounts = {};
    permissions.forEach(permId => {
      const page = websitePages.find(p => p.id === permId);
      if (page) {
        if (!groupCounts[page.group]) {
          groupCounts[page.group] = 0;
        }
        groupCounts[page.group]++;
      }
    });
    
    // Display badges for groups with their counts
    let badges = '';
    
    // Show at most 3 groups
    const groups = Object.keys(groupCounts);
    const visibleGroups = groups.slice(0, 3);
    
    visibleGroups.forEach(group => {
      const count = groupCounts[group];
      const totalInGroup = websitePages.filter(p => p.group === group).length;
      badges += `<span class="permission-badge"><i class="fas fa-layer-group"></i> ${group}: ${count}/${totalInGroup}</span>`;
    });
    
    if (groups.length > 3) {
      badges += `<span class="permission-badge">+${groups.length - 3} more groups</span>`;
    }
    
    return badges;
  }
  
  function openRoleModal(roleId = null) {
    currentRoleId = roleId;
    const modalTitle = document.getElementById('modal-title');
    const roleNameInput = document.getElementById('roleName');
    const permissionsContainer = document.getElementById('permissionsContainer');
    
    // Clear previous data
    roleNameInput.value = '';
    permissionsContainer.innerHTML = '';
    
    // Group pages by group
    const pagesByGroup = {};
    websitePages.forEach(page => {
      if (!pagesByGroup[page.group]) {
        pagesByGroup[page.group] = [];
      }
      pagesByGroup[page.group].push(page);
    });
    
    // If editing existing role, populate with role data
    let selectedPermissions = [];
    if (roleId) {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        roleNameInput.value = role.name;
        selectedPermissions = role.permissions;
        modalTitle.textContent = 'Edit Role';
      }
    } else {
      modalTitle.textContent = 'Add New Role';
    }
    
    // Populate permissions checkboxes by group
    Object.keys(pagesByGroup).forEach(group => {
      const groupPages = pagesByGroup[group];
      
      // Add group header
      const groupHeader = document.createElement('div');
      groupHeader.className = 'permission-category';
      groupHeader.textContent = group;
      
      // Add "Select All" checkbox for this group
      const selectAllDiv = document.createElement('div');
      selectAllDiv.className = 'permission-checkbox select-all';
      
      const groupId = group.replace(/\s+/g, '-').toLowerCase();
      const allChecked = groupPages.every(page => selectedPermissions.includes(page.id));
      
      selectAllDiv.innerHTML = `
        <input type="checkbox" id="select-all-${groupId}" ${allChecked ? 'checked' : ''}>
        <label for="select-all-${groupId}"><strong>Select All</strong></label>
      `;
      
      // Add event listener to the "Select All" checkbox
      selectAllDiv.querySelector('input').addEventListener('change', function(e) {
        const isChecked = e.target.checked;
        const groupCheckboxes = permissionsContainer.querySelectorAll(`input[data-group="${group}"]`);
        groupCheckboxes.forEach(checkbox => {
          checkbox.checked = isChecked;
        });
      });
      
      permissionsContainer.appendChild(groupHeader);
      permissionsContainer.appendChild(selectAllDiv);
      
      // Add page checkboxes
      groupPages.forEach(page => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'permission-checkbox';
        
        const isChecked = selectedPermissions.includes(page.id);
        checkboxDiv.innerHTML = `
          <input type="checkbox" id="perm-${page.id}" value="${page.id}" data-group="${group}" ${isChecked ? 'checked' : ''}>
          <label for="perm-${page.id}">${page.name}</label>
        `;
        
        // Add event listener to update "Select All" when individual permissions are changed
        checkboxDiv.querySelector('input').addEventListener('change', function() {
          const groupCheckboxes = permissionsContainer.querySelectorAll(`input[data-group="${group}"]`);
          const allChecked = Array.from(groupCheckboxes).every(checkbox => checkbox.checked);
          permissionsContainer.querySelector(`#select-all-${groupId}`).checked = allChecked;
        });
        
        permissionsContainer.appendChild(checkboxDiv);
      });
    });
    
    // Show modal
    roleModal.classList.remove('hidden');
  }
  
  function closeRoleModal() {
    roleModal.classList.add('hidden');
    currentRoleId = null;
  }
  
  function closeDeleteModal() {
    deleteConfirmModal.classList.add('hidden');
    currentRoleId = null;
  }
  
  function saveRole() {
    const roleName = document.getElementById('roleName').value.trim();
    if (!roleName) {
      alert('Please enter a role name');
      return;
    }
    
    // Get selected permissions
    const permissionCheckboxes = document.querySelectorAll('#permissionsContainer input[type="checkbox"]:checked');
    const selectedPermissions = Array.from(permissionCheckboxes).map(cb => cb.value);
    
    if (selectedPermissions.length === 0) {
      alert('Please select at least one permission');
      return;
    }
    
    const now = formatDate(new Date());
    
    if (currentRoleId) {
      // Update existing role
      const roleIndex = roles.findIndex(r => r.id === currentRoleId);
      if (roleIndex !== -1) {
        roles[roleIndex].name = roleName;
        roles[roleIndex].permissions = selectedPermissions;
        roles[roleIndex].lastModified = now;
      }
    } else {
      // Add new role
      const newRole = {
        id: generateId(),
        name: roleName,
        createdDate: now,
        lastModified: now,
        permissions: selectedPermissions
      };
      roles.push(newRole);
    }
    
    // Save to localStorage
    saveRolesToStorage();
    
    // Update UI
    updateUICounters();
    populateRolesTable();
    
    // Close modal
    closeRoleModal();
  }
  
  // Save roles to localStorage
  function saveRolesToStorage() {
    localStorage.setItem('rolesData', JSON.stringify(roles));
  }
  
  // Generate unique ID
  function generateId() {
    return 'role_' + Date.now() + Math.floor(Math.random() * 1000);
  }
  
  // Format date
  function formatDate(date, includeTime = false) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (includeTime) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  
  // Global functions for edit and delete
  window.editRole = function(roleId) {
    openRoleModal(roleId);
  };
  
  window.deleteRole = function(roleId) {
    currentRoleId = roleId;
    deleteConfirmModal.classList.remove('hidden');
    
    // Set up confirmation button
    confirmDeleteBtn.onclick = function() {
      if (currentRoleId) {
        const roleIndex = roles.findIndex(r => r.id === currentRoleId);
        if (roleIndex !== -1) {
          // Don't allow deleting the last role
          if (roles.length <= 1) {
            alert('Cannot delete the last remaining role');
            closeDeleteModal();
            return;
          }
          
          // Remove role
          roles.splice(roleIndex, 1);
          saveRolesToStorage();
          
          // Update UI
          updateUICounters();
          populateRolesTable();
        }
      }
      closeDeleteModal();
    };
  };
  
  // Utility function to create preset roles with predefined permissions
  window.createPresetRole = function(preset) {
    // Close any open modals
    closeRoleModal();
    closeDeleteModal();
    
    const now = formatDate(new Date());
    let newRole = {
      id: generateId(),
      createdDate: now,
      lastModified: now,
      permissions: []
    };
    
    switch(preset) {
      case 'admin':
        newRole.name = 'Administrator';
        // All permissions
        newRole.permissions = websitePages.map(page => page.id);
        break;
        
      case 'finance':
        newRole.name = 'Finance Officer';
        // Finance permissions: dashboards, checks, approvals for financial documents
        newRole.permissions = websitePages
          .filter(page => 
            page.group === 'Dashboard & Administration' || 
            page.group === 'Menu Access' || 
            page.group === 'Detail Access' ||
            page.group === 'Checking Process'
          )
          .map(page => page.id);
        break;
        
      case 'requester':
        newRole.name = 'Requester';
        // Requester permissions: can create requests but not approve
        newRole.permissions = websitePages
          .filter(page => 
            page.id === 'dashboard' || 
            page.id === 'profil' ||
            page.group === 'Menu Access' || 
            page.group === 'Detail Access' ||
            page.group === 'Creation Access'
          )
          .map(page => page.id);
        break;
        
      case 'approver':
        newRole.name = 'Approver';
        // Approver permissions: can view and approve, but not create
        newRole.permissions = websitePages
          .filter(page => 
            page.id === 'dashboard' || 
            page.id === 'approval-dashboard' ||
            page.id === 'profil' ||
            page.group === 'Detail Access' ||
            page.group === 'Approval Process'
          )
          .map(page => page.id);
        break;
        
      case 'checker':
        newRole.name = 'Document Checker';
        // Checker permissions: can check documents
        newRole.permissions = websitePages
          .filter(page => 
            page.id === 'dashboard' || 
            page.id === 'profil' ||
            page.group === 'Detail Access' ||
            page.group === 'Checking Process'
          )
          .map(page => page.id);
        break;
        
      case 'acknowledger':
        newRole.name = 'Document Acknowledger';
        // Acknowledger permissions: can acknowledge documents
        newRole.permissions = websitePages
          .filter(page => 
            page.id === 'dashboard' || 
            page.id === 'profil' ||
            page.group === 'Detail Access' ||
            page.group === 'Acknowledgement Process'
          )
          .map(page => page.id);
        break;
        
      case 'receiver':
        newRole.name = 'PR Receiver';
        // Receiver permissions: can receive PR
        newRole.permissions = websitePages
          .filter(page => 
            page.id === 'dashboard' || 
            page.id === 'profil' ||
            page.id === 'detailPR' ||
            page.group === 'PR Processing'
          )
          .map(page => page.id);
        break;
    }
    
    // Add the new role
    roles.push(newRole);
    saveRolesToStorage();
    
    // Update UI
    updateUICounters();
    populateRolesTable();
  };
}); 