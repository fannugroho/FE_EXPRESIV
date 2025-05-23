// Sample data for testing the Kansai Paint Expressiv System

export const initializeSampleData = () => {
  // Check if data already exists
  const existingUsers = localStorage.getItem("users");
  const existingDocs = localStorage.getItem("documents");

  // Sample users
  if (!existingUsers) {
    const sampleUsers = [
      {
        usercode: "admin",
        password: "admin123",
        name: "Administrator",
        email: "admin@kansaipaint.com",
        role: "Admin",
        department: "IT"
      },
      {
        usercode: "user",
        password: "user123",
        name: "John Doe",
        email: "john.doe@kansaipaint.com",
        role: "Manager",
        department: "Finance"
      },
      {
        usercode: "jane.smith",
        password: "password123",
        name: "Jane Smith",
        email: "jane.smith@kansaipaint.com",
        role: "Staff",
        department: "Operations"
      }
    ];
    localStorage.setItem("users", JSON.stringify(sampleUsers));
  }

  // Sample documents
  if (!existingDocs) {
    const sampleDocuments = [
      {
        id: "1",
        docType: "Purchase Request",
        docNumber: "PR-2023-001",
        docDate: "2023-12-01",
        requestor: "John Doe",
        department: "Finance",
        supplier: "ABC Supplies Co.",
        items: [
          {
            description: "Office Supplies - Printer Paper A4",
            quantity: "100",
            unitPrice: "15000",
            totalPrice: 1500000
          },
          {
            description: "Stationery Set",
            quantity: "50",
            unitPrice: "25000",
            totalPrice: 1250000
          }
        ],
        totalAmount: 2750000,
        notes: "Urgent order for office operations",
        urgency: "High",
        docStatus: "Open",
        createdAt: "2023-12-01T08:00:00Z",
        createdBy: "user"
      },
      {
        id: "2",
        docType: "Purchase Request",
        docNumber: "PR-2023-002",
        docDate: "2023-12-02",
        requestor: "Jane Smith",
        department: "Operations",
        supplier: "Tech Solutions Ltd.",
        items: [
          {
            description: "Computer Equipment - Monitor 24 inch",
            quantity: "5",
            unitPrice: "2500000",
            totalPrice: 12500000
          }
        ],
        totalAmount: 12500000,
        notes: "Equipment upgrade for operations team",
        urgency: "Normal",
        docStatus: "Prepared",
        createdAt: "2023-12-02T09:30:00Z",
        createdBy: "jane.smith"
      },
      {
        id: "3",
        docType: "Purchase Request",
        docNumber: "PR-2023-003",
        docDate: "2023-12-03",
        requestor: "Administrator",
        department: "IT",
        supplier: "Various",
        items: [
          {
            description: "Software Licenses",
            quantity: "10",
            unitPrice: "500000",
            totalPrice: 5000000
          }
        ],
        totalAmount: 5000000,
        notes: "Annual software license renewal",
        urgency: "Normal",
        docStatus: "Approved",
        createdAt: "2023-12-03T10:15:00Z",
        createdBy: "admin"
      },
      {
        id: "4",
        docType: "Purchase Request",
        docNumber: "PR-2023-004",
        docDate: "2023-12-04",
        requestor: "Jane Smith",
        department: "Operations",
        supplier: "Office Supplies Inc.",
        items: [
          {
            description: "Office Furniture - Desk Chairs",
            quantity: "8",
            unitPrice: "750000",
            totalPrice: 6000000
          }
        ],
        totalAmount: 6000000,
        notes: "New chairs for the operations team",
        urgency: "Normal",
        docStatus: "Checked",
        createdAt: "2023-12-04T11:00:00Z",
        createdBy: "jane.smith"
      }
    ];
    localStorage.setItem("documents", JSON.stringify(sampleDocuments));
  }

  console.log("Sample data initialized!");
  return true;
}; 