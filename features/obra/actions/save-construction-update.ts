"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ConstructionUpdateActionState } from "@/features/obra/actions/construction-update-action-state";
import { createClient } from "@/lib/supabase/server";

const requiredPercentageSchema =
  z.preprocess(
    (value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return Number.NaN;
      }

      return Number(value);
    },
    z
      .number({
        error:
          "Informe um percentual válido.",
      })
      .finite(
        "Informe um percentual válido.",
      )
      .min(
        0,
        "O percentual não pode ser negativo.",
      )
      .max(
        100,
        "O percentual não pode ultrapassar 100%.",
      ),
  );

const constructionUpdateSchema =
  z.object({
    apartmentId: z
      .string()
      .uuid(
        "O apartamento informado é inválido.",
      ),

    referenceMonth: z
      .string()
      .regex(
        /^\d{4}-\d{2}$/,
        "Informe um mês de referência válido.",
      ),

    overallProgress:
      requiredPercentageSchema,

    constructionStatus: z.enum([
      "not_started",
      "in_progress",
      "paused",
      "completed",
    ]),

    sourceName: z
      .string()
      .trim()
      .max(
        150,
        "A fonte pode ter no máximo 150 caracteres.",
      ),

    notes: z
      .string()
      .trim()
      .max(
        1000,
        "A observação pode ter no máximo 1.000 caracteres.",
      ),
  });

interface ConstructionStageRow {
  id: string;
}

export async function saveConstructionUpdate(
  _previousState: ConstructionUpdateActionState,
  formData: FormData,
): Promise<ConstructionUpdateActionState> {
  const validation =
    constructionUpdateSchema.safeParse({
      apartmentId:
        formData.get("apartmentId"),

      referenceMonth:
        formData.get("referenceMonth"),

      overallProgress:
        formData.get("overallProgress"),

      constructionStatus:
        formData.get(
          "constructionStatus",
        ),

      sourceName:
        formData.get("sourceName") ?? "",

      notes:
        formData.get("notes") ?? "",
    });

  if (!validation.success) {
    const errors =
      validation.error.flatten()
        .fieldErrors;

    return {
      status: "error",
      message:
        "Revise os campos indicados antes de continuar.",

      fieldErrors: {
        referenceMonth:
          errors.referenceMonth,

        overallProgress:
          errors.overallProgress,

        constructionStatus:
          errors.constructionStatus,

        sourceName:
          errors.sourceName,

        notes:
          errors.notes,
      },
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente no sistema.",
    };
  }

  const {
    data: stages,
    error: stagesError,
  } = await supabase
    .from("construction_stages")
    .select("id")
    .eq(
      "apartment_id",
      validation.data.apartmentId,
    )
    .eq("active", true)
    .order("sort_order", {
      ascending: true,
    });

  if (stagesError) {
    console.error(
      "Erro ao consultar etapas:",
      stagesError,
    );

    return {
      status: "error",
      message:
        "Não foi possível consultar as etapas da obra.",
    };
  }

  if (!stages?.length) {
    return {
      status: "error",
      message:
        "Nenhuma etapa ativa foi encontrada.",
    };
  }

  const stageErrors: Record<
    string,
    string[]
  > = {};

  const stageProgress = (
    stages as ConstructionStageRow[]
  ).map((stage) => {
    const result =
      requiredPercentageSchema.safeParse(
        formData.get(
          `stage-${stage.id}`,
        ),
      );

    if (!result.success) {
      stageErrors[stage.id] =
        result.error.issues.map(
          (issue) => issue.message,
        );

      return {
        stage_id: stage.id,
        progress: 0,
      };
    }

    return {
      stage_id: stage.id,
      progress: result.data,
    };
  });

  if (
    Object.keys(stageErrors).length > 0
  ) {
    return {
      status: "error",
      message:
        "Revise os percentuais das etapas.",

      fieldErrors: {
        stages: stageErrors,
      },
    };
  }

  const { error } = await supabase.rpc(
    "save_construction_update",
    {
      p_apartment_id:
        validation.data.apartmentId,

      p_reference_month:
        `${validation.data.referenceMonth}-01`,

      p_overall_progress:
        validation.data.overallProgress,

      p_status:
        validation.data
          .constructionStatus,

      p_source_name:
        validation.data.sourceName,

      p_notes:
        validation.data.notes,

      p_stage_progress:
        stageProgress,
    },
  );

  if (error) {
    console.error(
      "Erro ao salvar evolução da obra:",
      error,
    );

    return {
      status: "error",
      message:
        "Não foi possível salvar a evolução da obra.",
    };
  }

  revalidatePath("/obra");

  return {
    status: "success",
    message:
      "Evolução da obra salva com sucesso.",
  };
}