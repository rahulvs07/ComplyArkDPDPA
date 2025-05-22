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

async function seedDatabase() {
  console.log('Starting database seeding...');
  
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
    
    // Seed industries
    const [healthcare, ecommerce, finance, education, technology] = await db.insert(industries).values([
      { industryName: 'Healthcare' },
      { industryName: 'E-commerce' },
      { industryName: 'Finance' },
      { industryName: 'Education' },
      { industryName: 'Technology' }
    ]).returning();
    
    console.log('Industries added');
    
    // Seed request statuses
    const [submitted, inProgress, completed, closed, overdue] = await db.insert(requestStatuses).values([
      { statusName: 'Submitted', slaDays: 7 },
      { statusName: 'In Progress', slaDays: 5 },
      { statusName: 'Completed', slaDays: 0 },
      { statusName: 'Closed', slaDays: 0 },
      { statusName: 'Overdue', slaDays: 0 }
    ]).returning();
    
    console.log('Request statuses added');
    
    // Seed organizations
    const token1 = crypto.randomBytes(16).toString('hex');
    const token2 = crypto.randomBytes(16).toString('hex');
    const token3 = crypto.randomBytes(16).toString('hex');
    
    const [adminOrg, hospitalOrg, bankOrg] = await db.insert(organizations).values([
      {
        businessName: 'ComplyArk Admin',
        businessAddress: 'Admin Building, 123 Admin Street, Admin City',
        industryId: technology.industryId,
        contactPersonName: 'Admin User',
        contactEmail: 'admin@complyark.com',
        contactPhone: '123-456-7890',
        noOfUsers: 1,
        remarks: 'System admin organization',
        requestPageUrlToken: token1
      },
      {
        businessName: 'City Hospital',
        businessAddress: '456 Health Avenue, Medical District, HC 54321',
        industryId: healthcare.industryId,
        contactPersonName: 'Dr. Sarah Johnson',
        contactEmail: 'sarah@cityhospital.com',
        contactPhone: '987-654-3210',
        noOfUsers: 5,
        remarks: 'Regional healthcare provider',
        requestPageUrlToken: token2
      },
      {
        businessName: 'Global Bank',
        businessAddress: '789 Finance Street, Money District, FB 67890',
        industryId: finance.industryId,
        contactPersonName: 'James Wilson',
        contactEmail: 'james@globalbank.com',
        contactPhone: '555-123-4567',
        noOfUsers: 10,
        remarks: 'International financial institution',
        requestPageUrlToken: token3
      }
    ]).returning();
    
    console.log('Organizations added');
    
    // Seed users
    const [adminUser, hospitalAdmin, hospitalUser, bankAdmin, bankUser] = await db.insert(users).values([
      {
        username: 'complyarkadmin',
        password: 'complyarkadmin', // In a real app, this would be hashed
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@complyark.com',
        phone: '123-456-7890',
        role: 'admin',
        organizationId: adminOrg.id,
        isActive: true,
        canEdit: true,
        canDelete: true
      },
      {
        username: 'hospital_admin',
        password: 'password',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@cityhospital.com',
        phone: '987-654-3210',
        role: 'admin',
        organizationId: hospitalOrg.id,
        isActive: true,
        canEdit: true,
        canDelete: true
      },
      {
        username: 'hospital_user',
        password: 'password',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael@cityhospital.com',
        phone: '987-654-3211',
        role: 'user',
        organizationId: hospitalOrg.id,
        isActive: true,
        canEdit: false,
        canDelete: false
      },
      {
        username: 'bank_admin',
        password: 'password',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james@globalbank.com',
        phone: '555-123-4567',
        role: 'admin',
        organizationId: bankOrg.id,
        isActive: true,
        canEdit: true,
        canDelete: true
      },
      {
        username: 'bank_user',
        password: 'password',
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma@globalbank.com',
        phone: '555-123-4568',
        role: 'user',
        organizationId: bankOrg.id,
        isActive: true,
        canEdit: false,
        canDelete: false
      }
    ]).returning();
    
    console.log('Users added');
    
    // Seed templates
    const [healthTemplate, financeTemplate] = await db.insert(templates).values([
      {
        templateName: 'Healthcare Privacy Notice Template',
        templateBody: `<h1>Healthcare Privacy Notice</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal data in accordance with the Personal Data Protection Act.</p>
<h2>Data Collection</h2>
<p>We collect the following types of personal data:</p>
<ul>
  <li>Medical history and records</li>
  <li>Contact information</li>
  <li>Insurance details</li>
  <li>Next of kin information</li>
</ul>
<h2>Data Processing Purposes</h2>
<p>Your data is processed for the following purposes:</p>
<ul>
  <li>Providing healthcare services</li>
  <li>Maintaining medical records</li>
  <li>Insurance claims processing</li>
  <li>Quality improvement</li>
</ul>
<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal data</li>
  <li>Request correction of inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Withdraw consent</li>
</ul>
<p>To exercise these rights, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: healthcare.industryId,
        templatePath: null
      },
      {
        templateName: 'Financial Services Privacy Notice Template',
        templateBody: `<h1>Financial Services Privacy Notice</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal data in accordance with the Personal Data Protection Act.</p>
<h2>Data Collection</h2>
<p>We collect the following types of personal data:</p>
<ul>
  <li>Financial information</li>
  <li>Contact details</li>
  <li>Identification documents</li>
  <li>Transaction history</li>
</ul>
<h2>Data Processing Purposes</h2>
<p>Your data is processed for the following purposes:</p>
<ul>
  <li>Account management</li>
  <li>Transaction processing</li>
  <li>Credit assessment</li>
  <li>Fraud prevention</li>
  <li>Regulatory compliance</li>
</ul>
<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal data</li>
  <li>Request correction of inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Withdraw consent</li>
</ul>
<p>To exercise these rights, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: finance.industryId,
        templatePath: null
      }
    ]).returning();
    
    console.log('Templates added');
    
    // Seed notices
    const [hospitalNotice, bankNotice] = await db.insert(notices).values([
      {
        organizationId: hospitalOrg.id,
        noticeName: 'City Hospital Privacy Notice',
        noticeBody: healthTemplate.templateBody
          .replace('[ORGANIZATION_NAME]', 'City Hospital')
          .replace('[CONTACT_EMAIL]', 'dpo@cityhospital.com'),
        createdBy: hospitalAdmin.id,
        noticeType: 'Privacy Policy',
        version: '1.0',
        folderLocation: '/policies/privacy'
      },
      {
        organizationId: bankOrg.id,
        noticeName: 'Global Bank Privacy Notice',
        noticeBody: financeTemplate.templateBody
          .replace('[ORGANIZATION_NAME]', 'Global Bank')
          .replace('[CONTACT_EMAIL]', 'privacy@globalbank.com'),
        createdBy: bankAdmin.id,
        noticeType: 'Privacy Policy',
        version: '1.0',
        folderLocation: '/legal/privacy'
      }
    ]).returning();
    
    console.log('Notices added');
    
    // Seed translated notices
    await db.insert(translatedNotices).values([
      {
        noticeId: hospitalNotice.noticeId,
        language: 'Thai',
        translatedBody: `<h1>นโยบายความเป็นส่วนตัวของโรงพยาบาลซิตี้</h1>
<p>นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่โรงพยาบาลซิตี้เก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล</p>
<h2>การเก็บรวบรวมข้อมูล</h2>
<p>เราเก็บรวบรวมข้อมูลส่วนบุคคลประเภทต่อไปนี้:</p>
<ul>
  <li>ประวัติและบันทึกทางการแพทย์</li>
  <li>ข้อมูลติดต่อ</li>
  <li>รายละเอียดการประกัน</li>
  <li>ข้อมูลญาติใกล้ชิด</li>
</ul>
<h2>วัตถุประสงค์ในการประมวลผลข้อมูล</h2>
<p>ข้อมูลของคุณถูกประมวลผลเพื่อวัตถุประสงค์ต่อไปนี้:</p>
<ul>
  <li>การให้บริการด้านสุขภาพ</li>
  <li>การเก็บรักษาบันทึกทางการแพทย์</li>
  <li>การประมวลผลการเรียกร้องประกัน</li>
  <li>การปรับปรุงคุณภาพ</li>
</ul>
<h2>สิทธิของคุณ</h2>
<p>คุณมีสิทธิที่จะ:</p>
<ul>
  <li>เข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
  <li>ขอการแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
  <li>ขอลบข้อมูลของคุณ</li>
  <li>ถอนความยินยอม</li>
</ul>
<p>เพื่อใช้สิทธิเหล่านี้ โปรดติดต่อเจ้าหน้าที่คุ้มครองข้อมูลของเราที่ dpo@cityhospital.com</p>`,
        filePath: null
      },
      {
        noticeId: bankNotice.noticeId,
        language: 'Thai',
        translatedBody: `<h1>นโยบายความเป็นส่วนตัวของธนาคารโกลบอล</h1>
<p>นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่ธนาคารโกลบอลเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล</p>
<h2>การเก็บรวบรวมข้อมูล</h2>
<p>เราเก็บรวบรวมข้อมูลส่วนบุคคลประเภทต่อไปนี้:</p>
<ul>
  <li>ข้อมูลทางการเงิน</li>
  <li>รายละเอียดการติดต่อ</li>
  <li>เอกสารยืนยันตัวตน</li>
  <li>ประวัติการทำธุรกรรม</li>
</ul>
<h2>วัตถุประสงค์ในการประมวลผลข้อมูล</h2>
<p>ข้อมูลของคุณถูกประมวลผลเพื่อวัตถุประสงค์ต่อไปนี้:</p>
<ul>
  <li>การจัดการบัญชี</li>
  <li>การประมวลผลธุรกรรม</li>
  <li>การประเมินสินเชื่อ</li>
  <li>การป้องกันการฉ้อโกง</li>
  <li>การปฏิบัติตามกฎระเบียบ</li>
</ul>
<h2>สิทธิของคุณ</h2>
<p>คุณมีสิทธิที่จะ:</p>
<ul>
  <li>เข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
  <li>ขอการแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
  <li>ขอลบข้อมูลของคุณ</li>
  <li>ถอนความยินยอม</li>
</ul>
<p>เพื่อใช้สิทธิเหล่านี้ โปรดติดต่อเจ้าหน้าที่คุ้มครองข้อมูลของเราที่ privacy@globalbank.com</p>`,
        filePath: null
      }
    ]);
    
    console.log('Translated notices added');
    
    // Seed DP requests
    const [hospitalRequest1, hospitalRequest2, bankRequest1, bankRequest2] = await db.insert(dpRequests).values([
      {
        organizationId: hospitalOrg.id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '123-456-7891',
        requestType: 'Access',
        requestComment: 'I would like to access all my medical records from the past 5 years.',
        statusId: submitted.statusId,
        assignedToUserId: hospitalAdmin.id,
        lastUpdatedAt: new Date(),
        completionDate: null,
        completedOnTime: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: hospitalOrg.id,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@example.com',
        phone: '123-456-7892',
        requestType: 'Correction',
        requestComment: 'My date of birth is incorrect in your records. It should be 1980-05-15.',
        statusId: inProgress.statusId,
        assignedToUserId: hospitalUser.id,
        lastUpdatedAt: new Date(),
        completionDate: null,
        completedOnTime: null,
        closedDateTime: null,
        closureComments: null
      },
      {
        organizationId: bankOrg.id,
        firstName: 'Robert',
        lastName: 'Williams',
        email: 'robert.williams@example.com',
        phone: '123-456-7893',
        requestType: 'Erasure',
        requestComment: 'I would like to delete all my account information as I am no longer a customer.',
        statusId: completed.statusId,
        assignedToUserId: bankAdmin.id,
        lastUpdatedAt: new Date(),
        completionDate: new Date(),
        completedOnTime: true,
        closedDateTime: new Date(),
        closureComments: 'All account information has been deleted as requested.'
      },
      {
        organizationId: bankOrg.id,
        firstName: 'Jennifer',
        lastName: 'Brown',
        email: 'jennifer.brown@example.com',
        phone: '123-456-7894',
        requestType: 'Access',
        requestComment: 'I would like to access all my transaction history for the past year.',
        statusId: overdue.statusId,
        assignedToUserId: bankUser.id,
        lastUpdatedAt: new Date(),
        completionDate: null,
        completedOnTime: false,
        closedDateTime: null,
        closureComments: null
      }
    ]).returning();
    
    console.log('DP requests added');
    
    // Seed DP request history
    await db.insert(dpRequestHistory).values([
      {
        requestId: hospitalRequest1.requestId,
        changedByUserId: hospitalAdmin.id,
        oldStatusId: null,
        newStatusId: submitted.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: hospitalAdmin.id,
        comments: 'Request created and assigned to Sarah Johnson'
      },
      {
        requestId: hospitalRequest2.requestId,
        changedByUserId: hospitalAdmin.id,
        oldStatusId: null,
        newStatusId: submitted.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: null,
        comments: 'Request created'
      },
      {
        requestId: hospitalRequest2.requestId,
        changedByUserId: hospitalAdmin.id,
        oldStatusId: submitted.statusId,
        newStatusId: inProgress.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: hospitalUser.id,
        comments: 'Request assigned to Michael Brown and status changed to In Progress'
      },
      {
        requestId: bankRequest1.requestId,
        changedByUserId: bankAdmin.id,
        oldStatusId: null,
        newStatusId: submitted.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: bankAdmin.id,
        comments: 'Request created and assigned to James Wilson'
      },
      {
        requestId: bankRequest1.requestId,
        changedByUserId: bankAdmin.id,
        oldStatusId: submitted.statusId,
        newStatusId: inProgress.statusId,
        oldAssignedToUserId: bankAdmin.id,
        newAssignedToUserId: bankAdmin.id,
        comments: 'Request processing started'
      },
      {
        requestId: bankRequest1.requestId,
        changedByUserId: bankAdmin.id,
        oldStatusId: inProgress.statusId,
        newStatusId: completed.statusId,
        oldAssignedToUserId: bankAdmin.id,
        newAssignedToUserId: bankAdmin.id,
        comments: 'Request completed. All data has been deleted as requested.'
      },
      {
        requestId: bankRequest2.requestId,
        changedByUserId: bankAdmin.id,
        oldStatusId: null,
        newStatusId: submitted.statusId,
        oldAssignedToUserId: null,
        newAssignedToUserId: bankUser.id,
        comments: 'Request created and assigned to Emma Davis'
      },
      {
        requestId: bankRequest2.requestId,
        changedByUserId: bankAdmin.id,
        oldStatusId: submitted.statusId,
        newStatusId: overdue.statusId,
        oldAssignedToUserId: bankUser.id,
        newAssignedToUserId: bankUser.id,
        comments: 'Request marked as overdue'
      }
    ]);
    
    console.log('DP request history added');
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();