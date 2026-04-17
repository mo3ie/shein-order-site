import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: "session_id is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://dpay.ly/api/sandbox/payment/sessions/${session_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.DPAY_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}