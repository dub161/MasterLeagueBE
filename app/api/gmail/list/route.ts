export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  isGmailConfigured,
  listSenderXlsxEmails,
  getGmailConfig,
  humanizeGmailError,
} from "@/lib/gmail";

export async function GET() {
  const { sender } = getGmailConfig();

  if (!isGmailConfigured()) {
    return NextResponse.json({
      success: true,
      configured: false,
      sender,
      emails: [],
    });
  }

  try {
    const emails = await listSenderXlsxEmails(25);
    return NextResponse.json({
      success: true,
      configured: true,
      sender,
      emails,
    });
  } catch (error) {
    console.error("Erreur liste Gmail:", error);
    return NextResponse.json(
      {
        success: false,
        configured: true,
        sender,
        emails: [],
        error: humanizeGmailError(error),
      },
      { status: 500 }
    );
  }
}
