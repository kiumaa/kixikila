import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      message: 'KIXIKILA API is running on Lovable integrated backend'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        error: 'Health check failed' 
      },
      { status: 500 }
    );
  }
}