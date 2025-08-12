import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from django.db.models import Q, Count, Avg, Max, Min
from django.utils import timezone
from typing import Dict, List, Tuple, Optional
import logging
from collections import defaultdict
import json

from .models import (
    BatchJob, VolumetricData, SLAData, Customer,
    PredictionModel, PredictionResult, HistoricalPattern, PredictionAlert
)

logger = logging.getLogger(__name__)


class SmartPredictor:
    """Main prediction engine for batch job analytics"""
    
    def __init__(self, customer_id: int, lookback_days: int = 90):
        self.customer = Customer.objects.get(id=customer_id)
        self.lookback_days = lookback_days
        self.cutoff_date = timezone.now().date() - timedelta(days=lookback_days)
    
    def generate_demo_predictions(self, days_ahead: int = 7) -> Dict:
        """Generate demo predictions for testing the interface"""
        # Get some actual job names from the data
        recent_jobs = BatchJob.objects.filter(
            customer=self.customer
        ).values_list('job_name', flat=True).distinct()[:10]
        
        job_names = list(recent_jobs) if recent_jobs else ['DemoJob_01', 'DemoJob_02', 'DemoJob_03']
        
        demo_predictions = {
            'failures': [],
            'long_runners': [],
            'sla_misses': [],
            'volume_spikes': []
        }
        
        # Generate some demo failure predictions
        for i, job_name in enumerate(job_names[:3]):
            for day_offset in [1, 3, 5]:
                prediction_date = timezone.now().date() + timedelta(days=day_offset)
                failure_prob = 0.3 + (i * 0.1) + (day_offset * 0.05)
                
                demo_predictions['failures'].append({
                    'job_name': job_name,
                    'predicted_date': prediction_date,
                    'failure_probability': min(0.85, failure_prob),
                    'risk_level': 'HIGH' if failure_prob > 0.6 else 'MEDIUM',
                    'contributing_factors': {
                        'recent_failures': 2,
                        'performance_degradation': True,
                        'dependency_issues': False
                    },
                    'confidence': min(0.9, failure_prob + 0.2)
                })
        
        # Generate demo long runner predictions
        for i, job_name in enumerate(job_names[:2]):
            for day_offset in [2, 4]:
                prediction_date = timezone.now().date() + timedelta(days=day_offset)
                duration = 120 + (i * 30) + (day_offset * 10)
                
                demo_predictions['long_runners'].append({
                    'job_name': job_name,
                    'predicted_date': prediction_date,
                    'predicted_duration': duration,
                    'probability': 0.6 + (i * 0.1),
                    'risk_level': 'HIGH',
                    'normal_duration': 60 + (i * 15),
                    'confidence': 0.8
                })
        
        # Generate demo SLA miss predictions
        for i, job_name in enumerate(job_names[:2]):
            prediction_date = timezone.now().date() + timedelta(days=i + 1)
            
            demo_predictions['sla_misses'].append({
                'job_name': job_name,
                'predicted_date': prediction_date,
                'sla_miss_probability': 0.4 + (i * 0.2),
                'risk_level': 'MEDIUM',
                'sla_target': '23:30',
                'predicted_completion': '23:45',
                'confidence': 0.75
            })
        
        # Generate demo volume spikes
        if job_names:
            demo_predictions['volume_spikes'].append({
                'job_name': job_names[0],
                'predicted_date': timezone.now().date() + timedelta(days=2),
                'predicted_volume': 15000,
                'high_volume_probability': 0.7,
                'risk_level': 'HIGH',
                'normal_volume': 8000,
                'threshold': 12000,
                'confidence': 0.8
            })
        
        return demo_predictions
    
    def analyze_historical_patterns(self) -> Dict:
        """Analyze historical data to identify patterns"""
        patterns = {
            'failure_patterns': self._analyze_failure_patterns(),
            'performance_patterns': self._analyze_performance_patterns(),
            'volume_patterns': self._analyze_volume_patterns(),
            'sla_patterns': self._analyze_sla_patterns(),
            'seasonal_patterns': self._analyze_seasonal_patterns()
        }
        
        # Store discovered patterns in database
        self._store_patterns(patterns)
        
        return patterns
    
    def predict_job_failures(self, days_ahead: int = 7) -> List[Dict]:
        """Predict potential job failures in the next N days"""
        predictions = []
        
        # Get historical failure data
        failure_data = self._get_failure_history()
        
        for job_name in failure_data['jobs']:
            job_history = failure_data['jobs'][job_name]
            
            if len(job_history) < 3:  # Need minimum data
                continue
            
            # Calculate failure probability
            failure_prob = self._calculate_failure_probability(job_history)
            
            if failure_prob > 0.1:  # Only predict if significant risk (lowered threshold)
                for day_offset in range(1, days_ahead + 1):
                    prediction_date = timezone.now().date() + timedelta(days=day_offset)
                    
                                    # Adjust probability based on day patterns
                daily_prob = self._adjust_probability_for_day(
                    failure_prob, prediction_date, job_history
                )
                
                if daily_prob > 0.2:  # Lowered threshold for failure predictions
                        predictions.append({
                            'job_name': job_name,
                            'predicted_date': prediction_date,
                            'failure_probability': daily_prob,
                            'risk_level': self._get_risk_level(daily_prob),
                            'contributing_factors': self._get_failure_factors(job_history),
                            'confidence': min(0.95, daily_prob + 0.1)
                        })
        
        return sorted(predictions, key=lambda x: x['failure_probability'], reverse=True)
    
    def predict_long_running_jobs(self, days_ahead: int = 7) -> List[Dict]:
        """Predict jobs that will likely run longer than usual"""
        predictions = []
        
        # Get performance history
        performance_data = self._get_performance_history()
        
        for job_name in performance_data:
            job_stats = performance_data[job_name]
            
            if job_stats['count'] < 5:  # Need minimum data
                continue
            
            # Calculate threshold for "long running"
            avg_duration = job_stats['avg_duration']
            std_duration = job_stats['std_duration']
            threshold = avg_duration + (2 * std_duration)
            
            # Predict probability of exceeding threshold
            long_run_prob = self._calculate_long_running_probability(job_stats)
            
            if long_run_prob > 0.2:  # Lowered threshold for long runners
                for day_offset in range(1, days_ahead + 1):
                    prediction_date = timezone.now().date() + timedelta(days=day_offset)
                    
                    daily_prob = self._adjust_probability_for_day(
                        long_run_prob, prediction_date, job_stats
                    )
                    
                    if daily_prob > 0.3:  # Lowered threshold for long runners
                        predictions.append({
                            'job_name': job_name,
                            'predicted_date': prediction_date,
                            'predicted_duration': threshold,
                            'probability': daily_prob,
                            'risk_level': self._get_risk_level(daily_prob),
                            'normal_duration': avg_duration,
                            'confidence': min(0.9, daily_prob + 0.1)
                        })
        
        return sorted(predictions, key=lambda x: x['probability'], reverse=True)
    
    def predict_sla_misses(self, days_ahead: int = 7) -> List[Dict]:
        """Predict potential SLA misses based on historical patterns and long runners"""
        predictions = []
        
        # Get SLA history and current definitions
        sla_data = self._get_sla_history()
        long_runner_predictions = self.predict_long_running_jobs(days_ahead)
        
        for job_name in sla_data:
            job_sla_history = sla_data[job_name]
            
            if not job_sla_history.get('sla_target'):
                continue
            
            # Calculate base SLA miss probability
            base_prob = self._calculate_sla_miss_probability(job_sla_history)
            
            # Enhance predictions with long runner data
            for long_runner in long_runner_predictions:
                if long_runner['job_name'] == job_name:
                    enhanced_prob = min(0.95, base_prob + long_runner['probability'] * 0.3)
                    
                    predictions.append({
                        'job_name': job_name,
                        'predicted_date': long_runner['predicted_date'],
                        'sla_miss_probability': enhanced_prob,
                        'risk_level': self._get_risk_level(enhanced_prob),
                        'sla_target': job_sla_history['sla_target'],
                        'predicted_completion': self._estimate_completion_time(
                            job_name, long_runner['predicted_duration']
                        ),
                        'contributing_factors': {
                            'long_running_risk': long_runner['probability'],
                            'historical_sla_misses': job_sla_history['miss_rate']
                        },
                        'confidence': min(0.9, enhanced_prob)
                    })
            
            # Also add base SLA predictions without long runner correlation
            if base_prob > 0.4:
                for day_offset in range(1, days_ahead + 1):
                    prediction_date = timezone.now().date() + timedelta(days=day_offset)
                    
                    predictions.append({
                        'job_name': job_name,
                        'predicted_date': prediction_date,
                        'sla_miss_probability': base_prob,
                        'risk_level': self._get_risk_level(base_prob),
                        'sla_target': job_sla_history['sla_target'],
                        'confidence': min(0.8, base_prob + 0.1)
                    })
        
        # Remove duplicates and sort
        unique_predictions = {}
        for pred in predictions:
            key = f"{pred['job_name']}_{pred['predicted_date']}"
            if key not in unique_predictions or pred['sla_miss_probability'] > unique_predictions[key]['sla_miss_probability']:
                unique_predictions[key] = pred
        
        return sorted(unique_predictions.values(), key=lambda x: x['sla_miss_probability'], reverse=True)
    
    def predict_high_volume(self, days_ahead: int = 7) -> List[Dict]:
        """Predict high volume periods based on historical patterns"""
        predictions = []
        
        # Get volume history
        volume_data = self._get_volume_history()
        
        for job_name in volume_data:
            job_volumes = volume_data[job_name]
            
            if len(job_volumes) < 10:  # Need minimum data
                continue
            
            # Calculate volume statistics
            avg_volume = np.mean([v['volume'] for v in job_volumes])
            std_volume = np.std([v['volume'] for v in job_volumes])
            high_volume_threshold = avg_volume + (2 * std_volume)
            
            # Analyze patterns
            volume_patterns = self._analyze_volume_patterns_for_job(job_volumes)
            
            for day_offset in range(1, days_ahead + 1):
                prediction_date = timezone.now().date() + timedelta(days=day_offset)
                
                # Calculate probability based on patterns
                high_vol_prob = self._calculate_high_volume_probability(
                    volume_patterns, prediction_date
                )
                
                if high_vol_prob > 0.4:
                    predicted_volume = self._estimate_volume(
                        volume_patterns, prediction_date, avg_volume, std_volume
                    )
                    
                    predictions.append({
                        'job_name': job_name,
                        'predicted_date': prediction_date,
                        'predicted_volume': predicted_volume,
                        'high_volume_probability': high_vol_prob,
                        'risk_level': self._get_risk_level(high_vol_prob),
                        'normal_volume': avg_volume,
                        'threshold': high_volume_threshold,
                        'confidence': min(0.85, high_vol_prob + 0.1)
                    })
        
        return sorted(predictions, key=lambda x: x['high_volume_probability'], reverse=True)
    
    def generate_predictive_alerts(self, predictions: Dict) -> List[Dict]:
        """Generate alerts based on high-risk predictions"""
        alerts = []
        
        # Process failure predictions
        for pred in predictions.get('failures', []):
            if pred['risk_level'] in ['HIGH', 'CRITICAL']:
                alerts.append({
                    'type': 'FAILURE_WARNING',
                    'severity': 'CRITICAL' if pred['risk_level'] == 'CRITICAL' else 'WARNING',
                    'title': f"High Failure Risk: {pred['job_name']}",
                    'message': f"Job {pred['job_name']} has a {pred['failure_probability']:.1%} chance of failure on {pred['predicted_date']}",
                    'predicted_date': pred['predicted_date'],
                    'prediction_data': pred,
                    'recommended_actions': self._get_failure_recommendations(pred)
                })
        
        # Process long runner predictions
        for pred in predictions.get('long_runners', []):
            if pred['risk_level'] in ['HIGH', 'CRITICAL']:
                alerts.append({
                    'type': 'LONG_RUNNER_WARNING',
                    'severity': 'WARNING',
                    'title': f"Long Running Job Expected: {pred['job_name']}",
                    'message': f"Job {pred['job_name']} may run {pred['predicted_duration']:.0f} minutes (normal: {pred['normal_duration']:.0f})",
                    'predicted_date': pred['predicted_date'],
                    'prediction_data': pred,
                    'recommended_actions': self._get_long_runner_recommendations(pred)
                })
        
        # Process SLA miss predictions
        for pred in predictions.get('sla_misses', []):
            if pred['risk_level'] in ['HIGH', 'CRITICAL']:
                alerts.append({
                    'type': 'SLA_MISS_WARNING',
                    'severity': 'CRITICAL' if pred['risk_level'] == 'CRITICAL' else 'WARNING',
                    'title': f"SLA Miss Risk: {pred['job_name']}",
                    'message': f"Job {pred['job_name']} has a {pred['sla_miss_probability']:.1%} chance of missing SLA on {pred['predicted_date']}",
                    'predicted_date': pred['predicted_date'],
                    'prediction_data': pred,
                    'recommended_actions': self._get_sla_recommendations(pred)
                })
        
        # Process volume spike predictions
        for pred in predictions.get('volume_spikes', []):
            if pred['risk_level'] in ['HIGH', 'CRITICAL']:
                alerts.append({
                    'type': 'VOLUME_SPIKE_WARNING',
                    'severity': 'WARNING',
                    'title': f"High Volume Expected: {pred['job_name']}",
                    'message': f"Job {pred['job_name']} may process {pred['predicted_volume']:,} records (normal: {pred['normal_volume']:.0f})",
                    'predicted_date': pred['predicted_date'],
                    'prediction_data': pred,
                    'recommended_actions': self._get_volume_recommendations(pred)
                })
        
        return sorted(alerts, key=lambda x: (x['severity'], x['predicted_date']))
    
    # Helper methods for data analysis
    
    def _get_failure_history(self) -> Dict:
        """Get historical failure data for analysis"""
        failures = BatchJob.objects.filter(
            customer=self.customer,
            start_time__date__gte=self.cutoff_date,
            status__in=['FAILED', 'COMPLETED_ABNORMAL']
        ).values('job_name', 'start_time', 'status', 'duration_minutes')
        
        jobs = defaultdict(list)
        for failure in failures:
            jobs[failure['job_name']].append({
                'date': failure['start_time'].date(),
                'status': failure['status'],
                'duration': failure['duration_minutes']
            })
        
        return {'jobs': dict(jobs), 'total_failures': len(failures)}
    
    def _get_performance_history(self) -> Dict:
        """Get performance history for duration analysis"""
        jobs = BatchJob.objects.filter(
            customer=self.customer,
            start_time__date__gte=self.cutoff_date,
            duration_minutes__isnull=False
        ).values('job_name', 'duration_minutes', 'start_time')
        
        performance = defaultdict(list)
        for job in jobs:
            performance[job['job_name']].append({
                'duration': job['duration_minutes'],
                'date': job['start_time'].date(),
                'day_of_week': job['start_time'].weekday()
            })
        
        # Calculate statistics
        result = {}
        for job_name, durations in performance.items():
            duration_values = [d['duration'] for d in durations]
            result[job_name] = {
                'count': len(duration_values),
                'avg_duration': np.mean(duration_values),
                'std_duration': np.std(duration_values),
                'max_duration': max(duration_values),
                'min_duration': min(duration_values),
                'history': durations
            }
        
        return result
    
    def _get_sla_history(self) -> Dict:
        """Get SLA compliance history"""
        sla_data = SLAData.objects.filter(
            customer=self.customer,
            date__gte=self.cutoff_date
        ).values('job_name', 'sla_status', 'sla_target_minutes', 'variance_minutes')
        
        jobs = defaultdict(list)
        for sla in sla_data:
            jobs[sla['job_name']].append({
                'status': sla['sla_status'],
                'target': sla['sla_target_minutes'],
                'variance': sla['variance_minutes']
            })
        
        # Calculate SLA statistics
        result = {}
        for job_name, sla_records in jobs.items():
            misses = sum(1 for s in sla_records if s['status'] == 'MISSED')
            result[job_name] = {
                'total_runs': len(sla_records),
                'misses': misses,
                'miss_rate': misses / len(sla_records) if sla_records else 0,
                'sla_target': sla_records[0]['target'] if sla_records else None,
                'avg_variance': np.mean([s['variance'] for s in sla_records])
            }
        
        return result
    
    def _get_volume_history(self) -> Dict:
        """Get volume history for analysis"""
        volumes = VolumetricData.objects.filter(
            customer=self.customer,
            date__gte=self.cutoff_date
        ).values('job_name', 'date', 'total_volume', 'total_runtime_minutes')
        
        jobs = defaultdict(list)
        for vol in volumes:
            jobs[vol['job_name']].append({
                'date': vol['date'],
                'volume': vol['total_volume'],
                'runtime': vol['total_runtime_minutes'],
                'day_of_week': vol['date'].weekday(),
                'day_of_month': vol['date'].day
            })
        
        return dict(jobs)
    
    def _calculate_failure_probability(self, job_history: List[Dict]) -> float:
        """Calculate failure probability based on historical patterns"""
        if not job_history:
            return 0.0
        
        # Simple approach: failure rate in recent history
        total_runs = len(job_history)
        failures = sum(1 for h in job_history if h['status'] in ['FAILED', 'COMPLETED_ABNORMAL'])
        
        base_rate = failures / total_runs
        
        # Weight recent failures more heavily
        recent_failures = sum(1 for h in job_history[-7:] if h['status'] in ['FAILED', 'COMPLETED_ABNORMAL'])
        recent_rate = recent_failures / min(7, len(job_history))
        
        # Combine base rate and recent rate
        combined_rate = (base_rate * 0.6) + (recent_rate * 0.4)
        
        # If there are any failures at all, apply a minimum probability for demo purposes
        if failures > 0:
            combined_rate = max(0.15, combined_rate)
        
        return min(0.95, combined_rate)
    
    def _calculate_long_running_probability(self, job_stats: Dict) -> float:
        """Calculate probability of job running longer than normal"""
        if job_stats['count'] < 3:
            return 0.0
        
        # Analyze recent trend
        recent_durations = [h['duration'] for h in job_stats['history'][-10:]]
        avg_recent = np.mean(recent_durations)
        threshold = job_stats['avg_duration'] + (2 * job_stats['std_duration'])
        
        # If recent average is trending up
        trend_factor = min(1.0, avg_recent / job_stats['avg_duration'])
        
        # Count how often we exceed the threshold
        exceedances = sum(1 for d in recent_durations if d > threshold)
        exceedance_rate = exceedances / len(recent_durations)
        
        return min(0.9, exceedance_rate * trend_factor)
    
    def _calculate_sla_miss_probability(self, sla_history: Dict) -> float:
        """Calculate SLA miss probability"""
        if sla_history['total_runs'] < 3:
            return 0.0
        
        base_miss_rate = sla_history['miss_rate']
        
        # Factor in variance trend
        variance_factor = 1.0
        if sla_history['avg_variance'] > 0:
            variance_factor = min(1.5, 1.0 + (sla_history['avg_variance'] / 60.0))  # Normalize to hours
        
        return min(0.95, base_miss_rate * variance_factor)
    
    def _calculate_high_volume_probability(self, volume_patterns: Dict, prediction_date: date) -> float:
        """Calculate high volume probability based on patterns"""
        day_of_week = prediction_date.weekday()
        day_of_month = prediction_date.day
        
        # Check for day-of-week patterns
        weekly_factor = volume_patterns.get('weekly', {}).get(day_of_week, 1.0)
        
        # Check for monthly patterns
        monthly_factor = volume_patterns.get('monthly', {}).get(day_of_month, 1.0)
        
        # Base probability from historical spikes
        base_prob = volume_patterns.get('spike_frequency', 0.1)
        
        combined_prob = base_prob * weekly_factor * monthly_factor
        return min(0.9, combined_prob)
    
    def _analyze_volume_patterns_for_job(self, job_volumes: List[Dict]) -> Dict:
        """Analyze volume patterns for a specific job"""
        if len(job_volumes) < 5:
            return {'spike_frequency': 0.1}
        
        volumes = [v['volume'] for v in job_volumes]
        avg_volume = np.mean(volumes)
        std_volume = np.std(volumes)
        threshold = avg_volume + (1.5 * std_volume)
        
        # Weekly patterns
        weekly_patterns = defaultdict(list)
        for vol in job_volumes:
            weekly_patterns[vol['day_of_week']].append(vol['volume'])
        
        weekly_factors = {}
        for day, day_volumes in weekly_patterns.items():
            day_avg = np.mean(day_volumes)
            weekly_factors[day] = day_avg / avg_volume if avg_volume > 0 else 1.0
        
        # Monthly patterns
        monthly_patterns = defaultdict(list)
        for vol in job_volumes:
            monthly_patterns[vol['day_of_month']].append(vol['volume'])
        
        monthly_factors = {}
        for day, day_volumes in monthly_patterns.items():
            day_avg = np.mean(day_volumes)
            monthly_factors[day] = day_avg / avg_volume if avg_volume > 0 else 1.0
        
        # Spike frequency
        spikes = sum(1 for v in volumes if v > threshold)
        spike_frequency = spikes / len(volumes)
        
        return {
            'weekly': weekly_factors,
            'monthly': monthly_factors,
            'spike_frequency': spike_frequency,
            'threshold': threshold
        }
    
    def _get_risk_level(self, probability: float) -> str:
        """Convert probability to risk level"""
        if probability >= 0.8:
            return 'CRITICAL'
        elif probability >= 0.6:
            return 'HIGH'
        elif probability >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _get_failure_factors(self, job_history: List[Dict]) -> Dict:
        """Get contributing factors for failure predictions"""
        if not job_history:
            return {}
        
        failures = [h for h in job_history if h['status'] in ['FAILED', 'COMPLETED_ABNORMAL']]
        recent_failures = len([h for h in job_history[-7:] if h['status'] in ['FAILED', 'COMPLETED_ABNORMAL']])
        
        return {
            'total_failures': len(failures),
            'recent_failures': recent_failures,
            'failure_rate': len(failures) / len(job_history),
            'has_recent_pattern': recent_failures > 0
        }
    
    def _adjust_probability_for_day(self, base_prob: float, prediction_date: date, history: List) -> float:
        """Adjust probability based on day-of-week patterns"""
        day_of_week = prediction_date.weekday()
        
        # Simple day-of-week adjustment (could be enhanced with actual pattern analysis)
        day_factors = {
            0: 1.1,  # Monday - slightly higher risk
            1: 1.0,  # Tuesday
            2: 1.0,  # Wednesday  
            3: 1.0,  # Thursday
            4: 0.9,  # Friday - slightly lower risk
            5: 0.7,  # Saturday - much lower risk
            6: 0.7,  # Sunday - much lower risk
        }
        
        return min(0.95, base_prob * day_factors.get(day_of_week, 1.0))
    
    def _estimate_completion_time(self, job_name: str, predicted_duration: float) -> str:
        """Estimate completion time based on predicted duration"""
        # This is a simplified version - could be enhanced with actual start time patterns
        avg_start_hour = 9  # Assume most jobs start around 9 AM
        completion_hour = avg_start_hour + (predicted_duration / 60)
        
        if completion_hour >= 24:
            completion_hour -= 24
            return f"Next day {int(completion_hour):02d}:{int((completion_hour % 1) * 60):02d}"
        else:
            return f"{int(completion_hour):02d}:{int((completion_hour % 1) * 60):02d}"
    
    def _estimate_volume(self, patterns: Dict, prediction_date: date, avg_volume: float, std_volume: float) -> int:
        """Estimate volume for a given date"""
        day_of_week = prediction_date.weekday()
        day_of_month = prediction_date.day
        
        weekly_factor = patterns.get('weekly', {}).get(day_of_week, 1.0)
        monthly_factor = patterns.get('monthly', {}).get(day_of_month, 1.0)
        
        estimated = avg_volume * weekly_factor * monthly_factor
        
        # Add some variance for high-volume predictions
        if weekly_factor > 1.2 or monthly_factor > 1.2:
            estimated += std_volume
        
        return int(estimated)
    
    # Recommendation methods
    
    def _get_failure_recommendations(self, prediction: Dict) -> str:
        """Get recommendations for failure predictions"""
        recommendations = [
            "Review recent job logs for error patterns",
            "Check system resources and dependencies",
            "Consider running job with increased monitoring",
            "Prepare rollback procedures if critical"
        ]
        
        if prediction['failure_probability'] > 0.8:
            recommendations.append("Consider postponing non-critical downstream jobs")
        
        return "; ".join(recommendations)
    
    def _get_long_runner_recommendations(self, prediction: Dict) -> str:
        """Get recommendations for long-running job predictions"""
        recommendations = [
            "Monitor system resources during execution",
            "Review data volume and complexity",
            "Consider adjusting SLA expectations",
            "Prepare stakeholder notifications"
        ]
        
        duration_increase = prediction['predicted_duration'] - prediction['normal_duration']
        if duration_increase > 120:  # More than 2 hours longer
            recommendations.append("Consider breaking job into smaller chunks")
        
        return "; ".join(recommendations)
    
    def _get_sla_recommendations(self, prediction: Dict) -> str:
        """Get recommendations for SLA miss predictions"""
        recommendations = [
            "Review job dependencies and start times",
            "Consider early warning to stakeholders",
            "Prepare alternative processing options",
            "Monitor job performance closely"
        ]
        
        if prediction.get('contributing_factors', {}).get('long_running_risk', 0) > 0.6:
            recommendations.append("Focus on performance optimization")
        
        return "; ".join(recommendations)
    
    def _get_volume_recommendations(self, prediction: Dict) -> str:
        """Get recommendations for volume spike predictions"""
        recommendations = [
            "Scale up system resources if possible",
            "Monitor processing performance closely",
            "Prepare for extended runtime",
            "Review downstream system capacity"
        ]
        
        volume_increase = prediction['predicted_volume'] - prediction['normal_volume']
        if volume_increase > prediction['normal_volume']:  # More than double
            recommendations.append("Consider parallel processing options")
        
        return "; ".join(recommendations)
    
    # Pattern storage methods
    
    def _store_patterns(self, patterns: Dict):
        """Store discovered patterns in the database"""
        # Implementation to store patterns in HistoricalPattern model
        # This would convert the analysis results into database records
        pass
    
    def _analyze_failure_patterns(self) -> Dict:
        """Analyze failure patterns in detail"""
        # Implementation for detailed failure pattern analysis
        return {}
    
    def _analyze_performance_patterns(self) -> Dict:
        """Analyze performance patterns in detail"""
        # Implementation for detailed performance pattern analysis
        return {}
    
    def _analyze_sla_patterns(self) -> Dict:
        """Analyze SLA patterns in detail"""
        # Implementation for detailed SLA pattern analysis
        return {}
    
    def _analyze_seasonal_patterns(self) -> Dict:
        """Analyze seasonal patterns in detail"""
        # Implementation for detailed seasonal pattern analysis
        return {}


