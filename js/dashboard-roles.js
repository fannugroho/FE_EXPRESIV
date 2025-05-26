document.addEventListener('DOMContentLoaded', function() {
  // Initialize roles array
  let roles = [];
  let currentRoleId = null;
  
  // Sample website pages for permissions
  const websitePages = [
    { id: 'dashboard', name: 'Dashboard', folder: 'pages' },
    { id: 'dashboard-users', name: 'User Management', folder: 'pages' },
    { id: 'dashboard-roles', name: 'Role Management', folder: 'pages' },
    { id: 'register', name: 'Registration', folder: 'pages' },
    { id: 'approval-dashboard', name: 'Approval Dashboard', folder: 'pages' },
    { id: 'profile', name: 'User Profile', folder: 'pages' },
    { id: 'settings', name: 'Settings', folder: 'pages' },
    { id: 'reports', name: 'Reports', folder: 'pages' },
    { id: 'employees', name: 'Employee Directory', folder: 'pages' },
    { id: 'departments', name: 'Departments', folder: 'pages' },
    { id: 'user-edit', name: 'Edit User', folder: 'detailPages' },
    { id: 'user-view', name: 'View User', folder: 'detailPages' },
    { id: 'department-details', name: 'Department Details', folder: 'detailPages' },
    { id: 'add-employee', name: 'Add Employee', folder: 'addPages' },
    { id: 'add-department', name: 'Add Department', folder: 'addPages' },
    { id: 'leave-approval', name: 'Leave Approval', folder: 'approvalPages' },
    { id: 'expense-approval', name: 'Expense Approval', folder: 'approvalPages' }
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
    
    // Show max 3 permissions
    const visiblePermissions = permissions.slice(0, 3);
    let badges = '';
    
    visiblePermissions.forEach(permId => {
      const page = websitePages.find(p => p.id === permId);
      if (page) {
        badges += `<span class="permission-badge"><i class="fas fa-check-circle"></i> ${page.name}</span>`;
      }
    });
    
    if (permissions.length > 3) {
      badges += `<span class="permission-badge">+${permissions.length - 3} more</span>`;
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
    
    // Group pages by folder
    const pagesByFolder = {};
    websitePages.forEach(page => {
      if (!pagesByFolder[page.folder]) {
        pagesByFolder[page.folder] = [];
      }
      pagesByFolder[page.folder].push(page);
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
    
    // Populate permissions checkboxes by folder
    Object.keys(pagesByFolder).forEach(folder => {
      const folderPages = pagesByFolder[folder];
      
      // Add folder header
      const folderHeader = document.createElement('div');
      folderHeader.className = 'permission-category';
      folderHeader.textContent = folder.charAt(0).toUpperCase() + folder.slice(1);
      permissionsContainer.appendChild(folderHeader);
      
      // Add page checkboxes
      folderPages.forEach(page => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'permission-checkbox';
        
        const isChecked = selectedPermissions.includes(page.id);
        checkboxDiv.innerHTML = `
          <input type="checkbox" id="perm-${page.id}" value="${page.id}" ${isChecked ? 'checked' : ''}>
          <label for="perm-${page.id}">${page.name}</label>
        `;
        
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
}); 