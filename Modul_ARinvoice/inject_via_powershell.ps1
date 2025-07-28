# AR Invoice Data Injection via PowerShell
# Menggunakan user yang sama untuk semua tahap approval

param(
    [int]$Count = 5,
    [switch]$CompleteWorkflow,
    [switch]$MixedStatus,
    [switch]$Help
)

# Configuration
$BASE_URL = "http://localhost:5249"
$ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"

# User data (same for all approval stages)
$USER_ID = "df1d0bd0-fed5-4854-89c9-a70e5b1eb274"
$USERNAME = "annisakusumawardani"
$USER_NAME = "Annisa Kusumawardani"

# Function to show usage
function Show-Usage {
    Write-Host ""
    Write-Host "AR Invoice Data Injection Tool - PowerShell" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\inject_via_powershell.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor White
    Write-Host "  -Count NUMBER          Number of invoices to inject (default: 5)" -ForegroundColor Gray
    Write-Host "  -CompleteWorkflow      Complete workflow to Received status" -ForegroundColor Gray
    Write-Host "  -MixedStatus           Inject with mixed statuses" -ForegroundColor Gray
    Write-Host "  -Help                  Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\inject_via_powershell.ps1 -Count 5 -CompleteWorkflow" -ForegroundColor Green
    Write-Host "  .\inject_via_powershell.ps1 -Count 3" -ForegroundColor Green
    Write-Host "  .\inject_via_powershell.ps1 -Count 10 -MixedStatus" -ForegroundColor Green
    Write-Host ""
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] " -ForegroundColor Gray -NoNewline
    Write-Host $Message -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] ERROR: " -ForegroundColor Red -NoNewline
    Write-Host $Message -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] WARNING: " -ForegroundColor Yellow -NoNewline
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] INFO: " -ForegroundColor Blue -NoNewline
    Write-Host $Message -ForegroundColor White
}

# Function to make authenticated request
function Invoke-AuthenticatedRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $ACCESS_TOKEN"
    }
    
    $uri = $BASE_URL + $Endpoint
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        }
        return $response
    } catch {
        throw $_.Exception.Message
    }
}

# Function to generate AR Invoice data
function New-ARInvoiceData {
    param([int]$Index)
    
    $docNum = 6000 + $Index
    $timestamp = [DateTimeOffset]::Now
    $docDate = $timestamp.ToString("yyyy-MM-ddTHH:mm:ss.fffK")
    $dueDate = $timestamp.AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffK")
    $invoiceNum = ($Index + 1).ToString("000")
    
    $data = @{
        docNum = $docNum
        docType = "A"
        docDate = $docDate
        docDueDate = $dueDate
        cardCode = "C$(($Index + 1).ToString('000'))"
        cardName = "PT. PowerShell Customer $($Index + 1)"
        address = "Jl. PowerShell Address No. $($Index + 1), Jakarta"
        numAtCard = "EXT-PS-2025-$invoiceNum"
        comments = "AR Invoice #$invoiceNum - PowerShell Injection Test"
        u_BSI_Expressiv_PreparedByNIK = $USERNAME
        u_BSI_Expressiv_PreparedByName = $USER_NAME
        docCur = "IDR"
        docRate = 1
        vatSum = $Index * 11000 + 110000
        vatSumFC = $Index * 11000 + 110000
        wtSum = 0
        wtSumFC = 0
        docTotal = $Index * 121000 + 1210000
        docTotalFC = $Index * 121000 + 1210000
        trnspCode = 0
        u_BSI_ShippingType = "Regular"
        groupNum = 1
        u_BSI_PaymentGroup = "Net 30"
        u_bsi_invnum = "AR-PS-2025-$invoiceNum"
        u_bsi_udf1 = "PowerShell Test Field 1"
        u_bsi_udf2 = "PowerShell Test Field 2"
        trackNo = "TRK$([DateTimeOffset]::Now.ToUnixTimeSeconds())$Index"
        u_BSI_Expressiv_IsTransfered = "N"
        arInvoiceDetails = @(
            @{
                lineNum = 0
                visOrder = 0
                itemCode = "PS$(($Index + 1).ToString('000'))"
                dscription = "PowerShell Test Product $($Index + 1)"
                acctCode = "4100"
                quantity = ($Index % 5) + 1
                invQty = ($Index % 5) + 1
                priceBefDi = $Index * 10000 + 100000
                u_bsi_salprice = $Index * 10000 + 100000
                u_bsi_source = "AR"
                vatgroup = "VAT10"
                wtLiable = "N"
                lineTotal = ($Index * 10000 + 100000) * (($Index % 5) + 1)
                totalFrgn = ($Index * 10000 + 100000) * (($Index % 5) + 1)
                lineVat = ($Index * 1000 + 10000) * (($Index % 5) + 1)
                lineVatIF = ($Index * 1000 + 10000) * (($Index % 5) + 1)
                ocrCode3 = ""
                unitMsr = "PCS"
                numPerMsr = 1
                freeTxt = ""
                text = "PowerShell Test Product $($Index + 1) description"
                baseType = 0
                baseEntry = 0
                baseRef = ""
                baseLine = 0
                cogsOcrCod = ""
                cogsOcrCo2 = ""
                cogsOcrCo3 = ""
            }
        )
        arInvoiceAttachments = @()
        approval = @{
            approvalStatus = "Prepared"
            preparedBy = $USER_ID
            preparedByName = $USERNAME
            preparedDate = $docDate
            remarks = "Initial AR Invoice creation via PowerShell - Test #$invoiceNum"
        }
    }
    
    return $data
}

