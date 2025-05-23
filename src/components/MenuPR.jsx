import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

const MenuPR = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:5246";

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, filterStatus]);

  const fetchPurchaseRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/pr`);
      const result = await response.json();
      
      if (result.status && result.data) {
        const mappedDocuments = result.data.map(doc => ({
          id: doc.id,
          docNumber: doc.purchaseRequestNo,
          docDate: doc.submissionDate,
          requestor: doc.requesterName,
          department: doc.departmentName,
          supplier: doc.classification || "Various",
          totalAmount: calculateTotalAmount(doc),
          docStatus: doc.approval?.status || "Draft",
          urgency: doc.prType === "Service" ? "Normal" : "High",
          notes: doc.remarks || "",
          createdAt: doc.submissionDate,
          createdBy: doc.requesterId,
          requiredDate: doc.requiredDate,
          classification: doc.classification,
          prType: doc.prType,
          documentType: doc.documentType,
          docEntrySAP: doc.docEntrySAP,
          itemDetails: doc.itemDetails,
          serviceDetails: doc.serviceDetails,
          approval: doc.approval,
          attachments: doc.attachments
        }));
        
        setDocuments(mappedDocuments);
      } else {
        setError("Failed to fetch data from API");
        loadLocalDocuments();
      }
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      setError("API connection failed. Using local data.");
      loadLocalDocuments();
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = (doc) => {
    let total = 0;
    
    if (doc.itemDetails && Array.isArray(doc.itemDetails)) {
      total += doc.itemDetails.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice || 0);
      }, 0);
    }
    
    if (doc.serviceDetails && Array.isArray(doc.serviceDetails) && doc.serviceDetails.length > 0) {
      total = doc.serviceDetails.length * 1000000;
    }
    
    return total || 0;
  };

  const loadLocalDocuments = () => {
    const storedDocuments = JSON.parse(localStorage.getItem("documents")) || [];
    const prDocuments = storedDocuments.filter(doc => doc.docType === "Purchase Request");
    setDocuments(prDocuments);
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.requestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(doc => doc.docStatus === filterStatus);
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Open': 'bg-blue-100 text-blue-800',
      'Prepared': 'bg-yellow-100 text-yellow-800',
      'Checked': 'bg-purple-100 text-purple-800',
      'Acknowledged': 'bg-indigo-100 text-indigo-800',
      'Approved': 'bg-green-100 text-green-800',
      'Received': 'bg-gray-100 text-gray-800',
      'Closed': 'bg-gray-500 text-white',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const exportToExcel = () => {
    console.log('Exporting to Excel...');
    alert('Excel export functionality will be implemented');
  };

  const exportToPDF = () => {
    console.log('Exporting to PDF...');
    alert('PDF export functionality will be implemented');
  };

  const viewDetail = (docId, prType) => {
    window.location.href = `../detailPages/detailPR.html?pr-id=${docId}&pr-type=${prType}`;
  };

  const editDocument = (docId) => {
    navigate(`/edit-pr/${docId}`);
  };

  const deleteDocument = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const updatedDocuments = documents.filter(doc => doc.id !== docId);
      setDocuments(updatedDocuments);
      
      const allDocuments = JSON.parse(localStorage.getItem("documents")) || [];
      const filteredAll = allDocuments.filter(doc => doc.id !== docId);
      localStorage.setItem("documents", JSON.stringify(filteredAll));
    }
  };

  const refreshData = () => {
    fetchPurchaseRequests();
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  return (
    <Layout title="Purchase Request List">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm border border-white border-opacity-20 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Purchase Request List</h1>
              <p className="text-white opacity-80">Manage your purchase requests efficiently</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate('/add-pr')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-white border-opacity-30 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Add New PR
              </button>
              <button
                onClick={exportToExcel}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-white border-opacity-30 flex items-center gap-2"
              >
                <i className="fas fa-file-excel"></i>
                Export Excel
              </button>
              <button
                onClick={exportToPDF}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-white border-opacity-30 flex items-center gap-2"
              >
                <i className="fas fa-file-pdf"></i>
                Export PDF
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by document number, requestor, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <option value="All" className="text-gray-800">All Status</option>
                <option value="Draft" className="text-gray-800">Draft</option>
                <option value="Open" className="text-gray-800">Open</option>
                <option value="Prepared" className="text-gray-800">Prepared</option>
                <option value="Checked" className="text-gray-800">Checked</option>
                <option value="Acknowledged" className="text-gray-800">Acknowledged</option>
                <option value="Approved" className="text-gray-800">Approved</option>
                <option value="Received" className="text-gray-800">Received</option>
                <option value="Rejected" className="text-gray-800">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={refreshData}
                className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 border border-white border-opacity-30 flex items-center justify-center gap-2"
              >
                <i className="fas fa-refresh"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-lg border border-white border-opacity-30">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500 bg-opacity-50 rounded-lg">
                  <i className="fas fa-file-alt text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-white opacity-80 text-sm">Total</p>
                  <p className="text-white text-2xl font-bold">{documents.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg border border-white border-opacity-30">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 bg-opacity-50 rounded-lg">
                  <i className="fas fa-clock text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-white opacity-80 text-sm">Pending</p>
                  <p className="text-white text-2xl font-bold">
                    {documents.filter(doc => ['Draft', 'Open', 'Prepared'].includes(doc.docStatus)).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg border border-white border-opacity-30">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 bg-opacity-50 rounded-lg">
                  <i className="fas fa-check-circle text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-white opacity-80 text-sm">Approved</p>
                  <p className="text-white text-2xl font-bold">
                    {documents.filter(doc => doc.docStatus === 'Approved').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg border border-white border-opacity-30">
              <div className="flex items-center">
                <div className="p-2 bg-red-500 bg-opacity-50 rounded-lg">
                  <i className="fas fa-times-circle text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-white opacity-80 text-sm">Rejected</p>
                  <p className="text-white text-2xl font-bold">
                    {documents.filter(doc => doc.docStatus === 'Rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm border border-white border-opacity-20 rounded-xl p-8 text-center">
            <i className="fas fa-spinner fa-spin text-white text-2xl mb-4"></i>
            <p className="text-white">Loading purchase requests...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500 bg-opacity-20 backdrop-filter backdrop-blur-sm border border-red-500 border-opacity-30 rounded-xl p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-300 mr-3"></i>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Documents Table */}
        {!loading && (
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm border border-white border-opacity-20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white bg-opacity-20">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-medium">Document No.</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Requestor</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Department</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-white opacity-70">
                        No purchase requests found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((doc) => (
                      <tr key={doc.id} className="border-t border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-all duration-200">
                        <td className="px-4 py-3 text-white font-medium">{doc.docNumber}</td>
                        <td className="px-4 py-3 text-white">{formatDate(doc.docDate)}</td>
                        <td className="px-4 py-3 text-white">{doc.requestor}</td>
                        <td className="px-4 py-3 text-white">{doc.department}</td>
                        <td className="px-4 py-3 text-white">{formatCurrency(doc.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.docStatus)}`}>
                            {doc.docStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewDetail(doc.id, doc.prType)}
                              className="text-blue-300 hover:text-blue-100 transition-colors"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => editDocument(doc.id)}
                              className="text-yellow-300 hover:text-yellow-100 transition-colors"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="text-red-300 hover:text-red-100 transition-colors"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm border border-white border-opacity-20 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-white opacity-80 text-sm">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDocuments.length)} of {filteredDocuments.length} entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white bg-opacity-20 text-white rounded border border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-1 rounded border transition-all ${
                      currentPage === index + 1
                        ? 'bg-white text-blue-600 border-white'
                        : 'bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white bg-opacity-20 text-white rounded border border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MenuPR; 