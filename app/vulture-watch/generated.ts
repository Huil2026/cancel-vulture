import type { EditorialState } from "./types";

export const editorialState: EditorialState = {
  "lastRun": null,
  "status": "awaiting_first_run",
  "generated": 0,
  "approved": 0,
  "rejected": 0,
  "selectedSlug": null,
  "drafts": [],
  "errors": [],
  "articles": [],
  "documents": []
};
