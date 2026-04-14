import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/lib/api/server-axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { forwardCookies } from '@/lib/api/rewrite-cookies';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiResponse = await serverApi.post(API_ENDPOINTS.AUTH.LOGIN, body);

    const response = NextResponse.json(apiResponse.data, {
      status: apiResponse.status,
    });

    forwardCookies(response, apiResponse.headers['set-cookie']);

    return response;
  } catch (error){
    console.error('Error in login route:', error);    
    return NextResponse.json(
      { status: 500, message: 'Error connecting to auth service', data: null },
      { status: 500 },
    );
  }
}
