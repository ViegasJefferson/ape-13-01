import type {
  ConstructionDashboardData,
  ConstructionStage,
  ConstructionStatus,
  ConstructionUpdate,
} from "@/features/obra/types";
import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
  project_name: string | null;
  delivery_date: string | null;
}

interface ConstructionStageRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

interface ConstructionUpdateRow {
  id: string;
  reference_month: string;
  overall_progress: number | string;
  status: string;
  source_name: string | null;
  notes: string | null;
  updated_at: string;
}

interface ConstructionStageProgressRow {
  stage_id: string;
  progress: number | string;
  notes: string | null;
}

function isConstructionStatus(
  value: string,
): value is ConstructionStatus {
  return [
    "not_started",
    "in_progress",
    "paused",
    "completed",
  ].includes(value);
}

function mapUpdate(
  row: ConstructionUpdateRow,
): ConstructionUpdate {
  if (!isConstructionStatus(row.status)) {
    throw new Error(
      `Status de obra inválido: ${row.status}.`,
    );
  }

  return {
    id: row.id,
    referenceMonth: row.reference_month,
    overallProgress: Number(row.overall_progress),
    status: row.status,
    sourceName: row.source_name,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export async function getConstructionDashboardData(): Promise<
  ConstructionDashboardData | null
> {
  const supabase = await createClient();

  const {
    data: apartment,
    error: apartmentError,
  } = await supabase
    .from("apartments")
    .select(
      `
        id,
        name,
        project_name,
        delivery_date
      `,
    )
    .order("created_at", {
      ascending: true,
    })
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

  const typedApartment =
    apartment as ApartmentRow;

  const [
    stagesResponse,
    updatesResponse,
  ] = await Promise.all([
    supabase
      .from("construction_stages")
      .select(
        `
          id,
          name,
          slug,
          description,
          sort_order
        `,
      )
      .eq(
        "apartment_id",
        typedApartment.id,
      )
      .eq("active", true)
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("construction_updates")
      .select(
        `
          id,
          reference_month,
          overall_progress,
          status,
          source_name,
          notes,
          updated_at
        `,
      )
      .eq(
        "apartment_id",
        typedApartment.id,
      )
      .order("reference_month", {
        ascending: false,
      }),
  ]);

  if (stagesResponse.error) {
    throw new Error(
      `Não foi possível carregar as etapas: ${stagesResponse.error.message}`,
    );
  }

  if (updatesResponse.error) {
    throw new Error(
      `Não foi possível carregar as atualizações: ${updatesResponse.error.message}`,
    );
  }

  const history = (
    updatesResponse.data ?? []
  ).map((update) =>
    mapUpdate(
      update as ConstructionUpdateRow,
    ),
  );

  const currentUpdate =
    history[0] ?? null;

  let progressRows:
    ConstructionStageProgressRow[] = [];

  if (currentUpdate) {
    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from("construction_stage_progress")
      .select(
        `
          stage_id,
          progress,
          notes
        `,
      )
      .eq(
        "construction_update_id",
        currentUpdate.id,
      );

    if (progressError) {
      throw new Error(
        `Não foi possível carregar o progresso das etapas: ${progressError.message}`,
      );
    }

    progressRows =
      (progress ??
        []) as ConstructionStageProgressRow[];
  }

  const progressByStage = new Map(
    progressRows.map((progress) => [
      progress.stage_id,
      progress,
    ]),
  );

  const stages: ConstructionStage[] = (
    stagesResponse.data ?? []
  ).map((stageData) => {
    const stage =
      stageData as ConstructionStageRow;

    const progress =
      progressByStage.get(stage.id);

    return {
      id: stage.id,
      name: stage.name,
      slug: stage.slug,
      description: stage.description,
      sortOrder: Number(stage.sort_order),
      progress: progress
        ? Number(progress.progress)
        : 0,
      notes: progress?.notes ?? null,
    };
  });

  return {
    apartmentId: typedApartment.id,
    apartmentName: typedApartment.name,
    projectName:
      typedApartment.project_name,
    deliveryDate:
      typedApartment.delivery_date,
    currentUpdate,
    stages,
    history,
  };
}