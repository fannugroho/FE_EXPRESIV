document.addEventListener('DOMContentLoaded', function() {
  // Use BASE_URL from auth.js - make sure auth.js is loaded before this script
  
  // Initialize roles array
  let roles = [];
  let permissions = []; // Will be fetched from backend
  let currentRoleId = null;
  
  // Fetch roles and permissions from backend on page load
  async function initializePage() {
    try {
      await loadPermissions();
      await loadRoles();
      updateUICounters();
      populateRolesTable();
    } catch (error) {
      console.error('Error initializing page:', error);
      showError('Failed to load data from server');
    }
  }

  // Load permissions from backend
  async function loadPermissions() {
    try {
      const response = await makeAuthenticatedRequest('/api/permissions', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      
      const result = await response.json();
      permissions = result.data || [];
      console.log('Loaded permissions:', permissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Fallback to some basic permissions if API fails
      permissions = [
        { id: '1', name: 'MANAGE_USERS', description: 'Permission to manage users' },
        { id: '2', name: 'MANAGE_ROLES', description: 'Permission to manage roles' },
        { id: '3', name: 'APPROVE_PR', description: 'Permission to approve purchase requests' },
        { id: '4', name: 'SUBMIT_USER', description: 'Permission to submit user registrations' },
        { id: '5', name: 'USER_APPROVAL', description: 'Permission to approve user registrations' },
        { id: '6', name: 'PREPARE_PR', description: 'Permission to prepare purchase requests' },
        { id: '7', name: 'ACKNOWLEDGE_PR', description: 'Permission to acknowledge purchase requests' },
        { id: '8', name: 'CHECK_PR', description: 'Permission to check purchase requests' },
        { id: '9', name: 'RECEIVE_PR', description: 'Permission to receive purchase requests' }
      ];
    }
  }

  // Load roles from backend
  async function loadRoles() {
    try {
      const response = await makeAuthenticatedRequest('/api/roles', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const result = await response.json();
      const roleNames = result.data || [];
      
      // For each role, get its permissions
      roles = [];
      for (const roleName of roleNames) {
        const rolePermissions = await getRolePermissions(roleName);
        roles.push({
          id: roleName.toLowerCase().replace(/\s+/g, '-'),
          name: roleName,
          createdDate: formatDate(new Date()), // Note: We don't have actual creation dates
          lastModified: formatDate(new Date()),
          permissions: rolePermissions.map(p => p.name)
        });
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      roles = []; // Empty array if API fails
    }
  }

  // Get permissions for a specific role
  async function getRolePermissions(roleName) {
    try {
      const response = await makeAuthenticatedRequest(`/api/permissions/role/${encodeURIComponent(roleName)}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error loading role permissions:', error);
      return [];
    }
  }

  // Get auth token - using function from auth.js
  function getAuthToken() {
    return getAccessToken();
  }

  // Show error message
  function showError(message) {
    alert(message); // Replace with better error handling
  }

  // Show success message
  function showSuccess(message) {
    alert(message); // Replace with better success handling
  }

  // Update UI elements
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
  
  function getPermissionBadges(rolePermissions) {
    if (!rolePermissions || rolePermissions.length === 0) {
      return '<span class="text-gray-400 text-xs italic">No permissions</span>';
    }
    
    // Show permission badges
    let badges = '';
    const maxVisible = 3;
    
    for (let i = 0; i < Math.min(rolePermissions.length, maxVisible); i++) {
      const permission = permissions.find(p => p.name === rolePermissions[i]);
      const displayName = permission ? permission.name : rolePermissions[i];
      badges += `<span class="permission-badge"><i class="fas fa-shield-alt"></i> ${displayName}</span>`;
    }
    
    if (rolePermissions.length > maxVisible) {
      badges += `<span class="permission-badge">+${rolePermissions.length - maxVisible} more</span>`;
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
    
    // Group permissions by type for better organization
    const permissionGroups = {
      'System Administration': permissions.filter(p => 
        p.name.includes('MANAGE') || p.name.includes('USER') || p.name.includes('ROLE')
      ),
      'Purchase Request Process': permissions.filter(p => 
        p.name.includes('PR') || p.name.includes('PREPARE') || p.name.includes('RECEIVE')
      ),
      'Approval Process': permissions.filter(p => 
        p.name.includes('APPROVE')
      ),
      'Checking Process': permissions.filter(p => 
        p.name.includes('CHECK')
      ),
      'Acknowledgement Process': permissions.filter(p => 
        p.name.includes('ACKNOWLEDGE')
      ),
      'Other Permissions': permissions.filter(p => 
        !p.name.includes('MANAGE') && !p.name.includes('USER') && !p.name.includes('ROLE') &&
        !p.name.includes('PR') && !p.name.includes('PREPARE') && !p.name.includes('RECEIVE') &&
        !p.name.includes('APPROVE') && !p.name.includes('CHECK') && !p.name.includes('ACKNOWLEDGE')
      )
    };
    
    // Populate permissions checkboxes by group
    Object.keys(permissionGroups).forEach(groupName => {
      const groupPermissions = permissionGroups[groupName];
      
      if (groupPermissions.length === 0) return; // Skip empty groups
      
      // Add group header
      const groupHeader = document.createElement('div');
      groupHeader.className = 'permission-category';
      groupHeader.textContent = groupName;
      
      // Add "Select All" checkbox for this group
      const selectAllDiv = document.createElement('div');
      selectAllDiv.className = 'permission-checkbox select-all';
      
      const groupId = groupName.replace(/\s+/g, '-').toLowerCase();
      const allChecked = groupPermissions.every(permission => selectedPermissions.includes(permission.name));
      
      selectAllDiv.innerHTML = `
        <input type="checkbox" id="select-all-${groupId}" ${allChecked ? 'checked' : ''}>
        <label for="select-all-${groupId}"><strong>Select All ${groupName}</strong></label>
      `;
      
      // Add event listener to the "Select All" checkbox
      selectAllDiv.querySelector('input').addEventListener('change', function(e) {
        const isChecked = e.target.checked;
        const groupCheckboxes = permissionsContainer.querySelectorAll(`input[data-group="${groupName}"]`);
        groupCheckboxes.forEach(checkbox => {
          checkbox.checked = isChecked;
        });
      });
      
      permissionsContainer.appendChild(groupHeader);
      permissionsContainer.appendChild(selectAllDiv);
      
      // Add individual permission checkboxes
      groupPermissions.forEach(permission => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'permission-checkbox';
        
        const isChecked = selectedPermissions.includes(permission.name);
        checkboxDiv.innerHTML = `
          <input type="checkbox" id="perm-${permission.name}" value="${permission.name}" data-group="${groupName}" ${isChecked ? 'checked' : ''}>
          <label for="perm-${permission.name}">
            <strong>${permission.name}</strong>
            <span class="permission-description">${permission.description}</span>
          </label>
        `;
        
        // Add event listener to update "Select All" when individual permissions are changed
        checkboxDiv.querySelector('input').addEventListener('change', function() {
          const groupCheckboxes = permissionsContainer.querySelectorAll(`input[data-group="${groupName}"]`);
          const allChecked = Array.from(groupCheckboxes).every(checkbox => checkbox.checked);
          const selectAllCheckbox = permissionsContainer.querySelector(`#select-all-${groupId}`);
          if (selectAllCheckbox) {
            selectAllCheckbox.checked = allChecked;
          }
        });
        
        permissionsContainer.appendChild(checkboxDiv);
      });
    });
    
    // Show modal
    document.getElementById('roleModal').classList.remove('hidden');
  }
  
  function closeRoleModal() {
    document.getElementById('roleModal').classList.add('hidden');
    currentRoleId = null;
  }
  
  function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.add('hidden');
    currentRoleId = null;
  }
  
  async function saveRole() {
    const roleName = document.getElementById('roleName').value.trim();
    if (!roleName) {
      showError('Please enter a role name');
      return;
    }
    
    // Get selected permissions (exclude "Select All" checkboxes)
    const permissionCheckboxes = document.querySelectorAll('#permissionsContainer input[type="checkbox"]:checked:not([id^="select-all"])');
    const selectedPermissions = Array.from(permissionCheckboxes).map(cb => cb.value).filter(value => value && value !== 'on');
    
    console.log('Selected permissions:', selectedPermissions);
    console.log('All checked checkboxes:', Array.from(permissionCheckboxes).map(cb => ({ id: cb.id, value: cb.value })));
    
    try {
      if (currentRoleId) {
        // Update existing role
        await updateRole(currentRoleId, roleName, selectedPermissions);
      } else {
        // Create new role
        await createRole(roleName, selectedPermissions);
      }
      
      // Reload data and update UI
      await loadRoles();
      updateUICounters();
      populateRolesTable();
      closeRoleModal();
      showSuccess(`Role ${currentRoleId ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('Error saving role:', error);
      showError(`Failed to ${currentRoleId ? 'update' : 'create'} role: ${error.message}`);
    }
  }

  // Create new role
  async function createRole(roleName, selectedPermissions) {
    // First create the role
    const createResponse = await makeAuthenticatedRequest('/api/roles', {
      method: 'POST',
      body: JSON.stringify(roleName)
    });
    
    if (!createResponse.ok) {
      throw new Error('Failed to create role');
    }
    
    // Then assign permissions to the role
    for (const permissionName of selectedPermissions) {
      await assignPermissionToRole(roleName, permissionName);
    }
  }

      // Update existing role
  async function updateRole(roleId, roleName, selectedPermissions) {
    const role = roles.find(r => r.id === roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    
    const currentPermissions = role.permissions;
    
    // Remove permissions that are no longer selected
    const permissionsToRemove = currentPermissions.filter(p => !selectedPermissions.includes(p));
    for (const permissionName of permissionsToRemove) {
      await removePermissionFromRole(role.name, permissionName);
    }
    
    // Add new permissions
    const permissionsToAdd = selectedPermissions.filter(p => !currentPermissions.includes(p));
    for (const permissionName of permissionsToAdd) {
      await assignPermissionToRole(role.name, permissionName);
    }
  }

  // Assign permission to role
  async function assignPermissionToRole(roleName, permissionName) {
    console.log('Assigning permission:', { roleName, permissionName });
    
    const requestBody = {
      RoleName: roleName,
      PermissionName: permissionName
    };
    
    console.log('Request body:', requestBody);
    
    const response = await makeAuthenticatedRequest('/api/permissions/assign', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to assign permission ${permissionName} to role ${roleName}: ${response.status} ${errorText}`);
    }
  }

  // Remove permission from role
  async function removePermissionFromRole(roleName, permissionName) {
    const response = await makeAuthenticatedRequest(`/api/permissions/remove?roleName=${encodeURIComponent(roleName)}&permissionName=${encodeURIComponent(permissionName)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove permission ${permissionName} from role ${roleName}`);
    }
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
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
    
    // Set up confirmation button
    document.getElementById('confirmDeleteBtn').onclick = async function() {
      try {
        const role = roles.find(r => r.id === roleId);
        if (!role) {
          throw new Error('Role not found');
        }
        
        // Don't allow deleting the last role or Admin role
          if (roles.length <= 1) {
          showError('Cannot delete the last remaining role');
          closeDeleteModal();
          return;
        }
        
        if (role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'administrator') {
          showError('Cannot delete the Administrator role');
            closeDeleteModal();
            return;
          }
          
        // Delete role via API
        const response = await makeAuthenticatedRequest(`/api/roles/${encodeURIComponent(role.name)}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete role');
        }
        
        // Reload data and update UI
        await loadRoles();
        updateUICounters();
        populateRolesTable();
        closeDeleteModal();
        showSuccess('Role deleted successfully!');
        
      } catch (error) {
        console.error('Error deleting role:', error);
        showError(`Failed to delete role: ${error.message}`);
        closeDeleteModal();
      }
    };
  };
  
  // Create preset role functionality
  async function createPresetRole(preset) {
    try {
      const presetRoles = {
        'admin': {
          name: 'Administrator',
          permissions: permissions.map(p => p.name) // All permissions
        },
        'finance': {
          name: 'Finance Officer',
          permissions: permissions.filter(p => 
            p.name.includes('MANAGE') || 
            p.name.includes('APPROVE') || 
            p.name.includes('CHECK')
          ).map(p => p.name)
        },
        'requester': {
          name: 'Requester',
          permissions: permissions.filter(p => 
            p.name.includes('SUBMIT') || 
            p.name.includes('PREPARE')
          ).map(p => p.name)
        },
        'approver': {
          name: 'Approver',
          permissions: permissions.filter(p => 
            p.name.includes('APPROVE')
          ).map(p => p.name)
        },
        'checker': {
          name: 'Document Checker',
          permissions: permissions.filter(p => 
            p.name.includes('CHECK')
          ).map(p => p.name)
        },
        'acknowledger': {
          name: 'Document Acknowledger',
          permissions: permissions.filter(p => 
            p.name.includes('ACKNOWLEDGE')
          ).map(p => p.name)
        },
        'receiver': {
          name: 'PR Receiver',
          permissions: permissions.filter(p => 
            p.name.includes('RECEIVE')
          ).map(p => p.name)
        }
      };

      const roleConfig = presetRoles[preset];
      if (!roleConfig) {
        throw new Error('Unknown preset type');
      }

      await createRole(roleConfig.name, roleConfig.permissions);
      
      // Reload data and update UI
      await loadRoles();
      updateUICounters();
      populateRolesTable();
      showSuccess(`${roleConfig.name} role created successfully!`);
      
    } catch (error) {
      console.error('Error creating preset role:', error);
      showError(`Failed to create preset role: ${error.message}`);
    }
  }

  // Add event listeners
  const addRoleBtn = document.getElementById('addRoleBtn');
  const saveRoleBtn = document.getElementById('saveRoleBtn');
  const cancelRoleBtn = document.getElementById('cancelRoleBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const searchInput = document.getElementById('search');
  const presetRolesBtn = document.getElementById('presetRolesBtn');
  const presetRolesMenu = document.getElementById('presetRolesMenu');
  
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

  // Initialize the page
  initializePage();
}); 