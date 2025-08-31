import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { test_email } = await request.json();

    if (!test_email) {
      return createErrorResponse('Test email is required', 400);
    }

    // For now, just return success - in production this would send actual email
    return createSuccessResponse(
      { sent: true, test_email },
      'Test email sent successfully'
    );

  } catch (error) {
    console.error('Test email config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}