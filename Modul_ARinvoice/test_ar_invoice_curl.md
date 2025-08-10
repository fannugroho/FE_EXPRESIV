# AR Invoice API Testing - CURL Commands

## User Information
- **User ID**: `df1d0bd0-fed5-4854-89c9-a70e5b1eb274`
- **Username**: `annisakusumawardani`
- **Name**: `Annisa Kusumawardani`
- **Access Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI`

---

## 1. CREATE AR Invoice

```bash
curl -X POST "http://localhost:5249/api/ar-invoices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI" \
  -d '{
    "docNum": 2001,
    "docType": "A",
    "docDate": "2025-01-28T10:30:00.000Z",
    "docDueDate": "2025-02-28T10:30:00.000Z",
    "cardCode": "C001",
    "cardName": "PT. Kansai Paint Indonesia",
    "address": "Jl. Industri No. 123, Jakarta Barat",
    "numAtCard": "INV-2025-002",
    "comments": "AR Invoice untuk testing via CURL",
    "u_BSI_Expressiv_PreparedByNIK": "annisakusumawardani",
    "u_BSI_Expressiv_PreparedByName": "Annisa Kusumawardani",
    "docCur": "IDR",
    "docRate": 1,
    "vatSum": 110000,
    "vatSumFC": 110000,
    "wtSum": 0,
    "wtSumFC": 0,
    "docTotal": 1210000,
    "docTotalFC": 1210000,
    "trnspCode": 0,
    "u_BSI_ShippingType": "Regular",
    "groupNum": 1,
    "u_BSI_PaymentGroup": "Net 30",
    "u_bsi_invnum": "AR-2025-002",
    "u_bsi_udf1": "Test Field 1",
    "u_bsi_udf2": "Test Field 2",
    "trackNo": "TRK2025002",
    "u_BSI_Expressiv_IsTransfered": "N",
    "arInvoiceDetails": [
      {
        "lineNum": 0,
        "visOrder": 0,
        "itemCode": "PAINT001",
        "dscription": "Cat Tembok Premium 25kg",
        "acctCode": "4100",
        "quantity": 10,
        "invQty": 10,
        "priceBefDi": 100000,
        "u_bsi_salprice": 100000,
        "u_bsi_source": "AR",
        "vatgroup": "VAT10",
        "wtLiable": "N",
        "lineTotal": 1000000,
        "totalFrgn": 1000000,
        "lineVat": 100000,
        "lineVatIF": 100000,
        "ocrCode3": "",
        "unitMsr": "KG",
        "numPerMsr": 1,
        "freeTxt": "",
        "text": "Cat Tembok Premium untuk proyek renovasi",
        "baseType": 0,
        "baseEntry": 0,
        "baseRef": "",
        "baseLine": 0,
        "cogsOcrCod": "",
        "cogsOcrCo2": "",
        "cogsOcrCo3": ""
      },
      {
        "lineNum": 1,
        "visOrder": 1,
        "itemCode": "PAINT002",
        "dscription": "Cat Kayu Premium 5L",
        "acctCode": "4100",
        "quantity": 5,
        "invQty": 5,
        "priceBefDi": 20000,
        "u_bsi_salprice": 20000,
        "u_bsi_source": "AR",
        "vatgroup": "VAT10",
        "wtLiable": "N",
        "lineTotal": 100000,
        "totalFrgn": 100000,
        "lineVat": 10000,
        "lineVatIF": 10000,
        "ocrCode3": "",
        "unitMsr": "L",
        "numPerMsr": 1,
        "freeTxt": "",
        "text": "Cat Kayu Premium untuk finishing furniture",
        "baseType": 0,
        "baseEntry": 0,
        "baseRef": "",
        "baseLine": 0,
        "cogsOcrCod": "",
        "cogsOcrCo2": "",
        "cogsOcrCo3": ""
      }
    ],
    "approval": {
      "approvalStatus": "Prepared",
      "preparedBy": "df1d0bd0-fed5-4854-89c9-a70e5b1eb274",
      "preparedByName": "annisakusumawardani",
      "preparedDate": "2025-01-28T10:30:00.000Z",
      "remarks": "Initial AR Invoice creation via CURL testing"
    }
  }'
```

---

## 2. GET AR Invoice by Staging ID

```bash
# Replace {stagingId} with actual staging ID from create response
curl -X GET "http://localhost:5249/api/ar-invoices/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"

