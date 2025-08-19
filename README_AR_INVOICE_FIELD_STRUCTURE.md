# AR Invoice Field Structure Documentation

## Overview
This document provides a comprehensive overview of what fields and columns are displayed for **Service** and **Item** document types in the AR Invoice system, organized by sections: Header, Table Details, and Summary.

---

## SERVICE TYPE DISPLAY

### Header Section (Form Fields)
When document type is **Service**, the following fields are displayed:

#### Left Column Fields:
- **Invoice SAP Doc Entry Number** (`DocNum`) - Read-only
- **Customer Code** (`CardCode`) - Read-only  
- **Customer Name** (`CardName`) - Read-only
- **Status** (`Status`) - Read-only
- **Address** (`address`) - Read-only
- **Currency** (`DocCur`) - Read-only
- **Document Rate** (`docRate`) - Read-only
- **Attachments** (`attachmentsContainer`) - Interactive list

#### Right Column Fields:
- **Document Date** (`DocDate`) - Read-only
- **Due Date** (`DocDueDate`) - Read-only
- **Tax Identification Number (NPWP)** (`TaxNo`) - Read-only
- **Shipping Type** (`U_BSI_ShippingType`) - Read-only
- **Payment Terms** (`U_BSI_PaymentGroup`) - Read-only
- **No Surat Jalan** (`U_BSI_UDF1`) - Read-only
- **P/O No** (`U_BSI_UDF2`) - Read-only
- **Account** (`account`) - Read-only
- **Account Name** (`acctName`) - **Service-only field**
- **Control Account** (`u_bsi_udf3`) - **Service-only field**

### Table Details Section (Service Mode)
Service documents display the following table columns:

| Column | Field ID | Width | Description |
|--------|----------|--------|-------------|
| **No.** | Row number | 60px | Sequential numbering |
| **Description** | Description | 250px | Service description/details |
| **GL Account** | Account code | 120px | General Ledger account code |
| **Account Name / Control Account** | Account name | 200px | Combined column showing account name and control account |
| **Free Text** | Free text | Variable | Additional text information |
| **VAT Code** | Tax code | 80px | VAT/Tax code |
| **Wtax** | Withholding tax | 80px | Withholding tax information |
| **Unit** | UoM | 80px | Unit of measurement |
| **Qty** | Quantity | 100px | Service quantity |
| **Price** | Price | 180px | Price per unit |
| **Amount** | Line total | 180px | Total line amount |

### Summary Section (Service)
Service documents show these summary fields:

- **Total** (`docTotal`) - Total before discounts
- **Discounted** (`discSum`) - Total discount amount
- **Sales Amount** (`netPriceAfterDiscount`) - Amount after discounts
- **Tax Base Other Value** (`dpp1112`) - Tax base for other values
- **VAT 12%** (`vatSum`) - VAT amount
- **GRAND TOTAL** (`grandTotal`) - Final total amount
- **Remarks** (`comments`) - Additional comments/notes

---

## ITEM TYPE DISPLAY

### Header Section (Form Fields)
When document type is **Item**, the following fields are displayed:

#### Left Column Fields:
- **Invoice SAP Doc Entry Number** (`DocNum`) - Read-only
- **Customer Code** (`CardCode`) - Read-only
- **Customer Name** (`CardName`) - Read-only
- **Status** (`Status`) - Read-only
- **Address** (`address`) - Read-only
- **KPIN Invoice Number** (`NumAtCard`) - **Item-only field**
- **Currency** (`DocCur`) - Read-only
- **Document Rate** (`docRate`) - Read-only
- **Attachments** (`attachmentsContainer`) - Interactive list

#### Right Column Fields:
- **Document Date** (`DocDate`) - Read-only
- **Due Date** (`DocDueDate`) - Read-only
- **Tax Identification Number (NPWP)** (`TaxNo`) - Read-only
- **Shipping Type** (`U_BSI_ShippingType`) - Read-only
- **Payment Terms** (`U_BSI_PaymentGroup`) - Read-only
- **No Surat Jalan** (`U_BSI_UDF1`) - Read-only
- **P/O No** (`U_BSI_UDF2`) - Read-only
- **Account** (`account`) - Read-only

### Table Details Section (Item Mode)
Item documents display the following table columns:

| Column | Field ID | Width | Description |
|--------|----------|--------|-------------|
| **No.** | Row number | 60px | Sequential numbering |
| **Item Code** | Item code | 140px | Product/item code |
| **Part Number** | BP catalog | 120px | Business partner catalog number |
| **Item Name** | Description | 250px | Item name/description |
| **UoM** | Unit of measure | 80px | Unit of measurement |
| **Packing Size** | Packing size | 100px | Package size information |
| **Sales Qty** | Sales quantity | 100px | Quantity sold |
| **Inv. Qty** | Invoice quantity | 100px | Quantity invoiced |
| **Price per UoM** | Price per UoM | 180px | Price per unit of measure |
| **Price per Unit** | Price per unit | 180px | Price per individual unit |
| **VAT Code** | Tax code | 80px | VAT/Tax code |
| **Amount** | Line total | 180px | Total line amount |

### Summary Section (Item)
Item documents show the same summary fields as Service:

- **Total** (`docTotal`) - Total before discounts
- **Discounted** (`discSum`) - Total discount amount  
- **Sales Amount** (`netPriceAfterDiscount`) - Amount after discounts
- **Tax Base Other Value** (`dpp1112`) - Tax base for other values
- **VAT 12%** (`vatSum`) - VAT amount
- **GRAND TOTAL** (`grandTotal`) - Final total amount
- **Remarks** (`comments`) - Additional comments/notes

---

## KEY DIFFERENCES SUMMARY

### Header Fields
| Field | Service | Item | Notes |
|-------|---------|------|-------|
| KPIN Invoice Number | ❌ | ✅ | Item-only field |
| Account Name | ✅ | ❌ | Service-only field |
| Control Account | ✅ | ❌ | Service-only field |

### Table Columns
| Aspect | Service | Item |
|--------|---------|------|
| **Focus** | Account-based | Product-based |
| **Key Columns** | Description, GL Account, Account Name | Item Code, Part Number, Item Name |
| **Quantity Types** | Single Qty field | Sales Qty + Inv. Qty |
| **Price Types** | Single Price field | Price per UoM + Price per Unit |
| **Additional Fields** | Free Text, Wtax | Packing Size, multiple quantity types |

### Responsive Behavior
- **Mobile (< 768px)**: Table uses horizontal scroll with minimum width of 1000px for Item mode, maintains all columns
- **Desktop**: Full table display with optimized column widths
- Both modes use the same summary section layout

### CSS Classes for Mode Switching
- `.service-only` - Shows only in service mode
- `.item-only` - Shows only in item mode  
- `.service-mode` - Applied to body element for service documents
- `.item-mode` - Applied to body element for item documents (default)

---

## Technical Implementation Notes

### Mode Detection
Document type is determined by:
1. URL parameter `docType` (I=Item, S=Service)
2. Data from server response
3. Default fallback to Item mode

### Column Configuration
Each table column has specific CSS classes for width control:
- Fixed minimum widths to prevent content overflow
- Responsive adjustments for mobile devices
- Consistent styling across both modes

### Data Population
- Service mode populates service-specific fields and table structure
- Item mode populates item-specific fields and table structure
- Both modes share common summary calculations and approval workflow