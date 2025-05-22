import { Request, Response } from 'express';
import { db } from '../db';
import { organizations } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { encodeOrganizationId } from '../utils/tokenGenerator';

/**
 * Generates a request page URL token for an organization
 */
export async function generateRequestPageUrl(req: Request, res: Response) {
  try {
    // Only super admin should be able to generate URLs
    if (!req.session?.isSuperAdmin) {
      return res.status(403).json({ message: 'Unauthorized. Only super admin can generate request page URLs.' });
    }

    const { organizationId } = req.params;
    const orgId = parseInt(organizationId);

    if (isNaN(orgId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }

    // Check if organization exists
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Generate a token that encodes the organization ID
    const urlToken = encodeOrganizationId(orgId);

    // Save the token to the organization record
    await db
      .update(organizations)
      .set({ requestPageUrlToken: urlToken })
      .where(eq(organizations.id, orgId));

    // Return the full URL that would be used to access the request page
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const requestPageUrl = `${baseUrl}/request-page/${urlToken}`;

    return res.status(200).json({
      message: 'Request page URL generated successfully',
      requestPageUrl,
      token: urlToken,
    });
  } catch (error) {
    console.error('Error generating request page URL:', error);
    return res.status(500).json({ message: 'Failed to generate request page URL' });
  }
}

/**
 * Gets the current request page URL for an organization
 */
export async function getRequestPageUrl(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;
    const orgId = parseInt(organizationId);

    if (isNaN(orgId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }

    // Check if organization exists and get the token
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (!organization.requestPageUrlToken) {
      return res.status(404).json({ 
        message: 'No request page URL has been generated for this organization',
        hasToken: false
      });
    }

    // Return the full URL that would be used to access the request page
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const requestPageUrl = `${baseUrl}/request-page/${organization.requestPageUrlToken}`;

    return res.status(200).json({
      message: 'Request page URL retrieved successfully',
      requestPageUrl,
      token: organization.requestPageUrlToken,
      hasToken: true
    });
  } catch (error) {
    console.error('Error retrieving request page URL:', error);
    return res.status(500).json({ message: 'Failed to retrieve request page URL' });
  }
}