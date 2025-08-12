import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import logging
from django.conf import settings
from django.utils import timezone
from django.db import models
from .models import Customer, BatchJob, VolumetricData, SLAData, BatchSchedule, FileUpload
import re

logger = logging.getLogger(__name__)


class ExcelProcessor:
    """Utility class for processing Excel files and extracting data"""

    @staticmethod
    def read_excel_file(file_path, sheet_name=None):
        """Read Excel file and return DataFrame"""
        try:
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
                df = pd.read_excel(file_path)
            return df
        except Exception as e:
            logger.error(f"Error reading Excel file {file_path}: {str(e)}")
            return None

    @staticmethod
    def process_batch_performance_file(file_path, customer_id, product='FACETS'):
        """Process batch performance Excel file and create BatchJob records"""
        try:
            df = ExcelProcessor.read_excel_file(file_path)
            if df is None:
                return False, "Failed to read Excel file"

            customer = Customer.objects.get(id=customer_id)
            created_count = 0

            # Expected columns: Job_Name, Start_Time, End_Time, jobrun_id, Status
            required_columns = ['Job_Name', 'Start_Time', 'End_Time', 'jobrun_id', 'Status']
            optional_columns = ['Exit_Code', 'Machine_Name', 'Duration']
            # Check for required columns (allow some flexibility in naming)
            column_mapping = {}
            all_columns = required_columns + optional_columns
            
            # Define alternative column names for all columns
            alt_names = {
                'Job_Name': ['Job Name', 'JobName', 'job_name', 'job name'],
                'Start_Time': ['Start Time', 'StartTime', 'start_time', 'start time'],
                'End_Time': ['End Time', 'EndTime', 'end_time', 'end time'],
                'jobrun_id': ['JobRun ID', 'Job Run ID', 'jobrun id', 'JobRunID', 'job_run_id'],
                'Status': ['Job Status', 'status', 'job_status', 'JobStatus'],
                'Exit_Code': ['Exit Code', 'exit_code', 'ExitCode', 'exit code'],
                'Machine_Name': ['Machine Name', 'machine_name', 'MachineName', 'machine name', 'Host', 'hostname'],
                'Duration': ['Duration', 'duration', 'Runtime', 'runtime', 'Elapsed Time', 'elapsed_time']
            }
            
            # Process required columns first
            for req_col in required_columns:
                found = False
                for df_col in df.columns:
                    if df_col.lower().replace('_', ' ').replace(' ', '_') == req_col.lower():
                        column_mapping[req_col] = df_col
                        found = True
                        break
                if not found:
                    # Try alternative column names
                    for alt_name in alt_names.get(req_col, []):
                        if alt_name in df.columns:
                            column_mapping[req_col] = alt_name
                            found = True
                            break
                
                if not found:
                    return False, f"Missing required column: {req_col}. Available columns: {list(df.columns)}"
            
            # Map optional columns (don't fail if missing)
            for opt_col in optional_columns:
                found = False
                for df_col in df.columns:
                    if df_col.lower().replace('_', ' ').replace(' ', '_') == opt_col.lower():
                        column_mapping[opt_col] = df_col
                        found = True
                        break
                if not found:
                    # Try alternative column names
                    for alt_name in alt_names.get(opt_col, []):
                        if alt_name in df.columns:
                            column_mapping[opt_col] = alt_name
                            found = True
                            break

            for index, row in df.iterrows():
                try:
                    # Parse start time
                    start_time = pd.to_datetime(row[column_mapping['Start_Time']])
                    end_time = pd.to_datetime(row[column_mapping['End_Time']]) if pd.notna(row[column_mapping['End_Time']]) else None
                    
                    # Calculate duration from timestamps (always prefer this over Excel Duration column)
                    duration_minutes = None
                    if end_time and start_time:
                        # Check if timestamps are in wrong order and swap if necessary
                        if end_time < start_time:
                            logger.warning(f"End time ({end_time}) is before start time ({start_time}) for job {row[column_mapping['Job_Name']]} - swapping timestamps")
                            start_time, end_time = end_time, start_time
                        
                        duration_minutes = (end_time - start_time).total_seconds() / 60
                        
                        # Validate duration is reasonable (between 0 and 24 hours)
                        if duration_minutes < 0:
                            logger.error(f"Negative duration detected for job {row[column_mapping['Job_Name']]}: {duration_minutes:.2f} minutes")
                            duration_minutes = None
                        elif duration_minutes > 1440:  # More than 24 hours
                            logger.warning(f"Very long duration detected for job {row[column_mapping['Job_Name']]}: {duration_minutes:.2f} minutes")
                        
                        if duration_minutes is not None:
                            logger.info(f"Duration calculated for {row[column_mapping['Job_Name']]}: {duration_minutes:.2f} minutes")
                    else:
                        # Fallback: try to parse Excel Duration column if timestamps are missing
                        if 'Duration' in column_mapping and pd.notna(row[column_mapping['Duration']]):
                            try:
                                excel_duration = str(row[column_mapping['Duration']]).strip()
                                if ':' in excel_duration:
                                    # Parse HH:MM:SS format
                                    parts = excel_duration.split(':')
                                    if len(parts) >= 3:
                                        hours = int(parts[0])
                                        minutes = int(parts[1])
                                        seconds = int(parts[2])
                                        duration_minutes = hours * 60 + minutes + seconds / 60
                                        logger.info(f"Duration from Excel column for {row[column_mapping['Job_Name']]}: {duration_minutes:.2f} minutes")
                                    else:
                                        logger.warning(f"Invalid duration format in Excel: {excel_duration}")
                                else:
                                    # Try to convert as float (assume minutes)
                                    duration_minutes = float(excel_duration)
                                    logger.info(f"Duration from Excel (as minutes) for {row[column_mapping['Job_Name']]}: {duration_minutes:.2f} minutes")
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Could not parse Excel duration for {row[column_mapping['Job_Name']]}: {e}")
                        
                        if duration_minutes is None:
                            logger.warning(f"No duration available for job {row[column_mapping['Job_Name']]}")

                    # Determine if long running (more than 4 hours)
                    is_long_running = duration_minutes > 240 if duration_minutes else False

                    # Get optional fields
                    exit_code = None
                    machine_name = ''
                    
                    # Try to get Exit_Code if it exists
                    if 'Exit_Code' in column_mapping and pd.notna(row[column_mapping['Exit_Code']]):
                        try:
                            exit_code = int(row[column_mapping['Exit_Code']])
                        except (ValueError, TypeError):
                            exit_code = None
                    
                    # Try to get Machine_Name if it exists
                    if 'Machine_Name' in column_mapping and pd.notna(row[column_mapping['Machine_Name']]):
                        machine_name = str(row[column_mapping['Machine_Name']])[:200]  # Limit to 200 chars

                    # Map status from the required Status column
                    status_text = str(row[column_mapping['Status']]).strip()
                    
                    # Enhanced status mapping with comprehensive patterns
                    status_mapping = {
                        # Completed Normally variations
                        'completed normally': 'COMPLETED_NORMAL',
                        'completed normal': 'COMPLETED_NORMAL',
                        'complete normally': 'COMPLETED_NORMAL',
                        'complete normal': 'COMPLETED_NORMAL',
                        'completed_normal': 'COMPLETED_NORMAL',
                        'normal': 'COMPLETED_NORMAL',
                        'success': 'COMPLETED_NORMAL',
                        'successful': 'COMPLETED_NORMAL',
                        
                        # Completed Normally* variations
                        'completed normally*': 'COMPLETED_NORMAL_STAR',
                        'completed normal*': 'COMPLETED_NORMAL_STAR',
                        'complete normally*': 'COMPLETED_NORMAL_STAR',
                        'complete normal*': 'COMPLETED_NORMAL_STAR',
                        'completed_normal_star': 'COMPLETED_NORMAL_STAR',
                        'completed_normal*': 'COMPLETED_NORMAL_STAR',
                        'normal*': 'COMPLETED_NORMAL_STAR',
                        
                        # Completed Abnormally variations
                        'completed abnormally': 'COMPLETED_ABNORMAL',
                        'completed abnormal': 'COMPLETED_ABNORMAL',
                        'complete abnormally': 'COMPLETED_ABNORMAL',
                        'complete abnormal': 'COMPLETED_ABNORMAL',
                        'completed_abnormal': 'COMPLETED_ABNORMAL',
                        'abnormal': 'COMPLETED_ABNORMAL',
                        'warning': 'COMPLETED_ABNORMAL',
                        'completed with warnings': 'COMPLETED_ABNORMAL',
                        'completed with issues': 'COMPLETED_ABNORMAL',
                        
                        # Failed variations
                        'failed': 'FAILED',
                        'failure': 'FAILED',
                        'error': 'FAILED',
                        'aborted': 'FAILED',
                        'terminated': 'FAILED',
                        
                        # Long Running variations
                        'long running': 'LONG_RUNNING',
                        'long-running': 'LONG_RUNNING',
                        'long_running': 'LONG_RUNNING',
                        'running': 'LONG_RUNNING',
                        'in progress': 'LONG_RUNNING',
                        'timeout': 'LONG_RUNNING',
                        
                        # Pending variations
                        'pending': 'PENDING',
                        'waiting': 'PENDING',
                        'queued': 'PENDING',
                        'scheduled': 'PENDING'
                    }
                    
                    # Clean and normalize the status text for better matching
                    normalized_status = status_text.lower().strip()
                    # Remove extra spaces and special characters except asterisk
                    normalized_status = re.sub(r'\s+', ' ', normalized_status)
                    normalized_status = re.sub(r'[^\w\s*]', '', normalized_status)
                    
                    status = status_mapping.get(normalized_status)
                    
                    # If still not found, try partial matching for key terms
                    if not status:
                        if 'normal' in normalized_status and '*' in normalized_status:
                            status = 'COMPLETED_NORMAL_STAR'
                        elif 'normal' in normalized_status:
                            status = 'COMPLETED_NORMAL'
                        elif 'abnormal' in normalized_status:
                            status = 'COMPLETED_ABNORMAL'
                        elif 'fail' in normalized_status or 'error' in normalized_status:
                            status = 'FAILED'
                        elif 'running' in normalized_status or 'progress' in normalized_status:
                            status = 'LONG_RUNNING'
                        elif 'pending' in normalized_status or 'wait' in normalized_status:
                            status = 'PENDING'
                    
                    # Final fallback logic
                    if not status:
                        if end_time is None:
                            status = 'PENDING'
                        elif is_long_running:
                            status = 'LONG_RUNNING'
                        else:
                            status = 'COMPLETED_NORMAL'
                        logger.warning(f"Unknown status '{status_text}' (normalized: '{normalized_status}') for row {index}, using fallback: {status}")
                    else:
                        logger.info(f"Mapped status '{status_text}' to '{status}' for row {index}")

                    # Auto-assign exit code if missing from Excel file
                    if exit_code is None:
                        # Assign realistic exit codes based on job status
                        if status in ['COMPLETED_NORMAL', 'COMPLETED_NORMAL_STAR']:
                            exit_code = 0  # Success
                        elif status == 'COMPLETED_ABNORMAL':
                            exit_code = 1  # Warning/abnormal completion
                        elif status == 'FAILED':
                            exit_code = 1  # Error
                        elif status == 'LONG_RUNNING':
                            exit_code = 0  # Assume success for long running jobs
                        else:
                            exit_code = 0  # Default to success for unknown statuses
                        
                        logger.info(f"Auto-assigned exit_code {exit_code} for job {row[column_mapping['Job_Name']]} based on status '{status}'")

                    batch_job = BatchJob.objects.create(
                        customer=customer,
                        job_name=str(row[column_mapping['Job_Name']]),
                        jobrun_id=str(row[column_mapping['jobrun_id']]),
                        job_id='',  # Keep empty for backward compatibility
                        status=status,
                        product=product,  # Explicitly set the product from upload parameter
                        start_time=start_time,
                        end_time=end_time,
                        duration_minutes=duration_minutes,
                        exit_code=exit_code,
                        error_message=str(row.get('Error Message', '')),
                        month=start_time.strftime('%Y-%m'),
                        year=start_time.year,
                        is_long_running=is_long_running
                    )
                    created_count += 1
                    
                    # Debug logging for verification
                    logger.debug(f"Created BatchJob {batch_job.id}: {batch_job.job_name} - Status: {status} (from '{status_text}') - Product: {batch_job.product}")

                except Exception as e:
                    logger.error(f"Error processing row {index}: {str(e)}")
                    continue

            return True, f"Successfully processed {created_count} batch job records"

        except Exception as e:
            logger.error(f"Error processing batch performance file: {str(e)}")
            return False, str(e)

    @staticmethod
    def process_volumetrics_file(file_path, customer_id, product='FACETS'):
        """Process volumetrics Excel file and create VolumetricData records"""
        try:
            df = ExcelProcessor.read_excel_file(file_path)
            if df is None:
                return False, "Failed to read Excel file"

            customer = Customer.objects.get(id=customer_id)
            created_count = 0

            # Clean column names to remove any whitespace/formatting issues
            df.columns = df.columns.str.strip()
            
            # Expected columns: Job Name, Date, Total Volume, Total Runtime
            required_columns = ['Job Name', 'Date', 'Total Volume', 'Total Runtime']
            
            # Check if all required columns exist (case-insensitive and flexible)
            missing_cols = []
            column_mapping = {}
            
            for req_col in required_columns:
                # Try exact match first
                if req_col in df.columns:
                    column_mapping[req_col] = req_col
                else:
                    # Try case-insensitive match
                    found = False
                    for col in df.columns:
                        if col.lower().strip() == req_col.lower().strip():
                            column_mapping[req_col] = col
                            found = True
                            break
                    
                    if not found:
                        missing_cols.append(req_col)
            
            if missing_cols:
                available_cols = list(df.columns)
                return False, f"Missing required columns: {missing_cols}. Available columns: {available_cols}"

            for index, row in df.iterrows():
                try:
                    # Use mapped column names
                    date = pd.to_datetime(row[column_mapping['Date']]).date()
                    total_volume = int(row[column_mapping['Total Volume']])
                    total_runtime_minutes = float(row[column_mapping['Total Runtime']])
                    
                    # Calculate records processed per minute
                    records_per_minute = total_volume / total_runtime_minutes if total_runtime_minutes > 0 else 0

                    # Optional fields - try both exact and flexible matching
                    def get_optional_field(field_name, data_type=float, default=None):
                        """Helper to get optional fields with flexible column matching"""
                        value = default
                        
                        # Try exact match first
                        if field_name in df.columns and pd.notna(row.get(field_name)):
                            try:
                                value = data_type(row[field_name]) if row[field_name] != 0 or data_type == int else None
                            except (ValueError, TypeError):
                                value = default
                        
                        # Try case-insensitive match
                        if value is None or value == default:
                            for col in df.columns:
                                if col.lower().strip() == field_name.lower().strip() and pd.notna(row.get(col)):
                                    try:
                                        value = data_type(row[col]) if row[col] != 0 or data_type == int else None
                                        break
                                    except (ValueError, TypeError):
                                        continue
                        
                        return value

                    peak_volume = get_optional_field('Peak Volume', int)
                    average_volume = get_optional_field('Average Volume', float)
                    peak_runtime = get_optional_field('Peak Runtime', float)
                    average_runtime = get_optional_field('Average Runtime', float)
                    min_performance = get_optional_field('Min Performance', float)
                    max_performance = get_optional_field('Max Performance', float)

                    # Calculate processing efficiency (percentage)
                    processing_efficiency = None
                    if max_performance and records_per_minute:
                        processing_efficiency = (records_per_minute / max_performance) * 100

                    volumetric_data = VolumetricData.objects.create(
                        customer=customer,
                        job_name=str(row[column_mapping['Job Name']]),
                        date=date,
                        total_volume=total_volume,
                        total_runtime_minutes=total_runtime_minutes,
                        records_processed_per_minute=records_per_minute,
                        peak_volume=peak_volume,
                        average_volume=average_volume,
                        peak_runtime=peak_runtime,
                        average_runtime=average_runtime,
                        min_performance=min_performance,
                        max_performance=max_performance,
                        processing_efficiency=processing_efficiency
                    )
                    created_count += 1

                except Exception as e:
                    logger.error(f"Error processing volumetrics row {index}: {str(e)}")
                    continue

            return True, f"Successfully processed {created_count} volumetric records"

        except Exception as e:
            logger.error(f"Error processing volumetrics file: {str(e)}")
            return False, str(e)

    @staticmethod
    def process_sla_tracking_file(file_path, customer_id, product='FACETS'):
        """Process SLA tracking Excel file and create SLAData records"""
        try:
            df = ExcelProcessor.read_excel_file(file_path)
            if df is None:
                return False, "Failed to read Excel file"

            customer = Customer.objects.get(id=customer_id)
            created_count = 0

            # Expected columns: Job Name, Date, SLA Target, Actual Runtime, Business Impact
            required_columns = ['Job Name', 'Date', 'SLA Target', 'Actual Runtime']
            
            if not all(col in df.columns for col in required_columns):
                missing_cols = [col for col in required_columns if col not in df.columns]
                return False, f"Missing required columns: {missing_cols}"

            for index, row in df.iterrows():
                try:
                    date = pd.to_datetime(row['Date']).date()
                    
                    # Parse SLA Target time (could be "11:50 PM MT" format or minutes)
                    sla_target_minutes = ExcelProcessor.parse_time_to_minutes(row['SLA Target'])
                    
                    # Parse Actual Runtime (could be "11:50 PM MT" format or minutes)  
                    actual_runtime_minutes = ExcelProcessor.parse_time_to_minutes(row['Actual Runtime'])
                    
                    business_impact = str(row.get('Business Impact', ''))

                    # Calculate SLA status and variance
                    sla_met = actual_runtime_minutes <= sla_target_minutes
                    variance_minutes = actual_runtime_minutes - sla_target_minutes
                    sla_status = 'MET' if sla_met else 'MISSED'
                    
                    # Calculate variance percentage
                    variance_percentage = (variance_minutes / sla_target_minutes) * 100 if sla_target_minutes > 0 else 0

                    sla_data = SLAData.objects.create(
                        customer=customer,
                        product=product,
                        job_name=str(row['Job Name']),
                        date=date,
                        sla_target_minutes=sla_target_minutes,
                        actual_runtime_minutes=actual_runtime_minutes,
                        business_impact=business_impact,
                        sla_status=sla_status,
                        variance_minutes=variance_minutes,
                        variance_percentage=variance_percentage
                    )
                    created_count += 1

                except Exception as e:
                    logger.error(f"Error processing SLA row {index}: {str(e)}")
                    continue

            return True, f"Successfully processed {created_count} SLA records"

        except Exception as e:
            logger.error(f"Error processing SLA tracking file: {str(e)}")
            return False, str(e)

    @staticmethod
    def process_batch_schedule_file(file_path, customer_id, product='FACETS'):
        """Process batch schedule Excel file and create BatchSchedule records"""
        try:
            df = ExcelProcessor.read_excel_file(file_path)
            if df is None:
                return False, "Failed to read Excel file"

            customer = Customer.objects.get(id=customer_id)
            created_count = 0

            # Expected columns: Schedule Name, Job Name, Schedule Pattern, Next Run Time, Status, Priority
            required_columns = ['Schedule Name', 'Job Name', 'Schedule Pattern', 'Next Run Time']
            
            if not all(col in df.columns for col in required_columns):
                missing_cols = [col for col in required_columns if col not in df.columns]
                return False, f"Missing required columns: {missing_cols}"

            for index, row in df.iterrows():
                try:
                    next_run_time = pd.to_datetime(row['Next Run Time'])
                    last_run_time = pd.to_datetime(row.get('Last Run Time', None)) if pd.notna(row.get('Last Run Time', None)) else None
                    
                    status_mapping = {
                        'active': 'ACTIVE',
                        'inactive': 'INACTIVE',
                        'suspended': 'SUSPENDED',
                        'maintenance': 'MAINTENANCE'
                    }
                    
                    status = status_mapping.get(str(row.get('Status', 'active')).lower(), 'ACTIVE')
                    priority = int(row.get('Priority', 1))
                    
                    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else None

                    batch_schedule = BatchSchedule.objects.create(
                        customer=customer,
                        schedule_name=str(row['Schedule Name']),
                        job_name=str(row['Job Name']),
                        schedule_pattern=str(row['Schedule Pattern']),
                        next_run_time=next_run_time,
                        last_run_time=last_run_time,
                        status=status,
                        priority=priority,
                        dependencies=str(row.get('Dependencies', '')),
                        file_path=file_path,
                        file_name=os.path.basename(file_path),
                        file_size=file_size
                    )
                    created_count += 1

                except Exception as e:
                    logger.error(f"Error processing schedule row {index}: {str(e)}")
                    continue

            return True, f"Successfully processed {created_count} schedule records"

        except Exception as e:
            logger.error(f"Error processing batch schedule file: {str(e)}")
            return False, str(e)

    @staticmethod
    def process_emb_batch_schedule_file(file_path, customer_id, product='FACETS'):
        """Process Tidal Excel file format and create BatchSchedule records"""
        try:
            df = ExcelProcessor.read_excel_file(file_path)
            if df is None:
                return False, "Failed to read Excel file"

            customer = Customer.objects.get(id=customer_id)
            created_count = 0

            # Expected columns for Tidal format
            required_columns = ['JOBNAME']
            
            if not all(col in df.columns for col in required_columns):
                missing_cols = [col for col in required_columns if col not in df.columns]
                return False, f"Missing required columns: {missing_cols}. Available columns: {list(df.columns)}"

            for index, row in df.iterrows():
                try:
                    # Skip empty rows
                    if pd.isna(row.get('JOBNAME')) or str(row.get('JOBNAME')).strip() == '':
                        continue
                        
                    # Parse enabled/disabled status
                    enabled_disabled = str(row.get('ENABLED OR DISABLED?', '')).strip().upper()
                    status = 'ENABLED' if enabled_disabled == 'ENABLED' else 'DISABLED'
                    
                    # Parse category
                    category = str(row.get('CATEGORY', 'TID')).strip().upper()
                    if category not in ['TID', 'FOLDER', 'CONDITION', 'RESOURCE']:
                        category = 'TID'
                    
                    # Parse last modified date
                    last_modified_on = None
                    if pd.notna(row.get('LAST MODIFIED ON')):
                        try:
                            last_modified_on = pd.to_datetime(row['LAST MODIFIED ON'])
                        except:
                            pass
                    
                    # Parse dependencies - clean up long text
                    dependencies_text = str(row.get('DEP UPON JOB/VARIABLE/FILE', '')).strip()
                    if len(dependencies_text) > 1000:  # Truncate if too long
                        dependencies_text = dependencies_text[:1000] + '...'
                    
                    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else None

                    batch_schedule = BatchSchedule.objects.create(
                        customer=customer,
                        # Core job information
                        job_name=str(row.get('JOBNAME', '')).strip(),
                        job_id=str(row.get('ID', '')).strip(),
                        category=category,
                        
                        # Status and enablement  
                        status=status,
                        enabled_status=enabled_disabled,
                        
                        # Hierarchy and organization
                        parent_group=str(row.get('PARENT GROUP', '')).strip()[:500],  # Limit length
                        
                        # Calendar and timing
                        calendar=str(row.get('CALENDAR', '')).strip(),
                        calendar_offset=str(row.get('CALENDAR OFFSET', '')).strip(),
                        time_zone=str(row.get('Time Zone', 'DEFAULT (E.S.T.)')).strip(),
                        start_time=str(row.get('Start time', '')).strip(),
                        until_time=str(row.get('Until time', '')).strip(),
                        
                        # Dependencies and execution
                        dependencies=dependencies_text,
                        agent_or_agent_list=str(row.get('RUNS ON AGENT OR AGENT LIST?', '')).strip(),
                        
                        # Metadata
                        class_name=str(row.get('CLASS', '')).strip(),
                        owner=str(row.get('OWNER', '')).strip(),
                        last_modified_on=last_modified_on,
                        
                        # Legacy fields for compatibility
                        schedule_name=str(row.get('JOBNAME', '')).strip(),
                        schedule_pattern=str(row.get('CALENDAR', '')).strip(),
                        
                        # File tracking
                        file_path=file_path,
                        file_name=os.path.basename(file_path),
                        file_size=file_size
                    )
                    created_count += 1

                except Exception as e:
                    logger.error(f"Error processing EMB schedule row {index}: {str(e)}")
                    continue

            return True, f"Successfully processed {created_count} EMB schedule records"

        except Exception as e:
            logger.error(f"Error processing EMB batch schedule file: {str(e)}")
            return False, str(e)

    @staticmethod
    def process_enhanced_batch_schedule(file_path, customer):
        """Process batch schedule Excel file with comprehensive fields (DHH_B27_TMS_Demo format)"""
        results = {
            'success': False,
            'records_processed': 0,
            'errors': [],
            'records': []
        }
        
        try:
            # Read Excel file
            df = pd.read_excel(file_path, sheet_name=0)
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Expected columns mapping
            column_mapping = {
                'JOBNAME': 'job_name',
                'ID': 'job_id',
                'CATEGORY': 'category',
                'ENABLED OR DISABLED?': 'enabled_status',
                'PARENT GROUP': 'parent_group',
                'COMMAND': 'command',
                'Parameters': 'parameters',
                'CALENDAR': 'calendar',
                'CALENDAR OFFSET': 'calendar_offset',
                'DEP UPON JOB/VARIABLE/FILE': 'dependencies',
                'RUNS ON AGENT OR AGENT LIST?': 'agent_or_agent_list',
                'LAST MODIFIED ON': 'last_modified_on',
                'CLASS': 'class_name',
                'OWNER': 'owner',
                'Time Zone': 'time_zone',
                'Start time': 'start_time',
                'Until time': 'until_time',
                'REPEATS': 'repeats',
                'RUN NEW/RERUN SAME OCCURRENCE?': 'run_new_rerun_same',
                'MAX NUMBER OF RUNS': 'max_number_of_runs',
                'Agent / Agent List': 'agent_agent_list',
                'RUNTIME USER': 'runtime_user',
                'FOR TRACKING, USE:': 'for_tracking_use',
                'Exit code range:': 'exit_code_range',
                'SCAN OUTPUT: NORMAL': 'scan_output_normal',
                'Exclude Completed Abnormally?': 'exclude_completed_abnormally',
                'REQUIRED VIRTUAL RESOURCE': 'required_virtual_resource',
                'AMOUNT REQUIRED': 'amount_required',
                'If job is currently running:': 'if_job_currently_running',
                'If not enough time b4 outage': 'if_not_enough_time_b4_outage',
                'Save Output Option': 'save_output_option',
                'Allow unscheduled?': 'allow_unscheduled',
                'Allow operator rerun?': 'allow_operator_rerun',
                'Require operator release?': 'require_operator_release',
                'Disable Carryover?': 'disable_carryover',
                'HISTORY RETENTION (DAYS)': 'history_retention_days',
                'run book': 'run_book',
                'Notes': 'notes'
            }
            
            # Check for required columns
            required_columns = ['JOBNAME']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                results['errors'].append(f"Missing required columns: {missing_columns}")
                return results
            
            processed_count = 0
            for index, row in df.iterrows():
                try:
                    # Skip empty rows
                    if pd.isna(row.get('JOBNAME')) or str(row.get('JOBNAME')).strip() == '':
                        continue
                    
                    # Create record dictionary
                    record_data = {'customer': customer.id}
                    
                    # Map columns
                    for excel_col, model_field in column_mapping.items():
                        if excel_col in df.columns:
                            value = row.get(excel_col)
                            
                            # Handle special data types
                            if model_field in ['max_number_of_runs', 'amount_required', 'history_retention_days']:
                                if pd.notna(value) and value != '':
                                    try:
                                        record_data[model_field] = int(float(value))
                                    except (ValueError, TypeError):
                                        record_data[model_field] = None
                                else:
                                    record_data[model_field] = None
                            elif model_field == 'last_modified_on':
                                if pd.notna(value) and value != '':
                                    try:
                                        if isinstance(value, str):
                                            # Try to parse datetime string
                                            record_data[model_field] = pd.to_datetime(value).to_pydatetime()
                                        else:
                                            record_data[model_field] = value
                                    except:
                                        record_data[model_field] = None
                                else:
                                    record_data[model_field] = None
                            else:
                                # String fields
                                if pd.notna(value) and value != '':
                                    record_data[model_field] = str(value).strip()
                                else:
                                    record_data[model_field] = ''
                    
                    # Set default values for required fields and categorize properly
                    if not record_data.get('category'):
                        record_data['category'] = 'TID'
                    
                    # Enhance category detection based on Excel patterns
                    excel_category = str(row.get('CATEGORY', '')).upper().strip()
                    if excel_category:
                        if excel_category in ['FOLDER', 'GROUP', 'JOB GROUP']:
                            record_data['category'] = 'GROUP'
                        elif excel_category in ['CONDITION', 'DEPENDENCY']:
                            record_data['category'] = 'CONDITION'
                        elif excel_category in ['RESOURCE', 'AGENT']:
                            record_data['category'] = 'RESOURCE'
                        elif excel_category in ['VARIABLE', 'CALENDAR', 'CONNECTION']:
                            record_data['category'] = excel_category
                        else:
                            record_data['category'] = 'TID'
                    
                    if not record_data.get('enabled_status'):
                        record_data['enabled_status'] = 'ENABLED'
                    if not record_data.get('time_zone'):
                        record_data['time_zone'] = 'DEFAULT (E.S.T.)'
                    if not record_data.get('repeats'):
                        record_data['repeats'] = 'DO NOT REPEAT'
                    if not record_data.get('for_tracking_use'):
                        record_data['for_tracking_use'] = 'Exit code'
                    
                    results['records'].append(record_data)
                    processed_count += 1
                    
                except Exception as e:
                    results['errors'].append(f"Row {index + 2}: {str(e)}")
                    continue
            
            results['records_processed'] = processed_count
            results['success'] = processed_count > 0
            
            if processed_count == 0:
                results['errors'].append("No valid records found in the file")
            
        except Exception as e:
            results['errors'].append(f"Error processing file: {str(e)}")
        
        return results

    @staticmethod
    def parse_time_to_minutes(time_value):
        """
        Parse time value in various formats and convert to minutes
        Supports:
        - "11:50 PM MT" format
        - "23:50" (24-hour format)
        - "11:50:30 PM" (with seconds)
        - Numerical minutes (float/int)
        """
        import re
        from datetime import datetime, time
        
        if pd.isna(time_value) or time_value == '':
            return 0.0
            
        # If it's already a number (minutes), return as float
        try:
            return float(time_value)
        except (ValueError, TypeError):
            pass
        
        time_str = str(time_value).strip().upper()
        
        # Remove timezone suffixes like "MT", "EST", "PST", etc.
        time_str = re.sub(r'\s+(MT|EST|PST|CST|EDT|PDT|CDT|UTC|GMT)$', '', time_str)
        
        try:
            # Handle "11:50 PM" format
            if 'AM' in time_str or 'PM' in time_str:
                # Parse 12-hour format
                time_obj = datetime.strptime(time_str, '%I:%M %p').time()
                return time_obj.hour * 60 + time_obj.minute + time_obj.second / 60.0
            
            # Handle "11:50:30 PM" format (with seconds)
            elif ':' in time_str and len(time_str.split(':')) == 3:
                if 'AM' in time_str or 'PM' in time_str:
                    time_obj = datetime.strptime(time_str, '%I:%M:%S %p').time()
                else:
                    time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
                return time_obj.hour * 60 + time_obj.minute + time_obj.second / 60.0
            
            # Handle "23:50" format (24-hour)
            elif ':' in time_str:
                time_obj = datetime.strptime(time_str, '%H:%M').time()
                return time_obj.hour * 60 + time_obj.minute
            
            else:
                # Try to parse as float (minutes)
                return float(time_str)
                
        except ValueError as e:
            logger.error(f"Could not parse time value '{time_value}': {str(e)}")
            return 0.0


