# Dashboard Data Modules Guide

## 📊 **Overview**

The dashboard has **4 main data modules** that analyze different aspects of batch job performance. Each module requires specific Excel file formats and displays comprehensive analytics.

---

## 🔧 **1. Batch Performance Module**

### **📁 Required File Format:**
| Column | Description | Example |
|--------|-------------|---------|
| Job_Name | Name of the batch job | Daily_Reconciliation |
| Start_Time | Job start timestamp | 2024-01-15 09:00:00 |
| End_Time | Job completion timestamp | 2024-01-15 09:45:00 |
| jobrun_id | Unique job run identifier | RUN001 |
| Status | Job completion status | Completed Normally |

### **⚠️ Status Values (Must be exact):**
- ✅ **Completed Normally** - Job completed successfully
- ❌ **Completed Abnormally** - Job completed with errors/issues  
- ⭐ **Completed Normally*** - Job completed normally with special conditions

### **📈 What You'll See:**
- **Summary Cards:** Total jobs, completion rates, long-running jobs
- **Charts:** Job status distribution, monthly trends, duration analysis
- **Table:** Detailed job history with filtering capabilities
- **Metrics:** Average runtime, success rates, error patterns

---

## 📊 **2. Volumetrics Analysis Module**

### **📁 Required File Format:**
| Column | Description | Example |
|--------|-------------|---------|
| Job Name | Name of the job | ETL_Process |
| Date | Processing date | 2024-01-15 |
| Total Volume | Total records processed | 50000 |
| Total Runtime | Runtime in minutes | 120.5 |
| Peak Volume | Peak volume (optional) | 55000 |
| Average Volume | Average volume (optional) | 48000 |
| Peak Runtime | Peak runtime (optional) | 130.0 |
| Average Runtime | Average runtime (optional) | 115.0 |
| Min Performance | Min records/min (optional) | 400 |
| Max Performance | Max records/min (optional) | 500 |

### **📈 What You'll See:**
- **Summary Cards:** Total volume, average volume, total runtime, average performance
- **Charts:** Volume performance by job, processing efficiency trends
- **Table:** Detailed volumetrics with efficiency calculations
- **Metrics:** Records per minute, peak performance, processing efficiency percentages

---

## 🎯 **3. SLA Tracking Module**

### **📁 Required File Format:**
| Column | Description | Example |
|--------|-------------|---------|
| Job Name | Name of the job | Critical_Backup |
| Date | SLA measurement date | 2024-01-15 |
| SLA Target | Target runtime in minutes | 60 |
| Actual Runtime | Actual runtime in minutes | 55 |
| Business Impact | Impact description (optional) | Minor delay in reporting |

### **📈 What You'll See:**
- **Summary Cards:** SLA compliance rate, total jobs tracked, SLA breaches, average target time
- **Charts:** SLA target vs actual runtime, compliance overview pie chart
- **Table:** Detailed SLA analysis with status indicators and variance calculations
- **Metrics:** Compliance percentages, variance analysis, business impact tracking

### **🔍 SLA Status Logic:**
- ✅ **SLA Met:** Actual ≤ Target
- ⚠️ **SLA Warning:** Actual > Target by ≤10%
- ❌ **SLA Breached:** Actual > Target by >10%

---

## 📅 **4. Batch Schedule Module**

### **📁 Required File Format:**
| Column | Description | Example |
|--------|-------------|---------|
| Schedule Name | Name of the schedule | Daily_Backup_Schedule |
| Job Name | Associated job name | Backup_Job |
| Schedule Pattern | When it runs | Daily 02:00 |
| Next Run Time | Next scheduled run | 2024-01-16 02:00:00 |
| Last Run Time | Last execution (optional) | 2024-01-15 02:00:00 |
| Status | Schedule status (optional) | active |
| Priority | Priority level (optional) | 1 |

### **📈 What You'll See:**
- **Schedule Overview:** Active/inactive schedules
- **Download Capability:** Download schedule files for specific clients
- **Schedule Management:** View and track batch schedules

---

## 🚀 **How to Upload Data**

### **Step 1: Prepare Excel Files**
1. **Create Excel files** using the formats above
2. **Save as .xlsx or .xls** format
3. **Use sample files** from `sample_excel_files/` as templates

### **Step 2: Upload Through Dashboard**
1. **Navigate to:** http://localhost:3000/customers
2. **Scroll to:** "Upload Data Files" section
3. **Select:** Customer and appropriate file type
4. **Upload:** Your Excel file
5. **Verify:** Processing success message

### **Step 3: View Analytics**
- **Batch Performance:** http://localhost:3000/batch-performance
- **Volumetrics:** http://localhost:3000/volumetrics  
- **SLA Tracking:** http://localhost:3000/sla-tracking
- **Batch Schedule:** http://localhost:3000/batch-schedule

---

## 🎨 **Dashboard Features**

### **📊 Common Features Across All Modules:**
- **Customer Filtering:** View data for specific customers
- **Time Filtering:** Filter by month/date ranges
- **Interactive Charts:** Hover for details, responsive design
- **Data Tables:** Sortable, searchable, with pagination
- **Export Options:** Download charts and data
- **Real-time Updates:** Data refreshes when new files are uploaded

### **📱 Responsive Design:**
- **Desktop:** Full charts and tables view
- **Tablet:** Optimized layout with collapsible elements  
- **Mobile:** Stacked cards and simplified navigation

---

## 🔍 **Data Validation**

### **Upload Validation:**
- ✅ **File Format:** Only .xlsx and .xls files accepted
- ✅ **Required Columns:** System checks for mandatory fields
- ✅ **Data Types:** Validates dates, numbers, and text formats
- ✅ **Business Rules:** Ensures logical data consistency

### **Error Handling:**
- **Missing Columns:** Clear error messages with available columns listed
- **Invalid Data:** Warnings logged, fallback values used where appropriate
- **Processing Errors:** Detailed error logs for troubleshooting

---

## 📈 **Analytics Capabilities**

### **Performance Metrics:**
- **Trend Analysis:** Month-over-month comparisons
- **Efficiency Tracking:** Performance improvements over time
- **Issue Identification:** Automatic flagging of anomalies
- **Capacity Planning:** Volume and runtime projections

### **Reporting Features:**
- **Summary Dashboards:** High-level KPIs and metrics
- **Detailed Analytics:** Drill-down capabilities for investigation
- **Custom Filtering:** Multi-dimensional data analysis
- **Visual Charts:** Bar, line, pie, and combination charts

---

## 🎯 **Getting Started**

1. **Upload Sample Data:**
   ```bash
   # Use the generated sample files
   sample_excel_files/batch_performance_sample.xlsx
   sample_excel_files/volumetrics_sample.xlsx
   sample_excel_files/sla_tracking_sample.xlsx
   sample_excel_files/batch_schedule_sample.xlsx
   ```

2. **Navigate to Each Module:**
   - Check that data appears in charts and tables
   - Test filtering by customer and date
   - Verify metrics are calculated correctly

3. **Upload Your Own Data:**
   - Follow the exact column formats above
   - Start with small test files
   - Verify data processing success before uploading large files

## 📞 **Support**

If you encounter issues:
1. **Check file format** matches the requirements exactly
2. **Verify column names** are spelled correctly
3. **Ensure data types** match expected formats (dates, numbers)
4. **Review error messages** in the upload feedback
5. **Test with sample files** first to confirm system is working

**All modules are now fully functional with comprehensive data visualization and analytics!** 🎉 