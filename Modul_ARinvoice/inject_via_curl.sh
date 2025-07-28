#!/bin/bash

# AR Invoice Data Injection via CURL
# Menggunakan user yang sama untuk semua tahap approval

# Configuration
BASE_URL="http://localhost:5249"
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"

# User data (same for all approval stages)
USER_ID="df1d0bd0-fed5-4854-89c9-a70e5b1eb274"
USERNAME="annisakusumawardani"
USER_NAME="Annisa Kusumawardani"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1"
}

# Function to make authenticated request
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local url="${BASE_URL}${endpoint}"
    
    if [ "$method" = "POST" ] || [ "$method" = "PATCH" ] || [ "$method" = "PUT" ]; then
        curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -d "$data"
    else
        curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ACCESS_TOKEN"
    fi
}

# Function to extract staging ID from response
extract_staging_id() {
    local response="$1"
    echo "$response" | grep -o '"stagingId":"[^"]*"' | cut -d'"' -f4
}

# Function to generate AR Invoice data
generate_ar_invoice_data() {
    local index="$1"
    local doc_num=$((5000 + index))
    local timestamp=$(date +%s)
    local doc_date=$(date -d "@$timestamp" --iso-8601=seconds)
    local due_date=$(date -d "@$((timestamp + 2592000))" --iso-8601=seconds) # +30 days
    local invoice_num=$(printf "%03d" $((index + 1)))
    
    cat <<EOF
{
    "docNum": $doc_num,
    "docType": "A",
    "docDate": "$doc_date",
    "docDueDate": "$due_date",
    "cardCode": "C$(printf "%03d" $((index + 1)))",
    "cardName": "PT. Test Customer $((index + 1))",
    "address": "Jl. Test Address No. $((index + 1)), Jakarta",
    "numAtCard": "EXT-CURL-2025-$invoice_num",
    "comments": "AR Invoice #$invoice_num - CURL Injection Test",
    "u_BSI_Expressiv_PreparedByNIK": "$USERNAME",
    "u_BSI_Expressiv_PreparedByName": "$USER_NAME",
    "docCur": "IDR",
    "docRate": 1,
    "vatSum": $((index * 11000 + 110000)),
    "vatSumFC": $((index * 11000 + 110000)),
    "wtSum": 0,
    "wtSumFC": 0,
    "docTotal": $((index * 121000 + 1210000)),
    "docTotalFC": $((index * 121000 + 1210000)),
    "trnspCode": 0,
    "u_BSI_ShippingType": "Regular",
    "groupNum": 1,
    "u_BSI_PaymentGroup": "Net 30",
    "u_bsi_invnum": "AR-CURL-2025-$invoice_num",
    "u_bsi_udf1": "CURL Test Field 1",
    "u_bsi_udf2": "CURL Test Field 2",
    "trackNo": "TRK${timestamp}${index}",
    "u_BSI_Expressiv_IsTransfered": "N",
    "arInvoiceDetails": [
        {
            "lineNum": 0,
            "visOrder": 0,
            "itemCode": "CURL$(printf "%03d" $((index + 1)))",
            "dscription": "CURL Test Product $((index + 1))",
            "acctCode": "4100",
            "quantity": $((index % 5 + 1)),
            "invQty": $((index % 5 + 1)),
            "priceBefDi": $((index * 10000 + 100000)),
            "u_bsi_salprice": $((index * 10000 + 100000)),
            "u_bsi_source": "AR",
            "vatgroup": "VAT10",
            "wtLiable": "N",
            "lineTotal": $(((index * 10000 + 100000) * (index % 5 + 1))),
            "totalFrgn": $(((index * 10000 + 100000) * (index % 5 + 1))),
            "lineVat": $(((index * 1000 + 10000) * (index % 5 + 1))),
            "lineVatIF": $(((index * 1000 + 10000) * (index % 5 + 1))),
            "ocrCode3": "",
            "unitMsr": "PCS",
            "numPerMsr": 1,
            "freeTxt": "",
            "text": "CURL Test Product $((index + 1)) description",
            "baseType": 0,
            "baseEntry": 0,
            "baseRef": "",
            "baseLine": 0,
            "cogsOcrCod": "",
            "cogsOcrCo2": "",
            "cogsOcrCo3": ""
        }
    ],
    "arInvoiceAttachments": [],
    "approval": {
        "approvalStatus": "Prepared",
        "preparedBy": "$USER_ID",
        "preparedByName": "$USERNAME",
        "preparedDate": "$doc_date",
        "remarks": "Initial AR Invoice creation via CURL - Test #$invoice_num"
    }
}
EOF
}

