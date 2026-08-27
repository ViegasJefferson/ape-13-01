import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QueryError {
  message: string;
}

interface QueryResponse {
  error: QueryError | null;
}

function assertQuery(label: string, response: QueryResponse) {
  if (response.error) {
    throw new Error(`${label}: ${response.error.message}`);
  }
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function createBackupTimestamp() {
  return new Date()
    .toISOString()
    .replace("T", "-")
    .replace(/:/g, "-")
    .slice(0, 16);
}

export async function GET() {
  const supabase = await createClient();

  try {
    // =====================================================
    // AUTENTICAÇÃO
    // =====================================================

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return Response.json(
        {
          status: "error",
          message: "Sua sessão expirou. Entre novamente.",
        },
        {
          status: 401,
        },
      );
    }

    // =====================================================
    // APARTAMENTO
    //
    // RLS garante que o usuário só consiga acessar
    // apartamentos dos quais seja membro.
    // =====================================================

    const apartmentResponse = await supabase
      .from("apartments")
      .select("*")
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    assertQuery("Apartamento", apartmentResponse);

    const apartment = apartmentResponse.data;

    if (!apartment) {
      return Response.json(
        {
          status: "error",
          message: "Nenhum apartamento disponível para backup.",
        },
        {
          status: 404,
        },
      );
    }

    const apartmentId = apartment.id;

    // =====================================================
    // DADOS VINCULADOS DIRETAMENTE AO APARTAMENTO
    // =====================================================

    const [
      expenseCategoriesResponse,
      expenseSeriesResponse,
      expensesResponse,

      financingContractsResponse,

      constructionStagesResponse,
      constructionUpdatesResponse,
      constructionMediaResponse,

      documentsResponse,

      renovationResponse,
      householdResponse,

      galleryMediaResponse,

      remindersResponse,
    ] = await Promise.all([
      supabase
        .from("expense_categories")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("expense_series")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase.from("expenses").select("*").eq("apartment_id", apartmentId),

      supabase
        .from("financing_contracts")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("construction_stages")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("construction_updates")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("construction_media")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("apartment_documents")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("renovation_items")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("household_items")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("apartment_reminders")
        .select("*")
        .eq("apartment_id", apartmentId),

      supabase
        .from("apartment_media")
        .select("*")
        .eq("apartment_id", apartmentId),
    ]);

    assertQuery("Categorias de gastos", expenseCategoriesResponse);

    assertQuery("Séries de gastos", expenseSeriesResponse);

    assertQuery("Gastos", expensesResponse);

    assertQuery("Contratos de financiamento", financingContractsResponse);

    assertQuery("Etapas da obra", constructionStagesResponse);

    assertQuery("Atualizações da obra", constructionUpdatesResponse);

    assertQuery("Mídias da obra", constructionMediaResponse);

    assertQuery("Documentos", documentsResponse);

    assertQuery("Reforma", renovationResponse);

    assertQuery("Enxoval", householdResponse);

    assertQuery("Agenda", remindersResponse);

    assertQuery("Galeria", galleryMediaResponse);

    // =====================================================
    // FINANCIAMENTO
    // =====================================================

    const financingContracts = financingContractsResponse.data ?? [];

    const contractIds = financingContracts.map((contract) => contract.id);

    let financingPayments: unknown[] = [];

    let extraAmortizations: unknown[] = [];

    if (contractIds.length > 0) {
      const [paymentsResponse, amortizationsResponse] = await Promise.all([
        supabase
          .from("financing_payments")
          .select("*")
          .in("contract_id", contractIds),

        supabase
          .from("extra_amortizations")
          .select("*")
          .in("contract_id", contractIds),
      ]);

      assertQuery("Parcelas do financiamento", paymentsResponse);

      assertQuery("Amortizações", amortizationsResponse);

      financingPayments = paymentsResponse.data ?? [];

      extraAmortizations = amortizationsResponse.data ?? [];
    }

    // =====================================================
    // PROGRESSO DETALHADO DA OBRA
    // =====================================================

    const constructionUpdates = constructionUpdatesResponse.data ?? [];

    const updateIds = constructionUpdates.map((update) => update.id);

    let constructionStageProgress: unknown[] = [];

    if (updateIds.length > 0) {
      const progressResponse = await supabase
        .from("construction_stage_progress")
        .select("*")
        .in("construction_update_id", updateIds);

      assertQuery("Progresso das etapas da obra", progressResponse);

      constructionStageProgress = progressResponse.data ?? [];
    }

    // =====================================================
    // ORGANIZA OS DADOS
    // =====================================================

    const expenseCategories = expenseCategoriesResponse.data ?? [];

    const expenseSeries = expenseSeriesResponse.data ?? [];

    const expenses = expensesResponse.data ?? [];

    const constructionStages = constructionStagesResponse.data ?? [];

    const constructionMedia = constructionMediaResponse.data ?? [];

    const documents = documentsResponse.data ?? [];

    const renovationItems = renovationResponse.data ?? [];

    const householdItems = householdResponse.data ?? [];

    const reminders = remindersResponse.data ?? [];

    // =====================================================

    const galleryMedia =galleryMediaResponse.data ?? [];

    // =====================================================
    // MANIFESTO DO BACKUP
    // =====================================================

    const createdAt = new Date().toISOString();

    const backup = {
      manifest: {
        format: "ape-13-01-backup",

        version: 1,

        createdAt,

        apartmentId,

        apartmentName: apartment.name,

        storage: {
          physicalFilesIncluded: false,

          metadataIncluded: true,

          explanation:
            "Imagens e documentos físicos permanecem no Supabase Storage. O backup contém bucket, caminho e metadados dos arquivos.",
        },

        authentication: {
          usersIncluded: false,
          credentialsIncluded: false,
        },

        counts: {
          apartments: 1,

          expenseCategories: expenseCategories.length,

          expenseSeries: expenseSeries.length,

          expenses: expenses.length,

          financingContracts: financingContracts.length,

          financingPayments: financingPayments.length,

          extraAmortizations: extraAmortizations.length,

          constructionStages: constructionStages.length,

          constructionUpdates: constructionUpdates.length,

          constructionStageProgress: constructionStageProgress.length,

          constructionMedia: constructionMedia.length,

          apartmentDocuments: documents.length,

          renovationItems: renovationItems.length,

          householdItems: householdItems.length,

          reminders: reminders.length,

          apartmentMedia: galleryMedia.length,
        },
      },

      apartment,

      data: {
        expenses: {
          categories: expenseCategories,

          series: expenseSeries,

          items: expenses,
        },

        financing: {
          contracts: financingContracts,

          payments: financingPayments,

          extraAmortizations,
        },

        construction: {
          stages: constructionStages,

          updates: constructionUpdates,

          stageProgress: constructionStageProgress,

          media: constructionMedia,
        },

        documents: {
          items: documents,
        },

        renovation: {
          items: renovationItems,
        },

        household: {
          items: householdItems,
        },

        agenda: {
          reminders,
        },

        gallery: {
        media:
            galleryMedia,
        },
      },
    };

    // =====================================================
    // ARQUIVO
    // =====================================================

    const apartmentName =
      sanitizeFilename(apartment.name || "ape-13-01") || "ape-13-01";

    const filename = `${apartmentName}-backup-${createBackupTimestamp()}.json`;

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,

      headers: {
        "Content-Type": "application/json; charset=utf-8",

        "Content-Disposition": `attachment; filename="${filename}"`,

        "Cache-Control": "no-store",

        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar backup:", error);

    return Response.json(
      {
        status: "error",

        message: "Não foi possível gerar o backup do apartamento.",
      },
      {
        status: 500,
      },
    );
  }
}