class SLAAnalyzer:
    """Utility class for analyzing batch performance against SLA definitions"""
    
    @staticmethod
    def analyze_batch_performance_for_sla(customer_id=None, product=None, date_from=None, date_to=None):
        """
        Analyze batch performance data against SLA definitions and create/update SLA data
        """
        from .models import BatchJob, SLADefinition, SLAData
        from datetime import datetime, time, timedelta
        
        # Get batch jobs to analyze
        batch_jobs = BatchJob.objects.all()
        
        if customer_id:
            batch_jobs = batch_jobs.filter(customer_id=customer_id)
        if product:
            batch_jobs = batch_jobs.filter(product=product)
        if date_from:
            batch_jobs = batch_jobs.filter(start_time__date__gte=date_from)
        if date_to:
            batch_jobs = batch_jobs.filter(start_time__date__lte=date_to)
        
        # Only analyze completed jobs
        batch_jobs = batch_jobs.filter(status__in=['COMPLETED_NORMAL', 'COMPLETED_ABNORMAL', 'COMPLETED_NORMAL_STAR', 'COMPLETED', 'COMPLETED_WITH_WARNINGS'])
        
        analyzed_count = 0
        created_count = 0
        updated_count = 0
        
        for batch_job in batch_jobs:
            try:
                # Find matching SLA definition
                try:
                    sla_definition = SLADefinition.objects.get(
                        customer=batch_job.customer,
                        product=batch_job.product,
                        job_name=batch_job.job_name,
                        is_active=True
                    )
                except SLADefinition.DoesNotExist:
                    # No SLA defined for this job - treat as met by default
                    actual_completion_time = batch_job.end_time.time() if batch_job.end_time else None
                    actual_runtime_minutes = 0
                    completed_next_day = False
                    days_late = 0
                    
                    # Calculate actual runtime minutes from start of day if job completed
                    if batch_job.end_time:
                        job_start_date = batch_job.start_time.date()
                        job_completion_date = batch_job.end_time.date()
                        completed_next_day = job_completion_date > job_start_date
                        days_late = (job_completion_date - job_start_date).days
                        
                        # Calculate minutes from midnight
                        actual_runtime_minutes = SLAAnalyzer._time_to_minutes(actual_completion_time)
                        if completed_next_day:
                            actual_runtime_minutes += (days_late * 24 * 60)
                    
                    sla_data, created = SLAData.objects.update_or_create(
                        customer=batch_job.customer,
                        product=batch_job.product,
                        job_name=batch_job.job_name,
                        date=batch_job.start_time.date(),
                        batch_job=batch_job,
                        defaults={
                            'sla_definition': None,
                            'sla_target_time': None,
                            'actual_completion_time': actual_completion_time,
                            'sla_target_minutes': 0,
                            'actual_runtime_minutes': actual_runtime_minutes,
                            'completed_next_day': completed_next_day,
                            'days_late': days_late,
                            'sla_status': 'MET',  # Jobs without SLA definition are considered met by default
                            'variance_minutes': 0,  # No variance since no target
                            'variance_percentage': 0,  # No variance since no target
                            'business_impact': 'No SLA defined - considered compliant by default'
                        }
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                    analyzed_count += 1
                    continue
                
                # Calculate SLA compliance
                sla_result = SLAAnalyzer._calculate_sla_compliance(batch_job, sla_definition)
                
                # Create or update SLA data record
                sla_data, created = SLAData.objects.update_or_create(
                    customer=batch_job.customer,
                    product=batch_job.product,
                    job_name=batch_job.job_name,
                    date=batch_job.start_time.date(),
                    batch_job=batch_job,
                    defaults=sla_result
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                analyzed_count += 1
                
            except Exception as e:
                logger.error(f"Error analyzing SLA for batch job {batch_job.id}: {str(e)}")
                continue
        
        return {
            'analyzed_count': analyzed_count,
            'created_count': created_count,
            'updated_count': updated_count,
            'message': f"Analyzed {analyzed_count} batch jobs: {created_count} created, {updated_count} updated"
        }
    
    @staticmethod
    def _calculate_sla_compliance(batch_job, sla_definition):
        """Calculate SLA compliance for a specific batch job"""
        from datetime import datetime, time, timedelta
        
        if not batch_job.end_time:
            return {
                'sla_definition': sla_definition,
                'sla_target_time': sla_definition.sla_target_time,
                'actual_completion_time': None,
                'sla_target_minutes': SLAAnalyzer._time_to_minutes(sla_definition.sla_target_time),
                'actual_runtime_minutes': 0,
                'completed_next_day': False,
                'days_late': 0,
                'sla_status': 'AT_RISK',  # Incomplete jobs are at risk, not NO_SLA
                'variance_minutes': 0,
                'variance_percentage': 0,
                'business_impact': 'Job not completed yet'
            }
        
        # Get target and actual times
        target_time = sla_definition.sla_target_time
        actual_completion_time = batch_job.end_time.time()
        job_start_date = batch_job.start_time.date()
        job_completion_date = batch_job.end_time.date()
        
        # Convert times to minutes from midnight
        target_minutes = SLAAnalyzer._time_to_minutes(target_time)
        actual_minutes = SLAAnalyzer._time_to_minutes(actual_completion_time)
        
        # Check if job completed on a different day
        completed_next_day = job_completion_date > job_start_date
        days_late = (job_completion_date - job_start_date).days
        
        # If completed next day, add 24 hours worth of minutes
        if completed_next_day:
            actual_minutes += (days_late * 24 * 60)
        
        # Calculate variance
        variance_minutes = actual_minutes - target_minutes
        variance_percentage = (variance_minutes / target_minutes) * 100 if target_minutes > 0 else 0
        
        # Determine status
        if completed_next_day or days_late > 0:
            sla_status = 'MISSED'
            business_impact = f"Job completed {days_late} day(s) late"
        elif variance_minutes <= 0:
            sla_status = 'MET'
            business_impact = f"Job completed {abs(variance_minutes):.1f} minutes early"
        else:
            sla_status = 'MISSED'
            business_impact = f"Job completed {variance_minutes:.1f} minutes late"
        
        return {
            'sla_definition': sla_definition,
            'sla_target_time': target_time,
            'actual_completion_time': actual_completion_time,
            'sla_target_minutes': target_minutes,
            'actual_runtime_minutes': actual_minutes,
            'completed_next_day': completed_next_day,
            'days_late': days_late,
            'sla_status': sla_status,
            'variance_minutes': variance_minutes,
            'variance_percentage': variance_percentage,
            'business_impact': business_impact
        }
    
    @staticmethod
    def _time_to_minutes(time_obj):
        """Convert time object to minutes from midnight"""
        if not time_obj:
            return 0
        return time_obj.hour * 60 + time_obj.minute + time_obj.second / 60.0


class DataAnalyzer:
    """Utility class for analyzing processed data"""

    @staticmethod
    def get_batch_job_summary(customer_id=None, month=None, date_from=None, date_to=None, product=None):
        """Get batch job summary statistics"""
        queryset = BatchJob.objects.all()
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if month:
            queryset = queryset.filter(month=month)
        
        if product:
            queryset = queryset.filter(product=product)
        
        # Date range filtering
        if date_from:
            queryset = queryset.filter(start_time__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(start_time__date__lte=date_to)

        total_jobs = queryset.count()
        completed_normal = queryset.filter(status='COMPLETED_NORMAL').count()
        completed_abnormal = queryset.filter(status='COMPLETED_ABNORMAL').count()
        completed_normal_star = queryset.filter(status='COMPLETED_NORMAL_STAR').count()
        long_running = queryset.filter(status='LONG_RUNNING').count()  # Changed from is_long_running to status
        long_running_by_flag = queryset.filter(is_long_running=True).count()  # Keep this for jobs marked as long running
        # Use the maximum of the two counts for long_running
        long_running = max(long_running, long_running_by_flag)
        failed = queryset.filter(status='FAILED').count()
        pending = queryset.filter(status='PENDING').count()
        
        # Debug logging
        logger.debug(f"Batch summary for customer {customer_id}, month {month}, date_from {date_from}, date_to {date_to}, product {product}: "
                    f"Total: {total_jobs}, Normal: {completed_normal}, Normal*: {completed_normal_star}, "
                    f"Abnormal: {completed_abnormal}, Failed: {failed}, Long Running: {long_running}, Pending: {pending}")

        success_rate = 0
        if total_jobs > 0:
            successful_jobs = completed_normal + completed_normal_star
            success_rate = (successful_jobs / total_jobs) * 100

        average_duration = queryset.aggregate(
            avg_duration=models.Avg('duration_minutes')
        )['avg_duration'] or 0

        # Determine time period description
        time_period = month or 'All Time'
        if date_from or date_to:
            if date_from and date_to:
                time_period = f"{date_from} to {date_to}"
            elif date_from:
                time_period = f"From {date_from}"
            elif date_to:
                time_period = f"Until {date_to}"

        return {
            'total_jobs': total_jobs,
            'completed_normal': completed_normal,
            'completed_abnormal': completed_abnormal,
            'completed_normal_star': completed_normal_star,
            'long_running': long_running,
            'failed': failed,
            'pending': pending,
            'success_rate': round(success_rate, 2),
            'average_duration': round(average_duration, 2),
            'month': time_period,
            'product': product or 'All Products'
        }

    @staticmethod
    def get_volumetric_summary(customer_id, job_name=None, date_from=None, date_to=None):
        """Get volumetric summary statistics"""
        queryset = VolumetricData.objects.all()
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if job_name:
            queryset = queryset.filter(job_name__icontains=job_name)

        # Date range filtering
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        aggregated_data = queryset.aggregate(
            total_volume_sum=models.Sum('total_volume'),
            average_volume_calc=models.Avg('total_volume'),
            peak_volume_max=models.Max('peak_volume'),
            total_runtime_sum=models.Sum('total_runtime_minutes'),
            average_runtime_calc=models.Avg('total_runtime_minutes'),
            peak_runtime_max=models.Max('peak_runtime'),
            average_efficiency_calc=models.Avg('processing_efficiency'),
            min_performance_calc=models.Min('min_performance'),
            max_performance_calc=models.Max('max_performance')
        )

        # Calculate average performance (records per minute)
        avg_performance = queryset.aggregate(
            avg_perf=models.Avg('records_processed_per_minute')
        )['avg_perf'] or 0

        # Determine time period description
        time_period = 'All Time'
        if date_from or date_to:
            if date_from and date_to:
                time_period = f"{date_from} to {date_to}"
            elif date_from:
                time_period = f"From {date_from}"
            elif date_to:
                time_period = f"Until {date_to}"

        return {
            'total_volume': aggregated_data['total_volume_sum'] or 0,
            'avg_volume': round(aggregated_data['average_volume_calc'] or 0, 2),
            'average_volume': round(aggregated_data['average_volume_calc'] or 0, 2),
            'peak_volume': aggregated_data['peak_volume_max'] or 0,
            'total_runtime': round(aggregated_data['total_runtime_sum'] or 0, 2),
            'average_runtime': round(aggregated_data['average_runtime_calc'] or 0, 2),
            'peak_runtime': round(aggregated_data['peak_runtime_max'] or 0, 2),
            'average_efficiency': round(aggregated_data['average_efficiency_calc'] or 0, 2),
            'avg_performance': round(avg_performance, 2),
            'min_performance': round(aggregated_data['min_performance_calc'] or 0, 2),
            'max_performance': round(aggregated_data['max_performance_calc'] or 0, 2),
            'job_name': job_name or 'All Jobs',
            'time_period': time_period
        }

    @staticmethod
    def get_sla_summary(customer_id, month=None, date_from=None, date_to=None, product=None):
        """Get SLA summary statistics"""
        queryset = SLAData.objects.all()
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if month:
            queryset = queryset.filter(date__year=int(month[:4]), date__month=int(month[-2:]))
        
        if product:
            queryset = queryset.filter(product=product)
        
        # Date range filtering
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        total_jobs = queryset.count()
        sla_met = queryset.filter(sla_status='MET').count()
        sla_missed = queryset.filter(sla_status='MISSED').count()
        at_risk = queryset.filter(sla_status='AT_RISK').count()
        no_sla = queryset.filter(sla_status='NO_SLA').count()  # For backward compatibility

        sla_compliance_rate = 0
        if total_jobs > 0:
            sla_compliance_rate = (sla_met / total_jobs) * 100

        average_variance = queryset.aggregate(
            avg_variance=models.Avg('variance_percentage')
        )['avg_variance'] or 0

        # Calculate additional metrics for the frontend
        avg_sla_target = queryset.aggregate(
            avg_target=models.Avg('sla_target_minutes')
        )['avg_target'] or 0
        
        avg_actual_runtime = queryset.aggregate(
            avg_runtime=models.Avg('actual_runtime_minutes')
        )['avg_runtime'] or 0

        # Determine time period description
        time_period = month or 'All Time'
        if date_from or date_to:
            if date_from and date_to:
                time_period = f"{date_from} to {date_to}"
            elif date_from:
                time_period = f"From {date_from}"
            elif date_to:
                time_period = f"Until {date_to}"

        return {
            'total_jobs': total_jobs,
            'sla_met': sla_met,
            'sla_missed': sla_missed,
            'at_risk': at_risk,
            'no_sla': no_sla,
            'sla_compliance_rate': sla_compliance_rate,
            'average_variance_percentage': average_variance,
            'avg_sla_target_minutes': avg_sla_target,
            'avg_actual_runtime_minutes': avg_actual_runtime,
            'time_period': time_period
        }

    @staticmethod
    def get_grouped_customers():
        """Get customers grouped by name and code, aggregating products"""
        from .models import Customer, BatchJob
        from django.db.models import Count, Max, Min
        from collections import defaultdict
        
        # Get all customers
        customers = Customer.objects.all().order_by('name', 'code', 'product')
        
        # Group customers by (name, code)
        grouped = defaultdict(list)
        for customer in customers:
            key = (customer.name, customer.code)
            grouped[key].append(customer)
        
        # Convert to list of grouped customer data
        grouped_customers = []
        for (name, code), customer_list in grouped.items():
            # Get all products for this customer group
            products = [customer.product for customer in customer_list]
            customer_ids = [customer.id for customer in customer_list]
            
            # Get descriptions for each product
            descriptions = {customer.product: customer.description for customer in customer_list}
            
            # Determine if any customer in the group is active
            is_active = any(customer.is_active for customer in customer_list)
            
            # Get earliest created date and latest updated date
            created_at = min(customer.created_at for customer in customer_list)
            updated_at = max(customer.updated_at for customer in customer_list)
            
            # Calculate total batch jobs count for all customers in this group
            total_batch_jobs = BatchJob.objects.filter(customer_id__in=customer_ids).count()
            
            # Get last activity across all customers in the group
            last_job = BatchJob.objects.filter(customer_id__in=customer_ids).order_by('-start_time').first()
            last_activity = last_job.start_time if last_job else None
            
            grouped_customers.append({
                'name': name,
                'code': code,
                'products': products,
                'descriptions': descriptions,
                'is_active': is_active,
                'created_at': created_at,
                'updated_at': updated_at,
                'batch_jobs_count': total_batch_jobs,
                'last_activity': last_activity,
                'customer_ids': customer_ids
            })
        
        return grouped_customers

    @staticmethod
    def get_failure_analysis(customer_id=None, date_from=None, date_to=None, product=None):
        """Get failure analysis data showing per-job failure statistics"""
        from django.db import models
        from .models import BatchJob
        
        queryset = BatchJob.objects.all()
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if product:
            queryset = queryset.filter(product=product)
        
        # Date range filtering
        if date_from:
            queryset = queryset.filter(start_time__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(start_time__date__lte=date_to)

        # Get per-job failure analysis
        failure_analysis = []
        
        # Group jobs by job_name and analyze failures
        job_stats = queryset.values('job_name').annotate(
            total_runs=models.Count('id'),
            failed_runs=models.Count('id', filter=models.Q(status='FAILED')),
            abnormal_runs=models.Count('id', filter=models.Q(status='COMPLETED_ABNORMAL')),
            normal_runs=models.Count('id', filter=models.Q(status='COMPLETED_NORMAL')),
            normal_star_runs=models.Count('id', filter=models.Q(status='COMPLETED_NORMAL_STAR')),
            long_running_runs=models.Count('id', filter=models.Q(status='LONG_RUNNING')),
            pending_runs=models.Count('id', filter=models.Q(status='PENDING')),
            avg_duration=models.Avg('duration_minutes'),
            max_duration=models.Max('duration_minutes'),
            min_duration=models.Min('duration_minutes')
        ).order_by('-failed_runs', '-abnormal_runs', 'job_name')

        for job_stat in job_stats:
            total_failures = job_stat['failed_runs'] + job_stat['abnormal_runs']
            successful_runs = job_stat['normal_runs'] + job_stat['normal_star_runs']
            
            failure_rate = 0
            success_rate = 0
            if job_stat['total_runs'] > 0:
                failure_rate = (total_failures / job_stat['total_runs']) * 100
                success_rate = (successful_runs / job_stat['total_runs']) * 100

            # Get most recent failure details
            recent_failure = queryset.filter(
                job_name=job_stat['job_name'],
                status__in=['FAILED', 'COMPLETED_ABNORMAL']
            ).order_by('-start_time').first()

            failure_analysis.append({
                'job_name': job_stat['job_name'],
                'total_runs': job_stat['total_runs'],
                'failed_runs': job_stat['failed_runs'],
                'abnormal_runs': job_stat['abnormal_runs'],
                'total_failures': total_failures,
                'successful_runs': successful_runs,
                'failure_rate': round(failure_rate, 2),
                'success_rate': round(success_rate, 2),
                'avg_duration': round(job_stat['avg_duration'] or 0, 2),
                'max_duration': round(job_stat['max_duration'] or 0, 2),
                'min_duration': round(job_stat['min_duration'] or 0, 2),
                'recent_failure_time': recent_failure.start_time if recent_failure else None,
                'recent_failure_message': recent_failure.error_message if recent_failure else None,
                'impact_level': 'High' if failure_rate > 50 else 'Medium' if failure_rate > 10 else 'Low'
            })

        # Overall failure statistics
        total_jobs = queryset.count()
        total_failed = queryset.filter(status='FAILED').count()
        total_abnormal = queryset.filter(status='COMPLETED_ABNORMAL').count()
        total_failures = total_failed + total_abnormal
        
        overall_failure_rate = 0
        if total_jobs > 0:
            overall_failure_rate = (total_failures / total_jobs) * 100

        return {
            'failure_analysis': failure_analysis,
            'summary': {
                'total_jobs': total_jobs,
                'total_failed': total_failed,
                'total_abnormal': total_abnormal,
                'total_failures': total_failures,
                'overall_failure_rate': round(overall_failure_rate, 2),
                'jobs_with_failures': len([job for job in failure_analysis if job['total_failures'] > 0])
            }
        }

    @staticmethod
    def get_long_running_analysis(customer_id=None, date_from=None, date_to=None, product=None):
        """Get long running job analysis data showing per-job performance issues"""
        from django.db import models
        from .models import BatchJob
        
        queryset = BatchJob.objects.all()
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if product:
            queryset = queryset.filter(product=product)
        
        # Date range filtering
        if date_from:
            queryset = queryset.filter(start_time__date__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(start_time__date__lte=date_to)

        # Get per-job long running analysis
        long_running_analysis = []
        
        # Group jobs by job_name and analyze long running instances
        job_stats = queryset.values('job_name').annotate(
            total_runs=models.Count('id'),
            long_running_by_status=models.Count('id', filter=models.Q(status='LONG_RUNNING')),
            long_running_by_flag=models.Count('id', filter=models.Q(is_long_running=True)),
            normal_runs=models.Count('id', filter=models.Q(status='COMPLETED_NORMAL')),
            avg_duration=models.Avg('duration_minutes'),
            max_duration=models.Max('duration_minutes'),
            min_duration=models.Min('duration_minutes'),
            median_duration=models.Avg('duration_minutes')  # Approximation
        ).order_by('-long_running_by_status', '-long_running_by_flag', 'job_name')

        for job_stat in job_stats:
            # Use the higher count between status and flag
            long_running_count = max(job_stat['long_running_by_status'], job_stat['long_running_by_flag'])
            
            long_running_rate = 0
            if job_stat['total_runs'] > 0:
                long_running_rate = (long_running_count / job_stat['total_runs']) * 100

            # Calculate performance metrics
            avg_duration = job_stat['avg_duration'] or 0
            max_duration = job_stat['max_duration'] or 0
            min_duration = job_stat['min_duration'] or 0
            
            # Performance variability
            duration_variability = max_duration - min_duration if max_duration and min_duration else 0
            
            # Get most recent long running instance
            recent_long_running = queryset.filter(
                job_name=job_stat['job_name']
            ).filter(
                models.Q(status='LONG_RUNNING') | models.Q(is_long_running=True)
            ).order_by('-start_time').first()

            # Determine performance impact level
            if long_running_rate > 30 or avg_duration > 120:  # >30% long running or >2 hours average
                impact_level = 'High'
            elif long_running_rate > 10 or avg_duration > 60:  # >10% long running or >1 hour average
                impact_level = 'Medium'
            else:
                impact_level = 'Low'

            long_running_analysis.append({
                'job_name': job_stat['job_name'],
                'total_runs': job_stat['total_runs'],
                'long_running_count': long_running_count,
                'long_running_rate': round(long_running_rate, 2),
                'avg_duration': round(avg_duration, 2),
                'max_duration': round(max_duration, 2),
                'min_duration': round(min_duration, 2),
                'duration_variability': round(duration_variability, 2),
                'recent_long_running_time': recent_long_running.start_time if recent_long_running else None,
                'recent_long_running_duration': recent_long_running.duration_minutes if recent_long_running else None,
                'impact_level': impact_level,
                'performance_score': round(100 - long_running_rate, 2)  # Inverse of long running rate
            })

        # Overall long running statistics
        total_jobs = queryset.count()
        total_long_running_status = queryset.filter(status='LONG_RUNNING').count()
        total_long_running_flag = queryset.filter(is_long_running=True).count()
        total_long_running = max(total_long_running_status, total_long_running_flag)
        
        overall_long_running_rate = 0
        if total_jobs > 0:
            overall_long_running_rate = (total_long_running / total_jobs) * 100

        # Calculate average duration across all jobs
        overall_avg_duration = queryset.aggregate(avg=models.Avg('duration_minutes'))['avg'] or 0

        return {
            'long_running_analysis': long_running_analysis,
            'summary': {
                'total_jobs': total_jobs,
                'total_long_running': total_long_running,
                'overall_long_running_rate': round(overall_long_running_rate, 2),
                'overall_avg_duration': round(overall_avg_duration, 2),
                'jobs_with_performance_issues': len([job for job in long_running_analysis if job['long_running_count'] > 0])
            }
        } 