# Function to create AR Invoice
create_ar_invoice() {
    local index="$1"
    local data=$(generate_ar_invoice_data "$index")
    
    print_info "Creating AR Invoice #$((index + 1))..."
    
    local response=$(make_request "POST" "/api/ar-invoices" "$data")
    local staging_id=$(extract_staging_id "$response")
    
    if [ -n "$staging_id" ]; then
        print_status "AR Invoice #$((index + 1)) created successfully"
        print_status "  DocNum: $((5000 + index))"
        print_status "  StagingId: $staging_id"
        echo "$staging_id"
    else
        print_error "Failed to create AR Invoice #$((index + 1))"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to update approval status
update_approval_status() {
    local staging_id="$1"
    local status="$2"
    local index="$3"
    
    local status_lower=$(echo "$status" | tr '[:upper:]' '[:lower:]')
    local timestamp=$(date --iso-8601=seconds)
    
    local approval_data=$(cat <<EOF
{
    "approvalStatus": "$status",
    "${status_lower}By": "$USER_ID",
    "${status_lower}ByName": "$USERNAME",
    "${status_lower}Date": "$timestamp",
    "remarks": "$status by $USER_NAME - CURL injection"
}
EOF
)
    
    print_info "  Updating to $status..."
    
    local response=$(make_request "PATCH" "/api/ar-invoices/approval/$staging_id" "$approval_data")
    
    if echo "$response" | grep -q '"status".*true'; then
        print_status "  Status updated to $status"
        return 0
    else
        print_error "  Failed to update to $status"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to complete approval workflow
complete_workflow() {
    local staging_id="$1"
    local index="$2"
    
    print_info "Completing approval workflow for AR Invoice #$((index + 1))..."
    
    # Step 1: Checked
    update_approval_status "$staging_id" "Checked" "$index" || return 1
    sleep 1
    
    # Step 2: Acknowledged
    update_approval_status "$staging_id" "Acknowledged" "$index" || return 1
    sleep 1
    
    # Step 3: Approved
    update_approval_status "$staging_id" "Approved" "$index" || return 1
    sleep 1
    
    # Step 4: Received
    update_approval_status "$staging_id" "Received" "$index" || return 1
    
    print_status "AR Invoice #$((index + 1)) workflow completed successfully!"
    return 0
}

# Function to inject multiple AR Invoices
inject_multiple_invoices() {
    local count="$1"
    local complete_workflow="$2"
    
    echo
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🎯 AR INVOICE INJECTION VIA CURL${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Count: $count${NC}"
    echo -e "${BLUE}👤 User: $USER_NAME ($USERNAME)${NC}"
    echo -e "${BLUE}🔄 Complete Workflow: $complete_workflow${NC}"
    echo -e "${BLUE}🌐 Base URL: $BASE_URL${NC}"
    echo
    
    local successful=0
    local failed=0
    local staging_ids=()
    
    for ((i=0; i<count; i++)); do
        echo -e "${YELLOW}[$(($i + 1))/$count]${NC} Processing AR Invoice #$((i + 1))..."
        
        staging_id=$(create_ar_invoice "$i")
        
        if [ $? -eq 0 ] && [ -n "$staging_id" ]; then
            staging_ids+=("$staging_id")
            
            if [ "$complete_workflow" = "true" ]; then
                if complete_workflow "$staging_id" "$i"; then
                    ((successful++))
                else
                    ((failed++))
                fi
            else
                ((successful++))
            fi
        else
            ((failed++))
        fi
        
        # Delay between invoices
        if [ $i -lt $((count - 1)) ]; then
            print_info "Waiting 2 seconds before next invoice..."
            sleep 2
        fi
        
        echo
    done
    
    # Summary
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🎉 INJECTION COMPLETE - SUMMARY${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Successful: $successful/$count${NC}"
    echo -e "${RED}❌ Failed: $failed/$count${NC}"
    
    if [ ${#staging_ids[@]} -gt 0 ]; then
        echo
        echo -e "${BLUE}📋 Created Staging IDs:${NC}"
        for staging_id in "${staging_ids[@]}"; do
            echo "   $staging_id"
        done
    fi
    
    echo
    print_status "Data injection process completed!"
}

# Function to inject mixed status invoices
inject_mixed_status() {
    local count="$1"
    
    echo
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🎨 AR INVOICE MIXED STATUS INJECTION${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Count: $count${NC}"
    echo -e "${BLUE}👤 User: $USER_NAME ($USERNAME)${NC}"
    echo -e "${BLUE}🔄 Status: Mixed (Prepared, Checked, Acknowledged, Approved, Received)${NC}"
    echo
    
    local successful=0
    local failed=0
    local status_counts=("0" "0" "0" "0" "0") # prepared, checked, acknowledged, approved, received
    local statuses=("Prepared" "Checked" "Acknowledged" "Approved" "Received")
    
    for ((i=0; i<count; i++)); do
        echo -e "${YELLOW}[$(($i + 1))/$count]${NC} Processing AR Invoice #$((i + 1))..."
        
        staging_id=$(create_ar_invoice "$i")
        
        if [ $? -eq 0 ] && [ -n "$staging_id" ]; then
            local status_index=$((i % 5))
            local target_status="${statuses[$status_index]}"
            
            case $status_index in
                0) # Prepared (no additional updates)
                    print_info "  Keeping status as Prepared"
                    ((status_counts[0]++))
                    ((successful++))
                    ;;
                1) # Checked only
                    if update_approval_status "$staging_id" "Checked" "$i"; then
                        ((status_counts[1]++))
                        ((successful++))
                    else
                        ((failed++))
                    fi
                    ;;
                2) # Up to Acknowledged
                    if update_approval_status "$staging_id" "Checked" "$i" && \
                       update_approval_status "$staging_id" "Acknowledged" "$i"; then
                        ((status_counts[2]++))
                        ((successful++))
                    else
                        ((failed++))
                    fi
                    ;;
                3) # Up to Approved
                    if update_approval_status "$staging_id" "Checked" "$i" && \
                       update_approval_status "$staging_id" "Acknowledged" "$i" && \
                       update_approval_status "$staging_id" "Approved" "$i"; then
                        ((status_counts[3]++))
                        ((successful++))
                    else
                        ((failed++))
                    fi
                    ;;
                4) # Complete workflow to Received
                    if complete_workflow "$staging_id" "$i"; then
                        ((status_counts[4]++))
                        ((successful++))
                    else
                        ((failed++))
                    fi
                    ;;
            esac
            
            print_status "  Final Status: $target_status"
        else
            ((failed++))
        fi
        
        # Delay between invoices
        if [ $i -lt $((count - 1)) ]; then
            print_info "Waiting 2 seconds before next invoice..."
            sleep 2
        fi
        
        echo
    done
    
    # Summary
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🎉 MIXED STATUS INJECTION COMPLETE${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Successful: $successful/$count${NC}"
    echo -e "${RED}❌ Failed: $failed/$count${NC}"
    
    echo
    echo -e "${BLUE}📊 Status Distribution:${NC}"
    for ((i=0; i<5; i++)); do
        echo "   ${statuses[$i]}: ${status_counts[$i]} invoices"
    done
    
    echo
    print_status "Mixed status data injection completed!"
}

# Main script
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -c, --count NUMBER       Number of invoices to inject (default: 5)"
    echo "  -w, --workflow           Complete workflow to Received status"
    echo "  -m, --mixed              Inject with mixed statuses"
    echo "  -h, --help               Show this help message"
    echo
    echo "Examples:"
    echo "  $0 -c 5 -w               # 5 invoices with complete workflow"
    echo "  $0 -c 3                  # 3 invoices with Prepared status only"
    echo "  $0 -c 10 -m              # 10 invoices with mixed statuses"
}

# Parse command line arguments
COUNT=5
COMPLETE_WORKFLOW=false
MIXED_STATUS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--count)
            COUNT="$2"
            shift 2
            ;;
        -w|--workflow)
            COMPLETE_WORKFLOW=true
            shift
            ;;
        -m|--mixed)
            MIXED_STATUS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate count
if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -lt 1 ] || [ "$COUNT" -gt 50 ]; then
    print_error "Count must be a number between 1 and 50"
    exit 1
fi

# Check if curl and jq are available
if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
fi

# Check if jq is available (optional, for pretty JSON output)
if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed - JSON output will not be formatted"
fi

# Main execution
if [ "$MIXED_STATUS" = true ]; then
    inject_mixed_status "$COUNT"
else
    inject_multiple_invoices "$COUNT" "$COMPLETE_WORKFLOW"
fi