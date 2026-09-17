import {
  createClient,
} from "@/lib/supabase/server";

export interface ProjectOverviewData {
  renovationPending: number;
  architecturePending: number;

  householdTotal: number;
  householdPending: number;

  galleryUploads: number;
  documentsTotal: number;
}

interface RenovationRow {
  status: string;
}

interface ArchitectureRow {
  status: string;
}

interface HouseholdRow {
  desired_quantity: number;
  received_quantity: number;
}

export async function getProjectOverview(): Promise<
  ProjectOverviewData | null
> {
  const supabase =
    await createClient();

  const {
    data: apartment,
    error: apartmentError,
  } = await supabase
    .from("apartments")
    .select("id")
    .order(
      "created_at",
      {
        ascending: true,
      },
    )
    .limit(1)
    .maybeSingle();

  if (apartmentError) {
    throw new Error(
      `Não foi possível carregar o apartamento: ${apartmentError.message}`,
    );
  }

  if (!apartment) {
    return null;
  }

  const [
    renovationResponse,
    architectureResponse,
    householdResponse,
    galleryResponse,
    documentsResponse,
  ] = await Promise.all([
    supabase
      .from(
        "renovation_items",
      )
      .select("status")
      .eq(
        "apartment_id",
        apartment.id,
      ),

    supabase
      .from(
        "architecture_items",
      )
      .select("status")
      .eq(
        "apartment_id",
        apartment.id,
      ),

    supabase
      .from(
        "household_items",
      )
      .select(
        `
          desired_quantity,
          received_quantity
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      ),

    supabase
      .from(
        "apartment_media",
      )
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "apartment_id",
        apartment.id,
      ),

    supabase
      .from(
        "apartment_documents",
      )
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "apartment_id",
        apartment.id,
      ),
  ]);

  if (
    renovationResponse.error
  ) {
    throw new Error(
      renovationResponse
        .error
        .message,
    );
  }

  if (
    architectureResponse.error
  ) {
    throw new Error(
      architectureResponse
        .error
        .message,
    );
  }

  if (
    householdResponse.error
  ) {
    throw new Error(
      householdResponse
        .error
        .message,
    );
  }

  if (
    galleryResponse.error
  ) {
    throw new Error(
      galleryResponse
        .error
        .message,
    );
  }

  if (
    documentsResponse.error
  ) {
    throw new Error(
      documentsResponse
        .error
        .message,
    );
  }

  const renovationRows =
    (
      renovationResponse.data ??
      []
    ) as RenovationRow[];

  const architectureRows =
    (
      architectureResponse.data ??
      []
    ) as ArchitectureRow[];

  const householdRows =
    (
      householdResponse.data ??
      []
    ) as HouseholdRow[];

  const renovationPending =
    renovationRows.filter(
      (item) =>
        item.status !==
          "completed" &&
        item.status !==
          "cancelled",
    ).length;

  const architecturePending =
    architectureRows.filter(
      (item) =>
        item.status !==
          "approved" &&
        item.status !==
          "completed" &&
        item.status !==
          "cancelled",
    ).length;

  const householdPending =
    householdRows.filter(
      (item) =>
        Number(
          item.received_quantity ??
            0,
        ) <
        Number(
          item.desired_quantity ??
            0,
        ),
    ).length;

  return {
    renovationPending,

    architecturePending,

    householdTotal:
      householdRows.length,

    householdPending,

    galleryUploads:
      galleryResponse.count ??
      0,

    documentsTotal:
      documentsResponse.count ??
      0,
  };
}