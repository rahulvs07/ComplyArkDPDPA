import { db } from "../server/db";
import { complianceDocuments } from "../shared/schema";

async function insertComplianceDocumentsData() {
  try {
    console.log("Starting to insert sample compliance documents...");
    
    // First, get organizations and users to reference 
    const organizations = await db.query.organizations.findMany();
    const users = await db.query.users.findMany();
    
    if (organizations.length === 0) {
      console.log("No organizations found in the database. Please run the seed-database script first.");
      return;
    }
    
    if (users.length === 0) {
      console.log("No users found in the database. Please run the seed-database script first.");
      return;
    }
    
    // Delete existing compliance documents to avoid duplicates
    console.log("Clearing existing compliance documents data...");
    await db.delete(complianceDocuments);
    
    // Sample compliance documents
    const sampleDocuments = [
      {
        organizationId: organizations[0].id,
        documentName: "DPDPA Compliance Policy",
        documentType: "Policy",
        documentPath: "/documents/org1/compliance-policy.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[0].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 60)),
        folderPath: "/documents/org1/"
      },
      {
        organizationId: organizations[0].id,
        documentName: "Data Subject Access Request Procedure",
        documentType: "Procedure",
        documentPath: "/documents/org1/dsar-procedure.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[0].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 55)),
        folderPath: "/documents/org1/"
      },
      {
        organizationId: organizations[0].id,
        documentName: "Data Breach Response Plan",
        documentType: "Procedure",
        documentPath: "/documents/org1/breach-response.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[0].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 45)),
        folderPath: "/documents/org1/"
      },
      {
        organizationId: organizations[1].id,
        documentName: "DPDPA Compliance Checklist",
        documentType: "Form",
        documentPath: "/documents/org2/compliance-checklist.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[1].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 30)),
        folderPath: "/documents/org2/"
      },
      {
        organizationId: organizations[1].id,
        documentName: "Data Protection Impact Assessment Template",
        documentType: "Form",
        documentPath: "/documents/org2/dpia-template.docx",
        uploadedBy: users.find(u => u.organizationId === organizations[1].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 25)),
        folderPath: "/documents/org2/"
      },
      {
        organizationId: organizations[2].id,
        documentName: "Third-Party Data Processing Agreement",
        documentType: "Policy",
        documentPath: "/documents/org3/third-party-dpa.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[2].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 20)),
        folderPath: "/documents/org3/"
      },
      {
        organizationId: organizations[2].id,
        documentName: "Data Retention Policy",
        documentType: "Policy",
        documentPath: "/documents/org3/retention-policy.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[2].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 15)),
        folderPath: "/documents/org3/"
      },
      {
        organizationId: organizations[3].id,
        documentName: "Employee Data Protection Training",
        documentType: "Training",
        documentPath: "/documents/org4/employee-training.pptx",
        uploadedBy: users.find(u => u.organizationId === organizations[3].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 10)),
        folderPath: "/documents/org4/"
      },
      {
        organizationId: organizations[3].id,
        documentName: "Privacy Notice Template",
        documentType: "Template",
        documentPath: "/documents/org4/privacy-notice-template.docx",
        uploadedBy: users.find(u => u.organizationId === organizations[3].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        folderPath: "/documents/org4/"
      },
      {
        organizationId: organizations[0].id,
        documentName: "Annual Compliance Report 2023",
        documentType: "Report",
        documentPath: "/documents/org1/compliance-report-2023.pdf",
        uploadedBy: users.find(u => u.organizationId === organizations[0].id)?.id || users[0].id,
        uploadedAt: new Date(new Date().setDate(new Date().getDate() - 90)),
        folderPath: "/documents/org1/"
      }
    ];
    
    // Insert compliance documents
    console.log("Inserting compliance documents data...");
    for (const documentData of sampleDocuments) {
      try {
        await db.insert(complianceDocuments).values(documentData);
      } catch (error) {
        console.error(`Error inserting document ${documentData.documentName}:`, error);
      }
    }
    
    console.log("Sample compliance documents inserted successfully!");
  } catch (error) {
    console.error("Error inserting sample compliance documents:", error);
  } finally {
    process.exit(0);
  }
}

insertComplianceDocumentsData();