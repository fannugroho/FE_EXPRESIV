document.addEventListener('DOMContentLoaded', function() {
  // Initialize empty users array
  let users = [];
  
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
              status: 'pending',
              registeredDate: new Date().toISOString().split('T')[0],
              documents: parsedData.documents ? parsedData.documents.map(doc => doc.name) : []
            });
          }
        });
      }
    } catch (error) {
      console.error('Error parsing stored data:', error);
    }
  }

  // Update UI elements
  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('totalItems').textContent = users.length;
  document.getElementById('lastUpdated').textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  // Populate table
  const tableBody = document.getElementById('userTableBody');
  if (tableBody) {
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="px-6 py-10 text-center text-gray-500">
            No registered users found. Please register users through the registration page.
          </td>
        </tr>
      `;
    } else {
      users.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        tr.dataset.userId = user.id;
        
        // Status badge
        const getStatusBadge = (status) => {
          let className, icon;
          switch(status.toLowerCase()) {
            case 'active': 
              className = 'status-active'; 
              icon = 'fa-check-circle'; 
              break;
            case 'pending': 
              className = 'status-pending'; 
              icon = 'fa-clock'; 
              break;
            case 'inactive': 
              className = 'status-inactive'; 
              icon = 'fa-ban'; 
              break;
            default: 
              className = 'status-pending'; 
              icon = 'fa-question-circle';
          }
          return `<span class="status-badge ${className}"><i class="fas ${icon} mr-1"></i> ${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
        };
        
        // Document badges
        const getDocBadges = (docs) => {
          if (!docs || docs.length === 0) return '<span class="text-gray-400 text-xs italic">No documents</span>';
          
          const visibleDocs = docs.slice(0, 2);
          let badges = '';
          
          visibleDocs.forEach(doc => {
            let icon = 'fa-file';
            if (doc.endsWith('.pdf')) icon = 'fa-file-pdf';
            else if (doc.match(/\.(jpg|jpeg|png|gif)$/i)) icon = 'fa-file-image';
            
            badges += `<span class="document-badge"><i class="fas ${icon}"></i> ${doc.split('.')[0]}</span>`;
          });
          
          if (docs.length > 2) {
            badges += `<span class="document-badge">+${docs.length - 2} more</span>`;
          }
          
          return badges;
        };
        
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.id}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${user.fullName}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.nik}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${user.department}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${user.position}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.phone}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
          <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(user.status)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.registeredDate)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${getDocBadges(user.documents)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex justify-end">
              <button type="button" class="action-btn view-btn" title="View Details" onclick="showUserDetails('${user.id}')">
                <i class="fas fa-eye"></i>
              </button>
              <button type="button" class="action-btn edit-btn" title="Edit User">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="action-btn delete-btn" title="Delete User">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        `;
        
        tableBody.appendChild(tr);
      });
    }
  }

  // Set up search functionality
  const searchInput = document.getElementById('search');
  const departmentFilter = document.getElementById('filter-department');
  const statusFilter = document.getElementById('filter-status');
  
  function applyFilters() {
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const department = (departmentFilter?.value || '').toLowerCase();
    const status = (statusFilter?.value || '').toLowerCase();
    
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.id.toLowerCase().includes(searchTerm) ||
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.department.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    if (department) {
      filtered = filtered.filter(user => user.department.toLowerCase() === department);
    }
    
    if (status) {
      filtered = filtered.filter(user => user.status.toLowerCase() === status);
    }
    
    populateTable(filtered);
  }
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  
  // User modal functionality
  const modal = document.getElementById('userDetailsModal');
  const closeModalBtn = document.getElementById('closeModal');
  
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  
  // Global function to show user details
  window.showUserDetails = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const userDetailsContent = document.getElementById('userDetailsContent');
    if (!userDetailsContent) return;
    
    userDetailsContent.innerHTML = `
      <div class="grid grid-cols-1 gap-4">
        <div class="text-center mb-3">
          <div class="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <i class="fas fa-user text-3xl text-blue-600"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-2">${user.fullName}</h3>
          <p class="text-sm text-gray-500">${user.position} - ${user.department}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <h4 class="text-xs font-medium text-gray-500 uppercase">Employee ID</h4>
            <p class="text-sm text-gray-900">${user.id}</p>
          </div>
          <div>
            <h4 class="text-xs font-medium text-gray-500 uppercase">NIK</h4>
            <p class="text-sm text-gray-900">${user.nik}</p>
          </div>
          <div>
            <h4 class="text-xs font-medium text-gray-500 uppercase">Email</h4>
            <p class="text-sm text-gray-900">${user.email}</p>
          </div>
          <div>
            <h4 class="text-xs font-medium text-gray-500 uppercase">Phone</h4>
            <p class="text-sm text-gray-900">${user.phone}</p>
          </div>
          <div>
            <h4 class="text-xs font-medium text-gray-500 uppercase">Status</h4>
            <p class="text-sm text-gray-900">${user.status}</p>
          </div>
          <div>
            <h4 class="text-xs font-medium text-gray-500 uppercase">Registered Date</h4>
            <p class="text-sm text-gray-900">${formatDate(user.registeredDate)}</p>
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-4 mt-2">
          <h4 class="text-xs font-medium text-gray-500 uppercase mb-2">Documents</h4>
          <div class="flex flex-wrap gap-2 mt-1">
            ${user.documents && user.documents.length > 0 
              ? user.documents.map(doc => `
                <span class="document-badge">
                  <i class="fas ${doc.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file'}"></i> ${doc}
                </span>`).join('')
              : '<span class="text-sm text-gray-500 italic">No documents</span>'
            }
          </div>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
  };
  
  // Helper function to format date
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  // Helper function to populate table with filtered data
  function populateTable(data) {
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="px-6 py-10 text-center text-gray-500">
            No users found matching your search criteria.
          </td>
        </tr>
      `;
      return;
    }
    
    // Update count display
    document.getElementById('startItem').textContent = '1';
    document.getElementById('endItem').textContent = Math.min(data.length, 10);
    document.getElementById('totalItems').textContent = data.length;
    
    // Reuse the same row creation logic from above
    data.forEach((user, index) => {
      const tr = document.createElement('tr');
      tr.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      tr.dataset.userId = user.id;
      
      // Status badge
      const getStatusBadge = (status) => {
        let className, icon;
        switch(status.toLowerCase()) {
          case 'active': 
            className = 'status-active'; 
            icon = 'fa-check-circle'; 
            break;
          case 'pending': 
            className = 'status-pending'; 
            icon = 'fa-clock'; 
            break;
          case 'inactive': 
            className = 'status-inactive'; 
            icon = 'fa-ban'; 
            break;
          default: 
            className = 'status-pending'; 
            icon = 'fa-question-circle';
        }
        return `<span class="status-badge ${className}"><i class="fas ${icon} mr-1"></i> ${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
      };
      
      // Document badges
      const getDocBadges = (docs) => {
        if (!docs || docs.length === 0) return '<span class="text-gray-400 text-xs italic">No documents</span>';
        
        const visibleDocs = docs.slice(0, 2);
        let badges = '';
        
        visibleDocs.forEach(doc => {
          let icon = 'fa-file';
          if (doc.endsWith('.pdf')) icon = 'fa-file-pdf';
          else if (doc.match(/\.(jpg|jpeg|png|gif)$/i)) icon = 'fa-file-image';
          
          badges += `<span class="document-badge"><i class="fas ${icon}"></i> ${doc.split('.')[0]}</span>`;
        });
        
        if (docs.length > 2) {
          badges += `<span class="document-badge">+${docs.length - 2} more</span>`;
        }
        
        return badges;
      };
      
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${user.fullName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.nik}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${user.department}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${user.position}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.phone}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
        <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(user.status)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.registeredDate)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${getDocBadges(user.documents)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end">
            <button type="button" class="action-btn view-btn" title="View Details" onclick="showUserDetails('${user.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button type="button" class="action-btn edit-btn" title="Edit User">
              <i class="fas fa-edit"></i>
            </button>
            <button type="button" class="action-btn delete-btn" title="Delete User">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(tr);
    });
  }
}); 