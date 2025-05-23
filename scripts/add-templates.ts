import { db } from "../server/db";
import { templates, industries } from "../shared/schema";

/**
 * Script to add sample notice templates
 * Run with: npx tsx scripts/add-templates.ts
 */
async function addTemplates() {
  try {
    console.log("Adding sample notice templates...");
    
    // First, check if we have any industries
    const existingIndustries = await db.select().from(industries);
    
    if (existingIndustries.length === 0) {
      console.log("No industries found, adding some default industries first");
      
      // Add some default industries
      await db.insert(industries).values([
        { industryName: 'Healthcare' },
        { industryName: 'Finance' },
        { industryName: 'Education' },
        { industryName: 'Technology' },
        { industryName: 'Retail' },
        { industryName: 'Hospitality' }
      ]);
      
      console.log("Default industries added");
    }
    
    // Get all industries for reference
    const allIndustries = await db.select().from(industries);
    console.log(`Found ${allIndustries.length} industries`);
    
    // Create a map of industry names to IDs
    const industryMap = allIndustries.reduce((acc, industry) => {
      acc[industry.industryName] = industry.industryId;
      return acc;
    }, {} as Record<string, number>);
    
    // Add sample templates
    const templateData = [
      {
        templateName: 'Healthcare Privacy Notice',
        templateBody: `<h1>Healthcare Privacy Notice Template</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal health information in accordance with applicable privacy laws.</p>

<h2>Information We Collect</h2>
<ul>
  <li>Personal identifiers (name, date of birth, ID numbers)</li>
  <li>Contact information (address, phone number, email)</li>
  <li>Medical history and health records</li>
  <li>Treatment information and clinical notes</li>
  <li>Insurance and billing details</li>
  <li>Family medical history when relevant to care</li>
</ul>

<h2>How We Use Your Information</h2>
<ul>
  <li>Provide medical treatment and services</li>
  <li>Manage your healthcare</li>
  <li>Process insurance claims and billing</li>
  <li>Communicate with you about your health</li>
  <li>Improve our services and quality of care</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal health information</li>
  <li>Request corrections to inaccurate data</li>
  <li>Obtain a copy of your medical records</li>
  <li>Request restrictions on certain uses</li>
  <li>File a complaint if you believe your privacy rights have been violated</li>
</ul>

<h2>Contact Us</h2>
<p>If you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: industryMap['Healthcare'] || allIndustries[0].industryId,
      },
      {
        templateName: 'Finance Privacy Notice',
        templateBody: `<h1>Financial Services Privacy Notice Template</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal financial information in accordance with applicable data protection laws.</p>

<h2>Information We Collect</h2>
<ul>
  <li>Personal identifiers (name, date of birth, ID numbers)</li>
  <li>Contact information (address, phone number, email)</li>
  <li>Financial information (account details, transaction history)</li>
  <li>Income and employment information</li>
  <li>Credit history and scores</li>
  <li>Authentication information</li>
</ul>

<h2>How We Use Your Information</h2>
<ul>
  <li>Process financial transactions</li>
  <li>Manage your accounts</li>
  <li>Assess creditworthiness</li>
  <li>Prevent fraud and financial crimes</li>
  <li>Provide customer service</li>
  <li>Comply with legal and regulatory requirements</li>
</ul>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal financial information</li>
  <li>Request corrections to inaccurate data</li>
  <li>Obtain information about data sharing practices</li>
  <li>Opt out of certain marketing communications</li>
  <li>File a complaint if you believe your privacy rights have been violated</li>
</ul>

<h2>Contact Us</h2>
<p>If you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: industryMap['Finance'] || allIndustries[0].industryId,
      },
      {
        templateName: 'E-commerce Privacy Notice',
        templateBody: `<h1>E-commerce Privacy Notice Template</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal information when you use our online store and services.</p>

<h2>Information We Collect</h2>
<ul>
  <li>Personal identifiers (name, username)</li>
  <li>Contact information (email, phone number, shipping address)</li>
  <li>Payment information (card details, billing address)</li>
  <li>Purchase history and preferences</li>
  <li>Browsing behavior and device information</li>
  <li>Reviews and feedback you provide</li>
</ul>

<h2>How We Use Your Information</h2>
<ul>
  <li>Process and fulfill your orders</li>
  <li>Manage your customer account</li>
  <li>Personalize your shopping experience</li>
  <li>Provide customer support</li>
  <li>Improve our products and services</li>
  <li>Send relevant marketing communications (with consent)</li>
</ul>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal information</li>
  <li>Request corrections to inaccurate data</li>
  <li>Delete your account and associated data</li>
  <li>Withdraw marketing consent</li>
  <li>Export your data in a portable format</li>
  <li>File a complaint if you believe your privacy rights have been violated</li>
</ul>

<h2>Contact Us</h2>
<p>If you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: industryMap['Retail'] || allIndustries[0].industryId,
      },
      {
        templateName: 'Education Privacy Notice',
        templateBody: `<h1>Educational Institution Privacy Notice Template</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects personal information of students, parents, and staff in accordance with applicable education and privacy laws.</p>

<h2>Information We Collect</h2>
<ul>
  <li>Personal identifiers (name, date of birth, student ID)</li>
  <li>Contact information (address, phone number, email)</li>
  <li>Academic records and performance data</li>
  <li>Attendance and behavioral information</li>
  <li>Health information relevant to education</li>
  <li>Family and demographic details</li>
</ul>

<h2>How We Use Your Information</h2>
<ul>
  <li>Provide educational services and instruction</li>
  <li>Track academic progress and performance</li>
  <li>Communicate with students and parents</li>
  <li>Administer school operations</li>
  <li>Support student health and safety</li>
  <li>Comply with education regulations</li>
</ul>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access educational records</li>
  <li>Request corrections to inaccurate data</li>
  <li>Control certain disclosures of information</li>
  <li>Obtain copies of policies regarding student data</li>
  <li>File a complaint if you believe your privacy rights have been violated</li>
</ul>

<h2>Contact Us</h2>
<p>If you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: industryMap['Education'] || allIndustries[0].industryId,
      },
      {
        templateName: 'Technology Privacy Notice',
        templateBody: `<h1>Technology Services Privacy Notice Template</h1>
<p>This privacy notice describes how [ORGANIZATION_NAME] collects, uses, and protects your personal information when you use our technology products and services.</p>

<h2>Information We Collect</h2>
<ul>
  <li>Account information (name, email, username)</li>
  <li>Device and connection details</li>
  <li>Usage data and interaction logs</li>
  <li>Content you create or upload</li>
  <li>Preferences and settings</li>
  <li>Customer service communications</li>
</ul>

<h2>How We Use Your Information</h2>
<ul>
  <li>Provide and maintain our services</li>
  <li>Authenticate and secure your account</li>
  <li>Personalize user experience</li>
  <li>Analyze service performance and usage patterns</li>
  <li>Develop new features and improvements</li>
  <li>Provide technical support</li>
</ul>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
  <li>Access your personal information</li>
  <li>Request corrections to inaccurate data</li>
  <li>Delete your account and associated data</li>
  <li>Export your data in a portable format</li>
  <li>Control privacy settings and permissions</li>
  <li>File a complaint if you believe your privacy rights have been violated</li>
</ul>

<h2>Contact Us</h2>
<p>If you have questions about this privacy notice or our data practices, please contact our Data Protection Officer at [CONTACT_EMAIL].</p>`,
        industryId: industryMap['Technology'] || allIndustries[0].industryId,
      }
    ];
    
    // Add all templates
    const result = await db.insert(templates).values(templateData).returning();
    
    console.log(`Successfully added ${result.length} notice templates`);
    console.log("Sample templates:");
    result.forEach(template => {
      console.log(`- ${template.templateName} (ID: ${template.templateId}) for industry ID: ${template.industryId}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error adding templates:", error);
    process.exit(1);
  }
}

addTemplates();