# Function to create AR Invoice
function New-ARInvoice {
    param([int]$Index)
    
    Write-Info "Creating AR Invoice #$($Index + 1)..."
    
    $data = New-ARInvoiceData -Index $Index
    $jsonData = $data | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-AuthenticatedRequest -Method "POST" -Endpoint "/api/ar-invoices" -Body $jsonData
        
        $stagingId = $response.data.stagingId
        if (!$stagingId) {
            $stagingId = $response.stagingId
        }
        
        if ($stagingId) {
            Write-Status "AR Invoice #$($Index + 1) created successfully"
            Write-Status "  DocNum: $($data.docNum)"
            Write-Status "  StagingId: $stagingId"
            return $stagingId
        } else {
            Write-Error-Custom "Failed to extract staging ID from response"
            return $null
        }
    } catch {
        Write-Error-Custom "Failed to create AR Invoice #$($Index + 1): $($_.Exception.Message)"
        return $null
    }
}

# Function to update approval status
function Update-ApprovalStatus {
    param(
        [string]$StagingId,
        [string]$Status,
        [int]$Index
    )
    
    $statusLower = $Status.ToLower()
    $timestamp = [DateTimeOffset]::Now.ToString("yyyy-MM-ddTHH:mm:ss.fffK")
    
    $approvalData = @{
        approvalStatus = $Status
        "$($statusLower)By" = $USER_ID
        "$($statusLower)ByName" = $USERNAME
        "$($statusLower)Date" = $timestamp
        remarks = "$Status by $USER_NAME - PowerShell injection"
    }
    
    Write-Info "  Updating to $Status..."
    
    try {
        $jsonData = $approvalData | ConvertTo-Json -Depth 5
        $response = Invoke-AuthenticatedRequest -Method "PATCH" -Endpoint "/api/ar-invoices/approval/$StagingId" -Body $jsonData
        
        if ($response.status -eq $true) {
            Write-Status "  Status updated to $Status"
            return $true
        } else {
            Write-Error-Custom "  Failed to update to $Status"
            return $false
        }
    } catch {
        Write-Error-Custom "  Failed to update to $Status`: $($_.Exception.Message)"
        return $false
    }
}

# Function to complete approval workflow
function Complete-Workflow {
    param(
        [string]$StagingId,
        [int]$Index
    )
    
    Write-Info "Completing approval workflow for AR Invoice #$($Index + 1)..."
    
    # Step 1: Checked
    if (!(Update-ApprovalStatus -StagingId $StagingId -Status "Checked" -Index $Index)) {
        return $false
    }
    Start-Sleep -Seconds 1
    
    # Step 2: Acknowledged
    if (!(Update-ApprovalStatus -StagingId $StagingId -Status "Acknowledged" -Index $Index)) {
        return $false
    }
    Start-Sleep -Seconds 1
    
    # Step 3: Approved
    if (!(Update-ApprovalStatus -StagingId $StagingId -Status "Approved" -Index $Index)) {
        return $false
    }
    Start-Sleep -Seconds 1
    
    # Step 4: Received
    if (!(Update-ApprovalStatus -StagingId $StagingId -Status "Received" -Index $Index)) {
        return $false
    }
    
    Write-Status "AR Invoice #$($Index + 1) workflow completed successfully!"
    return $true
}

