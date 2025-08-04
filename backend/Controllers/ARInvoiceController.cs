using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using ExpressivSystem.Data;
using ExpressivSystem.Models;

namespace ExpressivSystem.Controllers
{
    [ApiController]
    [Route("api/ar-invoices")]
    [Authorize]
    public class ARInvoiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ARInvoiceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{stagingId}")]
        public async Task<IActionResult> GetARInvoice(string stagingId)
        {
            try
            {
                // For now, return a mock response since the AR invoice model doesn't exist yet
                var mockARInvoice = new
                {
                    stagingId = stagingId,
                    cardCode = "C001",
                    cardName = "PT Sample Customer",
                    documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                    dueDate = DateTime.Now.AddDays(30).ToString("yyyy-MM-dd"),
                    currency = "IDR",
                    totalAmount = 1000000,
                    status = "Draft",
                    preparedBy = "user123",
                    preparedDate = DateTime.Now.ToString("yyyy-MM-dd"),
                    remarks = "Sample AR Invoice"
                };

                return Ok(new { status = true, data = mockARInvoice });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoice", error = ex.Message });
            }
        }

        [HttpGet("{stagingId}/details")]
        public async Task<IActionResult> GetARInvoiceWithDetails(string stagingId)
        {
            try
            {
                // Mock AR invoice with details including attachments
                var mockARInvoiceDetails = new
                {
                    stagingId = stagingId,
                    cardCode = "C001",
                    cardName = "PT Sample Customer",
                    documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                    dueDate = DateTime.Now.AddDays(30).ToString("yyyy-MM-dd"),
                    currency = "IDR",
                    totalAmount = 1000000,
                    status = "Draft",
                    preparedBy = "user123",
                    preparedDate = DateTime.Now.ToString("yyyy-MM-dd"),
                    remarks = "Sample AR Invoice",
                    arInvoiceAttachments = new List<object>
                    {
                        new
                        {
                            id = "att1",
                            fileName = "invoice_supporting_doc.pdf",
                            originalFileName = "invoice_supporting_doc.pdf",
                            fileSize = 1024000,
                            filePath = "/uploads/ar-invoices/invoice_supporting_doc.pdf",
                            fileUrl = "http://localhost:5249/uploads/ar-invoices/invoice_supporting_doc.pdf",
                            description = "Supporting document for invoice",
                            uploadedBy = "user123",
                            uploadedDate = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss")
                        },
                        new
                        {
                            id = "att2",
                            fileName = "contract_agreement.pdf",
                            originalFileName = "contract_agreement.pdf",
                            fileSize = 2048000,
                            filePath = "/uploads/ar-invoices/contract_agreement.pdf",
                            fileUrl = "http://localhost:5249/uploads/ar-invoices/contract_agreement.pdf",
                            description = "Contract agreement document",
                            uploadedBy = "user123",
                            uploadedDate = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss")
                        }
                    }
                };

                return Ok(new { status = true, data = mockARInvoiceDetails });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoice details", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetARInvoices([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string sortBy = "createdAt", [FromQuery] string sortOrder = "desc")
        {
            try
            {
                // Mock paginated response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer 1",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Draft"
                    },
                    new
                    {
                        stagingId = "STG-C41174-002",
                        cardCode = "C002",
                        cardName = "PT Sample Customer 2",
                        documentDate = DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd"),
                        totalAmount = 1500000,
                        status = "Checked"
                    }
                };

                return Ok(new
                {
                    status = true,
                    data = mockARInvoices,
                    pagination = new
                    {
                        pageNumber = pageNumber,
                        pageSize = pageSize,
                        totalCount = 2,
                        totalPages = 1
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateARInvoice([FromBody] object arInvoiceData)
        {
            try
            {
                // Mock creation response
                var mockResponse = new
                {
                    stagingId = "STG-C41174-" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                    message = "AR Invoice created successfully"
                };

                return Ok(new { status = true, data = mockResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error creating AR invoice", error = ex.Message });
            }
        }

        [HttpPut("{stagingId}")]
        public async Task<IActionResult> UpdateARInvoice(string stagingId, [FromBody] object arInvoiceData)
        {
            try
            {
                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error updating AR invoice", error = ex.Message });
            }
        }

        [HttpDelete("{stagingId}")]
        public async Task<IActionResult> DeleteARInvoice(string stagingId)
        {
            try
            {
                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error deleting AR invoice", error = ex.Message });
            }
        }

        [HttpPatch("approval/{stagingId}")]
        public async Task<IActionResult> UpdateARInvoiceApproval(string stagingId, [FromBody] object approvalData)
        {
            try
            {
                // Mock approval response
                var mockResponse = new
                {
                    message = "AR Invoice approval updated successfully",
                    stagingId = stagingId
                };

                return Ok(new { status = true, data = mockResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error updating AR invoice approval", error = ex.Message });
            }
        }

        [HttpGet("by-card-code/{cardCode}")]
        public async Task<IActionResult> GetARInvoicesByCardCode(string cardCode)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = cardCode,
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Draft"
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by card code", error = ex.Message });
            }
        }

        [HttpGet("by-preparer/{preparerNIK}")]
        public async Task<IActionResult> GetARInvoicesByPreparer(string preparerNIK)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Draft",
                        preparedBy = preparerNIK
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by preparer", error = ex.Message });
            }
        }

        [HttpGet("by-date-range")]
        public async Task<IActionResult> GetARInvoicesByDateRange([FromQuery] string fromDate, [FromQuery] string toDate)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = fromDate,
                        totalAmount = 1000000,
                        status = "Draft"
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by date range", error = ex.Message });
            }
        }

        [HttpGet("by-acknowledged/{acknowledgedBy}")]
        public async Task<IActionResult> GetARInvoicesByAcknowledged(string acknowledgedBy)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Acknowledged",
                        acknowledgedBy = acknowledgedBy
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by acknowledged", error = ex.Message });
            }
        }

        [HttpGet("by-prepared/{preparedBy}")]
        public async Task<IActionResult> GetARInvoicesByPrepared(string preparedBy)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Draft",
                        preparedBy = preparedBy
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by prepared", error = ex.Message });
            }
        }

        [HttpGet("by-checked/{checkedBy}")]
        public async Task<IActionResult> GetARInvoicesByChecked(string checkedBy)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Checked",
                        checkedBy = checkedBy
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by checked", error = ex.Message });
            }
        }

        [HttpGet("by-approved/{approvedBy}")]
        public async Task<IActionResult> GetARInvoicesByApproved(string approvedBy)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Approved",
                        approvedBy = approvedBy
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by approved", error = ex.Message });
            }
        }

        [HttpGet("by-received/{receivedBy}")]
        public async Task<IActionResult> GetARInvoicesByReceived(string receivedBy)
        {
            try
            {
                // Mock response
                var mockARInvoices = new List<object>
                {
                    new
                    {
                        stagingId = "STG-C41174-001",
                        cardCode = "C001",
                        cardName = "PT Sample Customer",
                        documentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                        totalAmount = 1000000,
                        status = "Received",
                        receivedBy = receivedBy
                    }
                };

                return Ok(new { status = true, data = mockARInvoices });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving AR invoices by received", error = ex.Message });
            }
        }

        [HttpPost("{stagingId}/attachments/upload")]
        public async Task<IActionResult> UploadAttachments(string stagingId, [FromForm] List<IFormFile> files)
        {
            try
            {
                // Mock upload response
                var mockResponse = new
                {
                    message = "Attachments uploaded successfully",
                    stagingId = stagingId,
                    uploadedFiles = files?.Count ?? 0
                };

                return Ok(new { status = true, data = mockResponse });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error uploading attachments", error = ex.Message });
            }
        }

        [HttpGet("{stagingId}/attachments")]
        public async Task<IActionResult> GetAttachments(string stagingId)
        {
            try
            {
                // Mock attachments response
                var mockAttachments = new List<object>
                {
                    new
                    {
                        id = "att1",
                        fileName = "invoice_supporting_doc.pdf",
                        originalFileName = "invoice_supporting_doc.pdf",
                        fileSize = 1024000,
                        filePath = "/uploads/ar-invoices/invoice_supporting_doc.pdf",
                        fileUrl = "http://localhost:5249/uploads/ar-invoices/invoice_supporting_doc.pdf",
                        description = "Supporting document for invoice",
                        uploadedBy = "user123",
                        uploadedDate = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss")
                    }
                };

                return Ok(new { status = true, data = mockAttachments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error retrieving attachments", error = ex.Message });
            }
        }

        [HttpGet("{stagingId}/attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(string stagingId, string attachmentId)
        {
            try
            {
                // Mock download response - in real implementation, this would return the actual file
                return Ok(new { status = true, message = "Download initiated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error downloading attachment", error = ex.Message });
            }
        }

        [HttpDelete("{stagingId}/attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(string stagingId, string attachmentId)
        {
            try
            {
                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = false, message = "Error deleting attachment", error = ex.Message });
            }
        }
    }
} 