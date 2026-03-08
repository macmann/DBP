export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ReorderPayload = {
  pageId: string;
  assetIds: string[];
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<ReorderPayload>;
    const pageId = String(payload.pageId ?? "").trim();
    const assetIds = Array.isArray(payload.assetIds) ? payload.assetIds.filter((id): id is string => typeof id === "string") : [];

    if (!pageId || assetIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Invalid reorder payload." }, { status: 400 });
    }

    const existingAssets = await prisma.asset.findMany({
      where: {
        pageId,
        id: {
          in: assetIds
        }
      },
      select: {
        id: true
      }
    });

    if (existingAssets.length !== assetIds.length) {
      return NextResponse.json({ ok: false, error: "Assets do not belong to this page." }, { status: 400 });
    }

    await prisma.$transaction(
      assetIds.map((assetId, index) =>
        prisma.asset.update({
          where: {
            id: assetId
          },
          data: {
            sortOrder: index
          }
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reorder assets", error);
    return NextResponse.json({ ok: false, error: "Could not reorder assets." }, { status: 500 });
  }
}