# Function to inject multiple AR Invoices
function Start-MultipleInjection {
    param(
        [int]$Count,
        [bool]$CompleteWorkflow
    )
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "🎯 AR INVOICE INJECTION VIA POWERSHELL" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "📊 Count: $Count" -ForegroundColor Blue
    Write-Host "👤 User: $USER_NAME ($USERNAME)" -ForegroundColor Blue
    Write-Host "🔄 Complete Workflow: $CompleteWorkflow" -ForegroundColor Blue
    Write-Host "🌐 Base URL: $BASE_URL" -ForegroundColor Blue
    Write-Host ""
    
    $successful = 0
    $failed = 0
    $stagingIds = @()
    
    for ($i = 0; $i -lt $Count; $i++) {
        Write-Host "[$($i + 1)/$Count] Processing AR Invoice #$($i + 1)..." -ForegroundColor Yellow
        
        $stagingId = New-ARInvoice -Index $i
        
        if ($stagingId) {
            $stagingIds += $stagingId
            
            if ($CompleteWorkflow) {
                if (Complete-Workflow -StagingId $stagingId -Index $i) {
                    $successful++
                } else {
                    $failed++
                }
            } else {
                $successful++
            }
        } else {
            $failed++
        }
        
        # Delay between invoices
        if ($i -lt ($Count - 1)) {
            Write-Info "Waiting 2 seconds before next invoice..."
            Start-Sleep -Seconds 2
        }
        
        Write-Host ""
    }
    
    # Summary
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "🎉 INJECTION COMPLETE - SUMMARY" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "✅ Successful: $successful/$Count" -ForegroundColor Green
    Write-Host "❌ Failed: $failed/$Count" -ForegroundColor Red
    
    if ($stagingIds.Count -gt 0) {
        Write-Host ""
        Write-Host "📋 Created Staging IDs:" -ForegroundColor Blue
        foreach ($stagingId in $stagingIds) {
            Write-Host "   $stagingId" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Status "Data injection process completed!"
}

# Function to inject mixed status invoices
function Start-MixedStatusInjection {
    param([int]$Count)
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "🎨 AR INVOICE MIXED STATUS INJECTION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "📊 Count: $Count" -ForegroundColor Blue
    Write-Host "👤 User: $USER_NAME ($USERNAME)" -ForegroundColor Blue
    Write-Host "🔄 Status: Mixed (Prepared, Checked, Acknowledged, Approved, Received)" -ForegroundColor Blue
    Write-Host ""
    
    $successful = 0
    $failed = 0
    $statusCounts = @{
        "Prepared" = 0
        "Checked" = 0
        "Acknowledged" = 0
        "Approved" = 0
        "Received" = 0
    }
    $statuses = @("Prepared", "Checked", "Acknowledged", "Approved", "Received")
    
    for ($i = 0; $i -lt $Count; $i++) {
        Write-Host "[$($i + 1)/$Count] Processing AR Invoice #$($i + 1)..." -ForegroundColor Yellow
        
        $stagingId = New-ARInvoice -Index $i
        
        if ($stagingId) {
            $statusIndex = $i % 5
            $targetStatus = $statuses[$statusIndex]
            
            switch ($statusIndex) {
                0 { # Prepared (no additional updates)
                    Write-Info "  Keeping status as Prepared"
                    $statusCounts["Prepared"]++
                    $successful++
                }
                1 { # Checked only
                    if (Update-ApprovalStatus -StagingId $stagingId -Status "Checked" -Index $i) {
                        $statusCounts["Checked"]++
                        $successful++
                    } else {
                        $failed++
                    }
                }
                2 { # Up to Acknowledged
                    if ((Update-ApprovalStatus -StagingId $stagingId -Status "Checked" -Index $i) -and
                        (Update-ApprovalStatus -StagingId $stagingId -Status "Acknowledged" -Index $i)) {
                        $statusCounts["Acknowledged"]++
                        $successful++
                    } else {
                        $failed++
                    }
                }
                3 { # Up to Approved
                    if ((Update-ApprovalStatus -StagingId $stagingId -Status "Checked" -Index $i) -and
                        (Update-ApprovalStatus -StagingId $stagingId -Status "Acknowledged" -Index $i) -and
                        (Update-ApprovalStatus -StagingId $stagingId -Status "Approved" -Index $i)) {
                        $statusCounts["Approved"]++
                        $successful++
                    } else {
                        $failed++
                    }
                }
                4 { # Complete workflow to Received
                    if (Complete-Workflow -StagingId $stagingId -Index $i) {
                        $statusCounts["Received"]++
                        $successful++
                    } else {
                        $failed++
                    }
                }
            }
            
            Write-Status "  Final Status: $targetStatus"
        } else {
            $failed++
        }
        
        # Delay between invoices
        if ($i -lt ($Count - 1)) {
            Write-Info "Waiting 2 seconds before next invoice..."
            Start-Sleep -Seconds 2
        }
        
        Write-Host ""
    }
    
    # Summary
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "🎉 MIXED STATUS INJECTION COMPLETE" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "✅ Successful: $successful/$Count" -ForegroundColor Green
    Write-Host "❌ Failed: $failed/$Count" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "📊 Status Distribution:" -ForegroundColor Blue
    foreach ($status in $statuses) {
        Write-Host "   $status`: $($statusCounts[$status]) invoices" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Status "Mixed status data injection completed!"
}

# Main script execution
if ($Help) {
    Show-Usage
    exit 0
}

# Validate count
if ($Count -lt 1 -or $Count -gt 50) {
    Write-Error-Custom "Count must be between 1 and 50"
    exit 1
}

# Check if we have internet connectivity to the API
try {
    $testResponse = Invoke-WebRequest -Uri $BASE_URL -TimeoutSec 10 -UseBasicParsing
    Write-Info "API endpoint is reachable"
} catch {
    Write-Error-Custom "Cannot reach API endpoint: $BASE_URL"
    Write-Error-Custom "Please ensure the backend server is running"
    exit 1
}

# Main execution
if ($MixedStatus) {
    Start-MixedStatusInjection -Count $Count
} else {
    Start-MultipleInjection -Count $Count -CompleteWorkflow $CompleteWorkflow
}