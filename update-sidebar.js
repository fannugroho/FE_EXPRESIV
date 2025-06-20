/**
 * update-sidebar.js
 * 
 * This script updates all HTML files with sidebars to use the centralized sidebar component.
 */

const fs = require('fs');
const path = require('path');

// List of files with sidebars
const filesWithSidebar = [
  'pages/dashboard.html',
  'pages/menuPR.html',
  'pages/menuReim.html',
  'pages/menuCash.html',
  'pages/menuSettle.html',
  'approvalPages/dashboard/dashboardAcknowledge/purchaseRequest/menuPRAcknow.html',
  'approvalPages/dashboard/dashboardAcknowledge/reimbursement/menuReimAcknow.html',
  'approvalPages/dashboard/dashboardAcknowledge/cashAdvance/menuCashAcknow.html',
  'approvalPages/dashboard/dashboardAcknowledge/settlement/menuSettleAcknow.html',
  'approvalPages/dashboard/dashboardApprove/purchaseRequest/menuPRApprove.html',
  'approvalPages/dashboard/dashboardApprove/reimbursement/menuReimApprove.html',
  'approvalPages/dashboard/dashboardApprove/cashAdvance/menuCashApprove.html',
  'approvalPages/dashboard/dashboardApprove/settlement/menuSettleApprove.html',
  'approvalPages/dashboard/dashboardCheck/purchaseRequest/menuPRCheck.html',
  'approvalPages/dashboard/dashboardCheck/reimbursement/menuReimCheck.html',
  'approvalPages/dashboard/dashboardCheck/cashAdvance/menuCashCheck.html',
  'approvalPages/dashboard/dashboardCheck/settlement/menuSettleCheck.html',
  'approvalPages/dashboard/dashboardReceive/purchaseRequest/menuPRReceive.html',
  'approvalPages/dashboard/dashboardReceive/reimbursement/menuReimReceive.html',
  'approvalPages/dashboard/dashboardReceive/cashAdvance/menuCashReceive.html',
  'approvalPages/dashboard/dashboardReceive/settlement/menuSettleReceive.html',
  'approvalPages/dashboard/dashboardRevision/purchaseRequest/menuPRRevision.html',
  'approvalPages/dashboard/dashboardRevision/reimbursement/menuReimRevision.html',
  'approvalPages/dashboard/dashboardRevision/cashAdvance/menuCashRevision.html',
  'approvalPages/dashboard/dashboardRevision/settlement/menuSettleRevision.html',
  'approvalPages/dashboard/dashboardClose/cashAdvance/menuCloser.html',
  'decisionReportApproval/dashboardAcknowledge/purchaseRequest/menuPRAcknow.html',
  'decisionReportApproval/dashboardAcknowledge/reimbursement/menuReimAcknow.html',
  'decisionReportApproval/dashboardAcknowledge/cashAdvance/menuCashAcknow.html',
  'decisionReportApproval/dashboardAcknowledge/settlement/menuSettleAcknow.html',
  'decisionReportApproval/dashboardApprove/purchaseRequest/menuPRApprove.html',
  'decisionReportApproval/dashboardApprove/reimbursement/menuReimApprove.html',
  'decisionReportApproval/dashboardApprove/cashAdvance/menuCashApprove.html',
  'decisionReportApproval/dashboardApprove/settlement/menuSettleApprove.html',
  'decisionReportApproval/dashboardCheck/purchaseRequest/menuPRCheck.html',
  'decisionReportApproval/dashboardCheck/reimbursement/menuReimCheck.html',
  'decisionReportApproval/dashboardCheck/cashAdvance/menuCashCheck.html',
  'decisionReportApproval/dashboardCheck/settlement/menuSettleCheck.html',
  'decisionReportApproval/dashboardReceive/menuPRReceive.html',
];

// Function to update a file
async function updateFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update sidebar HTML
    const sidebarRegex = /<aside id="sidebar"[^>]*>([\s\S]*?)<\/aside>/;
    if (sidebarRegex.test(content)) {
      content = content.replace(
        sidebarRegex,
        '<aside id="sidebar" class="bg-white shadow-lg">\n            <!-- Sidebar content will be loaded by sidebar-loader.js -->\n        </aside>'
      );
      
      // Add the new script imports if they don't exist
      if (!content.includes('sidebar-loader.js')) {
        // Find where to insert the script tags
        const scriptRegex = /<script src="[^"]*auth\.js"><\/script>/;
        if (scriptRegex.test(content)) {
          content = content.replace(
            scriptRegex,
            '<script src="../js/auth.js"></script>\n    <!-- Shared Components -->\n    <script src="../components/shared/sidebar-loader.js"></script>\n    <script src="../components/shared/navigation.js"></script>'
          );
        } else {
          // If auth.js script tag not found, look for </body> and insert before it
          const bodyCloseRegex = /<\/body>/;
          if (bodyCloseRegex.test(content)) {
            content = content.replace(
              bodyCloseRegex,
              '    <!-- Shared Components -->\n    <script src="../components/shared/sidebar-loader.js"></script>\n    <script src="../components/shared/navigation.js"></script>\n</body>'
            );
          }
        }
      }
      
      // Remove any existing toggleSubMenu function
      const toggleSubMenuRegex = /function toggleSubMenu\([^)]*\)\s*{[\s\S]*?}/g;
      content = content.replace(toggleSubMenuRegex, '');
      
      // Write updated content back to file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️ No sidebar found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

// Main function to update all files
async function updateAllFiles() {
  console.log(`Starting to update ${filesWithSidebar.length} files...`);
  
  // Process each file
  for (const file of filesWithSidebar) {
    await updateFile(file);
  }
  
  console.log('All files have been processed');
}

// Run the script
updateAllFiles(); 