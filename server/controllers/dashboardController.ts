import { Request, Response } from "express";
import { storage } from "../storage";

// Get dashboard stats
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const { organizationId } = req.user || {};
    
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    // Get DP requests statistics
    const requests = await storage.listRequests(organizationId);
    const grievances = await storage.listGrievances(organizationId);
    
    // Calculate trends (for a real app, these would be calculated from historical data)
    // For now we'll use fixed percentages for demonstration
    const totalRequestsCount = requests.length;
    const grievancesCount = grievances.length;
    
    // Count requests by status
    const pendingRequests = requests.filter(req => 
      ["Submitted", "InProgress", "AwaitingInfo"].includes(
        req.statusId ? storage.getStatusNameById(req.statusId) : ""
      )
    );
    
    const escalatedRequests = requests.filter(req => 
      storage.getStatusNameById(req.statusId) === "Escalated"
    );
    
    const pendingGrievances = grievances.filter(g => 
      ["Submitted", "InProgress", "AwaitingInfo"].includes(
        g.statusId ? storage.getStatusNameById(g.statusId) : ""
      )
    );
    
    const escalatedGrievances = grievances.filter(g => 
      storage.getStatusNameById(g.statusId) === "Escalated"
    );
    
    // Calculate total counts
    const pendingCount = pendingRequests.length + pendingGrievances.length;
    const escalatedCount = escalatedRequests.length + escalatedGrievances.length;
    
    const stats = {
      totalRequests: {
        count: totalRequestsCount,
        trend: "+0.1% from last month",
        trendUp: true
      },
      grievances: {
        count: grievancesCount,
        trend: "+0.5% from last month", 
        trendUp: true
      },
      pending: {
        count: pendingCount,
        trend: "+15% from last month",
        trendUp: false // A growing backlog is considered negative
      },
      escalated: {
        count: escalatedCount,
        trend: "+7% from last month",
        trendUp: false // Growing escalations is considered negative
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
}

// Get weekly activity data
export async function getWeeklyActivity(req: Request, res: Response) {
  try {
    const { organizationId } = req.user || {};
    
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    // Get all requests and grievances
    const requests = await storage.listRequests(organizationId);
    const grievances = await storage.listGrievances(organizationId);
    
    // Group by day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = dayNames.map(day => ({ 
      name: day, 
      'Data Requests': 0, 
      'Grievances': 0 
    }));
    
    // Count requests by day of week (for last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    requests.forEach(request => {
      const createdAt = new Date(request.createdAt);
      if (createdAt >= oneWeekAgo) {
        const dayIndex = createdAt.getDay();
        weeklyData[dayIndex]['Data Requests']++;
      }
    });
    
    grievances.forEach(grievance => {
      const createdAt = new Date(grievance.createdAt);
      if (createdAt >= oneWeekAgo) {
        const dayIndex = createdAt.getDay();
        weeklyData[dayIndex]['Grievances']++;
      }
    });
    
    // Reorder to start from Monday
    const reorderedData = [
      weeklyData[1], // Mon
      weeklyData[2], // Tue
      weeklyData[3], // Wed
      weeklyData[4], // Thu
      weeklyData[5], // Fri
      weeklyData[6], // Sat
      weeklyData[0]  // Sun
    ];
    
    res.json(reorderedData);
  } catch (error) {
    console.error("Error fetching weekly activity:", error);
    res.status(500).json({ message: "Failed to fetch weekly activity data" });
  }
}

// Get status distribution data
export async function getStatusDistribution(req: Request, res: Response) {
  try {
    const { organizationId } = req.user || {};
    
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    // Get all requests and grievances
    const requests = await storage.listRequests(organizationId);
    const grievances = await storage.listGrievances(organizationId);
    
    // Combine all requests for overall status distribution
    const allItems = [...requests, ...grievances];
    
    // Count status frequencies
    const statusCounts: Record<string, number> = {};
    let total = 0;
    
    allItems.forEach(item => {
      const statusName = storage.getStatusNameById(item.statusId);
      statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
      total++;
    });
    
    // Format as array with percentages
    const distribution = Object.entries(statusCounts).map(([name, value]) => {
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      return {
        name,
        value,
        percentage: `${percentage}%`
      };
    });
    
    // Sort by most common statuses first
    distribution.sort((a, b) => b.value - a.value);
    
    res.json(distribution);
  } catch (error) {
    console.error("Error fetching status distribution:", error);
    res.status(500).json({ message: "Failed to fetch status distribution data" });
  }
}

