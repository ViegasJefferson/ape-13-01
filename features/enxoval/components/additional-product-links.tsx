"use client";

import {
  useState,
} from "react";

import {
  Minus,
  Plus,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/Button";

import {
  Input,
} from "@/components/ui/Input";

import {
  Label,
} from "@/components/ui/label";

interface AdditionalProductLinksProps {
  defaultUrls?: string[];
}

export function AdditionalProductLinks({
  defaultUrls = [],
}: AdditionalProductLinksProps) {
  const [
    urls,
    setUrls,
  ] = useState<string[]>(
    defaultUrls.length > 0
      ? defaultUrls
      : [],
  );

  function addUrl() {
    if (
      urls.length >= 10
    ) {
      return;
    }

    setUrls(
      (current) => [
        ...current,
        "",
      ],
    );
  }

  function updateUrl(
    index: number,
    value: string,
  ) {
    setUrls(
      (current) =>
        current.map(
          (
            url,
            currentIndex,
          ) =>
            currentIndex ===
            index
              ? value
              : url,
        ),
    );
  }

  function removeUrl(
    index: number,
  ) {
    setUrls(
      (current) =>
        current.filter(
          (
            _,
            currentIndex,
          ) =>
            currentIndex !==
            index,
        ),
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>
            Links adicionais
          </Label>

          <p className="mt-1 text-xs text-slate-500">
            Adicione outros anúncios
            ou lojas para o mesmo produto.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUrl}
          disabled={
            urls.length >= 10
          }
        >
          <Plus className="size-4" />

          Adicionar link
        </Button>
      </div>

      {urls.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-slate-500">
          Nenhum link adicional.
        </div>
      ) : (
        <div className="space-y-2">
          {urls.map(
            (
              url,
              index,
            ) => (
              <div
                key={index}
                className="flex items-center gap-2"
              >
                <Input
                  name= "additionalProductUrl"
                  type="url"
                  value={url}
                  onChange={(
                    event,
                  ) =>
                    updateUrl(
                      index,
                      event
                        .target
                        .value,
                    )
                  }
                  maxLength={1000}
                  placeholder={`Link ${index + 2}`}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover link ${index + 2}`}
                  onClick={() =>
                    removeUrl(
                      index,
                    )
                  }
                >
                  <Minus className="size-4 text-red-700" />
                </Button>
              </div>
            ),
          )}
        </div>
      )}

      {urls.length > 0 && (
        <p className="text-xs text-slate-500">
          {urls.length} de 10 links adicionais.
        </p>
      )}
    </div>
  );
}