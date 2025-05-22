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

    // Fetch status mappings
    const statuses = await storage.listRequestStatuses();
    
    // Get status IDs for more reliable filtering
    const submittedStatusId = statuses.find(s => s.statusName.toLowerCase() === 'submitted')?.statusId;
    const inProgressStatusId = statuses.find(s => s.statusName.toLowerCase() === 'inprogress')?.statusId;
    const awaitingInfoStatusId = statuses.find(s => s.statusName.toLowerCase() === 'awaitinginfo')?.statusId;
    const escalatedStatusId = statuses.find(s => s.statusName.toLowerCase() === 'escalated')?.statusId;
    const closedStatusId = statuses.find(s => s.statusName.toLowerCase() === 'closed')?.statusId;
    
    // Detailed grievance status counts for GrievancesPage
    const grievanceStatusCounts = {
      total: { count: grievances.length, change: +5 },
      submitted: { 
        count: submittedStatusId ? grievances.filter(g => g.statusId === submittedStatusId).length : 0, 
        change: 0 
      },
      inProgress: { 
        count: inProgressStatusId ? grievances.filter(g => g.statusId === inProgressStatusId).length : 0, 
        change: 0 
      },
      awaiting: { 
        count: awaitingInfoStatusId ? grievances.filter(g => g.statusId === awaitingInfoStatusId).length : 0, 
        change: 0 
      },
      escalated: { 
        count: escalatedStatusId ? grievances.filter(g => g.statusId === escalatedStatusId).length : 0, 
        change: 0 
      },
      closed: { 
        count: closedStatusId ? grievances.filter(g => g.statusId === closedStatusId).length : 0, 
        change: 0 
      }
    };

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
        ...grievanceStatusCounts
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