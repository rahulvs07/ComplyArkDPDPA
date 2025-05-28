// New DPR update function based on working grievance pattern
export const updateDPRequest = async (req: AuthRequest, res: Response) => {
  const requestId = parseInt(req.params.id);
  
  console.log('=== DPR UPDATE REBUILT START ===');
  console.log('Request ID:', requestId);
  console.log('Request body:', req.body);
  
  if (isNaN(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  if (!req.user) {
    return res.status(403).json({ message: "Authentication required" });
  }
  
  try {
    const request = await storage.getDPRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Check if user has access to this request
    if (req.user.organizationId !== request.organizationId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: "You don't have access to this request" });
    }
    
    const { statusId, assignedToUserId, comments } = req.body;
    
    console.log('Processing update - Status:', statusId, 'Current:', request.statusId, 'Comments:', comments);
    
    // Prepare update data - using grievance pattern
    const updateData: any = {};
    
    // Handle status change
    if (statusId !== undefined) {
      updateData.statusId = parseInt(statusId);
      updateData.lastUpdatedAt = new Date();
    }
    
    // Handle assignment change (only for admin users)
    if (assignedToUserId !== undefined && req.user.role !== 'user') {
      updateData.assignedToUserId = assignedToUserId ? parseInt(assignedToUserId) : null;
    }
    
    // Check if there are actual changes or comments
    const hasStatusChange = statusId !== undefined && parseInt(statusId) !== request.statusId;
    const hasAssignmentChange = assignedToUserId !== undefined && req.user.role !== 'user' && 
      (assignedToUserId ? parseInt(assignedToUserId) : null) !== request.assignedToUserId;
    const hasComments = comments && comments.trim() !== '';
    
    if (!hasStatusChange && !hasAssignmentChange && !hasComments) {
      return res.status(400).json({ message: "No changes to make" });
    }
    
    console.log('About to update DPR with validated data:', updateData);
    
    // Update the request
    const updatedRequest = await storage.updateDPRequest(requestId, updateData);
    
    if (!updatedRequest) {
      return res.status(404).json({ message: "Failed to update request" });
    }
    
    console.log('DPR updated successfully:', updatedRequest);
    
    // Create history entry - following grievance pattern
    const historyData = {
      requestId: requestId,
      changedByUserId: req.user.id,
      oldStatusId: request.statusId,
      newStatusId: statusId ? parseInt(statusId) : request.statusId,
      oldAssignedToUserId: request.assignedToUserId,
      newAssignedToUserId: assignedToUserId ? parseInt(assignedToUserId) : request.assignedToUserId,
      comments: comments || null,
      changeDate: new Date()
    };
    
    console.log('Creating DPR history:', historyData);
    
    try {
      await storage.createDPRequestHistory(historyData);
      console.log('History created successfully');
    } catch (historyError) {
      console.error('Error creating history:', historyError);
      // Don't fail the request if history creation fails
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating DPR request:', error);
    res.status(500).json({ message: "Failed to update request" });
  }
};