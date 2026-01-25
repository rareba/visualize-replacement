import { Trans } from "@lingui/macro";
import { Link } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { ReactElement, useMemo, useState } from "react";

import { HintError } from "@/components/hint";
import { Icon } from "@/icons";

const flashes = {
  CANNOT_FIND_CUBE: "CANNOT_FIND_CUBE",
} as const;

/**
 * Validates and sanitizes error options parsed from query params.
 * Prevents potential security issues from untrusted input.
 */
interface CubeErrorOptions {
  endpointUrl: string;
  iri: string;
}

const isValidUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    // Only allow https URLs to known SPARQL endpoints
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidIri = (iri: string | undefined): boolean => {
  if (!iri || typeof iri !== "string") return false;
  // IRIs should be valid URIs
  try {
    new URL(iri);
    return true;
  } catch {
    return false;
  }
};

const parseAndValidateErrorOptions = (
  rawOptions: string | string[] | undefined
): CubeErrorOptions | null => {
  if (!rawOptions || Array.isArray(rawOptions)) return null;

  try {
    const parsed = JSON.parse(rawOptions);

    // Validate required fields
    if (typeof parsed !== "object" || parsed === null) return null;

    const { endpointUrl, iri } = parsed;

    // Validate both fields are present and valid
    if (!isValidUrl(endpointUrl) || !isValidIri(iri)) {
      console.warn("[Flashes] Invalid error options:", { endpointUrl, iri });
      return null;
    }

    return { endpointUrl, iri };
  } catch (e) {
    console.warn("[Flashes] Failed to parse error options:", e);
    return null;
  }
};

export const getErrorQueryParams = (
  errorId: keyof typeof flashes,
  options: any
) => {
  return `errorId=${errorId}&errorOptions=${encodeURIComponent(
    JSON.stringify(options)
  )}`;
};

const CannotFindCubeContent = () => {
  const { query } = useRouter();
  const errorOptions = useMemo(
    () => parseAndValidateErrorOptions(query?.errorOptions),
    [query?.errorOptions]
  );

  // If error options are invalid, show a simplified message
  if (!errorOptions) {
    return (
      <Trans id="flashes.couldnt-load-cube.title">Could not load cube</Trans>
    );
  }

  // Construct validated URL to cube validator
  const cubeValidatorUrl = `https://cube-validator.lindas.admin.ch/validate/${encodeURIComponent(errorOptions.endpointUrl)}/${encodeURIComponent(errorOptions.iri)}?profile=https:%2F%2Fcube.link%2Fref%2Fmain%2Fshape%2Fprofile-visualize`;

  return (
    <>
      <Trans id="flashes.couldnt-load-cube.title">Could not load cube</Trans>
      <Link
        href={cubeValidatorUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Trans id="flashes.couldnt-load-cube.view-cube-checker">
          View in Cube Validator
        </Trans>{" "}
        <Icon name="arrowRight" size={16} />
      </Link>
    </>
  );
};

const renderErrorContent: Record<keyof typeof flashes, () => ReactElement> = {
  CANNOT_FIND_CUBE: CannotFindCubeContent,
};

export const Flashes = () => {
  const router = useRouter();
  const query = router.query;
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const errorId = query.errorId as keyof typeof flashes;
  const ErrorComponent = renderErrorContent[errorId];

  return (
    <AnimatePresence>
      {errorId && !dismissed[errorId] ? (
        <motion.div
          initial={{ opacity: 0, y: "1rem" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "1rem" }}
          style={{
            zIndex: 1,
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
          }}
        >
          <HintError
            smaller
            onClose={() =>
              setDismissed((dismissed) => ({
                ...dismissed,
                [errorId]: true,
              }))
            }
            sx={{ px: 4, py: 1, backgroundColor: "red", boxShadow: 2 }}
          >
            <ErrorComponent />
          </HintError>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