// Get escalated requests
export async function getEscalatedRequests(req: Request, res: Response) {
  try {
    const { organizationId } = req.user || {};
    
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    // Get the escalated status ID
    const statuses = await storage.listRequestStatuses();
    const escalatedStatusId = statuses.find(s => s.statusName === "Escalated")?.statusId;
    
    if (!escalatedStatusId) {
      return res.status(404).json({ message: "Escalated status not found" });
    }
    
    // Get all escalated requests and grievances
    const requests = await storage.listRequests(organizationId);
    const grievances = await storage.listGrievances(organizationId);
    
    const escalatedRequests = requests
      .filter(r => r.statusId === escalatedStatusId)
      .map(r => ({
        id: r.requestId,
        type: 'dpr',
        requesterName: `${r.firstName} ${r.lastName}`,
        requestType: r.requestType,
        createdAt: new Date(r.createdAt).toLocaleDateString(),
        dueDate: r.completionDate ? new Date(r.completionDate).toLocaleDateString() : 'N/A',
        status: "Escalated"
      }));
    
    const escalatedGrievances = grievances
      .filter(g => g.statusId === escalatedStatusId)
      .map(g => ({
        id: g.grievanceId,
        type: 'grievance',
        requesterName: `${g.firstName} ${g.lastName}`,
        requestType: "Grievance",
        createdAt: new Date(g.createdAt).toLocaleDateString(),
        dueDate: g.completionDate ? new Date(g.completionDate).toLocaleDateString() : 'N/A',
        status: "Escalated"
      }));
    
    // Combine and sort by due date (most urgent first)
    const combined = [...escalatedRequests, ...escalatedGrievances]
      .sort((a, b) => {
        // Handle 'N/A' cases
        if (a.dueDate === 'N/A' && b.dueDate === 'N/A') return 0;
        if (a.dueDate === 'N/A') return 1; // Put items without due dates at the end
        if (b.dueDate === 'N/A') return -1;
        
        // Sort by date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    
    res.json(combined);
  } catch (error) {
    console.error("Error fetching escalated requests:", error);
    res.status(500).json({ message: "Failed to fetch escalated requests" });
  }
}

// Get upcoming due requests
export async function getUpcomingDueRequests(req: Request, res: Response) {
  try {
    const { organizationId } = req.user || {};
    
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    
    // Get requests that are not closed and have a completion date
    const requests = await storage.listRequests(organizationId);
    const grievances = await storage.listGrievances(organizationId);
    
    const statuses = await storage.listRequestStatuses();
    const closedStatusId = statuses.find(s => s.statusName === "Closed")?.statusId;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const upcomingRequests = requests
      .filter(r => r.statusId !== closedStatusId && r.completionDate)
      .map(r => {
        const dueDate = new Date(r.completionDate!);
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: r.requestId,
          type: 'dpr',
          requesterName: `${r.firstName} ${r.lastName}`,
          requestType: r.requestType,
          dueDate: dueDate.toLocaleDateString(),
          daysRemaining: daysRemaining
        };
      })
      .filter(r => r.daysRemaining > 0 && r.daysRemaining <= 7); // Only include items due within the next 7 days
    
    const upcomingGrievances = grievances
      .filter(g => g.statusId !== closedStatusId && g.completionDate)
      .map(g => {
        const dueDate = new Date(g.completionDate!);
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: g.grievanceId,
          type: 'grievance',
          requesterName: `${g.firstName} ${g.lastName}`,
          requestType: "Grievance",
          dueDate: dueDate.toLocaleDateString(),
          daysRemaining: daysRemaining
        };
      })
      .filter(g => g.daysRemaining > 0 && g.daysRemaining <= 7); // Only include items due within the next 7 days
    
    // Combine and sort by days remaining (most urgent first)
    const combined = [...upcomingRequests, ...upcomingGrievances]
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    res.json(combined);
  } catch (error) {
    console.error("Error fetching upcoming due requests:", error);
    res.status(500).json({ message: "Failed to fetch upcoming due requests" });
  }
}