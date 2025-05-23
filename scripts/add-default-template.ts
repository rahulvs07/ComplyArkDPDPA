import { db } from "../server/db";
import { templates, industries } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to add a default simple privacy notice template
 * Run with: npx tsx scripts/add-default-template.ts
 */
async function addDefaultTemplate() {
  try {
    console.log("Adding default privacy notice template...");
    
    // First, get a valid industry ID
    const allIndustries = await db.select().from(industries);
    
    if (allIndustries.length === 0) {
      console.error("No industries found in the database. Please run add-templates.ts first.");
      process.exit(1);
    }
    
    // Get the first industry ID
    const industryId = allIndustries[0].industryId;
    console.log(`Using industry ID: ${industryId}`);
    
    // Create the simple template
    const simpleTemplate = {
      templateName: "Simple Privacy Notice",
      templateBody: `Dear User,

This Privacy Notice explains how we collect, use, and protect your personal information. Please read this notice carefully.

1. INFORMATION WE COLLECT

Selected Personal Data Fields:


2. HOW WE USE YOUR INFORMATION

We use your personal information for the following purposes:
- To provide and maintain our services
- To notify you about changes to our services
- To provide customer support
- To gather analysis or valuable information so that we can improve our services
- To detect, prevent and address technical issues

3. YOUR RIGHTS

You have the right to:
- Access your personal data
- Correct inaccurate personal data
- Delete your personal data
- Restrict or object to the processing of your personal data
- Data portability

For any questions or concerns, please contact our Data Protection Officer.`,
      industryId: industryId
    };
    
    // Check if this template already exists
    const existingTemplates = await db.select().from(templates)
      .where(eq(templates.templateName, simpleTemplate.templateName));
    
    if (existingTemplates.length > 0) {
      console.log("Simple template already exists. Template ID:", existingTemplates[0].templateId);
      process.exit(0);
    }
    
    // Add the template
    const [result] = await db.insert(templates).values(simpleTemplate).returning();
    
    console.log("Default template added with ID:", result.templateId);
    console.log("You can now use this template as the default for notice creation.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error adding default template:", error);
    process.exit(1);
  }
}

addDefaultTemplate();