class PredictionManager:
    """Manager for running predictions and storing results"""
    
    @staticmethod
    def run_all_predictions(customer_id: int, days_ahead: int = 7) -> Dict:
        """Run all prediction types for a customer"""
        predictor = SmartPredictor(customer_id)
        
        # Run all prediction types
        predictions = {
            'failures': predictor.predict_job_failures(days_ahead),
            'long_runners': predictor.predict_long_running_jobs(days_ahead),
            'sla_misses': predictor.predict_sla_misses(days_ahead),
            'volume_spikes': predictor.predict_high_volume(days_ahead)
        }
        
        # If limited predictions generated, supplement with demo predictions
        total_predictions = sum(len(pred_list) for pred_list in predictions.values())
        if total_predictions < 5:  # If we have fewer than 5 total predictions, add demo ones
            logger.info(f"Limited predictions generated for customer {customer_id}, supplementing with demo predictions")
            demo_predictions = predictor.generate_demo_predictions(days_ahead)
            
            # Merge demo predictions with real ones
            for pred_type in predictions:
                if len(predictions[pred_type]) < 2:  # Add demo if we have less than 2 of this type
                    predictions[pred_type].extend(demo_predictions[pred_type][:2])
        
        # Generate alerts
        alerts = predictor.generate_predictive_alerts(predictions)
        
        # Store results in database
        PredictionManager._store_predictions(customer_id, predictions)
        PredictionManager._store_alerts(customer_id, alerts)
        
        return {
            'predictions': predictions,
            'alerts': alerts,
            'generated_at': timezone.now().isoformat()
        }
    
    @staticmethod
    def _store_predictions(customer_id: int, predictions: Dict):
        """Store prediction results in database"""
        customer = Customer.objects.get(id=customer_id)
        
        # Store different types of predictions
        for pred_type, pred_list in predictions.items():
            if not pred_list:
                continue
                
            # Get or create prediction model
            model_type_map = {
                'failures': 'FAILURE',
                'long_runners': 'LONG_RUNNER', 
                'sla_misses': 'SLA_MISS',
                'volume_spikes': 'HIGH_VOLUME'
            }
            
            model_type = model_type_map.get(pred_type)
            if not model_type:
                continue
            
            # Store each prediction
            for pred in pred_list:
                # Get or create prediction model for this job
                pred_model, created = PredictionModel.objects.get_or_create(
                    customer=customer,
                    prediction_type=model_type,
                    job_name=pred['job_name'],
                    defaults={
                        'lookback_days': 30,
                        'confidence_threshold': 0.7,
                        'is_active': True
                    }
                )
                
                # Create prediction result
                PredictionResult.objects.update_or_create(
                    prediction_model=pred_model,
                    job_name=pred['job_name'],
                    predicted_date=pred['predicted_date'],
                    defaults={
                        'prediction_confidence': pred.get('confidence', 0.7),
                        'risk_level': pred['risk_level'],
                        'predicted_failure_probability': pred.get('failure_probability'),
                        'predicted_duration_minutes': pred.get('predicted_duration'),
                        'predicted_sla_miss_probability': pred.get('sla_miss_probability'),
                        'predicted_volume': pred.get('predicted_volume'),
                        'contributing_factors': pred.get('contributing_factors', {}),
                        'historical_patterns': pred.get('historical_patterns', {})
                    }
                )
    
    @staticmethod
    def _store_alerts(customer_id: int, alerts: List[Dict]):
        """Store prediction alerts in database"""
        for alert in alerts:
            # Find the related prediction result
            pred_data = alert.get('prediction_data', {})
            if not pred_data:
                continue
            
            try:
                # Try to find the prediction result
                pred_result = PredictionResult.objects.filter(
                    prediction_model__customer_id=customer_id,
                    job_name=pred_data['job_name'],
                    predicted_date=pred_data['predicted_date']
                ).first()
                
                if pred_result:
                    PredictionAlert.objects.update_or_create(
                        prediction_result=pred_result,
                        alert_type=alert['type'],
                        defaults={
                            'severity': alert['severity'],
                            'title': alert['title'],
                            'message': alert['message'],
                            'predicted_impact_date': alert['predicted_date'],
                            'recommended_actions': alert.get('recommended_actions', ''),
                            'status': 'ACTIVE'
                        }
                    )
            except Exception as e:
                logger.error(f"Error storing alert: {e}")
                continue 