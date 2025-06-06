import { Request, Response } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../middleware/auth';
import { format, addDays, isAfter, isBefore, startOfDay, differenceInDays } from 'date-fns';

// Get dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;
    // Organization ID is guaranteed in AuthRequest

    // Get DPRequests and Grievances
    const requests = await storage.listDPRequests(orgId);
    const grievances = await storage.listGrievances(orgId);

    // Calculate counts
    const stats = {
      totalRequests: requests.length,
      totalGrievances: grievances.length,
      pendingRequests: requests.filter(r => ['Submitted', 'InProgress', 'AwaitingInfo'].includes(storage.getStatusNameById(r.statusId))).length,
      pendingGrievances: grievances.filter(g => ['Submitted', 'InProgress', 'AwaitingInfo'].includes(g.status_name?.toLowerCase())).length,
      escalatedRequests: requests.filter(r => storage.getStatusNameById(r.statusId) === 'Escalated').length,
      escalatedGrievances: grievances.filter(g => g.status_name?.toLowerCase() === 'escalated').length
    };

    // Fetch all request statuses for accurate mapping 
    const statuses = await storage.listRequestStatuses() || [];
    
    // Get status IDs for more reliable filtering
    const submittedStatusId = statuses.find(s => s.statusName.toLowerCase() === 'submitted')?.statusId;
    const inProgressStatusId = statuses.find(s => s.statusName.toLowerCase() === 'inprogress')?.statusId;
    const awaitingInfoStatusId = statuses.find(s => s.statusName.toLowerCase() === 'awaitinginfo')?.statusId;
    const escalatedStatusId = statuses.find(s => s.statusName.toLowerCase() === 'escalated')?.statusId;
    const closedStatusId = statuses.find(s => s.statusName.toLowerCase() === 'closed')?.statusId;
    
    // Helper function to ensure consistent statusId type for comparison
    const normalizeStatusId = (id: any): number => {
      if (typeof id === 'string') {
        return parseInt(id);
      }
      if (typeof id === 'number') {
        return id;
      }
      return -1; // Invalid status ID
    };
    
    // Debug status IDs
    console.log('Status IDs for grievances dashboard:', {
      submitted: submittedStatusId,
      inProgress: inProgressStatusId,
      awaitingInfo: awaitingInfoStatusId,
      escalated: escalatedStatusId,
      closed: closedStatusId
    });
    
    // Log a sample of grievances to debug status comparison
    if (grievances.length > 0) {
      console.log('Sample grievance:', grievances[0]);
      console.log('Sample grievance statusId (raw):', grievances[0].statusId);
      console.log('Sample grievance statusId (normalized):', normalizeStatusId(grievances[0].statusId));
    }
    
    // Get actual counts for each status so we can expose them directly in the response
    const submittedCount = submittedStatusId ? 
      grievances.filter(g => 
        normalizeStatusId(g.statusId) === normalizeStatusId(submittedStatusId) || 
        (g.status_name && g.status_name.toLowerCase() === 'submitted')
      ).length : 0;
      
    const inProgressCount = inProgressStatusId ? 
      grievances.filter(g => 
        normalizeStatusId(g.statusId) === normalizeStatusId(inProgressStatusId) || 
        (g.status_name && g.status_name.toLowerCase() === 'inprogress')
      ).length : 0;
      
    const awaitingCount = awaitingInfoStatusId ? 
      grievances.filter(g => 
        normalizeStatusId(g.statusId) === normalizeStatusId(awaitingInfoStatusId) || 
        (g.status_name && g.status_name.toLowerCase() === 'awaitinginfo')
      ).length : 0;
      
    const escalatedCount = escalatedStatusId ? 
      grievances.filter(g => 
        normalizeStatusId(g.statusId) === normalizeStatusId(escalatedStatusId) || 
        (g.status_name && g.status_name.toLowerCase() === 'escalated')
      ).length : 0;
      
    const closedCount = closedStatusId ? 
      grievances.filter(g => 
        normalizeStatusId(g.statusId) === normalizeStatusId(closedStatusId) || 
        (g.status_name && g.status_name.toLowerCase() === 'closed')
      ).length : 0;
    
    // Log the counts for debugging
    console.log('Grievance status counts:', {
      total: grievances.length,
      submitted: submittedCount,
      inProgress: inProgressCount,
      awaiting: awaitingCount,
      escalated: escalatedCount,
      closed: closedCount
    });
    
    // Detailed grievance status counts for GrievancesPage using normalized status ID comparison
    // We must handle both cases - when statusId is stored directly or when status_name is used
    const grievanceStatusCounts = {
      total: { count: grievances.length, change: +5 },
      submitted: { count: submittedCount, change: 0 },
      inProgress: { count: inProgressCount, change: 0 },
      awaiting: { count: awaitingCount, change: 0 },
      escalated: { count: escalatedCount, change: 0 },
      closed: { count: closedCount, change: 0 }
    };

    // Include both the standard dashboard stats AND the direct grievance status counts
    // to ensure all frontends can access the data they need
    return res.json({
      totalRequests: {
        count: stats.totalRequests,
        change: +10, // Placeholder for growth calculation
        label: 'Data Requests'
      },
      grievances: {
        count: stats.totalGrievances,
        change: +5, // Placeholder for growth calculation
        label: 'Grievances',
        // Detailed status counts
        ...grievanceStatusCounts,
        // Direct counts for easier access in the GrievancesPage
        statusCounts: {
          total: grievances.length,
          submitted: submittedCount,
          inProgress: inProgressCount,
          awaiting: awaitingCount,
          escalated: escalatedCount,
          closed: closedCount
        }
      },
      pending: {
        count: stats.pendingRequests + stats.pendingGrievances,
        change: -2, // Placeholder for growth calculation
        label: 'Pending'
      },
      escalated: {
        count: stats.escalatedRequests + stats.escalatedGrievances,
        change: +2, // Placeholder for growth calculation
        label: 'Escalated'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Get weekly activity data
export const getWeeklyActivity = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;

    // Get DPRequests and Grievances
    const requests = await storage.listDPRequests(orgId);
    const grievances = await storage.listGrievances(orgId);

    // Get last 7 days
    const today = new Date();
    const labels = [];
    const requestCounts = [];
    const grievanceCounts = [];

    for (let i = 6; i >= 0; i--) {
      const date = addDays(today, -i);
      const dateStr = format(date, 'MMM dd');
      labels.push(dateStr);

      // Count requests created on this date
      const requestsOnDay = requests.filter(request => {
        const createdDate = new Date(request.createdAt);
        return format(createdDate, 'MMM dd') === dateStr;
      }).length;

      // Count grievances created on this date
      const grievancesOnDay = grievances.filter(grievance => {
        const createdDate = new Date(grievance.created_at);
        return format(createdDate, 'MMM dd') === dateStr;
      }).length;

      requestCounts.push(requestsOnDay);
      grievanceCounts.push(grievancesOnDay);
    }

    return res.json({
      labels,
      datasets: [
        {
          name: 'Data Requests',
          data: requestCounts
        },
        {
          name: 'Grievances',
          data: grievanceCounts
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    return res.status(500).json({ message: 'Failed to fetch weekly activity data' });
  }
};

// Get status distribution
export const getStatusDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;

    // Get DPRequests
    const requests = await storage.listDPRequests(orgId);
    
    // Get status counts
    const statusCounts = requests.reduce((counts: Record<string, number>, request) => {
      const statusName = storage.getStatusNameById(request.statusId);
      counts[statusName] = (counts[statusName] || 0) + 1;
      return counts;
    }, {});

    // Format for pie chart
    const data = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    return res.status(500).json({ message: 'Failed to fetch status distribution data' });
  }
};

// Get escalated requests
export const getEscalatedRequests = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;

    // Get DPRequests and Grievances
    const requests = await storage.listDPRequests(orgId);
    const grievances = await storage.listGrievances(orgId);

    // Filter for escalated requests
    const escalatedRequests = requests
      .filter(r => storage.getStatusNameById(r.statusId) === 'Escalated')
      .map(r => ({
        id: `REQ-${r.requestId}`,
        type: 'Data Request',
        subject: `${r.firstName} ${r.lastName}`,
        requestType: r.requestType,
        createdAt: format(new Date(r.createdAt), 'MMM dd, yyyy'),
        assignedTo: r.assignedToUserId ? 'Assigned' : 'Unassigned'
      }));

    // Filter for escalated grievances
    const escalatedGrievances = grievances
      .filter(g => g.status_name === 'Escalated')
      .map(g => ({
        id: `GRV-${g.grievance_id}`,
        type: 'Grievance',
        subject: g.subject || 'No Subject',
        requestType: g.grievance_type || 'General',
        createdAt: format(new Date(g.created_at), 'MMM dd, yyyy'),
        assignedTo: g.assigned_to_name || 'Unassigned'
      }));

    // Combine and sort by created date (newest first)
    const combined = [...escalatedRequests, ...escalatedGrievances]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json(combined);
  } catch (error) {
    console.error('Error fetching escalated requests:', error);
    return res.status(500).json({ message: 'Failed to fetch escalated requests data' });
  }
};

// Get upcoming due requests
export const getUpcomingDueRequests = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.organizationId;

    // Get DPRequests and Grievances
    const requests = await storage.listDPRequests(orgId);
    const grievances = await storage.listGrievances(orgId);

    const today = startOfDay(new Date());
    const in7Days = addDays(today, 7);

    // Filter for upcoming due requests (due in the next 7 days)
    const upcomingRequests = requests
      .filter(r => {
        if (!r.completionDate) return false;
        const dueDate = startOfDay(new Date(r.completionDate));
        return isAfter(dueDate, today) && isBefore(dueDate, in7Days);
      })
      .map(r => {
        const dueDate = new Date(r.completionDate!);
        return {
          id: `REQ-${r.requestId}`,
          type: 'Data Request',
          subject: `${r.firstName} ${r.lastName}`,
          requestType: r.requestType,
          status: storage.getStatusNameById(r.statusId),
          dueDate: format(dueDate, 'MMM dd, yyyy'),
          daysRemaining: differenceInDays(dueDate, today)
        };
      });

    // Filter for upcoming due grievances (due in the next 7 days)
    const upcomingGrievances = grievances
      .filter(g => {
        if (!g.completion_date) return false;
        const dueDate = startOfDay(new Date(g.completion_date));
        return isAfter(dueDate, today) && isBefore(dueDate, in7Days);
      })
      .map(g => {
        const dueDate = new Date(g.completion_date!);
        return {
          id: `GRV-${g.grievance_id}`,
          type: 'Grievance',
          subject: g.subject || 'No Subject',
          requestType: g.grievance_type || 'General',
          status: g.status_name,
          dueDate: format(dueDate, 'MMM dd, yyyy'),
          daysRemaining: differenceInDays(dueDate, today)
        };
      });

    // Combine and sort by days remaining (most urgent first)
    const combined = [...upcomingRequests, ...upcomingGrievances]
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return res.json(combined);
  } catch (error) {
    console.error('Error fetching upcoming due requests:', error);
    return res.status(500).json({ message: 'Failed to fetch upcoming due requests data' });
  }
};