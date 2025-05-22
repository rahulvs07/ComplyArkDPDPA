import { db } from '../server/db';
import {
  industries,
  organizations,
  users,
  templates,
  notices,
  translatedNotices,
  requestStatuses,
  dpRequests,
  dpRequestHistory
} from '../shared/schema';
import crypto from 'crypto';

async function insertSampleData() {
  console.log('Starting sample data insertion...');
  
  try {
    // Clear existing data
    await db.delete(dpRequestHistory);
    await db.delete(dpRequests);
    await db.delete(translatedNotices);
    await db.delete(notices);
    await db.delete(templates);
    await db.delete(users);
    await db.delete(organizations);
    await db.delete(requestStatuses);
    await db.delete(industries);
    
    console.log('Existing data cleared');
    
    // Seed industries - at least 10
    const industryData = [
      { industryName: 'Healthcare' },
      { industryName: 'E-commerce' },
      { industryName: 'Finance' },
      { industryName: 'Education' },
      { industryName: 'Technology' },
      { industryName: 'Manufacturing' },
      { industryName: 'Retail' },
      { industryName: 'Hospitality' },
      { industryName: 'Entertainment' },
      { industryName: 'Transportation' },
      { industryName: 'Energy' },
      { industryName: 'Real Estate' }
    ];
    
    const industryResults = await db.insert(industries).values(industryData).returning();
    console.log(`${industryResults.length} industries added`);
    
    // Create a map for easy reference
    const industryMap = industryResults.reduce((acc, industry) => {
      acc[industry.industryName] = industry;
      return acc;
    }, {} as Record<string, typeof industryResults[0]>);
    
    // Seed request statuses
    const statusData = [
      { statusName: 'Submitted', slaDays: 7 },
      { statusName: 'Pending Verification', slaDays: 3 },
      { statusName: 'In Progress', slaDays: 5 },
      { statusName: 'Under Review', slaDays: 2 },
      { statusName: 'Awaiting Information', slaDays: 4 },
      { statusName: 'Completed', slaDays: 0 },
      { statusName: 'Closed', slaDays: 0 },
      { statusName: 'Rejected', slaDays: 0 },
      { statusName: 'Overdue', slaDays: 0 },
      { statusName: 'On Hold', slaDays: 1 }
    ];
    
    const statusResults = await db.insert(requestStatuses).values(statusData).returning();
    console.log(`${statusResults.length} request statuses added`);
    
    // Create a map for easy reference
    const statusMap = statusResults.reduce((acc, status) => {
      acc[status.statusName] = status;
      return acc;
    }, {} as Record<string, typeof statusResults[0]>);
    
    // Seed organizations - at least 10
    const organizationData = Array(12).fill(0).map((_, index) => {
      const industryName = industryData[index % industryData.length].industryName;
      const industry = industryMap[industryName];
      
      return {
        businessName: index === 0
          ? 'ComplyArk Admin'
          : `${industryName} Organization ${index}`,
        businessAddress: `${100 + index} Business St., Suite ${index * 10}, Business City`,
        industryId: industry.industryId,
        contactPersonName: `Contact Person ${index}`,
        contactEmail: `contact${index}@${industryName.toLowerCase().replace(/\s+/g, '')}.com`,
        contactPhone: `555-${100 + index}-${1000 + index}`,
        noOfUsers: 1 + index % 5,
        remarks: index === 0 ? 'System admin organization' : `Organization in ${industryName} industry`,
        requestPageUrlToken: crypto.randomBytes(16).toString('hex')
      };
    });
    
    const organizationResults = await db.insert(organizations).values(organizationData).returning();
    console.log(`${organizationResults.length} organizations added`);
    
    // Create a map for easy reference
    const orgMap = organizationResults.reduce((acc, org, index) => {
      acc[index] = org;
      return acc;
    }, {} as Record<number, typeof organizationResults[0]>);
    
    // Seed users - at least 10 per organization
    const userData = [];
    
    // Admin user
    userData.push({
      username: 'complyarkadmin',
      password: 'complyarkadmin', // In a real app, this would be hashed
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@complyark.com',
      phone: '123-456-7890',
      role: 'admin',
      organizationId: orgMap[0].id,
      isActive: true,
      canEdit: true,
      canDelete: true
    });
    
    // Create users for each organization
    for (let orgIndex = 0; orgIndex < organizationResults.length; orgIndex++) {
      const org = organizationResults[orgIndex];
      
      // Create an admin user for each organization
      if (orgIndex > 0) { // Skip for admin org since we already added it
        userData.push({
          username: `${org.businessName.toLowerCase().replace(/\s+/g, '_')}_admin`,
          password: 'password',
          firstName: `Admin${orgIndex}`,
          lastName: `User`,
          email: `admin@${org.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `555-${200 + orgIndex}-${2000 + orgIndex}`,
          role: 'admin',
          organizationId: org.id,
          isActive: true,
          canEdit: true,
          canDelete: true
        });
      }
      
      // Create regular users for each organization
      for (let userIndex = 1; userIndex <= 3; userIndex++) {
        userData.push({
          username: `${org.businessName.toLowerCase().replace(/\s+/g, '_')}_user${userIndex}`,
          password: 'password',
          firstName: `User${userIndex}`,
          lastName: `Org${orgIndex}`,
          email: `user${userIndex}@${org.businessName.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `555-${300 + orgIndex}-${3000 + userIndex}`,
          role: 'user',
          organizationId: org.id,
          isActive: true,
          canEdit: userIndex === 1, // First user can edit
          canDelete: false
        });
      }
    }
    
    const userResults = await db.insert(users).values(userData).returning();
    console.log(`${userResults.length} users added`);
    
    // Create a map for users by organization
    const usersByOrg = userResults.reduce((acc, user) => {
      if (!acc[user.organizationId]) {
        acc[user.organizationId] = [];
      }
      acc[user.organizationId].push(user);
      return acc;
    }, {} as Record<number, typeof userResults>);
    
    // Seed templates - at least 10
    const templateData = [];
    
    // For each industry, create at least one template
    for (const industry of industryResults) {
      const templateBody = `<h1>${industry.industryName} Privacy Notice Template</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal data in accordance with the Personal Data Protection Act.</p>
<h2>Data Collection</h2>
<p>We collect the following types of personal data:</p>
<ul>
  <li>Personal identifiers</li>
  <li>Contact information</li>
  <li>Professional information</li>
  ${industry.industryName === 'Healthcare' ? '<li>Medical history and records</li>' : ''}
  ${industry.industryName === 'Finance' ? '<li>Financial transaction history</li>' : ''}
  ${industry.industryName === 'Education' ? '<li>Educational records</li>' : ''}
</ul>
<h2>Data Processing Purposes</h2>
<p>Your data is processed for the following purposes:</p>
<ul>
  <li>Providing our services</li>
  <li>Communication</li>
  <li>Legal compliance</li>
  ${industry.industryName === 'Healthcare' ? '<li>Medical treatment</li>' : ''}
  ${industry.industryName === 'Finance' ? '<li>Financial services</li>' : ''}
  ${industry.industryName === 'Education' ? '<li>Educational purposes</li>' : ''}
</ul>
<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal data</li>
  <li>Request correction of inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Withdraw consent</li>
</ul>
<p>To exercise these rights, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`;
      
      templateData.push({
        templateName: `${industry.industryName} Privacy Notice Template`,
        templateBody,
        industryId: industry.industryId,
        templatePath: null
      });
      
      // Add a second template for the main industries
      if (['Healthcare', 'Finance', 'Education', 'Technology', 'Retail'].includes(industry.industryName)) {
        templateData.push({
          templateName: `${industry.industryName} Terms of Service Template`,
          templateBody: `<h1>${industry.industryName} Terms of Service</h1>
<p>These terms of service ("Terms") govern your use of [ORGANIZATION_NAME]'s services.</p>
<h2>Acceptance of Terms</h2>
<p>By using our services, you agree to these Terms.</p>
<h2>Service Usage</h2>
<p>You agree to use our services only for lawful purposes and in accordance with these Terms.</p>
<h2>Intellectual Property</h2>
<p>Our content is protected by intellectual property laws.</p>
<h2>Limitation of Liability</h2>
<p>[ORGANIZATION_NAME] is not liable for any indirect, incidental, special, consequential, or punitive damages.</p>
<h2>Governing Law</h2>
<p>These Terms are governed by the laws of [JURISDICTION].</p>`,
          industryId: industry.industryId,
          templatePath: null
        });
      }
    }
    
    const templateResults = await db.insert(templates).values(templateData).returning();
    console.log(`${templateResults.length} templates added`);
    
    // Create a map for templates by industry
    const templatesByIndustry = templateResults.reduce((acc, template) => {
      if (!acc[template.industryId]) {
        acc[template.industryId] = [];
      }
      acc[template.industryId].push(template);
      return acc;
    }, {} as Record<number, typeof templateResults>);
    
    // Seed notices - at least 10
    const noticeData = [];
    
    // Create notices for each organization (except admin)
    for (let i = 1; i < organizationResults.length; i++) {
      const org = organizationResults[i];
      const orgUsers = usersByOrg[org.id] || [];
      const orgAdmin = orgUsers.find(u => u.role === 'admin') || orgUsers[0];
      
      // Find templates for this organization's industry
      const industryTemplates = templatesByIndustry[org.industryId] || [];
      if (industryTemplates.length === 0) continue;
      
      // Create a privacy notice for each organization
      const privacyTemplate = industryTemplates.find(t => t.templateName.includes('Privacy')) || industryTemplates[0];
      
      noticeData.push({
        organizationId: org.id,
        noticeName: `${org.businessName} Privacy Notice`,
        noticeBody: privacyTemplate.templateBody
          .replace('[ORGANIZATION_NAME]', org.businessName)
          .replace('[CONTACT_EMAIL]', org.contactEmail)
          .replace('[JURISDICTION]', 'Thailand'),
        createdBy: orgAdmin.id,
        noticeType: 'Privacy Policy',
        version: '1.0',
        folderLocation: '/policies/privacy'
      });
      
      // If there's a terms template, create a terms notice too
      const termsTemplate = industryTemplates.find(t => t.templateName.includes('Terms'));
      if (termsTemplate) {
        noticeData.push({
          organizationId: org.id,
          noticeName: `${org.businessName} Terms of Service`,
          noticeBody: termsTemplate.templateBody
            .replace('[ORGANIZATION_NAME]', org.businessName)
            .replace('[CONTACT_EMAIL]', org.contactEmail)
            .replace('[JURISDICTION]', 'Thailand'),
          createdBy: orgAdmin.id,
          noticeType: 'Terms of Service',
          version: '1.0',
          folderLocation: '/legal/terms'
        });
      }
    }
    
    const noticeResults = await db.insert(notices).values(noticeData).returning();
    console.log(`${noticeResults.length} notices added`);
    
    // Seed translated notices - at least 10
    const translatedNoticeData = [];
    const languages = ['Thai', 'Chinese', 'Japanese', 'Korean', 'Vietnamese'];
    
    // Create translations for at least 10 notices
    const noticesToTranslate = noticeResults.slice(0, Math.min(10, noticeResults.length));
    
    for (const notice of noticesToTranslate) {
      // Pick 1-3 random languages for each notice
      const numLanguages = 1 + Math.floor(Math.random() * 3);
      const selectedLanguages = [...languages].sort(() => 0.5 - Math.random()).slice(0, numLanguages);
      
      for (const language of selectedLanguages) {
        translatedNoticeData.push({
          noticeId: notice.noticeId,
          language,
          translatedBody: `<h1>[Translated to ${language}] ${notice.noticeName}</h1>
<p>This is a translated version of the notice. In a real application, this would be properly translated content.</p>
<p>Original notice type: ${notice.noticeType}</p>
<p>Original notice version: ${notice.version}</p>`,
          filePath: null
        });
      }
    }
    
    const translatedResults = await db.insert(translatedNotices).values(translatedNoticeData).returning();
    console.log(`${translatedResults.length} translated notices added`);
    
    // Seed DP requests - at least 10 with various statuses
    const dpRequestData = [];
    const requestTypes = ['Access', 'Correction', 'Erasure', 'Nomination'];
    
    // Skip admin organization (index 0)
    for (let i = 1; i < organizationResults.length; i++) {
      const org = organizationResults[i];
      const orgUsers = usersByOrg[org.id] || [];
      if (orgUsers.length === 0) continue;
      
      // Create 1-2 requests per organization
      const numRequests = 1 + Math.floor(Math.random() * 2);
      
      for (let j = 0; j < numRequests; j++) {
        // Get random status and assign a user
        const randomStatusIndex = Math.floor(Math.random() * statusResults.length);
        const status = statusResults[randomStatusIndex];
        const assignedUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
        const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
        
        // If status is completed/closed/rejected, add completion info
        const isCompleted = ['Completed', 'Closed', 'Rejected'].includes(status.statusName);
        const completionDate = isCompleted ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
        
        dpRequestData.push({
          organizationId: org.id,
          firstName: `Requester${i}${j}`,
          lastName: `Person${i}${j}`,
          email: `requester${i}${j}@example.com`,
          phone: `555-${400 + i}-${j}${1000 + i}`,
          requestType,
          requestComment: `This is a ${requestType} request created for testing purposes.`,
          statusId: status.statusId,
          assignedToUserId: assignedUser.id,
          lastUpdatedAt: new Date(),
          completionDate,
          completedOnTime: isCompleted ? Math.random() > 0.3 : null, // 70% completed on time
          closedDateTime: isCompleted ? completionDate : null,
          closureComments: isCompleted ? `Request ${status.statusName.toLowerCase()}.` : null
        });
      }
    }
    
    // Ensure we have at least 10 requests
    while (dpRequestData.length < 10) {
      // Add more to the first few orgs
      const org = organizationResults[1 + (dpRequestData.length % (organizationResults.length - 1))];
      const orgUsers = usersByOrg[org.id] || [];
      if (orgUsers.length === 0) continue;
      
      const randomStatusIndex = Math.floor(Math.random() * statusResults.length);
      const status = statusResults[randomStatusIndex];
      const assignedUser = orgUsers[Math.floor(Math.random() * orgUsers.length)];
      const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      
      const isCompleted = ['Completed', 'Closed', 'Rejected'].includes(status.statusName);
      const completionDate = isCompleted ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
      
      dpRequestData.push({
        organizationId: org.id,
        firstName: `ExtraRequester${dpRequestData.length}`,
        lastName: `Person${dpRequestData.length}`,
        email: `extra_requester${dpRequestData.length}@example.com`,
        phone: `555-999-${1000 + dpRequestData.length}`,
        requestType,
        requestComment: `This is an additional ${requestType} request created for testing purposes.`,
        statusId: status.statusId,
        assignedToUserId: assignedUser.id,
        lastUpdatedAt: new Date(),
        completionDate,
        completedOnTime: isCompleted ? Math.random() > 0.3 : null, // 70% completed on time
        closedDateTime: isCompleted ? completionDate : null,
        closureComments: isCompleted ? `Request ${status.statusName.toLowerCase()}.` : null
      });
    }
    
    const dpRequestResults = await db.insert(dpRequests).values(dpRequestData).returning();
    console.log(`${dpRequestResults.length} data protection requests added`);
    
    // Seed DP request history - create history entries for each request
    const historyData = [];
    
    for (const request of dpRequestResults) {
      // Initial creation entry
      historyData.push({
        requestId: request.requestId,
        changedByUserId: usersByOrg[request.organizationId].find(u => u.role === 'admin')?.id || 
                         usersByOrg[request.organizationId][0].id,
        oldStatusId: null,
        newStatusId: statusMap['Submitted'].statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: request.assignedToUserId,
        comments: 'Request created',
        changeDate: new Date() // Current date
      });
      
      // If not in 'Submitted' status, add status change entries
      if (request.statusId !== statusMap['Submitted'].statusId) {
        historyData.push({
          requestId: request.requestId,
          changedByUserId: request.assignedToUserId,
          oldStatusId: statusMap['Submitted'].statusId,
          newStatusId: request.statusId,
          oldAssignedToUserId: request.assignedToUserId,
          newAssignedToUserId: request.assignedToUserId,
          comments: `Status changed to ${statusResults.find(s => s.statusId === request.statusId)?.statusName}`,
          changeDate: new Date() // Current date
        });
      }
      
      // If completed, add completion entry
      if (request.completionDate) {
        historyData.push({
          requestId: request.requestId,
          changedByUserId: request.assignedToUserId,
          oldStatusId: request.statusId,
          newStatusId: statusMap['Closed'].statusId,
          oldAssignedToUserId: request.assignedToUserId,
          newAssignedToUserId: request.assignedToUserId,
          comments: request.closureComments || 'Request completed',
          changeDate: new Date()
        });
      }
    }
    
    const historyResults = await db.insert(dpRequestHistory).values(historyData).returning();
    console.log(`${historyResults.length} request history entries added`);
    
    console.log('All sample data inserted successfully');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

insertSampleData()
  .then(() => {
    console.log('Sample data insertion complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during sample data insertion:', error);
    process.exit(1);
  });