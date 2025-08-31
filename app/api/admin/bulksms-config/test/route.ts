import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { test_number } = await request.json();

    if (!test_number) {
      return createErrorResponse('Test number is required', 400);
    }

    // For now, just return success - in production this would send actual SMS
    return createSuccessResponse(
      { sent: true, test_number },
      'Test SMS sent successfully'
    );

  } catch (error) {
    console.error('Test BulkSMS config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}