# Example with specific ID:
curl -X GET "http://localhost:5249/api/ar-invoices/AR_1738053000000_test123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"
```

---

## 3. LIST AR Invoices with Pagination

```bash
curl -X GET "http://localhost:5249/api/ar-invoices?pageNumber=1&pageSize=10&sortBy=createdAt&sortOrder=desc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"
```

---

## 4. UPDATE AR Invoice Approval Status

```bash
# Update to Checked status
curl -X PATCH "http://localhost:5249/api/ar-invoices/approval/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI" \
  -d '{
    "approvalStatus": "Checked",
    "checkedBy": "df1d0bd0-fed5-4854-89c9-a70e5b1eb274",
    "checkedByName": "annisakusumawardani",
    "checkedDate": "2025-01-28T11:00:00.000Z",
    "remarks": "Checked and approved via CURL testing"
  }'

# Update to Acknowledged status
curl -X PATCH "http://localhost:5249/api/ar-invoices/approval/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI" \
  -d '{
    "approvalStatus": "Acknowledged",
    "acknowledgedBy": "df1d0bd0-fed5-4854-89c9-a70e5b1eb274",
    "acknowledgedByName": "annisakusumawardani",
    "acknowledgedDate": "2025-01-28T11:30:00.000Z",
    "remarks": "Acknowledged via CURL testing"
  }'

# Update to Approved status
curl -X PATCH "http://localhost:5249/api/ar-invoices/approval/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI" \
  -d '{
    "approvalStatus": "Approved",
    "approvedBy": "df1d0bd0-fed5-4854-89c9-a70e5b1eb274",
    "approvedByName": "annisakusumawardani",
    "approvedDate": "2025-01-28T12:00:00.000Z",
    "remarks": "Approved via CURL testing"
  }'

# Update to Received status
curl -X PATCH "http://localhost:5249/api/ar-invoices/approval/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI" \
  -d '{
    "approvalStatus": "Received",
    "receivedBy": "df1d0bd0-fed5-4854-89c9-a70e5b1eb274",
    "receivedByName": "annisakusumawardani",
    "receivedDate": "2025-01-28T12:30:00.000Z",
    "remarks": "Received via CURL testing"
  }'
```

---

## 5. GET AR Invoices by Preparer

```bash
curl -X GET "http://localhost:5249/api/ar-invoices/by-preparer/annisakusumawardani" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"
```

---

## 6. GET AR Invoices by Date Range

```bash
curl -X GET "http://localhost:5249/api/ar-invoices/by-date-range?fromDate=2025-01-01&toDate=2025-01-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"
```

---

## 7. GET Dashboard Summary

```bash
curl -X GET "http://localhost:5249/api/ar-invoices/dashboard/summary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"
```

---

## 8. UPDATE AR Invoice

```bash
curl -X PUT "http://localhost:5249/api/ar-invoices/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI" \
  -d '{
    "comments": "Updated AR Invoice via CURL - Modified comments",
    "docTotal": 1500000,
    "docTotalFC": 1500000,
    "vatSum": 150000,
    "vatSumFC": 150000
  }'
```

---

## 9. DELETE AR Invoice

```bash
curl -X DELETE "http://localhost:5249/api/ar-invoices/{stagingId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYW5uaXNha3VzdW1hd2FyZGFuaSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWVpZGVudGlmaWVyIjoiZGYxZDBiZDAtZmVkNS00ODU0LTg5YzktYTcwZTViMWViMjc0IiwiZXhwIjoxNzUzNjc5NDg3LCJpc3MiOiJFeHByZXNzaXYiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo1MDAxIn0.sOpuKYs3IruUg_Pp8gUBIZtqh9qrmYL17rIH-JI7EkI"
```

---

## Expected Response Formats

### Success Response (Create/Update)
```json
{
  "status": true,
  "message": "AR Invoice created/updated successfully",
  "data": {
    "stagingId": "AR_1738053000000_abc123",
    "docNum": 2001,
    "docType": "A",
    "cardName": "PT. Kansai Paint Indonesia",
    "docTotal": 1210000,
    "approvalStatus": "Prepared",
    "createdAt": "2025-01-28T10:30:00.000Z",
    "updatedAt": "2025-01-28T10:30:00.000Z"
  }
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error message description",
  "errors": [
    {
      "field": "docNum",
      "message": "Document number is required"
    }
  ]
}
```

---

## Notes

1. **Replace `{stagingId}`** with the actual staging ID returned from the create operation
2. **Base URL** can be changed to match your backend server (e.g., `https://expressiv.idsdev.site`)
3. **Access Token** expires according to the `exp` claim in the JWT
4. **Response Format** follows the standard API response pattern with `status`, `message`, and `data` fields
5. **Error Handling** provides detailed error messages for debugging

---

## Testing Sequence

1. **Create** AR Invoice → Get `stagingId`
2. **Get** AR Invoice to verify creation
3. **Update** approval status (Prepared → Checked → Acknowledged → Approved → Received)
4. **List** all AR Invoices to see the created invoice
5. **Get by Preparer** to filter by user
6. **Update** invoice details if needed
7. **Delete** if testing cleanup is required